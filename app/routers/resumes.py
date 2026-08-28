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
def upload_resume(student_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # --- Input validation (Section 13: file upload safety) ---
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_RESUME_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF resumes are accepted.")

    file_bytes = file.file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_UPLOAD_SIZE_MB}MB limit.")

    # Use a generated filename on disk to avoid path traversal / collisions,
    # while keeping the original filename in the DB for display purposes.
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

    # --- Pipeline: text extraction -> LLM structuring -> DB save ---
    try:
        raw_text = extract_text_from_pdf(stored_path)
        resume.raw_text = raw_text

        structured = extract_structured_profile(raw_text)

        for skill in structured.get("skills", []):
            db.add(models.Skill(
                student_id=student_id,
                name=skill.get("name"),
                category=skill.get("category"),
                source="resume",
            ))

        for edu in structured.get("education", []):
            db.add(models.Education(student_id=student_id, **edu))

        for exp in structured.get("experience", []):
            db.add(models.Experience(student_id=student_id, **exp))

        for proj in structured.get("projects", []):
            db.add(models.Project(student_id=student_id, **proj))

        resume.parsing_status = "success"
        db.commit()

    except Exception as e:
        # Reliability handling (Section 12): don't crash the request or save
        # partial garbage silently. Mark the resume as failed and surface why.
        resume.parsing_status = "failed"
        db.commit()
        raise HTTPException(status_code=422, detail=f"Resume parsing failed: {str(e)}")

    return {
        "resume_id": resume.id,
        "parsing_status": resume.parsing_status,
        "message": "Resume uploaded and profile extracted successfully.",
    }
