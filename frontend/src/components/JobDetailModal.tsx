import React from 'react';
import { X, Building2, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { JobMatch } from '../types';
import { ScoreRing, Chip } from './ui';

interface JobDetailModalProps {
  job: JobMatch | null;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose }) => {
  if (!job) return null;

  return (
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        background: 'rgba(15,20,16,.75)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="ds-card"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px', width: '100%', maxHeight: '90vh',
          overflowY: 'auto', padding: '40px 44px',
          display: 'flex', flexDirection: 'column', gap: '32px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid var(--color-line)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-stone)' }}>
              {job.posting_type} · {job.experience_level}
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', lineHeight: 1.15 }}>{job.title}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '16px', color: 'var(--color-stone)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontWeight: '600', color: 'var(--color-charcoal)' }}>
                <Building2 style={{ width: '16px', height: '16px', color: 'var(--color-stone)' }} />
                {job.company}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                <MapPin style={{ width: '16px', height: '16px' }} />
                {job.location}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
              background: 'var(--color-cream)', border: '1px solid var(--color-line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-stone)', transition: 'all .15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-mist)'; e.currentTarget.style.color = 'var(--color-ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-cream)'; e.currentTarget.style.color = 'var(--color-stone)'; }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Match analysis */}
        <div className="ds-card-inset" style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <ScoreRing score={job.match_score} size={96} />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-stone)', marginBottom: '10px' }}>Match Analysis</div>
            <p style={{ fontSize: '16px', lineHeight: '1.65', color: 'var(--color-charcoal)' }}>{job.reasoning}</p>
          </div>
        </div>

        {/* Skills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="ds-card-inset" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', color: 'var(--color-forest)' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--color-forest)' }}>
                Required ({job.required_skills.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {job.required_skills.map((skill, i) => (
                <Chip key={i} tone="forest">{skill}</Chip>
              ))}
            </div>
          </div>
          <div style={{ padding: '20px', borderRadius: '14px', background: 'var(--color-clay-light)', border: '1px solid rgba(192,82,40,.20)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--color-clay)' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--color-clay)' }}>
                Gaps ({job.missing_skills.length})
              </span>
            </div>
            {job.missing_skills.length === 0 ? (
              <p style={{ fontSize: '15px', color: 'var(--color-forest)', fontWeight: '600' }}>Complete skill alignment.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {job.missing_skills.map((skill, i) => (
                  <Chip key={i} tone="clay">{skill}</Chip>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-stone)', marginBottom: '12px' }}>
            Job Description
          </div>
          <div className="ds-card-inset" style={{ padding: '20px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: 'var(--color-charcoal)', whiteSpace: 'pre-line' }}>{job.description}</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px', borderRadius: '11px',
              background: 'white', border: '1.5px solid var(--color-line)',
              fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)', cursor: 'pointer',
              transition: 'all .15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-sage)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
