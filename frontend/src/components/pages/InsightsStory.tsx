import { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  AlertTriangle, 
  Flame,
  TrendingDown,
  TrendingUp,
  Check,
  Copy,
  ShieldCheck,
  Layers,
  Activity
} from 'lucide-react';
import type { UploadResponse, AIStoryReport } from '../../types';
import { Card } from '../ui/Card';
import { Badge, type BadgeVariant } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { CorrelationHeatmap } from '../charts/CorrelationHeatmap';
import { generateStory } from '../../api/client';

interface InsightsStoryProps {
  data: UploadResponse;
}

export function InsightsStory({ data }: InsightsStoryProps) {
  const { correlations } = data;
  
  const [story, setStory] = useState<AIStoryReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<any | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopyAll = () => {
    if (!story) return;
    const text = story.insights.map((card, i) => 
      `Finding #${i + 1}: ${card.title} (${card.priority} Priority - ${card.category.toUpperCase()})\n` +
      `• Observation: ${card.observation}\n` +
      `• Interpretation: ${card.interpretation}\n` +
      `• Recommended Action: ${card.recommended_attention}\n`
    ).join('\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2200);
  };

  const handleCopyPrompt = (prompt: string, idx: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const res = await generateStory(data);
      setStory(res);
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to generate executive summary. Ensure backend connection and API keys are active.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityVariant = (priority: string): BadgeVariant => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'critical';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getDirectionIcon = (dir: string) => {
    return dir.toLowerCase() === 'positive' ? (
      <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
    ) : (
      <TrendingDown size={14} style={{ color: 'var(--color-critical)' }} />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* SECTION 1: Correlations & Multi-collinearity Matrix */}
      <div className="dashboard-main-grid">
        {/* Heatmap Chart Card */}
        <Card variant="flat" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
              Correlation Matrix
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
              Pairwise Pearson / Spearman linear association matrix. Click any cell to inspect relationship dynamics.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <CorrelationHeatmap
              matrix={correlations.matrix}
              selectedPair={selectedPair}
              onCellClick={(col1, col2, val) => {
                const found = correlations.top_pairs.find(
                  (p) => (p.col1 === col1 && p.col2 === col2) || (p.col1 === col2 && p.col2 === col1)
                );
                if (found) {
                  setSelectedPair(found);
                } else {
                  setSelectedPair({
                    col1,
                    col2,
                    coefficient: val,
                    strength: Math.abs(val) > 0.7 ? 'Strong' : Math.abs(val) > 0.4 ? 'Moderate' : 'Weak',
                    direction: val > 0 ? 'Positive' : 'Negative',
                    explanation: `There is a ${Math.abs(val) > 0.4 ? 'detectable' : 'negligible'} ${val > 0 ? 'positive' : 'negative'} relationship between ${col1} and ${col2}.`,
                    is_multicollinear: Math.abs(val) > 0.85,
                  });
                }
              }}
            />
          </div>
        </Card>

        {/* Right Side: Selected Pair Detail + Strongest Pairs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selected Pair Inspector Card */}
          {selectedPair ? (
            <Card
              variant="elevated"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                borderLeft: `4px solid ${selectedPair.coefficient > 0 ? 'var(--color-info)' : 'var(--color-critical)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  Selected Association
                </span>
                <Badge variant={selectedPair.is_multicollinear ? 'critical' : 'info'} size="sm">
                  {selectedPair.strength} {selectedPair.direction}
                </Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-ink)' }}>
                  {selectedPair.col1} ↔ {selectedPair.col2}
                </strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {getDirectionIcon(selectedPair.direction)}
                  <span className="tabular font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>
                    {selectedPair.coefficient.toFixed(4)}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', lineHeight: 1.45 }}>
                {selectedPair.explanation}
              </p>

              {selectedPair.is_multicollinear && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--color-critical-text)',
                    backgroundColor: 'var(--color-critical-subtle)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  <Flame size={12} />
                  <span>High multicollinearity risk (r &gt; 0.85). Consider dropping one feature before model training.</span>
                </div>
              )}
            </Card>
          ) : (
            <Card variant="inset" style={{ padding: '16px', textAlign: 'center', color: 'var(--color-ink-muted)', fontSize: '12px' }}>
              Click any heatmap cell to inspect pairwise association details.
            </Card>
          )}

          {/* Strongest Correlations List */}
          <Card variant="flat" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Top Correlated Pairs
              </h3>
              <Badge variant="neutral" size="sm">{correlations.top_pairs.length} PAIRS</Badge>
            </div>

            {correlations.top_pairs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-muted)', fontSize: '12px' }}>
                No significant linear numeric correlations detected.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  paddingRight: '2px',
                }}
              >
                {correlations.top_pairs.map((pair, idx) => {
                  const isSelected = selectedPair?.col1 === pair.col1 && selectedPair?.col2 === pair.col2;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedPair(pair)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        backgroundColor: isSelected ? 'var(--color-surface-active)' : 'var(--color-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        border: isSelected ? '1px solid var(--color-ink)' : '1px solid transparent',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-subtle)';
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                        <strong style={{ color: 'var(--color-ink)' }}>{pair.col1}</strong>
                        <span style={{ color: 'var(--color-ink-muted)', margin: '0 4px' }}>×</span>
                        <strong style={{ color: 'var(--color-ink)' }}>{pair.col2}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {pair.is_multicollinear && (
                          <span title="High Multicollinearity">
                            <Flame size={12} style={{ color: 'var(--color-critical)' }} />
                          </span>
                        )}
                        <span
                          className="tabular font-mono"
                          style={{
                            fontWeight: 700,
                            color: pair.coefficient > 0 ? 'var(--color-info-text)' : 'var(--color-critical-text)',
                          }}
                        >
                          {pair.coefficient.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* SECTION 2: AI Executive Storyboard */}
      <Card variant="flat" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--color-ai)' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
                AI Executive Summary
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
              Synthesizes key distribution patterns, anomalies, and correlation drivers into structured executive cards with recommended actions.
            </p>
          </div>

          <Button
            variant="ai"
            size="md"
            onClick={handleGenerateStory}
            isLoading={isGenerating}
            icon={<Sparkles size={14} />}
          >
            {story ? 'Regenerate Executive Summary' : 'Generate Executive Summary'}
          </Button>
        </div>

        {generationError && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-critical-subtle)',
              borderLeft: '4px solid var(--color-critical)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: 'var(--color-critical-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{generationError}</span>
          </div>
        )}

        {/* STATE 1: GENERATING (Active Telemetry + Realistic Card Skeletons) */}
        {isGenerating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px 18px',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-hairline)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid var(--color-ai)',
                    borderRightColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink)' }}>
                  Synthesizing executive findings across distributions, anomalies & predictive signals…
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                  Distributions
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-ai)' }} />
                  Correlations
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
                  Executive Takeaways
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {[
                { accent: 'var(--color-critical)', cat: 'DATA INTEGRITY', prio: 'HIGH' },
                { accent: 'var(--color-ai)', cat: 'CORRELATION DRIVER', prio: 'MEDIUM' },
                { accent: 'var(--color-info)', cat: 'DISTRIBUTION PROFILE', prio: 'MEDIUM' },
              ].map((sk, idx) => (
                <Card
                  key={idx}
                  variant="flat"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    borderTop: `4px solid ${sk.accent}`,
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        color: 'var(--color-ink-muted)',
                        backgroundColor: 'var(--color-surface-subtle)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      {sk.cat}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--color-ink-muted)',
                        backgroundColor: 'var(--color-surface-subtle)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      {sk.prio} PRIORITY
                    </span>
                  </div>

                  <Skeleton height="18px" width="75%" borderRadius="var(--radius-xs)" />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Skeleton height="12px" width="100%" borderRadius="var(--radius-xs)" />
                    <Skeleton height="12px" width="90%" borderRadius="var(--radius-xs)" />
                    <Skeleton height="12px" width="65%" borderRadius="var(--radius-xs)" />
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '10px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Skeleton height="10px" width="35%" borderRadius="var(--radius-xs)" />
                    <Skeleton height="12px" width="85%" borderRadius="var(--radius-xs)" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* STATE 2: READY / UNGENERATED LAUNCHPAD */}
        {!isGenerating && !story && (
          <div
            style={{
              padding: '32px 24px',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px dashed var(--color-hairline)',
              borderRadius: 'var(--radius-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-ai-subtle)',
                color: 'var(--color-ai)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={22} />
            </div>

            <div style={{ maxWidth: '580px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Dataset Ready for Executive Synthesis
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                Condense distributions, anomalies, and correlation drivers into structured executive cards with direct recommended actions.
              </p>
            </div>

            {/* Quick Telemetry Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              <Badge variant="neutral" size="sm">
                {data.metadata?.row_count?.toLocaleString() || 0} Records
              </Badge>
              <Badge variant="neutral" size="sm">
                {data.metadata?.column_count || 0} Dimensions Profiled
              </Badge>
              <Badge variant={data.quality?.overall_score && data.quality.overall_score >= 80 ? 'success' : 'warning'} size="sm">
                Health: {data.quality?.overall_score || 100}/100
              </Badge>
              <Badge variant="info" size="sm">
                {correlations?.top_pairs?.length || 0} Correlations Mapped
              </Badge>
            </div>

            {/* Preview Feature Pillars */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                width: '100%',
                maxWidth: '820px',
                marginTop: '6px',
              }}
            >
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>Data Integrity</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--color-ink-muted)', lineHeight: 1.4 }}>
                  Audits missingness, duplicate records, and outlier bounds.
                </p>
              </div>

              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Activity size={14} style={{ color: 'var(--color-ai)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>Correlation Drivers</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--color-ink-muted)', lineHeight: 1.4 }}>
                  Highlights top pairwise relationships and collinearity risks.
                </p>
              </div>

              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Layers size={14} style={{ color: 'var(--color-info)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>Executive Actions</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--color-ink-muted)', lineHeight: 1.4 }}>
                  Produces direct, concrete business recommendations.
                </p>
              </div>
            </div>

            <Button
              variant="ai"
              size="md"
              onClick={handleGenerateStory}
              icon={<Sparkles size={15} />}
              style={{ marginTop: '8px' }}
            >
              Generate Executive Summary
            </Button>
          </div>
        )}

        {/* STATE 3: GENERATED INSIGHT CARDS */}
        {!isGenerating && story && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Action Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                paddingBottom: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="info" size="sm">
                  {story.insights.length} Executive Findings
                </Badge>
                <span style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                  Grounded in statistical distributions & correlations
                </span>
              </div>

              <button
                onClick={handleCopyAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  color: 'var(--color-ink-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-ink-muted)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-hairline)';
                }}
              >
                {copiedAll ? <Check size={13} style={{ color: 'var(--color-success)' }} /> : <Copy size={13} />}
                <span>{copiedAll ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>
            </div>

            {/* Grid of Executive Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {story.insights.map((card, idx) => {
                const borderTopColor =
                  card.priority.toLowerCase() === 'high'
                    ? 'var(--color-critical)'
                    : card.priority.toLowerCase() === 'medium'
                    ? 'var(--color-warning)'
                    : 'var(--color-info)';

                return (
                  <Card
                    key={idx}
                    variant="flat"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      borderTop: `4px solid ${borderTopColor}`,
                      transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                    }}
                  >
                    {/* Category & Priority Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Badge variant="neutral" size="sm">
                        {card.category.toUpperCase()}
                      </Badge>
                      <Badge variant={getPriorityVariant(card.priority)} size="sm">
                        {card.priority} Priority
                      </Badge>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.35 }}>
                        {card.title}
                      </h3>
                    </div>

                    {/* What & Why Observations */}
                    <div style={{ fontSize: '13px', lineHeight: 1.55 }}>
                      <p style={{ color: 'var(--color-ink-secondary)', marginBottom: '6px' }}>
                        {card.observation}
                      </p>
                      <p style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic', fontSize: '12px' }}>
                        {card.interpretation}
                      </p>
                    </div>

                    {/* Recommended Action */}
                    <div
                      style={{
                        borderTop: '1px solid var(--color-hairline)',
                        paddingTop: '10px',
                        marginTop: 'auto',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Recommended Action:
                      </span>
                      <p style={{ fontSize: '12.5px', color: 'var(--color-ink)', marginTop: '3px', lineHeight: 1.4 }}>
                        {card.recommended_attention}
                      </p>

                      {card.suggested_next_question && (
                        <button
                          onClick={() => handleCopyPrompt(card.suggested_next_question, idx)}
                          title="Click to copy suggested query"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            color: 'var(--color-ai-text)',
                            fontWeight: 500,
                            marginTop: '10px',
                            backgroundColor: 'var(--color-ai-subtle)',
                            border: '1px solid transparent',
                            borderRadius: 'var(--radius-sm)',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-ai)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        >
                          {copiedIdx === idx ? (
                            <Check size={12} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                          ) : (
                            <HelpCircle size={12} style={{ flexShrink: 0 }} />
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {copiedIdx === idx ? 'Query copied to clipboard!' : `Ask Assistant: "${card.suggested_next_question}"`}
                          </span>
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
