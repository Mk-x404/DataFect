import { useState } from 'react';
import { 
  Binary, 
  CaseSensitive, 
  Calendar,
  Layers,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import type { UploadResponse, ColumnProfile } from '../../types';
import { AnimatedHistogram } from '../charts/AnimatedHistogram';
import { BoxPlot } from '../charts/BoxPlot';
import { CategoryBar } from '../charts/CategoryBar';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ColumnInspectorProps {
  data: UploadResponse;
}

export function ColumnInspector({ data }: ColumnInspectorProps) {
  const column_profiles = data?.column_profiles || [];
  const [selectedColIndex, setSelectedColIndex] = useState<number>(0);

  const activeColumn: ColumnProfile | undefined = column_profiles[selectedColIndex] || column_profiles[0];

  const getColIcon = (type?: string) => {
    switch ((type || '').toLowerCase()) {
      case 'numeric':
        return <Binary size={15} />;
      case 'categorical':
        return <CaseSensitive size={15} />;
      case 'date':
        return <Calendar size={15} />;
      default:
        return <Layers size={15} />;
    }
  };

  if (!activeColumn || column_profiles.length === 0) {
    return (
      <Card variant="flat" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
        No columns available to inspect.
      </Card>
    );
  }

  return (
    <div className="inspector-grid">
      {/* Left Sidebar Picker: Column List */}
      <Card
        variant="flat"
        style={{
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '740px',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Columns
          </h3>
          <Badge variant="neutral" size="sm">{column_profiles.length}</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {column_profiles.map((col, index) => {
            const isSelected = selectedColIndex === index;
            return (
              <button
                key={col.name}
                onClick={() => setSelectedColIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'var(--color-surface-active)' : 'transparent',
                  color: isSelected ? 'var(--color-ink)' : 'var(--color-ink-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '13px',
                  border: 'none',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ color: isSelected ? 'var(--color-ink)' : 'var(--color-ink-muted)' }}>
                    {getColIcon(col.type)}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {col.name}
                  </span>
                </div>
                <ChevronRight size={13} style={{ opacity: isSelected ? 1 : 0, color: 'var(--color-ink)' }} />
              </button>
            );
          })}
        </div>
      </Card>

      {/* Right Content Area: Column Details Inspector */}
      <div className="flex-col-gap-6">
        {/* Column Header Overview Card */}
        <Card
          variant="flat"
          style={{
            padding: '20px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Badge variant="neutral" size="sm" icon={getColIcon(activeColumn.type)}>
                {activeColumn.display_type}
              </Badge>
              <span className="mono-label" style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                Index: #{activeColumn.index + 1}
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
              {activeColumn.name}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>
                Completeness
              </div>
              <div className="tabular" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success-text)' }}>
                {(activeColumn.completeness_percent ?? 100).toFixed(1)}%
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>
                Missing Cells
              </div>
              <div
                className="tabular"
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: (activeColumn.null_count ?? 0) > 0 ? 'var(--color-critical-text)' : 'var(--color-ink)',
                }}
              >
                {(activeColumn.null_count ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        {/* Numeric Dimension Inspector */}
        {activeColumn.type.toLowerCase() === 'numeric' && activeColumn.numeric_stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* BoxPlot & Stats Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                gap: '20px',
              }}
            >
              <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                  BoxPlot & Five-Number Summary
                </h3>
                <BoxPlot
                  min={activeColumn.numeric_stats.min ?? 0}
                  q1={activeColumn.numeric_stats.q1 ?? 0}
                  median={activeColumn.numeric_stats.median ?? 0}
                  q3={activeColumn.numeric_stats.q3 ?? 0}
                  max={activeColumn.numeric_stats.max ?? 0}
                  outliers={activeColumn.numeric_stats.outlier_sample || []}
                  lowerFence={activeColumn.numeric_stats.lower_fence ?? 0}
                  upperFence={activeColumn.numeric_stats.upper_fence ?? 0}
                />
              </Card>

              <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                  Parametric Statistics
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Mean</div>
                    <div className="tabular font-mono" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>
                      {activeColumn.numeric_stats.mean != null ? activeColumn.numeric_stats.mean.toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Median</div>
                    <div className="tabular font-mono" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>
                      {activeColumn.numeric_stats.median != null && Number.isFinite(activeColumn.numeric_stats.median) ? activeColumn.numeric_stats.median.toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Std Dev</div>
                    <div className="tabular font-mono" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>
                      {activeColumn.numeric_stats.std_dev != null && Number.isFinite(activeColumn.numeric_stats.std_dev) ? activeColumn.numeric_stats.std_dev.toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>CV (Coef Var)</div>
                    <div className="tabular font-mono" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>
                      {activeColumn.numeric_stats.cv != null && Number.isFinite(activeColumn.numeric_stats.cv) ? activeColumn.numeric_stats.cv.toFixed(3) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Skewness</div>
                    <div className="tabular font-mono" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>
                      {activeColumn.numeric_stats.skewness != null && Number.isFinite(activeColumn.numeric_stats.skewness) ? activeColumn.numeric_stats.skewness.toFixed(3) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Kurtosis</div>
                    <div className="tabular font-mono" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>
                      {activeColumn.numeric_stats.kurtosis != null && Number.isFinite(activeColumn.numeric_stats.kurtosis) ? activeColumn.numeric_stats.kurtosis.toFixed(3) : 'N/A'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--color-hairline)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span>Outliers: <strong className="tabular" style={{ color: 'var(--color-critical-text)' }}>{activeColumn.numeric_stats.outlier_count ?? 0} ({(activeColumn.numeric_stats.outlier_percent ?? 0).toFixed(1)}%)</strong></span>
                  <span>Zeroes: <strong className="tabular">{activeColumn.numeric_stats.zero_count ?? 0}</strong></span>
                  <span>Negatives: <strong className="tabular" style={{ color: 'var(--color-critical-text)' }}>{activeColumn.numeric_stats.negative_count ?? 0}</strong></span>
                </div>
              </Card>
            </div>

            {/* Histogram & Distribution assessment */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
                gap: '20px',
              }}
            >
              <Card variant="flat" style={{ height: '340px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                  Empirical Frequency Distribution
                </h3>
                <div style={{ flexGrow: 1 }}>
                  <AnimatedHistogram data={activeColumn.numeric_stats.histogram || []} />
                </div>
              </Card>

              <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                  Distribution Assessment
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                      Shape Detection
                    </span>
                    <div style={{ color: 'var(--color-info-text)', fontWeight: 700, fontSize: '15px', marginTop: '2px' }}>
                      {activeColumn.numeric_stats.distribution_shape || 'Undetermined'}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>Skewness:</span>
                      <Badge variant="info" size="sm">{activeColumn.numeric_stats.skewness_label || 'Normal'}</Badge>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', marginTop: '2px' }}>
                      {activeColumn.numeric_stats.skewness_explanation || 'No skewness detected.'}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>Kurtosis:</span>
                      <Badge variant="info" size="sm">{activeColumn.numeric_stats.kurtosis_label || 'Mesokurtic'}</Badge>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', marginTop: '2px' }}>
                      {activeColumn.numeric_stats.kurtosis_explanation || 'Standard tail weight.'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Categorical Dimension Inspector */}
        {activeColumn.type.toLowerCase() === 'categorical' && activeColumn.categorical_stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
              gap: '20px',
            }}
          >
            <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Cardinality & Modes
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Unique Categories
                  </span>
                  <div className="tabular" style={{ fontWeight: 700, fontSize: '20px', color: 'var(--color-ink)' }}>
                    {(activeColumn.categorical_stats.unique_count ?? 0).toLocaleString()}
                  </div>
                  <Badge variant="neutral" size="sm" style={{ marginTop: '4px' }}>
                    {activeColumn.categorical_stats.cardinality_label || 'Categorical'}
                  </Badge>
                </div>

                <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '10px' }}>
                  <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Mode (Most Frequent)
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-info-text)', marginTop: '2px' }}>
                    "{activeColumn.categorical_stats.mode || 'N/A'}"
                  </div>
                  <div style={{ color: 'var(--color-ink-muted)', fontSize: '12px', marginTop: '2px' }}>
                    Appeared <strong className="tabular">{(activeColumn.categorical_stats.mode_count ?? 0).toLocaleString()}</strong> times ({(activeColumn.categorical_stats.mode_percent != null ? (activeColumn.categorical_stats.mode_percent <= 1 ? activeColumn.categorical_stats.mode_percent * 100 : activeColumn.categorical_stats.mode_percent) : 0).toFixed(1)}%)
                  </div>
                </div>
              </div>
            </Card>

            <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Top Category Frequencies
              </h3>
              <CategoryBar items={activeColumn.categorical_stats.top_values || []} />

              {(activeColumn.categorical_stats.rare_values || []).length > 0 && (
                <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-critical-text)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                    <AlertTriangle size={13} />
                    <span>Rare Values (&lt; 1% frequency)</span>
                  </div>
                  <CategoryBar items={activeColumn.categorical_stats.rare_values} color="var(--color-critical)" />
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Date Dimension Inspector */}
        {activeColumn.type.toLowerCase() === 'date' && activeColumn.date_stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
              gap: '20px',
            }}
          >
            <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Temporal Boundaries
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Earliest Timestamp
                  </span>
                  <div className="font-mono" style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '13px' }}>
                    {activeColumn.date_stats.earliest}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Latest Timestamp
                  </span>
                  <div className="font-mono" style={{ fontWeight: 700, color: 'var(--color-ink)', fontSize: '13px' }}>
                    {activeColumn.date_stats.latest}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Span Duration
                  </span>
                  <div style={{ fontWeight: 600, color: 'var(--color-info-text)' }}>
                    {activeColumn.date_stats.range_label} ({activeColumn.date_stats.total_days.toLocaleString()} days)
                  </div>
                </div>
              </div>
            </Card>

            <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} />
                <span>Date Continuity & Gaps</span>
              </h3>

              {activeColumn.date_stats.has_gaps ? (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--color-critical-subtle)',
                    borderLeft: '4px solid var(--color-critical)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--color-critical-text)',
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Sequence Gaps Detected</strong>
                  <span>The largest recorded gap spans {activeColumn.date_stats.largest_gap_days} days.</span>
                </div>
              ) : (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--color-success-subtle)',
                    borderLeft: '4px solid var(--color-success)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--color-success-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>Timeline is continuous without uncharacteristic logging gaps.</span>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
