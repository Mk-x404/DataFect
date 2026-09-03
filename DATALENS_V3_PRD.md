# DataLens v3.0 — Product Requirements Document (PRD)

**Product Name:** DataLens  
**Version:** 3.0.0  
**Document Type:** Product Requirements Document  
**Author:** DataLens Product Team  
**Status:** Draft — Ready for Engineering Review  
**Last Updated:** June 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users & Personas](#4-target-users--personas)
5. [Product Scope](#5-product-scope)
6. [Feature Requirements](#6-feature-requirements)
7. [User Journey & Flows](#7-user-journey--flows)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Out of Scope](#9-out-of-scope)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Acceptance Criteria](#11-acceptance-criteria)

---

## 1. Executive Summary

DataLens v3 is a browser-based, AI-augmented Exploratory Data Analysis (EDA) and prediction platform. It is designed to eliminate the gap between having data and understanding data — specifically for users who do not write code.

A user drops any CSV, JSON, or Excel file into DataLens and receives, within seconds:

- A complete statistical profile of every column
- An automated data quality audit with plain-English explanations
- Beautiful interactive visualizations of every distribution and pattern
- A correlation analysis revealing hidden relationships between columns
- An AI-generated executive narrative written in plain English
- A machine learning prediction model trained automatically on their data
- A conversational AI assistant that answers questions about their specific dataset

The product's core promise: **any user — regardless of technical background — should feel like they just hired a senior data science team.**

---

## 2. Problem Statement

### The Gap

Organizations of all sizes collect data but lack the in-house expertise to extract meaningful insight from it quickly. Hiring data scientists is expensive and slow. Existing BI tools (Tableau, Power BI) require significant setup, configuration, and expertise. Python notebooks (Jupyter) require coding knowledge.

### What Users Currently Do

- Export data to Excel and manually compute averages and charts
- Hire freelance data analysts for one-off projects
- Use basic summary statistics that miss distributions, outliers, and correlations
- Make business decisions without understanding the quality of their underlying data

### What DataLens Solves

- **Speed:** Full analysis delivered in under 5 seconds for files up to 50MB
- **Depth:** Statistical rigor equivalent to a trained data scientist's first pass
- **Accessibility:** Every technical finding communicated in plain English
- **Prediction:** ML models trained automatically — no code, no configuration
- **Trust:** Every data quality issue surfaced transparently, not hidden

---

## 3. Goals & Success Metrics

### Product Goals

| # | Goal | Metric | Target |
|---|------|--------|--------|
| G1 | Fast first value | Time from file drop to dashboard visible | < 5 seconds |
| G2 | High insight quality | % of AI insights referencing actual column values | 100% |
| G3 | Non-technical usability | % of stat displays with plain-English explanation | 100% |
| G4 | Reliable predictions | % of datasets where prediction pipeline succeeds | ≥ 85% |
| G5 | High data quality coverage | % of quality issues auto-detected vs manual review | ≥ 90% |
| G6 | Engaged users | Avg tabs visited per session | ≥ 4 of 7 |
| G7 | Chat adoption | % of sessions that use Data Assistant | ≥ 40% |

### Business Goals

- Establish DataLens as the go-to EDA tool for non-technical business users
- Enable a portfolio-quality showcase of AI-powered product development
- Demonstrate production-grade Python + React architecture skills

---

## 4. Target Users & Personas

### Persona 1 — The Business Analyst

**Name:** Ayesha, 28  
**Role:** Business Analyst at a mid-size e-commerce company  
**Technical Level:** Advanced Excel, no Python  
**Pain:** Spends 3 hours manually cleaning and summarizing CSVs from ops teams  
**Goal:** Understand sales data patterns and present findings to management in 30 minutes  
**DataLens Use:** Drop monthly sales CSV → read AI story → copy insights to presentation

### Persona 2 — The Startup Founder

**Name:** Tariq, 34  
**Role:** Co-founder of a SaaS startup  
**Technical Level:** Basic SQL, no data science  
**Pain:** Has user behavior data but no data team to analyze it  
**Goal:** Understand churn patterns before investor meeting  
**DataLens Use:** Upload user data → check correlations → review prediction → brief investors

### Persona 3 — The Data Science Student

**Name:** Sara, 22  
**Role:** Bachelor's student in Data Science  
**Technical Level:** Learning Python, knows basic statistics  
**Goal:** Understand what a professional EDA looks like and validate her own analysis  
**DataLens Use:** Upload assignment dataset → compare tool's stats to her manual calculations → learn from AI narrative

### Persona 4 — The Operations Manager

**Name:** Bilal, 41  
**Role:** Operations Manager at a logistics firm  
**Technical Level:** Excel power user, no coding  
**Pain:** Gets weekly CSV exports from ERP but has no way to spot anomalies  
**Goal:** Catch data quality issues and outliers before they cause planning errors  
**DataLens Use:** Upload ops data → review quality audit → download insights for weekly review

---

## 5. Product Scope

### What DataLens IS

- A browser-based EDA platform with Python backend and React frontend
- A statistical analysis tool that profiles every column automatically
- A data quality auditing system with severity-based issue flagging
- An AI narrative generator that writes plain-English executive insights
- An ML prediction platform that trains models automatically
- A conversational data assistant grounded in uploaded dataset context

### What DataLens IS NOT

- A dashboard builder (no custom chart configuration by users)
- A database connector (no live database connections)
- A collaborative tool (no multi-user or sharing features in v3)
- A Python notebook (no code editor or code execution)
- A reporting tool with scheduled delivery
- A data warehouse or storage system

---

## 6. Feature Requirements

### 6.1 File Upload & Ingestion

| ID | Requirement | Priority |
|----|-------------|----------|
| F-01 | Accept CSV, JSON, and Excel (.xlsx, .xls) files | Must Have |
| F-02 | Support drag-and-drop and click-to-browse upload | Must Have |
| F-03 | Maximum file size: 50MB | Must Have |
| F-04 | Auto-detect CSV delimiter (comma, semicolon, tab, pipe) | Must Have |
| F-05 | Auto-detect file encoding (UTF-8, Latin-1, etc.) | Must Have |
| F-06 | Show 4-stage progress bar during processing | Must Have |
| F-07 | Display specific, actionable error messages on failure | Must Have |
| F-08 | Show file metadata immediately after drop (name, size, estimated rows) | Should Have |

### 6.2 Automated Data Cleaning

| ID | Requirement | Priority |
|----|-------------|----------|
| F-09 | Strip leading/trailing whitespace from all string columns | Must Have |
| F-10 | Standardize null representations (NA, None, NULL, empty → NaN) | Must Have |
| F-11 | Remove completely empty rows and columns | Must Have |
| F-12 | Auto-coerce string columns to numeric where ≥ 85% values are numeric | Must Have |
| F-13 | Auto-parse datetime columns where ≥ 80% values are valid dates | Must Have |
| F-14 | Normalize case inconsistency in low-cardinality categorical columns | Should Have |
| F-15 | Remove exact duplicate rows | Must Have |
| F-16 | Null suspicious negatives in obviously non-negative columns (age, price, etc.) | Should Have |
| F-17 | Display full cleaning audit log to user (what was changed and why) | Must Have |

### 6.3 Statistical Profiling

| ID | Requirement | Priority |
|----|-------------|----------|
| F-18 | Detect column type: numeric, categorical, date, boolean, text, ID, mixed | Must Have |
| F-19 | For numeric columns: mean, median, std dev, variance, min, max, range | Must Have |
| F-20 | For numeric columns: Q1, Q3, IQR, P5, P10, P90, P95, P99 (NIST method) | Must Have |
| F-21 | For numeric columns: skewness (Pearson, bias-corrected), kurtosis (Fisher's excess) | Must Have |
| F-22 | For numeric columns: outlier count and % via IQR Tukey method | Must Have |
| F-23 | For numeric columns: histogram with Sturges' rule bin count | Must Have |
| F-24 | For numeric columns: distribution shape classification (normal, skewed, bimodal, etc.) | Must Have |
| F-25 | For categorical columns: unique count, cardinality ratio, mode, top 15 values | Must Have |
| F-26 | For categorical columns: rare values (< 1% frequency) detection | Should Have |
| F-27 | For date columns: earliest, latest, range, granularity, gap detection | Must Have |
| F-28 | Every statistic displayed with a plain-English explanation | Must Have |
| F-29 | Completeness % (non-null rate) displayed for every column | Must Have |

### 6.4 Data Quality Audit

| ID | Requirement | Priority |
|----|-------------|----------|
| F-30 | Compute weighted quality score 0–100 with label (Excellent/Good/Fair/Poor/Critical) | Must Have |
| F-31 | Flag CRITICAL_MISSING: > 50% null | Must Have |
| F-32 | Flag HIGH_MISSING: 20–50% null | Must Have |
| F-33 | Flag CONSTANT_COLUMN: zero variance | Must Have |
| F-34 | Flag NEAR_CONSTANT: > 95% same value | Must Have |
| F-35 | Flag OUTLIERS_EXTREME: > 15% outlier rate | Must Have |
| F-36 | Flag OUTLIERS_HIGH: 5–15% outlier rate | Should Have |
| F-37 | Flag DUPLICATE_ROWS: any exact duplicates | Must Have |
| F-38 | Flag SUSPICIOUS_NEGATIVES: negatives in non-negative columns | Should Have |
| F-39 | Each flag includes: severity badge, column name, plain-English explanation, business impact | Must Have |
| F-40 | Each flag includes an expandable Python remediation code block | Should Have |
| F-41 | Flags sorted: Critical → Warning → Info | Must Have |

### 6.5 Correlation Analysis

| ID | Requirement | Priority |
|----|-------------|----------|
| F-42 | Compute Pearson R for all numeric column pairs | Must Have |
| F-43 | Display correlation matrix as color-coded heatmap | Must Have |
| F-44 | Heatmap color scale: deep blue (R=-1) → neutral (R=0) → deep coral (R=+1) | Must Have |
| F-45 | List top 10 correlation pairs ranked by absolute R | Must Have |
| F-46 | Each pair includes: R value, strength label, direction, plain-English interpretation | Must Have |
| F-47 | Flag pairs with |R| > 0.85 as potential multicollinearity warnings | Should Have |

### 6.6 AI Executive Narrative

| ID | Requirement | Priority |
|----|-------------|----------|
| F-48 | Generate 5–7 structured executive insights via Gemini 2.0 Flash | Must Have |
| F-49 | Each insight includes: title, observation, interpretation, why it matters, business meaning, recommended attention, suggested next question | Must Have |
| F-50 | All insights must reference specific column names and exact numeric values from the dataset | Must Have |
| F-51 | Insights delivered as animated cards sliding in one by one | Must Have |
| F-52 | Priority badge per insight (High / Medium / Low) | Must Have |
| F-53 | Category tag per insight (quality / distribution / correlation / trend / anomaly / structure) | Should Have |
| F-54 | Story generation gated behind explicit user action (button click) | Must Have |
| F-55 | Gemini retry logic: exponential backoff (1s → 2s → 4s), max 3 attempts | Must Have |
| F-56 | Friendly error message on final API failure (no raw error shown to user) | Must Have |

### 6.7 ML Prediction Lab

| ID | Requirement | Priority |
|----|-------------|----------|
| F-57 | Auto-select prediction target column using priority name matching + variance ranking | Must Have |
| F-58 | User can override target column via dropdown | Must Have |
| F-59 | Auto-determine task type: regression vs classification | Must Have |
| F-60 | Train 3 candidate models (Random Forest, Gradient Boosting, Logistic Regression) and select best | Must Have |
| F-61 | Display R² score (regression) or Accuracy % (classification) as animated gauge | Must Have |
| F-62 | Display MAE and RMSE for regression models | Must Have |
| F-63 | Display feature importance as horizontal bar chart (top 10 features) | Must Have |
| F-64 | Display actual vs predicted scatter chart for regression | Must Have |
| F-65 | Generate 6-period linear trend forecast when date column exists | Should Have |
| F-66 | Display plain-English business interpretation below every model metric | Must Have |
| F-67 | Show data health warning when R² < 0.3 or accuracy < 60% | Must Have |
| F-68 | Prediction runs automatically after upload without user action | Must Have |

### 6.8 Data Assistant (AI Chat)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-69 | Full-height conversational chat interface | Must Have |
| F-70 | 4 auto-generated suggested questions specific to the uploaded dataset | Must Have |
| F-71 | Typewriter effect on AI responses (12ms per character) | Should Have |
| F-72 | 2 follow-up question chips after every AI response | Should Have |
| F-73 | Context sent to AI: pre-computed analysis JSON only (never raw data) | Must Have |
| F-74 | Context capped at 4000 characters per API call | Must Have |
| F-75 | Send last 6 messages of history per API call | Must Have |
| F-76 | AI responds only about the uploaded dataset — no hallucinated data | Must Have |
| F-77 | Code blocks rendered with dark background, monospace font, copy button | Should Have |

### 6.9 UI & Visualization

| ID | Requirement | Priority |
|----|-------------|----------|
| F-78 | Dark glassmorphism design: deep navy canvas, glass cards, violet accent | Must Have |
| F-79 | All charts built with Recharts with built-in animation | Must Have |
| F-80 | Every chart has a plain-English caption below it | Must Have |
| F-81 | Animated metric counters: count up from 0 on mount | Must Have |
| F-82 | Tab transitions with AnimatePresence (fade + slide) | Must Have |
| F-83 | Column type color-coding: violet=numeric, coral=categorical, emerald=date, amber=boolean | Must Have |
| F-84 | All loading states use skeleton loaders (not spinners) | Must Have |
| F-85 | All error states show specific message + retry option | Must Have |
| F-86 | Mobile horizontal scroll on all tables and wide charts | Must Have |
| F-87 | Reduced motion support (respects OS preference) | Must Have |

---

## 7. User Journey & Flows

### Primary Flow: First-Time Analysis

```
1. User lands on Hero Page
   └── Sees animated headline, feature cards, upload CTA

2. User uploads file
   └── Drag-drop or click-to-browse
   └── 4-stage progress bar: Parsing → Cleaning → Profiling → Done
   └── On success → auto-navigate to Dashboard tab

3. User reads Dashboard Overview
   └── 6 metric cards animate in
   └── Reviews cleaning audit log (what was auto-fixed)
   └── Browses schema table → clicks column → goes to Column Inspector

4. User explores Column Inspector
   └── Selects any column from left panel
   └── Reads histogram, box plot, stat grid, outlier section
   └── Every number has a plain-English sentence below it

5. User reviews Quality Audit
   └── Reads score ring + label
   └── Reviews critical issues first
   └── Understands business impact of each issue

6. User reads Insights & Story
   └── Views correlation heatmap immediately
   └── Clicks "Draft Executive Story"
   └── Reads 5–7 AI insight cards

7. User visits Prediction Lab
   └── Views model performance gauge
   └── Reads feature importance chart
   └── Views forecast chart (if date column exists)
   └── Reads plain-English business interpretation

8. User asks questions in Data Assistant
   └── Clicks a suggested question chip
   └── Reads typewriter AI response
   └── Clicks follow-up question chips
```

### Error Flow

```
Upload fails → Specific error message (not "something went wrong")
              └── Retry button restores upload zone to idle state

AI story fails → "Analysis temporarily unavailable" message
               └── Retry button re-triggers Gemini call

Prediction fails → "Not enough data to build a reliable prediction model"
                 └── Explanation of why (row count, null rate, etc.)
```

---

## 8. Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| File parsing + full analysis (10,000 rows) | < 3 seconds backend |
| Frontend dashboard load after analysis | < 500ms |
| LCP (Largest Contentful Paint) | < 2.0s |
| First Input Delay | < 100ms |
| Cumulative Layout Shift | < 0.05 |
| Gemini story generation | < 8 seconds (with loading indicator) |
| Bundle size (client, gzipped) | < 400KB |

### Reliability

- All Python statistical functions must handle: empty columns, all-null columns, single-value columns, extremely large values, negative values, mixed types
- All API endpoints wrapped in try/except — no unhandled 500 errors reach the frontend
- React ErrorBoundary on every tab panel — no full-app crash from a single component failure
- Gemini API: 3-retry exponential backoff before surfacing a user-friendly error

### Security

- Gemini API key stored exclusively in backend environment variables (`.env`)
- No API key ever sent to frontend or exposed in any response
- Files processed in memory, not persisted to disk after analysis completes
- No raw user data sent to Gemini — only pre-computed statistical summaries

### Accessibility

- WCAG 2.1 AA minimum compliance
- All SVG charts have `aria-label` and `role="img"`
- All buttons have descriptive accessible text
- Keyboard navigation follows visual tab order
- Focus rings visible on all interactive elements
- Color never used as the sole indicator (icons + text accompany all color coding)
- Reduced motion preference respected via `prefers-reduced-motion` media query

### Browser Support

- Chrome 120+ (primary)
- Firefox 120+
- Safari 17+
- Edge 120+
- Mobile: Chrome for Android, Safari for iOS (responsive layout required)

---

## 9. Out of Scope (v3)

The following are explicitly excluded from DataLens v3:

- User authentication, accounts, or session persistence
- File saving, cloud storage, or history of previous analyses
- Multi-user collaboration or sharing links
- Custom dashboard building or chart configuration
- Direct database connections (PostgreSQL, MySQL, etc.)
- Real-time / streaming data support
- Scheduled reports or email delivery
- Export to PDF or PowerPoint
- Custom ML model selection or hyperparameter tuning
- Python code editor or execution environment
- Multi-language UI (English only in v3)

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gemini API rate limits or downtime | Medium | High | Exponential backoff + user-friendly fallback message. All non-AI features still work. |
| Large files (30–50MB) causing slow analysis | Medium | Medium | Server-side processing only. Stream response. Show progress stages. |
| Statistical edge cases (all-null, single-value columns) | High | High | All profiler functions explicitly handle edge cases with fallback values. |
| Poorly formatted data (mixed types, bad encoding) | High | Medium | Smart encoding detection + type coercion pipeline with audit logging. |
| AI insights hallucinating column names or values | Medium | High | System prompt explicitly prohibits hallucination. Context includes exact values. Post-process to verify column names exist in dataset. |
| ML prediction fails on unusual dataset shapes | Medium | Medium | Graceful failure path: show "not enough data" card with explanation rather than crash. |
| User confusion over statistical terms | High | Medium | Mandatory plain-English explanation below every statistical value. |

---

## 11. Acceptance Criteria

A feature is considered complete and accepted when ALL of the following are true:

### Analysis Pipeline
- [ ] CSV, JSON, and Excel files all parse correctly
- [ ] Cleaning audit log shows every automated action
- [ ] Every numeric column has all 20+ statistical fields populated
- [ ] Every categorical column has top values, cardinality label, and rare values
- [ ] Every date column has range, granularity, and gap detection
- [ ] Quality score decreases predictably as data quality worsens
- [ ] Correlation matrix computes correctly for all numeric column pairs

### UI & Visualization
- [ ] Zero "NaN", "undefined", or "null" values visible in any UI state
- [ ] Every stat displayed has a plain-English sentence explaining it
- [ ] Every chart has a caption below it in plain English
- [ ] All 4 async states handled per component: loading, error, empty, success
- [ ] All charts animate on first render
- [ ] Tab transitions are smooth with AnimatePresence
- [ ] All metric cards count up from 0 on mount
- [ ] Mobile horizontal scroll works on all tables and wide charts

### AI Features
- [ ] Executive story references actual column names from the uploaded dataset
- [ ] No raw Gemini error message ever shown to user
- [ ] Suggested questions in Data Assistant are specific to the actual dataset columns
- [ ] Chat responses are grounded in analysis context, not generic

### Prediction Lab
- [ ] Both regression and classification paths work end-to-end
- [ ] Feature importance chart renders for all successful models
- [ ] Data health warning displays when model quality is low
- [ ] Forecast renders when a date column is detected

### Quality & Safety
- [ ] No API key visible in any frontend code or response
- [ ] All error boundaries prevent full-app crashes
- [ ] Reduced motion preference respected
- [ ] All SVG charts have aria-labels

---

*DataLens v3.0 — Product Requirements Document*  
*Version 3.0.0 · June 2026*  
*Status: Draft — Pending Engineering Sign-off*
