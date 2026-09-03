from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class FileMetadata(BaseModel):
    filename: str
    file_size_bytes: int
    file_size_mb: float
    extension: str
    delimiter: str
    encoding: str
    row_count: int
    column_count: int
    estimated_memory_kb: float

class CleaningAuditItem(BaseModel):
    step: str
    column: str
    action: str

class CleaningSummary(BaseModel):
    audit_log: List[CleaningAuditItem]
    rows_after: int
    cols_after: int

class HistogramBin(BaseModel):
    bin_start: float
    bin_end: float
    count: int
    frequency: float
    label: str

class NumericStats(BaseModel):
    mean: float
    median: float
    std_dev: float
    variance: float
    min: float
    max: float
    range: float
    q1: float
    q3: float
    iqr: float
    p5: float
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float
    p95: float
    p99: float
    skewness: float
    kurtosis: float
    skewness_label: str
    kurtosis_label: str
    skewness_explanation: str
    kurtosis_explanation: str
    outlier_count: int
    outlier_percent: float
    outlier_sample: List[float]
    lower_fence: float
    upper_fence: float
    cv: Optional[float] = None
    zero_count: int
    negative_count: int
    sum_total: float
    null_count: int
    null_percent: float
    histogram: List[HistogramBin]
    distribution_shape: str
    n_valid: int

class TopValueItem(BaseModel):
    value: str
    count: int
    percent: float

class CategoricalStats(BaseModel):
    unique_count: int
    cardinality_ratio: float
    cardinality_label: str
    mode: str
    mode_count: int
    mode_percent: float
    top_values: List[TopValueItem]
    rare_values: List[TopValueItem]
    rare_value_count: int
    length_min: int
    length_max: int
    length_mean: float
    null_count: int
    null_percent: float
    n_valid: int

class DateStats(BaseModel):
    earliest: str
    latest: str
    range_label: str
    total_days: int
    unique_dates: int
    avg_frequency_days: float
    has_gaps: bool
    largest_gap_days: int
    granularity: str
    year_range: List[int]
    null_count: int
    null_percent: float
    n_valid: int

class ColumnProfile(BaseModel):
    name: str
    index: int
    type: str
    display_type: str
    null_count: int
    null_percent: float
    sample_values: List[str]
    completeness_percent: float
    numeric_stats: Optional[NumericStats] = None
    categorical_stats: Optional[CategoricalStats] = None
    date_stats: Optional[DateStats] = None

class QualityFlag(BaseModel):
    code: str
    severity: str
    message: str
    business_impact: str
    affected_count: int
    pandas_fix: str

class FlagSeverityCount(BaseModel):
    critical: int
    warning: int
    info: int

class QualityReport(BaseModel):
    overall_score: int
    score_label: str
    score_color: str
    duplicate_row_count: int
    duplicate_row_percent: float
    total_null_count: int
    total_null_percent: float
    flag_count_by_severity: FlagSeverityCount
    flags_by_column: Dict[str, List[QualityFlag]]
    all_flags_sorted: List[QualityFlag]

class CorrelationPair(BaseModel):
    col1: str
    col2: str
    coefficient: float
    strength: str
    direction: str
    explanation: str
    is_multicollinear: bool

class CorrelationReport(BaseModel):
    matrix: Dict[str, Dict[str, Optional[float]]]
    top_pairs: List[CorrelationPair]

class ForecastPeriod(BaseModel):
    period: int
    date: str
    predicted_value: float
    label: str

class ActualVsPredicted(BaseModel):
    actual: float
    predicted: float

class PredictionReport(BaseModel):
    task_type: Optional[str] = None
    target_column: Optional[str] = None
    best_model: Optional[str] = None
    accuracy: Optional[float] = None
    r2_score: Optional[float] = None
    r2_percent: Optional[float] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    feature_importances: Dict[str, float] = Field(default_factory=dict)
    classes: Optional[List[str]] = None
    actual_vs_predicted: Optional[List[ActualVsPredicted]] = None
    trend_forecast: Optional[List[ForecastPeriod]] = None
    test_size: Optional[int] = 0
    train_size: Optional[int] = 0
    feature_cols_used: List[str] = Field(default_factory=list)
    business_interpretation: Optional[str] = None
    error: Optional[str] = None

class InsightCard(BaseModel):
    title: str
    observation: str
    interpretation: str
    why_it_matters: str
    business_meaning: str
    recommended_attention: str
    suggested_next_question: str
    priority: str  # High, Medium, Low
    category: str  # quality, distribution, correlation, trend, anomaly, structure

class AIStoryReport(BaseModel):
    insights: List[InsightCard]
    suggested_questions: List[str]

class ChatMessage(BaseModel):
    role: str  # user, assistant
    content: str

class ChatRequest(BaseModel):
    history: List[ChatMessage]
    message: str
    analysis_summary: Dict[str, Any]
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    follow_up_questions: List[str]

class UploadResponse(BaseModel):
    metadata: FileMetadata
    cleaning: CleaningSummary
    column_profiles: List[ColumnProfile]
    quality: QualityReport
    correlations: CorrelationReport
    prediction: PredictionReport
    session_id: Optional[str] = None

class UserRegisterRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)

class UserLoginRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., max_length=128)

class UserProfileResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
