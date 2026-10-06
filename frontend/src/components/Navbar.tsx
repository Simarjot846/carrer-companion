import React, { useState, useEffect } from 'react';
import { Sparkles, UserCheck, FileText, Target, RotateCcw, Home, Bot, LayoutDashboard } from 'lucide-react';
import type { Student } from '../types';

export type AppStep = 'landing' | 'profile' | 'upload' | 'matches' | 'skill-gap' | 'customize' | 'interview-prep' | 'assistant' | 'tracker';

interface NavbarProps {
  currentStep: AppStep;
  activeStudent: Student | null;
  onReset: () => void;
  onGetStarted: () => void;
  onSelectStep: (step: AppStep) => void;
}

const NAV_ITEMS = [
  { step: 'landing' as AppStep,  icon: Home,          label: 'Home',      always: true },
  { step: 'profile' as AppStep,  icon: UserCheck,     label: 'Profile',   always: true },
  { step: 'upload' as AppStep,   icon: FileText,      label: 'Resume',    always: false },
  { step: 'matches' as AppStep,  icon: Target,        label: 'Matches',   always: false },
  { step: 'tracker' as AppStep,  icon: LayoutDashboard, label: 'Tracker', always: false },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentStep, activeStudent, onReset, onGetStarted, onSelectStep,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isAgentStep = ['skill-gap', 'customize', 'interview-prep'].includes(currentStep);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(15,20,16,.96)' : 'rgba(15,20,16,1)',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(255,255,255,.08)',
      boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,.30)' : 'none',
      transition: 'all .25s ease',
      color: 'var(--color-paper)',
    }}>
      <div className="ds-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', height: '64px' }}>

        {/* Brand */}
        <button
          onClick={() => onSelectStep('landing')}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <div style={{
            width: '38px', height: '38px', borderRadius: '11px',
            background: 'linear-gradient(135deg, var(--color-forest) 0%, #0f2912 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(26,66,32,.50)',
            flexShrink: 0,
          }}>
            <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-gold)' }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: '700',
            color: 'var(--color-paper)', letterSpacing: '-0.01em',
            display: 'none',
          }} className="brand-name">
            AI Career Companion
          </span>
        </button>

        {/* Navigation pills */}
        <nav style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: '13px', padding: '4px', gap: '2px',
          overflow: 'hidden',
        }}>
          {NAV_ITEMS.map(({ step, icon: Icon, label, always }) => {
            const disabled = !always && !activeStudent;
            const active = currentStep === step || (step === 'matches' && isAgentStep);
            return (
              <button
                key={step}
                onClick={() => !disabled && onSelectStep(step)}
                disabled={disabled}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '9px',
                  fontSize: '14px', fontWeight: '600',
                  border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all .15s ease',
                  background: active ? 'var(--color-forest)' : 'transparent',
                  color: active ? 'white' : disabled ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.55)',
                  boxShadow: active ? '0 2px 8px rgba(26,66,32,.40)' : 'none',
                  opacity: disabled ? .4 : 1,
                }}
                onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = 'rgba(255,255,255,.08)'; }}
                onMouseLeave={e => { if (!disabled && !active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon style={{ width: '14px', height: '14px' }} />
                <span className="nav-label">{label}</span>
              </button>
            );
          })}

          {/* Separator */}
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,.10)', margin: '0 2px' }} />

          {/* Assistant button */}
          <button
            onClick={() => activeStudent && onSelectStep('assistant')}
            disabled={!activeStudent}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '9px',
              fontSize: '14px', fontWeight: '600',
              border: 'none', cursor: !activeStudent ? 'not-allowed' : 'pointer',
              transition: 'all .15s ease',
              background: currentStep === 'assistant'
                ? 'linear-gradient(135deg, var(--color-gold) 0%, var(--color-amber) 100%)'
                : 'transparent',
              color: currentStep === 'assistant' ? 'white' : !activeStudent ? 'rgba(255,255,255,.22)' : 'rgba(201,150,58,.80)',
              opacity: !activeStudent ? .4 : 1,
            }}
            onMouseEnter={e => { if (activeStudent && currentStep !== 'assistant') e.currentTarget.style.background = 'rgba(201,150,58,.12)'; }}
            onMouseLeave={e => { if (activeStudent && currentStep !== 'assistant') e.currentTarget.style.background = 'transparent'; }}
          >
            <Bot style={{ width: '14px', height: '14px' }} />
            <span className="nav-label">Assistant</span>
          </button>
        </nav>

        {/* Right side: student badge or CTA */}
        <div style={{ flexShrink: 0 }}>
          {activeStudent ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.09)',
              borderRadius: '11px', padding: '7px 12px',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--color-forest) 0%, var(--color-gold) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '700', color: 'white',
              }}>
                {activeStudent.name.charAt(0)}
              </div>
              <span style={{
                fontSize: '14px', fontWeight: '600', color: 'var(--color-paper)',
                maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} className="student-name">
                {activeStudent.name}
              </span>
              <button
                onClick={onReset}
                title="Switch candidate"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,.35)', padding: '2px',
                  transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-clay)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.35)')}
              >
                <RotateCcw style={{ width: '13px', height: '13px' }} />
              </button>
            </div>
          ) : (
            <button
              onClick={onGetStarted}
              style={{
                padding: '10px 22px', borderRadius: '11px',
                background: 'var(--color-forest)',
                color: 'white', fontSize: '14px', fontWeight: '700',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(26,66,32,.40)',
                transition: 'all .15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#143418')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-forest)')}
            >
              Get Started
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .brand-name { display: block !important; }
        }
        @media (max-width: 480px) {
          .nav-label { display: none !important; }
          .student-name { display: none !important; }
        }
      `}</style>
    </header>
  );
};
