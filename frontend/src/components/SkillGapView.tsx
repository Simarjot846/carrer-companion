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
    <div className={`bg-white border ${borderClass} rounded-2xl overflow-hidden shadow-sm`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#FAF9F5] transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${accentClass}`}>
            {icon}
          </div>
          <span className="font-serif font-bold text-[#171B16] text-base">{title}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {items.length}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="divide-y divide-[#F0EEE8] border-t border-[#E2E0D5]">
          {items.map((item, i) => (
            <div key={i} className="px-6 py-5 space-y-3">
              <div className="flex items-start space-x-2">
                <span className={`text-sm font-bold ${accentClass.includes('rose') ? 'text-[#C85A32]' : accentClass.includes('amber') ? 'text-[#8A6D1D]' : 'text-[#2C5F2D]'}`}>
                  {item[labelKey] || item.skill || item.area || 'Gap'}
                </span>
              </div>
              <div className="space-y-2 text-xs font-sans">
                <div className="flex items-start space-x-2 text-slate-600">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#C9A63B] shrink-0 mt-0.5" />
                  <span><span className="font-semibold text-slate-700">Why it matters:</span> {item.why_it_matters}</span>
                </div>
                <div className="flex items-start space-x-2 text-slate-600">
                  <Lightbulb className="h-3.5 w-3.5 text-[#2C5F2D] shrink-0 mt-0.5" />
                  <span><span className="font-semibold text-slate-700">Recommendation:</span> {item.recommendation}</span>
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-4 font-sans">
      {/* Header */}
      <div className="space-y-2">
        <button onClick={onBack} className="text-xs text-[#2C5F2D] font-semibold hover:underline cursor-pointer flex items-center space-x-1">
          <span>← Back to matches</span>
        </button>
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#C85A32]/10 text-[#C85A32] text-xs font-semibold">
          <Target className="h-3.5 w-3.5" />
          <span>M3.1 · Skill Gap Analysis</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#171B16]">
          Skill Gap: {job.title}
        </h2>
        <p className="text-slate-600 text-sm">{job.company} · for {student.name}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-[#E2E0D5] rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="h-10 w-10 mx-auto border-2 border-[#2C5F2D] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-serif font-bold text-[#171B16]">Analysing skill gaps with Gemini AI...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-2">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
            <AlertCircle className="h-4 w-4" />
            <span>Analysis Error</span>
          </div>
          <p className="text-xs text-rose-700">{error}</p>
          <button onClick={fetchGap} className="text-xs text-[#2C5F2D] font-semibold underline cursor-pointer">Retry</button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && data && (
        <div className="space-y-5">
          {/* Readiness score banner */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#EAE8DE" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none"
                  stroke={data.overall_readiness_score >= 75 ? '#2C5F2D' : data.overall_readiness_score >= 50 ? '#C9A63B' : '#C85A32'}
                  strokeWidth="3"
                  strokeDasharray={`${data.overall_readiness_score} ${100 - data.overall_readiness_score}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-black font-serif ${scoreColor(data.overall_readiness_score)}`}>
                  {data.overall_readiness_score}%
                </span>
              </div>
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h3 className="font-serif font-bold text-[#171B16] text-lg">Overall Readiness Score</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{data.readiness_summary}</p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-[#C85A32]/10 text-[#C85A32] font-semibold border border-[#C85A32]/20">
                  {data.critical_missing.length} Critical gaps
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#C9A63B]/10 text-[#8A6D1D] font-semibold border border-[#C9A63B]/20">
                  {data.partially_demonstrated.length} Partial
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] font-semibold border border-[#2C5F2D]/20">
                  {data.preferred_gaps.length} Nice-to-have
                </span>
              </div>
            </div>
            <button
              onClick={fetchGap}
              className="self-start ml-auto text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 bg-[#FAF9F5] px-3 py-1.5 rounded-lg border border-[#E2E0D5] cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
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
            <div className="bg-[#2C5F2D]/5 border border-[#2C5F2D]/20 rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-[#2C5F2D] mx-auto" />
              <p className="font-serif font-bold text-[#171B16]">Strong alignment — no critical gaps identified.</p>
              <p className="text-xs text-slate-500">Your profile closely matches this role's requirements.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
