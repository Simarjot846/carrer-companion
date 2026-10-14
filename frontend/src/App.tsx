import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import type { AppStep } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ProfileCreationStep } from './components/ProfileCreationStep';
import { ResumeUploadStep } from './components/ResumeUploadStep';
import { JobMatchesStep } from './components/JobMatchesStep';
import { SkillGapView } from './components/SkillGapView';
import { CustomizationView } from './components/CustomizationView';
import { InterviewPrepView } from './components/InterviewPrepView';
import { AssistantChat } from './components/AssistantChat';
import { ApplicationTracker } from './components/ApplicationTracker';
import type { Student, StudentProfile, JobMatch } from './types';
import { listStudents, getStudentProfile } from './services/api';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

/** Ping the backend health endpoint — returns true if alive */
async function pingBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(30_000) });
    return res.ok;
  } catch {
    return false;
  }
}

export function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('landing');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  // Backend wake-up state (Render free tier goes to sleep after 15 min)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'waking' | 'ready' | 'error'>('checking');
  const [wakingSeconds, setWakingSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initBackend();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const initBackend = async () => {
    setBackendStatus('checking');

    // Give 2 seconds before showing "waking up" banner
    const slowTimer = setTimeout(() => {
      setBackendStatus('waking');
      setWakingSeconds(0);
      timerRef.current = setInterval(() => setWakingSeconds(s => s + 1), 1000);
    }, 2000);

    const alive = await pingBackend();
    clearTimeout(slowTimer);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    if (!alive) {
      setBackendStatus('error');
      return;
    }

    setBackendStatus('ready');
    await loadExistingStudents();
  };

  const loadExistingStudents = async () => {
    try {
      const students = await listStudents();
      // Only show real students from the database — no fake demo fallback
      setExistingStudents(students);
    } catch (err) {
      console.error('Failed to load existing students:', err);
      // Show empty list; user will see an error state in ProfileCreationStep
      setExistingStudents([]);
    }
  };

  const handleSelectStudent = async (student: Student) => {
    setActiveStudent(student);
    try {
      const p = await getStudentProfile(student.id);
      setProfile(p);
      const hasContent = (p.resumes?.length > 0) || (p.skills?.length > 0);
      setCurrentStep(hasContent ? 'matches' : 'upload');
    } catch {
      setCurrentStep('upload');
    }
  };

  const handleProfileCreated = async (student: Student) => {
    setActiveStudent(student);
    loadExistingStudents();
    try {
      const p = await getStudentProfile(student.id);
      setProfile(p);
    } catch {
      setProfile(null);
    }
    setCurrentStep('upload');
  };

  const handleProfileUpdated = (updatedProfile: StudentProfile) => {
    setProfile(updatedProfile);
  };

  const handleReset = () => {
    setActiveStudent(null);
    setProfile(null);
    setSelectedJob(null);
    setCurrentStep('landing');
    loadExistingStudents();
  };

  const handleOpenAgent = (job: JobMatch, agent: 'skill-gap' | 'customize' | 'interview-prep') => {
    setSelectedJob(job);
    setCurrentStep(agent);
  };

  const backToMatches = () => setCurrentStep('matches');

  const handleSelectStep = (step: AppStep) => {
    // Guard agent views that need a selected job
    if (['skill-gap', 'customize', 'interview-prep'].includes(step) && !selectedJob) return;
    setCurrentStep(step);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)', color: 'var(--color-ink)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }}>

      {/* ── Backend wake-up banner (Render free tier) ─────────────── */}
      {backendStatus === 'waking' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'linear-gradient(90deg, #1A4220, #2a5c30)',
          color: 'white', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          boxShadow: '0 2px 16px rgba(0,0,0,.25)',
        }}>
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%',
            border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            ⚡ Backend is waking up on Render's free tier — this takes ~30s…
          </span>
          <span style={{
            background: 'rgba(255,255,255,.15)', borderRadius: '999px',
            padding: '2px 10px', fontSize: '13px', fontWeight: '700', minWidth: '48px', textAlign: 'center',
          }}>
            {wakingSeconds}s
          </span>
        </div>
      )}

      {backendStatus === 'error' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'linear-gradient(90deg, #7c1d1d, #a52a2a)',
          color: 'white', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,.25)',
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            ❌ Cannot reach backend. Check that VITE_API_BASE_URL is set correctly in Vercel.
          </span>
          <button
            onClick={initBackend}
            style={{
              background: 'rgba(255,255,255,.20)', border: '1px solid rgba(255,255,255,.35)',
              color: 'white', borderRadius: '8px', padding: '4px 14px',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <Navbar
        currentStep={currentStep}
        activeStudent={activeStudent}
        onReset={handleReset}
        onGetStarted={() => setCurrentStep('profile')}
        onSelectStep={handleSelectStep}
      />

      {currentStep === 'landing' ? (
        <LandingPage onGetStarted={() => setCurrentStep('profile')} />
      ) : (
        <main style={{ flex: 1, width: '100%' }}>
          <div className="ds-shell" style={{ paddingTop: '64px', paddingBottom: '80px' }}>

            {currentStep === 'profile' && (
              <ProfileCreationStep
                onProfileCreated={handleProfileCreated}
                existingStudents={existingStudents}
                onSelectExisting={handleSelectStudent}
                backendStatus={backendStatus}
              />
            )}

            {currentStep === 'upload' && activeStudent && (
              <ResumeUploadStep
                student={activeStudent}
                profile={profile}
                onProfileUpdated={handleProfileUpdated}
                onProceedToMatches={() => setCurrentStep('matches')}
              />
            )}

            {currentStep === 'matches' && activeStudent && (
              <JobMatchesStep
                student={activeStudent}
                onOpenAgent={handleOpenAgent}
                onGoToUpload={() => setCurrentStep('upload')}
              />
            )}

            {currentStep === 'skill-gap' && activeStudent && selectedJob && (
              <SkillGapView student={activeStudent} job={selectedJob} onBack={backToMatches} />
            )}

            {currentStep === 'customize' && activeStudent && selectedJob && (
              <CustomizationView student={activeStudent} job={selectedJob} onBack={backToMatches} />
            )}

            {currentStep === 'interview-prep' && activeStudent && selectedJob && (
              <InterviewPrepView student={activeStudent} job={selectedJob} onBack={backToMatches} />
            )}

            {currentStep === 'assistant' && activeStudent && (
              <AssistantChat student={activeStudent} />
            )}

            {currentStep === 'tracker' && activeStudent && (
              <ApplicationTracker student={activeStudent} />
            )}

          </div>
        </main>
      )}

      <footer style={{
        borderTop: '1px solid rgba(255,255,255,.08)',
        background: 'var(--color-ink)',
        color: 'var(--color-sage)',
        padding: '64px 0',
        textAlign: 'center',
      }}>
        <div className="ds-shell" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--color-paper)', lineHeight: '1.2' }}>
            AI Career Companion
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(163,196,167,.70)', maxWidth: '520px', margin: '0 auto', lineHeight: '1.6' }}>
            Internship matching, skill-gap analysis, resume tailoring, and interview prep — grounded in your real experience.
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.25)', marginTop: '8px' }}>
            Built with FastAPI · sentence-transformers · Google Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
