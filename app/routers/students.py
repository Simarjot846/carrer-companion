from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

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
