import {
  FileText,
  Layers,
  Trash2,
  AlertTriangle,
  TableProperties,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type { UploadResponse } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatCard } from '../data/StatCard';
import { QualityRing } from '../data/QualityRing';
import { CompletenessBar } from '../data/CompletenessBar';

interface DashboardOverviewProps {
  data: UploadResponse;
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const { metadata, cleaning, quality, column_profiles } = data;

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'critical';
  };

  const score = quality?.overall_score ?? 0;
  const criticalCount = quality?.flag_count_by_severity?.critical ?? 0;
  const nullPercent = quality?.total_null_percent ?? 0;
  const dupeCount = quality?.duplicate_row_count ?? 0;
  const dupePercent = quality?.duplicate_row_percent ?? 0;
  const auditLog = cleaning?.audit_log ?? [];

  return (
    <div className="flex-col-gap-6">

      {/* ── Top Stat Grid ── */}
      <div className="dashboard-top-grid">

        {/* Hero: Overall Data Health */}
        <Card
          variant="flat"
          interactive={true}
          className="health-hero-card"
          title="Overall Dataset Quality & Audit Health"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            height: '100%',
            backgroundColor: 'var(--color-surface)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle accent strip on left edge */}
          <div
            className="health-accent-bar"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '3.5px',
              height: '100%',
              backgroundColor:
                score >= 80
                  ? 'var(--color-success)'
                  : score >= 50
                    ? 'var(--color-warning)'
                    : 'var(--color-critical)',
              borderRadius: '3px 0 0 3px',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px', flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--color-ink-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Overall Data Health
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--color-ink)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}
              >
                {quality?.score_label || 'Good'}
              </span>
              <Badge
                variant={getScoreVariant(score)}
                size="sm"
                style={{ whiteSpace: 'nowrap', fontWeight: 600, fontSize: '10.5px', alignSelf: 'center' }}
              >
                {score >= 80 ? 'Production Ready' : score >= 50 ? 'Needs Review' : 'Critical Issues'}
              </Badge>
            </div>

            <span
              style={{
                fontSize: '11.5px',
                color: 'var(--color-ink-muted)',
                lineHeight: 1.35,
              }}
            >
              {criticalCount > 0
                ? `${criticalCount} critical anomal${criticalCount === 1 ? 'y' : 'ies'} detected`
                : 'Heuristic quality audit passed with zero critical flags'}
            </span>
          </div>

          <div className="quality-ring-wrapper" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QualityRing score={score} size={76} strokeWidth={6.5} />
          </div>
        </Card>

        {/* Row Count */}
        <StatCard
          title="Row Count"
          numericValue={metadata?.row_count ?? 0}
          icon={<TableProperties size={15} />}
          description={`Before cleaning: ${((cleaning?.rows_after ?? 0) + (dupeCount || 0)).toLocaleString()}`}
        />

        {/* Column Count */}
        <StatCard
          title="Columns"
          numericValue={metadata?.column_count ?? column_profiles?.length ?? 0}
          icon={<Layers size={15} />}
          description="Fields auto-profiled"
        />

        {/* Duplicate Rows */}
        <StatCard
          title="Duplicates"
          numericValue={dupeCount}
          icon={<Trash2 size={15} />}
          description={`Rate: ${dupePercent.toFixed(1)}%`}
          badge={
            dupeCount > 0
              ? { text: 'Deduplicated', variant: 'warning' }
              : { text: 'Zero dupes', variant: 'success' }
          }
        />

        {/* Missing Cells */}
        <StatCard
          title="Missing Cells"
          numericValue={quality?.total_null_count ?? 0}
          icon={<AlertTriangle size={15} />}
          description={`Null rate: ${nullPercent.toFixed(1)}%`}
          badge={
            nullPercent > 10
              ? { text: `${nullPercent.toFixed(1)}% null`, variant: 'critical' }
              : undefined
          }
        />

        {/* File Size */}
        <StatCard
          title="File Size"
          value={`${(metadata?.file_size_mb ?? 0).toFixed(2)}`}
          unit="MB"
          icon={<FileText size={15} />}
          description={`${(metadata?.extension || 'CSV').toUpperCase()} · ${metadata?.encoding || 'utf-8'}`}
        />
      </div>

      {/* ── Main Content: Column Inventory + Cleaning Log ── */}
      <div className="dashboard-main-grid">

        {/* Left: Columns Inventory Table */}
        <Card
          variant="flat"
          style={{
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 18px',
              borderBottom: '1px solid var(--color-hairline)',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  letterSpacing: '-0.01em',
                }}
              >
                Column Inventory
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-ink-muted)',
                  marginTop: '2px',
                }}
              >
                Statistical profile across all {column_profiles.length} fields
              </p>
            </div>
            <Badge variant="neutral" size="sm" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
              {column_profiles.length} fields
            </Badge>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12.5px',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--color-surface-subtle)',
                    color: 'var(--color-ink-muted)',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  <th
                    style={{
                      padding: '9px 14px',
                      width: '40px',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '1px solid var(--color-hairline)',
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      padding: '9px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '1px solid var(--color-hairline)',
                    }}
                  >
                    Field
                  </th>
                  <th
                    style={{
                      padding: '9px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '1px solid var(--color-hairline)',
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: '9px 14px',
                      width: '160px',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '1px solid var(--color-hairline)',
                    }}
                  >
                    Complete
                  </th>
                  <th
                    style={{
                      padding: '9px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '1px solid var(--color-hairline)',
                    }}
                  >
                    Sample Values
                  </th>
                </tr>
              </thead>
              <tbody>
                {column_profiles.map((profile, idx) => {
                  const isLast = idx === column_profiles.length - 1;
                  return (
                    <tr
                      key={profile.name}
                      style={{
                        borderBottom: isLast ? 'none' : '1px solid var(--color-hairline-subtle)',
                        transition: 'background-color 120ms ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                          'var(--color-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Index */}
                      <td
                        style={{
                          padding: '10px 14px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-ink-muted)',
                          fontSize: '11px',
                          verticalAlign: 'middle',
                        }}
                      >
                        {String(profile.index + 1).padStart(2, '0')}
                      </td>

                      {/* Name */}
                      <td
                        style={{
                          padding: '10px 14px',
                          fontWeight: 600,
                          color: 'var(--color-ink)',
                          letterSpacing: '-0.01em',
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle',
                        }}
                        title={profile.name}
                      >
                        {profile.name}
                      </td>

                      {/* Type badge */}
                      <td
                        style={{
                          padding: '10px 14px',
                          verticalAlign: 'middle',
                        }}
                      >
                        <Badge
                          variant="neutral"
                          size="sm"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            fontWeight: 500,
                          }}
                        >
                          {profile.display_type}
                        </Badge>
                      </td>

                      {/* Completeness bar */}
                      <td
                        style={{
                          padding: '10px 14px',
                          verticalAlign: 'middle',
                        }}
                      >
                        <CompletenessBar percent={profile.completeness_percent} showText={true} />
                      </td>

                      {/* Sample values */}
                      <td
                        style={{
                          padding: '10px 14px',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                          {(profile.sample_values || []).slice(0, 3).map((v, i) => {
                            const str = v === '' ? '""' : String(v);
                            const display = str.length > 14 ? str.substring(0, 13) + '…' : str;
                            return (
                              <code
                                key={i}
                                title={str}
                                style={{
                                  fontSize: '10.5px',
                                  backgroundColor: 'var(--color-surface-subtle)',
                                  color: 'var(--color-ink-secondary)',
                                  padding: '2px 6px',
                                  borderRadius: 'var(--radius-xs)',
                                  border: '1px solid var(--color-hairline-subtle)',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                {display}
                              </code>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right: Cleaning & Audit Log */}
        <Card
          variant="flat"
          style={{
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 18px',
              borderBottom: '1px solid var(--color-hairline)',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  letterSpacing: '-0.01em',
                }}
              >
                Automated Repairs
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                Changes applied during cleaning
              </p>
            </div>
            <Badge
              variant={auditLog.length > 0 ? 'info' : 'success'}
              size="sm"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {auditLog.length} {auditLog.length === 1 ? 'fix' : 'fixes'}
            </Badge>
          </div>

          {/* Body */}
          <div style={{ padding: '4px 0', flex: 1 }}>
            {auditLog.length === 0 ? (
              /* Empty state */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 24px',
                  gap: '10px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: 'var(--color-ink)',
                      marginBottom: '4px',
                    }}
                  >
                    No repairs needed
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-ink-muted)', lineHeight: 1.5 }}>
                    Your dataset passed all structure checks without adjustments.
                  </p>
                </div>
              </div>
            ) : (
              /* Audit log items */
              <div
                style={{
                  maxHeight: '380px',
                  overflowY: 'auto',
                  padding: '0',
                }}
              >
                {auditLog.map((item, idx) => {
                  const isLast = idx === auditLog.length - 1;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 18px',
                        borderBottom: isLast ? 'none' : '1px solid var(--color-hairline-subtle)',
                        transition: 'background-color 120ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor =
                          'var(--color-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Icon dot */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          paddingTop: '2px',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-info-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Sparkles size={11} style={{ color: 'var(--color-info)' }} />
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <strong
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 600,
                              color: 'var(--color-ink)',
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {item.step}
                          </strong>
                          {item.column !== 'ALL' && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--color-ink-muted)',
                                backgroundColor: 'var(--color-surface-subtle)',
                                border: '1px solid var(--color-hairline-subtle)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.column}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-ink-secondary)',
                            lineHeight: 1.45,
                          }}
                        >
                          {item.action}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}