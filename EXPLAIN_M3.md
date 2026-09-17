# Milestone 3 — Technical Explanation & Mentor Guide

**Project:** AI Career Companion Agent  
**Milestone:** 3 — Four New AI Agents  
**Built on top of:** Milestone 1 (Resume Parsing) + Milestone 2 (RAG Matching Pipeline)

---

## 1. What Each Agent Does — Plain Language

### M3.1 — Skill Gap Analysis Agent

Takes a student's full structured profile (skills, education, experience, projects) and a specific job posting, then compares them field by field and classifies every gap into five categories:

- **Critical/Missing** — required skills the student does not have at all
- **Partially Demonstrated** — skills the student shows some evidence of but not fully
- **Preferred/Nice-to-Have** — preferred skills from the job that are absent
- **Experience Gaps** — mismatches in the type or length of work experience required
- **Qualification Gaps** — education or certification requirements the student doesn't meet

For each identified gap, it generates: (1) a role-specific explanation of *why* that gap matters tied to the actual job description, and (2) a concrete actionable recommendation to close it. It also produces an overall readiness score (0–100) and a one-sentence readiness summary.

**What this is NOT:** It is not a generic "you're missing Python" list. The "why it matters" field explicitly references the actual responsibilities and requirements of the specific job — not generic career advice.

---

### M3.2 — Resume & Cover Letter Customization Agent

Takes a student's profile and a specific job, then produces two things:

**Resume tailoring report:**
- Which of the student's existing skills to prioritise at the top of their resume for this role
- Which experience entries and projects are most relevant, with a reason why
- Side-by-side bullet rewrites — the original experience description paired with a stronger suggested version (better action verbs, keyword alignment) — with a note explaining what was changed and why
- Recommended section ordering for this specific role
- A brief tailoring strategy note

**Cover letter:**
- A complete 3–4 paragraph cover letter that references the student's actual projects and experiences by name and connects them to the specific job requirements
- An editable text area in the UI so the student can refine before using it
- A hallucination check flag — a lightweight validation step that detects obvious invented content (placeholder text, claims not traceable to the profile)

**Hard constraint enforced in the prompt:** The LLM is explicitly instructed that it must not invent skills, technologies, outcomes, numbers, or qualifications not present in the student's actual profile. This is not advisory — the prompt treats it as a hard rule, and the hallucination check function scans the output for known red flags before returning it.

---

### M3.3 — Interview Preparation Agent

Takes a student's profile, a specific job posting, and the skill gap output from M3.1 (reused — not recomputed), then generates a structured static interview prep package:

- **Technical questions** (3–4): Specific to the role's required skills
- **Resume-based questions** (2–3): Reference the student's actual listed experience entries by title and organisation
- **Project-based questions** (2–3): Reference the student's actual listed projects by name
- **Role-specific questions** (2–3): Based on the job's stated responsibilities
- **General/HR questions** (2–3): Behavioural and motivational questions

For each question, it includes **prep guidance** — not a scripted answer, but a 2–3 sentence note on what a strong answer should cover.

It also generates a **topics to revise** checklist: specific technical topics the student should review before the interview, derived from the skill gaps and the job's requirements. In the UI this renders as an interactive checklist the student can tick off.

**What is explicitly NOT built:** A live multi-turn mock interview where the agent asks a question, the student types an answer, and the agent evaluates it in real time. That requires server-side conversation state management and would significantly increase the complexity and cost of every interaction. The static prep package is far more practical — a student can review it before going to bed, not just during an active session.

---

### M3.4 — Conversational Career Assistant

A single-session chat interface where the student can ask natural language questions about their profile, job matches, and career preparation. Examples of questions it handles:

- "What are my strongest skills for backend roles?"
- "Which job types match my background?"
- "What should I work on to improve my profile?"
- "How do I prepare for a technical interview?"
- "Compare my fit for a data science vs frontend role"

**Architecture decision — client-side history:** Conversation history is maintained by the frontend and sent with each request. The backend receives the message + full prior history, calls Gemini with all of it as context, and returns the reply + updated history. There is no server-side session storage. This is the correct tradeoff for this scope: it avoids database schema changes, session management, expiry logic, and concurrency handling — none of which add educational value at this stage.

**Grounding:** Every response is grounded in the student's actual DB data. The system prompt injected at the start of every Gemini call includes the student's complete skills, education, experience, and projects. The prompt explicitly instructs the model to only make claims traceable to the provided profile — never invent details.

---

## 2. Every New File Created

### Backend Services

| File | Responsibility |
|---|---|
| `app/services/skill_gap_agent.py` | M3.1 — Compares student profile vs job posting, classifies gaps into 5 categories, generates role-specific why + recommendation for each gap, produces readiness score. Gemini call + deterministic fallback. |
| `app/services/customization_agent.py` | M3.2 — Generates resume tailoring report (prioritised skills, relevant experience/projects, bullet rewrites, section order) and a complete cover letter. Hard constraint in prompt prevents invented content. Hallucination check function. Separate Gemini calls for resume and cover letter. Fallback for both. |
| `app/services/interview_prep_agent.py` | M3.3 — Generates static interview prep package (5 question categories + topics to revise). Accepts skill gap data from M3.1 to enrich the topics list. Gemini call + deterministic fallback that builds sensible questions from available profile data. |
| `app/services/career_assistant.py` | M3.4 — Single-session conversational assistant. Builds a rich system context block from student's real DB data. Sends conversation history as Gemini multi-turn content. Fallback gives keyword-matched helpful responses if Gemini fails. |

### Backend Router

| File | Responsibility |
|---|---|
| `app/routers/agents.py` | Registers all 4 new endpoints under the `/students` prefix. Handles data shape normalisation from service dicts to Pydantic response models. Chains M3.1 into M3.3 (interview prep fetches skill gaps first). `_require_student` and `_require_job` helpers return clean 404s. |

### Modified Backend Files

| File | Change |
|---|---|
| `app/main.py` | Added `from app.routers import agents` and `app.include_router(agents.router)` |
| `app/schemas.py` | Added 11 new Pydantic models: `GapItem`, `SkillGapResponse`, `RewrittenBullet`, `RelevantExperience`, `RelevantProject`, `ResumeCustomization`, `CoverLetter`, `CustomizationResponse`, `InterviewQuestion`, `InterviewPrepResponse`, `ChatTurn`, `AssistantChatRequest`, `AssistantChatResponse` |

### Frontend Components

| File | Responsibility |
|---|---|
| `frontend/src/components/SkillGapView.tsx` | M3.1 UI — Radial readiness score dial, 5 collapsible gap sections, each item shows why-it-matters + recommendation. Forest green / gold / terracotta colour coding by severity. Refresh button. |
| `frontend/src/components/CustomizationView.tsx` | M3.2 UI — Tab layout: Resume Tailoring tab (prioritised skills, relevant experience/projects, side-by-side bullet rewrites, section order) and Cover Letter tab (editable textarea, hallucination check badge, copy button, regenerate button). |
| `frontend/src/components/InterviewPrepView.tsx` | M3.3 UI — 5 question sections rendered as accordion (click to reveal prep guidance). Interactive topics-to-revise checklist with tick-off state. Regenerate button. |
| `frontend/src/components/AssistantChat.tsx` | M3.4 UI — Chat interface with message bubbles, typing indicator (3-dot bounce), starter prompt buttons, clear conversation button, keyboard shortcut (Enter to send, Shift+Enter for newline). |

### Modified Frontend Files

| File | Change |
|---|---|
| `frontend/src/types.ts` | Added TypeScript interfaces for all 4 agent response types: `GapItem`, `SkillGapResponse`, `RewrittenBullet`, `ResumeCustomization`, `CoverLetter`, `CustomizationResponse`, `InterviewQuestion`, `InterviewPrepResponse`, `ChatTurn`, `AssistantChatResponse` |
| `frontend/src/services/api.ts` | Added 4 new API functions: `getSkillGap`, `getCustomization`, `getInterviewPrep`, `sendAssistantMessage` |
| `frontend/src/App.tsx` | Expanded `AppStep` type from 4 to 8 steps. Added `selectedJob` state. Added `handleOpenAgent` callback. Renders all 4 new agent views. |
| `frontend/src/components/Navbar.tsx` | Updated `AppStep` type to match. Added Assistant nav button in gold colour. M3 steps highlight the Matches nav item so user doesn't lose their position context. |
| `frontend/src/components/JobMatchesStep.tsx` | Added `onOpenAgent` prop. Added three action buttons to each job card (Skill Gap, Tailor Resume, Interview Prep) that call `onOpenAgent` with the selected job. |

---

## 3. Deliberate Design Trade-offs

### Why there is no live mock interview (M3.3 scoped down)

The original spec noted this explicitly: live multi-turn mock interview requires the agent to ask a question, receive the student's typed answer, evaluate it, give feedback, then ask the next question — all while maintaining conversation context tied to a specific job session. This needs:

- Server-side session storage (which session belongs to which student + job)
- Session expiry and cleanup
- Evaluation logic that scores or critiques open-ended answers
- Potentially much longer token usage per interaction

The static prep package — a one-time generation of questions + guidance — delivers 80% of the value with 10% of the complexity. A student can print it out, review it the night before, and practice out loud without needing the app to be open. The dynamic mock interview is a clear Milestone 4 feature and is called out honestly in section 4 below.

### Why conversation history is client-side (M3.4)

Storing conversation history server-side requires a new database table, a session ID system, linking sessions to students, handling concurrent sessions, and deciding when to expire them. All of that is infrastructure complexity that adds no AI/ML learning value. The client-side pattern — send the last N turns with every request — is the same approach used by the OpenAI API playground and most production chatbot UIs. It scales fine for a single-student demo context.

The one limitation: if the user refreshes the page, the conversation is lost. This is an acceptable trade-off at this stage and is documented honestly in section 4.

### Why M3.3 reuses M3.1's skill gap output instead of recomputing it

The interview prep endpoint calls the skill gap agent internally before calling the prep agent. This avoids the frontend needing to chain two API calls, keeps the M3.3 endpoint self-contained, and means the topics-to-revise list is always consistent with the current gap analysis. The small cost is that the skill gap analysis runs twice if the user visits both M3.1 and M3.3 views for the same job. At the current scale (one student, one job at a time) this is a non-issue.

### Why the hallucination check in M3.2 is lightweight

A complete hallucination check would require embedding both the cover letter and the source profile and computing semantic similarity — expensive and slow. The current check is a fast heuristic: it looks for known placeholder patterns (`[company]`, `[your name]`, etc.), checks the letter is above a minimum length, and returns a boolean flag. It catches the most common failure modes (LLM not filling in the template properly, generating boilerplate) without adding latency. The hard constraint in the prompt is the primary defence; the check is a safety net, not a guarantee.

### Why the deterministic fallbacks exist for all four agents

Every LLM call in the project follows the same reliability pattern established in Milestone 2 (`llm_extractor.py`, `matching_agent.py`): try Gemini, validate the output structure, fall back to deterministic logic if anything fails. This means:
- A bad API key or quota error never crashes a user-facing request
- Demo presentations work even without internet
- The fallbacks are honest — they produce reasonable but clearly less rich output, not fake-looking results

---

## 4. What Is NOT Implemented Yet — Honest List

Be explicit about these with your mentor. Do not overclaim.

| Feature | Status | Notes |
|---|---|---|
| Live multi-turn mock interview | NOT DONE | Static prep package only. Agent asks questions and provides guidance but does not receive or evaluate student answers in real time. |
| Server-side conversation persistence | NOT DONE | Chat history lives in React state and is lost on page refresh. No database table for conversations. |
| Cover letter PDF export | NOT DONE | Student can copy the text from the editable textarea but there is no "Download as PDF" button. |
| Application tracking | NOT DONE | No way to mark a job as "applied", track status, or view application history. Planned but not built. |
| Skill gap re-check after profile update | NOT DONE | If a student adds new skills and then re-runs skill gap, it will pick up the new data correctly — but there is no "watch for changes" mechanism. The student manually refreshes. |
| Hallucination check is heuristic only | PARTIAL | The check catches placeholder patterns and minimum length violations. It does not semantically verify every claim in the cover letter against the source profile. Over-claiming in edge cases is possible. |
| M3.3 topics checklist not persisted | NOT DONE | Tick-off state in the revision checklist lives only in React component state. Refreshing the page resets all ticks. |
| Conversation history has a hard cap | PARTIAL | History is trimmed to the last 6 turns before being sent to Gemini (`MAX_HISTORY_TURNS = 6`). Very long conversations will lose early context. This is documented in the code. |
| No authentication / multi-user isolation | NOT DONE (by design) | This is a demo/prototype. Any user who knows a student ID can call any endpoint. Not a concern for a local demo — would need addressing before any production deployment. |

---

## 5. Anticipated Mentor Questions — Grounded Answers

**Q1: How does the Skill Gap Agent know the difference between a skill the student has and one they're missing?**

It compares the student's `skills` table (a list of named skills with categories like "technical", "soft", "tool") against the job's `required_skills` and `preferred_skills` JSON arrays. In the LLM path, Gemini is given the full profile text and full job text and asked to classify. In the deterministic fallback, it does a lowercase string set comparison: if the skill name from `required_skills` doesn't appear in the student's skill name set, it's classified as critical/missing. The LLM path can also identify partial matches — for example, recognising that a student with "Django" experience partially satisfies a "Python web framework" requirement — which the fallback cannot do.

**Q2: How do you prevent the cover letter from making up experiences the student doesn't have?**

Two layers. First, the prompt contains a hard constraint in capital letters: "You MUST NOT invent, add, or imply any skill, experience, achievement, technology, number, or outcome that is not explicitly stated in the student profile below." Second, the `_check_hallucination()` function in `customization_agent.py` scans the output for known red flags: placeholder text like `[company]`, `[your name]`, responses under 150 characters, and `lorem ipsum`. The function returns a boolean `hallucination_check` field that the frontend displays as a green "Verified" or red "Review carefully" badge. It is not a guarantee — it is a safety net on top of a constrained prompt.

**Q3: Why does the interview prep endpoint call the skill gap agent internally instead of requiring the frontend to pass gap data?**

Two reasons. First, it keeps the M3.3 endpoint self-contained: a single GET request gives you a complete prep package without the frontend needing to chain two API calls. Second, it ensures the topics-to-revise list is always derived from fresh gap analysis against the same job — if the frontend cached stale gap data, the topics could be out of sync with the current profile state. The small cost (skill gap runs twice if the user visits both views) is acceptable at demo scale.

**Q4: How does the career assistant know not to make up job details it doesn't have?**

The system context injected at the start of every Gemini conversation includes the student's full profile data pulled fresh from the database. It also includes a short list of job postings for reference. The system prompt explicitly states: "Only make claims about the student's skills, experience, projects, and education that are present in the profile above. Never invent or assume details." Additionally, the fallback reply function provides keyword-matched responses that are purely template-based and provably grounded — they reference only the student's actual skill list from the DB.

**Q5: What happens if Gemini returns invalid JSON for one of the agents?**

Every LLM call is wrapped in a try/except. If the call fails (network error, quota error, malformed JSON, truncated response), the code catches the exception, prints a warning to the server log, and returns the deterministic fallback result instead. The endpoint never returns a 500 error to the user because of an LLM failure — the fallback guarantees a valid, schema-conformant response. This pattern is consistent across all six LLM call sites in the project (two from M1/M2, four new ones in M3).

**Q6: Why is conversation history stored client-side instead of in the database?**

Server-side session storage would require a new `conversations` table, a session ID system, foreign key to the student, expiry logic, and handling of concurrent sessions. None of that adds AI or ML learning value — it's pure infrastructure. The client-side pattern (the frontend sends the last N turns with every request) is how the OpenAI Playground and most production chat UIs work. The trade-off is that conversation history is lost on page refresh. This is documented, acceptable for a demo, and explicitly noted as a known limitation.

**Q7: What is the `MAX_HISTORY_TURNS = 6` limit in the career assistant?**

Each turn is a pair of messages (user + assistant). At 6 turns, the last 12 messages are sent to Gemini. Beyond that, the context window cost grows and very long conversations could exceed token limits. The cap ensures reasonable latency and cost on every call. Early conversation context (from before the cap) is lost. For a demo conversation this is not noticeable — users typically ask 3–5 questions in a session.

**Q8: The skill gap analysis says the student is "partially demonstrated" in a skill — how is that determined?**

In the LLM path, Gemini makes this distinction based on the full context: a student who lists "Django" in their skills and has a project using Python might be "partially demonstrated" in "FastAPI" because there's transferable evidence without direct experience. The LLM is given both the full skill list and the project/experience descriptions, so it can make this nuanced judgment. The deterministic fallback does not produce "partially demonstrated" entries — it only identifies clean present/absent matches on skill names, so that category will be empty when Gemini fails.

**Q9: How does the interview prep agent use the skill gap data from M3.1?**

The `generate_interview_prep()` function accepts an optional `skill_gaps` dict parameter. Inside the prompt, the critical missing skills and partially demonstrated skills are formatted into a "SKILL GAPS" section that Gemini uses to populate the `topics_to_revise` list. This means the topics to revise are not just the job's required skills in general — they're specifically the skills this student is missing for this job. In the router (`agents.py`), M3.1 is called first, its output is passed to M3.3, so the user gets a single endpoint call that delivers both the prep questions and the gap-aware revision list.

**Q10: None of the M3 agent results are cached — won't running skill gap + customization + interview prep for the same job three times make three sets of LLM calls?**

Yes, currently. Each of the three M3 agent views triggers a fresh Gemini call when navigated to. This is acceptable for a demo — at most one student is using the system at a time and the LLM calls complete in 2–4 seconds each. A production version would cache results keyed on (student_id, job_id) with a TTL, or store results in the database after first generation. That caching layer is not built yet and is an honest known gap.
