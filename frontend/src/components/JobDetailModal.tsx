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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fade-in">
      <div className="ds-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 sm:p-10 space-y-8 text-left">
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-line">
          <div className="space-y-3">
            <div className="ds-label !mb-0">
              {job.posting_type} · {job.experience_level}
            </div>
            <h3 className="ds-h2">{job.title}</h3>
            <div className="flex flex-wrap items-center gap-4 ds-body ds-muted">
              <span className="inline-flex items-center gap-2 font-semibold text-ink">
                <Building2 className="h-4 w-4" />
                {job.company}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-[12px] bg-cream hover:bg-mist text-stone hover:text-ink cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="ds-card-inset p-6 flex items-start gap-6">
          <ScoreRing score={job.match_score} size={96} />
          <div>
            <div className="ds-label">Match analysis</div>
            <p className="ds-body">{job.reasoning}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="ds-card-inset p-6 space-y-3">
            <h4 className="ds-label !mb-0 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-forest" />
              Required skills ({job.required_skills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((skill, i) => (
                <Chip key={i} tone="forest">{skill}</Chip>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-[16px] bg-[color-mix(in_srgb,var(--color-clay)_6%,white)] border border-[color-mix(in_srgb,var(--color-clay)_22%,transparent)] space-y-3">
            <h4 className="ds-label !mb-0 !text-clay flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Skill gaps ({job.missing_skills.length})
            </h4>
            {job.missing_skills.length === 0 ? (
              <p className="ds-body text-forest font-semibold">Complete skill alignment for this role.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {job.missing_skills.map((skill, i) => (
                  <Chip key={i} tone="clay">{skill}</Chip>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-line">
          <h4 className="ds-label">Job description</h4>
          <p className="ds-body ds-muted whitespace-pre-line ds-card-inset p-6">
            {job.description}
          </p>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="ds-btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};
