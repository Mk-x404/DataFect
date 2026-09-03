# ==========================================
# MACHINE LEARNING PREDICTOR
# ==========================================
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor, HistGradientBoostingClassifier, RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score
from typing import Dict, List, Any, Tuple
import warnings
warnings.filterwarnings('ignore')

# Max worker threads bounded to prevent Windows pool deadlock
MAX_ML_JOBS = min(os.cpu_count() or 1, 4)

# ------------------------------------------
# FORMATTING UTILS
# ------------------------------------------
def format_executive_number(val: float, is_percentage: bool = False) -> str:
    """Format numbers for executive dashboards (e.g. 1.2M, 45.2K, or simple decimals)."""
    if val is None or np.isnan(val):
        return "N/A"
    
    # If percentage, format to 1 decimal place with %
    if is_percentage:
        return f"{val:.1f}%"
        
    abs_val = abs(val)
    if abs_val >= 1_000_000:
        return f"{val / 1_000_000:.1f}M"
    elif abs_val >= 1_000:
        return f"{val / 1_000:.1f}K"
    elif abs_val >= 100:
        return f"{val:.1f}"
    elif abs_val < 0.01 and abs_val > 0:
        return f"{val:.4f}"
    else:
        return f"{val:.2f}"

# ------------------------------------------
# DATA PREP & TARGET SELECTION
# ------------------------------------------
def auto_select_target(df: pd.DataFrame, column_profiles: List[Dict]) -> str:
    """
    Intelligently auto-select the most likely target column.
    Priority: Numeric or categorical columns named 'target', 'label', 'y', 'output', 'sales', 'revenue',
    churn, rating, default, etc. Fallback: highest variance numeric.
    """
    priority_names = ['target', 'label', 'y', 'output', 'result', 'sales', 'revenue',
                      'price', 'score', 'rating', 'churn', 'default', 'fraud', 'class']

    # Filter numeric or low-cardinality categorical/boolean
    candidates = []
    for p in column_profiles:
        c_name = p['name']
        c_type = p['type']
        
        # Exclude IDs, dates, free text, empty
        if c_type in ('id', 'date', 'text', 'empty', 'mixed'):
            continue
            
        # Check if it has a high null percent (exclude columns with > 50% missing values)
        if p.get('null_percent', 0) > 50:
            continue

        # Exclude high-cardinality categoricals (> 20 unique values) from auto-selection priority
        if c_type in ('categorical', 'text') and (p.get('categorical_stats', {}).get('unique_count', 0) > 20):
            continue
            
        candidates.append(c_name)

    # First pass: priority name match
    for name in priority_names:
        for col in candidates:
            if name in col.lower():
                return col

    # Second pass: fall back to numeric column with highest variance
    numeric_candidates = [p for p in column_profiles if p['name'] in candidates and p['type'] == 'numeric']
    if numeric_candidates:
        # Sort by variance
        def get_variance(p):
            ns = p.get('numeric_stats', {})
            return ns.get('variance', 0.0)
        best_num = max(numeric_candidates, key=get_variance)
        return best_num['name']

    # Final fallback: any valid candidate
    if candidates:
        return candidates[-1]

    return None

def prepare_features(df: pd.DataFrame, target_col: str, column_profiles: List[Dict]) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    """
    Encode categories, impute missing values, and prepare feature matrix X and target vector y.
    """
    exclude_types = {'id', 'text', 'empty', 'date', 'mixed'}
    feature_cols = []
    
    for p in column_profiles:
        col = p['name']
        if col == target_col:
            continue
        if p['type'] in exclude_types:
            continue
        if p['null_percent'] > 60:
            continue
        feature_cols.append(col)

    if not feature_cols:
        return None, None, []

    X = df[feature_cols].copy()
    y = df[target_col].copy()

    # Drop rows where target is missing
    target_mask = y.notna()
    X = X[target_mask]
    y = y[target_mask]

    if len(X) == 0:
        return None, None, []

    # Encode features using OrdinalEncoder natively
    string_cols = [col for col in X.columns if (
        pd.api.types.is_object_dtype(X[col]) or
        pd.api.types.is_string_dtype(X[col]) or
        pd.api.types.is_categorical_dtype(X[col]) or
        X[col].dtype == bool
    )]
    
    if string_cols:
        from sklearn.preprocessing import OrdinalEncoder
        oe = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1, encoded_missing_value=-1)
        X[string_cols] = X[string_cols].astype(str)
        X[string_cols] = oe.fit_transform(X[string_cols])

    for col in X.columns:
        if col in string_cols:
            continue
        elif pd.api.types.is_numeric_dtype(X[col]):
            # Impute numbers with median
            median_val = X[col].median()
            if pd.isna(median_val):
                median_val = 0.0
            X[col] = X[col].fillna(median_val)
        else:
            # Unknown dtype — try to convert to numeric, else label-encode
            try:
                X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0.0)
            except Exception:
                le = LabelEncoder()
                filled = X[col].astype(str).fillna('__missing__')
                X[col] = le.fit_transform(filled)

    return X, y, feature_cols

def _generate_trend_forecast(df: pd.DataFrame, target_col: str, column_profiles: List[Dict], periods: int = 6) -> List[Dict]:
    """Extrapolate linear trend based on date columns."""
    date_cols = [p['name'] for p in column_profiles if p['type'] == 'date']
    if not date_cols:
        return []
    
    try:
        date_col = date_cols[0]
        # Copy subset
        temp = df[[date_col, target_col]].dropna().copy()
        temp[date_col] = pd.to_datetime(temp[date_col])
        temp = temp.sort_values(date_col)
        
        # Convert target to numeric
        temp[target_col] = pd.to_numeric(temp[target_col], errors='coerce')
        temp = temp.dropna()
        
        if len(temp) < 10:
            return []
            
        temp['t'] = np.arange(len(temp))
        
        lr = LinearRegression()
        lr.fit(temp['t'].values.reshape(-1, 1), temp[target_col].values)
        
        last_t = temp['t'].max()
        last_date = temp[date_col].max()
        
        # Compute median delta between timestamps
        deltas = temp[date_col].diff().dropna()
        median_delta = deltas.median() if len(deltas) > 0 else pd.Timedelta(days=1)
        
        forecast = []
        for i in range(1, periods + 1):
            pred_t = last_t + i
            pred_val = float(lr.predict([[pred_t]])[0])
            pred_date = last_date + (median_delta * i)
            forecast.append({
                'period': i,
                'date': str(pred_date.date()) if hasattr(pred_date, 'date') else str(pred_date),
                'predicted_value': round(pred_val, 4),
                'label': f"+{i} periods"
            })
        return forecast
    except Exception:
        return []

def _prediction_error_response(error_msg: str, target_col: str = None) -> Dict[str, Any]:
    """Standardized error response matching PredictionReport schema."""
    return {
        'task_type': None,
        'target_column': target_col,
        'best_model': None,
        'accuracy': None,
        'r2_score': None,
        'r2_percent': None,
        'mae': None,
        'rmse': None,
        'feature_importances': {},
        'classes': None,
        'actual_vs_predicted': None,
        'trend_forecast': None,
        'test_size': 0,
        'train_size': 0,
        'feature_cols_used': [],
        'business_interpretation': None,
        'error': error_msg
    }

def run_prediction_pipeline(df: pd.DataFrame, column_profiles: List[Dict], target_col: str = None) -> Dict[str, Any]:
    print("[PREDICTOR] Starting prediction pipeline...")
    if df is None or df.empty or len(df) < 20:
        return _prediction_error_response("Not enough rows (minimum 20 required) for training a machine learning model.")
        
    if not column_profiles:
        return _prediction_error_response("No column profiles available for AutoML training.")

    if target_col is None:
        target_col = auto_select_target(df, column_profiles)
        print(f"[PREDICTOR] Auto-selected target: {target_col}")

    if target_col is None:
        return _prediction_error_response("Could not automatically identify a suitable target column for prediction.")
        
    target_prof = next((p for p in column_profiles if isinstance(p, dict) and p.get('name') == target_col), None)
    if not target_prof:
        return _prediction_error_response(f"Target column '{target_col}' was not found in dataset.", target_col=target_col)

    if (target_prof.get('null_percent') or 0) > 50:
        return _prediction_error_response(f"Target column '{target_col}' contains over 50% missing values.", target_col=target_col)

    # Downsample early to save time on preprocessing and memory
    if len(df) > 15000:
        df = df.sample(15000, random_state=42)

    X, y, feature_cols = prepare_features(df, target_col, column_profiles)
    if X is None or len(X) < 20 or not feature_cols:
        return _prediction_error_response("Not enough valid feature rows after data cleaning to train a model.", target_col=target_col)

    # Check if target values can be cleanly coerced to numeric (e.g. '12', '150', '0' stored as strings/counts like externalLinks)
    target_type = target_prof.get('type', 'numeric')
    coerced_numeric = pd.to_numeric(y, errors='coerce')
    is_mostly_numeric = (coerced_numeric.notna().sum() / max(len(y), 1)) >= 0.70

    custom_note = None
    if target_type != 'numeric' and is_mostly_numeric:
        # Pivot automatically to continuous regression!
        y = coerced_numeric.fillna(coerced_numeric.median() if not pd.isna(coerced_numeric.median()) else 0.0)
        is_classification = False
        custom_note = f"Target '{target_col}' detected as numerical counts and modeled via continuous regression."
    else:
        n_unique_target = y.nunique()
        is_classification = (target_type in ('categorical', 'boolean', 'text')) or (n_unique_target <= 10 and n_unique_target / max(len(y), 1) < 0.1)

    # If genuinely categorical with high cardinality (>15 unique classes), apply Top-K + 'Other' grouping
    if is_classification and y.nunique() > 15:
        top_12 = y.value_counts().index[:12].tolist()
        y = y.apply(lambda val: val if val in top_12 else 'Other')
        custom_note = f"Target '{target_col}' contained high cardinality; consolidated into top 12 categories and an 'Other' bucket for optimal classification accuracy."

    try:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    except Exception as e:
        return _prediction_error_response(f"Train/test split failed: {str(e)}", target_col=target_col)

    # ── Classification ──
    if is_classification:
        target_encoder = LabelEncoder()
        try:
            target_encoder.fit(y.astype(str))
            y_train_encoded = target_encoder.transform(y_train.astype(str))
            y_test_encoded = target_encoder.transform(y_test.astype(str))
            classes = target_encoder.classes_.tolist()
        except Exception as e:
            return _prediction_error_response(f"Target encoding failed: {str(e)}", target_col=target_col)
        
        candidates = {
            'HistGradientBoosting': HistGradientBoostingClassifier(max_iter=100, random_state=42),
            'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=MAX_ML_JOBS),
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42, n_jobs=MAX_ML_JOBS)
        }
        
        best_score = -1.0
        best_name = ''
        best_model = None
        
        for name, model in candidates.items():
            try:
                model.fit(X_train, y_train_encoded)
                preds = model.predict(X_test)
                acc = accuracy_score(y_test_encoded, preds)
                if acc > best_score:
                    best_score = acc
                    best_name = name
                    best_model = model
            except Exception:
                continue

        if best_model is None:
            return _prediction_error_response("All candidate classification models failed to fit on this dataset.", target_col=target_col)

        # Feature Importances with safe extraction
        importances = {}
        try:
            if hasattr(best_model, 'feature_importances_') and best_model.feature_importances_ is not None:
                raw_fi = best_model.feature_importances_.tolist() if hasattr(best_model.feature_importances_, 'tolist') else list(best_model.feature_importances_)
                importances = dict(zip(feature_cols, raw_fi))
            elif hasattr(best_model, 'coef_') and best_model.coef_ is not None:
                coefs = np.abs(best_model.coef_[0]) if len(best_model.coef_.shape) > 1 else np.abs(best_model.coef_)
                raw_coef = coefs.tolist() if hasattr(coefs, 'tolist') else list(coefs)
                importances = dict(zip(feature_cols, raw_coef))
            else:
                from sklearn.inspection import permutation_importance
                r = permutation_importance(best_model, X_test, y_test_encoded, n_repeats=5, random_state=42, n_jobs=-1)
                importances = dict(zip(feature_cols, np.maximum(0, r.importances_mean).tolist()))
        except Exception:
            importances = {col: 1.0 / max(len(feature_cols), 1) for col in feature_cols}
            
        # Normalize importances
        total_importance = sum(importances.values())
        if total_importance > 0:
            importances = {k: round(float(v) / total_importance, 4) for k, v in importances.items()}
        
        sorted_importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True)[:10])

        return {
            'task_type': 'classification',
            'target_column': target_col,
            'best_model': best_name,
            'accuracy': round(best_score * 100, 2),
            'r2_score': None,
            'r2_percent': None,
            'mae': None,
            'rmse': None,
            'feature_importances': sorted_importances,
            'classes': classes,
            'actual_vs_predicted': None,
            'trend_forecast': None,
            'test_size': len(y_test),
            'train_size': len(y_train),
            'feature_cols_used': feature_cols,
            'business_interpretation': (
                (f"{custom_note} " if custom_note else "") +
                f"DataFect successfully trained a '{best_name}' classifier to predict '{target_col}'. "
                f"The model correctly classifies test rows with {best_score*100:.1f}% accuracy. "
                f"The most critical features driving predictions are: {', '.join(list(sorted_importances.keys())[:3])}."
            ),
            'error': None
        }

    # ── Regression ──
    else:
        y_train_numeric = pd.to_numeric(y_train, errors='coerce').fillna(0.0)
        y_test_numeric = pd.to_numeric(y_test, errors='coerce').fillna(0.0)
        
        candidates = {
            'HistGradientBoosting': HistGradientBoostingRegressor(max_iter=100, random_state=42),
            'Random Forest': RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42, n_jobs=MAX_ML_JOBS),
            'Linear Regression': LinearRegression(n_jobs=MAX_ML_JOBS)
        }
        
        best_r2 = -np.inf
        best_name = ''
        best_model = None
        
        for name, model in candidates.items():
            try:
                model.fit(X_train, y_train_numeric)
                preds = model.predict(X_test)
                r2 = r2_score(y_test_numeric, preds)
                if r2 > best_r2:
                    best_r2 = r2
                    best_name = name
                    best_model = model
            except Exception:
                continue

        if best_model is None or best_r2 == -np.inf:
            return _prediction_error_response("All regression candidate models failed to fit on this dataset.", target_col=target_col)

        y_pred = best_model.predict(X_test)
        mae = mean_absolute_error(y_test_numeric, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test_numeric, y_pred))
        best_r2 = max(-1.0, min(1.0, best_r2))

        # Feature Importances with safe extraction
        importances = {}
        try:
            if hasattr(best_model, 'feature_importances_') and best_model.feature_importances_ is not None:
                raw_fi = best_model.feature_importances_.tolist() if hasattr(best_model.feature_importances_, 'tolist') else list(best_model.feature_importances_)
                importances = dict(zip(feature_cols, raw_fi))
            elif hasattr(best_model, 'coef_') and best_model.coef_ is not None:
                coefs = np.abs(best_model.coef_)
                raw_coef = coefs.tolist() if hasattr(coefs, 'tolist') else list(coefs)
                importances = dict(zip(feature_cols, raw_coef))
            else:
                from sklearn.inspection import permutation_importance
                r = permutation_importance(best_model, X_test, y_test_numeric, n_repeats=5, random_state=42, n_jobs=MAX_ML_JOBS)
                importances = dict(zip(feature_cols, np.maximum(0, r.importances_mean).tolist()))
        except Exception:
            importances = {col: 1.0 / max(len(feature_cols), 1) for col in feature_cols}
            
        # Normalize
        total_importance = sum(importances.values())
        if total_importance > 0:
            importances = {k: round(float(v) / total_importance, 4) for k, v in importances.items()}
            
        sorted_importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True)[:10])

        # Actual vs Predicted pairs
        actual_vs_predicted = [
            {'actual': round(float(a), 4), 'predicted': round(float(p), 4)}
            for a, p in zip(y_test_numeric.tolist()[:50], y_pred.tolist()[:50])
        ]

        # Trend forecast
        trend_forecast = _generate_trend_forecast(df, target_col, column_profiles)

        return {
            'task_type': 'regression',
            'target_column': target_col,
            'best_model': best_name,
            'accuracy': None,
            'r2_score': round(best_r2 * 100, 2),
            'r2_percent': round(best_r2 * 100, 2),
            'mae': round(mae, 4),
            'rmse': round(rmse, 4),
            'feature_importances': sorted_importances,
            'classes': None,
            'actual_vs_predicted': actual_vs_predicted,
            'trend_forecast': trend_forecast if trend_forecast else None,
            'test_size': len(y_test_numeric),
            'train_size': len(y_train_numeric),
            'feature_cols_used': feature_cols,
            'business_interpretation': (
                (f"{custom_note} " if custom_note else "") +
                f"DataFect successfully trained a '{best_name}' regressor to predict '{target_col}'. "
                f"The model explains {max(0.0, best_r2)*100:.1f}% of the variance in the test set. "
                f"On average, predictions are off by {mae:.2f} units (Mean Absolute Error). "
                f"The top predictors of '{target_col}' are: {', '.join(list(sorted_importances.keys())[:3])}."
            ),
            'error': None
        }
