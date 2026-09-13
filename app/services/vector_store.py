import numpy as np
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models import JobPosting
from app.services.embedding_service import get_embedding


def prepare_job_text_for_embedding(job: JobPosting) -> str:
    """
    Concatenates job posting fields into a single text block:
    title + company + level + type + location + required_skills + preferred_skills +
    experience_requirements + education_requirements + responsibilities + qualifications + description.
    Per prompt instructions: do NOT chunk job postings into multiple pieces.
    """
    req_skills = ", ".join(job.required_skills) if isinstance(job.required_skills, list) else str(job.required_skills or "")
    pref_skills = ", ".join(job.preferred_skills) if isinstance(getattr(job, "preferred_skills", None), list) else str(getattr(job, "preferred_skills", "") or "")
    resp = getattr(job, "responsibilities", "") or ""
    quals = getattr(job, "qualifications", "") or ""
    exp_req = getattr(job, "experience_requirements", "") or job.experience_level
    edu_req = getattr(job, "education_requirements", "") or ""

    return (
        f"Title: {job.title}\n"
        f"Company: {job.company}\n"
        f"Level: {job.experience_level}\n"
        f"Type: {job.posting_type}\n"
        f"Location: {job.location}\n"
        f"Required Skills: {req_skills}\n"
        f"Preferred Skills: {pref_skills}\n"
        f"Experience Requirements: {exp_req}\n"
        f"Education Requirements: {edu_req}\n"
        f"Responsibilities: {resp}\n"
        f"Qualifications: {quals}\n\n"
        f"Description:\n{job.description}"
    )


def search_similar_jobs(db: Session, query_vector: List[float], top_k: int = 10) -> List[Tuple[JobPosting, float]]:
    """
    Searches vector store for top_k most relevant job postings matching query_vector.
    Returns list of tuples: (JobPosting, similarity_score).
    """
    jobs = db.query(JobPosting).filter(JobPosting.embedding.isnot(None)).all()
    if not jobs:
        return []

    q_vec = np.array(query_vector, dtype=np.float32)
    q_norm = np.linalg.norm(q_vec)
    if q_norm == 0:
        q_norm = 1.0
    q_vec_norm = q_vec / q_norm

    scored_jobs = []
    for job in jobs:
        if not job.embedding:
            continue
        j_vec = np.array(job.embedding, dtype=np.float32)
        j_norm = np.linalg.norm(j_vec)
        if j_norm == 0:
            continue
        sim = float(np.dot(q_vec_norm, j_vec / j_norm))
        scored_jobs.append((job, sim))

    # Sort descending by similarity score
    scored_jobs.sort(key=lambda x: x[1], reverse=True)
    return scored_jobs[:top_k]
