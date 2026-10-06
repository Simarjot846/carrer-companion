import React, { useState } from 'react';
import { UserPlus, ArrowRight, Sparkles, UserCheck, ChevronRight } from 'lucide-react';
import type { Student } from '../types';
import { createStudent } from '../services/api';

interface ProfileCreationStepProps {
  onProfileCreated: (student: Student) => void;
  existingStudents: Student[];
  onSelectExisting: (student: Student) => void;
}

const PRESET_DEMO_USERS = [
  { name: 'Alex Chen',       email: 'alex.chen@berkeley.edu',        role: 'Software Engineering Intern — Backend' },
  { name: 'Maya Patel',      email: 'maya.patel@columbia.edu',       role: 'Data Science & Analytics Intern' },
  { name: 'Jordan Rivera',   email: 'jordan.rivera@nyu.edu',         role: 'Frontend Developer Intern' },
  { name: 'Priya Sharma',    email: 'priya.sharma@stanford.edu',     role: 'Machine Learning & AI Research Intern' },
  { name: 'David Kim',       email: 'david.kim@northwestern.edu',    role: 'Associate Product Manager Intern' },
  { name: 'Samantha Taylor', email: 'samantha.taylor@risd.edu',      role: 'UI/UX Product Design Intern' },
];

export const ProfileCreationStep: React.FC<ProfileCreationStepProps> = ({
  onProfileCreated, existingStudents, onSelectExisting,
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
      const found = existingStudents.find(s => s.email.toLowerCase() === presetEmail.toLowerCase());
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
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <div className="ds-kicker" style={{ marginBottom: '20px' }}>
          <Sparkles style={{ width: '16px', height: '16px', color: 'var(--color-gold)' }} />
          Step 1 of 3 · Candidate Profile
        </div>
        <h1 className="ds-h1" style={{ color: 'var(--color-ink)', marginBottom: '16px' }}>
          Create your profile
        </h1>
        <p className="ds-lead" style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--color-stone)' }}>
          Enter your details below or pick a sample candidate for a quick demo.
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr',
        gap: '32px', alignItems: 'start',
      }} className="profile-grid">

        {/* Form card */}
        <div className="ds-card" style={{ padding: '40px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '28px', borderBottom: '1px solid var(--color-line)' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '13px',
              background: 'var(--color-leaf-bg)', color: 'var(--color-forest)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div className="ds-h4" style={{ color: 'var(--color-ink)', marginBottom: '4px' }}>New Candidate</div>
              <div className="ds-small" style={{ color: 'var(--color-stone)' }}>Your profile is the source of truth for matching</div>
            </div>
          </div>

          {error && (
            <div className="ds-alert ds-alert-error" style={{ marginBottom: '24px' }}>
              <div className="ds-alert-copy">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="ds-label-field">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Chen"
                value={name}
                onChange={e => setName(e.target.value)}
                className="ds-input"
              />
            </div>

            <div>
              <label className="ds-label-field">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. alex.chen@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="ds-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="ds-btn-primary"
              style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <div className="ds-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : (
                <>
                  Create Profile
                  <ArrowRight style={{ width: '18px', height: '18px', color: 'var(--color-amber)' }} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Presets + existing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Quick demo presets */}
          <div className="ds-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-gold)' }} />
              <span className="ds-h4" style={{ color: 'var(--color-ink)' }}>Quick Demo Presets</span>
            </div>
            <p className="ds-body" style={{ color: 'var(--color-stone)', marginBottom: '24px' }}>
              One click to load a sample candidate and jump straight to matching.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PRESET_DEMO_USERS.map(preset => (
                <button
                  key={preset.email}
                  onClick={() => handleQuickPreset(preset.name, preset.email)}
                  disabled={loading}
                  style={{
                    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '12px',
                    background: 'var(--color-paper)', border: '1.5px solid var(--color-line)',
                    cursor: 'pointer', transition: 'all .15s ease',
                    gap: '12px',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-sage)';
                    e.currentTarget.style.background = 'var(--color-leaf-bg)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-line)';
                    e.currentTarget.style.background = 'var(--color-paper)';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '2px' }}>
                      {preset.name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-stone)' }}>{preset.role}</div>
                  </div>
                  <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--color-sage)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Existing candidates */}
          {existingStudents.length > 0 && (
            <div className="ds-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <UserCheck style={{ width: '18px', height: '18px', color: 'var(--color-forest)' }} />
                <span className="ds-h4" style={{ color: 'var(--color-ink)' }}>
                  Existing Profiles <span style={{ fontSize: '16px', color: 'var(--color-stone)', fontWeight: '600' }}>({existingStudents.length})</span>
                </span>
              </div>
              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {existingStudents.map(st => (
                  <button
                    key={st.id}
                    onClick={() => onSelectExisting(st)}
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: '10px',
                      background: 'var(--color-paper)', border: '1px solid var(--color-line)',
                      cursor: 'pointer', transition: 'all .15s ease', gap: '8px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-cream)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-paper)'; }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>{st.name}</span>
                    <span style={{ fontSize: '14px', color: 'var(--color-stone)' }}>{st.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .profile-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
};
