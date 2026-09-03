import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface TrendPoint {
  date: string;
  value: number;
}

interface TrendLineProps {
  data: TrendPoint[];
  valueLabel?: string;
  color?: string;
}

export function TrendLine({ data, valueLabel = 'Value', color = 'var(--accent-indigo)' }: TrendLineProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        No time-series data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dp = payload[0].payload;
      return (
        <div className="card-border" style={{ 
          backgroundColor: 'var(--bg-card)', 
          padding: '0.75rem',
          fontSize: '0.8rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Date: {dp.date}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            {valueLabel}: <strong style={{ color }}>{dp.value.toLocaleString()}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis 
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#trendGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
