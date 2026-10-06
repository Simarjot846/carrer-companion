# AI Career Companion — Final Project Report

**Version:** 0.4.0 (Milestone 4)  
**Date:** October 2026

---

## Table of Contents

1. [Introduction & Problem Statement](#1-introduction--problem-statement)
2. [Objectives](#2-objectives)
3. [System Requirements](#3-system-requirements)
4. [System Architecture](#4-system-architecture)
5. [Dataset and Knowledge Base](#5-dataset-and-knowledge-base)
6. [RAG Pipeline](#6-rag-pipeline)
7. [Multi-Agent Architecture](#7-multi-agent-architecture)
8. [Application Tracking Module](#8-application-tracking-module)
9. [Testing and Evaluation](#9-testing-and-evaluation)
10. [Results and Analysis](#10-results-and-analysis)
11. [Limitations](#11-limitations)
12. [Future Scope](#12-future-scope)
13. [Conclusion](#13-conclusion)

---

## 1. Introduction & Problem Statement

Students applying for internships and early-career roles face a structurally unfair information asymmetry: job postings are dense with requirements, application materials demand role-specific tailoring, and interview preparation requires knowing both the role and your own profile deeply. Most students apply broadly and blindly, submitting the same generic resume to dozens of postings without understanding why they match or fall short on any given role.

Existing tools either provide generic advice (resume templates, canned interview questions) or opaque matching scores with no explanation. Neither helps a student understand the *why* behind a match, the *what* of their skill gaps, or the *how* of preparing for a specific role.

**AI Career Companion** addresses this by building a transparent, data-grounded AI pipeline that:
- Parses and verifies a student's actual resume into a structured profile
- Semantically retrieves and ranks relevant job postings using dense embeddings and LLM reranking
- Explains match reasoning in plain language with specific skill-level detail
- Analyses skill gaps across five structured categories with actionable recommendations
- Generates tailored resume bullets and cover letters grounded in the student's *real* experience only
- Produces a structured interview preparation package derived from the student's actual projects
- Provides a conversational career assistant grounded in the verified profile
- Tracks applications through a full pipeline from "Saved" to "Offer Received"

The key design principle throughout is **grounding**: every AI output is constrained to the student's verified profile data. The system will not invent skills, fabricate experience, or hallucinate qualifications.

---

## 2. Objectives

| # | Objective | Milestone |
|---|-----------|-----------|
| 1 | Parse PDF resumes into structured, schema-validated candidate profiles | M1 |
| 2 | Build a semantic job-matching pipeline using dense embeddings + LLM reranking | M2 |
| 3 | Implement skill gap analysis, resume customization, interview prep, and conversational assistant agents | M3 |
| 4 | Add application lifecycle tracking (CRUD + dashboard) | M4 |
| 5 | Validate the full pipeline end-to-end with automated testing | M4 |
| 6 | Identify and fix performance issues found during testing | M4 |
| 7 | Build a premium, launch-ready frontend that matches the system's capabilities | M4 |

---

## 3. System Requirements

### Tech Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Backend framework | FastAPI | Latest; async-ready REST API |
| ORM | SQLAlchemy | With Alembic-compatible declarative base |
| Database | SQLite (`dev.db`) | File-based; production-ready swap to PostgreSQL |
| PDF extraction | PyMuPDF (`fitz`) | Deterministic, no LLM dependency |
| LLM | Google Gemini (`gemini-3.6-flash`) | Via `google-generativeai` package |
| Embeddings | sentence-transformers `all-MiniLM-L6-v2` | 384-dim dense vectors, runs fully locally |
| Frontend | React 18 + TypeScript + Vite | |
| Styling | Tailwind CSS v4 + CSS custom properties | No `tailwind.config` — uses `@import "tailwindcss"` |
| Package manager | pip (Python) / npm (Node) | |
| Python version | 3.10 | |

### Key Dependencies (Python)

```
fastapi
uvicorn
sqlalchemy
pydantic[email]
pymupdf (fitz)
google-generativeai
sentence-transformers
numpy
python-dotenv
python-multipart
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Database connection string (defaults to `sqlite:///./dev.db`) |
| `GOOGLE_API_KEY` | Gemini API key (required for LLM features) |
| `VOYAGE_API_KEY` | Optional Voyage AI embedding key (falls back to local model if absent) |

### Running the Application

```bash
# Backend
uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# E2E tests (requires server running)
python scripts/e2e_test_milestone4.py
```

---

## 4. System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Vite)                           │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ Landing  │ │ Profile  │ │  Resume    │ │  Job Matches   │  │
│  │  Page    │ │ Creation │ │  Upload    │ │  (RAG results) │  │
│  └──────────┘ └──────────┘ └────────────┘ └────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ Skill    │ │ Résumé   │ │ Interview  │ │  Application   │  │
│  │ Gap View │ │ Tailor   │ │  Prep View │ │  Tracker       │  │
│  └──────────┘ └──────────┘ └────────────┘ └────────────────┘  │
│         ↕ HTTP/REST (proxied via Vite → localhost:8000)        │
├─────────────────────────────────────────────────────────────────┤
│  Backend (FastAPI)                                              │
│  Routers: /students  /resumes  /jobs  /agents  /applications   │
│                         ↕                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Services Layer                                         │   │
│  │  resume_parser.py  →  PyMuPDF text extraction           │   │
│  │  llm_extractor.py  →  Gemini JSON structuring           │   │
│  │  embedding_service.py → sentence-transformers / Voyage  │   │
│  │  vector_store.py   →  In-memory cosine similarity       │   │
│  │  matching_agent.py →  RAG + Gemini reranker + cache     │   │
│  │  skill_gap_agent.py   →  5-category gap analysis        │   │
│  │  customization_agent.py → resume bullets + cover letter │   │
│  │  interview_prep_agent.py → question package             │   │
│  │  career_assistant.py  →  multi-turn chat                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         ↕                                       │
│  ┌───────────────────────┐  ┌──────────────────────────────┐  │
│  │  SQLite (dev.db)      │  │  In-memory embedding index   │  │
│  │  Students, Resumes,   │  │  (JobPosting.embedding JSON  │  │
│  │  Skills, Education,   │  │   column → numpy cosine sim) │  │
│  │  Experience, Projects,│  └──────────────────────────────┘  │
│  │  JobPostings,         │                                     │
│  │  Applications         │                                     │
│  └───────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Resume → Profile

```
PDF upload → PyMuPDF text extraction → Gemini LLM (JSON schema)
→ Schema validation → DB commit (Skills, Education, Experience, Projects)
→ Profile available for matching and agents
```

### Data Flow: Job Matching

```
Student profile → format_candidate_profile_text()
→ sentence-transformers embedding (384-dim) → cosine similarity
→ top 10 candidates → top 5 sent to Gemini reranker
→ match_score + reasoning + missing_skills per job
→ sorted result (cached in _MATCHES_CACHE dict)
```

### File Structure

```
app/
  main.py               — FastAPI app, router registration, startup hook
  config.py             — Environment variable loading
  database.py           — SQLAlchemy engine, session, Base
  models.py             — ORM models (Student, Resume, Skill, Education,
                          Experience, Project, JobPosting, Application)
  schemas.py            — Pydantic schemas for all endpoints
  routers/
    students.py         — Profile creation, listing, profile fetch, matches
    resumes.py          — PDF upload, parsing pipeline
    jobs.py             — Job seeding, listing
    agents.py           — M3 agent endpoints (skill gap, customize,
                          interview prep, assistant chat)
    applications.py     — M4.1 CRUD + dashboard
  services/
    resume_parser.py    — PyMuPDF extraction
    llm_extractor.py    — Gemini JSON structuring with fallback
    embedding_service.py — sentence-transformers / Voyage AI
    vector_store.py     — Cosine similarity search over DB embeddings
    matching_agent.py   — Full RAG + LLM pipeline + in-memory cache
    skill_gap_agent.py  — 5-category gap analysis
    customization_agent.py — Resume bullets + cover letter
    interview_prep_agent.py — Structured question package
    career_assistant.py — Multi-turn conversational assistant

frontend/src/
  App.tsx               — Root component, step routing
  components/           — All page components
  services/api.ts       — All fetch calls to backend
  types.ts              — TypeScript interfaces
  index.css             — Complete design system (CSS custom properties)
```

---

## 5. Dataset and Knowledge Base

### Overview

The system's knowledge base consists of **160 job postings** seeded via `POST /jobs/seed`, defined in `app/routers/jobs.py`. All postings are stored in the `job_postings` table with pre-computed 384-dimensional embeddings.

### Domains Covered (8 domains, ~20 postings each)

| Domain | Representative Roles |
|--------|---------------------|
| Software Engineering | Backend Intern, Full-Stack Intern, Web Services Intern |
| Data Science | Data Science Intern, Analytics Intern, BI Intern |
| Machine Learning / AI | ML Research Intern, AI Engineering Intern |
| Product Management | APM Intern, Product Strategy Intern |
| UI/UX Design | Product Design Intern, UX Research Intern |
| DevOps / Cloud | Platform Engineering Intern, Cloud Intern |
| Marketing Technology | GTM Intern, Growth Analytics Intern |
| Finance / Quant | Quantitative Analyst Intern, FinTech Intern |

### Schema

Each job posting stores:
- `title`, `company`, `location`, `posting_type` (internship/full-time), `experience_level`
- `description`, `responsibilities`, `qualifications`
- `required_skills` (JSON array), `preferred_skills` (JSON array)
- `experience_requirements`, `education_requirements`
- `embedding` (JSON array, 384 floats) — pre-computed via `all-MiniLM-L6-v2`

### Generation and Cleaning

The 160 postings were authored to represent realistic internship and entry-level job descriptions with specific, varied required skills lists. Each posting was embedded at seed time so retrieval is instant at query time (no embedding call needed for the job corpus, only for the candidate profile).

---

## 6. RAG Pipeline

### Architecture

The system implements a two-stage **Retrieve → Rerank** RAG pipeline.

**Stage 1 — Dense Retrieval** (`vector_store.py`, `embedding_service.py`):
1. The student's full profile is formatted into a structured text document by `format_candidate_profile_text()` in `matching_agent.py`
2. This text is embedded using `sentence-transformers all-MiniLM-L6-v2` (384-dim, L2-normalized)
3. Cosine similarity is computed against all 160 pre-embedded job postings using `numpy` dot product
4. Top 10 candidates by cosine similarity are returned

**Stage 2 — LLM Reranking** (`matching_agent.py`):
1. The top 5 candidates (by embedding score) are passed to `gemini-3.6-flash` as a structured prompt
2. Gemini returns per-job: `match_score` (0-100), `reasoning` (2 sentences), `missing_skills` (list)
3. Scores are validated and merged with vector similarity metadata
4. Final ranking is by `match_score` (descending); fallback uses proportional skill overlap scoring

**Caching** (`_MATCHES_CACHE` dict in `matching_agent.py`):
- Results are cached in-memory by `student_id`
- `force_refresh=True` bypasses the cache (exposed as a query param on `GET /students/{id}/matches`)
- Cache is per-process; cleared on server restart

### Embedding Approach

- **Model:** `all-MiniLM-L6-v2` from sentence-transformers
- **Dimensions:** 384
- **Normalization:** L2-normalized embeddings; cosine similarity is computed as dot product
- **Chunking decision:** Each job posting is embedded as a **single document** (no chunking). Job postings are concise enough (~400-800 tokens) that chunking would destroy cross-field semantic coherence (e.g. "requires Python" is more meaningful in context of the full role than as an isolated fragment).
- **Candidate profile:** Also embedded as a single document; the profile text format was designed to mirror the job posting text format for embedding-space alignment
- **Indexing:** No external vector database (e.g. pgvector) is used. Embeddings are stored as JSON arrays in the `job_postings.embedding` column and loaded into a `numpy` array at query time for cosine similarity computation. This is an in-memory linear scan — acceptable for 160 postings, not suitable at scale.

---

## 7. Multi-Agent Architecture

The system implements five specialized agents, each a stateless function called per-request and grounded exclusively in the student's verified DB data.

### Agent 1 — Resume Parsing Agent

**File:** `app/services/llm_extractor.py`  
**Trigger:** `POST /students/{id}/resume` (via `app/routers/resumes.py`)

**Input:** Raw text extracted from PDF by PyMuPDF  
**Output:** Structured JSON `{skills, education, experience, projects}`  
**LLM call:** Single `gemini-3.6-flash` call with schema-constrained prompt  
**Fallback:** `_fallback_extract_profile()` — keyword matching against a known-skills list  
**Validation:** Required keys checked before DB commit; parsing_status = "failed" if LLM errors

**Design decision:** PDF text extraction is handled by PyMuPDF (deterministic, no LLM needed). The LLM only handles the structuring step — converting unstructured resume text into typed JSON fields. This separation ensures the LLM's job is purely semantic classification, not raw OCR.

---

### Agent 2 — Job-Resume Matching Agent

**File:** `app/services/matching_agent.py`  
**Trigger:** `GET /students/{id}/matches`

**Input:** Full student profile (all skills, education, experience, projects)  
**Output:** Ranked list of `{job_id, match_score, reasoning, missing_skills, vector_similarity}`  
**Pipeline:** Dense retrieval (top 10) → LLM reranking of top 5 → merge + sort  
**LLM model:** `gemini-3.6-flash`  
**Fallback:** `_fallback_scoring()` — skill overlap percentage  
**Cache:** In-memory `_MATCHES_CACHE` dict keyed by `student_id`

---

### Agent 3 — Skill Gap Analysis Agent

**File:** `app/services/skill_gap_agent.py`  
**Trigger:** `GET /students/{id}/skill-gap/{job_id}`

**Input:** Student profile + specific job posting  
**Output:** Five-category gap report:
- `critical_missing` — required skills not in profile
- `partially_demonstrated` — skills present but not at required depth
- `preferred_gaps` — nice-to-have skills absent from profile
- `experience_gaps` — experience-level mismatches
- `qualification_gaps` — education/certification gaps
- `overall_readiness_score` (0-100) + `readiness_summary`

**LLM model:** `gemini-3.6-flash` with 45s timeout  
**Fallback:** Direct required-skills diff against student skill set  
**Validation:** `_validate_skill_gap_response()` checks all 5 category keys before returning

---

### Agent 4 — Resume & Cover Letter Customization Agent

**File:** `app/services/customization_agent.py`  
**Trigger:** `POST /students/{id}/customize/{job_id}`

**Input:** Rich student profile + job posting  
**Output:**
- `resume_customization`: `{prioritized_skills, relevant_experiences, relevant_projects, rewritten_bullets, section_order_recommendation, tailoring_notes}`
- `cover_letter`: `{subject_line, body, hallucination_check}`

**LLM model:** `gemini-3.6-flash`, two separate calls (resume + cover letter), both 45s timeout  
**Hallucination guard:** `_check_hallucination()` — verifies cover letter body doesn't contain boilerplate placeholders and is of minimum length; runtime heuristic check  
**Hard constraint in prompt:** "MUST NOT invent, add, or imply any skill, experience, achievement, technology, number, or outcome that is not explicitly stated in the student profile"

---

### Agent 5 — Interview Preparation Agent

**File:** `app/services/interview_prep_agent.py`  
**Trigger:** `GET /students/{id}/interview-prep/{job_id}`

**Input:** Student profile + job posting + optional skill gap output (from Agent 3, called first when available)  
**Output:** Five question categories + `topics_to_revise`:
- `technical_questions` (3-4): based on required skills
- `resume_questions` (2-3): referencing student's actual listed experience
- `project_questions` (2-3): referencing student's actual listed projects
- `role_questions` (2-3): based on job responsibilities
- `hr_questions` (2-3): general behavioural questions
- `topics_to_revise` (4-6): specific technical topics from gaps + job requirements

**LLM model:** `gemini-3.6-flash` with 45s timeout  
**Gap enrichment:** Agent 3 is invoked first inside the interview-prep endpoint; its output is passed to Agent 5 to make the prep package gap-aware. If Agent 3 fails, Agent 5 runs without gap context.

---

### Agent 6 — Conversational Career Assistant

**File:** `app/services/career_assistant.py`  
**Trigger:** `POST /students/{id}/assistant/chat`

**Input:** Current message + conversation history (client-side state) + student profile from DB  
**Output:** `{reply, updated_history}`  
**Context window management:** History trimmed to last `MAX_HISTORY_TURNS = 6` full turns before each call to prevent prompt bloat  
**Profile grounding:** Student's skills, education, experience, and projects are injected as a system context block at the start of every Gemini multi-turn call  
**Memory model:** Single-session only; history is stateless server-side and must be sent by the client with every request. No cross-session persistence.

---

## 8. Application Tracking Module

### Overview (M4.1)

The Application Tracking Module provides a full CRUD pipeline for tracking a student's job application lifecycle from initial interest through to offer or rejection.

### Data Model (`Application` — `app/models.py`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | Integer PK | Auto-increment |
| `student_id` | Integer FK → students | Indexed |
| `company_name` | String | Required |
| `job_title` | String | Required |
| `job_description` | Text | Optional |
| `job_posting_id` | Integer FK → job_postings | Optional — links to a matched posting |
| `application_date` | Date | When the student submitted |
| `deadline` | Date | Application deadline (used for upcoming alerts) |
| `status` | String | One of 10 valid statuses (see below) |
| `interview_date` | DateTime | Used for 7-day interview alerts |
| `interview_status` | String | Not Scheduled / Scheduled / Completed / Cancelled / Rescheduled |
| `notes` | Text | Free-form notes |
| `job_url` | String | External posting URL |
| `resume_version_note` | Text | Reference to AI-tailored resume variant used |
| `cover_letter_version_note` | Text | Reference to AI cover letter variant used |
| `created_at`, `updated_at` | DateTime | Auto-managed |

### Application Status Lifecycle

```
Saved → Planning to Apply → Applied → Under Review → Shortlisted
  → Interview Scheduled → Interview Completed → Offer Received
  ↘ Rejected (from any status)
  ↘ Withdrawn (from any status)
```

### API Endpoints (`app/routers/applications.py`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/students/{id}/applications` | Create a new entry |
| `GET` | `/students/{id}/applications` | List all with optional filters (company, role, status, date range) |
| `PATCH` | `/students/{id}/applications/{app_id}` | Update any field |
| `DELETE` | `/students/{id}/applications/{app_id}` | Delete an entry |
| `GET` | `/students/{id}/applications/dashboard` | Summary counts + upcoming 7-day alerts |

### Dashboard Response

```json
{
  "total_applications": 12,
  "active_applications": 9,
  "applied_count": 4,
  "interview_scheduled": 2,
  "offers_received": 1,
  "rejected_count": 2,
  "upcoming": [
    {
      "application_id": 3,
      "company_name": "CloudScale Systems",
      "job_title": "SWE Intern",
      "type": "interview",
      "date": "2026-10-08T14:00:00",
      "days_away": 5
    }
  ]
}
```

The `upcoming` list surfaces all deadlines and interviews falling within the next 7 days, sorted by `days_away`. Items with `days_away ≤ 2` are highlighted as urgent in the frontend.

### Frontend (`ApplicationTracker.tsx`)

- **Dashboard strip:** 6 stat cards (total / active / applied / interviews / offers / rejected)
- **7-day alert panel:** Upcoming deadlines and interviews highlighted with urgency colouring
- **Table view:** Sortable rows with inline status dropdown (click to change without a modal)
- **Add/Edit modal:** All fields exposed — company, role, status, dates, interview info, notes, job URL, AI artefact version notes
- **Notes panel:** Displays notes and AI version references for entries that have them

---

## 9. Testing and Evaluation

### Test Script

**File:** `scripts/e2e_test_milestone4.py`

The test script covers the full workflow for 3 student profiles, testing 103 distinct checks:

- Server health check
- Job posting seed verification (100+ postings confirmed)
- Per-profile pipeline (3 profiles × ~30 checks each):
  - Profile creation
  - Resume upload and parsing (PDF generated via PyMuPDF)
  - Profile data quality (non-fallback extraction: ≥3 skills, ≥1 education)
  - Job matching quality (≥3 matches, top score ≥50%, reasoning is job-specific)
  - Domain relevance of top match
  - Skill gap analysis (readiness score 0-100, summary present, ≥1 gap category populated)
  - Customization quality (prioritized_skills non-empty, cover letter ≥100 chars)
  - Hallucination check (cover letter scanned for invented technical terms)
  - Interview prep (≥5 total questions, ≥3 technical, job-skill reference ≥15%)
  - Application CRUD (create, update, list, dashboard)
  - Cross-agent consistency (gap skills not listed as strengths in customization)
  - Profile fetch latency
- Multi-turn assistant (5-turn conversation, context retention verified)

### Results (Post-Optimization Run)

```
SUMMARY:  101/103 passed   2 warnings   0 failures
```

| Profile | Skills Extracted | Top Match Score | Reasoning Specific | Parse Time |
|---------|-----------------|-----------------|-------------------|------------|
| Alpha (SWE) | 16 | 98% | ✓ | 16.7s (cold) |
| Beta (DS) | 11 | 92% | ✓ | 2.5s |
| Gamma (ML) | 5 | 80% | ✓ | 2.5s |

**2 warnings (informational only):**
- Beta: top embedding match was a web-services role (corrected to 92% by LLM reranker)
- Gamma: same pattern — LLM reranker corrected to an appropriate 80% match

**0 failures** post-optimization.

---

## 10. Results and Analysis

### Optimization Impact (M4.3)

The most impactful finding from M4.2 was a silent 2-second timeout on three Gemini API calls in `customization_agent.py`, `skill_gap_agent.py`, and `interview_prep_agent.py`. This caused the LLM path to silently fall through to the fallback (empty `prioritized_skills`, generic reasoning) on any API call slower than 2 seconds.

**Before fix:** 9 FAIL results across the three profiles for customization and gap-analysis quality  
**After fix (timeout raised to 45s):** All 9 converted to PASS

No other code changes were made. The domain-relevance warning is a documented limitation of single-vector retrieval and does not represent a failure — the LLM reranker correctly resolves it every time.

### Matching Quality

Across the 3 test profiles, the Gemini reranker produced match scores of 98%, 92%, and 80%, with role-specific reasoning citing actual skills from the student profiles by name. The fallback scoring (used when the LLM is unavailable) produces scores in the 40-60% range with generic text — clearly distinguishable from the LLM path.

### Cross-Agent Consistency

All three profiles passed the cross-agent consistency check: no skill flagged as a critical gap by Agent 3 appeared as a "prioritized strength" in Agent 4's resume customization output. The separation between what to highlight (strengths) and what to acknowledge (gaps) was maintained correctly.

### Hallucination Check

All three cover letters passed the hallucination check. No cover letter introduced technical terminology not present in the student's verified profile. The most common detected patterns in prior testing (before the timeout fix caused fallback) were the correct fallback cover letters, which used only actual profile data.

### Agent Response Times (Warm API)

| Agent | Typical Time |
|-------|-------------|
| Resume parsing | 2.5s (warm), 16.7s (cold start) |
| Job matching | 4.5–5.6s |
| Skill gap | 2.4–4.1s |
| Customization (resume + cover letter) | 2.8–5.8s |
| Interview prep | 2.7–5.9s |
| Assistant chat (single turn) | 2.5–4s |

---

## 11. Limitations

The following limitations are honest and accurate for the current implementation:

1. **No OCR for scanned resumes.** PyMuPDF extracts text from text-layer PDFs only. Scanned image PDFs produce an empty extraction, which fails with a clear error message. There is no OCR fallback.

2. **In-memory vector search, not pgvector.** The 160-job embedding index is a numpy linear scan over JSON-stored embeddings. This is adequate for 160 postings but would not scale beyond ~10,000 without a real vector database (pgvector, Weaviate, Pinecone, etc.).

3. **No persistent cross-session assistant memory.** The conversational assistant is stateless server-side. Conversation history is maintained by the client and sent with each request. Closing the browser tab loses the conversation. There is no user account persistence.

4. **Single-vector retrieval has domain-bleed.** Profiles with strong Python skills retrieve web-services roles at the embedding layer even if the candidate's background is data science or ML. The LLM reranker corrects this, but the issue demonstrates that single-vector dense retrieval conflates domains when shared vocabulary is high.

5. **LLM output truncation on large prompts.** Gemini occasionally produces truncated JSON when the prompt context is large (long resumes + long job descriptions). The JSON parser falls back gracefully, but this means some customization/gap analyses use the deterministic fallback rather than the LLM path.

6. **No live mock interview.** The interview prep agent generates a static question package, not a live conversational interview simulator. All questions are pre-generated — there is no real-time follow-up.

7. **Gemini API cold-start latency.** The first Gemini API call after server restart takes 14–17 seconds due to model warm-up on Google's infrastructure. Subsequent calls are consistently 2.5–6 seconds.

8. **No authentication or user isolation.** The API has no authentication layer. Any client that knows a student ID can access that student's profile. This is acceptable for a demo system but not for production deployment.

9. **SQLite in development.** The system uses SQLite via `DATABASE_URL` in `.env`. `database.py` supports a PostgreSQL URL via the same environment variable, but no migration tooling (Alembic) is set up.

---

## 12. Future Scope

In rough priority order:

1. **pgvector migration.** Replace the in-memory numpy similarity scan with pgvector on PostgreSQL. This would enable the vector index to persist across restarts, scale to millions of postings, and support filtered vector search.

2. **Persistent cross-session assistant memory.** Store conversation summaries (not full histories) in the database keyed by student ID. Allow the assistant to reference "last week we discussed..." for returning users.

3. **OCR support for scanned resumes.** Integrate `pytesseract` or a cloud OCR service (AWS Textract, Google Document AI) as a fallback when PyMuPDF extracts empty text.

4. **Live mock interview.** Extend the assistant into a structured mock-interview mode: the assistant plays the interviewer role, asks the pre-generated questions one at a time, and provides structured feedback on each answer.

5. **Automated application status syncing.** Integrate with email parsing or webhooks to auto-detect rejection/offer emails and update the application tracker status without manual entry.

6. **Multi-vector / hybrid retrieval.** Embed candidate profiles into multiple sub-vectors (skills vector, experience vector, domain vector) for more precise domain-specific retrieval, reducing the domain-bleed issue seen in M4.2 testing.

7. **Authentication and multi-user isolation.** Add JWT-based authentication to protect student data and enable proper multi-user deployment.

8. **Real job scraping pipeline.** Replace the static 160-posting seed with a live scraping pipeline that ingests new postings from job boards and auto-embeds them at ingestion time.

---

## 13. Conclusion

AI Career Companion demonstrates that a transparent, grounded AI pipeline can meaningfully improve the job application experience for students. The system correctly refuses to invent qualifications, grounds every output in verified resume data, and provides specific, actionable reasoning rather than opaque scores.

Across Milestones 1–4, the project delivered:
- A deterministic PDF resume parsing pipeline (PyMuPDF + Gemini structuring)
- A two-stage RAG matching system (sentence-transformers retrieval + Gemini reranking) across 160 indexed postings
- Five AI agents providing gap analysis, resume tailoring, interview prep, career guidance, and cover letter generation
- An application lifecycle tracker with a 7-day upcoming alert system
- A comprehensive automated E2E test suite (103 checks, 101 passed, 0 failures)
- A premium-quality frontend redesigned with a full design system (17px body text, 64px hero headlines, comprehensive CSS custom property design tokens)

The M4.2 test suite revealed and fixed a critical silent-failure bug (2-second Gemini API timeout causing fallback on all structured JSON agents). After the fix, all major pipeline checks pass cleanly, with two informational warnings that are accurately documented as known limitations of the architecture.

The system is demo-ready as a showcase of applied AI engineering: grounded LLM outputs, validated agent pipelines, real semantic retrieval, and a production-quality user interface.
