"""
M3.1 — Skill Gap Analysis Agent
Compares student profile against a specific job posting and classifies gaps
into five categories with role-specific explanations and actionable recommendations.
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

def analyze_skill_gap(student_id: int, job_id: int, db: Session) -> Dict[str, Any]:
    """
    Returns a structured skill gap report for a student vs a specific job.
    Output keys:
      job_title, company, student_name,
      critical_missing, partially_demonstrated, preferred_gaps,
      experience_gaps, qualification_gaps,
      overall_readiness_score (0-100)
    Each gap item: { skill/area, why_it_matters, recommendation }
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student {student_id} not found.")

    job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    if not job:
        raise ValueError(f"Job posting {job_id} not found.")

    profile_text = _build_profile_text(student)
    job_text = _build_job_text(job)

    llm_result = _call_gemini_skill_gap(profile_text, job_text, student, job)

    if llm_result is None:
        llm_result = _fallback_skill_gap(student, job)

    # Attach identifiers
    llm_result["job_title"] = job.title
    llm_result["company"] = job.company
    llm_result["student_name"] = student.name
    llm_result["job_id"] = job.id
    llm_result["student_id"] = student.id
    return llm_result


# ---------------------------------------------------------------------------
# Helpers — data formatting
# ---------------------------------------------------------------------------

def _build_profile_text(student: models.Student) -> str:
    skills = [f"{s.name} ({s.category or 'general'})" for s in student.skills]
    tech_skills = [s.name for s in student.skills if s.category == "technical"]
    soft_skills = [s.name for s in student.skills if s.category == "soft"]
    tools = [s.name for s in student.skills if s.category == "tool"]

    edu_parts = []
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
        if e.end_date:
            parts.append(f"— Graduated/Expected {e.end_date}")
        edu_parts.append(" ".join(parts))

    exp_parts = []
    for ex in student.experience:
        desc = ex.description or ""
        exp_parts.append(
            f"- {ex.title} at {ex.organization or 'Unknown'} "
            f"({ex.start_date or '?'} – {ex.end_date or 'Present'}): {desc}"
        )

    proj_parts = []
    for p in student.projects:
        proj_parts.append(
            f"- {p.title} [Tech: {p.technologies or 'unspecified'}]: {p.description or ''}"
        )

    qual = getattr(student, "qualifications", None) or "Not specified"

    return (
        f"CANDIDATE: {student.name}\n"
        f"Technical Skills: {', '.join(tech_skills) or 'None listed'}\n"
        f"Tools: {', '.join(tools) or 'None listed'}\n"
        f"Soft Skills: {', '.join(soft_skills) or 'None listed'}\n"
        f"All Skills: {', '.join([s.name for s in student.skills]) or 'None listed'}\n"
        f"Education:\n" + ("\n".join(edu_parts) or "  None listed") + "\n"
        f"Experience:\n" + ("\n".join(exp_parts) or "  None listed") + "\n"
        f"Projects:\n" + ("\n".join(proj_parts) or "  None listed") + "\n"
        f"Qualifications/Summary: {qual}"
    )


def _build_job_text(job: models.JobPosting) -> str:
    req = ", ".join(job.required_skills) if isinstance(job.required_skills, list) else str(job.required_skills or "")
    pref = ", ".join(job.preferred_skills) if isinstance(getattr(job, "preferred_skills", None), list) else ""
    return (
        f"ROLE: {job.title} at {job.company}\n"
        f"Level: {job.experience_level} | Type: {job.posting_type}\n"
        f"Required Skills: {req}\n"
        f"Preferred Skills: {pref or 'Not specified'}\n"
        f"Responsibilities: {job.responsibilities or 'Not specified'}\n"
        f"Qualifications: {job.qualifications or 'Not specified'}\n"
        f"Experience Requirements: {job.experience_requirements or 'Not specified'}\n"
        f"Education Requirements: {job.education_requirements or 'Not specified'}\n"
        f"Description: {job.description}"
    )


# ---------------------------------------------------------------------------
# LLM call
# ---------------------------------------------------------------------------

_SKILL_GAP_PROMPT = """You are an expert career advisor doing a precise skill gap analysis.

{profile}

{job}

Classify every gap between this candidate and job into exactly these categories.
For each gap item provide:
  - "skill": the specific skill, tool, experience area, or qualification
  - "why_it_matters": 1-2 sentences tied specifically to THIS job's responsibilities/requirements
  - "recommendation": one concrete, actionable step to close the gap

IMPORTANT: Only report genuine gaps. If the student already clearly has a skill, do NOT list it as a gap.

Respond with ONLY valid JSON. No markdown. No preamble.

{{
  "critical_missing": [
    {{"skill": "...", "why_it_matters": "...", "recommendation": "..."}}
  ],
  "partially_demonstrated": [
    {{"skill": "...", "why_it_matters": "...", "recommendation": "..."}}
  ],
  "preferred_gaps": [
    {{"skill": "...", "why_it_matters": "...", "recommendation": "..."}}
  ],
  "experience_gaps": [
    {{"area": "...", "why_it_matters": "...", "recommendation": "..."}}
  ],
  "qualification_gaps": [
    {{"area": "...", "why_it_matters": "...", "recommendation": "..."}}
  ],
  "overall_readiness_score": 72,
  "readiness_summary": "One sentence summary of overall readiness."
}}
"""


def _call_gemini_skill_gap(
    profile_text: str, job_text: str,
    student: models.Student, job: models.JobPosting
) -> Optional[Dict[str, Any]]:
    if not HAS_GENAI or not GOOGLE_API_KEY:
        return None

    prompt = _SKILL_GAP_PROMPT.format(profile=profile_text, job=job_text)

    try:
        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content(prompt, request_options={"timeout": 45})
        raw = response.text.strip()
        parsed = _parse_json(raw)
        return _validate_skill_gap_response(parsed)
    except Exception as e:
        print(f"Warning: Gemini skill gap analysis failed ({e}). Using deterministic fallback.")
        return None


def _validate_skill_gap_response(parsed: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(parsed, dict):
        return None
    required = {"critical_missing", "partially_demonstrated", "preferred_gaps",
                "experience_gaps", "qualification_gaps"}
    if not required.issubset(parsed.keys()):
        return None
    # Validate each list has correct item shape
    for key in ("critical_missing", "partially_demonstrated", "preferred_gaps"):
        if not isinstance(parsed.get(key), list):
            parsed[key] = []
    for key in ("experience_gaps", "qualification_gaps"):
        if not isinstance(parsed.get(key), list):
            parsed[key] = []
    if "overall_readiness_score" not in parsed or not isinstance(parsed["overall_readiness_score"], int):
        parsed["overall_readiness_score"] = 50
    if "readiness_summary" not in parsed:
        parsed["readiness_summary"] = "Readiness assessment based on skill comparison."
    return parsed


def _parse_json(raw: str) -> Any:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------

def _fallback_skill_gap(student: models.Student, job: models.JobPosting) -> Dict[str, Any]:
    """Pure skill-set comparison fallback — no LLM required."""
    student_skills_lower = {s.name.lower() for s in student.skills}
    req_skills = job.required_skills if isinstance(job.required_skills, list) else []
    pref_skills = getattr(job, "preferred_skills", None) or []
    if not isinstance(pref_skills, list):
        pref_skills = []

    critical_missing = []
    for skill in req_skills:
        if skill.lower() not in student_skills_lower:
            critical_missing.append({
                "skill": skill,
                "why_it_matters": f"{skill} is listed as a required skill for this role and directly relates to its core responsibilities.",
                "recommendation": f"Complete an online course or build a small hands-on project using {skill} to demonstrate practical proficiency.",
            })

    preferred_gaps = []
    for skill in pref_skills:
        if skill.lower() not in student_skills_lower:
            preferred_gaps.append({
                "skill": skill,
                "why_it_matters": f"{skill} is listed as a preferred skill that would strengthen your application.",
                "recommendation": f"Review official documentation or tutorials for {skill} to build familiarity.",
            })

    # Simple experience check
    experience_gaps = []
    exp_req = getattr(job, "experience_requirements", None) or ""
    if exp_req and not student.experience:
        experience_gaps.append({
            "area": "Relevant work experience",
            "why_it_matters": f"The role requires: {exp_req}. You have no listed experience entries.",
            "recommendation": "Seek internship, co-op, or freelance opportunities to build documented experience.",
        })

    # Education check
    qualification_gaps = []
    edu_req = getattr(job, "education_requirements", None) or ""
    if edu_req and not student.education:
        qualification_gaps.append({
            "area": "Educational background",
            "why_it_matters": f"The role specifies: {edu_req}.",
            "recommendation": "Ensure your education credentials are listed accurately in your profile.",
        })

    matched = len(req_skills) - len(critical_missing)
    score = max(10, int((matched / max(1, len(req_skills))) * 85))

    return {
        "critical_missing": critical_missing,
        "partially_demonstrated": [],
        "preferred_gaps": preferred_gaps,
        "experience_gaps": experience_gaps,
        "qualification_gaps": qualification_gaps,
        "overall_readiness_score": score,
        "readiness_summary": (
            f"Candidate meets {matched}/{len(req_skills)} required skills. "
            f"Focus on closing critical gaps before applying."
        ),
    }
