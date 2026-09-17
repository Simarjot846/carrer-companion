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

MAX_HISTORY_TURNS = 6   # Keep last N turns to avoid prompt bloat


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def chat(
    student_id: int,
    message: str,
    history: List[Dict[str, str]],
    db: Session,
) -> Dict[str, Any]:
    """
    Args:
        student_id: the student asking
        message: current user message
        history: list of {role: "user"|"assistant", content: str} — sent from client
        db: database session

    Returns:
        {reply: str, updated_history: List[{role, content}]}
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        return {
            "reply": "I couldn't find your profile. Please make sure your account is set up correctly.",
            "updated_history": history,
        }

    profile_context = _build_profile_context(student, db)
    trimmed_history = history[-(MAX_HISTORY_TURNS * 2):]  # keep last N full turns

    reply = _call_gemini_chat(message, trimmed_history, profile_context, student)
    if reply is None:
        reply = _fallback_reply(message, student)

    updated_history = trimmed_history + [
        {"role": "user", "content": message},
        {"role": "assistant", "content": reply},
    ]

    return {
        "reply": reply,
        "updated_history": updated_history,
    }


# ---------------------------------------------------------------------------
# Profile context builder
# ---------------------------------------------------------------------------

def _build_profile_context(student: models.Student, db: Session) -> str:
    """Build a concise system context block from the student's real data."""
    skills = ", ".join([s.name for s in student.skills]) or "No skills listed"

    edu_lines = []
    for e in student.education:
        parts = []
        if e.degree:
            parts.append(e.degree)
        if e.field_of_study:
            parts.append(f"in {e.field_of_study}")
        if e.institution:
            parts.append(f"at {e.institution}")
        if e.grade:
            parts.append(f"({e.grade})")
        edu_lines.append(" ".join(parts))

    exp_lines = [
        f"- {ex.title} at {ex.organization or 'N/A'} ({ex.start_date or '?'}–{ex.end_date or 'present'}): {ex.description or ''}"
        for ex in student.experience
    ]

    proj_lines = [
        f"- {p.title} [{p.technologies or 'no tech'}]: {p.description or ''}"
        for p in student.projects
    ]

    # Fetch a few recent job matches for context (do NOT re-run full RAG; just query cached postings)
    # We pull the top 5 job postings for lightweight context
    recent_jobs = db.query(models.JobPosting).limit(5).all()
    job_lines = [f"- {j.title} at {j.company} ({j.posting_type})" for j in recent_jobs]

    return (
        f"=== STUDENT PROFILE: {student.name} ===\n"
        f"Skills: {skills}\n"
        f"Education: {'; '.join(edu_lines) or 'None listed'}\n"
        f"Experience:\n" + ("\n".join(exp_lines) or "  None listed") + "\n"
        f"Projects:\n" + ("\n".join(proj_lines) or "  None listed") + "\n"
        f"\n=== SAMPLE JOB POSTINGS IN SYSTEM ===\n"
        + ("\n".join(job_lines) or "No job postings loaded.") +
        "\n\n(Full job postings are available — ask me about specific roles and I will reason about them based on the student's profile.)"
    )


# ---------------------------------------------------------------------------
# LLM call
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """You are an expert AI career advisor for students seeking internships and entry-level jobs.

You have access to the following student profile and job data:

{context}

RULES:
1. Only make claims about the student's skills, experience, projects, and education that are present in the profile above. Never invent or assume details.
2. If asked about a specific job the student hasn't matched yet, reason based on their profile vs what such roles typically require.
3. Be specific — reference the student's actual projects, skills, and experiences by name when relevant.
4. Be honest about gaps — don't sugarcoat missing qualifications.
5. Keep answers concise and actionable (2-4 sentences for simple questions, a clear list for comparison questions).
6. If you don't have enough data to answer precisely, say so.
"""

_HISTORY_ROLES = {"user": "user", "assistant": "model"}


def _call_gemini_chat(
    message: str,
    history: List[Dict[str, str]],
    profile_context: str,
    student: models.Student,
) -> Optional[str]:
    if not HAS_GENAI or not GOOGLE_API_KEY:
        return None

    try:
        system_text = _SYSTEM_PROMPT.format(context=profile_context)

        # Build Gemini conversation contents
        # Gemini chat expects alternating user/model turns.
        # We prepend a synthetic user turn with the system context.
        contents = []

        # Inject profile context as a user-prefixed system block
        contents.append({
            "role": "user",
            "parts": [{"text": f"[System context — treat as background knowledge, do not repeat it verbatim in your answers]\n{system_text}"}],
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "Understood. I have the student's profile and will answer only based on the provided data."}],
        })

        # Prior conversation turns
        for turn in history:
            role = _HISTORY_ROLES.get(turn.get("role", "user"), "user")
            contents.append({
                "role": role,
                "parts": [{"text": turn.get("content", "")}],
            })

        # Current message
        contents.append({
            "role": "user",
            "parts": [{"text": message}],
        })

        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content(contents)
        reply = response.text.strip()
        return reply if reply else None

    except Exception as e:
        print(f"Warning: Gemini career assistant call failed ({e}). Using fallback.")
        return None


# ---------------------------------------------------------------------------
# Fallback reply
# ---------------------------------------------------------------------------

def _fallback_reply(message: str, student: models.Student) -> str:
    msg_lower = message.lower()

    if any(w in msg_lower for w in ["skill", "gap", "missing", "lack"]):
        return (
            f"Based on your profile, you have skills in: "
            f"{', '.join([s.name for s in student.skills[:6]]) or 'no skills listed'}. "
            "To identify specific gaps, please navigate to the Skill Gap Analysis tab for a selected job."
        )

    if any(w in msg_lower for w in ["match", "job", "role", "position", "internship"]):
        return (
            "To see your personalized job matches, use the Job Matches page which runs the full "
            "RAG + Gemini pipeline against your profile. I can help you interpret specific results "
            "or compare roles once you've selected them."
        )

    if any(w in msg_lower for w in ["interview", "prepare", "question"]):
        return (
            "For interview preparation, select a specific job from your matches and use the "
            "Interview Prep feature. It generates tailored technical, project, and behavioral "
            "questions grounded in your actual experience."
        )

    if any(w in msg_lower for w in ["cover letter", "resume", "cv"]):
        return (
            "The Resume & Cover Letter customization feature generates role-specific tailoring "
            "suggestions and a cover letter grounded only in your actual profile data. "
            "Select a job from your matches to use it."
        )

    skills_str = ", ".join([s.name for s in student.skills[:5]]) or "no skills listed"
    return (
        f"Hi {student.name}! I'm your career assistant. Your current profile shows skills in "
        f"{skills_str}. I can help you understand job matches, skill gaps, interview prep, or "
        "cover letter customization. What would you like to explore?"
    )
