interface BoxPlotProps {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
  lowerFence: number;
  upperFence: number;
}

export function BoxPlot({
  min,
  q1,
  median,
  q3,
  max,
  outliers = [],
  lowerFence: _lowerFence,
  upperFence: _upperFence
}: BoxPlotProps) {
  // Combine all points to find the min and max coordinates for scaling
  const allPoints = [min, q1, median, q3, max, ...outliers].filter(v => v !== null && !isNaN(v));
  
  if (allPoints.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--text-muted)' }}>
        No distribution statistics available
      </div>
    );
  }

  const overallMin = Math.min(...allPoints);
  const overallMax = Math.max(...allPoints);
  const range = overallMax - overallMin === 0 ? 1 : overallMax - overallMin;

  // Map value to percentage position (5% to 95% padding to fit dots and ticks nicely)
  const scale = (val: number) => {
    return 5 + ((val - overallMin) / range) * 90;
  };

  const pMin = scale(min);
  const pQ1 = scale(q1);
  const pMedian = scale(median);
  const pQ3 = scale(q3);
  const pMax = scale(max);

  return (
    <div style={{ width: '100%', padding: '1rem 0' }}>
      <svg width="100%" height="90" viewBox="0 0 100 90" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        {/* Whisker Line */}
        <line
          x1={`${pMin}%`}
          y1="40"
          x2={`${pMax}%`}
          y2="40"
          stroke="var(--text-muted)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Min Whisker Cap */}
        <line
          x1={`${pMin}%`}
          y1="30"
          x2={`${pMin}%`}
          y2="50"
          stroke="var(--text-secondary)"
          strokeWidth="2"
        />

        {/* Max Whisker Cap */}
        <line
          x1={`${pMax}%`}
          y1="30"
          x2={`${pMax}%`}
          y2="50"
          stroke="var(--text-secondary)"
          strokeWidth="2"
        />

        {/* Interquartile Range (IQR) Box */}
        <rect
          x={`${pQ1}%`}
          y="20"
          width={`${pQ3 - pQ1}%`}
          height="40"
          fill="var(--accent-indigo-light)"
          stroke="var(--accent-indigo)"
          strokeWidth="2"
          rx="4"
        />

        {/* Median Line */}
        <line
          x1={`${pMedian}%`}
          y1="20"
          x2={`${pMedian}%`}
          y2="60"
          stroke="var(--accent-violet)"
          strokeWidth="3"
        />

        {/* Outlier Dots */}
        {outliers.map((outlier, i) => (
          <circle
            key={i}
            cx={`${scale(outlier)}%`}
            cy="40"
            r="2"
            fill="var(--accent-coral)"
            stroke="var(--bg-card)"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* BoxPlot Labels / Legend */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: 'var(--text-secondary)',
        marginTop: '0.5rem',
        fontWeight: 600
      }}>
        <div>
          <div>Min</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{min.toFixed(2)}</div>
        </div>
        <div>
          <div>Q1</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{q1.toFixed(2)}</div>
        </div>
        <div>
          <div>Median</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)' }}>{median.toFixed(2)}</div>
        </div>
        <div>
          <div>Q3</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{q3.toFixed(2)}</div>
        </div>
        <div>
          <div>Max</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{max.toFixed(2)}</div>
        </div>
      </div>

      {outliers.length > 0 && (
        <div style={{ 
          fontSize: '0.7rem', 
          color: 'var(--accent-coral)', 
          textAlign: 'center', 
          marginTop: '0.75rem',
          fontWeight: 500
        }}>
          💡 Surfaced {outliers.length} outliers (values plotted as red points outside fences)
        </div>
      )}
    </div>
  );
}
