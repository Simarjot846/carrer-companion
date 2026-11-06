"""
Resume upload and parsing router.

Design decision — SYNCHRONOUS pipeline
========================================
The PDF extraction + LLM structuring runs synchronously inside the HTTP
request handler. This is intentional for the Render free-tier deployment:
  - Render kills background threads after the HTTP response is sent.
  - FastAPI BackgroundTasks run in the same process; on Render they are
    terminated before the Gemini call completes.
  - Running synchronously means the client gets a definitive success/failed
    status in a single response — no polling needed.
  - With gemini-2.0-flash the pipeline completes in ~5-15s, well within
    Render's 30s request timeout for web services.

The frontend shows a progress spinner while waiting and handles the response
in one shot — no polling endpoint required.
"""
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE_MB, ALLOWED_RESUME_EXTENSIONS
from app.services.resume_parser import extract_text_from_pdf
from app.services.llm_extractor import extract_structured_profile

router = APIRouter(prefix="/students", tags=["resumes"])


@router.post("/{student_id}/resume")
def upload_resume(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF resume and run the full extraction pipeline synchronously.
    Returns parsing_status = "success" | "failed" in the response body.
    The client does NOT need to poll — it gets the final status immediately.
    """
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # ── Validate ──────────────────────────────────────────────────────────
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_RESUME_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF resumes are accepted.")

    file_bytes = file.file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds {MAX_UPLOAD_SIZE_MB} MB limit.",
        )

    # ── Save to disk ───────────────────────────────────────────────────────
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, stored_filename)
    with open(stored_path, "wb") as f:
        f.write(file_bytes)

    # ── Create Resume DB record ────────────────────────────────────────────
    resume = models.Resume(
        student_id=student_id,
        file_path=stored_path,
        original_filename=file.filename,
        parsing_status="pending",
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # ── Run pipeline synchronously ─────────────────────────────────────────
    try:
        raw_text = extract_text_from_pdf(stored_path)
        resume.raw_text = raw_text
        db.flush()

        structured = extract_structured_profile(raw_text)

        # Clear old extracted data to prevent duplicates on re-upload
        db.query(models.Skill).filter(
            models.Skill.student_id == student_id,
            models.Skill.source == "resume",
        ).delete(synchronize_session=False)
        db.query(models.Education).filter(models.Education.student_id == student_id).delete(synchronize_session=False)
        db.query(models.Experience).filter(models.Experience.student_id == student_id).delete(synchronize_session=False)
        db.query(models.Project).filter(models.Project.student_id == student_id).delete(synchronize_session=False)
        db.flush()

        # Insert fresh extracted data
        seen_skills: set = set()
        for skill in structured.get("skills", []):
            name = (skill.get("name") or "").strip()
            if not name:
                continue
            key = name.lower()
            if key in seen_skills:
                continue
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

        # Invalidate all caches for this student
        _clear_student_caches(student_id)

        return {
            "resume_id": resume.id,
            "parsing_status": "success",
            "message": "Resume uploaded and profile extracted successfully.",
        }

    except Exception as e:
        db.rollback()
        try:
            resume.parsing_status = "failed"
            db.add(resume)
            db.commit()
        except Exception:
            pass
        print(f"[resume_pipeline] Error for student {student_id}: {e}")
        raise HTTPException(
            status_code=422,
            detail=f"Resume parsing failed: {str(e)}",
        )


def _clear_student_caches(student_id: int) -> None:
    """Clears all in-memory caches that depend on a student's profile."""
    try:
        from app.services.matching_agent import clear_matches_cache
        clear_matches_cache(student_id)
    except Exception:
        pass
    try:
        from app.services.skill_gap_agent import clear_skill_gap_cache
        clear_skill_gap_cache(student_id)
    except Exception:
        pass
    try:
        from app.services.customization_agent import clear_customization_cache
        clear_customization_cache(student_id)
    except Exception:
        pass
    try:
        from app.services.interview_prep_agent import clear_interview_prep_cache
        clear_interview_prep_cache(student_id)
    except Exception:
        pass
