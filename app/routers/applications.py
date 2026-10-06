"""
M4.1 — Application Tracking Router
Provides full CRUD for a student's job application pipeline,
plus a dashboard endpoint with upcoming deadlines / interview alerts.
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


def _get_application_or_404(student_id: int, application_id: int, db: Session) -> models.Application:
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
    """Parses 'YYYY-MM-DD' into a date object; returns None on failure."""
    if not value:
        return None
    try:
        return date.fromisoformat(value.split("T")[0])
    except (ValueError, AttributeError):
        return None


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    """Parses ISO datetime string; returns None on failure."""
    if not value:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _application_to_out(app: models.Application) -> schemas.ApplicationOut:
    """Converts an Application ORM object to a serialisable schema."""
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


def _check_upcoming(apps: List[models.Application], horizon_days: int = 7) -> List[schemas.UpcomingItem]:
    """Returns deadlines and interviews falling within the next `horizon_days` days."""
    today = date.today()
    cutoff = today + timedelta(days=horizon_days)
    upcoming: List[schemas.UpcomingItem] = []

    for app in apps:
        # Deadline alert
        if app.deadline and today <= app.deadline <= cutoff:
            days_away = (app.deadline - today).days
            upcoming.append(schemas.UpcomingItem(
                application_id=app.id,
                company_name=app.company_name,
                job_title=app.job_title,
                type="deadline",
                date=app.deadline.isoformat(),
                days_away=days_away,
            ))

        # Interview alert
        if app.interview_date:
            interview_date_only = app.interview_date.date()
            if today <= interview_date_only <= cutoff:
                days_away = (interview_date_only - today).days
                upcoming.append(schemas.UpcomingItem(
                    application_id=app.id,
                    company_name=app.company_name,
                    job_title=app.job_title,
                    type="interview",
                    date=app.interview_date.isoformat(),
                    days_away=days_away,
                ))

    # Sort by proximity
    upcoming.sort(key=lambda x: x.days_away)
    return upcoming


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/{student_id}/applications", response_model=schemas.ApplicationOut, status_code=201)
def create_application(
    student_id: int,
    body: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
):
    """Creates a new application entry for a student."""
    _get_student_or_404(student_id, db)

    # Validate status value
    if body.status not in models.APPLICATION_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status '{body.status}'. Must be one of: {models.APPLICATION_STATUSES}",
        )

    # Validate job_posting_id reference if provided
    if body.job_posting_id is not None:
        posting = db.query(models.JobPosting).filter(models.JobPosting.id == body.job_posting_id).first()
        if not posting:
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
    company: Optional[str] = Query(None, description="Filter by company name (case-insensitive substring)"),
    role: Optional[str] = Query(None, description="Filter by job title (case-insensitive substring)"),
    status: Optional[str] = Query(None, description="Filter by exact status"),
    date_from: Optional[str] = Query(None, description="Filter applications on/after this date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter applications on/before this date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """Lists all applications for a student with optional filters."""
    _get_student_or_404(student_id, db)

    query = db.query(models.Application).filter(models.Application.student_id == student_id)

    if company:
        query = query.filter(models.Application.company_name.ilike(f"%{company}%"))
    if role:
        query = query.filter(models.Application.job_title.ilike(f"%{role}%"))
    if status:
        query = query.filter(models.Application.status == status)
    if date_from:
        df = _parse_date(date_from)
        if df:
            query = query.filter(models.Application.application_date >= df)
    if date_to:
        dt = _parse_date(date_to)
        if dt:
            query = query.filter(models.Application.application_date <= dt)

    apps = query.order_by(models.Application.created_at.desc()).all()
    return [_application_to_out(a) for a in apps]


@router.patch("/{student_id}/applications/{application_id}", response_model=schemas.ApplicationOut)
def update_application(
    student_id: int,
    application_id: int,
    body: schemas.ApplicationUpdate,
    db: Session = Depends(get_db),
):
    """Updates one or more fields of an application entry."""
    _get_student_or_404(student_id, db)
    app = _get_application_or_404(student_id, application_id, db)

    if body.status is not None and body.status not in models.APPLICATION_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status '{body.status}'. Must be one of: {models.APPLICATION_STATUSES}",
        )

    update_fields = body.model_dump(exclude_unset=True)

    for field, value in update_fields.items():
        if field == "application_date":
            setattr(app, field, _parse_date(value))
        elif field == "deadline":
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
    """Deletes an application entry."""
    _get_student_or_404(student_id, db)
    app = _get_application_or_404(student_id, application_id, db)
    db.delete(app)
    db.commit()


@router.get("/{student_id}/applications/dashboard", response_model=schemas.DashboardSummary)
def get_applications_dashboard(
    student_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns summary counts and upcoming deadlines/interviews (next 7 days).
    The 'upcoming' list should be prominently surfaced in the UI.
    """
    _get_student_or_404(student_id, db)

    all_apps = (
        db.query(models.Application)
        .filter(models.Application.student_id == student_id)
        .all()
    )

    inactive_statuses = {"Rejected", "Withdrawn"}
    active = [a for a in all_apps if a.status not in inactive_statuses]
    applied = [a for a in all_apps if a.status == "Applied"]
    interviews = [a for a in all_apps if a.status == "Interview Scheduled"]
    offers = [a for a in all_apps if a.status == "Offer Received"]
    rejected = [a for a in all_apps if a.status == "Rejected"]

    upcoming = _check_upcoming(all_apps, horizon_days=7)

    return schemas.DashboardSummary(
        total_applications=len(all_apps),
        active_applications=len(active),
        applied_count=len(applied),
        interview_scheduled=len(interviews),
        offers_received=len(offers),
        rejected_count=len(rejected),
        upcoming=upcoming,
    )
