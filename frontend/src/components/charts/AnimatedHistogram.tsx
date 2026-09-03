import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import type { HistogramBin } from '../../types';

interface AnimatedHistogramProps {
  data: HistogramBin[];
  fillColor?: string;
}

export function AnimatedHistogram({ data, fillColor = 'var(--accent-indigo)' }: AnimatedHistogramProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        No distribution data available
      </div>
    );
  }

  // Format the data for recharts
  const formattedData = data.map((bin) => ({
    name: bin.label,
    count: bin.count,
    range: `${bin.bin_start.toFixed(2)} - ${bin.bin_end.toFixed(2)}`,
    frequency: `${(bin.frequency * 100).toFixed(1)}%`
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="card-border" style={{ 
          backgroundColor: 'var(--bg-card)', 
          padding: '0.75rem',
          fontSize: '0.8rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Range: {dataPoint.range}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Frequency: <strong style={{ color: 'var(--accent-indigo)' }}>{dataPoint.count}</strong> rows ({dataPoint.frequency})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis 
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-secondary)', opacity: 0.5 }} />
          <Bar 
            dataKey="count" 
            fill={fillColor}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
