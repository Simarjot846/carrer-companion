# AI Career Companion Agent — Project Explanation & Mentor Guide
**Project Code**: #M-3-1  
**Target Milestone**: Milestone 2 & Live Presentation Demo  

---

## 1. One-Paragraph Project Summary

"AI Career Companion is an intelligent internship matching and interview preparation platform built for students. Instead of relying on keyword matching or static search forms, our system parses candidate resume PDFs into structured skill, education, and experience profiles using Google Gemini LLM. We then run a two-stage RAG (Retrieval-Augmented Generation) pipeline: vector similarity search over pgvector retrieves the top candidate job postings from a 160-job knowledge base, and an AI agent evaluates candidate fit—generating a match score, transparent reasoning, and missing skill gap analysis. The entire workflow is accessible through a responsive, editorial-grade React web application designed for live demonstration."

---

## 2. Architecture Walkthrough

Below is the step-by-step data flow across the system, from candidate creation through PDF upload, structuring, vector search, LLM reranking, and frontend visualization.

```
+-----------------------------------------------------------------------------------+
| 1. Profile Creation                                                               |
|    User / Demo Preset -> POST /students/ -> Student DB Row Created                |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| 2. Resume Upload & Parsing Pipeline                                               |
|    Upload PDF -> POST /students/{id}/resume                                       |
|      ├── Step 2a: PyMuPDF extracts raw text deterministically                     |
|      ├── Step 2b: Gemini LLM converts text -> structured JSON                    |
|      └── Step 2c: JSON Schema Validation -> Saved to Skills/Edu/Exp/Projects DB    |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| 3. Two-Stage RAG Matching Agent                                                  |
|    GET /students/{id}/matches                                                     |
|      ├── Stage 1: Candidate profile text -> Dense Embedding -> Vector Search       |
|      │          Cosine similarity over job_postings embeddings -> Top ~10 Jobs    |
|      └── Stage 2: Top 10 Jobs + Candidate Context -> Gemini LLM Agent Reranker     |
|                 Computes Match % (0-100), Rationale Text, & Missing Skill Gaps    |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| 4. Frontend Visualization (React + Vite + Tailwind CSS)                           |
|    Dashboard renders: Extracted Profile Cards, Ranked Match Cards, Visual Score   |
|    Badges, AI Recommendation Rationale, & Missing Skill Gap Tags                  |
+-----------------------------------------------------------------------------------+
```

---

### Step 1: Student Profile Creation
- **WHAT it does**: Creates a student user entity with basic credentials (`name`, `email`) in PostgreSQL.
- **WHY it was built this way**: Establishes a clean relational root record (`students` table) that owns all extracted skills, education history, work experiences, and project entries via foreign key cascades.
- **WHICH FILE(s)**:
  - Backend Endpoint: `app/routers/students.py` (`create_student`)
  - Database Model: `app/models.py` (`Student`)
  - Frontend Component: `frontend/src/components/ProfileCreationStep.tsx`

---

### Step 2: Resume PDF Parsing & Structuring Pipeline
- **WHAT it does**: Accepts a PDF file upload, saves it to disk with a UUID filename, extracts raw text deterministically using PyMuPDF, sends text to Gemini LLM to extract structured JSON (`skills`, `education`, `experience`, `projects`), validates the JSON schema, and writes relational records to the database.
- **WHY it was built this way**:
  - **PyMuPDF**: Handles multi-column layouts, font encodings, and page streams fast without token overhead or LLM hallucination during raw text extraction.
  - **Gemini LLM Structuring**: Resumes have zero consistent formatting. A rule-based/regex engine breaks on unusual layouts; an LLM effortlessly normalizes diverse free-text descriptions into a structured schema.
  - **Reliability & Validation**: The LLM output is parsed with `json.loads()` and verified against `required_keys` before saving to DB. If malformed, `resume.parsing_status` is marked `'failed'` and an HTTP 422 error is returned, preventing silent profile corruption.
- **WHICH FILE(s)**:
  - Router: `app/routers/resumes.py` (`upload_resume`)
  - Text Extractor: `app/services/resume_parser.py` (`extract_text_from_pdf`)
  - LLM Structurer: `app/services/llm_extractor.py` (`extract_structured_profile`)
  - DB Models: `app/models.py` (`Resume`, `Skill`, `Education`, `Experience`, `Project`)
  - Frontend Component: `frontend/src/components/ResumeUploadStep.tsx`

---

### Step 3: Job Knowledge Base & Embedding Generation
- **WHAT it does**: Populates the database with 160 realistic internship/job postings across 8 technical domains. Concatenates title, company, description, location, posting type, and required skills into a single text block, generates dense vector embeddings, and stores them in `job_postings.embedding`.
- **WHY it was built this way**: Single-block embedding prevents chunking fragmentation. In short job postings, chunking breaks the connection between required skills, job title, and description, hurting semantic retrieval precision.
- **WHICH FILE(s)**:
  - Seeder Script: `scripts/seed_jobs.py` (`seed_job_postings`)
  - Embedding Service: `app/services/embedding_service.py` (`get_embedding`)
  - Vector Utilities: `app/services/vector_store.py` (`prepare_job_text_for_embedding`)

---

### Step 4: Two-Stage RAG Matching Agent
- **WHAT it does**:
  1. Compiles the student's extracted profile (`skills`, `education`, `experience`, `projects`) into a single text context and generates a query vector.
  2. Performs vector similarity search (`search_similar_jobs`) across all 160 job posting vectors to retrieve the top ~10 candidate matches.
  3. Passes candidate context + top 10 job postings to Gemini LLM to score candidate fit (`match_score`), write recommendation reasoning, and identify missing skill gaps.
- **WHY it was built this way**:
  - Vector similarity search rapidly narrows down hundreds of postings to the most relevant candidates in milliseconds.
  - Gemini LLM reranking provides deep semantic evaluation (e.g. recognizing that a student with Django experience fits a Python/Flask role) and produces natural language rationale that raw vector distance alone cannot provide.
- **WHICH FILE(s)**:
  - Matching Service: `app/services/matching_agent.py` (`get_job_matches_for_student`, `_score_matches_with_llm`)
  - Router Endpoint: `app/routers/students.py` (`get_student_matches`)
  - Frontend Component: `frontend/src/components/JobMatchesStep.tsx`

---

## 3. Key Design Decisions

Here is every architectural choice in the codebase, the rationale behind it, and where it lives:

| Decision | What Was Chosen | Why It Was Made | File Location |
|---|---|---|---|
| **1. PDF Text Extraction** | **PyMuPDF (`fitz`)** instead of sending raw PDF binary to LLM | PyMuPDF is fast, free, deterministic, and handles PDF streams cleanly. Sending raw PDF bytes to an LLM wastes API tokens and risks hallucinating document text. | `app/services/resume_parser.py` |
| **2. Vector Database Choice** | **pgvector in PostgreSQL** instead of a separate vector DB (Pinecone/Weaviate) | At a scale of hundreds to thousands of job postings, pgvector runs directly inside PostgreSQL. Having one database simplifies deployment, security, and transaction consistency. | `docs/architecture.md`<br>`app/services/vector_store.py` |
| **3. Embedding Granularity** | **Single-block per job posting** instead of text chunking | Job postings are concise (200-400 words). Chunking fragments required skills from role descriptions, breaking contextual relationships and reducing retrieval quality. | `app/services/vector_store.py` |
| **4. Two-Stage Matching** | **Vector Similarity + LLM Reranking** instead of simple keyword search | Keyword matching fails on synonym variations (e.g., React vs Vue, FastAPI vs Express). Vector search provides fast semantic recall, while the LLM provides precise reranking and qualitative reasoning. | `app/services/matching_agent.py` |
| **5. Strict Schema Validation** | **JSON Schema Parsing + Required Key Check** before DB commit | LLMs can occasionally return malformed JSON. Validating output against required keys (`skills`, `education`, `experience`, `projects`) ensures bad outputs mark `parsing_status='failed'` rather than corrupting DB state. | `app/services/llm_extractor.py`<br>`app/routers/resumes.py` |
| **6. Fast API Latency Safeguard** | **Timeout (5s) + Deterministic Fallback Scoring** | Includes `timeout=5.0` on LLM matching calls. If network calls stall or fail, the system seamlessly falls back to skill-overlap matrix scoring in <40ms, preventing live UI freezes. | `app/services/matching_agent.py` (`_fallback_scoring`) |
| **7. Frontend Aesthetic** | **Editorial Warm Palette** (`#2C5F2D` Forest Green, `#C9A63B` Gold, `#FAF9F5` Warm Off-White, Serif Typography) | Rejects generic AI templates (neon blue/purple gradients). A warm, editorial look signals product maturity, human-centric focus, and high engineering polish to mentors. | `frontend/src/index.css`<br>`frontend/src/components/LandingPage.tsx` |
| **8. One-Click Demo Presets** | **6 Pre-populated Candidate Presets** on Profile Creation page | Enables instantaneous 1-click candidate profile switching during live mentor presentations without manual form typing. | `frontend/src/components/ProfileCreationStep.tsx` |

