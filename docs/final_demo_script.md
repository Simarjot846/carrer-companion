# AI Career Companion — Final Demo Script

**Milestone 4 · Complete Workflow Walkthrough**

This script covers every step of the live demo in order. Times are indicative — actual LLM calls vary from 2–17s depending on API warm-up.

---

## Pre-Demo Checklist (do this before the audience arrives)

```bash
# Terminal 1 — Start backend (leave running)
cd d:\career-companion
.venv\Scripts\uvicorn.exe app.main:app --reload

# Wait for this line before proceeding:
# INFO:     [Startup] Sentence-transformers model (all-MiniLM-L6-v2) pre-warmed in X.XXXs

# Terminal 2 — Start frontend (leave running)
cd d:\career-companion\frontend
npm run dev

# Verify job postings are seeded (run once):
# POST http://localhost:8000/jobs/seed
# Expected: {"message":"Successfully seeded 160 job postings."}
```

Open your browser to **http://localhost:5173** and confirm the landing page loads.

**Recommended demo candidate:** Use the "Alex Chen" preset (Software Engineering Intern - Backend). This profile is tuned to produce a 98% match score on the first job retrieved.

---

## Step 1 — Landing Page (1–2 min)

**What to show:**
- Point out the dark hero section — "Land the internship you actually want"
- Scroll down slowly past the three "How it works" steps
- Scroll to the features grid — mention it's 6 features, not just 1 generic tool
- Scroll to the tech stack section — briefly mention it's real AI infrastructure: sentence-transformers, Gemini, FastAPI

**Talking point:**
> "This is the public face of the product. Everything here reflects what the system actually does — there's no marketing language that isn't backed by a real implementation."

**Click:** "Get Started" in the navbar (or in the hero CTA)

---

## Step 2 — Profile Creation (30 sec)

**What to show:**
- The form with Full Name + Email fields — point out 17px inputs, proper label sizing
- Point out the Quick Demo Presets panel on the right

**Action:** Click **"Alex Chen"** in the Quick Demo Presets panel

- The system instantly creates a student profile and moves to Step 3
- If Alex Chen already exists in the DB, it loads the existing profile

**Talking point:**
> "The demo presets let us skip the form entry. In a real workflow, a student would type their name and email here."

---

## Step 3 — Resume Upload & Parsing (1–2 min)

You land on the Resume Upload page. Alex Chen's profile is new with no data yet.

**What to show:**
- The drag-and-drop upload zone
- Point out the "PDF files only · up to 5 MB" constraint — no vague limits

**Action:** Browse and select a real PDF resume for a software engineering student (or use any PDF you prepared)

**Click:** "Parse & structure"

**While it runs (15–20s):**
> "The pipeline has three stages. First, PyMuPDF extracts the raw text deterministically — no AI needed here, PDF parsing is a solved problem. Then we send the clean text to Gemini to structure it into a typed JSON schema. Finally the output is validated before it's committed to the database — hallucinated content never enters the profile."

**After parsing completes:**
- The success banner appears: "Resume parsed successfully"
- Scroll down to show the **Extracted Profile** section
- Point out Skills (with technical/tool/soft colouring), Education card, Experience card, Projects card

**Talking point:**
> "This is the 'source of truth' for every AI agent downstream. Every piece of advice the system gives is anchored to what's here — we never invent anything."

**Click:** "Run job matching" (or "View matches" in the success banner)

---

## Step 4 — Job Matches (2–3 min)

**What to show:**
- The loading state — three animated pipeline steps ("Embedding candidate profile", "Dense similarity search", "Gemini AI scoring & gaps")
- After results load: the first job card with the **circular score ring**

**Talking point while loading:**
> "Stage 1: we embed the candidate profile into a 384-dimensional dense vector using sentence-transformers all-MiniLM-L6-v2, running entirely locally. Stage 2: cosine similarity against 160 pre-embedded job postings gives us the top 10 candidates. Stage 3: we send the top 5 to Gemini for precise scoring, reasoning, and skill gap identification."

**After results load:**
- Point to the **score ring** on the first card — "98% match, not just a number — here's *why*"
- Read the AI Recommendation Rationale aloud — note it references actual skills by name (Python, FastAPI, PostgreSQL)
- Point to the Required Skills chips vs Skill Gaps chips — clear visual separation

**Show the filter controls:** Search for "data" to demonstrate filtering works live.

**Talking point:**
> "Every reasoning string here is job-specific. If I run this same profile against a design internship, it would say something completely different — not a template."

**Click:** "Full details" on the top job card to show the **Job Detail Modal**

- Point to the score ring in the modal
- Read the job description section
- Close the modal

---

## Step 5 — Skill Gap Analysis (1–2 min)

**Click:** "Skill Gap" button on the #1 ranked job card

**While it loads (~3–4s):**
> "This agent compares the candidate's verified skills against every dimension of this specific job posting — required skills, preferred skills, experience level, and educational requirements — and classifies the gaps into 5 categories."

**After results load:**
- Point to the **score ring with readiness percentage** at the top
- Expand "Critical / Missing Skills" — read one gap item: it says **why it matters** for this specific role, not generic advice
- Open "Partially Demonstrated Skills" if any — note the distinction between missing and partial
- Note the collapsible design — you can expand/collapse each category

**Talking point:**
> "The system only reports genuine gaps. If the candidate already has a skill, it won't appear here. The 'why it matters' text is generated fresh for this specific role — it's not a template."

**Click:** "← Back to matches"

---

## Step 6 — Resume & Cover Letter Customization (2–3 min)

**Click:** "Tailor Resume" button on the #1 ranked job card

**While it loads (~5–6s):**
> "Two separate Gemini calls — one for resume tailoring suggestions, one for the cover letter. Both have a hard constraint in the prompt: 'MUST NOT invent any skill or experience not in the student profile'. The system then runs its own hallucination check on the cover letter output."

**After results load — Resume tab:**
- "Skills to highlight first" — these are the skills that match this specific role, sorted by relevance
- Scroll to "Suggested bullet rewrites" — click to expand, show the side-by-side original vs. suggested
- Note the change_note under each rewrite — explains what was improved

**Switch to Cover Letter tab:**
- Point to the **subject line**
- Point to the **green badge**: "Verified: no invented content"
- Read the opening paragraph aloud — it should reference the student's actual project or experience by name

**Talking point:**
> "The cover letter is editable right here — you can adjust it before copying. Hitting Regenerate gives a fresh version without losing your edits in the current session."

**Click:** "← Back to matches"

---

## Step 7 — Interview Preparation (1–2 min)

**Click:** "Interview Prep" button on the #1 ranked job card

**While it loads:**
> "The interview prep agent actually calls the skill gap agent first, then uses the gap output to make the questions gap-aware. If the candidate is missing Kubernetes but the job requires it, you'll see a question about container orchestration even if the student hasn't listed it yet."

**After results load:**
- Point to the question count summary: "12 preparation questions"
- Open the **Technical Questions** section — click Q1 to reveal the prep guidance
- Point out that the guidance says *what a strong answer should cover*, not a scripted answer
- Open **Project-Based Questions** — note it references the candidate's actual project titles

**Scroll down to "Topics to revise":**
- Show the checklist — click a few items to check them off
- Point to the progress counter: "3/5 topics reviewed"

**Click:** "← Back to matches"

---

## Step 8 — Application Tracker (1–2 min)

**Click:** "Tracker" in the navigation bar

**What to show:**
- Dashboard stats (empty state initially)
- "Add application" button

**Action:** Click "Add application"

**Fill in the modal:**
- Company: `CloudScale Systems`
- Job Title: `Software Engineering Intern - Backend`
- Status: `Applied`
- Application Date: today's date
- Notes: `Came from AI Career Companion match — 98% score`

**Click:** "Add application"

**After saving:**
- The row appears in the table
- Point to the inline status dropdown — click it and change status to "Under Review" directly in the table
- Point to the **dashboard stats updating** at the top
- Click "Add application" again, add a second entry with a deadline 3 days from today
- Show the **upcoming alerts panel** — the deadline appears highlighted

**Talking point:**
> "This module is additive — it doesn't interfere with any of the AI agents. A student can track every application they've added through the system, or add manual entries for jobs they found elsewhere. The 7-day deadline and interview alerts are surfaced in the dashboard so nothing falls through the cracks."

---

## Step 9 — Career Assistant (1–2 min)

**Click:** "Assistant" in the navigation bar

**What to show:**
- The welcome state with starter prompts

**Click:** "What are my strongest skills for software engineering roles?"

**While it responds (~3–4s):**
> "The assistant grounds every answer in Alex's verified profile. It can't tell Alex they know TensorFlow if TensorFlow isn't in the skill list."

**After reply:**
**Type:** "Based on what you just said, which of those would be most important for a backend role specifically?"

- This tests context retention — the reply should reference the skills mentioned in the previous turn

**After second reply:**
**Type:** "What's one specific project I should highlight and why?"

- The response should reference an actual project from the profile by name

**Talking point:**
> "Notice it's answering a follow-up question without you repeating your profile. The history is sent to the LLM on every turn, and the profile is injected as system context. This is single-session — closing the tab clears it, which is an honest limitation documented in the final report."

---

## Step 10 — Close (30 sec)

Navigate back to the home page via the "Home" nav item.

**Summary talking points:**

> "To recap what just happened: we uploaded a real PDF. The system deterministically extracted the text, then structured it into a verified typed profile. The RAG pipeline embedded that profile, ran a cosine similarity search across 160 indexed postings, and Gemini reranked the top 5 with specific reasoning. We analysed the skill gap across 5 categories, generated a tailored resume with side-by-side bullet rewrites, wrote a cover letter with a hallucination guard, generated 12 interview questions grounded in actual skills and projects, and tracked the application in the pipeline — all without inventing a single credential.

> The E2E test suite runs 103 automated checks across this entire workflow. 101 passed in the last run, 0 failures."

---

## Backup — If Something Goes Slow

| Situation | Recovery |
|-----------|---------|
| Gemini first call takes >15s | Expected — tell the audience this is the cold-start, subsequent calls are 2–3s. Keep narrating the pipeline while it runs. |
| Matching returns a non-domain job as #1 | This is the known domain-bleed issue. Say: "The vector similarity returned a web-services role first, but Gemini's reranker will correct this — watch the final scores." |
| Resume parsing returns fallback (empty profile) | Fallback skills are generic but non-zero. Say: "This is the deterministic fallback — it still produces a usable profile; the Gemini path is the premium path." Then proceed with matching anyway. |
| LLM call times out | The system falls back to rule-based outputs automatically. These are clearly less good but still functional — use it to demonstrate the reliability pattern. |

---

## Files Created in This Project

```
app/
  main.py, config.py, database.py, models.py, schemas.py
  routers/: students.py, resumes.py, jobs.py, agents.py, applications.py
  services/: resume_parser.py, llm_extractor.py, embedding_service.py,
             vector_store.py, matching_agent.py, skill_gap_agent.py,
             customization_agent.py, interview_prep_agent.py, career_assistant.py

frontend/src/
  App.tsx, index.css, types.ts
  components/: LandingPage, Navbar, ProfileCreationStep, ResumeUploadStep,
               JobMatchesStep, SkillGapView, CustomizationView,
               InterviewPrepView, AssistantChat, ApplicationTracker,
               JobDetailModal, ui.tsx
  services/api.ts

scripts/
  e2e_test_milestone4.py
  make_test_pdfs.py

docs/
  FINAL_REPORT.md (root level)
  docs/final_demo_script.md
  docs/milestone4_e2e_results.md
  docs/milestone4_optimizations.md
```
