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
  // Holds the job selected in JobMatchesStep for M3 agent views
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
      setCurrentStep(p.resumes && p.resumes.length > 0 ? 'matches' : 'upload');
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

  // Called from JobMatchesStep when user clicks an M3 agent button on a job card
  const handleOpenAgent = (job: JobMatch, agent: 'skill-gap' | 'customize' | 'interview-prep') => {
    setSelectedJob(job);
    setCurrentStep(agent);
  };

  const backToMatches = () => {
    setCurrentStep('matches');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#171B16] flex flex-col font-sans selection:bg-[#2C5F2D] selection:text-white">
      <Navbar
        currentStep={currentStep}
        activeStudent={activeStudent}
        onReset={handleReset}
        onSelectStep={(step) => {
          // Navigating away from an M3 agent view back to matches is fine
          if (['skill-gap', 'customize', 'interview-prep'].includes(step) && !selectedJob) return;
          setCurrentStep(step);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        {currentStep === 'landing' && (
          <LandingPage onGetStarted={() => setCurrentStep('profile')} />
        )}

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

      <footer className="border-t border-[#2C5F2D]/20 bg-[#171B16] text-slate-400 py-8 text-center text-xs font-sans space-y-2">
        <p className="font-serif text-sm text-[#FAF9F5]">AI Career Companion Agent</p>
        <p>Internship Matching · Skill Gap Analysis · Resume & Cover Letter · Interview Prep · Career Assistant</p>
        <p className="text-[11px] text-slate-500">Built with FastAPI, sentence-transformers, and Google Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;
