import type {
  Student, StudentProfile, StudentMatchesResponse,
  SkillGapResponse, CustomizationResponse, InterviewPrepResponse,
  AssistantChatResponse, ChatTurn,
  Application, ApplicationCreate, ApplicationUpdate, DashboardSummary,
} from '../types';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

// ---------------------------------------------------------------------------
// Shared fetch helper — all calls get a timeout so a hung server never
// hangs the UI indefinitely.
// ---------------------------------------------------------------------------
async function apiFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30_000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out — server may be waking up. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function apiJson<T>(url: string, options: RequestInit = {}, timeoutMs = 30_000): Promise<T> {
  const res = await apiFetch(url, options, timeoutMs);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

export async function createStudent(name: string, email: string): Promise<Student> {
  return apiJson(`${API_BASE}/students/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
}

export async function listStudents(): Promise<Student[]> {
  return apiJson(`${API_BASE}/students/`);
}

export async function getStudentProfile(studentId: number): Promise<StudentProfile> {
  return apiJson(`${API_BASE}/students/${studentId}/profile`);
}

// ---------------------------------------------------------------------------
// Resume — 90s timeout: cold-start (~50s) + Gemini extraction (~20s) + margin
// ---------------------------------------------------------------------------

export async function uploadResume(
  studentId: number,
  file: File,
): Promise<{ resume_id: number; parsing_status: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiJson(
    `${API_BASE}/students/${studentId}/resume`,
    { method: 'POST', body: formData },
    90_000,
  );
}

// ---------------------------------------------------------------------------
// Job matching
// ---------------------------------------------------------------------------

export async function getStudentMatches(
  studentId: number,
  topK = 10,
  forceRefresh = false,
): Promise<StudentMatchesResponse> {
  const qs = forceRefresh ? `?top_k=${topK}&force_refresh=true` : `?top_k=${topK}`;
  return apiJson(`${API_BASE}/students/${studentId}/matches${qs}`, {}, 60_000);
}

export async function seedJobPostings(): Promise<{ message: string }> {
  return apiJson(`${API_BASE}/jobs/seed`, { method: 'POST' }, 30_000);
}

// ---------------------------------------------------------------------------
// M3 Agents — 30s timeout each (Gemini + cold start buffer)
// ---------------------------------------------------------------------------

export async function getSkillGap(studentId: number, jobId: number): Promise<SkillGapResponse> {
  return apiJson(`${API_BASE}/students/${studentId}/skill-gap/${jobId}`, {}, 30_000);
}

export async function getCustomization(studentId: number, jobId: number): Promise<CustomizationResponse> {
  return apiJson(
    `${API_BASE}/students/${studentId}/customize/${jobId}`,
    { method: 'POST' },
    30_000,
  );
}

export async function getInterviewPrep(studentId: number, jobId: number): Promise<InterviewPrepResponse> {
  return apiJson(`${API_BASE}/students/${studentId}/interview-prep/${jobId}`, {}, 30_000);
}

export async function sendAssistantMessage(
  studentId: number,
  message: string,
  history: ChatTurn[],
): Promise<AssistantChatResponse> {
  return apiJson(
    `${API_BASE}/students/${studentId}/assistant/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    },
    30_000,
  );
}

// ---------------------------------------------------------------------------
// M4.1 — Application Tracking
// ---------------------------------------------------------------------------

export async function createApplication(
  studentId: number,
  body: ApplicationCreate,
): Promise<Application> {
  return apiJson(`${API_BASE}/students/${studentId}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function listApplications(
  studentId: number,
  filters?: { company?: string; role?: string; status?: string; date_from?: string; date_to?: string },
): Promise<Application[]> {
  const params = new URLSearchParams();
  if (filters?.company)   params.set('company',    filters.company);
  if (filters?.role)      params.set('role',        filters.role);
  if (filters?.status)    params.set('status',      filters.status);
  if (filters?.date_from) params.set('date_from',   filters.date_from);
  if (filters?.date_to)   params.set('date_to',     filters.date_to);
  const qs = params.size ? `?${params.toString()}` : '';
  return apiJson(`${API_BASE}/students/${studentId}/applications${qs}`);
}

export async function updateApplication(
  studentId: number,
  applicationId: number,
  body: ApplicationUpdate,
): Promise<Application> {
  return apiJson(
    `${API_BASE}/students/${studentId}/applications/${applicationId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export async function deleteApplication(studentId: number, applicationId: number): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/students/${studentId}/applications/${applicationId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(`Failed to delete application: ${res.status}`);
}

export async function getApplicationDashboard(studentId: number): Promise<DashboardSummary> {
  return apiJson(`${API_BASE}/students/${studentId}/applications/dashboard`);
}
