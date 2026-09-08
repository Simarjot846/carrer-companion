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
