import sys
import os
import time

# Ensure core package is importable
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from core.parser import parse_file
from core.cleaner import run_cleaning_pipeline
from core.profiler import profile_all_columns
from core.quality import compute_quality_flags, compute_quality_score
from core.correlations import compute_correlations
from core.predictor import run_prediction_pipeline

DATASETS_DIR = os.path.abspath(os.path.join(backend_dir, '..', 'Datasets'))

def run_verification():
    print("=" * 70)
    print("  DataLens v3.0 -- Real Dataset Ingestion & Pipeline Verification")
    print("=" * 70)
    print(f"Loading datasets from: {DATASETS_DIR}")
    print()

    if not os.path.exists(DATASETS_DIR):
        print(f"Error: Datasets directory not found at {DATASETS_DIR}")
        return

    files = [f for f in os.listdir(DATASETS_DIR) if f.endswith('.csv')]
    if not files:
        print("No CSV files found in the Datasets directory.")
        return

    all_passed = True

    for idx, filename in enumerate(files, 1):
        filepath = os.path.join(DATASETS_DIR, filename)
        filesize_kb = os.path.getsize(filepath) / 1024
        
        print(f"[{idx}/{len(files)}] Processing: {filename} ({filesize_kb:.1f} KB)...")
        start_time = time.time()
        
        try:
            # 1. Load file bytes
            with open(filepath, 'rb') as f:
                content_bytes = f.read()

            # 2. Parser
            df, meta = parse_file(content_bytes, filename)
            print(f"  - Parsed successfully: {meta['row_count']} rows, {meta['column_count']} columns")
            print(f"    Delimiter detected: '{meta['delimiter']}', Encoding: {meta['encoding']}")

            # 3. Cleaner
            cleaning_result = run_cleaning_pipeline(df)
            cleaned_df = cleaning_result['cleaned_df']
            print(f"  - Cleaning complete: final rows: {cleaning_result['rows_after']}, audit log size: {len(cleaning_result['audit_log'])}")

            # 4. Profiler
            column_profiles = profile_all_columns(cleaned_df)
            print(f"  - Profiler complete: profiles created for {len(column_profiles)} columns")

            # 5. Quality Scorer & Flags
            flags_by_col = compute_quality_flags(column_profiles, cleaned_df)
            quality_report = compute_quality_score(cleaned_df, column_profiles, flags_by_col)
            print(f"  - Quality Audit: Score = {quality_report['overall_score']}/100 ({quality_report['score_label']})")
            print(f"    Critical flags: {quality_report['flag_count_by_severity']['critical']}, Warnings: {quality_report['flag_count_by_severity']['warning']}, Info: {quality_report['flag_count_by_severity']['info']}")

            # 6. Correlation Engine
            correlation_report = compute_correlations(cleaned_df, column_profiles)
            print(f"  - Correlation matrix generated. Top pairs found: {len(correlation_report['top_pairs'])}")

            # 7. AutoML Prediction
            pred_report = run_prediction_pipeline(cleaned_df, column_profiles)
            if 'error' in pred_report and pred_report['error']:
                print(f"  - AutoML Pipeline Message: {pred_report['error']}")
            else:
                print(f"  - AutoML Model Trained: Best model = '{pred_report['best_model']}'")
                print(f"    Task Type: {pred_report['task_type']}, Target Column: '{pred_report['target_column']}'")
                if pred_report['task_type'] == 'classification':
                    print(f"    Accuracy: {pred_report['accuracy']}%")
                else:
                    print(f"    R2 Score: {pred_report['r2_percent']}% (MAE: {pred_report['mae']:.4f}, RMSE: {pred_report['rmse']:.4f})")
                print(f"    Feature importances calculated for: {list(pred_report['feature_importances'].keys())}")
                if pred_report.get('trend_forecast'):
                    print(f"    Extrapolated 6-period forecasts generated successfully.")

            elapsed = time.time() - start_time
            print(f"  [PASS] Processed {filename} in {elapsed:.2f} seconds")
            print("-" * 50)
            
        except Exception as e:
            all_passed = False
            import traceback
            print(f"  [FAIL] Failed to process {filename}")
            print(f"    Error: {str(e)}")
            traceback.print_exc()
            print("-" * 50)

    print()
    print("=" * 70)
    if all_passed:
        print("  ALL DATASETS VERIFIED SUCCESSFULLY! PIPELINE IS ROBUST.")
    else:
        print("  SOME DATASETS ENCOUNTERED PIPELINE FAILURES. REVIEW LOGS.")
    print("=" * 70)

if __name__ == '__main__':
    run_verification()
