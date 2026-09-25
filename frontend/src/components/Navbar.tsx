import React, { useState, useEffect } from 'react';
import { Sparkles, UserCheck, FileText, Target, RotateCcw, Home, Bot } from 'lucide-react';
import type { Student } from '../types';

type AppStep = 'landing' | 'profile' | 'upload' | 'matches' | 'skill-gap' | 'customize' | 'interview-prep' | 'assistant';

interface NavbarProps {
  currentStep: AppStep;
  activeStudent: Student | null;
  onReset: () => void;
  onGetStarted: () => void;
  onSelectStep: (step: AppStep) => void;
}

const STEP_LABELS: Partial<Record<AppStep, string>> = {
  'skill-gap': 'Skill Gap',
  'customize': 'Tailor Resume',
  'interview-prep': 'Interview Prep',
};

export const Navbar: React.FC<NavbarProps> = ({ currentStep, activeStudent, onReset, onGetStarted, onSelectStep }) => {
  const isM3Step = ['skill-gap', 'customize', 'interview-prep'].includes(currentStep);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 px-4 lg:px-8 transition-all duration-300 ${
        scrolled
          ? 'bg-paper/90 backdrop-blur-md shadow-[0_8px_30px_-18px_rgba(22,25,20,0.35)] border-b border-line'
          : 'bg-cream/80 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-4 h-[72px]">
        <button
          onClick={() => onSelectStep('landing')}
          className="flex items-center gap-3 group shrink-0 cursor-pointer"
        >
          <div className="h-11 w-11 rounded-[14px] bg-forest flex items-center justify-center shadow-[0_8px_20px_-10px_rgba(36,88,42,0.7)]">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="font-serif text-[18px] font-bold text-ink tracking-tight leading-none">
              Career Companion
            </div>
            <p className="ds-caption mt-1">
              {isM3Step ? STEP_LABELS[currentStep] : 'Internship intelligence'}
            </p>
          </div>
        </button>

        {currentStep !== 'landing' && (
          <nav className="hidden md:flex items-center bg-paper rounded-[14px] border border-line p-1 gap-0.5 shadow-[var(--shadow-sm)]">
            {[
              { step: 'landing' as AppStep, icon: <Home className="h-4 w-4" />, label: 'Home', always: true },
              { step: 'profile' as AppStep, icon: <UserCheck className="h-4 w-4" />, label: 'Profile', always: true },
              { step: 'upload' as AppStep, icon: <FileText className="h-4 w-4" />, label: 'Resume', always: false },
              { step: 'matches' as AppStep, icon: <Target className="h-4 w-4" />, label: 'Matches', always: false },
            ].map(({ step, icon, label, always }) => {
              const disabled = !always && !activeStudent;
              const active = currentStep === step || (step === 'matches' && isM3Step);
              return (
                <button
                  key={step}
                  onClick={() => !disabled && onSelectStep(step)}
                  disabled={disabled}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[14px] font-semibold transition-all ${
                    disabled
                      ? 'opacity-35 cursor-not-allowed text-stone'
                      : active
                      ? 'bg-forest text-white shadow-sm cursor-pointer'
                      : 'text-stone hover:text-ink hover:bg-cream cursor-pointer'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              );
            })}
            <div className="w-px h-5 bg-line mx-0.5" />
            <button
              onClick={() => activeStudent && onSelectStep('assistant')}
              disabled={!activeStudent}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[14px] font-semibold transition-all ${
                !activeStudent
                  ? 'opacity-35 cursor-not-allowed text-stone'
                  : currentStep === 'assistant'
                  ? 'bg-gold-deep text-white cursor-pointer'
                  : 'text-gold-deep hover:bg-[color-mix(in_srgb,var(--color-gold)_14%,white)] cursor-pointer'
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>Assistant</span>
            </button>
          </nav>
        )}

        <div className="shrink-0">
          {activeStudent ? (
            <div className="flex items-center gap-2 bg-paper border border-line px-3 py-1.5 rounded-[14px]">
              <div className="h-8 w-8 rounded-full bg-forest flex items-center justify-center text-white text-[14px] font-bold">
                {activeStudent.name.charAt(0)}
              </div>
              <span className="text-[14px] text-ink font-semibold hidden sm:inline max-w-[120px] truncate">
                {activeStudent.name}
              </span>
              <button
                onClick={onReset}
                title="Switch candidate"
                className="text-stone hover:text-clay p-1 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={onGetStarted} className="ds-btn-primary !py-3 !px-5">
              Get Started
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
