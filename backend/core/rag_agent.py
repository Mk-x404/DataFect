import os
import re
import json
import requests
import pandas as pd
from typing import Optional

def fast_dataframe_query(df: pd.DataFrame, question: str) -> Optional[str]:
    """
    Direct in-memory pandas query executor for sub-5ms quantitative answers.
    Answers direct questions regarding rows, columns, averages, max, min, sums, nulls, rankings, and sample rows.
    """
    if df is None or df.empty:
        return None

    # Defense: Sanitize untrusted query
    clean_q = question.strip()[:600].replace("```", "")
    q_lower = clean_q.lower()
    
    # 1. Row count / shape queries
    if any(phrase in q_lower for phrase in ['how many rows', 'row count', 'number of rows', 'total rows', 'how many records', 'dataset size', 'shape of']):
        return f"The dataset contains **{len(df):,}** rows and **{len(df.columns)}** columns."

    # 2. Columns list query
    if any(phrase in q_lower for phrase in ['what are the columns', 'list the columns', 'column names', 'which columns', 'show columns', 'all columns']):
        cols_formatted = ", ".join([f"`{c}`" for c in df.columns[:30]])
        more = f" *(and {len(df.columns) - 30} more)*" if len(df.columns) > 30 else ""
        return f"The dataset contains **{len(df.columns)}** columns:\n\n{cols_formatted}{more}"

    # 3. Missing values query
    if any(phrase in q_lower for phrase in ['missing values', 'null values', 'empty values', 'how many nulls', 'any missing', 'null count']):
        nulls = df.isnull().sum()
        cols_with_nulls = nulls[nulls > 0].sort_values(ascending=False)
        if cols_with_nulls.empty:
            return "Great news: there are **zero missing values** across all columns in this dataset."
        report_lines = [f"- `{col}`: **{count:,}** missing ({count/len(df)*100:.1f}%)" for col, count in cols_with_nulls.head(8).items()]
        return "Here are the columns with missing entries:\n\n" + "\n".join(report_lines)

    # 4. Duplicate rows query
    if any(phrase in q_lower for phrase in ['duplicates', 'duplicate rows', 'how many dupes', 'any duplicates']):
        dupe_count = int(df.duplicated().sum())
        if dupe_count == 0:
            return "No duplicate rows were detected in the dataset. All records are unique."
        return f"Found **{dupe_count:,}** duplicate rows ({dupe_count/len(df)*100:.1f}% of total records)."

    # 5. Top-N / Bottom-N Rankings (e.g., "top 5 movies by rating", "lowest 3 budget", "highest 5")
    ranking_match = re.search(r'(top|highest|bottom|lowest)\s+(\d+)\s*(?:by|in|for|of)?\s*([a-zA-Z0-9_\s]*)', q_lower)
    if ranking_match:
        direction = ranking_match.group(1)
        n_str = ranking_match.group(2)
        n = min(int(n_str), 15)
        target_hint = ranking_match.group(3).strip()
        
        num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        sort_col = None
        if target_hint:
            clean_hint = re.sub(r'[^a-z0-9]', '', target_hint)
            for c in df.columns:
                c_clean = re.sub(r'[^a-z0-9]', '', str(c).lower())
                if clean_hint and (clean_hint in c_clean or c_clean in clean_hint):
                    sort_col = c
                    break

        if not sort_col and num_cols:
            sort_col = num_cols[0]

        if sort_col and sort_col in df.columns and pd.api.types.is_numeric_dtype(df[sort_col]):
            ascending = direction in ['bottom', 'lowest']
            sub_df = df.sort_values(by=sort_col, ascending=ascending).head(n)
            
            # Select title/name column if available for context
            text_cols = [c for c in df.columns if (pd.api.types.is_string_dtype(df[c]) or df[c].dtype == object) and c != sort_col]
            display_cols = [text_cols[0]] if text_cols else []
            display_cols.append(sort_col)
            
            rows_md = [f"| Rank | {' | '.join(display_cols)} |", f"|---|{'---|'*len(display_cols)}"]
            for idx, (_, row) in enumerate(sub_df.iterrows(), 1):
                vals = []
                for c in display_cols:
                    v = row[c]
                    if isinstance(v, (int, float)):
                        vals.append(f"**{v:,.2f}**")
                    else:
                        vals.append(str(v).replace("|", "-")[:35])
                rows_md.append(f"| #{idx} | {' | '.join(vals)} |")
            
            dir_label = "Highest" if not ascending else "Lowest"
            return f"Here are the **{dir_label} {n} records** ranked by `{sort_col}`:\n\n" + "\n".join(rows_md)

    # 6. Search for specific column in question
    matched_col = None
    sorted_cols = sorted(df.columns, key=lambda c: len(str(c)), reverse=True)
    for col in sorted_cols:
        col_str = str(col).lower()
        col_clean = re.sub(r'[^a-z0-9]', '', col_str)
        q_clean = re.sub(r'[^a-z0-9]', '', q_lower)
        if col_clean and (col_clean in q_clean or col_str in q_lower):
            matched_col = col
            break

    # If column was found, calculate the appropriate metric
    if matched_col is not None:
        series = df[matched_col]
        is_num = pd.api.types.is_numeric_dtype(series)

        # Average / Mean
        if any(w in q_lower for w in ['average', 'mean', 'avg']):
            if is_num:
                mean_val = series.mean()
                median_val = series.median()
                std_val = series.std()
                q1 = series.quantile(0.25)
                q3 = series.quantile(0.75)
                iqr = q3 - q1
                outliers = int(((series < (q1 - 1.5 * iqr)) | (series > (q3 + 1.5 * iqr))).sum())
                return (
                    f"### Statistical Profile: `{matched_col}`\n\n"
                    f"- **Mean (Average)**: **{mean_val:,.2f}**\n"
                    f"- **Median**: **{median_val:,.2f}**\n"
                    f"- **Standard Deviation**: **{std_val:,.2f}**\n"
                    f"- **IQR Spread (Q1–Q3)**: **{q1:,.2f}** to **{q3:,.2f}**\n"
                    f"- **Tukey Outliers**: **{outliers:,}** records ({outliers/len(df)*100:.1f}%)\n\n"
                    f"*{'Mean is substantially higher than median, indicating right-skewness driven by high-value outliers.' if mean_val > median_val * 1.1 else 'Mean and median are well-balanced, indicating a symmetrical distribution.'}*"
                )
            else:
                mode_val = series.mode().iloc[0] if not series.empty else "N/A"
                cnt = int((series == mode_val).sum())
                return f"`{matched_col}` is a categorical/text feature. Its dominant entry is **'{mode_val}'**, appearing **{cnt:,}** times ({cnt/len(df)*100:.1f}%)."

        # Maximum / Highest / Top
        if any(w in q_lower for w in ['highest', 'maximum', 'max', 'most', 'greatest', 'peak', 'top']):
            if is_num:
                max_val = series.max()
                text_cols = [c for c in df.columns if (pd.api.types.is_string_dtype(df[c]) or df[c].dtype == object) and c != matched_col]
                title_col = text_cols[0] if text_cols else None
                if title_col and not df.empty:
                    top_matches = df.loc[series == max_val]
                    if not top_matches.empty:
                        top_row = top_matches.iloc[0]
                        return f"The maximum value for `{matched_col}` is **{max_val:,.2f}**, associated with `{title_col}`: **{top_row[title_col]}**."
                return f"The maximum value for `{matched_col}` is **{max_val:,.2f}**."
            else:
                val_counts = series.value_counts()
                top_name = val_counts.index[0] if not val_counts.empty else "N/A"
                top_freq = val_counts.iloc[0] if not val_counts.empty else 0
                return f"The most frequent value in `{matched_col}` is **'{top_name}'**, occurring **{top_freq:,}** times ({top_freq/len(df)*100:.1f}% of records)."

        # Minimum / Lowest / Smallest
        if any(w in q_lower for w in ['lowest', 'minimum', 'min', 'least', 'smallest', 'bottom']):
            if is_num:
                min_val = series.min()
                return f"The minimum (lowest) value for `{matched_col}` is **{min_val:,.2f}**."
            else:
                val_counts = series.value_counts()
                least_name = val_counts.index[-1] if not val_counts.empty else "N/A"
                return f"The least frequent value in `{matched_col}` is **'{least_name}'**."

        # Sum / Total
        if any(w in q_lower for w in ['total', 'sum', 'overall']):
            if is_num:
                return f"The sum total of `{matched_col}` across all {len(df):,} rows is **{series.sum():,.2f}**."
            return f"Cannot compute a numerical sum for `{matched_col}` because it contains text/categorical values."

        # Unique / Categories
        if any(w in q_lower for w in ['unique', 'distinct', 'categories', 'different']):
            n_uniq = series.nunique()
            samples = series.dropna().unique()[:5]
            sample_str = ", ".join([f"'{s}'" for s in samples])
            return f"`{matched_col}` contains **{n_uniq:,}** distinct unique values. Common samples: {sample_str}."

    return None

def query_dataframe_agent(df: pd.DataFrame, question: str) -> str:
    """
    Intelligent tabular query router.
    Evaluates in-memory calculations first; if open-ended, passes to narrator.
    """
    instant_answer = fast_dataframe_query(df, question)
    if instant_answer:
        return instant_answer

    # If not a direct math query, return empty string so narrator's full LLM prompt handles it
    return ""
