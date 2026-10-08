# RESUMEX-CLOUD — Cloud-Native AI Resume Intelligence & ATS Platform

> **"Scan. Match. Optimize."**  
> *Cloud-Native Resume Intelligence & ATS Platform*

[![CI/CD Pipeline](https://github.com/resumex/resumex-cloud/actions/workflows/ci.yml/badge.svg)](https://github.com/resumex/resumex-cloud)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-3776AB?logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Executive Summary

**Resumex-Cloud** is an enterprise-grade, cloud-native Applicant Tracking System (ATS) intelligence and career optimization platform. Built with a service-oriented architecture, it ingests candidate resumes (PDF, DOCX, TXT), validates document integrity, runs deterministic multi-tier natural language processing (NLP), performs transparent 7-dimension weighted scoring against job descriptions, identifies critical skill gaps, audits bullet points for measurable outcomes, checks parser compatibility, and generates executive-grade ATS audit reports.

Unlike superficial resume scanners that generate random or opaque percentage scores, **Resumex-Cloud features 100% explainable scoring mathematical models**, ensuring every percentage point is grounded in verifiable candidate evidence without fabricating experience or metrics.

---

## 2. Cloud-Native Architecture

```
                               ┌────────────────────────────────┐
                               │     USER / RECRUITER BROWSER   │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │   NEXT.JS 16 FRONTEND (Vite/Tw)│
                               │   Dark SOC / Cloud Console UI  │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │   FASTAPI API GATEWAY (REST)   │
                               │   Rate Limiter, CORS, JWT Auth │
                               └───────┬───────┬────────┬───────┘
                                       │       │        │
             ┌─────────────────────────┘       │        └─────────────────────────┐
             ▼                                 ▼                                  ▼
┌────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  DOCUMENT INGESTION    │       │     NLP & ATS ENGINE   │       │   OBSERVABILITY & LOGS │
│  PyMuPDF / python-docx │       │  7-Tier Semantic Match │       │  CloudEvent Stream     │
│  Magic Byte Validator  │       │  Transparent Scoring   │       │  Latency & Telemetry   │
└────────────┬───────────┘       └────────────┬───────────┘       └────────────┬───────────┘
             │                                │                                │
             ▼                                ▼                                ▼
┌────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  STORAGE ABSTRACTION   │       │   RELATIONAL DATABASE  │       │   REPORT SERVICE       │
│  S3 / R2 / Local Vault │       │   PostgreSQL / SQLite  │       │   ReportLab PDF Engine │
│  Signed Download URLs  │       │   SQLAlchemy & UUIDs   │       │   Secure Share Tokens  │
└────────────────────────┘       └────────────────────────┘       └────────────────────────┘
```

---

## 3. Core Features

### Real Document Processing
- **PyMuPDF (fitz) & pypdf Engine**: Extracts vector text streams, estimates layout density, and detects multi-column layout risks.
- **python-docx Engine**: Extracts headings, bullet lists, styles, and nested tables.
- **Scanned PDF & Image Detection**: Detects bitmap-only scanned documents and warns users when OCR pre-processing is required.
- **MIME & Magic Byte Verification**: Validates file headers (`%PDF`, `PK\x03\x04`), sanitizes filenames against path traversal, and enforces 15MB file size limits.

### Multi-Tier Semantic Matching Engine
Evaluates target requirements across **7 distinct tiers**:
1. **Exact Match**: Direct token equality.
2. **Normalized Match**: Case-insensitive and punctuation-stripped.
3. **Synonym Match**: Canonical aliasing (e.g., `K8s` $\leftrightarrow$ `Kubernetes`, `Postgres` $\leftrightarrow$ `PostgreSQL`, `AWS` $\leftrightarrow$ `Amazon Web Services`).
4. **Phrase Match**: Substring and n-gram detection within sentences.
5. **Fuzzy Match**: Levenshtein ratio matching via RapidFuzz ($\ge 88\%$).
6. **Section-Specific Match**: Proximity detection within Experience and Skills headers.
7. **Semantic Similarity**: TF-IDF Vectorization with Cosine Similarity.

### Transparent, Explainable ATS Scoring (100% Non-Random)
Every candidate receives an overall score computed strictly from weighted sub-scores:

| Evaluation Dimension | Weight | Mathematical Basis & Description |
| :--- | :---: | :--- |
| **Keyword Match** | **30%** | Ratio of matched technical/domain keywords to total job posting keywords. |
| **Skills Match** | **20%** | Non-negotiable mandatory skills (85% weight) + preferred bonus skills (15% weight). |
| **Experience Relevance** | **15%** | Years of tenure alignment + semantic relevance of role achievements. |
| **Education Match** | **10%** | Degree level matching (Bachelor's, Master's, Ph.D., Engineering). |
| **Job Title Alignment** | **10%** | Fuzzy matching of target title with recent headline and experience titles. |
| **Resume Structure** | **10%** | Presence of canonical ATS sections (Contact, Summary, Skills, Experience, Education). |
| **ATS Formatting** | **5%** | Inspection of column layout, table nesting, and image density. |

### Recruiter Mode & Unbiased Ranking
- Enterprise requisition management.
- Batch candidate processing with **zero discrimination**: strictly blind to race, gender, age, nationality, or protected classes.
- Automatic verdict classification: **Fast Track** ($\ge 88\%$), **Strong Match** ($\ge 75\%$), **Consider** ($\ge 60\%$), or **Review Gaps** ($< 60\%$).

### Bullet Point Impact Analyzer
- Detects passive and weak verbs (*"Worked on..."*, *"Helped with..."*, *"Responsible for..."*).
- Infuses Google XYZ formula: *"Accomplished [X] as measured by [Y], by doing [Z]"*.
- Recommends quantifiable metric placeholders without hallucinating false claims.

### Executive PDF Report Generation
- Compiled via **ReportLab** into a tamper-evident, professional audit report.
- Includes candidate badge, 7-dimension breakdown matrix, critical gaps table, and optimization roadmap.
- Instant download and secure temporal share tokens.

---

## 4. Technology Stack

- **Frontend**: Next.js 16.4 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion, Recharts.
- **Backend**: FastAPI 0.110+, Python 3.11+, Pydantic v2, Uvicorn, SQLAlchemy.
- **Document Processing**: PyMuPDF (fitz), pypdf, python-docx.
- **NLP & Mathematics**: scikit-learn, RapidFuzz, NumPy.
- **Storage**: StorageProvider abstraction supporting AWS S3, Cloudflare R2, MinIO, and Local Storage with HMAC signed URLs.
- **PDF Engine**: ReportLab.
- **Database**: SQLite (zero-config local) & PostgreSQL (cloud).
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD.

---

## 5. Local Development Setup

### Prerequisites
- Node.js 18+ (Tested on Node 20 / 24)
- Python 3.11+ (Tested on Python 3.11 / 3.14)
- Git

### 1. Clone & Setup Backend
```bash
cd resumex-cloud

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Run database tests to verify engine
pytest backend/tests -v
```

### 2. Start the Backend Server
```bash
# Set PYTHONPATH and start uvicorn
# Windows PowerShell:
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Linux/macOS:
PYTHONPATH=backend python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be available at: `http://127.0.0.1:8000`  
Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### 3. Start the Next.js Frontend
In a new terminal window:
```bash
cd resumex-cloud/frontend

# Install dependencies
npm install

# Start development server
npm run dev -- -p 3000
```
Open your browser at: `http://localhost:3000`

---

## 6. Running with Docker Compose

To run the complete production topology including PostgreSQL and Redis:

```bash
cd resumex-cloud

# Start all containers
docker compose up --build -d

# Check service health
docker compose ps
```

Services exposed:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## 7. Verification & Testing

Run the automated test suites:

```bash
# 1. Run unit & integration test suite (13 passing tests)
$env:PYTHONPATH="backend"; pytest backend/tests -v

# 2. Run full lifecycle verification script
$env:PYTHONPATH="backend"; python backend/tests/verify_flow.py

# 3. Run frontend TypeScript & production build
cd frontend && npm run build
```

---

## 8. API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Kubernetes health check (API, Database, Storage) |
| `GET` | `/ready` | Kubernetes readiness probe |
| `POST` | `/api/auth/register` | Register new tenant account |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT Bearer token |
| `POST` | `/api/resumes/upload` | Upload and ingest PDF/DOCX resume |
| `GET` | `/api/resumes` | List encrypted resumes in vault |
| `GET` | `/api/resumes/download/{file}` | Temporal signed download stream |
| `POST` | `/api/jobs` | Ingest and parse target job description |
| `POST` | `/api/analysis` | Execute comprehensive 7-dimension ATS analysis |
| `POST` | `/api/analysis/quick` | Zero-upload rapid demo analysis |
| `GET` | `/api/analysis/{id}` | Retrieve granular score breakdown and recommendations |
| `POST` | `/api/analysis/{id}/assistant` | AI assistant grounded query |
| `POST` | `/api/analysis/{id}/rewrite` | Before/after section optimization proposal |
| `POST` | `/api/reports/generate/{id}` | Generate executive ReportLab PDF report |
| `GET` | `/api/reports/download/{file}` | Download PDF report file |
| `POST` | `/api/recruiter/jobs` | Create recruiter requisition |
| `GET` | `/api/recruiter/jobs/{id}` | Fetch requisition with meritocratically ranked candidates |
| `GET` | `/api/cloud/stats` | Ingestion metrics, throughput, and cloud health |
| `GET` | `/api/cloud/events` | Structured telemetry event log stream |

---

## 9. Security & Privacy

- **Data Encryption**: Documents are encrypted at rest using AES-256 and stored in private object storage vaults.
- **Air-Gapped Local NLP Option**: The application can run 100% offline without external LLM dependencies, ensuring confidential candidate data never leaves enterprise firewalls.
- **PII Scrubbing**: Observability logs filter out candidate names, emails, telephone numbers, and credentials.
- **Deterministic Meritocracy**: Candidate ranking algorithms are programmatically blind to all protected demographics.

---

## 10. License

Released under the [MIT License](LICENSE). Built for enterprise engineering portfolios, hackathons, and production deployment.
