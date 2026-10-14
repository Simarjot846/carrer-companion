import os
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app import models
from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE_MB, ALLOWED_RESUME_EXTENSIONS
from app.services.resume_parser import extract_text_from_pdf
from app.services.llm_extractor import extract_structured_profile

router = APIRouter(prefix="/students", tags=["resumes"])


def _run_resume_pipeline(resume_id: int, student_id: int, stored_path: str) -> None:
    """
    Background task: parse PDF -> LLM extract -> save skills/education/experience/projects.
    Uses its own DB session so it doesn't block the HTTP response.
    Clears old profile data first to avoid duplicates on re-upload.
    """
    from app.services.matching_agent import clear_matches_cache
    db = SessionLocal()
    try:
        resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
        if not resume:
            return

        raw_text = extract_text_from_pdf(stored_path)
        resume.raw_text = raw_text
        db.flush()

        structured = extract_structured_profile(raw_text)

        # ── Clear old extracted data for this student before inserting fresh ──
        # This prevents duplicate skills/education/etc. when re-uploading a resume.
        db.query(models.Skill).filter(
            models.Skill.student_id == student_id,
            models.Skill.source == "resume",
        ).delete(synchronize_session=False)
        db.query(models.Education).filter(models.Education.student_id == student_id).delete(synchronize_session=False)
        db.query(models.Experience).filter(models.Experience.student_id == student_id).delete(synchronize_session=False)
        db.query(models.Project).filter(models.Project.student_id == student_id).delete(synchronize_session=False)
        db.flush()

        # ── Insert fresh extracted data ────────────────────────────────────
        seen_skills: set = set()
        for skill in structured.get("skills", []):
            name = (skill.get("name") or "").strip()
            if not name:
                continue
            key = name.lower()
            if key in seen_skills:
                continue           # skip duplicate skill names
            seen_skills.add(key)
            db.add(models.Skill(
                student_id=student_id,
                name=name,
                category=skill.get("category", "technical"),
                source="resume",
            ))

        for edu in structured.get("education", []):
            if edu and edu.get("institution"):
                db.add(models.Education(student_id=student_id, **edu))

        for exp in structured.get("experience", []):
            if exp and exp.get("title"):
                db.add(models.Experience(student_id=student_id, **exp))

        for proj in structured.get("projects", []):
            if proj and proj.get("title"):
                db.add(models.Project(student_id=student_id, **proj))

        resume.parsing_status = "success"
        db.commit()

        # Clear cached matches so next fetch uses the updated profile
        clear_matches_cache(student_id)

    except Exception as e:
        db.rollback()
        try:
            resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
            if resume:
                resume.parsing_status = "failed"
                db.commit()
        except Exception:
            pass
        print(f"[resume_pipeline] Error for resume {resume_id}: {e}")
    finally:
        db.close()


@router.post("/{student_id}/resume")
def upload_resume(
    student_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # --- Input validation ---
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_RESUME_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF resumes are accepted.")

    file_bytes = file.file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_UPLOAD_SIZE_MB}MB limit.")

    stored_filename = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, stored_filename)
    with open(stored_path, "wb") as f:
        f.write(file_bytes)

    resume = models.Resume(
        student_id=student_id,
        file_path=stored_path,
        original_filename=file.filename,
        parsing_status="pending",
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # ✅ Kick off heavy pipeline in the background — HTTP responds immediately
    background_tasks.add_task(_run_resume_pipeline, resume.id, student_id, stored_path)

    return {
        "resume_id": resume.id,
        "parsing_status": "pending",
        "message": "Resume uploaded successfully. Parsing is running in the background.",
    }


@router.get("/{student_id}/resume/{resume_id}/status")
def get_resume_status(student_id: int, resume_id: int, db: Session = Depends(get_db)):
    """Poll this endpoint to check if background parsing has completed."""
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.student_id == student_id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return {"resume_id": resume.id, "parsing_status": resume.parsing_status}
