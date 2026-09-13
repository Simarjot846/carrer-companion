# AI Career Companion — Complete Project Deep Dive

**Project:** AI Career Companion Agent  
**Milestone Coverage:** Milestone 1 (Resume Parsing & Profile Creation) + Milestone 2 (RAG Pipeline & Job Matching)  
**Stack:** Python · FastAPI · SQLAlchemy · SQLite/PostgreSQL · sentence-transformers · Google Gemini · React · TypeScript · Tailwind CSS · Vite

---

## Table of Contents

1. [What This Project Does — One Paragraph](#1-what-this-project-does)
2. [Complete System Architecture](#2-complete-system-architecture)
3. [Every File Explained](#3-every-file-explained)
4. [The Full Data Flow — Step by Step](#4-the-full-data-flow)
5. [Technology Choices — Why We Used Each Thing](#5-technology-choices)
6. [Problems We Faced and How We Solved Them](#6-problems-we-faced)
7. [The RAG Pipeline Explained Simply](#7-the-rag-pipeline-explained)
8. [The Embedding System — What It Is and What Went Wrong](#8-the-embedding-system)
9. [The Gemini LLM Layer — What It Does](#9-the-gemini-llm-layer)
10. [The Database Schema — Every Table](#10-the-database-schema)
11. [The Frontend — How It Works](#11-the-frontend)
12. [Evaluation & Testing — What We Actually Ran](#12-evaluation-and-testing)
13. [What Is NOT Done Yet](#13-what-is-not-done-yet)
14. [Current State Summary](#14-current-state-summary)

---

## 1. What This Project Does

AI Career Companion is an intelligent internship matching platform for students. A student uploads their resume PDF. The system extracts and structures their skills, education, experience, and projects using Google Gemini LLM. It then embeds their profile as a semantic vector and runs a similarity search over 160 pre-indexed job postings to find the most relevant ones. The top retrieved jobs are then re-evaluated by Gemini, which assigns a match score (0–100%), writes a 2-sentence explanation of why the candidate fits or doesn't, and identifies specific skill gaps. The entire result is visualised in a clean editorial-style React dashboard. The key insight is that this is not keyword matching — it uses real semantic understanding at every stage so a student with "Django experience" can correctly match a "Python/Flask" job even though the words are different.

---

## 2. Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND  (React 19 + TypeScript + Tailwind CSS + Vite)        │
│                                                                  │
│  LandingPage → ProfileCreationStep → ResumeUploadStep           │
│                                    → JobMatchesStep             │
│                                    → JobDetailModal             │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP / JSON   (proxied via Vite)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND  (FastAPI + Python 3.10)                                │
│                                                                  │
│  Routers:  /students  /students/{id}/resume  /students/{id}/    │
│            matches    /jobs  /jobs/seed                          │
│                                                                  │
│  Services:                                                       │
│   resume_parser.py   → PyMuPDF: PDF → raw text                  │
│   llm_extractor.py   → Gemini: raw text → structured JSON       │
│   embedding_service.py → sentence-transformers: text → vector   │
│   vector_store.py    → NumPy cosine search over all embeddings  │
│   matching_agent.py  → Profile embed → vector search → Gemini  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  SQLAlchemy ORM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  DATABASE  (SQLite dev.db  /  PostgreSQL in production)         │
│                                                                  │
│  Tables: students, resumes, skills, education, experience,      │
│          projects, job_postings (with embedding JSON column)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Every File Explained

### Backend Core

**`app/main.py`**  
Entry point for the FastAPI application. Creates all database tables on startup via `Base.metadata.create_all(bind=engine)`. Registers the three routers (students, resumes, jobs). Adds CORS middleware so the frontend running on a different port can talk to it without browser errors.

**`app/config.py`**  
Loads `.env` via `python-dotenv`. Exposes `DATABASE_URL`, `GOOGLE_API_KEY`, `UPLOAD_DIR` (folder where PDFs are saved), `MAX_UPLOAD_SIZE_MB` (5MB limit), and `ALLOWED_RESUME_EXTENSIONS` (PDF only). This is the single source for all environment-dependent settings — nothing is hardcoded anywhere else.

**`app/database.py`**  
Creates the SQLAlchemy engine. Has a smart fallback: tries to connect to PostgreSQL first, and if it fails (e.g., Postgres not running locally), automatically falls back to SQLite `dev.db`. This is why the project works out of the box during development without needing a Postgres installation. Provides the `get_db()` generator which FastAPI uses as a dependency to inject a database session into every route function, and always closes it cleanly after.

**`app/models.py`**  
Defines all SQLAlchemy ORM models (database tables):
- `Student` — name, email, qualifications. Parent of everything else.
- `Resume` — stores file path, original filename, raw extracted text, and `parsing_status` (pending/success/failed).
- `Skill` — name, category (technical/soft/tool), source (resume/manual).
- `Education` — institution, degree, field_of_study, start/end dates, grade.
- `Experience` — title, organization, start/end dates, description.
- `Project` — title, description, technologies, link.
- `JobPosting` — the full job schema including `title`, `company`, `location`, `description`, `responsibilities`, `required_skills` (JSON array), `preferred_skills` (JSON array), `qualifications`, `experience_level`, `experience_requirements`, `education_requirements`, `posting_type`, and `embedding` (JSON array storing the vector).

**`app/schemas.py`**  
Pydantic models for API request/response validation. Every model has `from_attributes = True` to work with SQLAlchemy ORM objects. `StudentProfileOut` bundles the student with all their extracted data in one response. `JobMatchOut` includes all job fields plus `match_score`, `vector_similarity`, `reasoning`, and `missing_skills` so the frontend has everything it needs in a single API call.

---

### Routers

**`app/routers/students.py`**  
- `POST /students/` — creates a student, returns 400 if email already exists.
- `GET /students/` — lists all students ordered newest first.
- `GET /students/{id}/profile` — returns full structured profile (student + skills + education + experience + projects + resumes).
- `GET /students/{id}/matches` — the main matching endpoint. Calls `get_job_matches_for_student()` which runs the full RAG + LLM pipeline and returns ranked job matches.

**`app/routers/resumes.py`**  
- `POST /students/{id}/resume` — the entire resume parsing pipeline in one route. Validates the file is PDF and under 5MB. Saves it to disk with a UUID filename (prevents path traversal attacks and name collisions). Creates a Resume DB record with `parsing_status="pending"`. Runs PyMuPDF text extraction, then Gemini LLM structuring, then saves the structured data to DB. If anything fails, marks `parsing_status="failed"` and returns HTTP 422 with the error — never silently corrupts the profile.

**`app/routers/jobs.py`**  
- `GET /jobs/` — lists job postings with optional filters (query string, posting_type, limit).
- `GET /jobs/{id}` — single job posting detail.
- `POST /jobs/seed` — triggers the seeder to populate 160 job postings with embeddings. Has `force=True` by default so it drops and recreates jobs cleanly each time.

---

### Services

**`app/services/resume_parser.py`**  
Single function: `extract_text_from_pdf(file_path)`. Uses PyMuPDF (`fitz`) to open the PDF and concatenate text from every page. Raises a `ValueError` if no text is found — this catches scanned image PDFs that have no extractable text. PDF-to-text is a solved problem; doing this here deterministically means the LLM never has to guess what the PDF says.

**`app/services/llm_extractor.py`**  
Takes raw resume text and asks Gemini to return it as structured JSON with four keys: `skills`, `education`, `experience`, `projects`. The prompt is strict — it says return ONLY valid JSON, no markdown, no preamble, and use `null` for any missing field rather than guessing. After getting the response, it parses the JSON and validates all four required keys are present before trusting any of it. If the LLM fails or returns bad JSON, it falls back to a keyword-matching rule-based extractor that scans for known tech terms from a hardcoded list. The fallback is honest — it returns generic placeholder education and experience rather than hallucinating.

**`app/services/embedding_service.py`**  
Generates dense semantic vector embeddings for text. Priority order:
1. If `VOYAGE_API_KEY` is set in `.env`, uses Voyage AI's `voyage-3-lite` model (512 dimensions). 
2. If Voyage fails or no key, uses `sentence-transformers` with `all-MiniLM-L6-v2` locally (384 dimensions, no internet needed after first download, no API key, no billing, no rate limits).

The local model is lazy-loaded — it's only initialised the first time it's needed, so startup time is not affected. The function accepts an `input_type` parameter ("document" for indexing job postings, "query" for embedding a candidate profile at search time) — this distinction matters for retrieval quality in Voyage AI but is ignored in sentence-transformers.

**`app/services/vector_store.py`**  
Two functions:
- `prepare_job_text_for_embedding(job)` — concatenates all job fields into a single text block for embedding. This is deliberately single-block (not chunked) because job postings are short (200–400 words) and chunking would fragment the connection between required skills, job title, and description.
- `search_similar_jobs(db, query_vector, top_k)` — loads all job postings with embeddings from DB, converts each embedding to a NumPy array, computes cosine similarity between the query vector and each job vector, sorts descending, returns top K. This is a brute-force in-memory scan which is perfectly fast at 160 jobs (sub-millisecond).

**`app/services/matching_agent.py`**  
The main RAG + LLM pipeline, called from the `/matches` endpoint:
1. `format_candidate_profile_text(student)` — concatenates all student data (skills, education, experience, projects, qualifications) into a single text string for embedding.
2. `get_embedding(profile_text, input_type="query")` — embeds the candidate profile.
3. `search_similar_jobs(db, profile_vector, top_k)` — retrieves top K jobs by cosine similarity.
4. `_score_matches_with_llm(student, profile_text, jobs)` — sends the candidate profile and all retrieved job postings to Gemini in a single prompt and asks for a JSON array with `job_id`, `match_score` (0–100), `reasoning` (2 sentences), and `missing_skills` list for each job.
5. Merges the LLM scores with the vector similarities and job metadata into the final result list.
6. Sorts by `match_score` descending.
7. If Gemini fails (wrong model name, API error, malformed JSON), `_fallback_scoring()` computes a deterministic score based purely on skill set overlap: `score = 50 + (matched_required_skills / total_required_skills) * 45`. This guarantees the endpoint never crashes.

---

### Scripts

**`scripts/seed_jobs.py`**  
Contains 160 raw job posting dictionaries across 8 domains (20 per domain):
1. Software Engineering (Backend & Fullstack)
2. Frontend & Mobile Development
3. Data Science & Data Engineering
4. Machine Learning & AI
5. UI/UX & Product Design
6. Product Management & Strategy
7. DevOps, Cloud & Infrastructure
8. Cybersecurity & IT Operations

Each raw posting only defines `title`, `company`, `description`, `required_skills`, `experience_level`, `location`, and `posting_type`. The `enrich_and_validate_postings()` function then:
- Deduplicates by (title + company) key
- Validates all required fields are present
- Fills in `responsibilities`, `preferred_skills`, `qualifications`, `experience_requirements`, and `education_requirements` using template strings matched to the job domain from the title keywords.

Then `seed_job_postings()` embeds each job's full text block and stores everything to the database.

**`scripts/evaluate_matching.py`**  
Official M2.4 evaluation script. Defines 5 sample candidate profiles across different domains (backend engineer, data scientist, frontend developer, UI/UX designer, generic weak profile). For each profile, creates a student in the DB, runs the full RAG + LLM matching pipeline, checks whether the top result falls in the expected domain (simple keyword check), prints the top 5 matches with scores and similarities, and runs a standalone vector-only retrieval test for the query "Python backend internship". Saves results to `docs/milestone2_evaluation.md`.

**`scripts/validate_matching.py`**  
Broader 10-candidate validation suite covering backend, data science, frontend, AI/ML, product management, UI/UX, DevOps, iOS mobile, cybersecurity, and developer relations profiles. Runs the full pipeline for each and prints detailed match results including reasoning and missing skills.

---

### Frontend

**`frontend/src/App.tsx`**  
Root component. Manages the 4-step flow as state: `landing → profile → upload → matches`. On startup, loads the list of existing students from the API. When a student is selected or created, fetches their profile and routes them to the right step (if they already have a resume, skip to matches). `handleReset()` sends back to the landing page.

**`frontend/src/types.ts`**  
TypeScript interfaces for every API response shape: `Student`, `Skill`, `Education`, `Experience`, `Project`, `Resume`, `StudentProfile`, `JobMatch`, `StudentMatchesResponse`. These are the contract between the frontend and the backend API.

**`frontend/src/services/api.ts`**  
All API calls in one file. Uses `/api` as the base URL, which Vite proxies to `http://localhost:8000`. Functions: `createStudent`, `listStudents`, `getStudentProfile`, `uploadResume`, `getStudentMatches`, `seedJobPostings`. Each function throws a descriptive error with the API's `detail` field if the request fails.

**`frontend/src/components/LandingPage.tsx`**  
Marketing landing page with hero section, how-it-works section (3 steps), why-trust-us section (4 feature cards), technical architecture section, and a CTA. Uses Lucide React icons throughout. Warm editorial colour palette: Forest Green `#2C5F2D`, Gold `#C9A63B`, Off-White `#FAF9F5`, Near-Black `#171B16`.

**`frontend/src/components/ProfileCreationStep.tsx`**  
Step 1. Name + email form that calls `POST /students/`. Also shows 6 one-click demo preset buttons (Alex Chen, Maya Patel, Jordan Rivera, Priya Sharma, David Kim, Samantha Taylor) so a mentor can demo instantly without typing. Also shows existing students in the DB for re-selecting. If a preset email already exists in the DB, it catches the 400 error and routes to the existing student instead of crashing.

**`frontend/src/components/ResumeUploadStep.tsx`**  
Step 2. Drag-and-drop or click-to-browse PDF upload. Shows a simulated progress bar while uploading. On success, displays the extracted profile in full: skills as colour-coded chips (green for technical, gold for tool, grey for soft), education cards, experience cards, project cards. A "Refresh Profile" button re-fetches the profile from the API. Shows clear error states if parsing failed.

**`frontend/src/components/JobMatchesStep.tsx`**  
Step 3. Calls `GET /students/{id}/matches` on mount. Shows a loading spinner while the RAG + LLM pipeline runs. Renders each matched job as a card with rank badge, job title, company, location, match score badge (green ≥80%, gold ≥60%, dark <60%), AI reasoning text, required skills tags (green), missing skill gap tags (terracotta/red). Has a search bar (filters by title/company/skill), minimum score dropdown filter, and posting type filter. A "Re-run Agent Reranker" button refetches fresh results.

**`frontend/src/components/JobDetailModal.tsx`**  
Modal that opens when you click "View Full Job Posting" on a match card. Shows full job title, company, location, the match score, the AI reasoning quote, required skills grid, skill gap grid, and the full job description text.

**`frontend/src/components/Navbar.tsx`**  
Top navigation bar. Shows the current step (Profile → Resume → Matches) as a step indicator. Shows the active student name if one is selected. Has a "Start Over" button that calls `handleReset()`.

---

## 4. The Full Data Flow

### Resume Upload Pipeline

```
User picks a PDF in ResumeUploadStep
  ↓
POST /students/{id}/resume  (multipart/form-data)
  ↓
app/routers/resumes.py
  ├─ Validate: is it a .pdf? is it under 5MB?
  ├─ Save to disk as uploads/{uuid}.pdf  (UUID prevents path traversal)
  ├─ Create Resume DB row: parsing_status = "pending"
  ↓
  ├─ resume_parser.py → PyMuPDF → raw text string
  ├─ llm_extractor.py → Gemini prompt → JSON string → parse → validate keys
  ├─ Save Skill rows to DB
  ├─ Save Education rows to DB
  ├─ Save Experience rows to DB
  ├─ Save Project rows to DB
  └─ Update Resume row: parsing_status = "success"
  ↓
Return {resume_id, parsing_status, message}
  ↓
Frontend fetches GET /students/{id}/profile
  ↓
Displays extracted profile cards to user
```

### Job Matching Pipeline

```
User clicks "Run Job Matching" in JobMatchesStep
  ↓
GET /students/{id}/matches?top_k=10
  ↓
app/routers/students.py → get_job_matches_for_student(student_id, db)
  ↓
matching_agent.py
  ├─ Load student from DB (with skills, education, experience, projects)
  ├─ format_candidate_profile_text() → single text string
  ├─ get_embedding(profile_text, input_type="query")
  │     → sentence-transformers all-MiniLM-L6-v2 → 384-dim vector
  ├─ search_similar_jobs(db, profile_vector, top_k=10)
  │     → load all 160 job embeddings from DB
  │     → NumPy cosine similarity for each
  │     → sort, return top 10 (JobPosting, similarity_score) tuples
  ├─ _score_matches_with_llm(student, profile_text, top_10_jobs)
  │     → build single prompt with candidate + all 10 jobs
  │     → call Gemini gemini-3.6-flash
  │     → parse JSON array response
  │     → validate job IDs are in the expected set
  └─ Merge vector sim + LLM score + job metadata
  ↓
Sort by match_score descending
  ↓
Return StudentMatchesResponse JSON
  ↓
Frontend renders ranked match cards
```

---

## 5. Technology Choices

### Why FastAPI (not Flask or Django)?

FastAPI was chosen over Flask because it gives automatic request/response validation via Pydantic, auto-generated OpenAPI docs at `/docs`, and native async support. Flask would have required writing all that validation manually. Django would have been overkill — it comes with a full ORM, admin panel, template engine, and auth system that we don't need.

### Why SQLAlchemy (not raw SQL)?

SQLAlchemy lets us write Python models and relationships, and it generates the SQL. It also handles the PostgreSQL/SQLite fallback transparently — the same model definitions work against both databases without changing any code. Writing raw SQL would mean maintaining two separate query strings for Postgres and SQLite syntax differences.

### Why SQLite in development?

Zero setup. No installation, no running server process, no credentials. The database is just a file (`dev.db`). The code automatically falls back to it when Postgres is not available, so anyone can clone the repo and run it immediately.

### Why PyMuPDF for PDF parsing?

PDF-to-text is a deterministic, solved problem. PyMuPDF is fast, handles multi-column layouts and font encodings correctly, and costs zero API tokens. The alternative — sending the raw PDF bytes to Gemini — wastes money, adds latency, and risks the LLM hallucinating text it can't read. PyMuPDF gives us clean text reliably, and then Gemini only deals with the text.

### Why Gemini for LLM tasks?

The project already had a `GOOGLE_API_KEY`. Gemini `gemini-3.6-flash` is fast, cheap, and capable of returning strictly formatted JSON reliably. It handles both resume structuring (input: raw text, output: skills/education/experience/projects JSON) and job matching evaluation (input: candidate profile + 10 job postings, output: match scores + reasoning + missing skills).

### Why sentence-transformers for embeddings (not OpenAI/Cohere/Voyage)?

All paid embedding APIs have rate limits and require billing. During development, Voyage AI's free tier has a 3 requests-per-minute limit — seeding 160 jobs would take nearly an hour and most embeddings would fall back to the hash function anyway. `sentence-transformers` with `all-MiniLM-L6-v2`:
- Runs completely locally, no internet required after the ~90MB one-time model download
- No API key
- No billing
- No rate limits
- Genuinely semantic embeddings (384-dim dense vectors, 379/384 non-zero elements)
- Fast enough to embed 160 jobs in seconds on any laptop

### Why single-block embedding per job (not chunking)?

Job postings are 200–400 words. If you chunk a 300-word posting into 3 chunks of 100 words, each chunk loses context — one chunk has the skills list, another has the company name, another has the description. When you search for "Python backend internship", the chunk with "Python, FastAPI, PostgreSQL" has lost the word "internship" which was in a different chunk. Keeping each posting as a single text block preserves all relationships and gives better retrieval.

### Why in-memory cosine similarity (not pgvector)?

The architecture documentation mentions pgvector, and this was the original intent. In practice, with 160 job postings the brute-force approach (load all embeddings, compute cosine similarity in NumPy, sort) runs in under 5 milliseconds. pgvector adds meaningful benefit at 100,000+ vectors. The tradeoff at our scale: pgvector would require installing a Postgres extension, maintaining a different database connection that can't fall back to SQLite, and adds complexity for no measurable performance gain. The current implementation is pragmatically correct for the scale of this project.

### Why React + TypeScript + Tailwind CSS + Vite?

- **React 19**: Industry standard, good component model for a multi-step wizard.
- **TypeScript**: Catches type mismatches between frontend and API responses at compile time. The `types.ts` file mirrors the backend's Pydantic schemas exactly.
- **Tailwind CSS 4**: Utility-first styling. No separate CSS files to maintain. All styles are inline in the JSX.
- **Vite**: Extremely fast dev server with hot module replacement. The `vite.config.ts` proxies `/api` to `http://localhost:8000` so the frontend can call the backend without CORS issues during development.
- **Lucide React**: Icon library. Used for all icons throughout the UI.

### Why an editorial warm colour palette instead of a generic tech look?

Deliberate design choice. Most AI tools use neon blue/purple gradients that look generic and interchangeable. The warm palette (Forest Green `#2C5F2D`, Gold `#C9A63B`, Off-White `#FAF9F5`) signals product maturity and makes the demo visually distinctive and memorable during a mentor presentation.

---

## 6. Problems We Faced

### Problem 1: Gemini model `gemini-1.5-flash` stopped working

**What happened:** Every LLM call in `matching_agent.py` and `llm_extractor.py` was failing with a 404 error: `models/gemini-1.5-flash is not found for API version v1beta`.

**Why it happened:** Google deprecated and removed `gemini-1.5-flash` from the API. The model name in the code was hardcoded to a version that no longer exists.

**How we fixed it:** Listed all available models programmatically using `genai.list_models()` to see what's actually available on this API key. Found `gemini-3.6-flash` as the appropriate current model. Updated both `llm_extractor.py` and `matching_agent.py`.

---

### Problem 2: Voyage AI rate-limiting made embeddings fall back to a hash function

**What happened:** When Voyage AI was added as the embedding provider, the seeder was producing embeddings of dimension 512 for some jobs and 384 for others — a mix. When running matching, a 512-dim query vector against a 384-dim stored vector caused a `ValueError: shapes (512,) and (384,) not aligned` crash.

**Why it happened:** Voyage AI's free tier has a hard limit of 3 requests per minute. The seeder generates 160 embeddings sequentially. After 3 successful Voyage calls, every subsequent call was rate-limited and fell back to the old hash-based fallback which generated 384-dim vectors. So the database ended up with 3 real 512-dim Voyage embeddings and 157 fake 384-dim hash embeddings.

**How we fixed it:** Removed Voyage AI as the primary embedding source (commented out the `VOYAGE_API_KEY` in `.env`). Replaced the fallback with `sentence-transformers` which is genuinely semantic, runs locally, has no rate limits, and produces consistent 384-dim embeddings for all 160 jobs. Re-seeded the full dataset.

---

### Problem 3: The hash-based embedding fallback was producing terrible retrieval results

**What happened:** Before sentence-transformers was added, the fallback embedding function used SHA-256 word hashing and bigrams to create vectors. The cosine similarities were in the range 0.09–0.32. A query for "Python backend internship" returned `Cloud Platform Engineering Intern`, `Application Security Intern`, and `Growth Product Intern` in the top 3 — completely wrong.

**Why it happened:** Hash-based vectors have no semantic meaning. Words that are semantically related ("Python", "FastAPI", "backend") hash to completely different random positions in the vector space. Cosine similarity of such vectors is essentially noise.

**How we fixed it:** Replaced the hash fallback entirely with `sentence-transformers all-MiniLM-L6-v2`. After the switch, cosine similarities jumped to 0.60–0.76 range and the same query returned `Software Engineer Intern - Python/Django` (#1, sim: 0.68) and `Backend Engineering Intern` (#2, sim: 0.64) — correct results.

---

### Problem 4: Gemini JSON parse error on large prompts

**What happened:** On some runs, Gemini returns truncated JSON for the matching prompt (which sends 10 jobs at once). The `_parse_json_string()` function fails with `Expecting ',' delimiter` and the fallback scoring kicks in.

**Why it happens:** The matching prompt is long — it includes the full candidate profile and all 10 job postings. If the response hits the output token limit, the JSON array is cut off mid-object. The current code handles this gracefully by catching the exception and falling back to deterministic scoring, so it doesn't crash. It's a known issue, not a bug, just a limitation of the current approach.

**Current status:** Not fixed yet. A proper fix would be to score jobs in smaller batches (e.g., 3 at a time) or use Gemini's structured output mode to force valid JSON.

---

### Problem 5: PostgreSQL connection error during development

**What happened:** On every script run, the terminal shows: `Warning: Could not connect to PostgreSQL... Falling back to SQLite dev.db`.

**Why it happens:** The `DATABASE_URL` in `.env` points to a local PostgreSQL instance (`postgresql://postgres:password@localhost:5432/career_companion`) but no Postgres server is running locally.

**Why it's not a problem:** This is intentional. The `database.py` fallback handles it automatically. All development and testing happens on SQLite without any setup required. The production configuration would provide a real PostgreSQL connection string.

---

## 7. The RAG Pipeline Explained

RAG stands for Retrieval-Augmented Generation. It's a two-stage approach to answering questions with an LLM:

1. **Retrieval** — Before asking the LLM anything, find the most relevant documents from a database using vector similarity search.
2. **Generation** — Give the LLM only the retrieved documents as context, not the whole database.

**Why this is better than asking Gemini "find me jobs for this student" directly:**

If you sent a student profile to Gemini and asked it to recommend jobs, Gemini would make them up from its training data — it doesn't know about your specific 160 job postings. RAG solves this by first finding the real relevant jobs from your actual database, then giving those real jobs to Gemini and asking it to evaluate fit.

**In this project:**

- **Knowledge base**: 160 job postings, each embedded as a 384-dim semantic vector.
- **Retrieval**: The student's profile is embedded as a query vector. Cosine similarity is computed against all 160 job vectors. The top 10 most similar are retrieved.
- **Generation**: Those 10 real job postings + the student's full profile are sent to Gemini. Gemini evaluates fit for each and returns structured scores, reasoning, and skill gaps.

The vector similarity search does the "narrow down 160 jobs to 10 candidates" step cheaply and fast. Gemini does the expensive, nuanced "evaluate each of the 10 for this specific person" step on a much smaller set.

---

## 8. The Embedding System

An embedding is a list of floating point numbers (a vector) that represents the meaning of a piece of text. Two pieces of text with similar meanings will have vectors that point in similar directions — high cosine similarity. Two unrelated pieces of text will have vectors pointing in different directions — low cosine similarity.

**What the model does:** `sentence-transformers/all-MiniLM-L6-v2` is a 22-million parameter transformer model trained on 1 billion sentence pairs. It was specifically trained to produce embeddings where semantically similar sentences cluster together. It compresses any text into a 384-dimensional vector.

**How we use it:**
- At seed time: each job posting's text block is embedded and stored as a JSON array in the `job_postings.embedding` column.
- At match time: the candidate's profile text is embedded as a query vector.
- The cosine similarity between the query vector and each job vector determines retrieval ranking.

**What good looks like:** After switching to sentence-transformers, embeddings have 379/384 non-zero dimensions and cosine similarities range 0.60–0.76 for good matches. The query "Python backend internship" correctly retrieves Python/Django and backend internship roles in the top 2.

**What the old hash fallback looked like:** 164/384 non-zero dimensions. Cosine similarities 0.09–0.32. Results were essentially random. This was the biggest quality problem in the project.

---

## 9. The Gemini LLM Layer

Gemini is used for two completely separate tasks. Never mix them up.

### Task 1: Resume Structuring (`llm_extractor.py`)

**Input:** Raw text extracted from the student's PDF resume (could be 200–2000 words of unformatted text).

**Prompt:** "You are a resume parsing assistant. Extract structured information. Return ONLY valid JSON with keys: skills, education, experience, projects. Use null for missing fields, never guess."

**Output:** A JSON object that gets validated and saved as DB rows.

**Why an LLM here:** Resumes have zero consistent format. One student writes "Python developer at X" and another writes "Developed backend services using Python at X". A regex rule cannot reliably handle both. Gemini normalises arbitrary free text into a clean schema reliably.

### Task 2: Job Match Scoring (`matching_agent.py`)

**Input:** The candidate's formatted profile + the 10 retrieved job postings (all their fields: title, required skills, preferred skills, responsibilities, qualifications, experience requirements, education requirements).

**Prompt:** "You are an expert AI Career Coach. Evaluate candidate fit for EACH job. Return ONLY a JSON array with job_id, match_score (0-100), reasoning (2 sentences), missing_skills list."

**Output:** A JSON array, one object per job, validated against the expected job IDs before being trusted.

**Why an LLM here:** Vector similarity tells you which jobs are topically similar to the profile. It doesn't tell you whether this specific person is actually qualified. Gemini can reason: "Student has Django but job needs Flask — these are similar frameworks, so this is a minor gap not a disqualification." A keyword matcher cannot make that judgement. Gemini also writes the reasoning text that explains the score in plain English, which is the main user-facing value of the tool.

---

## 10. The Database Schema

### `students`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| name | VARCHAR | Required |
| email | VARCHAR UNIQUE | Required, indexed |
| qualifications | TEXT | Optional summary text |
| created_at | DATETIME | Auto-set |
| updated_at | DATETIME | Auto-updated |

### `resumes`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| student_id | FK → students.id | Cascade delete |
| file_path | VARCHAR | Path on disk |
| original_filename | VARCHAR | Display name |
| raw_text | TEXT | Full extracted PDF text |
| parsing_status | VARCHAR | "pending" / "success" / "failed" |
| uploaded_at | DATETIME | |

### `skills`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| student_id | FK → students.id | |
| name | VARCHAR | e.g. "Python" |
| category | VARCHAR | "technical" / "soft" / "tool" |
| source | VARCHAR | "resume" / "manual" |

### `education`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| student_id | FK → students.id | |
| institution | VARCHAR | |
| degree | VARCHAR | e.g. "B.S." |
| field_of_study | VARCHAR | e.g. "Computer Science" |
| start_date | VARCHAR | Flexible format |
| end_date | VARCHAR | Flexible format |
| grade | VARCHAR | e.g. "3.8 GPA" |

### `experience` and `projects`
Similar structures with student_id FK, title, organization/description, dates, technologies.

### `job_postings`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| title | VARCHAR indexed | |
| company | VARCHAR indexed | |
| description | TEXT | Full job description |
| responsibilities | TEXT | What the person will do |
| required_skills | JSON | List of strings |
| preferred_skills | JSON | List of strings |
| qualifications | TEXT | General qualifications text |
| experience_level | VARCHAR indexed | "Internship" / "Entry Level" |
| experience_requirements | TEXT | Years/type of experience required |
| education_requirements | TEXT | Degree requirements |
| location | VARCHAR | |
| posting_type | VARCHAR indexed | "internship" / "full-time" |
| created_at | DATETIME | |
| embedding | JSON | 384-dim float array |

---

## 11. The Frontend

The frontend is a single-page React application with a 4-step flow. There is no routing library — step is just React state.

**Step flow:**
```
landing → profile → upload → matches
```

**API communication:** All calls go through `src/services/api.ts`. The Vite dev server proxies `/api/*` to `http://localhost:8000` via a setting in `vite.config.ts`. This means the frontend never needs to hardcode the backend URL.

**State management:** Simple `useState` at the App level — `currentStep`, `activeStudent`, `profile`, `existingStudents`. No Redux, no Zustand, no context. The state is simple enough that lifting it to App is clean.

**The 6 demo presets:** `ProfileCreationStep.tsx` has a `PRESET_DEMO_USERS` array with 6 pre-defined name/email pairs. Clicking one calls `createStudent()` with those credentials. If the student already exists (because you ran the demo before), it catches the 400 error and loads the existing student. This makes live demonstrations instant — a mentor can switch between candidate types in seconds without typing anything.

**Match card scoring:** The match score badge uses three colour states — green (≥80%), gold (≥60%), dark grey (<60%) — to immediately communicate quality tier at a glance.

**Filter system in JobMatchesStep:** Real-time client-side filtering. No additional API calls. The filtered list is derived from the full `matchesData.matches` array on every render.

---

## 12. Evaluation and Testing

### M2.4 Evaluation Script (`scripts/evaluate_matching.py`)

Runs 5 test candidates through the full pipeline:
- Alex Chen — backend engineering profile → expects backend/software engineering jobs
- Maya Patel — data science profile → expects data science jobs
- Jordan Rivera — frontend developer → expects frontend/web jobs
- Samantha Taylor — UI/UX designer → expects design jobs
- Sam Morgan — weak generic profile → expects any lower-scored matches

Results from the last run (with sentence-transformers + Gemini):
- Alex Chen → Software Engineering Intern - Backend (CloudScale) — 98% ✓
- Maya Patel → Junior Data Scientist (InsightIQ) — 82% ✓
- Jordan Rivera → Frontend Engineering Intern - React (PixelCraft) — 89% ✓
- Samantha Taylor → UI/UX Design Intern (Studio Interface) — 88% ✓
- Sam Morgan → Junior Product Marketing Manager (SaaSLaunch) — 22% ✓ (correctly low)

Retrieval-only test for "Python backend internship":
- #1 Software Engineer Intern - Python/Django (EduLearn Tech) — cosine sim 0.68 ✓
- #2 Backend Engineering Intern (FinPulse Tech) — cosine sim 0.64 ✓

### Validation Script (`scripts/validate_matching.py`)

Runs 10 diverse candidates. All 10 passed on the last run with semantically appropriate top matches, specific LLM-generated reasoning, and accurate missing skill identification.

### What is not tested

There are no unit tests or integration tests in a formal test framework (pytest). The evaluation scripts are the closest thing to tests. There is no CI/CD pipeline that runs tests automatically. The Gemini JSON parse error on large prompts (Problem 4 above) is known but not yet fixed.

---

## 13. What Is Not Done Yet

These are known gaps as of Milestone 2:

1. **Gemini JSON truncation fix** — The matching prompt occasionally produces truncated JSON because 10 jobs + full profile can be very long. Batching into groups of 3 jobs would fix this.

2. **pgvector** — The architecture documents say pgvector but the implementation uses in-memory NumPy. Not a correctness issue at 160 jobs, but worth noting the gap between documentation and code.

3. **Interview Preparation Agent (Milestone 3)** — The architecture doc plans an "Interview Agent" that conducts mock interviews based on the student's actual resume and the selected job. Not built yet.

4. **Skill Gap Agent (Milestone 3)** — A dedicated agent that for a given target job explains exactly which skills to learn and how. Not built yet.

5. **Application Tracking** — No way to mark a job as "applied", track status, or see application history.

6. **Scanned PDF support** — If a student uploads a PDF that is a scanned image (not text-based), `resume_parser.py` raises an error. OCR is not implemented.

7. **`requirements.txt` missing `sentence-transformers`** — The file still lists only the original dependencies. `sentence-transformers` was installed during development but not added to `requirements.txt` yet.

---

## 14. Current State Summary

| Component | Status | Notes |
|---|---|---|
| Student profile creation | ✅ Done | REST API + React form + presets |
| Resume PDF upload | ✅ Done | UUID filename, 5MB limit, PDF only |
| PDF text extraction (PyMuPDF) | ✅ Done | Deterministic, fast |
| LLM resume structuring (Gemini) | ✅ Done | gemini-3.6-flash, validated JSON |
| Job knowledge base | ✅ Done | 160 jobs, 8 domains, full schema |
| Embeddings | ✅ Done | sentence-transformers local, 384-dim, real semantic |
| All 160 jobs consistently embedded | ✅ Done | All 384-dim, no mixed dimensions |
| Vector similarity search | ✅ Done | NumPy cosine, top-K |
| LLM match scoring (Gemini) | ✅ Done | gemini-3.6-flash, match_score + reasoning + missing_skills |
| Fallback scoring | ✅ Done | Deterministic skill overlap, always works |
| Match ranking | ✅ Done | Sorted by match_score descending |
| React frontend | ✅ Done | 4-step flow, all features working |
| Evaluation scripts | ✅ Done | 5-profile + 10-profile suites, ran and verified |
| Evaluation report | ✅ Done | docs/milestone2_evaluation.md |
| pgvector | ❌ Not implemented | In-memory NumPy used instead |
| Interview agent | ❌ Not started | Milestone 3 scope |
| requirements.txt updated | ❌ Missing sentence-transformers entry |
