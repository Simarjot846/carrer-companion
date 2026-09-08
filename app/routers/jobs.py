from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from scripts.seed_jobs import seed_job_postings

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/", response_model=List[schemas.JobPostingOut])
def list_job_postings(
    query: Optional[str] = None,
    posting_type: Optional[str] = None,
    limit: int = Query(default=100, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(models.JobPosting)
    if posting_type:
        q = q.filter(models.JobPosting.posting_type == posting_type.lower())
    if query:
        search_pattern = f"%{query}%"
        q = q.filter(
            (models.JobPosting.title.ilike(search_pattern))
            | (models.JobPosting.company.ilike(search_pattern))
            | (models.JobPosting.description.ilike(search_pattern))
        )
    return q.limit(limit).all()


@router.get("/{job_id}", response_model=schemas.JobPostingOut)
def get_job_posting(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found.")
    return job


@router.post("/seed")
def seed_jobs_endpoint(force: bool = True, db: Session = Depends(get_db)):
    total = seed_job_postings(db=db, force_reseed=force)
    return {"message": f"Successfully seeded {total} job postings."}
