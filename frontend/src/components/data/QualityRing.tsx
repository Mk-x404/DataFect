import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export interface QualityRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animate?: boolean;
}

export function QualityRing({
  score,
  size = 80,
  strokeWidth = 7,
  showLabel = true,
  animate = true,
}: QualityRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const targetOffset = circumference - (clampedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'var(--color-success)';
    if (s >= 50) return 'var(--color-warning)';
    return 'var(--color-critical)';
  };

  const getSubtleColor = (s: number) => {
    if (s >= 80) return 'var(--color-success-subtle)';
    if (s >= 50) return 'var(--color-warning-subtle)';
    return 'var(--color-critical-subtle)';
  };

  const color = getColor(clampedScore);
  const trackColor = getSubtleColor(clampedScore);

  useGSAP(() => {
    if (!animate || !circleRef.current) return;

    // Check system reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(circleRef.current, { strokeDashoffset: targetOffset });
      if (textRef.current) textRef.current.innerText = `${Math.round(clampedScore)}`;
      return;
    }

    // Set initial dash offset to empty
    gsap.set(circleRef.current, { strokeDashoffset: circumference });

    const obj = { val: 0 };
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.to(circleRef.current, {
      strokeDashoffset: targetOffset,
      duration: 1.1,
    }, 0);

    if (textRef.current) {
      tl.to(obj, {
        val: clampedScore,
        duration: 1.1,
        onUpdate: () => {
          if (textRef.current) {
            textRef.current.innerText = `${Math.round(obj.val)}`;
          }
        },
      }, 0);
    }
  }, { scope: containerRef, dependencies: [clampedScore, targetOffset] });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
      >
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Animated Active Score Circle */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : targetOffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Centered Score Readout */}
      {showLabel && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <span
            ref={textRef}
            className="tabular"
            style={{
              fontSize: size >= 90 ? '26px' : size >= 70 ? '22px' : '16px',
              fontWeight: 700,
              color: 'var(--color-ink)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {clampedScore}
          </span>
          <span
            style={{
              fontSize: size >= 90 ? '10px' : '9px',
              color: 'var(--color-ink-muted)',
              fontWeight: 600,
              lineHeight: 1,
              marginTop: '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontFamily: 'var(--font-mono)',
            }}
          >
            / 100
          </span>
        </div>
      )}
    </div>
  );
}
