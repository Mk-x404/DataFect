import { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle,
  Info,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import type { UploadResponse } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { QualityRing } from '../data/QualityRing';
import { CodeBlock } from '../ui/CodeBlock';

interface QualityAuditProps {
  data: UploadResponse;
}

const CODE_TO_TITLE_MAP: Record<string, string> = {
  CRITICAL_MISSING: 'Extremely high amount of missing data',
  HIGH_MISSING: 'A large amount of missing information',
  MODERATE_MISSING: 'Some missing information',
  CONSTANT_COLUMN: 'Every value is exactly the same',
  OUTLIERS_EXTREME: 'Many values look unusual',
  OUTLIERS_HIGH: 'Some values look unusual',
  SUSPICIOUS_NEGATIVES: 'Found suspicious negative values',
  SKEWED_EXTREME: 'Values are concentrated on one side',
  NEAR_CONSTANT: 'Almost all values are identical'
};

const SEVERITY_TO_HUMAN: Record<string, string> = {
  critical: 'Needs attention',
  warning: 'Worth reviewing',
  info: 'Informational'
};

export function QualityAudit({ data }: QualityAuditProps) {
  const { quality } = data;
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredFlags = quality.all_flags_sorted.filter((flag) => {
    if (filterSeverity === 'all') return true;
    return flag.severity.toLowerCase() === filterSeverity;
  });

  const getSeverityIcon = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return <AlertOctagon size={16} style={{ color: 'var(--color-critical)' }} />;
      case 'warning':
        return <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />;
      case 'info':
      default:
        return <Info size={16} style={{ color: 'var(--color-info)' }} />;
    }
  };

  const getSeverityBadgeVariant = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <div className="flex-col-gap-6">
      
      {/* Top Banner: Score Indicator & Severity Breakdown */}
      <div className="audit-grid">
        {/* Quality Score Hero Card */}
        <Card
          variant="elevated"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '28px 20px',
            gap: '14px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-ink-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Composite Quality Score
          </span>

          <QualityRing score={quality.overall_score} size={96} strokeWidth={8} />

          <Badge
            variant={quality.overall_score >= 80 ? 'success' : quality.overall_score >= 50 ? 'warning' : 'critical'}
            size="md"
          >
            {quality.score_label}
          </Badge>
        </Card>

        {/* Severity Count & Filtering Controls */}
        <Card
          variant="flat"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '24px',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={16} style={{ color: 'var(--color-ink)' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Automated Quality Findings
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
              Rules engine audited completeness, cardinality anomalies, bounds, duplicate distributions, and outlier bounds.
            </p>
          </div>

          {/* Severity Filter Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '10px',
            }}
          >
            {/* All Filter */}
            <button
              onClick={() => setFilterSeverity('all')}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: filterSeverity === 'all' ? '1px solid var(--color-ink)' : '1px solid var(--color-hairline)',
                backgroundColor: filterSeverity === 'all' ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)', fontWeight: 500, textTransform: 'uppercase' }}>
                All Issues
              </span>
              <span className="tabular" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)' }}>
                {quality.all_flags_sorted.length}
              </span>
            </button>

            {/* Critical Filter */}
            <button
              onClick={() => setFilterSeverity('critical')}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: filterSeverity === 'critical' ? '1px solid var(--color-critical)' : '1px solid var(--color-hairline)',
                backgroundColor: filterSeverity === 'critical' ? 'var(--color-critical-subtle)' : 'var(--color-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--color-critical-text)', fontWeight: 500, textTransform: 'uppercase' }}>
                Needs attention
              </span>
              <span className="tabular" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-critical-text)' }}>
                {quality.flag_count_by_severity.critical}
              </span>
            </button>

            {/* Warning Filter */}
            <button
              onClick={() => setFilterSeverity('warning')}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: filterSeverity === 'warning' ? '1px solid var(--color-warning)' : '1px solid var(--color-hairline)',
                backgroundColor: filterSeverity === 'warning' ? 'var(--color-warning-subtle)' : 'var(--color-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--color-warning-text)', fontWeight: 500, textTransform: 'uppercase' }}>
                Worth reviewing
              </span>
              <span className="tabular" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-warning-text)' }}>
                {quality.flag_count_by_severity.warning}
              </span>
            </button>

            {/* Info Filter */}
            <button
              onClick={() => setFilterSeverity('info')}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: filterSeverity === 'info' ? '1px solid var(--color-info)' : '1px solid var(--color-hairline)',
                backgroundColor: filterSeverity === 'info' ? 'var(--color-info-subtle)' : 'var(--color-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--color-info-text)', fontWeight: 500, textTransform: 'uppercase' }}>
                Informational
              </span>
              <span className="tabular" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-info-text)' }}>
                {quality.flag_count_by_severity.info}
              </span>
            </button>
          </div>
        </Card>
      </div>

      {/* Findings List Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>
            Audit Findings Breakdown ({filteredFlags.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
            Filter: {filterSeverity.toUpperCase()}
          </span>
        </div>

        {filteredFlags.length === 0 ? (
          <Card
            variant="flat"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--color-ink-muted)',
            }}
          >
            <CheckCircle2 size={32} style={{ color: 'var(--color-success)' }} />
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-ink)' }}>
              No quality defects found for this filter.
            </span>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredFlags.map((flag, idx) => {
              const borderAccentColor =
                flag.severity.toLowerCase() === 'critical'
                  ? 'var(--color-critical)'
                  : flag.severity.toLowerCase() === 'warning'
                  ? 'var(--color-warning)'
                  : 'var(--color-info)';

              return (
                <Card
                  key={idx}
                  variant="flat"
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderLeft: `4px solid ${borderAccentColor}`,
                  }}
                >
                  {/* Top Line: Icon + Message + Code Badge + Severity */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getSeverityIcon(flag.severity)}
                      <strong style={{ fontSize: '15px', color: 'var(--color-ink)' }}>
                        {CODE_TO_TITLE_MAP[flag.code] || flag.code}
                      </strong>
                      <Badge variant={getSeverityBadgeVariant(flag.severity)} size="sm">
                        {SEVERITY_TO_HUMAN[flag.severity.toLowerCase()] || flag.severity}
                      </Badge>
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', color: 'var(--color-ink)', marginTop: '-4px' }}>
                     {flag.message}
                  </div>

                  {/* Business Impact Box */}
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface-subtle)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      color: 'var(--color-ink-secondary)',
                      lineHeight: 1.45,
                    }}
                  >
                    <strong style={{ color: 'var(--color-ink)', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                      Why this matters & What to do:
                    </strong>
                    {flag.business_impact}
                  </div>

                  <details
                    style={{
                      marginTop: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <summary style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-ink-muted)',
                      userSelect: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      View Technical Details & Code
                    </summary>
                    <div style={{
                      marginTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                        Backend Flag: <span className="mono-label">{flag.code}</span>
                      </div>
                      
                      {/* Affected Count Info */}
                      {flag.affected_count > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                          Affected rows: <strong className="tabular" style={{ color: 'var(--color-ink)' }}>{flag.affected_count.toLocaleString()}</strong>
                        </div>
                      )}

                      {/* Pandas Remediation Code Block */}
                      {flag.pandas_fix && (
                        <div style={{ marginTop: '4px' }}>
                          <CodeBlock
                            code={flag.pandas_fix}
                            language="python"
                            title="Pandas Remediation Snippet"
                            maxHeight="200px"
                          />
                        </div>
                      )}
                    </div>
                  </details>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
