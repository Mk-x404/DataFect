import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'flat' | 'elevated' | 'inset';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Card({
  variant = 'flat',
  interactive = false,
  padding = 'md',
  children,
  style,
  className = '',
  ...props
}: CardProps) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-hairline)',
          boxShadow: 'var(--shadow-card)',
        };
      case 'inset':
        return {
          backgroundColor: 'var(--color-surface-subtle)',
          border: '1px solid var(--color-hairline-subtle)',
          boxShadow: 'none',
        };
      case 'flat':
      default:
        return {
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-hairline)',
          boxShadow: 'var(--shadow-subtle)',
        };
    }
  };

  const getPadding = (): string => {
    switch (padding) {
      case 'none':
        return '0';
      case 'sm':
        return 'var(--space-3)';
      case 'lg':
        return 'var(--space-6)';
      case 'md':
      default:
        return 'var(--space-5)';
    }
  };

  return (
    <div
      className={`card-base ${interactive ? 'card-interactive' : ''} ${className}`}
      style={{
        borderRadius: 'var(--radius-cards)',
        padding: getPadding(),
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast)',
        ...getVariantStyles(),
        ...(interactive
          ? {
              cursor: 'pointer',
            }
          : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Compound Component Slots ──
export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

Card.Header = function CardHeader({ title, subtitle, action, children, style, className = '', ...props }: CardHeaderProps) {
  return (
    <div
      className={`card-header ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--color-hairline-subtle)',
        ...style,
      }}
      {...props}
    >
      {children || (
        <>
          <div>
            {title && (typeof title === 'string' ? <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>{title}</h3> : title)}
            {subtitle && (typeof subtitle === 'string' ? <p style={{ fontSize: '12px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>{subtitle}</p> : subtitle)}
          </div>
          {action && <div>{action}</div>}
        </>
      )}
    </div>
  );
};

Card.Body = function CardBody({ children, style, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-body ${className}`} style={{ flex: 1, paddingTop: '10px', ...style }} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, style, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`card-footer ${className}`}
      style={{
        paddingTop: '12px',
        borderTop: '1px solid var(--color-hairline-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--color-ink-muted)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

