# System Architecture

## Component overview

| Component | Status (Milestone 1) | Responsibility |
|---|---|---|
| Student Interface | Built (API-level) | Accepts profile creation and resume upload requests |
| Backend / API Layer | Built | FastAPI, routes requests, validates input |
| Resume Upload/Storage | Built | Stores uploaded PDF, records metadata |
| Resume Parsing Module | Built | Extracts raw text (PyMuPDF), then structured data (LLM) |
| Candidate Profile | Built | Structured skills/education/experience/projects, source of truth |
| Database | Built | PostgreSQL — stores all of the above |
| Job Posting Knowledge Base | Planned (M2) | Stores collected internship/job postings |
| RAG Pipeline (Embeddings + pgvector) | Planned (M2) | Semantic retrieval of relevant postings |
| AI Agent Layer | Partially built | See agent breakdown below |
| Application Tracking Module | Planned (later milestone) | Tracks which jobs a student applied to |

## Data flow (Milestone 1)

```
Student
  -> POST /students (create profile)
  -> POST /students/{id}/resume (upload PDF)
       -> Resume Upload/Storage (file saved, metadata row created)
       -> Resume Parsing Module
            -> PyMuPDF: PDF -> raw text (deterministic)
            -> Resume Agent (LLM): raw text -> structured JSON
       -> Candidate Profile (Skill / Education / Experience / Project rows)
       -> Database (PostgreSQL)
  -> GET /students/{id}/profile (view/edit extracted profile)
```

## Agent responsibilities

### Resume Agent — BUILT this milestone

- **Purpose**: Convert unstructured resume text into structured candidate data.
- **Input**: Raw resume text (already extracted from PDF).
- **Output**: JSON with skills, education, experience, projects.
- **Tools**: Claude API (Anthropic).
- **Knowledge**: None external — works only from the resume text given to it.
- **Failure cases**: Malformed JSON, missing required keys, hallucinated fields.
  Handled by schema validation in `llm_extractor.py` — on failure, the resume
  is marked `parsing_status: "failed"` and the error is surfaced to the caller.
- **When called**: Immediately after a resume upload.
- **When NOT called**: Not used for job matching or interview logic — single
  responsibility, extraction only.

### Job-Resume Matching Agent — PLANNED (Milestone 3)

- **Purpose**: Rank internship postings against a candidate profile, explain why.
- **Input**: Candidate profile + retrieved job postings (from RAG pipeline).
- **Output**: Ranked list with match scores, reasoning, missing skills.
- **Why an agent and not a plain function**: Requires semantic judgment (a
  candidate with "Django" experience may be a strong match for a "Flask"
  role) — not a simple keyword/string comparison.

### Skill Gap Agent — PLANNED (Milestone 3)

- **Purpose**: Given a target job, identify which required skills the
  candidate is missing and suggest how to close the gap.
- **Input**: Candidate profile + one job posting.
- **Output**: List of missing/weak skills with suggestions.

### Cover Letter Agent — PLANNED (later milestone, SHOULD HAVE not MUST HAVE)

- **Purpose**: Draft a cover letter tailored to a specific job + candidate profile.
- **Input**: Candidate profile + job posting.
- **Output**: Draft cover letter text.

### Interview Agent — PLANNED (Milestone 4)

- **Purpose**: Conduct a personalized mock interview based on the candidate's
  actual resume and the selected job.
- **Input**: Candidate profile + selected job posting + running conversation.
- **Output**: Questions, follow-ups, answer evaluation, feedback.
- **Why an agent**: Requires multi-turn reasoning and adapting questions based
  on the candidate's previous answers — not a static question bank.

### Career Assistant — PLANNED (later milestone, SHOULD/NICE TO HAVE)

- **Purpose**: General-purpose Q&A across the student's profile, matches, and
  interview history (e.g. "what should I focus on this week?").
- **Input**: Full student context.
- **Output**: Conversational guidance.

## Design decision: pgvector instead of a standalone vector database

Evaluated a standalone vector database (Pinecone/Weaviate) against pgvector
(a PostgreSQL extension). Chose **pgvector** because:

- Project scale is a few hundred to a few thousand job postings — well within
  what pgvector handles efficiently.
- One database instead of two separate systems to deploy, secure, and keep
  in sync — meaningfully simpler for a solo two-month project.
- If the project's data volume grows beyond what pgvector handles well, this
  is a swappable component — the RAG pipeline logic doesn't need to change,
  only the storage backend.

## Reliability considerations (applies across all agents)

- Every LLM call that produces structured output is validated before being
  trusted (JSON parse + required-key check).
- Failures are recorded (`parsing_status`), never silently swallowed.
- Agents are single-responsibility — the Resume Agent never makes matching or
  interview decisions, keeping failure modes isolated and easier to debug.
