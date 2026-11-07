"""
M4.1 — Application Tracking Router
Provides full CRUD for a student's job application pipeline,
plus a dashboard endpoint with upcoming deadlines / interview alerts.

Route ordering note:
  /dashboard MUST be declared before /{application_id} routes so FastAPI
  does not try to cast the literal string "dashboard" as an integer.
"""
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/students", tags=["applications"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_student_or_404(student_id: int, db: Session) -> models.Student:
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student


def _get_application_or_404(
    student_id: int, application_id: int, db: Session
) -> models.Application:
    app = (
        db.query(models.Application)
        .filter(
            models.Application.id == application_id,
            models.Application.student_id == student_id,
        )
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    return app


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return date.fromisoformat(value.split("T")[0])
    except (ValueError, AttributeError):
        return None


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _application_to_out(app: models.Application) -> schemas.ApplicationOut:
    return schemas.ApplicationOut(
        id=app.id,
        student_id=app.student_id,
        company_name=app.company_name,
        job_title=app.job_title,
        job_description=app.job_description,
        job_posting_id=app.job_posting_id,
        application_date=app.application_date.isoformat() if app.application_date else None,
        deadline=app.deadline.isoformat() if app.deadline else None,
        status=app.status,
        interview_date=app.interview_date.isoformat() if app.interview_date else None,
        interview_status=app.interview_status,
        notes=app.notes,
        job_url=app.job_url,
        resume_version_note=app.resume_version_note,
        cover_letter_version_note=app.cover_letter_version_note,
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


def _check_upcoming(
    apps: List[models.Application], horizon_days: int = 7
) -> List[schemas.UpcomingItem]:
    today = date.today()
    cutoff = today + timedelta(days=horizon_days)
    upcoming: List[schemas.UpcomingItem] = []

    for app in apps:
        if app.deadline and today <= app.deadline <= cutoff:
            upcoming.append(schemas.UpcomingItem(
                application_id=app.id,
                company_name=app.company_name,
                job_title=app.job_title,
                type="deadline",
                date=app.deadline.isoformat(),
                days_away=(app.deadline - today).days,
            ))
        if app.interview_date:
            iv_date = app.interview_date.date()
            if today <= iv_date <= cutoff:
                upcoming.append(schemas.UpcomingItem(
                    application_id=app.id,
                    company_name=app.company_name,
                    job_title=app.job_title,
                    type="interview",
                    date=app.interview_date.isoformat(),
                    days_away=(iv_date - today).days,
                ))

    upcoming.sort(key=lambda x: x.days_away)
    return upcoming


# ---------------------------------------------------------------------------
# Endpoints — order matters: /dashboard BEFORE /{application_id}
# ---------------------------------------------------------------------------

@router.post(
    "/{student_id}/applications",
    response_model=schemas.ApplicationOut,
    status_code=201,
)
def create_application(
    student_id: int,
    body: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
):
    _get_student_or_404(student_id, db)

    if body.status not in models.APPLICATION_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status. Must be one of: {models.APPLICATION_STATUSES}",
        )
    if body.job_posting_id is not None:
        if not db.query(models.JobPosting).filter(models.JobPosting.id == body.job_posting_id).first():
            raise HTTPException(status_code=404, detail=f"JobPosting {body.job_posting_id} not found.")

    app = models.Application(
        student_id=student_id,
        company_name=body.company_name,
        job_title=body.job_title,
        job_description=body.job_description,
        job_posting_id=body.job_posting_id,
        application_date=_parse_date(body.application_date),
        deadline=_parse_date(body.deadline),
        status=body.status,
        interview_date=_parse_datetime(body.interview_date),
        interview_status=body.interview_status or "Not Scheduled",
        notes=body.notes,
        job_url=body.job_url,
        resume_version_note=body.resume_version_note,
        cover_letter_version_note=body.cover_letter_version_note,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _application_to_out(app)


@router.get("/{student_id}/applications", response_model=List[schemas.ApplicationOut])
def list_applications(
    student_id: int,
    company: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    _get_student_or_404(student_id, db)
    q = db.query(models.Application).filter(models.Application.student_id == student_id)
    if company:
        q = q.filter(models.Application.company_name.ilike(f"%{company}%"))
    if role:
        q = q.filter(models.Application.job_title.ilike(f"%{role}%"))
    if status:
        q = q.filter(models.Application.status == status)
    if date_from and (df := _parse_date(date_from)):
        q = q.filter(models.Application.application_date >= df)
    if date_to and (dt := _parse_date(date_to)):
        q = q.filter(models.Application.application_date <= dt)
    return [_application_to_out(a) for a in q.order_by(models.Application.created_at.desc()).all()]


# *** /dashboard MUST come before /{application_id} ***
@router.get("/{student_id}/applications/dashboard", response_model=schemas.DashboardSummary)
def get_applications_dashboard(
    student_id: int,
    db: Session = Depends(get_db),
):
    _get_student_or_404(student_id, db)
    all_apps = (
        db.query(models.Application)
        .filter(models.Application.student_id == student_id)
        .all()
    )
    inactive = {"Rejected", "Withdrawn"}
    return schemas.DashboardSummary(
        total_applications=len(all_apps),
        active_applications=sum(1 for a in all_apps if a.status not in inactive),
        applied_count=sum(1 for a in all_apps if a.status == "Applied"),
        interview_scheduled=sum(1 for a in all_apps if a.status == "Interview Scheduled"),
        offers_received=sum(1 for a in all_apps if a.status == "Offer Received"),
        rejected_count=sum(1 for a in all_apps if a.status == "Rejected"),
        upcoming=_check_upcoming(all_apps),
    )


@router.patch(
    "/{student_id}/applications/{application_id}",
    response_model=schemas.ApplicationOut,
)
def update_application(
    student_id: int,
    application_id: int,
    body: schemas.ApplicationUpdate,
    db: Session = Depends(get_db),
):
    _get_student_or_404(student_id, db)
    app = _get_application_or_404(student_id, application_id, db)

    if body.status is not None and body.status not in models.APPLICATION_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status. Must be one of: {models.APPLICATION_STATUSES}",
        )

    for field, value in body.model_dump(exclude_unset=True).items():
        if field in ("application_date", "deadline"):
            setattr(app, field, _parse_date(value))
        elif field == "interview_date":
            setattr(app, field, _parse_datetime(value))
        else:
            setattr(app, field, value)

    app.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app)
    return _application_to_out(app)


@router.delete("/{student_id}/applications/{application_id}", status_code=204)
def delete_application(
    student_id: int,
    application_id: int,
    db: Session = Depends(get_db),
):
    _get_student_or_404(student_id, db)
    app = _get_application_or_404(student_id, application_id, db)
    db.delete(app)
    db.commit()
