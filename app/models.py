from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    qualifications = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    resumes = relationship("Resume", back_populates="student", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="student", cascade="all, delete-orphan")
    education = relationship("Education", back_populates="student", cascade="all, delete-orphan")
    experience = relationship("Experience", back_populates="student", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    raw_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    parsing_status = Column(String, default="pending")

    student = relationship("Student", back_populates="resumes")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    source = Column(String, default="resume")

    student = relationship("Student", back_populates="skills")


class Education(Base):
    __tablename__ = "education"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    institution = Column(String, nullable=False)
    degree = Column(String, nullable=True)
    field_of_study = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    grade = Column(String, nullable=True)

    student = relationship("Student", back_populates="education")


class Experience(Base):
    __tablename__ = "experience"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    title = Column(String, nullable=False)
    organization = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    student = relationship("Student", back_populates="experience")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    technologies = Column(String, nullable=True)
    link = Column(String, nullable=True)

    student = relationship("Student", back_populates="projects")


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    responsibilities = Column(Text, nullable=True)
    required_skills = Column(JSON, nullable=False)
    preferred_skills = Column(JSON, nullable=True)
    qualifications = Column(Text, nullable=True)
    experience_level = Column(String, nullable=False, index=True)
    experience_requirements = Column(Text, nullable=True)
    education_requirements = Column(Text, nullable=True)
    location = Column(String, nullable=False)
    posting_type = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    embedding = Column(JSON, nullable=True)


# ---------------------------------------------------------------------------
# M4.1 — Application Tracking
# ---------------------------------------------------------------------------

APPLICATION_STATUSES = [
    "Saved",
    "Planning to Apply",
    "Applied",
    "Under Review",
    "Shortlisted",
    "Interview Scheduled",
    "Interview Completed",
    "Offer Received",
    "Rejected",
    "Withdrawn",
]

INTERVIEW_STATUSES = [
    "Not Scheduled",
    "Scheduled",
    "Completed",
    "Cancelled",
    "Rescheduled",
]


class Application(Base):
    """
    Tracks a student's job application lifecycle from initial interest
    through to offer/rejection. Optionally references a matched JobPosting
    and any AI-generated customization artifacts (stored as text references,
    not duplicated content).
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)

    # ── Job info ────────────────────────────────────────────────────────
    company_name = Column(String, nullable=False, index=True)
    job_title = Column(String, nullable=False)
    job_description = Column(Text, nullable=True)

    # Optional link back to a matched JobPosting (may be null for
    # applications added manually outside the matching flow)
    job_posting_id = Column(Integer, ForeignKey("job_postings.id"), nullable=True)

    # ── Dates ────────────────────────────────────────────────────────────
    application_date = Column(Date, nullable=True)    # when the student applied
    deadline = Column(Date, nullable=True)             # application deadline

    # ── Status ───────────────────────────────────────────────────────────
    # One of APPLICATION_STATUSES above
    status = Column(String, nullable=False, default="Saved", index=True)

    # ── Interview ────────────────────────────────────────────────────────
    interview_date = Column(DateTime, nullable=True)
    interview_status = Column(String, nullable=True, default="Not Scheduled")

    # ── Notes & links ────────────────────────────────────────────────────
    notes = Column(Text, nullable=True)
    job_url = Column(String, nullable=True)            # external posting URL

    # References to AI-generated artefacts (stored as plain text labels,
    # not duplicating the full content — the content lives in the agent
    # response which is displayed in the UI per-session)
    resume_version_note = Column(Text, nullable=True)      # e.g. "Tailored for FastAPI role v2"
    cover_letter_version_note = Column(Text, nullable=True)

    # ── Timestamps ───────────────────────────────────────────────────────
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ─────────────────────────────────────────────────────
    student = relationship("Student", back_populates="applications")
    job_posting = relationship("JobPosting")
