import type { TopValueItem } from '../../types';

interface CategoryBarProps {
  items: TopValueItem[];
  color?: string;
}

export function CategoryBar({ items, color = 'var(--accent-indigo)' }: CategoryBarProps) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        No category counts available.
      </div>
    );
  }

  // Find the maximum count to normalize relative bar widths
  const maxCount = Math.max(...items.map(item => item.count));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {items.map((item, index) => {
        const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

        return (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 600 }}>
              <span 
                style={{ 
                  color: 'var(--text-primary)', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '70%' 
                }}
                title={item.value}
              >
                {item.value === '' ? ' (empty/whitespace)' : item.value}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {item.count.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({item.percent.toFixed(1)}%)</span>
              </span>
            </div>

            {/* Progress Bar Container */}
            <div 
              style={{ 
                height: '8px', 
                backgroundColor: 'var(--bg-tertiary)', 
                borderRadius: '9999px', 
                overflow: 'hidden',
                width: '100%'
              }}
            >
              <div 
                style={{ 
                  height: '100%', 
                  width: `${widthPercent}%`, 
                  backgroundColor: color, 
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease-out'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
