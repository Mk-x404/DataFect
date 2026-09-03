import { Database, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

export interface GlobalHeaderProps {
  onReset: () => void;
  showResetButton?: boolean;
}

export function GlobalHeader({ onReset, showResetButton = false }: GlobalHeaderProps) {
  return (
    <header
      style={{
        height: '56px',
        borderBottom: '1px solid var(--color-hairline)',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-header)',
      }}
    >
      {/* Brand Identity / Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={onReset}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-ink)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Database size={17} />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="header-brand-title">
            DataFect
          </span>
          <span className="header-developer-badge">
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-brand-lake)' }} />
            <span className="header-developer-text-full">Developed by </span>
            <strong style={{ color: 'var(--color-brand-lake-deep)', fontWeight: 700 }}>Muhib</strong>
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a
          href="https://github.com/Mk-x404"
          target="_blank"
          rel="noopener noreferrer"
          title="Muhib's GitHub"
          className="header-actions-social"
          style={{
            color: 'var(--color-ink-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '7px',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-ink)';
            e.currentTarget.style.backgroundColor = 'var(--color-hairline)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-ink-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </a>

        <a
          href="https://www.linkedin.com/in/muhib-k73/"
          target="_blank"
          rel="noopener noreferrer"
          title="Muhib's LinkedIn"
          className="header-actions-social"
          style={{
            color: 'var(--color-ink-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '7px',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0077b5';
            e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-ink-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" height="12" x="2" y="9" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        </a>

        {showResetButton && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            icon={<ArrowLeft size={14} />}
          >
            <span className="header-reset-text-full">Load Another File</span>
            <span className="header-reset-text-short">New File</span>
          </Button>
        )}
      </div>
    </header>
  );
}
