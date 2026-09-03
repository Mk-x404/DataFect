import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { ActualVsPredicted } from '../../types';

interface ScatterPlotProps {
  data: ActualVsPredicted[];
  targetName?: string;
}

export function ScatterPlot({ data, targetName = 'Target' }: ScatterPlotProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        No prediction evaluation data available
      </div>
    );
  }

  // Find min/max values for boundaries and drawing the 45-degree line
  const vals = data.flatMap(d => [d.actual, d.predicted]);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const padding = (maxVal - minVal) * 0.05 || 1;
  const domain = [minVal - padding, maxVal + padding];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const actual = payload[0].value;
      const predicted = payload[1].value;
      const error = predicted - actual;
      const percentError = actual !== 0 ? (error / actual) * 100 : 0;

      return (
        <div className="card-border" style={{ 
          backgroundColor: 'var(--bg-card)', 
          padding: '0.75rem',
          fontSize: '0.8rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Data Point evaluation
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Actual {targetName}: <strong style={{ color: 'var(--text-primary)' }}>{actual.toFixed(2)}</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Predicted {targetName}: <strong style={{ color: 'var(--accent-indigo)' }}>{predicted.toFixed(2)}</strong>
          </p>
          <p style={{ 
            color: Math.abs(percentError) > 15 ? 'var(--accent-coral)' : 'var(--accent-emerald)',
            fontWeight: 600,
            marginTop: '0.25rem'
          }}>
            Error: {error > 0 ? '+' : ''}{error.toFixed(2)} ({percentError > 0 ? '+' : ''}{percentError.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: -10 }}
        >
          <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="actual" 
            name="Actual" 
            unit="" 
            domain={domain}
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            label={{ value: `Actual ${targetName}`, position: 'bottom', offset: 0, fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis 
            type="number" 
            dataKey="predicted" 
            name="Predicted" 
            unit="" 
            domain={domain}
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            label={{ value: `Predicted ${targetName}`, angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <ZAxis type="number" range={[60, 60]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          {/* Ideal line Y = X */}
          <ReferenceLine 
            segment={[{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }]} 
            stroke="var(--text-muted)" 
            strokeWidth={1.5}
            strokeDasharray="5 5"
          />
          
          <Scatter 
            name="Predictions" 
            data={data} 
            fill="var(--accent-indigo)" 
            fillOpacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
