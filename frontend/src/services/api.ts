import type { Student, StudentProfile, StudentMatchesResponse } from '../types';

const API_BASE = '/api'; // Proxied to http://localhost:8000 via Vite config

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
  topK: number = 10
): Promise<StudentMatchesResponse> {
  const res = await fetch(`${API_BASE}/students/${studentId}/matches?top_k=${topK}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Failed to fetch matches' }));
    throw new Error(errData.detail || 'Failed to calculate job matches');
  }
  return res.json();
}

export async function seedJobPostings(): Promise<void> {
  await fetch(`${API_BASE}/jobs/seed`, { method: 'POST' });
}
