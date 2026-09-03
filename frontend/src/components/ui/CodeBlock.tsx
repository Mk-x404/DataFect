import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  maxHeight?: string;
}

export function CodeBlock({
  code,
  language = 'python',
  title,
  maxHeight = '280px',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--color-hairline-strong)',
        backgroundColor: '#121314',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Code Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          backgroundColor: '#1C1D1F',
          borderBottom: '1px solid #28292C',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={12} style={{ color: '#8E9094' }} />
          <span
            className="mono-label"
            style={{
              color: '#B0B2B6',
              fontSize: '10px',
              letterSpacing: '0.06em',
            }}
          >
            {title || language.toUpperCase()}
          </span>
        </div>

        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: copied ? 'rgba(48, 164, 108, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            color: copied ? '#46A758' : '#C5C7CA',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            border: 'none',
          }}
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={11} style={{ color: '#46A758' }} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre
        style={{
          padding: '12px 16px',
          margin: 0,
          maxHeight,
          overflowX: 'auto',
          overflowY: 'auto',
          backgroundColor: '#121314',
          color: '#E6EDF3',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: 1.55,
          border: 'none',
          borderRadius: 0,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
