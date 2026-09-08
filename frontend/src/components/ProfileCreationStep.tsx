import React, { useState } from 'react';
import { UserPlus, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import type { Student } from '../types';
import { createStudent } from '../services/api';

interface ProfileCreationStepProps {
  onProfileCreated: (student: Student) => void;
  existingStudents: Student[];
  onSelectExisting: (student: Student) => void;
}

const PRESET_DEMO_USERS = [
  { name: "Alex Chen", email: "alex.chen@berkeley.edu", role: "Software Engineering Intern - Backend" },
  { name: "Maya Patel", email: "maya.patel@columbia.edu", role: "Data Science & Analytics Intern" },
  { name: "Jordan Rivera", email: "jordan.rivera@nyu.edu", role: "Frontend Developer Intern" },
  { name: "Priya Sharma", email: "priya.sharma@stanford.edu", role: "Machine Learning & AI Research Intern" },
  { name: "David Kim", email: "david.kim@northwestern.edu", role: "Associate Product Manager Intern" },
  { name: "Samantha Taylor", email: "samantha.taylor@risd.edu", role: "UI/UX Product Design Intern" },
];

export const ProfileCreationStep: React.FC<ProfileCreationStepProps> = ({
  onProfileCreated,
  existingStudents,
  onSelectExisting,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const student = await createStudent(name.trim(), email.trim());
      onProfileCreated(student);
    } catch (err: any) {
      setError(err.message || 'Failed to create student profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = async (presetName: string, presetEmail: string) => {
    setName(presetName);
    setEmail(presetEmail);
    setLoading(true);
    setError(null);
    try {
      const student = await createStudent(presetName, presetEmail);
      onProfileCreated(student);
    } catch (err: any) {
      const found = existingStudents.find((s) => s.email.toLowerCase() === presetEmail.toLowerCase());
      if (found) {
        onSelectExisting(found);
      } else {
        setError(err.message || 'Failed to initialize preset profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-[#C9A63B]" />
          <span>Step 1 of 3 · Candidate Profile Creation</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#171B16]">
          Create Candidate Profile
        </h2>
        <p className="text-slate-600 text-sm max-w-xl mx-auto font-sans">
          Enter your candidate credentials below or select a sample candidate profile for instant live demoing.
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Form Card */}
        <div className="md:col-span-7 bg-white border border-[#E2E0D5] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E0D5]">
            <div className="h-10 w-10 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-serif font-bold text-[#171B16]">New Candidate Details</h3>
              <p className="text-xs text-slate-500 font-sans">Your profile is the single source of truth for matching</p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#D5D3C5] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] focus:border-[#2C5F2D] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. alex.chen@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF9F5] border border-[#D5D3C5] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] focus:border-[#2C5F2D] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="w-full py-3.5 px-4 bg-[#2C5F2D] hover:bg-[#234E25] disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-md shadow-[#2C5F2D]/20 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Candidate Profile</span>
                  <ArrowRight className="h-4 w-4 text-[#C9A63B]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Presets Sidebar */}
        <div className="md:col-span-5 space-y-4 text-left">
          
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-[#C9A63B]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                Quick Demo Presets
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Click any sample candidate below for 1-click live demoing:
            </p>

            <div className="space-y-2 font-sans">
              {PRESET_DEMO_USERS.map((preset) => (
                <button
                  key={preset.email}
                  onClick={() => handleQuickPreset(preset.name, preset.email)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-xl bg-[#FAF9F5] hover:bg-white border border-[#E2E0D5] hover:border-[#2C5F2D]/50 transition-all group flex items-center justify-between cursor-pointer shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-[#2C5F2D] transition-colors">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{preset.role}</div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#2C5F2D] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Existing Candidates List */}
          {existingStudents.length > 0 && (
            <div className="bg-white border border-[#E2E0D5] rounded-2xl p-4 shadow-sm space-y-3 font-sans">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <UserCheck className="h-3.5 w-3.5 text-[#2C5F2D]" />
                <span>Existing Profiles ({existingStudents.length})</span>
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {existingStudents.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onSelectExisting(st)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-[#FAF9F5] hover:bg-[#F3F2EC] border border-[#E2E0D5] text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="text-slate-800 font-medium">{st.name}</span>
                    <span className="text-[10px] text-slate-500">{st.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
