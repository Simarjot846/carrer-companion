import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Target,
  GraduationCap,
  Briefcase,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Student, JobMatch, SkillGapResponse, GapItem } from '../types';
import { getSkillGap } from '../services/api';

interface SkillGapViewProps {
  student: Student;
  job: JobMatch;
  onBack: () => void;
}

// Readiness score colour
function scoreColor(score: number) {
  if (score >= 75) return 'text-[#2C5F2D]';
  if (score >= 50) return 'text-[#C9A63B]';
  return 'text-[#C85A32]';
}

// Collapsible gap section
function GapSection({
  title,
  icon,
  items,
  labelKey,
  accentClass,
  borderClass,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  items: GapItem[];
  labelKey: 'skill' | 'area';
  accentClass: string;
  borderClass: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;

  return (
    <div className={`ds-card overflow-hidden border ${borderClass}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-cream transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className={`h-11 w-11 rounded-[14px] flex items-center justify-center ${accentClass}`}>
            {icon}
          </div>
          <span className="ds-h3">{title}</span>
          <span className="ds-chip ds-chip-muted">{items.length}</span>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-stone" /> : <ChevronDown className="h-5 w-5 text-stone" />}
      </button>

      {open && (
        <div className="divide-y divide-line border-t border-line">
          {items.map((item, i) => (
            <div key={i} className="px-8 py-6 space-y-4">
              <span className={`text-[18px] font-serif font-bold ${accentClass.includes('rose') ? 'text-clay' : accentClass.includes('amber') ? 'text-gold-deep' : 'text-forest'}`}>
                {item[labelKey] || item.skill || item.area || 'Gap'}
              </span>
              <div className="space-y-3 ds-body ds-muted">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                  <span><span className="font-semibold text-ink">Why it matters:</span> {item.why_it_matters}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-forest shrink-0 mt-0.5" />
                  <span><span className="font-semibold text-ink">Recommendation:</span> {item.recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const SkillGapView: React.FC<SkillGapViewProps> = ({ student, job, onBack }) => {
  const [data, setData] = useState<SkillGapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGap = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSkillGap(student.id, job.job_id);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Skill gap analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getSkillGap(student.id, job.job_id);
        if (!cancelled) setData(result);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Skill gap analysis failed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [student.id, job.job_id]);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="space-y-4">
        <button onClick={onBack} className="ds-btn-ghost">← Back to matches</button>
        <div className="ds-kicker !text-clay !bg-[color-mix(in_srgb,var(--color-clay)_10%,white)] !border-[color-mix(in_srgb,var(--color-clay)_22%,transparent)]">
          <Target className="h-4 w-4" />
          <span>Skill gap analysis</span>
        </div>
        <h1 className="ds-h1">Skill gap: {job.title}</h1>
        <p className="ds-lead">{job.company} · for {student.name}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="ds-card p-16 text-center space-y-4">
          <div className="ds-spinner mx-auto" />
          <p className="ds-h3">Analysing skill gaps…</p>
          <p className="ds-body ds-muted">This usually takes a few seconds.</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="ds-alert ds-alert-error">
          <AlertCircle className="ds-alert-icon" />
          <div className="ds-alert-copy">
            <strong>Analysis error</strong>
            <div>{error}</div>
            <button onClick={fetchGap} className="ds-btn-ghost mt-2">Retry</button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="ds-card p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--color-line)" strokeWidth="2.4" />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none"
                  stroke={data.overall_readiness_score >= 75 ? 'var(--color-forest)' : data.overall_readiness_score >= 50 ? 'var(--color-gold)' : 'var(--color-clay)'}
                  strokeWidth="2.4"
                  strokeDasharray={`${data.overall_readiness_score} ${100 - data.overall_readiness_score}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`font-serif text-[28px] leading-none ${scoreColor(data.overall_readiness_score)}`}>
                  {data.overall_readiness_score}%
                </span>
              </div>
            </div>
            <div className="text-center sm:text-left space-y-3 flex-1">
              <h3 className="ds-h3">Overall readiness</h3>
              <p className="ds-body ds-muted">{data.readiness_summary}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="ds-chip ds-chip-clay">{data.critical_missing.length} critical</span>
                <span className="ds-chip ds-chip-gold">{data.partially_demonstrated.length} partial</span>
                <span className="ds-chip ds-chip-forest">{data.preferred_gaps.length} nice-to-have</span>
              </div>
            </div>
            <button onClick={fetchGap} className="ds-btn-secondary !py-3 self-start">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Gap sections */}
          <GapSection
            title="Critical / Missing Skills"
            icon={<AlertTriangle className="h-4 w-4 text-[#C85A32]" />}
            items={data.critical_missing}
            labelKey="skill"
            accentClass="bg-[#C85A32]/10 text-[#C85A32]"
            borderClass="border-[#C85A32]/30"
            defaultOpen={true}
          />
          <GapSection
            title="Partially Demonstrated Skills"
            icon={<Star className="h-4 w-4 text-[#C9A63B]" />}
            items={data.partially_demonstrated}
            labelKey="skill"
            accentClass="bg-[#C9A63B]/15 text-[#8A6D1D]"
            borderClass="border-[#C9A63B]/30"
            defaultOpen={true}
          />
          <GapSection
            title="Preferred / Nice-to-Have Skills"
            icon={<CheckCircle2 className="h-4 w-4 text-[#2C5F2D]" />}
            items={data.preferred_gaps}
            labelKey="skill"
            accentClass="bg-[#2C5F2D]/10 text-[#2C5F2D]"
            borderClass="border-[#2C5F2D]/30"
            defaultOpen={false}
          />
          <GapSection
            title="Experience Gaps"
            icon={<Briefcase className="h-4 w-4 text-slate-500" />}
            items={data.experience_gaps}
            labelKey="area"
            accentClass="bg-slate-100 text-slate-600"
            borderClass="border-slate-200"
            defaultOpen={false}
          />
          <GapSection
            title="Qualification Gaps"
            icon={<GraduationCap className="h-4 w-4 text-slate-500" />}
            items={data.qualification_gaps}
            labelKey="area"
            accentClass="bg-slate-100 text-slate-600"
            borderClass="border-slate-200"
            defaultOpen={false}
          />

          {/* Empty state */}
          {data.critical_missing.length === 0 && data.partially_demonstrated.length === 0 && (
            <div className="ds-empty">
              <div className="ds-empty-icon"><CheckCircle2 /></div>
              <h3 className="ds-h3">Strong alignment</h3>
              <p className="ds-body ds-muted">No critical gaps identified. Your profile closely matches this role.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
