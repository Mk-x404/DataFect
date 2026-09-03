import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ai';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  children,
  style,
  disabled,
  className = '',
  ...props
}, ref) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-ink)',
          color: 'var(--color-ink-inverse)',
          border: '1px solid var(--color-ink)',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-hairline)',
          boxShadow: 'var(--shadow-subtle)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-hairline-strong)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-ink-secondary)',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-critical-subtle)',
          color: 'var(--color-critical-text)',
          border: '1px solid var(--color-critical-border)',
        };
      case 'ai':
        return {
          backgroundColor: 'var(--color-ai)',
          color: '#FFFFFF',
          border: '1px solid var(--color-ai)',
          boxShadow: '0 2px 8px rgba(142, 78, 198, 0.25)',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: '12px',
          gap: '6px',
          borderRadius: 'var(--radius-sm)',
        };
      case 'lg':
        return {
          padding: '12px 24px',
          fontSize: '15px',
          gap: '10px',
          borderRadius: 'var(--radius-md)',
        };
      case 'md':
      default:
        return {
          padding: '8px 16px',
          fontSize: '13px',
          gap: '8px',
          borderRadius: 'var(--radius-sm)',
        };
    }
  };

  return (
    <motion.button
      ref={ref}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        transition: 'background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast)',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      className={`btn-interactive ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      ) : (
        icon && iconPosition === 'left' && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
        )
      )}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';
