# AI Career Companion Agent for Internship Matching and Interview Preparation

Project Code: #M-3-1
Milestone 1 submission — Foundation & Candidate Understanding

## What this milestone delivers

An end-to-end working pipeline: a student creates a profile, uploads a resume (PDF),
the system extracts the text, sends it to an LLM for structured extraction, and
stores skills / education / experience / projects in the database as an editable
candidate profile.

```
Student → POST /students → Resume upload (PDF) → Text extraction (PyMuPDF)
→ LLM structuring (Claude) → Structured profile → PostgreSQL
```

## System architecture

Full component breakdown (Student Interface → Backend/API → Resume Upload/Storage
→ Resume Parsing → Candidate Profile → Database, plus the Job KB/RAG pipeline and
AI Agent layer planned for later milestones) is in `docs/architecture.md`.

**This milestone implements**: Student Interface (API), Backend/API layer, Resume
Upload/Storage, Resume Parsing Module, Candidate Profile, Database, and the
Resume Agent (LLM extraction logic).

**Planned for later milestones** (documented, not yet built): Job-Resume Matching
Agent, Skill Gap Agent, Cover Letter Agent, Interview Agent, Career Assistant,
Job Knowledge Base, and the RAG/embeddings pipeline.

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Backend | FastAPI (Python) | Async, native Pydantic validation for structured LLM output |
| Database | PostgreSQL (SQLite for local dev) | Relational data — students, resumes, skills all have real foreign-key relationships |
| ORM | SQLAlchemy | Standard, testable, migration-friendly |
| LLM | Claude (Anthropic API) | Resume understanding and structured extraction |
| PDF text extraction | PyMuPDF | Deterministic, fast — not an LLM's job |
| Vector search (planned, M2) | pgvector | Kept inside PostgreSQL instead of a standalone vector DB (Pinecone/Weaviate) — simpler ops, sufficient for this project's data scale |

## Project structure

```
app/
  main.py              # FastAPI app entrypoint
  config.py            # Environment variable loading
  database.py          # DB engine/session setup
  models.py            # SQLAlchemy models (candidate profile schema)
  schemas.py            # Pydantic request/response schemas
  routers/
    students.py        # Profile creation + retrieval
    resumes.py          # Resume upload + parsing pipeline
  services/
    resume_parser.py    # PDF → raw text
    llm_extractor.py     # Raw text → structured JSON (Resume Agent)
uploads/               # Uploaded resume files (gitignored)
requirements.txt
.env.example
```

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: add your ANTHROPIC_API_KEY.
# DATABASE_URL defaults to local SQLite if not set — fine for development.
# For PostgreSQL, set DATABASE_URL=postgresql://user:pass@localhost:5432/career_companion

uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive API docs (Swagger UI).

## API endpoints (Milestone 1)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/students/` | Create a student profile |
| GET | `/students/{id}/profile` | Get full profile (skills, education, experience, projects, resumes) |
| POST | `/students/{id}/resume` | Upload a resume PDF — triggers parsing + extraction |

## Data model

Six tables: `Student`, `Resume`, `Skill`, `Education`, `Experience`, `Project`.
All extracted data (skills, education, etc.) links to `student_id`, not `resume_id` —
this keeps the profile as the single editable source of truth even if a student
re-uploads or manually edits later. Full schema in `app/models.py`.

## AI reliability notes

- PDF text extraction is deterministic (PyMuPDF), not LLM-based — kept out of the
  LLM's responsibility since it's a solved problem.
- The LLM extraction step validates its own output: checks for valid JSON and
  required keys before saving to the database.
- If parsing fails at any step, `Resume.parsing_status` is set to `"failed"` and
  the API returns a clear error — the system never silently saves partial or
  garbage data.
- Uploads are validated: PDF-only, 5MB size limit, generated filenames on disk
  (prevents path traversal).

## Known limitations (Milestone 1 scope)

- Only PDF resumes are supported (no DOCX yet).
- No OCR — scanned/image-based PDFs will fail extraction with a clear error.
- No authentication yet (planned if required by later milestones).
- Matching, interview, and other agents are architecture-only at this stage —
  see `docs/architecture.md`.

## Next milestone (M2)

Job posting collection, embeddings, and pgvector-based semantic retrieval.
