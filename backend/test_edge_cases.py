import os
import sys
import io
import pandas as pd
import numpy as np
import traceback

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from core.parser import parse_file
from core.cleaner import run_cleaning_pipeline
from core.profiler import profile_all_columns, detect_multivariate_anomalies
from core.quality import compute_quality_flags, compute_quality_score
from core.correlations import compute_correlations
from core.predictor import run_prediction_pipeline
from core.narrator import generate_narrative_story, call_grounded_chat, generate_fallback_insights

edge_cases = {
    "empty_bytes": b"",
    "only_header": b"col_a,col_b,col_c\n",
    "single_row": b"col_a,col_b\n1,2\n",
    "all_nulls": b"col_a,col_b,col_c\n,,\n,,\n,,\n",
    "duplicate_cols": b"a,a,b,b\n1,2,3,4\n5,6,7,8\n",
    "empty_col_name": b",col_b,\n1,2,3\n4,5,6\n",
    "all_text": b"name,city,status\nalice,ny,active\nbob,la,inactive\ncarol,sf,active\n",
    "all_constant": b"val,other\n1,a\n1,a\n1,a\n1,a\n",
    "none_strings": b"col1,col2\nNone,null\nNA,NaN\n",
    "json_empty": b"[]",
    "json_single_obj": b'{"a": 1, "b": 2}',
    "json_null": b"null",
}

print("Running Edge Case Stress Tests...")
print("=" * 60)

for name, raw_bytes in edge_cases.items():
    print(f"\nTesting: {name}")
    try:
        ext = ".json" if "json" in name else ".csv"
        fname = f"test_{name}{ext}"
        
        try:
            df, meta = parse_file(raw_bytes, fname)
            print(f"  [1] Parse: SUCCESS (rows={len(df)}, cols={len(df.columns)})")
        except Exception as e:
            print(f"  [1] Parse EXCEPTION: {type(e).__name__}: {e}")
            continue

        try:
            clean_res = run_cleaning_pipeline(df)
            cleaned_df = clean_res['cleaned_df']
            print(f"  [2] Clean: SUCCESS (rows={len(cleaned_df)}, cols={len(cleaned_df.columns)})")
        except Exception as e:
            print(f"  [2] Clean EXCEPTION: {type(e).__name__}: {e}")
            traceback.print_exc()
            continue

        try:
            profiles = profile_all_columns(cleaned_df)
            print(f"  [3] Profile: SUCCESS (profiles={len(profiles)})")
        except Exception as e:
            print(f"  [3] Profile EXCEPTION: {type(e).__name__}: {e}")
            traceback.print_exc()
            continue

        try:
            flags = compute_quality_flags(profiles, cleaned_df)
            score_report = compute_quality_score(cleaned_df, profiles, flags)
            print(f"  [4] Quality: SUCCESS (score={score_report['overall_score']})")
        except Exception as e:
            print(f"  [4] Quality EXCEPTION: {type(e).__name__}: {e}")
            traceback.print_exc()
            continue

        try:
            corr = compute_correlations(cleaned_df, profiles)
            print(f"  [5] Correlations: SUCCESS (top_pairs={len(corr.get('top_pairs', []))})")
        except Exception as e:
            print(f"  [5] Correlations EXCEPTION: {type(e).__name__}: {e}")
            traceback.print_exc()
            continue

        try:
            pred = run_prediction_pipeline(cleaned_df, profiles)
            print(f"  [6] Prediction: SUCCESS (result keys={list(pred.keys())})")
        except Exception as e:
            print(f"  [6] Prediction EXCEPTION: {type(e).__name__}: {e}")
            traceback.print_exc()
            continue

        try:
            narrative = generate_fallback_insights({
                'columns': profiles,
                'row_count': len(cleaned_df),
                'quality_score': score_report['overall_score'],
                'top_correlations': corr.get('top_pairs', [])
            })
            print(f"  [7] Narrator Fallback: SUCCESS (insights={len(narrative.get('insights', []))})")
        except Exception as e:
            print(f"  [7] Narrator Fallback EXCEPTION: {type(e).__name__}: {e}")
            traceback.print_exc()
            continue

    except Exception as e:
        print(f"  GENERAL FAILURE: {type(e).__name__}: {e}")
        traceback.print_exc()

print("\n" + "=" * 60)
print("Stress Tests Completed.")
