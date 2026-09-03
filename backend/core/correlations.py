import pandas as pd
import numpy as np
from typing import Dict, List, Any

def get_correlation_strength(r: float) -> str:
    abs_r = abs(r)
    if abs_r >= 0.85: return 'extremely strong'
    if abs_r >= 0.70: return 'strong'
    if abs_r >= 0.40: return 'moderate'
    if abs_r >= 0.15: return 'weak'
    return 'negligible'

def get_correlation_direction(r: float) -> str:
    if r > 0.05: return 'positive'
    if r < -0.05: return 'negative'
    return 'flat'

def generate_correlation_explanation(col1: str, col2: str, r: float, strength: str, direction: str) -> str:
    if direction == 'positive':
        return f"As '{col1}' increases, '{col2}' tends to increase as well. This indicates a {strength} positive relationship, suggesting a strong direct link."
    elif direction == 'negative':
        return f"As '{col1}' increases, '{col2}' tends to decrease. This indicates a {strength} negative relationship, suggesting an inverse link."
    else:
        return f"There is virtually no correlation between '{col1}' and '{col2}'. The values move independently of each other."

def compute_correlations(df: pd.DataFrame, column_profiles: List[Dict]) -> Dict[str, Any]:
    """
    Compute Pearson correlation matrix and output ranked top 10 correlated pairs.
    """
    if not column_profiles or df is None or df.empty:
        return {'matrix': {}, 'top_pairs': []}

    numeric_cols = [p['name'] for p in (column_profiles or []) if isinstance(p, dict) and p.get('type') == 'numeric' and p.get('name') in df.columns]
    
    if len(numeric_cols) < 2 or len(df) < 2:
        return {
            'matrix': {},
            'top_pairs': []
        }

    try:
        # Extract numeric array with coercion to float, imputing NaNs with column median to compute robust corrcoef
        numeric_df = df[numeric_cols].apply(pd.to_numeric, errors='coerce')
        # Fill NaNs with median or 0 so corrcoef doesn't degenerate to all NaNs
        filled_df = numeric_df.apply(lambda col: col.fillna(col.median() if not pd.isna(col.median()) else 0.0))
        data = filled_df.to_numpy(dtype=float)

        corr_matrix = np.corrcoef(data, rowvar=False)
        if corr_matrix.ndim < 2:
            return {'matrix': {}, 'top_pairs': []}

        # Format matrix for JSON output
        matrix = {}
        for i, col in enumerate(numeric_cols):
            matrix[col] = {}
            for j, other in enumerate(numeric_cols):
                val = corr_matrix[i, j]
                matrix[col][other] = round(float(val), 4) if not np.isnan(val) else None

        # Collect pairs (upper triangle only to avoid duplication)
        pairs = []
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                col1 = numeric_cols[i]
                col2 = numeric_cols[j]
                r = corr_matrix[i, j]
                
                if np.isnan(r):
                    continue

                r_val = float(r)
                strength = get_correlation_strength(r_val)
                direction = get_correlation_direction(r_val)
                explanation = generate_correlation_explanation(col1, col2, r_val, strength, direction)
                
                pairs.append({
                    'col1': col1,
                    'col2': col2,
                    'coefficient': round(r_val, 4),
                    'strength': strength,
                    'direction': direction,
                    'explanation': explanation,
                    'is_multicollinear': bool(abs(r_val) > 0.85)
                })

        # Sort pairs by absolute coefficient value
        sorted_pairs = sorted(pairs, key=lambda x: abs(x['coefficient']), reverse=True)
        top_pairs = sorted_pairs[:10]

        return {
            'matrix': matrix,
            'top_pairs': top_pairs
        }
    except Exception:
        return {'matrix': {}, 'top_pairs': []}
