import json
import re
import os
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.config import GOOGLE_API_KEY
from app import models
from app.services.embedding_service import get_embedding
from app.services.vector_store import search_similar_jobs

try:
    import google.generativeai as genai
    HAS_GENAI = True
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
except Exception:
    genai = None
    HAS_GENAI = False



# ---------------------------------------------------------------------------
# In-Memory Cache (FIX 4)
# ---------------------------------------------------------------------------
_MATCHES_CACHE: Dict[int, List[Dict[str, Any]]] = {}

def get_cached_matches(student_id: int) -> List[Dict[str, Any]] | None:
    """Returns cached matches for student if present."""
    return _MATCHES_CACHE.get(student_id)

def set_cached_matches(student_id: int, matches: List[Dict[str, Any]]) -> None:
    """Stores matches in cache for student."""
    _MATCHES_CACHE[student_id] = matches

def clear_matches_cache(student_id: int | None = None) -> None:
    """Clears in-memory matches cache."""
    if student_id is not None:
        _MATCHES_CACHE.pop(student_id, None)
    else:
        _MATCHES_CACHE.clear()


def format_candidate_profile_text(student: models.Student) -> str:
    """Formats student profile into a rich text block for embedding."""
    skills_str = ", ".join([s.name for s in student.skills]) if student.skills else "None listed"

    edu_list = [
        f"{e.degree or 'Degree'} in {e.field_of_study or 'Field'} at {e.institution}"
        + (f" ({e.start_date}–{e.end_date})" if e.start_date or e.end_date else "")
        for e in student.education
    ]
    edu_str = "; ".join(edu_list) if edu_list else "None listed"

    exp_list = [
        f"{ex.title} at {ex.organization or 'Company'}: {(ex.description or '')[:200]}"
        for ex in student.experience
    ]
    exp_str = "; ".join(exp_list) if exp_list else "None listed"

    proj_list = [
        f"{p.title} [{p.technologies or 'N/A'}]: {(p.description or '')[:150]}"
        for p in student.projects
    ]
    proj_str = "; ".join(proj_list) if proj_list else "None listed"

    qual_str = getattr(student, "qualifications", None) or "None listed"

    # Include a snippet of raw resume text for richer semantic context
    raw_text_snippet = ""
    latest_resume = max(
        [r for r in student.resumes if r.raw_text],
        key=lambda r: r.uploaded_at,
        default=None,
    ) if student.resumes else None
    if latest_resume and latest_resume.raw_text:
        raw_text_snippet = f"\nResume Excerpt:\n{latest_resume.raw_text[:1500]}"

    return (
        f"Candidate: {student.name}\n"
        f"Skills: {skills_str}\n"
        f"Education: {edu_str}\n"
        f"Experience: {exp_str}\n"
        f"Projects: {proj_str}\n"
        f"Qualifications: {qual_str}"
        f"{raw_text_snippet}"
    )


def get_job_matches_for_student(
    student_id: int,
    db: Session,
    top_k: int = 10,
    force_refresh: bool = False,
) -> List[Dict[str, Any]]:
    """
    RAG + LLM Matching Pipeline:
    1. Check in-memory cache if force_refresh is False (FIX 4).
    2. Build candidate profile text & embed it.
    3. Retrieve top_k candidate jobs via vector similarity search.
    4. Pass candidate profile + top 5 retrieved jobs to LLM for scoring & missing skills analysis (FIX 2).
    5. Return ranked list of matched jobs and populate cache.
    """
    # FIX 4: In-memory cache hit returns instantly
    if not force_refresh and student_id in _MATCHES_CACHE:
        return _MATCHES_CACHE[student_id]

    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student with ID {student_id} not found.")

    profile_text = format_candidate_profile_text(student)

    # Step 1: Embedding + Vector Similarity Search (keeps top_k=10 for retrieval)
    profile_vector = get_embedding(profile_text, input_type="query")
    similar_jobs = search_similar_jobs(db, profile_vector, top_k=top_k)

    if not similar_jobs:
        return []

    # Score ALL retrieved jobs with LLM (not just top 5) for accurate ranking
    llm_top_k = len(similar_jobs)
    jobs_for_llm = [job for job, vec_sim in similar_jobs[:llm_top_k]]

    # Step 2: LLM Reranking and Scoring
    llm_scores = _score_matches_with_llm(student, profile_text, jobs_for_llm)

    # Merge vector score, LLM score, and job metadata
    score_map = {item["job_id"]: item for item in llm_scores if isinstance(item, dict) and "job_id" in item}

    results = []
    for job, vec_sim in similar_jobs:
        llm_data = score_map.get(job.id, {})
        # If scored by LLM, use LLM match score; otherwise fallback to vector similarity percentage
        match_score = llm_data.get("match_score", int(round(vec_sim * 100)))
        reasoning = llm_data.get("reasoning", "Ranked based on dense semantic vector similarity.")
        missing_skills = llm_data.get("missing_skills", [])

        results.append({
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "description": job.description,
            "responsibilities": getattr(job, "responsibilities", None),
            "required_skills": job.required_skills,
            "preferred_skills": getattr(job, "preferred_skills", []),
            "qualifications": getattr(job, "qualifications", None),
            "experience_level": job.experience_level,
            "experience_requirements": getattr(job, "experience_requirements", None),
            "education_requirements": getattr(job, "education_requirements", None),
            "location": job.location,
            "posting_type": job.posting_type,
            "match_score": max(0, min(100, match_score)),
            "vector_similarity": round(float(vec_sim), 4),
            "reasoning": reasoning,
            "missing_skills": missing_skills,
        })

    # Sort descending by match_score
    results.sort(key=lambda x: x["match_score"], reverse=True)

    # Populate cache (FIX 4)
    _MATCHES_CACHE[student_id] = results
    return results


def _validate_llm_scores(parsed: Any, valid_job_ids: set) -> List[Dict[str, Any]] | None:
    """
    Validates the LLM's parsed JSON before it's trusted anywhere downstream.
    """
    if not isinstance(parsed, list):
        return None

    valid_items = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        if "job_id" not in item:
            continue
        if item["job_id"] not in valid_job_ids:
            continue
        valid_items.append(item)

    return valid_items if valid_items else None


def _score_matches_with_llm(student: models.Student, profile_text: str, jobs: List[models.JobPosting]) -> List[Dict[str, Any]]:
    """Calls the LLM to analyze job candidate fit and return structured scores and missing skills."""
    valid_job_ids = {job.id for job in jobs}

    jobs_formatted = ""
    for i, job in enumerate(jobs, 1):
        req_skills = ", ".join(job.required_skills) if isinstance(job.required_skills, list) else str(job.required_skills or "")
        pref_skills = ", ".join(job.preferred_skills) if isinstance(getattr(job, "preferred_skills", None), list) else str(getattr(job, "preferred_skills", "") or "")
        resp = getattr(job, "responsibilities", "") or job.description[:200]
        quals = getattr(job, "qualifications", "") or "Not specified"
        exp_req = getattr(job, "experience_requirements", "") or job.experience_level
        edu_req = getattr(job, "education_requirements", "") or "Not specified"

        jobs_formatted += (
            f"\n--- JOB #{job.id} ---\n"
            f"Title: {job.title}\n"
            f"Company: {job.company}\n"
            f"Location: {job.location}\n"
            f"Level/Type: {job.experience_level} ({job.posting_type})\n"
            f"Required Skills: {req_skills}\n"
            f"Preferred Skills: {pref_skills}\n"
            f"Experience Requirements: {exp_req}\n"
            f"Education Requirements: {edu_req}\n"
            f"Responsibilities: {resp}\n"
            f"Qualifications: {quals}\n"
            f"Description: {job.description[:300]}...\n"
        )

    prompt = f"""You are an expert AI Career Coach matching candidate profiles with internship and job opportunities.

{profile_text}

RETRIEVED JOB POSTINGS ({len(jobs)} total):
{jobs_formatted}

Evaluate candidate fit for EACH job above. Respond ONLY with a valid JSON array of objects. No markdown formatting, no code blocks, no preamble.

JSON format (respond with one object per job, in an array like this):
[
  {{
    "job_id": {jobs[0].id if jobs else 1},
    "match_score": 85,
    "reasoning": "Detailed 2-sentence explanation of why the candidate fits or lacks qualifications.",
    "missing_skills": ["Skill1", "Skill2"]
  }}
]
"""
    # 1. Try Gemini with valid fast models
    # Priority: gemini-1.5-flash (fast, free tier) -> gemini-1.5-flash-8b (lightest)
    if HAS_GENAI and GOOGLE_API_KEY:
        candidate_models = ["gemini-1.5-flash", "gemini-1.5-flash-8b"]
        for model_name in candidate_models:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(
                    prompt,
                    generation_config={"temperature": 0.1, "max_output_tokens": 1024},
                )
                raw_output = response.text.strip()
                parsed = _parse_json_string(raw_output)
                validated = _validate_llm_scores(parsed, valid_job_ids)
                if validated is not None:
                    return validated
            except Exception as e:
                print(f"Warning: Gemini ({model_name}) matching API call failed ({e}).")
                continue

    return _fallback_scoring(student, jobs)


def _parse_json_string(raw_output: str) -> Any:
    """Robustly parse LLM JSON output, handling markdown code fences."""
    # Strip markdown fences
    raw_output = re.sub(r"^```(?:json)?\s*", "", raw_output, flags=re.MULTILINE)
    raw_output = re.sub(r"\s*```$", "", raw_output, flags=re.MULTILINE)
    raw_output = raw_output.strip()
    try:
        return json.loads(raw_output)
    except json.JSONDecodeError:
        # Try to find a JSON array in the output
        match = re.search(r"\[[\s\S]+\]", raw_output)
        if match:
            return json.loads(match.group())
        raise


def _fallback_scoring(student: models.Student, jobs: List[models.JobPosting]) -> List[Dict[str, Any]]:
    """Deterministic fallback scoring algorithm based on candidate skill overlap."""
    student_skills = {s.name.lower() for s in student.skills}
    results = []

    for job in jobs:
        req_skills = job.required_skills if isinstance(job.required_skills, list) else []
        matched_skills = [s for s in req_skills if s.lower() in student_skills]
        missing_skills = [s for s in req_skills if s.lower() not in student_skills]

        overlap_ratio = len(matched_skills) / max(1, len(req_skills))
        score = int(round(50 + overlap_ratio * 45))

        if matched_skills:
            reasoning = f"Good match with demonstrated background in {', '.join(matched_skills[:3])}."
        else:
            reasoning = f"Partial fit based on foundational technical skills, but requires additional preparation in {', '.join(missing_skills[:2])}."

        results.append({
            "job_id": job.id,
            "match_score": score,
            "reasoning": reasoning,
            "missing_skills": missing_skills,
        })

    return results