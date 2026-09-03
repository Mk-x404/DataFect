
export interface CompletenessBarProps {
  percent: number;
  height?: number;
  showText?: boolean;
}

export function CompletenessBar({
  percent,
  height = 5,
  showText = false,
}: CompletenessBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  const getColor = (p: number) => {
    if (p >= 95) return 'var(--color-success)';
    if (p >= 75) return 'var(--color-info)';
    if (p >= 50) return 'var(--color-warning)';
    return 'var(--color-critical)';
  };

  const color = getColor(clamped);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div
        style={{
          flexGrow: 1,
          height: `${height}px`,
          backgroundColor: 'var(--color-surface-hover)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${clamped}%`,
            backgroundColor: color,
            borderRadius: 'var(--radius-pill)',
            transition: 'width 0.4s var(--ease-out)',
          }}
        />
      </div>

      {showText && (
        <span
          className="tabular"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: color,
            minWidth: '38px',
            textAlign: 'right',
          }}
        >
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
