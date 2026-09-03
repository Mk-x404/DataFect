import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Card } from '../ui/Card';
import { Badge, type BadgeVariant } from '../ui/Badge';

export interface StatCardProps {
  title: string;
  value?: string | number;
  numericValue?: number;
  unit?: string;
  icon?: ReactNode;
  description?: string;
  badge?: {
    text: string;
    variant: BadgeVariant;
  };
  variant?: 'flat' | 'elevated' | 'inset';
  interactive?: boolean;
  animate?: boolean;
}

export function StatCard({
  title,
  value,
  numericValue,
  unit,
  icon,
  description,
  badge,
  variant = 'flat',
  interactive = true,
  animate = true,
}: StatCardProps) {
  const numRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!animate || numericValue === undefined || numericValue === null || isNaN(numericValue) || !numRef.current) return;

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (numRef.current) numRef.current.innerText = Number(numericValue).toLocaleString();
      return;
    }

    const targetNum = Number(numericValue);
    const obj = { val: 0 };
    gsap.to(obj, {
      val: targetNum,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => {
        if (numRef.current) {
          numRef.current.innerText = Math.round(obj.val).toLocaleString();
        }
      },
    });
  }, { scope: containerRef, dependencies: [numericValue] });

  const displayString = 
    numericValue !== undefined && numericValue !== null && !isNaN(numericValue)
      ? Number(numericValue).toLocaleString()
      : value !== undefined && value !== null
      ? String(value)
      : '—';

  const handleCardClick = () => {
    if (numericValue === undefined || numericValue === null || isNaN(numericValue) || !numRef.current) return;
    const targetNum = Number(numericValue);
    const obj = { val: Math.max(0, Math.floor(targetNum * 0.7)) };
    gsap.to(obj, {
      val: targetNum,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (numRef.current) {
          numRef.current.innerText = Math.round(obj.val).toLocaleString();
        }
      },
    });
  };

  return (
    <div
      ref={containerRef}
      className="stat-card-container"
      onClick={handleCardClick}
      title="Click to recalculate metric"
    >
      <Card
        variant={variant}
        interactive={interactive}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          gap: '10px',
          padding: '18px 20px',
        }}
      >
        {/* Card Header: Title + Icon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--color-ink-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {title}
          </span>
          {icon && (
            <div
              className="stat-card-icon"
              style={{
                color: 'var(--color-ink-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-surface-subtle)',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Card Main: Number / Value + Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            margin: '2px 0',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '3px' }}>
            <span
              className="tabular stat-card-value"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-ink)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span ref={numRef}>{displayString}</span>
            </span>
            {unit && (
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-ink-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {unit}
              </span>
            )}
          </div>

          {badge && (
            <Badge
              variant={badge.variant}
              size="sm"
              style={{
                alignSelf: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}
            >
              {badge.text}
            </Badge>
          )}
        </div>

        {/* Card Footer: Description */}
        {description && (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-ink-muted)',
              lineHeight: 1.35,
              marginTop: '2px',
            }}
          >
            {description}
          </span>
        )}
      </Card>
    </div>
  );
}
