import React, { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface CorrelationHeatmapProps {
  matrix: Record<string, Record<string, number | null>>;
  onCellClick?: (col1: string, col2: string, value: number) => void;
  selectedPair?: { col1: string; col2: string } | null;
}

export function CorrelationHeatmap({
  matrix,
  onCellClick,
  selectedPair,
}: CorrelationHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ col1: string; col2: string; val: number | null } | null>(null);

  const columns = Object.keys(matrix);

  useGSAP(() => {
    if (!containerRef.current || columns.length === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.from('.corr-cell', {
      opacity: 0,
      scale: 0.85,
      stagger: {
        amount: 0.4,
        from: 'center',
        grid: [columns.length, columns.length],
      },
      duration: 0.4,
      ease: 'power2.out',
    });
  }, { scope: containerRef, dependencies: [columns.length] });

  if (columns.length === 0) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-muted)', fontSize: '13px' }}>
        No numeric dimensions available for correlation computation.
      </div>
    );
  }

  // 5-stop diverging color scale
  const getCellColor = (val: number | null) => {
    if (val === null) return 'var(--color-surface-subtle)';
    if (val >= 0.7) return 'rgba(0, 145, 255, 0.85)';
    if (val >= 0.3) return 'rgba(0, 145, 255, 0.45)';
    if (val > -0.3) return 'var(--color-surface-subtle)';
    if (val > -0.7) return 'rgba(229, 72, 77, 0.45)';
    return 'rgba(229, 72, 77, 0.85)';
  };

  const getTextColor = (val: number | null) => {
    if (val === null) return 'var(--color-ink-muted)';
    return Math.abs(val) >= 0.7 ? '#FFFFFF' : 'var(--color-ink)';
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', overflowX: 'auto', padding: '12px 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `minmax(110px, 140px) repeat(${columns.length}, 46px)`,
          gap: '3px',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          maxWidth: 'fit-content',
        }}
      >
        {/* Top Left Corner Offset */}
        <div style={{ height: '36px' }} />

        {/* Column Headers (Rotated) */}
        {columns.map((col) => (
          <div
            key={col}
            style={{
              height: '36px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-ink-secondary)',
              textAlign: 'center',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={col}
          >
            {col.length > 10 ? `${col.substring(0, 9)}…` : col}
          </div>
        ))}

        {/* Matrix Rows */}
        {columns.map((rowCol) => (
          <React.Fragment key={rowCol}>
            {/* Row Label (Left) */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-ink-secondary)',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                paddingRight: '10px',
                textAlign: 'right',
              }}
              title={rowCol}
            >
              {rowCol.length > 14 ? `${rowCol.substring(0, 13)}…` : rowCol}
            </div>

            {/* Matrix Cells */}
            {columns.map((colCol) => {
              const val = matrix[rowCol]?.[colCol] ?? null;
              const isSelf = rowCol === colCol;
              const isSelected =
                (selectedPair?.col1 === rowCol && selectedPair?.col2 === colCol) ||
                (selectedPair?.col1 === colCol && selectedPair?.col2 === rowCol);

              return (
                <div
                  key={colCol}
                  className="corr-cell"
                  onClick={() => val !== null && !isSelf && onCellClick?.(rowCol, colCol, val)}
                  onMouseEnter={() => setHoveredCell({ col1: rowCol, col2: colCol, val })}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    height: '46px',
                    width: '46px',
                    backgroundColor: isSelf ? 'var(--color-surface-hover)' : getCellColor(val),
                    color: isSelf ? 'var(--color-ink-muted)' : getTextColor(val),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-xs)',
                    cursor: val !== null && !isSelf ? 'pointer' : 'default',
                    border: isSelected ? '2px solid var(--color-ink)' : '1px solid var(--color-surface)',
                    transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
                    transform:
                      hoveredCell?.col1 === rowCol && hoveredCell?.col2 === colCol
                        ? 'scale(1.12)'
                        : isSelected
                        ? 'scale(1.05)'
                        : 'none',
                    zIndex: hoveredCell?.col1 === rowCol && hoveredCell?.col2 === colCol ? 10 : 1,
                  }}
                  title={val !== null ? `${rowCol} × ${colCol}: ${val.toFixed(4)}` : undefined}
                >
                  {isSelf ? '—' : val !== null ? val.toFixed(2) : '·'}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Diverging Color Scale Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          marginTop: '20px',
          fontSize: '11px',
          color: 'var(--color-ink-muted)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(229, 72, 77, 0.85)' }} />
          <span>Strong Negative (-1.0)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--color-surface-subtle)' }} />
          <span>Neutral (0.0)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(0, 145, 255, 0.85)' }} />
          <span>Strong Positive (+1.0)</span>
        </div>
      </div>

      {/* Interactive Tooltip Callout */}
      {hoveredCell && hoveredCell.val !== null && hoveredCell.col1 !== hoveredCell.col2 && (
        <div
          style={{
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '12px',
            color: 'var(--color-ink)',
            fontWeight: 500,
          }}
        >
          <span>{hoveredCell.col1}</span> ↔ <span>{hoveredCell.col2}</span>: <strong className="font-mono" style={{ color: hoveredCell.val > 0 ? 'var(--color-info-text)' : 'var(--color-critical-text)' }}>{hoveredCell.val.toFixed(4)}</strong>
        </div>
      )}
    </div>
  );
}
