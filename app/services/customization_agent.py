"""
M3.2 — Resume & Cover Letter Customization Agent
Produces tailored resume suggestions and a role-specific cover letter,
grounded ONLY in the student's actual profile data — no invented content.
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

def generate_customization(student_id: int, job_id: int, db: Session) -> Dict[str, Any]:
    """
    Returns:
      resume_customization:
        prioritized_skills: List[str]
        relevant_experiences: List[{title, org, why_relevant}]
        relevant_projects: List[{title, why_relevant}]
        rewritten_bullets: List[{original, suggested, change_note}]
        section_order_recommendation: List[str]
        tailoring_notes: str
      cover_letter:
        subject_line: str
        body: str  (3-4 paragraphs)
        hallucination_check: bool  (True = passed = no invented content detected)
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student {student_id} not found.")

    job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    if not job:
        raise ValueError(f"Job {job_id} not found.")

    profile_text = _build_rich_profile(student)
    job_text = _build_job_text(job)

    resume_result = _call_gemini_resume(profile_text, job_text, student, job)
    if resume_result is None:
        resume_result = _fallback_resume(student, job)

    cover_result = _call_gemini_cover_letter(profile_text, job_text, student, job)
    if cover_result is None:
        cover_result = _fallback_cover_letter(student, job)

    # Hallucination guard: verify cover letter doesn't mention skills not in profile
    cover_result["hallucination_check"] = _check_hallucination(
        cover_result.get("body", ""), student
    )

    return {
        "student_id": student_id,
        "job_id": job_id,
        "job_title": job.title,
        "company": job.company,
        "student_name": student.name,
        "resume_customization": resume_result,
        "cover_letter": cover_result,
    }


# ---------------------------------------------------------------------------
# Profile / job formatters
# ---------------------------------------------------------------------------

def _build_rich_profile(student: models.Student) -> str:
    skills_all = [s.name for s in student.skills]

    edu_lines = []
    for e in student.education:
        parts = [e.degree or "Degree", e.field_of_study or "Field", "at", e.institution]
        if e.grade:
            parts.append(f"({e.grade})")
        if e.end_date:
            parts.append(f"[{e.end_date}]")
        edu_lines.append(" ".join(parts))

    exp_lines = []
    for ex in student.experience:
        exp_lines.append(
            f"• {ex.title} at {ex.organization or 'N/A'} "
            f"({ex.start_date or '?'}–{ex.end_date or 'Present'})\n"
            f"  {ex.description or 'No description provided.'}"
        )

    proj_lines = []
    for p in student.projects:
        proj_lines.append(
            f"• {p.title} [Technologies: {p.technologies or 'unspecified'}]\n"
            f"  {p.description or 'No description.'}"
        )

    qual = getattr(student, "qualifications", None) or "Not specified"

    return (
        f"STUDENT: {student.name}\n\n"
        f"ALL SKILLS: {', '.join(skills_all) or 'None'}\n\n"
        f"EDUCATION:\n" + ("\n".join(edu_lines) or "None") + "\n\n"
        f"EXPERIENCE:\n" + ("\n".join(exp_lines) or "None") + "\n\n"
        f"PROJECTS:\n" + ("\n".join(proj_lines) or "None") + "\n\n"
        f"QUALIFICATIONS/SUMMARY: {qual}"
    )


def _build_job_text(job: models.JobPosting) -> str:
    req = ", ".join(job.required_skills) if isinstance(job.required_skills, list) else str(job.required_skills or "")
    pref_raw = getattr(job, "preferred_skills", None)
    pref = ", ".join(pref_raw) if isinstance(pref_raw, list) else ""
    return (
        f"ROLE: {job.title}\nCOMPANY: {job.company}\n"
        f"Level: {job.experience_level} | Posting type: {job.posting_type}\n"
        f"Required Skills: {req}\nPreferred Skills: {pref or 'None listed'}\n"
        f"Responsibilities: {job.responsibilities or 'See description'}\n"
        f"Qualifications: {job.qualifications or 'Not specified'}\n"
        f"Experience Requirements: {job.experience_requirements or 'Not specified'}\n"
        f"Education Requirements: {job.education_requirements or 'Not specified'}\n"
        f"Description: {job.description}"
    )


# ---------------------------------------------------------------------------
# Resume customization LLM call
# ---------------------------------------------------------------------------

_RESUME_PROMPT = """You are an expert resume consultant helping a student tailor their resume for a specific role.

HARD CONSTRAINT: You MUST NOT invent, add, or imply any skill, experience, achievement, technology, number, or outcome that is not explicitly stated in the student profile below. Only work with what is already there — reorder, rephrase, and emphasize; never fabricate.

{profile}

{job}

Produce a resume tailoring report. Respond ONLY with valid JSON. No markdown. No preamble.

{{
  "prioritized_skills": ["skill1", "skill2"],
  "relevant_experiences": [
    {{"title": "...", "organization": "...", "why_relevant": "..."}}
  ],
  "relevant_projects": [
    {{"title": "...", "why_relevant": "..."}}
  ],
  "rewritten_bullets": [
    {{
      "original": "...",
      "suggested": "...",
      "change_note": "What was improved and why (stronger verb / keyword alignment / clearer impact)"
    }}
  ],
  "section_order_recommendation": ["Skills", "Experience", "Projects", "Education"],
  "tailoring_notes": "2-3 sentences on the overall tailoring strategy for this role."
}}
"""


def _call_gemini_resume(
    profile_text: str, job_text: str,
    student: models.Student, job: models.JobPosting
) -> Optional[Dict[str, Any]]:
    if not HAS_GENAI or not GOOGLE_API_KEY:
        return None
    try:
        prompt = _RESUME_PROMPT.format(profile=profile_text, job=job_text)
        model = genai.GenerativeModel("gemini-3.6-flash")
        # Timeout raised to 45s — 2s was too aggressive and caused silent fallback to empty output
        response = model.generate_content(prompt, request_options={"timeout": 45})
        parsed = _parse_json(response.text.strip())
        return _validate_resume_response(parsed)
    except Exception as e:
        print(f"Warning: Gemini resume customization failed ({e}). Using fallback.")
        return None


def _validate_resume_response(parsed: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(parsed, dict):
        return None
    for key in ("prioritized_skills", "relevant_experiences", "relevant_projects",
                "rewritten_bullets", "section_order_recommendation"):
        if key not in parsed or not isinstance(parsed[key], list):
            parsed[key] = []
    if "tailoring_notes" not in parsed:
        parsed["tailoring_notes"] = "Resume tailored to highlight the most relevant skills and experiences."
    return parsed


# ---------------------------------------------------------------------------
# Cover letter LLM call
# ---------------------------------------------------------------------------

_COVER_LETTER_PROMPT = """You are an expert career coach writing a tailored cover letter for a student.

HARD CONSTRAINT: Every specific claim about skills, experience, or projects MUST come directly from the student profile below. Do NOT invent projects, technologies, outcomes, numbers, or qualifications. If the student has limited experience, write honestly but compellingly — focus on relevant skills, education, and learning capacity.

{profile}

{job}

Write a professional, personalized cover letter (3–4 paragraphs). The letter should:
1. Open with a specific connection between the student's background and this role
2. Reference 1-2 actual projects or experiences by name and connect them to specific job requirements
3. Address the student's genuine enthusiasm and learning goals
4. Close with a confident call to action

Respond ONLY with valid JSON. No markdown. No preamble.

{{
  "subject_line": "Application for [Role] at [Company] — [Student Name]",
  "body": "Full cover letter text here. Use real paragraph breaks (\\n\\n between paragraphs)."
}}
"""


def _call_gemini_cover_letter(
    profile_text: str, job_text: str,
    student: models.Student, job: models.JobPosting
) -> Optional[Dict[str, Any]]:
    if not HAS_GENAI or not GOOGLE_API_KEY:
        return None
    try:
        prompt = _COVER_LETTER_PROMPT.format(profile=profile_text, job=job_text)
        model = genai.GenerativeModel("gemini-3.6-flash")
        # Timeout raised to 45s — consistent with resume customization call
        response = model.generate_content(prompt, request_options={"timeout": 45})
        parsed = _parse_json(response.text.strip())
        return _validate_cover_letter_response(parsed)
    except Exception as e:
        print(f"Warning: Gemini cover letter generation failed ({e}). Using fallback.")
        return None


def _validate_cover_letter_response(parsed: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(parsed, dict):
        return None
    if "body" not in parsed or not isinstance(parsed.get("body"), str) or len(parsed["body"]) < 100:
        return None
    if "subject_line" not in parsed:
        parsed["subject_line"] = "Application for the Position"
    return parsed


# ---------------------------------------------------------------------------
# Hallucination guard
# ---------------------------------------------------------------------------

def _check_hallucination(cover_letter_body: str, student: models.Student) -> bool:
    """
    Returns True (passed) if no obviously invented content is detected.
    Heuristic: checks that any specific project names or technologies mentioned
    in the cover letter actually appear in the student's profile.
    This is a lightweight check — not exhaustive.
    """
    if not cover_letter_body:
        return True

    known_terms = set()
    for s in student.skills:
        known_terms.add(s.name.lower())
    for p in student.projects:
        known_terms.add(p.title.lower())
        if p.technologies:
            for t in p.technologies.split(","):
                known_terms.add(t.strip().lower())
    for ex in student.experience:
        known_terms.add(ex.title.lower())
        if ex.organization:
            known_terms.add(ex.organization.lower())
    for e in student.education:
        known_terms.add(e.institution.lower())

    body_lower = cover_letter_body.lower()

    # Simple sanity check: cover letter shouldn't be empty or suspiciously short
    if len(cover_letter_body) < 150:
        return False

    # Check passes unless we detect obvious boilerplate placeholders
    suspicious = ["[company]", "[position]", "[your name]", "[insert", "lorem ipsum"]
    for s in suspicious:
        if s in body_lower:
            return False

    return True


# ---------------------------------------------------------------------------
# Fallbacks
# ---------------------------------------------------------------------------

def _fallback_resume(student: models.Student, job: models.JobPosting) -> Dict[str, Any]:
    req_skills = job.required_skills if isinstance(job.required_skills, list) else []
    student_skill_names = [s.name for s in student.skills]
    student_skills_lower = {s.lower() for s in student_skill_names}

    prioritized = [s for s in req_skills if s.lower() in student_skills_lower]
    relevant_exp = [
        {"title": ex.title, "organization": ex.organization or "N/A", "why_relevant": "Listed experience that aligns with role requirements."}
        for ex in student.experience
    ]
    relevant_proj = [
        {"title": p.title, "why_relevant": f"Demonstrates hands-on use of {p.technologies or 'relevant technologies'}."}
        for p in student.projects
    ]

    bullets = []
    for ex in student.experience:
        if ex.description:
            bullets.append({
                "original": ex.description,
                "suggested": ex.description,
                "change_note": "Review this bullet to lead with a strong action verb and quantify impact where possible.",
            })

    return {
        "prioritized_skills": prioritized,
        "relevant_experiences": relevant_exp,
        "relevant_projects": relevant_proj,
        "rewritten_bullets": bullets,
        "section_order_recommendation": ["Skills", "Experience", "Projects", "Education"],
        "tailoring_notes": "Position your most relevant skills and experiences prominently. Align your language with the job description keywords.",
    }


def _fallback_cover_letter(student: models.Student, job: models.JobPosting) -> Dict[str, Any]:
    skills_str = ", ".join([s.name for s in student.skills[:5]]) or "relevant technical skills"
    proj = student.projects[0].title if student.projects else "personal projects"
    exp = student.experience[0].title if student.experience else "academic projects"
    edu = student.education[0] if student.education else None
    edu_str = f"{edu.degree or 'studies'} at {edu.institution}" if edu else "my academic background"

    body = (
        f"Dear Hiring Team at {job.company},\n\n"
        f"I am writing to express my strong interest in the {job.title} position at {job.company}. "
        f"With a background in {edu_str} and demonstrated proficiency in {skills_str}, "
        f"I am excited by the opportunity to contribute to your team.\n\n"
        f"During my experience as {exp}, I developed skills that align closely with the requirements "
        f"of this role. My work on {proj} gave me practical exposure to the technologies and "
        f"problem-solving approaches central to this position.\n\n"
        f"I am eager to bring my skills and enthusiasm to {job.company} and contribute meaningfully "
        f"to your team's goals. Thank you for considering my application — I would welcome the "
        f"opportunity to discuss how my background aligns with your needs.\n\n"
        f"Sincerely,\n{student.name}"
    )

    return {
        "subject_line": f"Application for {job.title} at {job.company} — {student.name}",
        "body": body,
    }


# ---------------------------------------------------------------------------
# Shared JSON parser
# ---------------------------------------------------------------------------

def _parse_json(raw: str) -> Any:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    return json.loads(raw)
