import React, { useState, useEffect } from 'react';
import { Sparkles, UserCheck, FileText, Target, RotateCcw, Home, Bot } from 'lucide-react';
import type { Student } from '../types';

type AppStep = 'landing' | 'profile' | 'upload' | 'matches' | 'skill-gap' | 'customize' | 'interview-prep' | 'assistant';

interface NavbarProps {
  currentStep: AppStep;
  activeStudent: Student | null;
  onReset: () => void;
  onSelectStep: (step: AppStep) => void;
}

const STEP_LABELS: Partial<Record<AppStep, string>> = {
  'skill-gap': 'Skill Gap',
  'customize': 'Tailor Resume',
  'interview-prep': 'Interview Prep',
};

export const Navbar: React.FC<NavbarProps> = ({ currentStep, activeStudent, onReset, onSelectStep }) => {
  const isM3Step = ['skill-gap', 'customize', 'interview-prep'].includes(currentStep);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 text-[#FAF9F5] px-4 lg:px-8 py-3 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0F1210]/95 backdrop-blur-md shadow-xl border-b border-[#2C5F2D]/20'
          : 'bg-[#171B16] border-b border-[#2C5F2D]/25'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* Brand */}
        <button
          onClick={() => onSelectStep('landing')}
          className="flex items-center space-x-3 group shrink-0 cursor-pointer"
        >
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-[#2C5F2D] to-[#1e4220] flex items-center justify-center shadow-lg shadow-[#2C5F2D]/30 group-hover:shadow-[#2C5F2D]/50 transition-shadow">
            <Sparkles className="h-4.5 w-4.5 text-[#C9A63B]" />
            <div className="absolute inset-0 rounded-xl bg-[#C9A63B]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="flex items-center space-x-2">
              <span className="text-[15px] font-serif font-bold text-[#FAF9F5] tracking-tight leading-none">
                AI Career Companion
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-[#C9A63B]/20 text-[#C9A63B] border border-[#C9A63B]/30 font-sans tracking-wider">
                M3
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              {isM3Step ? STEP_LABELS[currentStep] : 'Internship Intelligence'}
            </p>
          </div>
        </button>

        {/* Nav steps */}
        <nav className="flex items-center bg-[#1A1F18] rounded-xl border border-white/5 p-1 gap-0.5">
          {[
            { step: 'landing' as AppStep, icon: <Home className="h-3.5 w-3.5" />, label: 'Home', always: true },
            { step: 'profile' as AppStep, icon: <UserCheck className="h-3.5 w-3.5" />, label: 'Profile', always: true },
            { step: 'upload' as AppStep, icon: <FileText className="h-3.5 w-3.5" />, label: 'Resume', always: false },
            { step: 'matches' as AppStep, icon: <Target className="h-3.5 w-3.5" />, label: 'Matches', always: false },
          ].map(({ step, icon, label, always }) => {
            const disabled = !always && !activeStudent;
            const active = currentStep === step || (step === 'matches' && isM3Step);
            return (
              <button
                key={step}
                onClick={() => !disabled && onSelectStep(step)}
                disabled={disabled}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed text-slate-500'
                    : active
                    ? 'bg-[#2C5F2D] text-white shadow-sm cursor-pointer'
                    : 'text-slate-400 hover:text-white hover:bg-white/8 cursor-pointer'
                }`}
              >
                {icon}
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}

          <div className="w-px h-5 bg-white/10 mx-0.5" />

          <button
            onClick={() => activeStudent && onSelectStep('assistant')}
            disabled={!activeStudent}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              !activeStudent
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : currentStep === 'assistant'
                ? 'bg-gradient-to-r from-[#C9A63B] to-[#d4a82a] text-white shadow-sm cursor-pointer'
                : 'text-[#C9A63B]/70 hover:text-[#C9A63B] hover:bg-[#C9A63B]/10 cursor-pointer'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Assistant</span>
          </button>
        </nav>

        {/* Student badge */}
        <div className="shrink-0">
          {activeStudent ? (
            <div className="flex items-center space-x-2 bg-[#1A1F18] border border-white/10 px-3 py-1.5 rounded-xl text-xs group">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#2C5F2D] to-[#C9A63B] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {activeStudent.name.charAt(0)}
              </div>
              <span className="text-slate-200 font-medium hidden sm:inline max-w-[100px] truncate">
                {activeStudent.name}
              </span>
              <button
                onClick={onReset}
                title="Switch candidate"
                className="text-slate-500 hover:text-[#C85A32] p-0.5 rounded transition-colors cursor-pointer ml-0.5"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelectStep('profile')}
              className="text-xs px-4 py-2 bg-gradient-to-r from-[#2C5F2D] to-[#234E25] hover:from-[#234E25] hover:to-[#1a3d1b] text-white font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-[#2C5F2D]/25 hover:shadow-[#2C5F2D]/40"
            >
              Get Started
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
