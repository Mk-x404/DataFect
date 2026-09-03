import pandas as pd
import numpy as np
import chardet
import json
from pathlib import Path
from typing import Tuple
import io

SUPPORTED_EXTENSIONS = {'.csv', '.json', '.xlsx', '.xls'}
MAX_FILE_SIZE_MB = 100

def detect_encoding(raw_bytes: bytes) -> str:
    """Use chardet to detect file encoding. Fallback to utf-8."""
    result = chardet.detect(raw_bytes[:20000])
    return result.get('encoding') or 'utf-8'

def detect_delimiter(sample: str) -> str:
    """Detect CSV delimiter using csv.Sniffer with frequency analysis fallback."""
    import csv
    try:
        dialect = csv.Sniffer().sniff(sample[:2500], delimiters=[',', ';', '\t', '|'])
        if dialect and dialect.delimiter:
            return dialect.delimiter
    except Exception:
        pass

    candidates = {',': 0, ';': 0, '\t': 0, '|': 0}
    for line in sample.split('\n')[:15]:
        for delim in candidates:
            candidates[delim] += line.count(delim)
    return max(candidates, key=candidates.get)

def sanitize_and_dedup_columns(columns) -> list:
    """Sanitize column headers: convert to string, replace empty/none, and deduplicate."""
    seen = {}
    clean_cols = []
    for idx, c in enumerate(columns):
        name = str(c).strip() if c is not None else ""
        if not name or name.lower() in ('unnamed', 'none', 'nan'):
            name = f"col_{idx + 1}"
        
        if name in seen:
            seen[name] += 1
            clean_cols.append(f"{name}_{seen[name]}")
        else:
            seen[name] = 0
            clean_cols.append(name)
    return clean_cols

def parse_file(file_bytes: bytes, filename: str) -> Tuple[pd.DataFrame, dict]:
    """
    Parse uploaded file into a DataFrame with full metadata.
    Supports CSV, JSON, Excel. Returns (df, meta).
    """
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Uploaded file is completely empty (0 bytes). Please upload a valid dataset.")

    ext = Path(filename).suffix.lower()
    file_size_mb = len(file_bytes) / (1024 * 1024)

    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: '{ext}'. Accepted formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}")
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(f"File size ({file_size_mb:.1f}MB) exceeds the maximum limit of {MAX_FILE_SIZE_MB}MB.")

    meta = {
        'filename': filename,
        'file_size_bytes': len(file_bytes),
        'file_size_mb': round(file_size_mb, 2),
        'extension': ext,
    }

    if ext == '.json':
        try:
            data = json.loads(file_bytes.decode('utf-8'))
        except Exception:
            encoding = detect_encoding(file_bytes)
            data = json.loads(file_bytes.decode(encoding, errors='replace'))

        if data is None:
            df = pd.DataFrame()
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            df = pd.json_normalize(data)
        else:
            df = pd.DataFrame({'value': [data]})

        meta['delimiter'] = 'N/A'
        meta['encoding'] = 'utf-8'

    elif ext in ('.xlsx', '.xls'):
        df = pd.read_excel(io.BytesIO(file_bytes))
        meta['delimiter'] = 'N/A'
        meta['encoding'] = 'binary'

    else:  # CSV
        encoding = detect_encoding(file_bytes)
        text = file_bytes.decode(encoding, errors='replace')
        if not text.strip():
            df = pd.DataFrame()
            meta['delimiter'] = ','
            meta['encoding'] = encoding
        else:
            delimiter = detect_delimiter(text[:4000])
            try:
                df = pd.read_csv(io.StringIO(text), delimiter=delimiter, low_memory=False)
            except Exception:
                # Resilient fallback: skip malformed/ragged lines rather than throwing fatal exception
                df = pd.read_csv(io.StringIO(text), delimiter=delimiter, low_memory=False, on_bad_lines='skip')
            meta['delimiter'] = delimiter
            meta['encoding'] = encoding

    # Sanitize and deduplicate column names
    df.columns = sanitize_and_dedup_columns(df.columns)

    meta['row_count'] = len(df)
    meta['column_count'] = len(df.columns)
    meta['estimated_memory_kb'] = round(df.memory_usage(deep=True).sum() / 1024, 1) if not df.empty else 0.0

    return df, meta
