import pandas as pd
import numpy as np
from scipy import stats
from sklearn.ensemble import IsolationForest
from typing import Any, Dict, List, Optional

def detect_multivariate_anomalies(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Detect multivariate anomalies across all numeric columns using Isolation Forest.
    """
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) < 2:
        return {'status': 'skipped', 'reason': 'Requires at least 2 numeric columns for multivariate analysis'}
    
    clean_df = df[numeric_cols].dropna()
    if len(clean_df) < 50:
        return {'status': 'skipped', 'reason': 'Requires at least 50 complete numeric rows'}

    try:
        # Downsample for speed if dataset is very large
        if len(clean_df) > 5000:
            fit_df = clean_df.sample(5000, random_state=42)
        else:
            fit_df = clean_df

        # Use Isolation Forest to find anomalies (auto contamination) with parallelization
        iso = IsolationForest(contamination='auto', random_state=42, n_jobs=-1)
        # Fit on sample, predict on full to find actual indices
        iso.fit(fit_df)
        preds = iso.predict(clean_df)
        
        # -1 means anomaly, 1 means normal
        anomaly_indices = np.where(preds == -1)[0]
        anomaly_count = len(anomaly_indices)
        
        return {
            'status': 'success',
            'anomaly_count': int(anomaly_count),
            'anomaly_percent': round((anomaly_count / len(clean_df)) * 100, 2),
            'features_used': numeric_cols,
            'message': f"Detected {anomaly_count} multivariate anomalies across {len(numeric_cols)} dimensions."
        }
    except Exception as e:
        return {'status': 'error', 'reason': str(e)}

def detect_column_type(series: pd.Series) -> str:
    """
    Detect column type: boolean -> numeric -> datetime -> categorical -> text -> id -> mixed
    Numeric is checked BEFORE datetime to prevent pandas from coercing numbers
    (e.g. 5000.0) into year-5000 timestamps.
    """
    s = series.dropna()
    if len(s) == 0:
        return 'empty'

    # Boolean check
    if s.dtype == bool:
        return 'boolean'
    
    unique_str = set(s.astype(str).str.lower().unique())
    if unique_str.issubset({'true', 'false', 'yes', 'no', '1', '0', 'y', 'n'}):
        return 'boolean'

    # Numeric check — BEFORE datetime to prevent false date coercion
    if pd.api.types.is_numeric_dtype(s):
        # Only consider integer types with 'id'/'code' naming or strictly sequential unique integers as ID
        is_integer_type = pd.api.types.is_integer_dtype(s) or (s.dropna() % 1 == 0).all()
        col_name_lower = str(series.name).lower() if series.name is not None else ''
        has_id_name = any(kw in col_name_lower for kw in ['id', 'key', 'code', 'index', 'uuid'])
        unique_ratio = s.nunique() / len(s)
        
        if is_integer_type and (has_id_name or (unique_ratio > 0.98 and s.nunique() > 100)):
            return 'id'
        return 'numeric'

    # Datetime check (native datetime dtypes first)
    if pd.api.types.is_datetime64_any_dtype(s):
        return 'date'
    
    # Try parsing string/object columns to datetime — only for non-numeric types
    if pd.api.types.is_object_dtype(s) or pd.api.types.is_string_dtype(s):
        # Try numeric coercion first (catches "123", "45.6" stored as strings)
        try:
            coerced = pd.to_numeric(s, errors='coerce')
            if coerced.notna().sum() / len(s) > 0.8:
                unique_ratio = coerced.dropna().nunique() / len(coerced.dropna())
                if unique_ratio > 0.95 and coerced.dropna().nunique() > 100:
                    return 'id'
                return 'numeric'
        except Exception:
            pass

        # Try datetime parsing
        try:
            parsed = pd.to_datetime(s, errors='raise', format='mixed')
            return 'date'
        except Exception:
            pass

        # String-based classification
        unique_ratio = s.nunique() / len(s)
        avg_len = s.astype(str).str.len().mean()
        if unique_ratio > 0.90 and avg_len > 25:
            return 'text'
        if unique_ratio > 0.98:
            return 'id'
        return 'categorical'

    return 'mixed'

def percentile(sorted_vals: np.ndarray, p: float) -> float:
    """NIST linear interpolation method for percentiles using vectorized numpy."""
    if len(sorted_vals) == 0:
        return 0.0
    return float(np.percentile(sorted_vals, p, method='linear'))

def build_histogram(sorted_vals: np.ndarray, n_bins: int) -> List[Dict]:
    """Build histogram bins using Sturges' rule. Returns list of bin dicts."""
    if len(sorted_vals) == 0:
        return []
    min_v, max_v = sorted_vals[0], sorted_vals[-1]
    if min_v == max_v:
        return [{
            'bin_start': float(min_v), 
            'bin_end': float(max_v), 
            'count': len(sorted_vals), 
            'frequency': 1.0, 
            'label': f"{min_v:.2f}"
        }]

    bins = np.linspace(min_v, max_v, n_bins + 1)
    counts, edges = np.histogram(sorted_vals, bins=bins)
    total = len(sorted_vals)
    return [
        {
            'bin_start': round(float(edges[i]), 4),
            'bin_end': round(float(edges[i+1]), 4),
            'count': int(counts[i]),
            'frequency': round(float(counts[i] / total), 4),
            'label': f"{edges[i]:.2f} to {edges[i+1]:.2f}",
        }
        for i in range(len(counts))
    ]

def compute_numeric_stats(series: pd.Series, total_rows: int) -> Dict[str, Any]:
    """
    Compute full numeric statistics. Handles standard deviation = 0, skew/kurtosis edge cases.
    Safely coerces strings to numeric, dropping unparseable tokens without crashing.
    """
    clean_series = pd.to_numeric(series, errors='coerce').dropna()
    clean = clean_series.values.astype(float)
    n = len(clean)

    if n == 0:
        return {'error': 'No valid numeric values'}

    sorted_v = np.sort(clean)

    mean = float(np.mean(clean))
    median = float(np.median(clean))
    variance = float(np.var(clean, ddof=1)) if n > 1 else 0.0
    std_dev = float(np.sqrt(variance))

    q1 = percentile(sorted_v, 25)
    q3 = percentile(sorted_v, 75)
    iqr = q3 - q1

    # Tukey IQR fences for outliers
    lower_fence = q1 - 1.5 * iqr
    upper_fence = q3 + 1.5 * iqr
    outlier_vals = clean[(clean < lower_fence) | (clean > upper_fence)]

    # Pearson's moment skewness (bias-corrected)
    skewness = 0.0
    if n >= 3 and std_dev > 0:
        skewness = float(stats.skew(clean, bias=False))

    # Excess kurtosis (Fisher's excess, normal = 0), bias-corrected
    kurtosis = 0.0
    if n >= 4 and std_dev > 0:
        kurtosis = float(stats.kurtosis(clean, bias=False))

    # Sturges' rule for bin count
    n_bins = max(5, min(25, int(np.ceil(1 + 3.322 * np.log10(n)))))
    histogram = build_histogram(sorted_v, n_bins)

    # Distribution shape classification
    shape = 'normal'
    if abs(skewness) > 1.0:
        shape = 'highly-skewed'
    elif abs(skewness) > 0.5:
        shape = 'skewed'
    elif kurtosis > 2:
        shape = 'leptokurtic'
    elif kurtosis < -1:
        shape = 'platykurtic'
    
    # Check for bimodal distribution if there are at least two distinct peaks in histogram
    if len(histogram) >= 5:
        counts = [b['count'] for b in histogram]
        peaks = [i for i in range(1, len(counts)-1) if counts[i] > counts[i-1] and counts[i] > counts[i+1]]
        if len(peaks) >= 2:
            # Verify the peaks are separated and both contain significant counts
            max_count = max(counts)
            significant_peaks = [p for p in peaks if counts[p] > max_count * 0.20]
            if len(significant_peaks) >= 2:
                shape = 'bimodal'

    return {
        'mean': round(mean, 4),
        'median': round(median, 4),
        'std_dev': round(std_dev, 4),
        'variance': round(variance, 4),
        'min': round(float(sorted_v[0]), 4),
        'max': round(float(sorted_v[-1]), 4),
        'range': round(float(sorted_v[-1] - sorted_v[0]), 4),
        'q1': round(q1, 4),
        'q3': round(q3, 4),
        'iqr': round(iqr, 4),
        'p5':  round(percentile(sorted_v, 5), 4),
        'p10': round(percentile(sorted_v, 10), 4),
        'p25': round(q1, 4),
        'p50': round(median, 4),
        'p75': round(q3, 4),
        'p90': round(percentile(sorted_v, 90), 4),
        'p95': round(percentile(sorted_v, 95), 4),
        'p99': round(percentile(sorted_v, 99), 4),
        'skewness': round(skewness, 4),
        'kurtosis': round(kurtosis, 4),
        'skewness_label': (
            'symmetric' if abs(skewness) < 0.5 else
            'moderately right-skewed' if 0.5 <= skewness < 1.0 else
            'strongly right-skewed' if skewness >= 1.0 else
            'moderately left-skewed' if -1.0 < skewness <= -0.5 else
            'strongly left-skewed'
        ),
        'kurtosis_label': (
            'normal (mesokurtic)' if abs(kurtosis) < 1 else
            'heavy-tailed (leptokurtic)' if kurtosis > 0 else
            'light-tailed (platykurtic)'
        ),
        'skewness_explanation': _explain_skewness(skewness),
        'kurtosis_explanation': _explain_kurtosis(kurtosis),
        'outlier_count': int(len(outlier_vals)),
        'outlier_percent': round(100 * len(outlier_vals) / total_rows, 2),
        'outlier_sample': [round(float(v), 4) for v in sorted(outlier_vals)[:10]],
        'lower_fence': round(lower_fence, 4),
        'upper_fence': round(upper_fence, 4),
        'cv': round(abs(std_dev / mean), 4) if mean != 0 else None,
        'zero_count': int(np.sum(clean == 0)),
        'negative_count': int(np.sum(clean < 0)),
        'sum_total': round(float(np.sum(clean)), 4),
        'null_count': int(series.isna().sum()),
        'null_percent': round(100 * series.isna().sum() / len(series), 2),
        'histogram': histogram,
        'distribution_shape': shape,
        'n_valid': n,
    }

def _explain_skewness(s: float) -> str:
    if abs(s) < 0.5:
        return "The values are distributed fairly symmetrically around the center — showing no significant lean."
    if s >= 1.0:
        return "The values have a heavy right-lean, meaning most items cluster at the low end with a long tail of very high values pulling the average up."
    if s >= 0.5:
        return "The values lean slightly right, showing a moderate concentration of lower values and a few higher values."
    if s <= -1.0:
        return "The values have a heavy left-lean, meaning most items cluster at the high end with a long tail of very low values pulling the average down."
    return "The values lean slightly left, showing a moderate concentration of higher values and a few lower values."

def _explain_kurtosis(k: float) -> str:
    if abs(k) < 1.0:
        return "The concentration of extreme values resembles a normal bell curve, without an unusual concentration of outliers."
    if k > 2.0:
        return "The data has very heavy tails. Outliers and extreme values are significantly more common than expected in a normal distribution."
    if k > 0:
        return "The distribution is slightly peaked around the average, with moderate tail outliers."
    return "The distribution is flat, meaning values are spread out more uniformly with fewer extreme outliers."

def compute_categorical_stats(series: pd.Series, total_rows: int) -> Dict[str, Any]:
    """Compute categorical statistics with cardinality classification."""
    clean = series.dropna().astype(str)
    n = len(clean)
    if n == 0:
        return {'error': 'No valid values'}

    value_counts = clean.value_counts()
    unique_count = len(value_counts)
    cardinality_ratio = unique_count / total_rows

    top_values = [
        {'value': str(val), 'count': int(cnt), 'percent': round(100 * cnt / n, 2)}
        for val, cnt in value_counts.head(15).items()
    ]

    # Rare values (frequency < 1% of total rows)
    rare_threshold = max(1, total_rows * 0.01)
    rare_values = [
        {'value': str(val), 'count': int(cnt), 'percent': round(100 * cnt / n, 2)}
        for val, cnt in value_counts.items() if cnt < rare_threshold
    ]

    cardinality_label = (
        'binary' if unique_count == 2 else
        'constant' if unique_count == 1 else
        'low (categorical)' if cardinality_ratio < 0.05 else
        'medium' if cardinality_ratio < 0.20 else
        'high (likely free-text)' if cardinality_ratio < 0.80 else
        'identifier (near-unique)'
    )

    lengths = clean.str.len()

    return {
        'unique_count': unique_count,
        'cardinality_ratio': round(cardinality_ratio, 4),
        'cardinality_label': cardinality_label,
        'mode': str(value_counts.index[0]),
        'mode_count': int(value_counts.iloc[0]),
        'mode_percent': round(100 * value_counts.iloc[0] / n, 2),
        'top_values': top_values,
        'rare_values': rare_values[:10],
        'rare_value_count': len(rare_values),
        'length_min': int(lengths.min()) if len(lengths) > 0 else 0,
        'length_max': int(lengths.max()) if len(lengths) > 0 else 0,
        'length_mean': round(float(lengths.mean()), 2) if len(lengths) > 0 else 0.0,
        'null_count': int(series.isna().sum()),
        'null_percent': round(100 * series.isna().sum() / len(series), 2),
        'n_valid': n,
    }

def compute_date_stats(series: pd.Series) -> Dict[str, Any]:
    """Compute datetime stats and detect time intervals, gaps, and granularity."""
    clean = pd.to_datetime(series.dropna(), errors='coerce').dropna()
    if len(clean) == 0:
        return {'error': 'No valid dates'}

    sorted_dates = clean.sort_values()
    earliest = sorted_dates.iloc[0]
    latest = sorted_dates.iloc[-1]
    total_days = (latest - earliest).days
    unique_dates = clean.nunique()

    diffs = sorted_dates.diff().dt.days.dropna()
    median_diff = diffs.median() if len(diffs) > 0 else 0.0
    
    # Gap detection: a gap is defined as any transition that is > 3x the median time delta
    has_gaps = False
    largest_gap = 0
    if len(diffs) > 0 and median_diff > 0:
        large_diffs = diffs[diffs > median_diff * 3]
        if len(large_diffs) > 0:
            has_gaps = True
            largest_gap = int(diffs.max())

    def human_range(days: int) -> str:
        if days < 7: return f"{days} days"
        if days < 30: return f"{days // 7} weeks"
        if days < 365: return f"{days // 30} months"
        years = days // 365
        months = (days % 365) // 30
        return f"{years} year{'s' if years > 1 else ''}{', ' + str(months) + ' months' if months else ''}"

    # Granularity detection
    if median_diff < 0.04: granularity = 'hour'
    elif median_diff <= 1.5: granularity = 'day'
    elif median_diff <= 8: granularity = 'week'
    elif median_diff <= 32: granularity = 'month'
    elif median_diff <= 93: granularity = 'quarter'
    else: granularity = 'year'

    return {
        'earliest': str(earliest.date()),
        'latest': str(latest.date()),
        'range_label': human_range(total_days),
        'total_days': total_days,
        'unique_dates': int(unique_dates),
        'avg_frequency_days': round(total_days / max(unique_dates - 1, 1), 1),
        'has_gaps': has_gaps,
        'largest_gap_days': largest_gap,
        'granularity': granularity,
        'year_range': [int(earliest.year), int(latest.year)],
        'null_count': int(series.isna().sum()),
        'null_percent': round(100 * series.isna().sum() / len(series), 2),
        'n_valid': len(clean),
    }

def profile_all_columns(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Profile every column in the dataset. Returns a list of profiles."""
    if df is None or df.empty or len(df.columns) == 0:
        return []

    profiles = []
    total_rows = max(len(df), 1)

    for idx, col in enumerate(df.columns):
        series = df[col]
        col_type = detect_column_type(series)

        profile = {
            'name': str(col),
            'index': idx,
            'type': col_type,
            'display_type': {
                'numeric': 'Number',
                'categorical': 'Category',
                'date': 'Date/Time',
                'boolean': 'True/False',
                'text': 'Free Text',
                'id': 'Unique ID',
                'mixed': 'Mixed Types',
                'empty': 'Empty Column',
            }.get(col_type, col_type),
            'null_count': int(series.isna().sum()),
            'null_percent': round(100 * series.isna().sum() / len(series), 2) if len(series) > 0 else 0.0,
            'sample_values': [str(v) for v in series.dropna().head(5).tolist()],
            'completeness_percent': round(100 * series.notna().sum() / len(series), 2) if len(series) > 0 else 0.0,
        }

        if col_type == 'numeric':
            profile['numeric_stats'] = compute_numeric_stats(series, total_rows)
        elif col_type in ('categorical', 'text', 'id', 'boolean'):
            profile['categorical_stats'] = compute_categorical_stats(series, total_rows)
        elif col_type == 'date':
            profile['date_stats'] = compute_date_stats(series)

        profiles.append(profile)

    return profiles
