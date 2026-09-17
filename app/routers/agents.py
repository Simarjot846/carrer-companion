"""
M3 Agent Endpoints — all four new agents wired as FastAPI routes.
Mounted under /students to keep the existing URL prefix convention.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.skill_gap_agent import analyze_skill_gap
from app.services.customization_agent import generate_customization
from app.services.interview_prep_agent import generate_interview_prep
from app.services.career_assistant import chat

router = APIRouter(prefix="/students", tags=["agents"])


# ---------------------------------------------------------------------------
# M3.1 — Skill Gap Analysis
# ---------------------------------------------------------------------------

@router.get("/{student_id}/skill-gap/{job_id}", response_model=schemas.SkillGapResponse)
def get_skill_gap(student_id: int, job_id: int, db: Session = Depends(get_db)):
    """Analyzes gaps between a student's profile and a specific job posting."""
    _require_student(student_id, db)
    _require_job(job_id, db)
    try:
        result = analyze_skill_gap(student_id=student_id, job_id=job_id, db=db)
        return schemas.SkillGapResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill gap analysis failed: {str(e)}")


# ---------------------------------------------------------------------------
# M3.2 — Resume & Cover Letter Customization
# ---------------------------------------------------------------------------

@router.post("/{student_id}/customize/{job_id}", response_model=schemas.CustomizationResponse)
def customize_for_job(student_id: int, job_id: int, db: Session = Depends(get_db)):
    """Generates tailored resume suggestions and a cover letter for a specific job."""
    _require_student(student_id, db)
    _require_job(job_id, db)
    try:
        result = generate_customization(student_id=student_id, job_id=job_id, db=db)

        # Normalise nested objects into Pydantic-friendly shapes
        rc = result.get("resume_customization", {})
        cl = result.get("cover_letter", {})

        resume_custom = schemas.ResumeCustomization(
            prioritized_skills=rc.get("prioritized_skills", []),
            relevant_experiences=[
                schemas.RelevantExperience(**e) if isinstance(e, dict) else e
                for e in rc.get("relevant_experiences", [])
            ],
            relevant_projects=[
                schemas.RelevantProject(**p) if isinstance(p, dict) else p
                for p in rc.get("relevant_projects", [])
            ],
            rewritten_bullets=[
                schemas.RewrittenBullet(**b) if isinstance(b, dict) else b
                for b in rc.get("rewritten_bullets", [])
            ],
            section_order_recommendation=rc.get("section_order_recommendation", []),
            tailoring_notes=rc.get("tailoring_notes", ""),
        )

        cover = schemas.CoverLetter(
            subject_line=cl.get("subject_line", ""),
            body=cl.get("body", ""),
            hallucination_check=cl.get("hallucination_check", True),
        )

        return schemas.CustomizationResponse(
            student_id=result["student_id"],
            job_id=result["job_id"],
            student_name=result["student_name"],
            job_title=result["job_title"],
            company=result["company"],
            resume_customization=resume_custom,
            cover_letter=cover,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Customization generation failed: {str(e)}")


# ---------------------------------------------------------------------------
# M3.3 — Interview Preparation
# ---------------------------------------------------------------------------

@router.get("/{student_id}/interview-prep/{job_id}", response_model=schemas.InterviewPrepResponse)
def get_interview_prep(student_id: int, job_id: int, db: Session = Depends(get_db)):
    """
    Generates a static interview prep package.
    Optionally retrieves skill gaps first and passes them to the prep agent.
    """
    _require_student(student_id, db)
    _require_job(job_id, db)
    try:
        # Re-use skill gap output to enrich prep questions with gap-aware topics
        try:
            gaps = analyze_skill_gap(student_id=student_id, job_id=job_id, db=db)
        except Exception:
            gaps = None

        result = generate_interview_prep(
            student_id=student_id, job_id=job_id, db=db, skill_gaps=gaps
        )

        def _to_q(item: dict) -> schemas.InterviewQuestion:
            return schemas.InterviewQuestion(
                question=item.get("question", ""),
                prep_guidance=item.get("prep_guidance", ""),
            )

        return schemas.InterviewPrepResponse(
            student_id=result["student_id"],
            job_id=result["job_id"],
            student_name=result["student_name"],
            job_title=result["job_title"],
            company=result["company"],
            technical_questions=[_to_q(q) for q in result.get("technical_questions", [])],
            resume_questions=[_to_q(q) for q in result.get("resume_questions", [])],
            project_questions=[_to_q(q) for q in result.get("project_questions", [])],
            role_questions=[_to_q(q) for q in result.get("role_questions", [])],
            hr_questions=[_to_q(q) for q in result.get("hr_questions", [])],
            topics_to_revise=result.get("topics_to_revise", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview prep generation failed: {str(e)}")


# ---------------------------------------------------------------------------
# M3.4 — Conversational Career Assistant
# ---------------------------------------------------------------------------

@router.post("/{student_id}/assistant/chat", response_model=schemas.AssistantChatResponse)
def assistant_chat(
    student_id: int,
    body: schemas.AssistantChatRequest,
    db: Session = Depends(get_db),
):
    """Single-session chat endpoint. History is sent by the client each turn."""
    _require_student(student_id, db)
    try:
        history_dicts = [{"role": t.role, "content": t.content} for t in body.history]
        result = chat(
            student_id=student_id,
            message=body.message,
            history=history_dicts,
            db=db,
        )
        updated = [
            schemas.ChatTurn(role=t["role"], content=t["content"])
            for t in result["updated_history"]
        ]
        return schemas.AssistantChatResponse(
            reply=result["reply"],
            updated_history=updated,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant chat failed: {str(e)}")


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _require_student(student_id: int, db: Session):
    if not db.query(models.Student).filter(models.Student.id == student_id).first():
        raise HTTPException(status_code=404, detail="Student not found.")


def _require_job(job_id: int, db: Session):
    if not db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first():
        raise HTTPException(status_code=404, detail="Job posting not found.")
