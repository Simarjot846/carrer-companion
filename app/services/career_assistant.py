"""
M3.4 — Conversational Career Assistant
Single-session conversational endpoint. Conversation history is maintained
client-side and sent with each request — no server-side session storage.
The assistant grounds every answer in the student's actual DB data.
"""
import json
import warnings
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.config import GOOGLE_API_KEY
from app import models
from app.services.matching_agent import format_candidate_profile_text

try:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        import google.generativeai as genai
    HAS_GENAI = True
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
except Exception:
    genai = None
    HAS_GENAI = False

MAX_HISTORY_TURNS = 6  # Keep last N turns to avoid prompt bloat

# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def chat(
    student_id: int,
    message: str,
    history: List[Dict[str, str]],
    db: Session,
) -> Dict[str, Any]:
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        return {
            "reply": "I couldn't find your profile. Please make sure your account is set up correctly.",
            "updated_history": history,
        }

    profile_context = _build_profile_context(student, db)
    trimmed_history = history[-(MAX_HISTORY_TURNS * 2):]

    reply = _call_gemini_chat(message, trimmed_history, profile_context, student)
    if reply is None:
        reply = _fallback_reply(message, student)

    updated_history = trimmed_history + [
        {"role": "user", "content": message},
        {"role": "assistant", "content": reply},
    ]

    return {"reply": reply, "updated_history": updated_history}

# ---------------------------------------------------------------------------
# Profile context builder
# ---------------------------------------------------------------------------

def _build_profile_context(student: models.Student, db: Session) -> str:
    skills = ", ".join([s.name for s in student.skills]) or "No skills listed"

    edu_lines = []
    for e in student.education:
        parts = []
        if e.degree: parts.append(e.degree)
        if e.field_of_study: parts.append(f"in {e.field_of_study}")
        if e.institution: parts.append(f"at {e.institution}")
        if e.grade: parts.append(f"({e.grade})")
        edu_lines.append(" ".join(parts))

    exp_lines = [
        f"- {ex.title} at {ex.organization or 'N/A'} ({ex.start_date or '?'}–{ex.end_date or 'present'}): {ex.description or ''}"
        for ex in student.experience
    ]
    proj_lines = [
        f"- {p.title} [{p.technologies or 'no tech'}]: {p.description or ''}"
        for p in student.projects
    ]

    # Fetch a small sample of job postings for context — cached per call,
    # reuse the same 5 rows instead of querying on every turn
    recent_jobs = db.query(models.JobPosting).limit(5).all()
    job_lines = [f"- {j.title} at {j.company} ({j.posting_type})" for j in recent_jobs]

    return (
        f"=== STUDENT PROFILE: {student.name} ===\n"
        f"Skills: {skills}\n"
        f"Education: {'; '.join(edu_lines) or 'None listed'}\n"
        f"Experience:\n" + ("\n".join(exp_lines) or "  None listed") + "\n"
        f"Projects:\n" + ("\n".join(proj_lines) or "  None listed") + "\n"
        f"\n=== SAMPLE JOB POSTINGS IN SYSTEM ===\n"
        + ("\n".join(job_lines) or "No job postings loaded.")
    )

# ---------------------------------------------------------------------------
# LLM call — cascade through models, never hardcode a single broken name
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """You are an expert AI career advisor for students seeking internships and entry-level jobs.

You have access to the following student profile and job data:

{context}

RULES:
1. Only make claims about the student's skills, experience, projects, and education that are present in the profile above.
2. Be specific — reference the student's actual projects, skills, and experiences by name when relevant.
3. Be honest about gaps — don't sugarcoat missing qualifications.
4. Keep answers concise and actionable (2-4 sentences for simple questions, a clear list for comparison questions).
5. If you don't have enough data to answer precisely, say so.
"""

_HISTORY_ROLES = {"user": "user", "assistant": "model"}
_CHAT_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"]


def _call_gemini_chat(
    message: str,
    history: List[Dict[str, str]],
    profile_context: str,
    student: models.Student,
) -> Optional[str]:
    if not HAS_GENAI or not GOOGLE_API_KEY:
        return None

    system_text = _SYSTEM_PROMPT.format(context=profile_context)

    # Build Gemini multi-turn contents
    contents = [
        {"role": "user",  "parts": [{"text": f"[System context]\n{system_text}"}]},
        {"role": "model", "parts": [{"text": "Understood. I'll answer based only on the student's verified profile data."}]},
    ]
    for turn in history:
        role = _HISTORY_ROLES.get(turn.get("role", "user"), "user")
        contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    for model_name in _CHAT_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                contents,
                request_options={"timeout": 20},
            )
            reply = response.text.strip()
            if reply:
                return reply
        except Exception as e:
            print(f"[career_assistant] {model_name} failed: {e}")
            continue

    return None

# ---------------------------------------------------------------------------
# Fallback reply
# ---------------------------------------------------------------------------

def _fallback_reply(message: str, student: models.Student) -> str:
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["skill", "gap", "missing", "lack"]):
        skills_str = ", ".join([s.name for s in student.skills[:6]]) or "no skills listed"
        return (
            f"Your profile shows skills in: {skills_str}. "
            "Use the Skill Gap Analysis tab for a detailed breakdown against a specific job."
        )
    if any(w in msg_lower for w in ["match", "job", "role", "internship"]):
        return "Go to the Job Matches tab to see your personalized ranked matches with full reasoning."
    if any(w in msg_lower for w in ["interview", "prepare", "question"]):
        return "Select a job from your matches and use the Interview Prep feature for personalized questions."
    if any(w in msg_lower for w in ["cover letter", "resume", "cv", "tailor"]):
        return "Use the Tailor Resume feature on any job card to get role-specific bullet rewrites and a cover letter."
    skills_str = ", ".join([s.name for s in student.skills[:5]]) or "no skills listed"
    return (
        f"Hi {student.name}! Your profile shows: {skills_str}. "
        "I can help with job matches, skill gaps, interview prep, or resume tailoring. What would you like to explore?"
    )
