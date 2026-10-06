export interface Student {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category?: string;
  source: string;
}

export interface Education {
  id: number;
  institution: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
}

export interface Experience {
  id: number;
  title: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  technologies?: string;
  link?: string;
}

export interface Resume {
  id: number;
  original_filename: string;
  parsing_status: 'pending' | 'success' | 'failed';
  uploaded_at: string;
}

export interface StudentProfile {
  student: Student;
  skills: Skill[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  resumes: Resume[];
}

export interface JobMatch {
  job_id: number;
  title: string;
  company: string;
  description: string;
  required_skills: string[];
  experience_level: string;
  location: string;
  posting_type: string;
  match_score: number;
  vector_similarity: number;
  reasoning: string;
  missing_skills: string[];
}

export interface StudentMatchesResponse {
  student_id: number;
  student_name: string;
  total_matches: number;
  matches: JobMatch[];
}

// ---------------------------------------------------------------------------
// M3.1 — Skill Gap
// ---------------------------------------------------------------------------
export interface GapItem {
  skill?: string;
  area?: string;
  why_it_matters: string;
  recommendation: string;
}

export interface SkillGapResponse {
  student_id: number;
  job_id: number;
  student_name: string;
  job_title: string;
  company: string;
  critical_missing: GapItem[];
  partially_demonstrated: GapItem[];
  preferred_gaps: GapItem[];
  experience_gaps: GapItem[];
  qualification_gaps: GapItem[];
  overall_readiness_score: number;
  readiness_summary: string;
}

// ---------------------------------------------------------------------------
// M3.2 — Customization
// ---------------------------------------------------------------------------
export interface RewrittenBullet {
  original: string;
  suggested: string;
  change_note: string;
}

export interface ResumeCustomization {
  prioritized_skills: string[];
  relevant_experiences: { title: string; organization: string; why_relevant: string }[];
  relevant_projects: { title: string; why_relevant: string }[];
  rewritten_bullets: RewrittenBullet[];
  section_order_recommendation: string[];
  tailoring_notes: string;
}

export interface CoverLetter {
  subject_line: string;
  body: string;
  hallucination_check: boolean;
}

export interface CustomizationResponse {
  student_id: number;
  job_id: number;
  student_name: string;
  job_title: string;
  company: string;
  resume_customization: ResumeCustomization;
  cover_letter: CoverLetter;
}

// ---------------------------------------------------------------------------
// M3.3 — Interview Prep
// ---------------------------------------------------------------------------
export interface InterviewQuestion {
  question: string;
  prep_guidance: string;
}

export interface InterviewPrepResponse {
  student_id: number;
  job_id: number;
  student_name: string;
  job_title: string;
  company: string;
  technical_questions: InterviewQuestion[];
  resume_questions: InterviewQuestion[];
  project_questions: InterviewQuestion[];
  role_questions: InterviewQuestion[];
  hr_questions: InterviewQuestion[];
  topics_to_revise: string[];
}

// ---------------------------------------------------------------------------
// M3.4 — Career Assistant
// ---------------------------------------------------------------------------
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatResponse {
  reply: string;
  updated_history: ChatTurn[];
}

// ---------------------------------------------------------------------------
// M4.1 — Application Tracking
// ---------------------------------------------------------------------------

export const APPLICATION_STATUSES = [
  'Saved',
  'Planning to Apply',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Received',
  'Rejected',
  'Withdrawn',
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export interface Application {
  id: number;
  student_id: number;
  company_name: string;
  job_title: string;
  job_description?: string;
  job_posting_id?: number;
  application_date?: string;   // "YYYY-MM-DD"
  deadline?: string;           // "YYYY-MM-DD"
  status: ApplicationStatus;
  interview_date?: string;     // ISO datetime
  interview_status?: string;
  notes?: string;
  job_url?: string;
  resume_version_note?: string;
  cover_letter_version_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreate {
  company_name: string;
  job_title: string;
  job_description?: string;
  job_posting_id?: number;
  application_date?: string;
  deadline?: string;
  status: ApplicationStatus;
  interview_date?: string;
  interview_status?: string;
  notes?: string;
  job_url?: string;
  resume_version_note?: string;
  cover_letter_version_note?: string;
}

export interface ApplicationUpdate extends Partial<ApplicationCreate> {}

export interface UpcomingItem {
  application_id: number;
  company_name: string;
  job_title: string;
  type: 'deadline' | 'interview';
  date: string;
  days_away: number;
}

export interface DashboardSummary {
  total_applications: number;
  active_applications: number;
  applied_count: number;
  interview_scheduled: number;
  offers_received: number;
  rejected_count: number;
  upcoming: UpcomingItem[];
}
