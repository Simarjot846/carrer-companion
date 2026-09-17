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


# ---------------------------------------------------------------------------
# M3.1 — Skill Gap Analysis
# ---------------------------------------------------------------------------

class GapItem(BaseModel):
    skill: Optional[str] = None
    area: Optional[str] = None
    why_it_matters: str
    recommendation: str


class SkillGapResponse(BaseModel):
    student_id: int
    job_id: int
    student_name: str
    job_title: str
    company: str
    critical_missing: List[GapItem] = []
    partially_demonstrated: List[GapItem] = []
    preferred_gaps: List[GapItem] = []
    experience_gaps: List[GapItem] = []
    qualification_gaps: List[GapItem] = []
    overall_readiness_score: int
    readiness_summary: str


# ---------------------------------------------------------------------------
# M3.2 — Resume & Cover Letter Customization
# ---------------------------------------------------------------------------

class RewrittenBullet(BaseModel):
    original: str
    suggested: str
    change_note: str


class RelevantExperience(BaseModel):
    title: str
    organization: str
    why_relevant: str


class RelevantProject(BaseModel):
    title: str
    why_relevant: str


class ResumeCustomization(BaseModel):
    prioritized_skills: List[str] = []
    relevant_experiences: List[RelevantExperience] = []
    relevant_projects: List[RelevantProject] = []
    rewritten_bullets: List[RewrittenBullet] = []
    section_order_recommendation: List[str] = []
    tailoring_notes: str = ""


class CoverLetter(BaseModel):
    subject_line: str
    body: str
    hallucination_check: bool = True


class CustomizationResponse(BaseModel):
    student_id: int
    job_id: int
    student_name: str
    job_title: str
    company: str
    resume_customization: ResumeCustomization
    cover_letter: CoverLetter


# ---------------------------------------------------------------------------
# M3.3 — Interview Preparation
# ---------------------------------------------------------------------------

class InterviewQuestion(BaseModel):
    question: str
    prep_guidance: str


class InterviewPrepResponse(BaseModel):
    student_id: int
    job_id: int
    student_name: str
    job_title: str
    company: str
    technical_questions: List[InterviewQuestion] = []
    resume_questions: List[InterviewQuestion] = []
    project_questions: List[InterviewQuestion] = []
    role_questions: List[InterviewQuestion] = []
    hr_questions: List[InterviewQuestion] = []
    topics_to_revise: List[str] = []


# ---------------------------------------------------------------------------
# M3.4 — Career Assistant Chat
# ---------------------------------------------------------------------------

class ChatTurn(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class AssistantChatRequest(BaseModel):
    message: str
    history: List[ChatTurn] = []


class AssistantChatResponse(BaseModel):
    reply: str
    updated_history: List[ChatTurn] = []
