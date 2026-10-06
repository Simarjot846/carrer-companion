import type { Student, StudentProfile, StudentMatchesResponse, SkillGapResponse, CustomizationResponse, InterviewPrepResponse, AssistantChatResponse, ChatTurn } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export async function createStudent(name: string, email: string): Promise<Student> {
  const res = await fetch(`${API_BASE}/students/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Failed to create profile' }));
    throw new Error(errData.detail || 'Failed to create student profile');
  }
  return res.json();
}

export async function listStudents(): Promise<Student[]> {
  const res = await fetch(`${API_BASE}/students/`);
  if (!res.ok) throw new Error('Failed to fetch students list');
  return res.json();
}

export async function getStudentProfile(studentId: number): Promise<StudentProfile> {
  const res = await fetch(`${API_BASE}/students/${studentId}/profile`);
  if (!res.ok) throw new Error('Failed to fetch student profile');
  return res.json();
}

export async function uploadResume(
  studentId: number,
  file: File
): Promise<{ resume_id: number; parsing_status: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/students/${studentId}/resume`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Resume upload or parsing failed' }));
    throw new Error(errData.detail || 'Failed to upload resume');
  }
  return res.json();
}

export async function getStudentMatches(
  studentId: number,
  topK: number = 10,
  forceRefresh: boolean = false
): Promise<StudentMatchesResponse> {
  const url = `${API_BASE}/students/${studentId}/matches?top_k=${topK}${forceRefresh ? '&force_refresh=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Failed to fetch matches' }));
    throw new Error(errData.detail || 'Failed to calculate job matches');
  }
  return res.json();
}


export async function seedJobPostings(): Promise<void> {
  await fetch(`${API_BASE}/jobs/seed`, { method: 'POST' });
}

// ---------------------------------------------------------------------------
// M3 Agent API calls
// ---------------------------------------------------------------------------

export async function getSkillGap(studentId: number, jobId: number): Promise<SkillGapResponse> {
  const res = await fetch(`${API_BASE}/students/${studentId}/skill-gap/${jobId}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Skill gap analysis failed' }));
    throw new Error(errData.detail || 'Skill gap analysis failed');
  }
  return res.json();
}

export async function getCustomization(studentId: number, jobId: number): Promise<CustomizationResponse> {
  const res = await fetch(`${API_BASE}/students/${studentId}/customize/${jobId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Customization generation failed' }));
    throw new Error(errData.detail || 'Customization generation failed');
  }
  return res.json();
}

export async function getInterviewPrep(studentId: number, jobId: number): Promise<InterviewPrepResponse> {
  const res = await fetch(`${API_BASE}/students/${studentId}/interview-prep/${jobId}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Interview prep generation failed' }));
    throw new Error(errData.detail || 'Interview prep generation failed');
  }
  return res.json();
}

export async function sendAssistantMessage(
  studentId: number,
  message: string,
  history: ChatTurn[]
): Promise<AssistantChatResponse> {
  const res = await fetch(`${API_BASE}/students/${studentId}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Assistant chat failed' }));
    throw new Error(errData.detail || 'Assistant chat failed');
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// M4.1 — Application Tracking API calls
// ---------------------------------------------------------------------------
import type {
  Application, ApplicationCreate, ApplicationUpdate, DashboardSummary,
} from '../types';

export async function createApplication(
  studentId: number,
  body: ApplicationCreate,
): Promise<Application> {
  const res = await fetch(`${API_BASE}/students/${studentId}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create application' }));
    throw new Error(err.detail || 'Failed to create application');
  }
  return res.json();
}

export async function listApplications(
  studentId: number,
  filters?: { company?: string; role?: string; status?: string; date_from?: string; date_to?: string },
): Promise<Application[]> {
  const params = new URLSearchParams();
  if (filters?.company) params.set('company', filters.company);
  if (filters?.role) params.set('role', filters.role);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.date_from) params.set('date_from', filters.date_from);
  if (filters?.date_to) params.set('date_to', filters.date_to);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/students/${studentId}/applications${qs}`);
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.json();
}

export async function updateApplication(
  studentId: number,
  applicationId: number,
  body: ApplicationUpdate,
): Promise<Application> {
  const res = await fetch(`${API_BASE}/students/${studentId}/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update application' }));
    throw new Error(err.detail || 'Failed to update application');
  }
  return res.json();
}

export async function deleteApplication(
  studentId: number,
  applicationId: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/students/${studentId}/applications/${applicationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete application');
}

export async function getApplicationDashboard(studentId: number): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/students/${studentId}/applications/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch application dashboard');
  return res.json();
}
