import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import type { Student, JobMatch, CustomizationResponse } from '../types';
import { getCustomization } from '../services/api';

interface CustomizationViewProps {
  student: Student;
  job: JobMatch;
  onBack: () => void;
}

function Tag({ text, color }: { text: string; color: 'green' | 'amber' }) {
  const cls = color === 'green'
    ? 'bg-[#2C5F2D]/10 text-[#2C5F2D] border-[#2C5F2D]/20'
    : 'bg-[#C9A63B]/15 text-[#8A6D1D] border-[#C9A63B]/30';
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${cls}`}>{text}</span>
  );
}

export const CustomizationView: React.FC<CustomizationViewProps> = ({ student, job, onBack }) => {
  const [data, setData] = useState<CustomizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'resume' | 'cover'>('resume');
  const [coverText, setCoverText] = useState('');
  const [copied, setCopied] = useState(false);
  const [bulletsOpen, setBulletsOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const regenerate = () => {
    setData(null);
    setError(null);
    setCoverText('');
    setLoading(true);
    getCustomization(student.id, job.job_id)
      .then((result) => {
        setData(result);
        setCoverText(result.cover_letter.body);
      })
      .catch((err: any) => setError(err.message || 'Customization generation failed.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getCustomization(student.id, job.job_id);
        if (!cancelled) {
          setData(result);
          setCoverText(result.cover_letter.body);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Customization generation failed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [student.id, job.job_id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(coverText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const rc = data?.resume_customization;
  const cl = data?.cover_letter;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in py-4 font-sans">
      {/* Header */}
      <div className="space-y-2">
        <button onClick={onBack} className="text-xs text-[#2C5F2D] font-semibold hover:underline cursor-pointer">
          ← Back to matches
        </button>
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] text-xs font-semibold">
          <FileText className="h-3.5 w-3.5" />
          <span>M3.2 · Resume & Cover Letter Customization</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#171B16]">
          Tailored for: {job.title}
        </h2>
        <p className="text-slate-600 text-sm">{job.company} · for {student.name}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-[#E2E0D5] rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="h-10 w-10 mx-auto border-2 border-[#2C5F2D] border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-serif font-bold text-[#171B16]">Generating tailored resume & cover letter...</p>
            <p className="text-xs text-slate-500 mt-1">Gemini AI is analysing your profile against the job requirements.</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
            <AlertCircle className="h-4 w-4" /><span>Generation Error</span>
          </div>
          <p className="text-xs text-rose-700">{error}</p>
          <button onClick={fetchData} className="text-xs text-[#2C5F2D] font-semibold underline cursor-pointer">Retry</button>
        </div>
      )}

      {!loading && !error && data && rc && cl && (
        <>
          {/* Tab bar */}
          <div className="flex space-x-2 bg-white border border-[#E2E0D5] rounded-xl p-1 shadow-sm w-fit">
            {(['resume', 'cover'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tab === t
                    ? 'bg-[#2C5F2D] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF9F5]'
                }`}
              >
                {t === 'resume' ? 'Resume Tailoring' : 'Cover Letter'}
              </button>
            ))}
            <button
              onClick={fetchData}
              className="ml-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-[#FAF9F5] flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Regenerate</span>
            </button>
          </div>

          {/* RESUME TAB */}
          {tab === 'resume' && (
            <div className="space-y-5">
              {/* Prioritised skills */}
              {rc.prioritized_skills.length > 0 && (
                <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-3">
                  <h3 className="font-serif font-bold text-[#171B16]">Skills to Highlight First</h3>
                  <p className="text-xs text-slate-500">Lead with these skills — they directly match the job's requirements.</p>
                  <div className="flex flex-wrap gap-2">
                    {rc.prioritized_skills.map((s, i) => <Tag key={i} text={s} color="green" />)}
                  </div>
                </div>
              )}

              {/* Relevant experiences */}
              {rc.relevant_experiences.length > 0 && (
                <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-3">
                  <h3 className="font-serif font-bold text-[#171B16]">Most Relevant Experience Entries</h3>
                  <div className="space-y-3">
                    {rc.relevant_experiences.map((ex, i) => (
                      <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#E2E0D5]">
                        <ArrowRight className="h-4 w-4 text-[#2C5F2D] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-[#171B16]">{ex.title} <span className="font-normal text-slate-500">at {ex.organization}</span></div>
                          <div className="text-xs text-slate-600 mt-0.5">{ex.why_relevant}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevant projects */}
              {rc.relevant_projects.length > 0 && (
                <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-3">
                  <h3 className="font-serif font-bold text-[#171B16]">Most Relevant Projects</h3>
                  <div className="space-y-3">
                    {rc.relevant_projects.map((p, i) => (
                      <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#E2E0D5]">
                        <ArrowRight className="h-4 w-4 text-[#C9A63B] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-[#171B16]">{p.title}</div>
                          <div className="text-xs text-slate-600 mt-0.5">{p.why_relevant}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rewritten bullets — side-by-side */}
              {rc.rewritten_bullets.length > 0 && (
                <div className="bg-white border border-[#E2E0D5] rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setBulletsOpen(!bulletsOpen)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-[#C9A63B]" />
                      <span className="font-serif font-bold text-[#171B16]">Suggested Bullet Rewrites</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{rc.rewritten_bullets.length}</span>
                    </div>
                    {bulletsOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  {bulletsOpen && (
                    <div className="divide-y divide-[#F0EEE8] border-t border-[#E2E0D5]">
                      {rc.rewritten_bullets.map((b, i) => (
                        <div key={i} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                              <ArrowLeft className="h-3 w-3" /><span>Original</span>
                            </div>
                            <p className="text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                              {b.original}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-1.5 text-[#2C5F2D] font-semibold uppercase tracking-wider text-[10px]">
                              <ArrowRight className="h-3 w-3" /><span>Suggested</span>
                            </div>
                            <p className="text-slate-800 bg-[#2C5F2D]/5 border border-[#2C5F2D]/20 rounded-lg p-3 leading-relaxed font-medium">
                              {b.suggested}
                            </p>
                            <p className="text-slate-500 italic text-[11px]">📝 {b.change_note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section order */}
              {rc.section_order_recommendation.length > 0 && (
                <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-3">
                  <h3 className="font-serif font-bold text-[#171B16]">Recommended Section Order</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {rc.section_order_recommendation.map((sec, i) => (
                      <React.Fragment key={i}>
                        <span className="px-3 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#E2E0D5] text-xs font-semibold text-slate-700">
                          {i + 1}. {sec}
                        </span>
                        {i < rc.section_order_recommendation.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-slate-300" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Tailoring notes */}
              {rc.tailoring_notes && (
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#2C5F2D]/20 flex items-start space-x-2.5">
                  <Sparkles className="h-4 w-4 text-[#C9A63B] shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-[#2C5F2D]">Tailoring strategy: </span>
                    {rc.tailoring_notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COVER LETTER TAB */}
          {tab === 'cover' && (
            <div className="space-y-4">
              {/* Subject line */}
              <div className="bg-white border border-[#E2E0D5] rounded-2xl p-5 shadow-sm space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject line</div>
                <p className="text-sm font-semibold text-[#171B16]">{cl.subject_line}</p>
              </div>

              {/* Hallucination check badge */}
              <div className={`flex items-center space-x-2 text-xs font-semibold px-3.5 py-2 rounded-xl w-fit border ${
                cl.hallucination_check
                  ? 'bg-[#2C5F2D]/10 text-[#2C5F2D] border-[#2C5F2D]/20'
                  : 'bg-[#C85A32]/10 text-[#C85A32] border-[#C85A32]/20'
              }`}>
                {cl.hallucination_check
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /><span>Verified: no invented content detected</span></>
                  : <><AlertTriangle className="h-3.5 w-3.5" /><span>Review carefully — content may not match your profile</span></>
                }
              </div>

              {/* Editable body */}
              <div className="bg-white border border-[#E2E0D5] rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E0D5] bg-[#FAF9F5]">
                  <span className="text-xs font-bold text-slate-700">Cover Letter — Review & Edit</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer px-3 py-1.5 rounded-lg bg-white border border-[#E2E0D5] hover:border-[#2C5F2D]/40 transition-all"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                  rows={18}
                  className="w-full px-6 py-5 text-sm text-slate-800 leading-relaxed font-sans resize-y focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] focus:ring-inset"
                />
              </div>
              <p className="text-xs text-slate-400 italic">
                You can edit the letter directly above before copying it. The original is still available via Regenerate.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
