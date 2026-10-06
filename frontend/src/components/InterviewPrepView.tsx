import React, { useState, useEffect } from 'react';
import {
  Mic, AlertCircle, RefreshCw, ChevronDown, ChevronUp,
  BookOpen, CheckSquare, Square, Sparkles,
} from 'lucide-react';
import type { Student, JobMatch, InterviewPrepResponse, InterviewQuestion } from '../types';
import { getInterviewPrep } from '../services/api';

interface InterviewPrepViewProps {
  student: Student;
  job: JobMatch;
  onBack: () => void;
}

const SECTION_CONFIG = [
  { key: 'technical_questions' as const, label: 'Technical Questions',   color: 'var(--color-forest)',    border: 'rgba(26,66,32,.20)',    bg: 'var(--color-leaf-bg)' },
  { key: 'resume_questions' as const,    label: 'Resume-Based Questions', color: 'var(--color-gold-deep)', border: 'rgba(201,150,58,.25)',   bg: 'rgba(201,150,58,.08)' },
  { key: 'project_questions' as const,   label: 'Project-Based Questions', color: 'var(--color-clay)',     border: 'rgba(192,82,40,.22)',   bg: 'var(--color-clay-light)' },
  { key: 'role_questions' as const,      label: 'Role-Specific Questions', color: 'var(--color-charcoal)', border: 'var(--color-line)',     bg: 'var(--color-cream)' },
  { key: 'hr_questions' as const,        label: 'General / HR Questions',  color: 'var(--color-stone)',    border: 'var(--color-line)',     bg: 'var(--color-paper)' },
];

function QuestionAccordion({ questions, color, border, bg }: {
  questions: InterviewQuestion[];
  color: string; border: string; bg: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!questions.length) return <p style={{ fontSize: '16px', color: 'var(--color-stone)', fontStyle: 'italic', padding: '8px' }}>No questions generated.</p>;

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: '14px', overflow: 'hidden' }}>
      {questions.map((q, i) => (
        <div key={i} style={{ background: i % 2 === 0 ? 'white' : 'var(--color-paper)', borderTop: i > 0 ? '1px solid var(--color-line)' : 'none' }}>
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            style={{
              width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer',
              gap: '16px', textAlign: 'left', transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-leaf-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color, flexShrink: 0, marginTop: '3px' }}>Q{i + 1}</span>
              <span style={{ fontSize: '17px', fontWeight: '600', color: 'var(--color-ink)', lineHeight: '1.45' }}>{q.question}</span>
            </div>
            {openIdx === i
              ? <ChevronUp style={{ width: '18px', height: '18px', color: 'var(--color-stone)', flexShrink: 0, marginTop: '3px' }} />
              : <ChevronDown style={{ width: '18px', height: '18px', color: 'var(--color-stone)', flexShrink: 0, marginTop: '3px' }} />}
          </button>
          {openIdx === i && (
            <div className="animate-fade-in" style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ padding: '18px 20px', borderRadius: '12px', background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <BookOpen style={{ width: '18px', height: '18px', color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '16px', lineHeight: '1.65', color: 'var(--color-charcoal)', margin: 0 }}>
                  <strong style={{ color: 'var(--color-ink)' }}>Preparation guidance: </strong>
                  {q.prep_guidance}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export const InterviewPrepView: React.FC<InterviewPrepViewProps> = ({ student, job, onBack }) => {
  const [data, setData] = useState<InterviewPrepResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedTopics, setCheckedTopics] = useState<Set<number>>(new Set());

  const regenerate = () => {
    setData(null); setError(null); setLoading(true);
    getInterviewPrep(student.id, job.job_id)
      .then(r => setData(r))
      .catch((err: any) => setError(err.message || 'Interview prep generation failed.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try { const r = await getInterviewPrep(student.id, job.job_id); if (!cancelled) setData(r); }
      catch (err: any) { if (!cancelled) setError(err.message || 'Interview prep generation failed.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [student.id, job.job_id]);

  const toggleTopic = (i: number) => {
    setCheckedTopics(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const totalQ = data
    ? data.technical_questions.length + data.resume_questions.length +
      data.project_questions.length + data.role_questions.length + data.hr_questions.length
    : 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <div>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', color: 'var(--color-stone)', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 0', transition: 'color .15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-stone)')}>
          ← Back to matches
        </button>
        <div className="ds-kicker" style={{ marginBottom: '16px', background: 'rgba(201,150,58,.10)', borderColor: 'rgba(201,150,58,.22)', color: 'var(--color-gold-deep)' }}>
          <Mic style={{ width: '16px', height: '16px' }} />
          Interview prep
        </div>
        <h1 className="ds-h2" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>Interview prep: {job.title}</h1>
        <p className="ds-lead" style={{ color: 'var(--color-stone)' }}>{job.company} · for {student.name}</p>
      </div>

      {loading && (
        <div className="ds-card" style={{ padding: '80px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div className="ds-spinner" />
          <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>Building your interview package…</h3>
          <p className="ds-body" style={{ color: 'var(--color-stone)' }}>Questions are drawn from this role and your verified profile.</p>
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

      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Summary card */}
          <div className="ds-card" style={{ padding: '28px 36px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <h3 className="ds-h3" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>{totalQ} preparation questions</h3>
              <p className="ds-body" style={{ color: 'var(--color-stone)' }}>Open any question for guidance. All stay inside your real experience.</p>
            </div>
            <button
              onClick={regenerate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 18px', borderRadius: '11px', background: 'white', border: '1.5px solid var(--color-line)', fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)', cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-sage)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; }}
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              Regenerate
            </button>
          </div>

          {/* Question sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {SECTION_CONFIG.map(({ key, label, color, border, bg }) => {
              const questions = data[key];
              if (!questions.length) return null;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <h3 className="ds-h3" style={{ color }}>{label}</h3>
                    <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'var(--color-cream)', color: 'var(--color-stone)', border: '1px solid var(--color-line)', fontSize: '13px', fontWeight: '700' }}>{questions.length}</span>
                  </div>
                  <QuestionAccordion questions={questions} color={color} border={border} bg={bg} />
                </div>
              );
            })}
          </div>

          {/* Topics to revise */}
          {data.topics_to_revise.length > 0 && (
            <div className="ds-card" style={{ padding: '32px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                <BookOpen style={{ width: '22px', height: '22px', color: 'var(--color-forest)' }} />
                <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>Topics to revise</h3>
              </div>
              <p className="ds-body" style={{ color: 'var(--color-stone)', marginBottom: '20px' }}>Check them off as you go. From your gaps and this role's requirements.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {data.topics_to_revise.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => toggleTopic(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 18px', borderRadius: '12px',
                      fontSize: '16px', fontWeight: '500', textAlign: 'left', cursor: 'pointer',
                      transition: 'all .15s ease', border: '1.5px solid',
                      ...(checkedTopics.has(i)
                        ? { background: 'var(--color-leaf-bg)', borderColor: 'rgba(26,66,32,.25)', color: 'var(--color-forest)' }
                        : { background: 'var(--color-paper)', borderColor: 'var(--color-line)', color: 'var(--color-ink)' }),
                    }}
                  >
                    {checkedTopics.has(i)
                      ? <CheckSquare style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                      : <Square style={{ width: '18px', height: '18px', flexShrink: 0, color: 'var(--color-stone)' }} />}
                    {topic}
                  </button>
                ))}
              </div>
              {checkedTopics.size > 0 && (
                <p style={{ fontSize: '16px', color: 'var(--color-forest)', fontWeight: '600', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles style={{ width: '16px', height: '16px', color: 'var(--color-gold)' }} />
                  {checkedTopics.size}/{data.topics_to_revise.length} topics reviewed
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
