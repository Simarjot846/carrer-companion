import { useState, useEffect } from 'react';
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

export function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('landing');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  useEffect(() => {
    loadExistingStudents();
  }, []);

  const loadExistingStudents = async () => {
    try {
      const students = await listStudents();
      setExistingStudents(students);
    } catch (err) {
      console.error('Failed to load existing students:', err);
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
