import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'critical' | 'warning' | 'info' | 'success' | 'ai' | 'lake' | 'neutral';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  icon?: ReactNode;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  icon,
  style,
  className = '',
  ...props
}: BadgeProps) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'critical':
        return {
          backgroundColor: 'var(--color-critical-subtle)',
          color: 'var(--color-critical-text)',
          borderColor: 'var(--color-critical-border)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-warning-subtle)',
          color: 'var(--color-warning-text)',
          borderColor: 'var(--color-warning-border)',
        };
      case 'info':
        return {
          backgroundColor: 'var(--color-info-subtle)',
          color: 'var(--color-info-text)',
          borderColor: 'var(--color-info-border)',
        };
      case 'lake':
        return {
          backgroundColor: 'var(--color-brand-lake-subtle)',
          color: 'var(--color-brand-lake-deep)',
          borderColor: 'var(--color-brand-lake-border)',
        };
      case 'success':
        return {
          backgroundColor: 'var(--color-success-subtle)',
          color: 'var(--color-success-text)',
          borderColor: 'var(--color-success-border)',
        };
      case 'ai':
        return {
          backgroundColor: 'var(--color-ai-subtle)',
          color: 'var(--color-ai-text)',
          borderColor: 'var(--color-ai-border)',
        };
      case 'neutral':
      default:
        return {
          backgroundColor: 'var(--color-surface-subtle)',
          color: 'var(--color-ink-secondary)',
          borderColor: 'var(--color-hairline)',
        };
    }
  };

  const sizeStyles: React.CSSProperties =
    size === 'sm'
      ? {
          padding: '2px 7px',
          fontSize: '11px',
          gap: '3px',
        }
      : {
          padding: '3px 10px',
          fontSize: '12px',
          gap: '4px',
        };

  return (
    <span
      className={`mono-label ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid',
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: '0.04em',
        transition: 'background-color var(--transition-fast), color var(--transition-fast)',
        ...getVariantStyles(),
        ...sizeStyles,
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
}
