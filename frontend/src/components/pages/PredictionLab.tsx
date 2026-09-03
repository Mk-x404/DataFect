import { useState } from 'react';
import { 
  Settings, 
  BarChart3, 
  Sparkles,
  Info,
  Play
} from 'lucide-react';
import type { UploadResponse } from '../../types';
import { ScatterPlot } from '../charts/ScatterPlot';
import { PredictionChart } from '../charts/PredictionChart';
import { CategoryBar } from '../charts/CategoryBar';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PredictionLabProps {
  data: UploadResponse;
  onRetrain: (targetCol: string) => void;
  isRetraining: boolean;
}

export function PredictionLab({ data, onRetrain, isRetraining }: PredictionLabProps) {
  const { prediction, column_profiles } = data;
  const [selectedTarget, setSelectedTarget] = useState<string>(prediction.target_column || '');

  // Filter possible target columns (exclude dates and IDs)
  const targetCandidates = column_profiles.filter((col) => {
    return !['date', 'id', 'text', 'empty'].includes(col.type.toLowerCase());
  });

  const handleTrain = () => {
    if (selectedTarget && selectedTarget !== prediction.target_column) {
      onRetrain(selectedTarget);
    }
  };

  const isRegression = prediction.task_type === 'regression';

  return (
    <div className="flex-col-gap-6">
      
      {/* Target Selection & Model Details Header */}
      <div className="prediction-grid-config">
        {/* Model Target Configuration Panel */}
        <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} style={{ color: 'var(--color-info)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>
              AutoML Model Configuration
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>
              Target Column:
            </label>
            <div className="prediction-target-row" style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                disabled={isRetraining}
                style={{
                  flexGrow: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-hairline-strong)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {targetCandidates.map((col) => {
                  const isHighCard =
                    (col.type?.toLowerCase() === 'categorical' || col.type?.toLowerCase() === 'text') &&
                    (col.categorical_stats?.unique_count ?? 0) > 15;
                  return (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.display_type}{isHighCard ? ' · Auto-binned' : ''})
                    </option>
                  );
                })}
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={handleTrain}
                disabled={isRetraining || selectedTarget === prediction.target_column}
                isLoading={isRetraining}
                icon={<Play size={13} />}
              >
                Train
              </Button>
            </div>
            {selectedTarget === prediction.target_column && (
              <span style={{ fontSize: '11px', color: 'var(--color-success-text)' }}>
                ✓ Currently trained target.
              </span>
            )}
          </div>

          <div
            style={{
              borderTop: '1px solid var(--color-hairline)',
              paddingTop: '12px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12px',
              color: 'var(--color-ink-muted)',
            }}
          >
            <div>
              <span>Training partition:</span>
              <strong style={{ display: 'block', color: 'var(--color-ink)', marginTop: '2px' }}>
                {prediction.train_size?.toLocaleString()} rows (80%)
              </strong>
            </div>
            <div>
              <span>Testing partition:</span>
              <strong style={{ display: 'block', color: 'var(--color-ink)', marginTop: '2px' }}>
                {prediction.test_size?.toLocaleString()} rows (20%)
              </strong>
            </div>
          </div>
        </Card>

        {/* Evaluation Metrics Card */}
        <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>
            AutoML Benchmark Results
          </h3>

          {prediction.error ? (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--color-critical-subtle)',
                borderLeft: '4px solid var(--color-critical)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--color-critical-text)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '2px' }}>Automated training halted:</strong>
              {prediction.error}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Optimal Model Selected
                </span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em', marginTop: '2px' }}>
                  {prediction.best_model}
                </div>
                <Badge variant="info" size="sm" style={{ marginTop: '4px' }}>
                  Task: {prediction.task_type}
                </Badge>
              </div>

              <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '10px', display: 'flex', gap: '20px' }}>
                {isRegression ? (
                  <>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>R² Score</div>
                      <div className="tabular font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-success-text)' }}>
                        {prediction.r2_percent !== null && prediction.r2_percent !== undefined
                          ? `${prediction.r2_percent}`
                          : prediction.r2_score !== null && prediction.r2_score !== undefined
                          ? `${prediction.r2_score}`
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>MAE</div>
                      <div className="tabular font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)' }}>
                        {prediction.mae !== null && prediction.mae !== undefined ? prediction.mae : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>RMSE</div>
                      <div className="tabular font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)' }}>
                        {prediction.rmse !== null && prediction.rmse !== undefined ? prediction.rmse : 'N/A'}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Test Accuracy</div>
                      <div className="tabular font-mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success-text)' }}>
                        {prediction.accuracy !== null && prediction.accuracy !== undefined ? `${prediction.accuracy}` : 'N/A'}
                      </div>
                    </div>
                    {prediction.classes && (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Classes</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                          {prediction.classes.map((cls, idx) => (
                            <Badge key={idx} variant="neutral" size="sm">"{cls}"</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Feature Importance & Business Interpretation */}
      {!prediction.error && (
        <div className="prediction-grid-config">
          {/* Feature Importance */}
          <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} style={{ color: 'var(--color-info)' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Feature Importance
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
              Statistical weight contributed by each feature to the model's predictions.
            </p>

            <div style={{ marginTop: '4px' }}>
              {Object.keys(prediction?.feature_importances || {}).length === 0 ? (
                <div style={{ padding: '24px', color: 'var(--color-ink-muted)', fontSize: '12px', textAlign: 'center' }}>
                  No feature importances recorded.
                </div>
              ) : (
                <CategoryBar
                  items={Object.entries(prediction?.feature_importances || {}).map(([k, v]) => ({
                    value: k,
                    count: Math.round((v ?? 0) * 1000),
                    percent: v ?? 0,
                  }))}
                />
              )}
            </div>
          </Card>

          {/* Plain English Explanation */}
          <Card variant="flat" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--color-ai)' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Executive Interpretation
              </h3>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {prediction?.business_interpretation && (
                <p style={{ fontStyle: 'italic', borderLeft: '3px solid var(--color-ai)', paddingLeft: '12px' }}>
                  "{prediction.business_interpretation}"
                </p>
              )}

              <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '12px' }}>
                <strong style={{ color: 'var(--color-ink)', display: 'block', fontSize: '12px', marginBottom: '6px' }}>
                  Features Utilized for Modeling:
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(prediction?.feature_cols_used || []).map((col, idx) => (
                    <span
                      key={idx}
                      className="font-mono"
                      style={{
                        fontSize: '11px',
                        backgroundColor: 'var(--color-surface-subtle)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--color-ink-secondary)',
                      }}
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Regression Actuals vs Predicted Scatter & Time Series Forecast */}
      {!prediction.error && isRegression && (
        <div className="prediction-grid-charts">
          {/* Actual vs Predicted Scatter */}
          <Card variant="flat" style={{ height: '380px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
              Actuals vs Predictions Scatter
            </h3>
            <div style={{ flexGrow: 1 }}>
              <ScatterPlot
                data={prediction.actual_vs_predicted || []}
                targetName={prediction.target_column || undefined}
              />
            </div>
          </Card>

          {/* Time Series Forecast */}
          <Card variant="flat" style={{ height: '380px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
              Time-Series Extrapolation
            </h3>
            {prediction.trend_forecast && prediction.trend_forecast.length > 0 ? (
              <div style={{ flexGrow: 1 }}>
                <PredictionChart
                  data={prediction.trend_forecast}
                  targetName={prediction.target_column || undefined}
                />
              </div>
            ) : (
              <div
                style={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  color: 'var(--color-ink-muted)',
                  gap: '8px',
                  textAlign: 'center',
                }}
              >
                <Info size={20} />
                <span style={{ fontSize: '12px' }}>
                  Future extrapolation requires a datetime index and regular period logging.
                </span>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
