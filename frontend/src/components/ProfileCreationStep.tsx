import React, { useState } from 'react';
import { UserPlus, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import type { Student } from '../types';
import { createStudent } from '../services/api';
import { AlertBanner } from './ui';

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
    <div className="space-y-12 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="ds-kicker">
          <Sparkles className="h-4 w-4 text-gold" />
          <span>Step 1 of 3 · Profile</span>
        </div>
        <h1 className="ds-h1">Create your candidate profile</h1>
        <p className="ds-lead max-w-xl mx-auto">
          Start with your name and email, or pick a sample candidate if you are running a demo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 ds-card p-8 sm:p-10 space-y-8">
          <div className="flex items-center gap-4 pb-6 border-b border-line">
            <div className="h-12 w-12 rounded-full bg-forest/10 text-forest flex items-center justify-center">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="ds-h3">New candidate</h2>
              <p className="ds-caption mt-1">This profile is the source of truth for matching.</p>
            </div>
          </div>

          {error && (
            <AlertBanner tone="error" title="Could not create profile">
              {error}
            </AlertBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div>
              <label className="ds-label">Full name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ds-input"
              />
            </div>

            <div>
              <label className="ds-label">Email address</label>
              <input
                type="email"
                required
                placeholder="e.g. alex.chen@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ds-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="ds-btn-primary w-full"
            >
              {loading ? (
                <div className="ds-spinner !border-white/30 !border-t-white" />
              ) : (
                <>
                  <span>Create candidate profile</span>
                  <ArrowRight className="h-5 w-5 text-gold" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="ds-card p-8 space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              <h3 className="text-[18px] font-serif font-bold text-ink">Quick demo presets</h3>
            </div>
            <p className="ds-body ds-muted">One click loads a sample candidate.</p>

            <div className="space-y-2">
              {PRESET_DEMO_USERS.map((preset) => (
                <button
                  key={preset.email}
                  onClick={() => handleQuickPreset(preset.name, preset.email)}
                  disabled={loading}
                  className="w-full text-left p-4 rounded-[16px] ds-card-inset hover:border-forest/40 transition-all group flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <div>
                    <div className="text-[16px] font-semibold text-ink group-hover:text-forest">
                      {preset.name}
                    </div>
                    <div className="ds-caption mt-1">{preset.role}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-stone group-hover:text-forest group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {existingStudents.length > 0 && (
            <div className="ds-card p-8 space-y-4">
              <h4 className="ds-label !mb-0 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-forest" />
                Existing profiles ({existingStudents.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {existingStudents.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onSelectExisting(st)}
                    className="w-full text-left px-4 py-3 rounded-[14px] ds-card-inset hover:border-forest/30 flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[16px] text-ink font-medium">{st.name}</span>
                    <span className="ds-caption">{st.email}</span>
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
