import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  MessageSquare, 
  Database
} from 'lucide-react';
import type { UploadResponse } from '../../types';
import { useChat } from '../../hooks/useChat';
import { Card } from '../ui/Card';
import { QualityRing } from '../data/QualityRing';
import { MarkdownMessage } from '../ui/MarkdownMessage';

interface DataAssistantProps {
  data: UploadResponse;
}

export function DataAssistant({ data }: DataAssistantProps) {
  const { 
    messages, 
    isLoading, 
    isTyping, 
    recommendedQuestions, 
    sendPrompt, 
    clearChat 
  } = useChat(data);

  const [inputText, setInputText] = useState('');
  const [loadingStage, setLoadingStage] = useState(0);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const loadingStages = [
    'Consulting dataset schema & distribution profiles…',
    'Cross-referencing feature correlations & outliers…',
    'Synthesizing grounded analytical response…'
  ];

  useEffect(() => {
    if (!isLoading) {
      setLoadingStage(0);
      return;
    }
    const timer1 = setTimeout(() => setLoadingStage(1), 2200);
    const timer2 = setTimeout(() => setLoadingStage(2), 5500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isLoading]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, loadingStage]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendPrompt(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="inspector-grid" style={{ height: '660px' }}>
      {/* Left Panel: Grounded Context Sidebar */}
      <Card
        variant="flat"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={15} style={{ color: 'var(--color-ai)' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Dataset Context
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
              Assistant is grounded in verified numerical statistics.
            </p>
          </div>

          {/* Mini File Telemetry */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-ink-muted)' }}>Dataset:</span>
              <strong style={{ color: 'var(--color-ink)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.metadata.filename}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-ink-muted)' }}>Rows:</span>
              <span className="tabular font-mono" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
                {data.metadata.row_count.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-ink-muted)' }}>Columns:</span>
              <span className="tabular font-mono" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
                {data.metadata.column_count}
              </span>
            </div>
          </div>

          {/* Mini Health Score */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Data Health
              </span>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)', marginTop: '2px' }}>
                {data.quality.score_label}
              </div>
            </div>
            <QualityRing score={data.quality.overall_score} size={48} strokeWidth={5} showLabel={false} />
          </div>

          {/* Key profiled columns */}
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Profiled Dimensions
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
              {data.column_profiles.slice(0, 6).map((col) => (
                <span
                  key={col.name}
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'var(--color-surface-subtle)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--color-ink-secondary)',
                  }}
                >
                  {col.name}
                </span>
              ))}
              {data.column_profiles.length > 6 && (
                <span style={{ fontSize: '10px', color: 'var(--color-ink-muted)', alignSelf: 'center' }}>
                  +{data.column_profiles.length - 6} more
                </span>
              )}
            </div>
          </div>
        </div>

      </Card>

      {/* Right Panel: Chat Conversation Portal */}
      <Card
        variant="flat"
        style={{
          padding: '20px',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gap: '14px',
          height: '100%',
          minWidth: 0,
        }}
      >
        {/* Chat Portal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--color-hairline)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} style={{ color: 'var(--color-ai)' }} />
            <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>
              Data Analysis Assistant
            </strong>
          </div>

          <button
            onClick={clearChat}
            disabled={messages.length <= 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: messages.length <= 1 ? 'var(--color-ink-muted)' : 'var(--color-critical-text)',
              cursor: messages.length <= 1 ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              padding: '4px 8px',
              borderRadius: 'var(--radius-xs)',
              transition: 'all var(--transition-fast)',
            }}
            title="Clear conversation history"
          >
            <Trash2 size={13} />
            <span>Reset Chat</span>
          </button>
        </div>

        {/* Message Log Panel */}
        <div
          style={{
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            paddingRight: '6px',
          }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    maxWidth: '86%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isUser ? 'var(--color-ink)' : 'var(--color-surface-subtle)',
                    color: isUser ? 'var(--color-ink-inverse)' : 'var(--color-ink)',
                    fontSize: '13px',
                    borderLeft: !isUser ? '3px solid var(--color-ai)' : 'none',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                >
                  <MarkdownMessage content={msg.content} isUser={isUser} />
                </div>
              </div>
            );
          })}

          {/* Loading Bubble */}
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderLeft: '3px solid var(--color-ai)',
                  color: 'var(--color-ink-muted)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid var(--color-ai)',
                    borderRightColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span style={{ transition: 'opacity 0.2s ease' }}>
                  {loadingStages[loadingStage]}
                </span>
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Footer: Follow-up chips + Input prompt bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--color-hairline)', paddingTop: '12px', minWidth: 0 }}>
          {/* Recommendation Chips */}
          {recommendedQuestions.length > 0 && !isLoading && !isTyping && (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
              {recommendedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendPrompt(q)}
                  disabled={isLoading || isTyping}
                  style={{
                    backgroundColor: 'var(--color-surface-subtle)',
                    color: 'var(--color-ink-secondary)',
                    border: '1px solid var(--color-hairline)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-ai)';
                    e.currentTarget.style.color = 'var(--color-ai-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-hairline)';
                    e.currentTarget.style.color = 'var(--color-ink-secondary)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Text Input Container */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isLoading || isTyping
                  ? 'Analyzing…'
                  : `Ask about ${data.metadata.filename} correlations, anomalies, missing patterns…`
              }
              disabled={isLoading || isTyping}
              rows={1}
              style={{
                flexGrow: 1,
                padding: '10px 42px 10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-hairline-strong)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-ink)',
                outline: 'none',
                resize: 'none',
                fontSize: '13px',
                lineHeight: 1.4,
                fontFamily: 'var(--font-sans)',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-ink)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-hairline-strong)')}
            />

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading || isTyping}
              style={{
                position: 'absolute',
                right: '6px',
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: inputText.trim() && !isLoading && !isTyping ? 'var(--color-ink)' : 'var(--color-surface-hover)',
                color: inputText.trim() && !isLoading && !isTyping ? '#FFFFFF' : 'var(--color-ink-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputText.trim() && !isLoading && !isTyping ? 'pointer' : 'default',
                transition: 'all var(--transition-fast)',
              }}
              title="Send Prompt"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
