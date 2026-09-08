import React from 'react';
import { Sparkles, UserCheck, FileText, Target, RotateCcw, Home } from 'lucide-react';
import type { Student } from '../types';

interface NavbarProps {
  currentStep: 'landing' | 'profile' | 'upload' | 'matches';
  activeStudent: Student | null;
  onReset: () => void;
  onSelectStep: (step: 'landing' | 'profile' | 'upload' | 'matches') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  activeStudent,
  onReset,
  onSelectStep,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#171B16] text-[#FAF9F5] border-b border-[#2C5F2D]/30 px-4 lg:px-8 py-3.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Header */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectStep('landing')}>
          <div className="h-10 w-10 rounded-xl bg-[#2C5F2D] flex items-center justify-center shadow-md shadow-[#2C5F2D]/30">
            <Sparkles className="h-5 w-5 text-[#C9A63B]" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-serif font-bold text-[#FAF9F5] tracking-tight">AI Career Companion</h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#2C5F2D]/30 text-[#A7BEAE] border border-[#2C5F2D]/40 font-sans">
                Project #M-3-1
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">Internship Matching & LLM Resume Intelligence</p>
          </div>
        </div>

        {/* Workflow Steps Navigator */}
        <div className="flex items-center space-x-1 bg-[#212620] p-1.5 rounded-xl border border-slate-800 font-sans">
          
          {/* Home / Landing */}
          <button
            onClick={() => onSelectStep('landing')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentStep === 'landing'
                ? 'bg-[#2C5F2D] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </button>

          {/* 1. Create Profile */}
          <button
            onClick={() => onSelectStep('profile')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentStep === 'profile'
                ? 'bg-[#2C5F2D] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>1. Profile</span>
          </button>

          {/* 2. Upload Resume */}
          <button
            onClick={() => activeStudent && onSelectStep('upload')}
            disabled={!activeStudent}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !activeStudent
                ? 'opacity-40 cursor-not-allowed text-slate-600'
                : currentStep === 'upload'
                ? 'bg-[#2C5F2D] text-white shadow-sm cursor-pointer'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>2. Resume</span>
          </button>

          {/* 3. Job Matches */}
          <button
            onClick={() => activeStudent && onSelectStep('matches')}
            disabled={!activeStudent}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !activeStudent
                ? 'opacity-40 cursor-not-allowed text-slate-600'
                : currentStep === 'matches'
                ? 'bg-[#2C5F2D] text-white shadow-sm cursor-pointer'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>3. Matches</span>
          </button>
        </div>

        {/* Active Student Badge / Reset Button */}
        <div className="flex items-center space-x-3 font-sans">
          {activeStudent ? (
            <div className="flex items-center space-x-2 bg-[#212620] border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <div className="h-2 w-2 rounded-full bg-[#A7BEAE] animate-pulse" />
              <span className="text-slate-200 font-medium">{activeStudent.name}</span>
              <button
                onClick={onReset}
                title="Switch candidate profile"
                className="text-slate-400 hover:text-slate-200 ml-1 p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onSelectStep('profile')}
              className="text-xs px-3.5 py-1.5 bg-[#2C5F2D] hover:bg-[#234E25] text-white font-medium rounded-lg transition-all cursor-pointer shadow-sm"
            >
              Get Started
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
