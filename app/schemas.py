from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class StudentCreate(BaseModel):
    name: str
    email: EmailStr


class StudentOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class SkillOut(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    source: str

    class Config:
        from_attributes = True


class EducationOut(BaseModel):
    id: int
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    grade: Optional[str] = None

    class Config:
        from_attributes = True


class ExperienceOut(BaseModel):
    id: int
    title: str
    organization: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    technologies: Optional[str] = None
    link: Optional[str] = None

    class Config:
        from_attributes = True


class ResumeOut(BaseModel):
    id: int
    original_filename: str
    parsing_status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class StudentProfileOut(BaseModel):
    """Full profile view: student + everything extracted from their resume(s)."""
    student: StudentOut
    skills: List[SkillOut]
    education: List[EducationOut]
    experience: List[ExperienceOut]
    projects: List[ProjectOut]
    resumes: List[ResumeOut]


class JobPostingOut(BaseModel):
    id: int
    title: str
    company: str
    description: str
    responsibilities: Optional[str] = None
    required_skills: List[str]
    preferred_skills: Optional[List[str]] = []
    qualifications: Optional[str] = None
    experience_level: str
    experience_requirements: Optional[str] = None
    education_requirements: Optional[str] = None
    location: str
    posting_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class JobMatchOut(BaseModel):
    job_id: int
    title: str
    company: str
    description: str
    responsibilities: Optional[str] = None
    required_skills: List[str]
    preferred_skills: Optional[List[str]] = []
    qualifications: Optional[str] = None
    experience_level: str
    experience_requirements: Optional[str] = None
    education_requirements: Optional[str] = None
    location: str
    posting_type: str
    match_score: int
    vector_similarity: float
    reasoning: str
    missing_skills: List[str]


class StudentMatchesResponse(BaseModel):
    student_id: int
    student_name: str
    total_matches: int
    matches: List[JobMatchOut]

