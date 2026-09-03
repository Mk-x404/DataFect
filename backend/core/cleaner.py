import pandas as pd
import numpy as np
from typing import Dict, List, Any

def run_cleaning_pipeline(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Full automated data cleaning pipeline. Returns cleaned df + audit log.
    All cleaning is non-destructive: original is never mutated.
    """
    if df is None or df.empty or len(df.columns) == 0:
        return {
            'cleaned_df': pd.DataFrame() if df is None else df.copy(),
            'audit_log': [],
            'rows_after': 0 if df is None else len(df),
            'cols_after': 0 if df is None else len(df.columns)
        }

    df = df.copy()
    audit = []

    # ── Step 1: Strip whitespace from all string columns & Standardize Nulls
    str_cols = df.select_dtypes(include='object').columns
    null_representations = {'nan', 'None', '', 'NULL', 'null', 'N/A', 'n/a', 'NA', '#N/A', 'na', 'none', '-'}
    
    for col in str_cols:
        before_len_sum = df[col].astype(str).str.len().sum()
        # strip whitespace
        df[col] = df[col].astype(str).str.strip()
        # map common null representation strings to real NaN
        df[col] = df[col].replace({rep: np.nan for rep in null_representations})
        # replace standard representation variants
        df[col] = df[col].replace({'nan': np.nan, 'None': np.nan, '': np.nan, '<NA>': np.nan})
        
        after_len_sum = df[col].astype(str).str.len().sum()
        if before_len_sum != after_len_sum:
            audit.append({
                'step': 'Formatting & Missing Data',
                'column': col,
                'action': 'Standardized text formatting and filled missing blank spaces so they are recognized correctly.'
            })

    # ── Step 1.5: Remove accidental repeated header rows (e.g. from concatenated CSV files)
    if len(df.columns) > 1 and len(df) > 0:
        is_dup_header = pd.Series(True, index=df.index)
        for col in df.columns:
            is_dup_header &= (df[col].astype(str).str.strip().str.lower() == str(col).strip().lower())
        if is_dup_header.any():
            num_dup_headers = int(is_dup_header.sum())
            df = df[~is_dup_header].reset_index(drop=True)
            audit.append({
                'step': 'Duplicate Headers Removed',
                'column': 'ALL',
                'action': f'Removed {num_dup_headers} repeated header rows embedded inside the dataset.'
            })

    # ── Step 2: Remove completely empty rows and columns
    empty_rows_before = len(df)
    df = df.dropna(how='all')
    if len(df) < empty_rows_before:
        audit.append({
            'step': 'Empty Row Removal',
            'column': 'ALL',
            'action': f'Removed {empty_rows_before - len(df)} rows that contained absolutely no data.'
        })

    empty_cols = [col for col in df.columns if df[col].isna().all()]
    if empty_cols:
        df = df.drop(columns=empty_cols)
        audit.append({
            'step': 'Empty Column Removal',
            'column': ', '.join(empty_cols),
            'action': f'Removed {len(empty_cols)} columns that were completely blank: {", ".join(empty_cols)}.'
        })

    # ── Step 3: Smart type inference — attempt numeric coercion
    for col in list(df.select_dtypes(include='object').columns):
        non_null_s = df[col].dropna()
        if len(non_null_s) == 0:
            continue
        
        coerced = pd.to_numeric(df[col], errors='coerce')
        success_rate = coerced.notna().sum() / len(non_null_s)
        
        if success_rate >= 0.85:
            # Replaced with coerced values
            df[col] = coerced
            audit.append({
                'step': 'Converted Text to Numbers',
                'column': col,
                'action': f'Successfully identified and converted {success_rate*100:.1f}% of values into proper numbers for calculation.'
            })

    # ── Step 4: Smart datetime parsing
    for col in list(df.select_dtypes(include='object').columns):
        non_null_s = df[col].dropna()
        if len(non_null_s) == 0:
            continue
        
        try:
            # FAST PATH: Try parsing just 100 random samples first
            sample = non_null_s.sample(min(100, len(non_null_s)))
            sample_parsed = pd.to_datetime(sample, errors='coerce')
            if sample_parsed.notna().sum() / len(sample) < 0.5:
                continue # Skip full parsing if sample clearly fails
                
            # Let pandas infer format on full column if sample looks promising
            parsed = pd.to_datetime(df[col], errors='coerce')
            success_rate = parsed.notna().sum() / len(non_null_s)
            if success_rate >= 0.80:
                df[col] = parsed
                audit.append({
                    'step': 'Date Formatting',
                    'column': col,
                    'action': f'Recognized dates and standardized their format ({success_rate*100:.1f}% values parsed).'
                })
        except Exception:
            pass

    # ── Step 5: Case normalization for low-cardinality categoricals
    for col in df.select_dtypes(include='object').columns:
        non_null_s = df[col].dropna()
        if len(non_null_s) == 0:
            continue
            
        unique_count = non_null_s.nunique()
        total = len(non_null_s)
        
        if unique_count / total < 0.1:  # Low cardinality
            # Check if converting to Title Case resolves casing variations
            unique_lower = non_null_s.str.lower().nunique()
            if unique_lower < unique_count:
                before_vals = unique_count
                df[col] = df[col].astype(str).str.strip().str.title()
                df[col] = df[col].replace({'Nan': np.nan, 'None': np.nan})
                audit.append({
                    'step': 'case_normalize',
                    'column': col,
                    'action': f'Fixed inconsistent upper/lower casing, reducing distinct values from {before_vals} to {df[col].nunique()}.'
                })

    # ── Step 6: Remove exact duplicate rows
    dupe_count = df.duplicated().sum()
    if dupe_count > 0:
        df = df.drop_duplicates().reset_index(drop=True)
        audit.append({
            'step': 'deduplication',
            'column': 'ALL',
            'action': f'Removed {dupe_count} exact duplicate rows to prevent double-counting in your analysis.'
        })

    # ── Step 7: Fix suspicious negative values in obviously non-negative columns
    obviously_positive_keywords = ['age', 'price', 'cost', 'revenue', 'salary', 'quantity', 'count', 'amount', 'size', 'weight', 'height', 'distance']
    for col in df.select_dtypes(include='number').columns:
        if any(kw in str(col).lower() for kw in obviously_positive_keywords):
            neg_mask = df[col] < 0
            neg_count = neg_mask.sum()
            # If negatives exist and represent less than 5% of rows, they are likely typos
            if neg_count > 0 and neg_count < len(df) * 0.05:
                df.loc[neg_mask, col] = np.nan
                audit.append({
                    'step': 'Suspicious Data Check',
                    'column': col,
                    'action': f'Cleared {neg_count} impossible negative values (likely typos) from this field.'
                })

    return {
        'cleaned_df': df,
        'audit_log': audit,
        'rows_after': len(df),
        'cols_after': len(df.columns)
    }
