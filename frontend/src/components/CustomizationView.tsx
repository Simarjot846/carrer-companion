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
  return <span className={`ds-chip ${color === 'green' ? 'ds-chip-forest' : 'ds-chip-gold'}`}>{text}</span>;
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
    <div className="space-y-10 animate-fade-in">
      <div className="space-y-4">
        <button onClick={onBack} className="ds-btn-ghost">← Back to matches</button>
        <div className="ds-kicker">
          <FileText className="h-4 w-4" />
          <span>Resume & cover letter</span>
        </div>
        <h1 className="ds-h1">Tailored for {job.title}</h1>
        <p className="ds-lead">{job.company} · for {student.name}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="ds-card p-16 text-center space-y-4">
          <div className="ds-spinner mx-auto" />
          <p className="ds-h3">Generating tailored materials…</p>
          <p className="ds-body ds-muted">Your profile is being compared to this role.</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="ds-alert ds-alert-error">
          <AlertCircle className="ds-alert-icon" />
          <div className="ds-alert-copy">
            <strong>Generation error</strong>
            <div>{error}</div>
            <button onClick={regenerate} className="ds-btn-ghost mt-2">Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && data && rc && cl && (
        <>
          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 ds-card p-1.5 w-fit">
            {(['resume', 'cover'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-[12px] text-[16px] font-semibold cursor-pointer ${
                  tab === t ? 'bg-forest text-white' : 'text-stone hover:text-ink hover:bg-cream'
                }`}
              >
                {t === 'resume' ? 'Resume tailoring' : 'Cover letter'}
              </button>
            ))}
            <button onClick={regenerate} className="ds-btn-ghost px-3">
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>
          </div>

          {/* RESUME TAB */}
          {tab === 'resume' && (
            <div className="space-y-5">
              {/* Prioritised skills */}
              {rc.prioritized_skills.length > 0 && (
                <div className="ds-card p-8 space-y-4">
                  <h3 className="ds-h3">Skills to highlight first</h3>
                  <p className="ds-body ds-muted">Lead with these — they match the role directly.</p>
                  <div className="flex flex-wrap gap-2">
                    {rc.prioritized_skills.map((s, i) => <Tag key={i} text={s} color="green" />)}
                  </div>
                </div>
              )}

              {/* Relevant experiences */}
              {rc.relevant_experiences.length > 0 && (
                <div className="ds-card p-8 space-y-5">
                  <h3 className="ds-h3">Most relevant experience</h3>
                  <div className="space-y-3">
                    {rc.relevant_experiences.map((ex, i) => (
                      <div key={i} className="flex items-start gap-4 p-5 rounded-[16px] ds-card-inset">
                        <ArrowRight className="h-5 w-5 text-forest shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[18px] font-serif font-bold text-ink">{ex.title} <span className="font-sans font-normal text-stone text-[16px]">at {ex.organization}</span></div>
                          <div className="ds-body ds-muted mt-1">{ex.why_relevant}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevant projects */}
              {rc.relevant_projects.length > 0 && (
                <div className="ds-card p-8 space-y-5">
                  <h3 className="ds-h3">Most relevant projects</h3>
                  <div className="space-y-3">
                    {rc.relevant_projects.map((p, i) => (
                      <div key={i} className="flex items-start gap-4 p-5 rounded-[16px] ds-card-inset">
                        <ArrowRight className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[18px] font-serif font-bold text-ink">{p.title}</div>
                          <div className="ds-body ds-muted mt-1">{p.why_relevant}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rewritten bullets — side-by-side */}
              {rc.rewritten_bullets.length > 0 && (
                <div className="ds-card overflow-hidden">
                  <button
                    onClick={() => setBulletsOpen(!bulletsOpen)}
                    className="w-full flex items-center justify-between px-8 py-5 hover:bg-cream transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-gold" />
                      <span className="ds-h3">Suggested bullet rewrites</span>
                      <span className="ds-chip ds-chip-muted">{rc.rewritten_bullets.length}</span>
                    </div>
                    {bulletsOpen ? <ChevronUp className="h-5 w-5 text-stone" /> : <ChevronDown className="h-5 w-5 text-stone" />}
                  </button>
                  {bulletsOpen && (
                    <div className="divide-y divide-line border-t border-line">
                      {rc.rewritten_bullets.map((b, i) => (
                        <div key={i} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="ds-label !mb-0 flex items-center gap-2">
                              <ArrowLeft className="h-4 w-4" /> Original
                            </div>
                            <p className="ds-body ds-muted ds-card-inset p-5">{b.original}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="ds-label !mb-0 !text-forest flex items-center gap-2">
                              <ArrowRight className="h-4 w-4" /> Suggested
                            </div>
                            <p className="ds-body p-5 rounded-[16px] bg-forest/5 border border-forest/20">{b.suggested}</p>
                            <p className="ds-caption italic">{b.change_note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section order */}
              {rc.section_order_recommendation.length > 0 && (
                <div className="ds-card p-8 space-y-4">
                  <h3 className="ds-h3">Recommended section order</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {rc.section_order_recommendation.map((sec, i) => (
                      <React.Fragment key={i}>
                        <span className="ds-chip ds-chip-muted">{i + 1}. {sec}</span>
                        {i < rc.section_order_recommendation.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-stone" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Tailoring notes */}
              {rc.tailoring_notes && (
                <div className="ds-card-inset p-6 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                  <p className="ds-body"><span className="font-semibold text-forest">Tailoring strategy: </span>{rc.tailoring_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* COVER LETTER TAB */}
          {tab === 'cover' && (
            <div className="space-y-4">
              {/* Subject line */}
              <div className="ds-card p-8 space-y-3">
                <div className="ds-label">Subject line</div>
                <p className="text-[18px] font-semibold text-ink">{cl.subject_line}</p>
              </div>

              {/* Hallucination check badge */}
              <div className={`ds-chip ${cl.hallucination_check ? 'ds-chip-forest' : 'ds-chip-clay'}`}>
                {cl.hallucination_check
                  ? <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Verified: no invented content</>
                  : <><AlertTriangle className="h-4 w-4 mr-1.5" /> Review carefully — may not match the profile</>
                }
              </div>

              {/* Editable body */}
              <div className="ds-card overflow-hidden">
                <div className="flex items-center justify-between px-8 py-4 border-b border-line bg-cream">
                  <span className="text-[16px] font-semibold text-ink">Cover letter — review & edit</span>
                  <button onClick={handleCopy} className="ds-btn-secondary !py-2.5 !px-4">
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                  rows={18}
                  className="w-full px-8 py-6 ds-body resize-y focus:outline-none bg-paper"
                />
              </div>
              <p className="ds-caption italic">
                Edit before copying. Regenerate restores the original draft.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
