import React, { useState, useEffect } from 'react';
import {
  FileText, RefreshCw, AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle2, AlertTriangle, Copy, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import type { Student, JobMatch, CustomizationResponse } from '../types';
import { getCustomization } from '../services/api';

interface CustomizationViewProps {
  student: Student;
  job: JobMatch;
  onBack: () => void;
}

export const CustomizationView: React.FC<CustomizationViewProps> = ({ student, job, onBack }) => {
  const [data, setData] = useState<CustomizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'resume' | 'cover'>('resume');
  const [coverText, setCoverText] = useState('');
  const [copied, setCopied] = useState(false);
  const [bulletsOpen, setBulletsOpen] = useState(true);

  const regenerate = () => {
    setData(null); setError(null); setCoverText(''); setLoading(true);
    getCustomization(student.id, job.job_id)
      .then(r => { setData(r); setCoverText(r.cover_letter.body); })
      .catch((err: any) => setError(err.message || 'Customization generation failed.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const r = await getCustomization(student.id, job.job_id);
        if (!cancelled) { setData(r); setCoverText(r.cover_letter.body); }
      } catch (err: any) { if (!cancelled) setError(err.message || 'Customization generation failed.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [student.id, job.job_id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(coverText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const rc = data?.resume_customization;
  const cl = data?.cover_letter;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <div>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', color: 'var(--color-stone)', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 0', transition: 'color .15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-stone)')}>
          ← Back to matches
        </button>
        <div className="ds-kicker" style={{ marginBottom: '16px' }}>
          <FileText style={{ width: '16px', height: '16px' }} />
          Resume & cover letter
        </div>
        <h1 className="ds-h2" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>Tailored for {job.title}</h1>
        <p className="ds-lead" style={{ color: 'var(--color-stone)' }}>{job.company} · for {student.name}</p>
      </div>

      {loading && (
        <div className="ds-card" style={{ padding: '80px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div className="ds-spinner" />
          <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>Generating tailored materials…</h3>
          <p className="ds-body" style={{ color: 'var(--color-stone)' }}>Your profile is being compared to this role.</p>
        </div>
      )}

      {error && !loading && (
        <div className="ds-alert ds-alert-error">
          <AlertCircle className="ds-alert-icon" />
          <div className="ds-alert-copy">
            <strong>Generation error</strong>
            <div>{error}</div>
            <button onClick={regenerate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-forest)', fontWeight: '600', fontSize: '15px', padding: '8px 0' }}>Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && data && rc && cl && (
        <>
          {/* Tab bar + regenerate */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <div className="ds-card" style={{ padding: '6px', display: 'inline-flex', gap: '4px' }}>
              {(['resume', 'cover'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '10px 22px', borderRadius: '11px',
                    fontSize: '16px', fontWeight: '600', border: 'none', cursor: 'pointer',
                    background: tab === t ? 'var(--color-forest)' : 'transparent',
                    color: tab === t ? 'white' : 'var(--color-stone)',
                    transition: 'all .15s ease',
                  }}
                  onMouseEnter={e => { if (tab !== t) e.currentTarget.style.background = 'var(--color-cream)'; }}
                  onMouseLeave={e => { if (tab !== t) e.currentTarget.style.background = 'transparent'; }}
                >
                  {t === 'resume' ? 'Resume tailoring' : 'Cover letter'}
                </button>
              ))}
            </div>
            <button
              onClick={regenerate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '11px', background: 'white', border: '1.5px solid var(--color-line)', fontSize: '15px', fontWeight: '600', color: 'var(--color-stone)', cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-sage)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-stone)'; e.currentTarget.style.borderColor = 'var(--color-line)'; }}
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              Regenerate
            </button>
          </div>

          {/* Resume tab */}
          {tab === 'resume' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rc.prioritized_skills.length > 0 && (
                <div className="ds-card" style={{ padding: '32px 36px' }}>
                  <h3 className="ds-h3" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>Skills to highlight first</h3>
                  <p className="ds-body" style={{ color: 'var(--color-stone)', marginBottom: '20px' }}>Lead with these — they match the role directly.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {rc.prioritized_skills.map((s, i) => (
                      <span key={i} style={{ padding: '6px 14px', borderRadius: '999px', background: 'var(--color-leaf-bg)', color: 'var(--color-forest)', border: '1px solid rgba(26,66,32,.20)', fontSize: '14px', fontWeight: '600' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {rc.relevant_experiences.length > 0 && (
                <div className="ds-card" style={{ padding: '32px 36px' }}>
                  <h3 className="ds-h3" style={{ color: 'var(--color-ink)', marginBottom: '20px' }}>Most relevant experience</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {rc.relevant_experiences.map((ex, i) => (
                      <div key={i} className="ds-card-inset" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <ArrowRight style={{ width: '18px', height: '18px', color: 'var(--color-forest)', flexShrink: 0, marginTop: '3px' }} />
                        <div>
                          <div style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '6px' }}>
                            {ex.title} <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--color-stone)', fontWeight: '400' }}>at {ex.organization}</span>
                          </div>
                          <p style={{ fontSize: '16px', color: 'var(--color-stone)', lineHeight: '1.6', margin: 0 }}>{ex.why_relevant}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rc.relevant_projects.length > 0 && (
                <div className="ds-card" style={{ padding: '32px 36px' }}>
                  <h3 className="ds-h3" style={{ color: 'var(--color-ink)', marginBottom: '20px' }}>Most relevant projects</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {rc.relevant_projects.map((p, i) => (
                      <div key={i} className="ds-card-inset" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <ArrowRight style={{ width: '18px', height: '18px', color: 'var(--color-gold)', flexShrink: 0, marginTop: '3px' }} />
                        <div>
                          <div style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '6px' }}>{p.title}</div>
                          <p style={{ fontSize: '16px', color: 'var(--color-stone)', lineHeight: '1.6', margin: 0 }}>{p.why_relevant}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rc.rewritten_bullets.length > 0 && (
                <div className="ds-card" style={{ overflow: 'hidden' }}>
                  <button onClick={() => setBulletsOpen(!bulletsOpen)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-paper)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-gold)' }} />
                      <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>Suggested bullet rewrites</h3>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'var(--color-cream)', color: 'var(--color-stone)', border: '1px solid var(--color-line)', fontSize: '13px', fontWeight: '700' }}>{rc.rewritten_bullets.length}</span>
                    </div>
                    {bulletsOpen ? <ChevronUp style={{ width: '18px', height: '18px', color: 'var(--color-stone)' }} /> : <ChevronDown style={{ width: '18px', height: '18px', color: 'var(--color-stone)' }} />}
                  </button>
                  {bulletsOpen && (
                    <div style={{ borderTop: '1px solid var(--color-line)' }}>
                      {rc.rewritten_bullets.map((b, i) => (
                        <div key={i} style={{ padding: '28px 32px', borderBottom: i < rc.rewritten_bullets.length - 1 ? '1px solid var(--color-line)' : 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-stone)' }}>
                              <ArrowLeft style={{ width: '14px', height: '14px' }} /> Original
                            </div>
                            <p className="ds-card-inset" style={{ padding: '16px 18px', fontSize: '16px', lineHeight: '1.65', color: 'var(--color-stone)' }}>{b.original}</p>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-forest)' }}>
                              <ArrowRight style={{ width: '14px', height: '14px' }} /> Suggested
                            </div>
                            <p style={{ padding: '16px 18px', borderRadius: '12px', fontSize: '16px', lineHeight: '1.65', color: 'var(--color-charcoal)', background: 'var(--color-leaf-bg)', border: '1px solid rgba(26,66,32,.15)' }}>{b.suggested}</p>
                            <p style={{ fontSize: '13px', color: 'var(--color-stone)', fontStyle: 'italic', marginTop: '8px' }}>{b.change_note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {rc.section_order_recommendation.length > 0 && (
                <div className="ds-card" style={{ padding: '28px 32px' }}>
                  <h3 className="ds-h3" style={{ color: 'var(--color-ink)', marginBottom: '16px' }}>Recommended section order</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                    {rc.section_order_recommendation.map((sec, i) => (
                      <React.Fragment key={i}>
                        <span style={{ padding: '6px 14px', borderRadius: '999px', background: 'var(--color-cream)', color: 'var(--color-charcoal)', border: '1px solid var(--color-line)', fontSize: '14px', fontWeight: '600' }}>{i + 1}. {sec}</span>
                        {i < rc.section_order_recommendation.length - 1 && <ArrowRight style={{ width: '14px', height: '14px', color: 'var(--color-stone)' }} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {rc.tailoring_notes && (
                <div className="ds-card-inset" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '16px', lineHeight: '1.65', color: 'var(--color-charcoal)', margin: 0 }}>
                    <strong style={{ color: 'var(--color-forest)' }}>Tailoring strategy: </strong>{rc.tailoring_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cover letter tab */}
          {tab === 'cover' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="ds-card" style={{ padding: '24px 32px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-stone)', marginBottom: '10px' }}>Subject line</div>
                <p style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-ink)' }}>{cl.subject_line}</p>
              </div>

              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', fontSize: '14px', fontWeight: '600', ...(cl.hallucination_check ? { background: 'var(--color-leaf-bg)', color: 'var(--color-forest)', border: '1px solid rgba(26,66,32,.20)' } : { background: 'var(--color-clay-light)', color: 'var(--color-clay)', border: '1px solid rgba(192,82,40,.22)' }) }}>
                  {cl.hallucination_check
                    ? <><CheckCircle2 style={{ width: '14px', height: '14px' }} /> Verified: no invented content</>
                    : <><AlertTriangle style={{ width: '14px', height: '14px' }} /> Review carefully — may not match profile</>}
                </span>
              </div>

              <div className="ds-card" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', borderBottom: '1px solid var(--color-line)', background: 'var(--color-paper)' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>Cover letter — review & edit</span>
                  <button onClick={handleCopy}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', background: 'white', border: '1.5px solid var(--color-line)', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', cursor: 'pointer', transition: 'all .15s' }}>
                    <Copy style={{ width: '14px', height: '14px' }} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea
                  value={coverText}
                  onChange={e => setCoverText(e.target.value)}
                  rows={18}
                  style={{ width: '100%', padding: '28px 32px', fontSize: '16px', lineHeight: '1.7', resize: 'vertical', border: 'none', outline: 'none', background: 'var(--color-paper)', fontFamily: 'var(--font-sans)', color: 'var(--color-charcoal)' }}
                />
              </div>
              <p style={{ fontSize: '14px', color: 'var(--color-stone)', fontStyle: 'italic' }}>
                Edit before copying. Regenerate restores the original draft.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
