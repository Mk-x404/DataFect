# DataFect

> **Drop in any messy CSV, Excel, or JSON file and get instant statistical profiling, data quality audits, baseline machine learning benchmarks, and an AI assistant that answers questions about your data.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-datafect.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://datafect.vercel.app)
[![API Status](https://img.shields.io/badge/API%20Status-Healthy-10B981?style=for-the-badge&logo=render&logoColor=white)](https://datafect.onrender.com/api/health)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.6+-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)

---

## 🌐 Live Application

- **Web Dashboard**: [https://datafect.vercel.app](https://datafect.vercel.app) (Hosted on Vercel)
- **API Service**: [https://datafect.onrender.com](https://datafect.onrender.com) (Hosted on Render)
- **Health Probe**: [https://datafect.onrender.com/api/health](https://datafect.onrender.com/api/health)

---

## 💡 Why I Built This

Every time I started working with a new tabular dataset, I found myself doing the exact same manual setup routine:
1. Fire up a Jupyter notebook or scratch script.
2. Wrestle with `pd.read_csv` errors because of mixed encodings (`latin-1`, `windows-1252`), semicolon delimiters, or ragged lines.
3. Write boilerplate code to calculate missing values, IQR outlier boundaries, and correlation matrices.
4. Set up an 80/20 train-test split to train a couple of baseline regressors just to see what kind of $R^2$ score is reasonable.
5. Manually summarize the findings into bullet points for non-technical teammates.

Most existing automated EDA tools either generate massive, sluggish static HTML reports or choke the moment you feed them a real-world, dirty CSV file. 

I built **DataFect** as a focused, lightweight web studio to handle that entire first hour of exploratory work in a few seconds. You upload a raw file, and it automatically repairs parsing quirks, computes deep distribution statistics, benchmarks three competitive ML models, and gives you a grounded chat interface to ask natural-language questions directly against your data.

---

## ⚡ What DataFect Does

### 1. Self-Healing File Parser
Real-world data files are messy. DataFect includes an ingestion pipeline that:
- **Sniffs Delimiters**: Automatically detects whether your file is separated by commas, semicolons, tabs, or pipes using Python's `csv.Sniffer`.
- **Cascades Encodings**: Progressively tests `utf-8`, `latin-1`, `windows-1252`, and `iso-8859` before falling back to binary detection with `chardet`.
- **Recovers from Bad Lines**: Skips ragged or unescaped rows rather than crashing the upload.
- **Cleans Headers**: Strips whitespace, normalizes column names, and drops repeated header rows from concatenated exports.

### 2. Comprehensive Statistical Profiler
Once parsed, DataFect computes a complete statistical breakdown across all columns in parallel:
- **Numeric Columns**: Mean, median, standard deviation, IQR, quantiles (5%, 25%, 50%, 75%, 95%), skewness, kurtosis, and distribution histogram bins.
- **Categorical Columns**: Unique count, top categories, frequency distribution, and missingness rates.
- **Correlations**: Vectorized Pearson and Spearman correlation matrices categorized into clear relational buckets (`strong`, `moderate`, `weak`).

### 3. Data Quality & Health Score
A 0–100 health score is computed for every dataset based on four weighted dimensions:
- **Missing Value Density**: Tracks column-wise and row-wise null rates.
- **Duplicate Rows**: Flags redundant records.
- **Outlier Density**: Uses IQR fences ($1.5 \times \text{IQR}$) to identify extreme values.
- **Type Inconsistencies**: Detects numbers disguised as strings or mixed-type columns.

### 4. 1-Click AutoML Benchmark Lab
Instead of guessing which baseline algorithm to use:
- **Auto-Target Detection**: Automatically identifies the most likely target column (or lets you pick one).
- **Multi-Model Benchmark**: Trains and compares three distinct regressors on an 80/20 train-test split:
  - **Linear Regression** (interpretable baseline)
  - **Random Forest Regressor** (non-linear interactions)
  - **HistGradientBoosting Regressor** (fast gradient boosting)
- **Feature Importance**: Normalizes and visualizes which features contributed most to the predictions.

### 5. Grounded AI Data Assistant
Have questions about your data? Ask them directly:
- *"Which 5 products generate the highest profit margins?"*
- *"Are there any weird outliers in the sales column?"*
- Powered by **Google Gemini 2.0 Flash** combined with a session-aware RAG layer. The assistant reads your actual dataset schema and summaries, so its responses are factual, formatted with markdown tables, and backed by your data.

### 6. Executive Story Narrator
Translates raw mathematical findings into five clear, human-readable takeaways:
- **Key Drivers**: The strongest variables influencing outcomes.
- **Risk Factors**: Anomalies, missing data hotspots, or skewness to watch out for.
- **Growth Signals**: High-performing segments or positive trends.
- **Recommended Next Steps**: Concrete engineering or analytics actions to take next.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    A[Raw File: CSV / Excel / JSON] --> B[Self-Healing Parser: parser.py]
    B -->|Detect Delimiter & Encoding| C[Data Sanitizer: cleaner.py]
    C -->|Strip Repeated Headers & Normalize| D[Ephemeral Session Store: session_store.py]
    D --> E[Statistical Profiler: profiler.py]
    D --> F[Data Quality Engine: quality.py]
    D --> G[Correlation Matrix: correlations.py]
    D --> H[AutoML Benchmark Lab: predictor.py]
    D --> I[Grounded AI Assistant: rag_agent.py]
    E & F & G & H --> J[FastAPI ASGI Application: main.py]
    J -->|Encrypted HttpOnly JWT Cookie| K[React 19 + TypeScript Frontend]
```

---

## 🛠️ The Tech Stack

### Frontend
- **React 19** + **TypeScript** (Strict Mode)
- **Vite 8** for fast HMR and optimized production bundles
- **Zero-Dependency CSS Design System**: Custom design tokens (`tokens.css`, `typography.css`, `animations.css`) for high performance and dark/light theme consistency without the runtime bloat of UI frameworks.
- **Recharts**: Interactive distribution histograms, correlation heatmaps, scatter plots, and box plots.
- **Framer Motion**: Smooth page transitions and fluid state changes.

### Backend
- **Python 3.12** + **FastAPI** (Asynchronous ASGI)
- **Uvicorn** as the production server
- **Pandas 2.x**, **NumPy**, **SciPy**: Vectorized statistical computations
- **Scikit-Learn**: Automated preprocessing, train-test splitting, and model benchmarking
- **Google Gemini API**: Executive narrative generation and grounded natural-language dataset Q&A
- **SQLite + SQLAlchemy 2.0**: Session management, user authentication, and audit logging

---

## 🚀 Getting Started Locally

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** (with npm)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Mk-x404/DataFect.git
cd DataFect
```

### 2. Set Up the Backend
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API will start at `http://127.0.0.1:8000`. You can test the health probe at `http://127.0.0.1:8000/api/health`.

### 3. Set Up the Frontend
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Set to `production` to mask OpenAPI docs and enable strict secure cookies. | `development` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins. | `http://localhost:5173,http://127.0.0.1:5173` |
| `GEMINI_API_KEY` | Optional Google Gemini API key for AI stories and conversational chat. | *None (falls back to deterministic narratives)* |
| `JWT_SECRET` | Secret key for signing session tokens. | *Auto-generated on startup* |
| `SECURE_COOKIES` | Enforce HTTPS-only flag on auth cookies. | `false` in dev, `true` in prod |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL pointing to the DataFect backend service. | `http://127.0.0.1:8000` |

---

## 📡 API Overview

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status and Gemini availability check. |
| `POST` | `/api/auth/register` | Public | Register an account with bcrypt-hashed credentials. |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue HttpOnly session cookies. |
| `GET` | `/api/auth/session` | Public | Zero-friction session handshake (auto-provisions local demo session). |
| `POST` | `/api/upload` | Analyst / Admin | Upload CSV/Excel/JSON file (up to 100MB) for parsing and profiling. |
| `POST` | `/api/narrate` | Analyst / Admin | Generate an executive narrative summary from dataset metrics. |
| `POST` | `/api/chat` | Viewer / Analyst | Ask natural language questions grounded in your session's data. |

---

## 🧪 Testing

### Backend Test Suite
```bash
cd backend
python -m pytest test_all_routes_and_fallbacks.py -v
python -m pytest test_edge_cases.py -v
python -m pytest test_zero_trust.py -v
```

### Frontend Type-Checking and Linter
```bash
cd frontend
npm run lint
npm run build
```

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).

---

<p align="center">
  Crafted by <a href="https://github.com/Mk-x404">Muhib Khan</a>. If you find this project helpful, feel free to give it a ⭐ on GitHub!
</p>