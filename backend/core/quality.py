import pandas as pd
import numpy as np
from typing import Dict, List, Any

def compute_quality_flags(column_profiles: List[Dict], df: pd.DataFrame) -> Dict[str, List[Dict]]:
    """
    Generate quality audit flags for each column based on calculated profile statistics.
    """
    flags_by_col = {}
    if not column_profiles:
        return flags_by_col

    for profile in (column_profiles or []):
        if not profile or not isinstance(profile, dict):
            continue
        col = profile.get('name', 'Unknown')
        flags = []
        null_pct = profile.get('null_percent') or 0

        # ── Null / Missing Data Flags ──
        if null_pct > 50:
            flags.append({
                'code': 'CRITICAL_MISSING',
                'severity': 'critical',
                'message': f"About {null_pct:.1f}% of the values in this column are missing.",
                'business_impact': "When most of a column is empty, it becomes unreliable for analysis or prediction. We recommend dropping it unless it is absolutely essential.",
                'affected_count': int(profile.get('null_count', 0)),
                'pandas_fix': f"# Recommended: Drop this column if it isn't business-critical\ndf = df.drop(columns=['{col}'])\n# OR impute with a constant default value\ndf['{col}'] = df['{col}'].fillna('Unknown')",
            })
        elif null_pct > 20:
            flags.append({
                'code': 'HIGH_MISSING',
                'severity': 'warning',
                'message': f"Roughly {null_pct:.1f}% of the values are missing.",
                'business_impact': "A high number of blank fields can bias averages, sums, and other calculations. You may want to fill in the blanks or exclude these rows.",
                'affected_count': int(profile.get('null_count', 0)),
                'pandas_fix': f"# Recommended: Fill missing values with median or mode\nmedian_val = df['{col}'].median()\ndf['{col}'] = df['{col}'].fillna(median_val)",
            })
        elif null_pct > 5:
            flags.append({
                'code': 'MODERATE_MISSING',
                'severity': 'info',
                'message': f"A small portion ({null_pct:.1f}%) of values are missing.",
                'business_impact': "This won't completely break your analysis, but it's good practice to handle blank fields before building charts or models.",
                'affected_count': int(profile.get('null_count', 0)),
                'pandas_fix': f"# Impute using forward fill or mode\nmode_val = df['{col}'].mode()[0] if not df['{col}'].mode().empty else None\ndf['{col}'] = df['{col}'].fillna(mode_val)",
            })

        # ── Numeric-Specific Flags ──
        if profile.get('numeric_stats'):
            ns = profile['numeric_stats']
            outlier_pct = ns.get('outlier_percent') or 0.0
            
            # Constant column
            if ns.get('variance', 1.0) == 0.0 or ns.get('std_dev', 1.0) == 0.0:
                flags.append({
                    'code': 'CONSTANT_COLUMN',
                    'severity': 'critical',
                    'message': "Every single row in this column contains the exact same value.",
                    'business_impact': "Because the value never changes, this column provides no useful patterns or signals for analysis. It usually just adds unnecessary clutter.",
                    'affected_count': int(profile.get('n_valid', 0)),
                    'pandas_fix': f"df = df.drop(columns=['{col}'])",
                })
            
            # Outliers
            elif outlier_pct > 15:
                flags.append({
                    'code': 'OUTLIERS_EXTREME',
                    'severity': 'warning',
                    'message': f"About {outlier_pct:.1f}% of the values fall far outside the typical range.",
                    'business_impact': "These unusual values might be completely valid, but a large number of extremes can pull averages significantly higher or lower than normal.",
                    'affected_count': int(ns.get('outlier_count', 0)),
                    'pandas_fix': f"# Review first. If they are errors, you can cap them:\nQ1 = df['{col}'].quantile(0.25)\nQ3 = df['{col}'].quantile(0.75)\nIQR = Q3 - Q1\nlower = Q1 - 1.5 * IQR\nupper = Q3 + 1.5 * IQR\ndf['{col}'] = df['{col}'].clip(lower, upper)",
                })
            elif outlier_pct > 5:
                flags.append({
                    'code': 'OUTLIERS_HIGH',
                    'severity': 'info',
                    'message': f"A noticeable number ({outlier_pct:.1f}%) of values are unusually high or low.",
                    'business_impact': "These are likely genuine values, but they can slightly skew your charts and calculations. Review them before deciding whether to keep or cap them.",
                    'affected_count': int(ns.get('outlier_count', 0)),
                    'pandas_fix': f"# Option A: Cap outlier values at the IQR fences\nQ1 = df['{col}'].quantile(0.25)\nQ3 = df['{col}'].quantile(0.75)\nIQR = Q3 - Q1\nlower = Q1 - 1.5 * IQR\nupper = Q3 + 1.5 * IQR\ndf['{col}'] = df['{col}'].clip(lower, upper)",
                })

            # Negative values in positive-only columns
            if ns.get('negative_count', 0) > 0:
                # Check name
                obviously_positive = ['age', 'price', 'cost', 'revenue', 'salary', 'quantity', 'count', 'amount', 'size', 'weight', 'height', 'distance']
                if any(kw in str(col).lower() for kw in obviously_positive):
                    flags.append({
                        'code': 'SUSPICIOUS_NEGATIVES',
                        'severity': 'warning',
                        'message': f"Found {ns['negative_count']} negative values in what seems to be a positive-only column.",
                        'business_impact': "Prices, ages, or physical counts are rarely negative. These might be data entry errors or placeholders that should be investigated.",
                        'affected_count': int(ns['negative_count']),
                        'pandas_fix': f"# Replace negative numbers with NaN to review them\ndf.loc[df['{col}'] < 0, '{col}'] = np.nan",
                    })

            # Skewness
            skew = ns.get('skewness', 0.0)
            if abs(skew) > 2.0:
                min_val = ns.get('min', 0)
                pandas_transform = f"import numpy as np\ndf['{col}_logged'] = np.log1p(df['{col}'])" if min_val >= 0 else f"from scipy.stats import yeojohnson\ndf['{col}_transformed'], _ = yeojohnson(df['{col}'].fillna(df['{col}'].median()))"
                flags.append({
                    'code': 'SKEWED_EXTREME',
                    'severity': 'info',
                    'message': "The values are heavily concentrated on one side of the range.",
                    'business_impact': "Most values are grouped at one end, with a few trailing off very far away. This unevenness can make some prediction methods less accurate.",
                    'affected_count': int(profile.get('n_valid', 0)),
                    'pandas_fix': f"# Apply a mathematical transformation to balance the distribution\n{pandas_transform}",
                })

        # ── Categorical-Specific Flags ──
        if profile.get('categorical_stats'):
            cs = profile['categorical_stats']
            mode_pct = cs.get('mode_percent', 0.0)
            
            # Near-constant column
            if mode_pct > 95 and cs.get('unique_count', 0) > 1:
                flags.append({
                    'code': 'NEAR_CONSTANT',
                    'severity': 'warning',
                    'message': f"Almost all rows ({mode_pct:.1f}%) contain the exact same value: '{cs.get('mode', '')}'.",
                    'business_impact': "Since this column rarely changes, it doesn't offer much helpful variation for finding patterns or making predictions.",
                    'affected_count': int(cs.get('mode_count', 0)),
                    'pandas_fix': f"# Create a binary flag indicating whether the value is the dominant class\ndf['{col}_is_{str(cs.get('mode', '')).lower().replace(' ', '_')}'] = (df['{col}'] == '{cs.get('mode', '')}').astype(int)\ndf = df.drop(columns=['{col}'])",
                })

        flags_by_col[col] = flags

    return flags_by_col

def compute_quality_score(df: pd.DataFrame, column_profiles: List[Dict], flags_by_col: Dict) -> Dict[str, Any]:
    """
    Compute overall data quality score (0–100) and compile all flags.
    """
    if df is None or df.empty or df.shape[1] == 0:
        return {
            'overall_score': 100,
            'score_label': 'N/A',
            'score_color': '#2ed573',
            'duplicate_row_count': 0,
            'duplicate_row_percent': 0.0,
            'total_null_count': 0,
            'total_null_percent': 0.0,
            'flag_count_by_severity': {'critical': 0, 'warning': 0, 'info': 0},
            'flags_by_column': flags_by_col or {},
            'all_flags_sorted': []
        }

    total_cells = df.shape[0] * df.shape[1]
    null_pct = 100 * df.isna().sum().sum() / total_cells if total_cells > 0 else 0.0
    
    dup_count = int(df.duplicated().sum()) if len(df) > 0 else 0
    dup_pct = 100 * dup_count / max(len(df), 1)

    flags_dict = flags_by_col or {}
    all_flags = [f for flags in flags_dict.values() if flags for f in flags if f]
    
    # Track which columns are affected so we can set flags in schemas
    formatted_flags = []
    for col, flags in flags_dict.items():
        for f in (flags or []):
            if isinstance(f, dict):
                f_copy = f.copy()
                f_copy['column_name'] = col  # inject column context
                formatted_flags.append(f_copy)

    # Deduced score logic
    critical_count = sum(1 for f in all_flags if f['severity'] == 'critical')
    warning_count = sum(1 for f in all_flags if f['severity'] == 'warning')
    info_count = sum(1 for f in all_flags if f['severity'] == 'info')

    score = 100.0
    score -= min(40.0, null_pct * 1.0)
    score -= min(20.0, dup_pct * 0.8)
    score -= critical_count * 10
    score -= warning_count * 4
    score -= info_count * 1
    score = max(0, min(100, int(round(score))))

    # Quality classification
    if score >= 85:
        label, color = 'Excellent', '#2ed573'
    elif score >= 70:
        label, color = 'Good', '#43e97b'
    elif score >= 50:
        label, color = 'Fair', '#ffa502'
    elif score >= 30:
        label, color = 'Poor', '#ff6584'
    else:
        label, color = 'Critical', '#ff4757'

    # Format the flags sorting order: critical first, then warning, then info
    severity_order = {'critical': 0, 'warning': 1, 'info': 2}
    sorted_flags = sorted(formatted_flags, key=lambda x: severity_order.get(x['severity'], 3))

    return {
        'overall_score': score,
        'score_label': label,
        'score_color': color,
        'duplicate_row_count': dup_count,
        'duplicate_row_percent': round(dup_pct, 2),
        'total_null_count': int(df.isna().sum().sum()),
        'total_null_percent': round(null_pct, 2),
        'flag_count_by_severity': {
            'critical': critical_count,
            'warning': warning_count,
            'info': info_count
        },
        'flags_by_column': flags_by_col,
        'all_flags_sorted': sorted_flags
    }
