import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import type { ForecastPeriod } from '../../types';

interface PredictionChartProps {
  data: ForecastPeriod[];
  targetName?: string;
}

export function PredictionChart({ data, targetName = 'Target' }: PredictionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        No time-series forecast data available
      </div>
    );
  }

  // Split data into historical and forecast series to render separate lines
  // The forecast line starts from the last historical point to make a continuous line
  const lastHistoricalIndex = data.map(d => d.label).lastIndexOf('Historical');
  
  const chartData = data.map((d, index) => {
    const isHistorical = d.label === 'Historical';
    const isLastHistorical = index === lastHistoricalIndex;
    
    return {
      date: d.date,
      historical: isHistorical || isLastHistorical ? d.predicted_value : null,
      forecast: !isHistorical || isLastHistorical ? d.predicted_value : null,
      label: d.label
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dp = payload[0].payload;
      const val = dp.historical !== null ? dp.historical : dp.forecast;
      const type = dp.label;

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
            Status: <span className={`badge badge-${type === 'Historical' ? 'info' : 'warning'}`}>{type}</span>
          </p>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {targetName}: <strong style={{ color: type === 'Historical' ? 'var(--accent-indigo)' : 'var(--accent-amber)' }}>
              {val.toFixed(2)}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
        >
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
          <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
          
          {/* Historical line (solid indigo) */}
          <Line 
            name="Historical Data" 
            type="monotone" 
            dataKey="historical" 
            stroke="var(--accent-indigo)" 
            strokeWidth={3}
            dot={{ r: 3, stroke: 'var(--accent-indigo)', strokeWidth: 1 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />

          {/* Forecast line (dashed amber) */}
          <Line 
            name="AutoML 6-Period Forecast" 
            type="monotone" 
            dataKey="forecast" 
            stroke="var(--accent-amber)" 
            strokeDasharray="5 5"
            strokeWidth={3}
            dot={{ r: 4, stroke: 'var(--accent-amber)', strokeWidth: 1 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
