from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.services.matching_agent import get_job_matches_for_student

router = APIRouter(prefix="/students", tags=["students"])


@router.post("/", response_model=schemas.StudentOut)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Student).filter(models.Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A student with this email already exists.")

    new_student = models.Student(name=student.name, email=student.email)
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student


@router.get("/", response_model=List[schemas.StudentOut])
def list_students(db: Session = Depends(get_db)):
    return db.query(models.Student).order_by(models.Student.id.desc()).all()


@router.get("/{student_id}/profile", response_model=schemas.StudentProfileOut)
def get_student_profile(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    return schemas.StudentProfileOut(
        student=student,
        skills=student.skills,
        education=student.education,
        experience=student.experience,
        projects=student.projects,
        resumes=student.resumes,
    )


@router.get("/{student_id}/matches", response_model=schemas.StudentMatchesResponse)
def get_student_matches(student_id: int, top_k: int = 10, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    matches_data = get_job_matches_for_student(student_id=student_id, db=db, top_k=top_k)
    return schemas.StudentMatchesResponse(
        student_id=student.id,
        student_name=student.name,
        total_matches=len(matches_data),
        matches=matches_data,
    )

