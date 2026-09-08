import json
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



def format_candidate_profile_text(student: models.Student) -> str:
    """Formats student profile into a single text representation for embedding generation."""
    skills_str = ", ".join([s.name for s in student.skills]) if student.skills else "None listed"

    edu_list = [f"{e.degree or 'Degree'} in {e.field_of_study or 'Field'} at {e.institution}" for e in student.education]
    edu_str = "; ".join(edu_list) if edu_list else "None listed"

    exp_list = [f"{ex.title} at {ex.organization or 'Company'}: {ex.description or ''}" for ex in student.experience]
    exp_str = "; ".join(exp_list) if exp_list else "None listed"

    proj_list = [f"{p.title} ({p.technologies or ''}): {p.description or ''}" for p in student.projects]
    proj_str = "; ".join(proj_list) if proj_list else "None listed"

    return f"Candidate Name: {student.name}\nSkills: {skills_str}\nEducation: {edu_str}\nExperience: {exp_str}\nProjects: {proj_str}"


def get_job_matches_for_student(student_id: int, db: Session, top_k: int = 10) -> List[Dict[str, Any]]:
    """
    RAG + LLM Matching Pipeline:
    1. Build candidate profile text & embed it.
    2. Retrieve top_k candidate jobs via vector similarity search.
    3. Pass candidate profile + retrieved jobs to the LLM for scoring & missing skills analysis.
    4. Return ranked list of matched jobs.
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student with ID {student_id} not found.")

    profile_text = format_candidate_profile_text(student)

    # Step 1: Embedding + Vector Similarity Search
    profile_vector = get_embedding(profile_text, input_type="query")
    similar_jobs = search_similar_jobs(db, profile_vector, top_k=top_k)

    if not similar_jobs:
        return []

    jobs_for_llm = [job for job, vec_sim in similar_jobs]

    # Step 2: LLM Reranking and Scoring
    llm_scores = _score_matches_with_llm(student, profile_text, jobs_for_llm)

    # Merge vector score, LLM score, and job metadata
    score_map = {item["job_id"]: item for item in llm_scores if isinstance(item, dict) and "job_id" in item}

    results = []
    for job, vec_sim in similar_jobs:
        llm_data = score_map.get(job.id, {})
        match_score = llm_data.get("match_score", int(round(vec_sim * 100)))
        reasoning = llm_data.get("reasoning", "Matches key requirements based on candidate profile analysis.")
        missing_skills = llm_data.get("missing_skills", [])

        results.append({
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "description": job.description,
            "required_skills": job.required_skills,
            "experience_level": job.experience_level,
            "location": job.location,
            "posting_type": job.posting_type,
            "match_score": max(0, min(100, match_score)),
            "vector_similarity": round(float(vec_sim), 4),
            "reasoning": reasoning,
            "missing_skills": missing_skills,
        })

    # Sort descending by match_score
    results.sort(key=lambda x: x["match_score"], reverse=True)
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
        req_skills = ", ".join(job.required_skills) if isinstance(job.required_skills, list) else str(job.required_skills)
        jobs_formatted += f"\n--- JOB #{job.id} ---\nTitle: {job.title}\nCompany: {job.company}\nLocation: {job.location}\nRequired Skills: {req_skills}\nDescription: {job.description[:400]}...\n"

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
    # 1. Try Gemini
    if HAS_GENAI and GOOGLE_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            raw_output = response.text.strip()
            parsed = _parse_json_string(raw_output)
            validated = _validate_llm_scores(parsed, valid_job_ids)
            if validated is not None:
                return validated
        except Exception as e:
            print(f"Warning: Gemini matching API call failed ({e}). Using deterministic fallback scoring.")

    return _fallback_scoring(student, jobs)


def _parse_json_string(raw_output: str) -> Any:
    if raw_output.startswith("```"):
        raw_output = raw_output.strip("`")
        if raw_output.startswith("json"):
            raw_output = raw_output[4:]
        raw_output = raw_output.strip()
    return json.loads(raw_output)


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