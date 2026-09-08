import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ProfileCreationStep } from './components/ProfileCreationStep';
import { ResumeUploadStep } from './components/ResumeUploadStep';
import { JobMatchesStep } from './components/JobMatchesStep';
import type { Student, StudentProfile } from './types';
import { listStudents, getStudentProfile } from './services/api';

export function App() {
  const [currentStep, setCurrentStep] = useState<'landing' | 'profile' | 'upload' | 'matches'>('landing');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);

  // Load existing student profiles on boot
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
      if (p.resumes && p.resumes.length > 0) {
        setCurrentStep('matches');
      } else {
        setCurrentStep('upload');
      }
    } catch (err) {
      setCurrentStep('upload');
    }
  };

  const handleProfileCreated = async (student: Student) => {
    setActiveStudent(student);
    loadExistingStudents();
    try {
      const p = await getStudentProfile(student.id);
      setProfile(p);
    } catch (err) {
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
    setCurrentStep('landing');
    loadExistingStudents();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#171B16] flex flex-col font-sans selection:bg-[#2C5F2D] selection:text-white">
      {/* Editorial Top Navbar */}
      <Navbar
        currentStep={currentStep}
        activeStudent={activeStudent}
        onReset={handleReset}
        onSelectStep={(step) => setCurrentStep(step)}
      />

      {/* Main Content Area */}
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
          <JobMatchesStep student={activeStudent} />
        )}
      </main>

      {/* Minimal Charcoal Footer */}
      <footer className="border-t border-[#2C5F2D]/20 bg-[#171B16] text-slate-400 py-8 text-center text-xs font-sans space-y-2">
        <p className="font-serif text-sm text-[#FAF9F5]">AI Career Companion Agent</p>
        <p>Internship Matching & Interview Preparation Pipeline</p>
        <p className="text-[11px] text-slate-500">Built with FastAPI, PostgreSQL pgvector, and Google Gemini AI</p>

      </footer>
    </div>
  );
}

export default App;
