export interface FileMetadata {
  filename: string;
  file_size_bytes: number;
  file_size_mb: number;
  extension: string;
  delimiter: string;
  encoding: string;
  row_count: number;
  column_count: number;
  estimated_memory_kb: number;
}

export interface CleaningAuditItem {
  step: string;
  column: string;
  action: string;
}

export interface CleaningSummary {
  audit_log: CleaningAuditItem[];
  rows_after: number;
  cols_after: number;
}

export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  count: number;
  frequency: number;
  label: string;
}

export interface NumericStats {
  mean: number;
  median: number;
  std_dev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  skewness: number;
  kurtosis: number;
  skewness_label: string;
  kurtosis_label: string;
  skewness_explanation: string;
  kurtosis_explanation: string;
  outlier_count: number;
  outlier_percent: number;
  outlier_sample: number[];
  lower_fence: number;
  upper_fence: number;
  cv: number | null;
  zero_count: number;
  negative_count: number;
  sum_total: number;
  null_count: number;
  null_percent: number;
  histogram: HistogramBin[];
  distribution_shape: string;
  n_valid: number;
}

export interface TopValueItem {
  value: string;
  count: number;
  percent: number;
}

export interface CategoricalStats {
  unique_count: number;
  cardinality_ratio: number;
  cardinality_label: string;
 mode: string;
  mode_count: number;
  mode_percent: number;
  top_values: TopValueItem[];
  rare_values: TopValueItem[];
  rare_value_count: number;
  length_min: number;
  length_max: number;
  length_mean: number;
  null_count: number;
  null_percent: number;
  n_valid: number;
}

export interface DateStats {
  earliest: string;
  latest: string;
  range_label: string;
  total_days: number;
  unique_dates: number;
  avg_frequency_days: number;
  has_gaps: boolean;
  largest_gap_days: number;
  granularity: string;
  year_range: number[];
  null_count: number;
  null_percent: number;
  n_valid: number;
}

export interface ColumnProfile {
  name: string;
  index: number;
  type: string;
  display_type: string;
  null_count: number;
  null_percent: number;
  sample_values: string[];
  completeness_percent: number;
  numeric_stats: NumericStats | null;
  categorical_stats: CategoricalStats | null;
  date_stats: DateStats | null;
}

export interface QualityFlag {
  code: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  business_impact: string;
  affected_count: number;
  pandas_fix: string;
}

export interface FlagSeverityCount {
  critical: number;
  warning: number;
  info: number;
}

export interface QualityReport {
  overall_score: number;
  score_label: string;
  score_color: string;
  duplicate_row_count: number;
  duplicate_row_percent: number;
  total_null_count: number;
  total_null_percent: number;
  flag_count_by_severity: FlagSeverityCount;
  flags_by_column: Record<string, QualityFlag[]>;
  all_flags_sorted: QualityFlag[];
}

export interface CorrelationPair {
  col1: string;
  col2: string;
  coefficient: number;
  strength: string;
  direction: string;
  explanation: string;
  is_multicollinear: boolean;
}

export interface CorrelationReport {
  matrix: Record<string, Record<string, number | null>>;
  top_pairs: CorrelationPair[];
}

export interface ForecastPeriod {
  period: number;
  date: string;
  predicted_value: number;
  label: string;
}

export interface ActualVsPredicted {
  actual: number;
  predicted: number;
}

export interface PredictionReport {
  task_type: 'regression' | 'classification' | null;
  target_column: string | null;
  best_model: string | null;
  accuracy: number | null;
  r2_score: number | null;
  r2_percent: number | null;
  mae: number | null;
  rmse: number | null;
  feature_importances: Record<string, number>;
  classes: string[] | null;
  actual_vs_predicted: ActualVsPredicted[] | null;
  trend_forecast: ForecastPeriod[] | null;
  test_size: number | null;
  train_size: number | null;
  feature_cols_used: string[];
  business_interpretation: string | null;
  error: string | null;
}

export interface InsightCard {
  title: string;
  observation: string;
  interpretation: string;
  why_it_matters: string;
  business_meaning: string;
  recommended_attention: string;
  suggested_next_question: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'quality' | 'distribution' | 'correlation' | 'trend' | 'anomaly' | 'structure';
}

export interface AIStoryReport {
  insights: InsightCard[];
  suggested_questions: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  history: ChatMessage[];
  message: string;
  analysis_summary: any;
  session_id?: string;
}

export interface ChatResponse {
  response: string;
  follow_up_questions: string[];
}

export interface UploadResponse {
  metadata: FileMetadata;
  cleaning: CleaningSummary;
  column_profiles: ColumnProfile[];
  quality: QualityReport;
  correlations: CorrelationReport;
  prediction: PredictionReport;
  session_id?: string;
}
