"""
DataLens v3.0 — Phase 1 Backend Verification Script
====================================================
Tests every core module with synthetic data to ensure:
  1. parser.py     — CSV/JSON parsing, encoding, delimiter detection
  2. cleaner.py    — All 7 cleaning steps + audit log
  3. profiler.py   — Numeric, categorical, date profiling
  4. quality.py    — Flag generation + score calculation
  5. correlations.py — Pearson matrix + top pairs
  6. predictor.py  — AutoML regression + classification
  7. narrator.py   — Fallback narrative generation (no API key needed)
  8. schemas.py    — Pydantic model validation
  9. main.py       — FastAPI app instantiation
"""

import sys
import os
import io
import json
import traceback
import numpy as np
import pandas as pd

# Ensure core package is importable
sys.path.insert(0, os.path.dirname(__file__))

PASS = "PASS"
FAIL = "FAIL"

results = []

def test(name, fn):
    try:
        fn()
        results.append((name, True, ""))
        print(f"  [{PASS}] {name}")
    except Exception as e:
        tb = traceback.format_exc()
        results.append((name, False, tb))
        print(f"  [{FAIL}] {name}")
        print(f"         {e}")
        print(f"         {tb[-300:]}")


# ─────────────────────────────────────────────
# Generate synthetic test data
# ─────────────────────────────────────────────
np.random.seed(42)
N = 200

synth_df = pd.DataFrame({
    'id':        range(1, N + 1),
    'date':      pd.date_range('2023-01-01', periods=N, freq='D'),
    'revenue':   np.random.normal(5000, 1200, N).round(2),
    'cost':      np.random.normal(3000, 800, N).round(2),
    'units':     np.random.randint(1, 500, N),
    'category':  np.random.choice(['Electronics', 'Clothing', 'Food', 'electronics', 'CLOTHING'], N),
    'region':    np.random.choice(['North', 'South', 'East', 'West'], N),
    'active':    np.random.choice(['Yes', 'No'], N),
    'notes':     ['Sample note ' + str(i) for i in range(N)],
})

# Inject known data quality issues
synth_df.loc[0:9, 'revenue'] = np.nan            # 5% nulls
synth_df.loc[10, 'revenue'] = -500                # suspicious negative
synth_df.loc[150:155, 'cost'] = np.nan            # some nulls
synth_df.loc[190, 'units'] = 99999                # outlier
synth_df = pd.concat([synth_df, synth_df.iloc[[0]]], ignore_index=True)  # duplicate row

# Save as CSV bytes
csv_buffer = io.StringIO()
synth_df.to_csv(csv_buffer, index=False)
csv_bytes = csv_buffer.getvalue().encode('utf-8')

# Also generate JSON bytes
json_bytes = synth_df.head(50).to_json(orient='records', date_format='iso').encode('utf-8')

print("=" * 60)
print("  DataFect v3.0 -- Phase 1 Backend Verification")
print("=" * 60)
print()

# --- 1. parser.py ---
print("-- 1. Parser --")

def test_csv_parse():
    from core.parser import parse_file
    df, meta = parse_file(csv_bytes, 'test_data.csv')
    assert isinstance(df, pd.DataFrame), "Result not a DataFrame"
    assert meta['row_count'] > 0, "No rows parsed"
    assert meta['column_count'] > 0, "No columns parsed"
    assert meta['encoding'], "No encoding detected"
    assert meta['delimiter'] == ',', f"Wrong delimiter: {meta['delimiter']}"

def test_json_parse():
    from core.parser import parse_file
    df, meta = parse_file(json_bytes, 'test_data.json')
    assert isinstance(df, pd.DataFrame), "JSON parse failed"
    assert meta['row_count'] > 0, "No rows from JSON"

def test_unsupported_file():
    from core.parser import parse_file
    try:
        parse_file(b"hello", "test.pdf")
        assert False, "Should have raised ValueError"
    except ValueError:
        pass

def test_file_too_large():
    from core.parser import parse_file
    try:
        fake_large = b"x" * (51 * 1024 * 1024)
        parse_file(fake_large, "big.csv")
        assert False, "Should have raised ValueError"
    except ValueError:
        pass

test("CSV parse + metadata", test_csv_parse)
test("JSON parse", test_json_parse)
test("Reject unsupported extension", test_unsupported_file)
test("Reject file > 50MB", test_file_too_large)

# --- 2. cleaner.py ---
print("\n-- 2. Cleaner --")

def test_cleaning_pipeline():
    from core.cleaner import run_cleaning_pipeline
    result = run_cleaning_pipeline(synth_df.copy())
    cdf = result['cleaned_df']
    audit = result['audit_log']
    
    assert isinstance(cdf, pd.DataFrame), "Cleaned df is not DataFrame"
    assert len(audit) > 0, "Audit log is empty -- no cleaning detected"
    assert result['rows_after'] > 0, "No rows after cleaning"
    assert result['cols_after'] > 0, "No cols after cleaning"

def test_duplicate_removal():
    from core.cleaner import run_cleaning_pipeline
    result = run_cleaning_pipeline(synth_df.copy())
    dedup_actions = [a for a in result['audit_log'] if a['step'] == 'deduplication']
    assert len(dedup_actions) > 0, "Duplicate row not caught"

def test_case_normalization():
    from core.cleaner import run_cleaning_pipeline
    result = run_cleaning_pipeline(synth_df.copy())
    case_actions = [a for a in result['audit_log'] if a['step'] == 'case_normalize']
    assert len(case_actions) > 0, "Case inconsistency in 'category' not normalized"

def test_cleaning_nondestructive():
    from core.cleaner import run_cleaning_pipeline
    original = synth_df.copy()
    _ = run_cleaning_pipeline(original)
    assert len(original) == len(synth_df), "Original df was mutated"

test("Full cleaning pipeline", test_cleaning_pipeline)
test("Duplicate row removal", test_duplicate_removal)
test("Category case normalization", test_case_normalization)
test("Non-destructive (original unchanged)", test_cleaning_nondestructive)

# --- 3. profiler.py ---
print("\n-- 3. Profiler --")

from core.cleaner import run_cleaning_pipeline
cleaned_result = run_cleaning_pipeline(synth_df.copy())
cleaned_df = cleaned_result['cleaned_df']

def test_profile_all():
    from core.profiler import profile_all_columns
    profiles = profile_all_columns(cleaned_df)
    assert len(profiles) == len(cleaned_df.columns), f"Expected {len(cleaned_df.columns)} profiles, got {len(profiles)}"
    
    # Every profile must have core keys
    for p in profiles:
        for key in ['name', 'index', 'type', 'display_type', 'null_count', 'null_percent', 'completeness_percent']:
            assert key in p, f"Missing key '{key}' in profile for column '{p.get('name', '?')}'"

def test_numeric_stats():
    from core.profiler import profile_all_columns
    profiles = profile_all_columns(cleaned_df)
    numeric_profiles = [p for p in profiles if p['type'] == 'numeric']
    assert len(numeric_profiles) > 0, "No numeric columns detected"
    
    for p in numeric_profiles:
        ns = p.get('numeric_stats')
        assert ns is not None, f"Numeric column '{p['name']}' missing numeric_stats"
        required = ['mean', 'median', 'std_dev', 'variance', 'min', 'max', 'q1', 'q3', 'iqr',
                     'skewness', 'kurtosis', 'outlier_count', 'histogram', 'distribution_shape',
                     'skewness_label', 'kurtosis_label', 'skewness_explanation', 'kurtosis_explanation']
        for key in required:
            assert key in ns, f"Missing numeric stat key '{key}' for column '{p['name']}'"
        
        # No NaN values in stats
        for key in ['mean', 'median', 'std_dev', 'variance']:
            val = ns[key]
            assert val is not None, f"None value for '{key}' in '{p['name']}'"
            assert not (isinstance(val, float) and np.isnan(val)), f"NaN value for '{key}' in '{p['name']}'"

def test_categorical_stats():
    from core.profiler import profile_all_columns
    profiles = profile_all_columns(cleaned_df)
    cat_profiles = [p for p in profiles if p['type'] == 'categorical']
    assert len(cat_profiles) > 0, "No categorical columns detected"
    
    for p in cat_profiles:
        cs = p.get('categorical_stats')
        assert cs is not None, f"Categorical column '{p['name']}' missing categorical_stats"
        for key in ['unique_count', 'cardinality_ratio', 'cardinality_label', 'mode', 'top_values']:
            assert key in cs, f"Missing categorical stat key '{key}' for '{p['name']}'"

def test_date_stats():
    from core.profiler import profile_all_columns
    profiles = profile_all_columns(cleaned_df)
    date_profiles = [p for p in profiles if p['type'] == 'date']
    assert len(date_profiles) > 0, "No date columns detected"
    
    for p in date_profiles:
        ds = p.get('date_stats')
        assert ds is not None, f"Date column '{p['name']}' missing date_stats"
        for key in ['earliest', 'latest', 'granularity', 'has_gaps', 'total_days']:
            assert key in ds, f"Missing date stat key '{key}' for '{p['name']}'"

def test_histogram_bins():
    from core.profiler import profile_all_columns
    profiles = profile_all_columns(cleaned_df)
    numeric_profiles = [p for p in profiles if p['type'] == 'numeric']
    for p in numeric_profiles:
        ns = p['numeric_stats']
        hist = ns['histogram']
        assert len(hist) > 0, f"Empty histogram for '{p['name']}'"
        for b in hist:
            assert 'bin_start' in b and 'bin_end' in b and 'count' in b, "Histogram bin missing keys"

def test_edge_case_empty_column():
    from core.profiler import profile_all_columns
    edge_df = pd.DataFrame({'empty_col': [np.nan] * 10, 'constant': [5] * 10})
    profiles = profile_all_columns(edge_df)
    assert len(profiles) == 2

def test_edge_case_single_value():
    from core.profiler import profile_all_columns
    edge_df = pd.DataFrame({'single': [42.0] * 50})
    profiles = profile_all_columns(edge_df)
    ns = profiles[0].get('numeric_stats', {})
    assert ns.get('std_dev') == 0.0 or ns.get('variance') == 0.0

test("Profile all columns", test_profile_all)
test("Numeric stats completeness", test_numeric_stats)
test("Categorical stats completeness", test_categorical_stats)
test("Date stats detection", test_date_stats)
test("Histogram bin generation", test_histogram_bins)
test("Edge case: all-null column", test_edge_case_empty_column)
test("Edge case: single-value column", test_edge_case_single_value)

# --- 4. quality.py ---
print("\n-- 4. Quality --")

from core.profiler import profile_all_columns
column_profiles = profile_all_columns(cleaned_df)

def test_quality_flags():
    from core.quality import compute_quality_flags
    flags = compute_quality_flags(column_profiles, cleaned_df)
    assert isinstance(flags, dict), "Flags not a dict"
    # Every column should have a key in the dict (even if empty list)
    for p in column_profiles:
        assert p['name'] in flags, f"Column '{p['name']}' missing from flags dict"

def test_quality_score():
    from core.quality import compute_quality_flags, compute_quality_score
    flags = compute_quality_flags(column_profiles, cleaned_df)
    report = compute_quality_score(cleaned_df, column_profiles, flags)
    
    assert 'overall_score' in report
    assert 0 <= report['overall_score'] <= 100, f"Score out of range: {report['overall_score']}"
    assert report['score_label'] in ('Excellent', 'Good', 'Fair', 'Poor', 'Critical')
    assert 'flag_count_by_severity' in report
    assert 'all_flags_sorted' in report
    
    # Verify sorting: critical first
    severities = [f['severity'] for f in report['all_flags_sorted']]
    order = {'critical': 0, 'warning': 1, 'info': 2}
    for i in range(len(severities) - 1):
        assert order[severities[i]] <= order[severities[i+1]], "Flags not sorted by severity"

def test_quality_degraded_data():
    from core.quality import compute_quality_flags, compute_quality_score
    from core.profiler import profile_all_columns
    # Create intentionally bad data
    bad_df = pd.DataFrame({
        'mostly_null': [np.nan] * 90 + [1.0] * 10,
        'constant': ['X'] * 100,
        'ok_col': range(100),
    })
    profiles = profile_all_columns(bad_df)
    flags = compute_quality_flags(profiles, bad_df)
    report = compute_quality_score(bad_df, profiles, flags)
    assert report['overall_score'] < 70, f"Bad data scored too high: {report['overall_score']}"

test("Quality flags generation", test_quality_flags)
test("Quality score range + sorting", test_quality_score)
test("Degraded data scores low", test_quality_degraded_data)

# --- 5. correlations.py ---
print("\n-- 5. Correlations --")

def test_correlation_matrix():
    from core.correlations import compute_correlations
    result = compute_correlations(cleaned_df, column_profiles)
    assert 'matrix' in result
    assert 'top_pairs' in result
    
    # Matrix should be a dict of dicts
    matrix = result['matrix']
    assert isinstance(matrix, dict)
    
    # Top pairs should be sorted by absolute coefficient
    pairs = result['top_pairs']
    for i in range(len(pairs) - 1):
        assert abs(pairs[i]['coefficient']) >= abs(pairs[i+1]['coefficient']), "Pairs not sorted"

def test_correlation_pair_fields():
    from core.correlations import compute_correlations
    result = compute_correlations(cleaned_df, column_profiles)
    for pair in result['top_pairs']:
        for key in ['col1', 'col2', 'coefficient', 'strength', 'direction', 'explanation', 'is_multicollinear']:
            assert key in pair, f"Missing key '{key}' in correlation pair"
        assert -1.0 <= pair['coefficient'] <= 1.0, f"Coefficient out of range: {pair['coefficient']}"

def test_correlation_no_numeric():
    from core.correlations import compute_correlations
    from core.profiler import profile_all_columns
    text_df = pd.DataFrame({'a': ['x'] * 10, 'b': ['y'] * 10})
    profiles = profile_all_columns(text_df)
    result = compute_correlations(text_df, profiles)
    assert result['matrix'] == {} or len(result['top_pairs']) == 0

test("Correlation matrix computation", test_correlation_matrix)
test("Pair fields completeness", test_correlation_pair_fields)
test("No crash on zero numeric columns", test_correlation_no_numeric)

# --- 6. predictor.py ---
print("\n-- 6. Predictor --")

def test_auto_target_selection():
    from core.predictor import auto_select_target
    target = auto_select_target(cleaned_df, column_profiles)
    assert target is not None, "Auto-selection returned None"
    assert target in cleaned_df.columns, f"Selected target '{target}' not in columns"

def test_regression_pipeline():
    from core.predictor import run_prediction_pipeline
    result = run_prediction_pipeline(cleaned_df, column_profiles, target_col='revenue')
    assert 'error' not in result or result.get('task_type'), f"Pipeline error: {result.get('error')}"
    if 'error' not in result:
        assert result['task_type'] == 'regression'
        assert 'r2_score' in result
        assert 'mae' in result
        assert 'feature_importances' in result
        assert len(result['feature_importances']) > 0
        assert result['business_interpretation'], "No business interpretation"

def test_classification_pipeline():
    from core.predictor import run_prediction_pipeline
    result = run_prediction_pipeline(cleaned_df, column_profiles, target_col='region')
    assert 'error' not in result or result.get('task_type'), f"Pipeline error: {result.get('error')}"
    if 'error' not in result:
        assert result['task_type'] == 'classification'
        assert 'accuracy' in result
        assert result['accuracy'] > 0

def test_prediction_too_few_rows():
    from core.predictor import run_prediction_pipeline
    from core.profiler import profile_all_columns
    tiny = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
    profiles = profile_all_columns(tiny)
    result = run_prediction_pipeline(tiny, profiles)
    assert 'error' in result, "Should error on tiny dataset"

def test_feature_importances_normalized():
    from core.predictor import run_prediction_pipeline
    result = run_prediction_pipeline(cleaned_df, column_profiles, target_col='revenue')
    if 'error' not in result:
        fi = result['feature_importances']
        total = sum(fi.values())
        assert 0.9 < total < 1.1, f"Feature importances not normalized: sum={total}"

test("Auto target column selection", test_auto_target_selection)
test("Regression pipeline (revenue)", test_regression_pipeline)
test("Classification pipeline (region)", test_classification_pipeline)
test("Graceful error on tiny dataset", test_prediction_too_few_rows)
test("Feature importances are normalized", test_feature_importances_normalized)

# --- 7. narrator.py (fallback mode -- no API key) ---
print("\n-- 7. Narrator (Fallback) --")

def test_fallback_insights():
    from core.narrator import generate_fallback_insights
    from core.correlations import compute_correlations
    
    corr = compute_correlations(cleaned_df, column_profiles)
    
    summary = {
        'row_count': len(cleaned_df),
        'column_count': len(cleaned_df.columns),
        'quality_score': 78,
        'quality_label': 'Good',
        'critical_flags': 1,
        'warning_flags': 2,
        'columns': column_profiles,
        'top_correlations': corr['top_pairs']
    }
    
    result = generate_fallback_insights(summary)
    assert 'insights' in result
    assert 'suggested_questions' in result
    assert len(result['insights']) >= 2, f"Only {len(result['insights'])} fallback insights"
    
    for ins in result['insights']:
        for key in ['title', 'observation', 'interpretation', 'priority', 'category']:
            assert key in ins, f"Missing key '{key}' in fallback insight"

def test_narrative_story_no_key():
    from core.narrator import generate_narrative_story
    # With no GEMINI_API_KEY set, should return fallback
    summary = {
        'row_count': 200,
        'column_count': 9,
        'quality_score': 78,
        'quality_label': 'Good',
        'critical_flags': 0,
        'warning_flags': 1,
        'columns': column_profiles[:5],
        'top_correlations': []
    }
    result = generate_narrative_story(summary)
    assert 'insights' in result, "Should return fallback insights when no API key"

def test_chat_no_key():
    from core.narrator import call_grounded_chat
    summary = {
        'row_count': 200,
        'column_count': 9,
        'columns': [{'name': 'revenue', 'type': 'numeric'}]
    }
    response, follow_ups = call_grounded_chat([], "What is the average revenue?", summary)
    assert isinstance(response, str)
    assert len(response) > 0
    assert isinstance(follow_ups, list)

test("Fallback insight generation", test_fallback_insights)
test("Story generation without API key", test_narrative_story_no_key)
test("Chat response without API key", test_chat_no_key)

# --- 8. schemas.py -- Pydantic validation ---
print("\n-- 8. Schemas --")

def test_pydantic_histogram_bin():
    from core.schemas import HistogramBin
    b = HistogramBin(bin_start=0.0, bin_end=10.0, count=5, frequency=0.25, label="0-10")
    assert b.count == 5

def test_pydantic_column_profile():
    from core.schemas import ColumnProfile
    p = ColumnProfile(
        name="test", index=0, type="numeric", display_type="Number",
        null_count=0, null_percent=0.0, sample_values=["1", "2"],
        completeness_percent=100.0
    )
    assert p.name == "test"

def test_pydantic_quality_report():
    from core.schemas import QualityReport, FlagSeverityCount
    r = QualityReport(
        overall_score=85, score_label="Excellent", score_color="#2ed573",
        duplicate_row_count=0, duplicate_row_percent=0.0,
        total_null_count=5, total_null_percent=1.0,
        flag_count_by_severity=FlagSeverityCount(critical=0, warning=1, info=2),
        flags_by_column={},
        all_flags_sorted=[]
    )
    assert r.overall_score == 85

def test_pydantic_prediction_report():
    from core.schemas import PredictionReport
    p = PredictionReport(
        task_type="regression", target_column="revenue", best_model="Random Forest",
        r2_score=0.85, r2_percent=85.0, mae=120.5, rmse=150.3,
        feature_importances={"cost": 0.6, "units": 0.4},
        test_size=40, train_size=160, feature_cols_used=["cost", "units"],
        business_interpretation="The model explains 85% of variance."
    )
    assert p.task_type == "regression"

test("HistogramBin schema", test_pydantic_histogram_bin)
test("ColumnProfile schema", test_pydantic_column_profile)
test("QualityReport schema", test_pydantic_quality_report)
test("PredictionReport schema", test_pydantic_prediction_report)

# --- 9. main.py -- FastAPI app import ---
print("\n-- 9. FastAPI App --")

def test_fastapi_app_creation():
    from main import app
    assert app.title == "DataFect v3.0 Backend"
    routes = [r.path for r in app.routes]
    assert "/api/health" in routes, f"Missing /api/health route. Routes: {routes}"
    assert "/api/upload" in routes, f"Missing /api/upload route"
    assert "/api/narrate" in routes, f"Missing /api/narrate route"
    assert "/api/chat" in routes, f"Missing /api/chat route"

test("FastAPI app creation + routes", test_fastapi_app_creation)

# --- Summary ---
print()
print("=" * 60)
total = len(results)
passed = sum(1 for _, ok, _ in results if ok)
failed = sum(1 for _, ok, _ in results if not ok)
print(f"  Results: {passed}/{total} passed, {failed} failed")

if failed > 0:
    print()
    print("  Failed tests:")
    for name, ok, tb in results:
        if not ok:
            print(f"    - {name}")
    print()

print("=" * 60)
sys.exit(0 if failed == 0 else 1)
