import type { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
  borderRadius?: string;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  variant = 'rectangular',
  borderRadius,
  style,
  className = '',
  ...props
}: SkeletonProps) {
  const getRadius = () => {
    if (borderRadius) return borderRadius;
    if (variant === 'circular') return '50%';
    if (variant === 'text') return 'var(--radius-xs)';
    return 'var(--radius-sm)';
  };

  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius: getRadius(),
        backgroundColor: 'var(--color-surface-hover)',
        border: '1px solid var(--color-hairline-subtle)',
        ...style,
      }}
      {...props}
    />
  );
}
