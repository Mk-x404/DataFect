import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  if (isUser) {
    return <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{content}</div>;
  }

  // Pre-process content: normalize nested markdown artifacts like **`col`** -> `col`
  const sanitized = content
    .replace(/\*\*\`([^\`]+)\`\*\*/g, '`$1`')
    .replace(/\`\*\*([^\*]+)\*\*\`/g, '`$1`')
    .replace(/\$([^\$]+)\$/g, '$1');

  // Split into blocks: code blocks vs text blocks
  const blocks: Array<{ type: 'code' | 'text'; content: string; lang?: string }> = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(sanitized)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: sanitized.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: 'code',
      lang: match[1] || 'python',
      content: match[2].trimEnd()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < sanitized.length) {
    blocks.push({ type: 'text', content: sanitized.slice(lastIndex) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.6, fontSize: '13px' }}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return <CodeBlock key={bIdx} code={block.content} lang={block.lang || 'code'} />;
        }
        return <TextBlock key={bIdx} text={block.content} />;
      })}
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div style={{
      margin: '8px 0',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid var(--color-hairline-strong)',
      backgroundColor: '#0f172a',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '11px',
        color: '#94a3b8',
        fontFamily: 'var(--font-mono, monospace)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={12} style={{ color: '#38bdf8' }} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{lang}</span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: copied ? '#34d399' : '#94a3b8',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'all 0.15s ease'
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '12px 14px',
        overflowX: 'auto',
        fontSize: '12px',
        fontFamily: 'var(--font-mono, monospace)',
        color: '#e2e8f0',
        lineHeight: 1.5
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} style={{ margin: '4px 0 8px 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushList();
      elements.push(
        <hr key={`hr-${idx}`} style={{ border: 'none', borderTop: '1px solid var(--color-hairline)', margin: '10px 0' }} />
      );
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${idx}`} style={{ margin: '10px 0 4px 0', fontSize: '13.5px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} style={{ margin: '12px 0 6px 0', fontSize: '14.5px', fontWeight: 700, color: 'var(--color-ink)' }}>
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${idx}`} style={{ margin: '14px 0 8px 0', fontSize: '16px', fontWeight: 800, color: 'var(--color-ink)' }}>
          {renderInline(trimmed.replace(/^#\s+/, ''))}
        </h2>
      );
      return;
    }

    // List item (starts with * or - or digit.)
    const listMatch = trimmed.match(/^(\*|-|\d+\.)\s+(.*)$/);
    if (listMatch) {
      currentList.push(
        <li key={`li-${idx}`} style={{ color: 'var(--color-ink)' }}>
          {renderInline(listMatch[2])}
        </li>
      );
      return;
    }

    // Standard paragraph line
    flushList();
    elements.push(
      <p key={`p-${idx}`} style={{ margin: '4px 0', color: 'var(--color-ink)' }}>
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Tokenize bold, inline code, and text
  const tokens: React.ReactNode[] = [];
  // Regex matches: `code` or **bold** or *italic*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      const codeContent = token.slice(1, -1);
      tokens.push(
        <code
          key={match.index}
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11.5px',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-brand-lake-deep)',
            border: '1px solid var(--color-hairline)',
            padding: '1px 5px',
            borderRadius: '4px',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          {codeContent}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      const boldContent = token.slice(2, -2);
      tokens.push(
        <strong key={match.index} style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
          {renderInline(boldContent)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      const italicContent = token.slice(1, -1);
      tokens.push(
        <em key={match.index} style={{ fontStyle: 'italic' }}>
          {italicContent}
        </em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}
