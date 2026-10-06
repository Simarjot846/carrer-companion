"""
M3.3 — Interview Preparation Agent
Generates a static interview prep package (question set + prep guidance + revision topics)
grounded in the student's actual profile and the specific job posting.
Does NOT implement live multi-turn mock interview — that is out of scope.
"""
import json
import warnings
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.config import GOOGLE_API_KEY
from app import models

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


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_interview_prep(
    student_id: int,
    job_id: int,
    db: Session,
    skill_gaps: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Returns a structured interview prep package:
      technical_questions: List[{question, prep_guidance}]
      resume_questions: List[{question, prep_guidance}]
      project_questions: List[{question, prep_guidance}]
      role_questions: List[{question, prep_guidance}]
      hr_questions: List[{question, prep_guidance}]
      topics_to_revise: List[str]
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student {student_id} not found.")

    job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    if not job:
        raise ValueError(f"Job {job_id} not found.")

    profile_text = _build_profile_text(student)
    job_text = _build_job_text(job)
    gaps_text = _format_gaps(skill_gaps)

    result = _call_gemini_prep(profile_text, job_text, gaps_text, student, job)
    if result is None:
        result = _fallback_prep(student, job)

    result["job_title"] = job.title
    result["company"] = job.company
    result["student_name"] = student.name
    result["job_id"] = job_id
    result["student_id"] = student_id
    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_profile_text(student: models.Student) -> str:
    skills = ", ".join([s.name for s in student.skills]) or "None listed"
    edu = "; ".join([
        f"{e.degree or 'Degree'} in {e.field_of_study or 'Field'} at {e.institution}"
        for e in student.education
    ]) or "None listed"
    exp = "\n".join([
        f"- {ex.title} at {ex.organization or 'Unknown'}: {ex.description or ''}"
        for ex in student.experience
    ]) or "None listed"
    projects = "\n".join([
        f"- {p.title} [{p.technologies or 'no tech listed'}]: {p.description or ''}"
        for p in student.projects
    ]) or "None listed"
    return (
        f"CANDIDATE: {student.name}\n"
        f"Skills: {skills}\n"
        f"Education: {edu}\n"
        f"Experience:\n{exp}\n"
        f"Projects:\n{projects}"
    )


def _build_job_text(job: models.JobPosting) -> str:
    req = ", ".join(job.required_skills) if isinstance(job.required_skills, list) else str(job.required_skills or "")
    return (
        f"ROLE: {job.title} at {job.company}\n"
        f"Level: {job.experience_level}\n"
        f"Required Skills: {req}\n"
        f"Responsibilities: {job.responsibilities or 'See description'}\n"
        f"Description: {job.description[:600]}"
    )


def _format_gaps(gaps: Optional[Dict[str, Any]]) -> str:
    if not gaps:
        return "No skill gap data provided."
    critical = [g.get("skill", g.get("area", "")) for g in gaps.get("critical_missing", [])]
    partial = [g.get("skill", "") for g in gaps.get("partially_demonstrated", [])]
    lines = []
    if critical:
        lines.append(f"Critical missing skills: {', '.join(critical)}")
    if partial:
        lines.append(f"Partially demonstrated: {', '.join(partial)}")
    return "\n".join(lines) if lines else "No significant skill gaps identified."


# ---------------------------------------------------------------------------
# LLM call
# ---------------------------------------------------------------------------

_PREP_PROMPT = """You are an expert technical recruiter and career coach preparing a candidate for an interview.

{profile}

{job}

SKILL GAPS:
{gaps}

Generate a structured interview preparation package. Use the candidate's ACTUAL experience and projects for resume/project questions — do not invent.

Respond ONLY with valid JSON. No markdown. No preamble.

{{
  "technical_questions": [
    {{"question": "...", "prep_guidance": "What a strong answer should cover (2-3 sentences, not a scripted answer)."}}
  ],
  "resume_questions": [
    {{"question": "...", "prep_guidance": "..."}}
  ],
  "project_questions": [
    {{"question": "...", "prep_guidance": "..."}}
  ],
  "role_questions": [
    {{"question": "...", "prep_guidance": "..."}}
  ],
  "hr_questions": [
    {{"question": "...", "prep_guidance": "..."}}
  ],
  "topics_to_revise": ["topic1", "topic2", "topic3"]
}}

Requirements:
- technical_questions: 3-4 questions on the role's required technical skills
- resume_questions: 2-3 questions referencing the candidate's ACTUAL listed experience
- project_questions: 2-3 questions about the candidate's ACTUAL listed projects
- role_questions: 2-3 questions based on the job's responsibilities
- hr_questions: 2-3 general/behavioural questions
- topics_to_revise: 4-6 specific technical topics derived from skill gaps and job requirements
"""


def _call_gemini_prep(
    profile_text: str, job_text: str, gaps_text: str,
    student: models.Student, job: models.JobPosting
) -> Optional[Dict[str, Any]]:
    if not HAS_GENAI or not GOOGLE_API_KEY:
        return None
    try:
        prompt = _PREP_PROMPT.format(profile=profile_text, job=job_text, gaps=gaps_text)
        model = genai.GenerativeModel("gemini-3.6-flash")
        # Timeout raised to 45s — consistent with other agent calls
        response = model.generate_content(prompt, request_options={"timeout": 45})
        parsed = _parse_json(response.text.strip())
        return _validate_prep_response(parsed)
    except Exception as e:
        print(f"Warning: Gemini interview prep generation failed ({e}). Using fallback.")
        return None


def _validate_prep_response(parsed: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(parsed, dict):
        return None
    required_keys = {"technical_questions", "resume_questions", "project_questions",
                     "role_questions", "hr_questions", "topics_to_revise"}
    if not required_keys.issubset(parsed.keys()):
        return None
    for key in required_keys:
        if not isinstance(parsed.get(key), list):
            parsed[key] = []
    return parsed


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------

def _fallback_prep(student: models.Student, job: models.JobPosting) -> Dict[str, Any]:
    req_skills = job.required_skills if isinstance(job.required_skills, list) else []

    tech_q = []
    for skill in req_skills[:3]:
        tech_q.append({
            "question": f"Can you walk us through your experience with {skill}?",
            "prep_guidance": f"Describe a specific instance where you used {skill}. Cover the context, what you did, and the outcome. If you lack direct experience, explain your understanding and how you would apply it.",
        })

    resume_q = []
    for ex in student.experience[:2]:
        resume_q.append({
            "question": f"Tell me more about your role as {ex.title} at {ex.organization or 'your previous position'}.",
            "prep_guidance": "Use the STAR method: Situation, Task, Action, Result. Be specific about your individual contributions.",
        })
    if not resume_q:
        resume_q.append({
            "question": "Walk me through your most relevant experience for this role.",
            "prep_guidance": "Connect your academic or project experience to the skills required for this position.",
        })

    proj_q = []
    for p in student.projects[:2]:
        proj_q.append({
            "question": f"Tell me about your project '{p.title}'. What was the most challenging part?",
            "prep_guidance": f"Explain the problem you were solving, the tech stack ({p.technologies or 'tools used'}), your specific contributions, and what you learned.",
        })
    if not proj_q:
        proj_q.append({
            "question": "Describe a technical project you've worked on that you're most proud of.",
            "prep_guidance": "Choose a project that demonstrates skills relevant to this role. Cover architecture decisions, challenges, and outcomes.",
        })

    role_q = [
        {
            "question": f"Why are you interested in the {job.title} role specifically?",
            "prep_guidance": "Be specific — connect your background and goals to the actual responsibilities of this role, not just the company name.",
        },
        {
            "question": "How would you approach your first 30 days in this role?",
            "prep_guidance": "Show awareness of onboarding: learning the codebase/tools, asking the right questions, and delivering early value without overcommitting.",
        },
    ]

    hr_q = [
        {
            "question": "Tell me about yourself.",
            "prep_guidance": "2-minute structured pitch: education background → relevant experience/projects → why this role. Practice out loud.",
        },
        {
            "question": "What are your greatest strengths and one area you're actively improving?",
            "prep_guidance": "Pick a genuine strength supported by evidence. For the improvement, choose something real but not disqualifying, and show you're actively working on it.",
        },
        {
            "question": "Where do you see yourself in 2-3 years?",
            "prep_guidance": "Align your answer with the skills and growth trajectory this role would offer. Show ambition without implying you'll leave immediately.",
        },
    ]

    topics = list({s for s in req_skills[:6]})

    return {
        "technical_questions": tech_q,
        "resume_questions": resume_q,
        "project_questions": proj_q,
        "role_questions": role_q,
        "hr_questions": hr_q,
        "topics_to_revise": topics,
    }


# ---------------------------------------------------------------------------
# JSON parser
# ---------------------------------------------------------------------------

def _parse_json(raw: str) -> Any:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    return json.loads(raw)
