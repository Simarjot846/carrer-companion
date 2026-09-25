import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ProfileCreationStep } from './components/ProfileCreationStep';
import { ResumeUploadStep } from './components/ResumeUploadStep';
import { JobMatchesStep } from './components/JobMatchesStep';
import { SkillGapView } from './components/SkillGapView';
import { CustomizationView } from './components/CustomizationView';
import { InterviewPrepView } from './components/InterviewPrepView';
import { AssistantChat } from './components/AssistantChat';
import type { Student, StudentProfile, JobMatch } from './types';
import { listStudents, getStudentProfile } from './services/api';

type AppStep = 'landing' | 'profile' | 'upload' | 'matches' | 'skill-gap' | 'customize' | 'interview-prep' | 'assistant';

export function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('landing');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  useEffect(() => {
    const loadExistingStudents = async () => {
      try {
        const students = await listStudents();
        setExistingStudents(students);
      } catch (err) {
        console.error('Failed to load existing students:', err);
      }
    };
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
      const hasContent = (p.resumes && p.resumes.length > 0) || (p.skills && p.skills.length > 0);
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

  const backToMatches = () => {
    setCurrentStep('matches');
  };

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col font-sans selection:bg-forest selection:text-white">
      <Navbar
        currentStep={currentStep}
        activeStudent={activeStudent}
        onReset={handleReset}
        onGetStarted={() => setCurrentStep('profile')}
        onSelectStep={(step) => {
          if (['skill-gap', 'customize', 'interview-prep'].includes(step) && !selectedJob) return;
          setCurrentStep(step);
        }}
      />

      {currentStep === 'landing' ? (
        <LandingPage onGetStarted={() => setCurrentStep('profile')} />
      ) : (
        <main className="flex-1 w-full ds-shell py-16 lg:py-20">
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
        </main>
      )}

      <footer className="border-t border-line bg-ink text-sage py-16 text-center space-y-3">
        <p className="font-serif text-[24px] text-paper leading-tight">AI Career Companion</p>
        <p className="ds-body text-sage max-w-xl mx-auto px-6">
          Internship matching, skill-gap analysis, resume tailoring, and interview prep — grounded in your real experience.
        </p>
        <p className="ds-caption">Built with FastAPI, sentence-transformers, and Google Gemini</p>
      </footer>
    </div>
  );
}

export default App;
