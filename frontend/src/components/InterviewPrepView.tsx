import React, { useState, useEffect } from 'react';
import {
  Mic,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import type { Student, JobMatch, InterviewPrepResponse, InterviewQuestion } from '../types';
import { getInterviewPrep } from '../services/api';

interface InterviewPrepViewProps {
  student: Student;
  job: JobMatch;
  onBack: () => void;
}

const SECTION_CONFIG = [
  { key: 'technical_questions' as const, label: 'Technical Questions', color: 'text-[#2C5F2D]', border: 'border-[#2C5F2D]/30', bg: 'bg-[#2C5F2D]/5' },
  { key: 'resume_questions' as const, label: 'Resume-Based Questions', color: 'text-[#8A6D1D]', border: 'border-[#C9A63B]/30', bg: 'bg-[#C9A63B]/5' },
  { key: 'project_questions' as const, label: 'Project-Based Questions', color: 'text-[#C85A32]', border: 'border-[#C85A32]/30', bg: 'bg-[#C85A32]/5' },
  { key: 'role_questions' as const, label: 'Role-Specific Questions', color: 'text-slate-700', border: 'border-slate-200', bg: 'bg-slate-50' },
  { key: 'hr_questions' as const, label: 'General / HR Questions', color: 'text-slate-500', border: 'border-slate-200', bg: 'bg-slate-50' },
];

function QuestionAccordion({
  questions,
  color,
  border,
  bg,
}: {
  questions: InterviewQuestion[];
  color: string;
  border: string;
  bg: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (questions.length === 0) return <p className="ds-body ds-muted italic px-2">No questions generated.</p>;

  return (
    <div className={`border ${border} rounded-[16px] overflow-hidden divide-y divide-line`}>
      {questions.map((q, i) => (
        <div key={i} className="bg-paper">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-start justify-between px-6 py-5 text-left hover:bg-cream transition-colors cursor-pointer gap-4"
          >
            <div className="flex items-start gap-3 flex-1">
              <span className={`text-[14px] font-bold mt-1 shrink-0 ${color}`}>Q{i + 1}</span>
              <span className="text-[18px] font-semibold text-ink leading-snug">{q.question}</span>
            </div>
            {openIdx === i
              ? <ChevronUp className="h-5 w-5 text-stone shrink-0 mt-1" />
              : <ChevronDown className="h-5 w-5 text-stone shrink-0 mt-1" />}
          </button>
          {openIdx === i && (
            <div className={`px-6 pb-6 pt-2 ${bg} border-t border-line animate-fade-in`}>
              <div className="flex items-start gap-3 ds-body">
                <BookOpen className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-ink">Preparation guidance: </span>
                  <span className="ds-muted">{q.prep_guidance}</span>
                </div>
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
    setData(null);
    setError(null);
    setLoading(true);
    getInterviewPrep(student.id, job.job_id)
      .then((result) => setData(result))
      .catch((err: any) => setError(err.message || 'Interview prep generation failed.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getInterviewPrep(student.id, job.job_id);
        if (!cancelled) setData(result);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Interview prep generation failed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [student.id, job.job_id]);

  const toggleTopic = (i: number) => {
    setCheckedTopics(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  };

  const totalQ = data
    ? (data.technical_questions.length + data.resume_questions.length +
       data.project_questions.length + data.role_questions.length + data.hr_questions.length)
    : 0;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="space-y-4 text-left">
        <button onClick={onBack} className="ds-btn-ghost">← Back to matches</button>
        <div className="ds-kicker">
          <Mic className="h-4 w-4" />
          <span>Interview prep</span>
        </div>
        <h1 className="ds-h1">Interview prep: {job.title}</h1>
        <p className="ds-lead">{job.company} · for {student.name}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="ds-card p-16 text-center space-y-4">
          <div className="ds-spinner mx-auto" />
          <p className="ds-h3">Building your interview package…</p>
          <p className="ds-body ds-muted">Questions are drawn from this role and your verified profile.</p>
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

      {!loading && !error && data && (
        <div className="space-y-8">
          <div className="ds-card p-8 flex flex-wrap items-center justify-between gap-4 text-left">
            <div>
              <p className="ds-h3">{totalQ} preparation questions</p>
              <p className="ds-body ds-muted mt-2">Open any question for preparation guidance. All of them stay inside your real experience.</p>
            </div>
            <button onClick={regenerate} className="ds-btn-secondary">
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>
          </div>

          <div className="space-y-8 text-left stagger-children">
            {SECTION_CONFIG.map(({ key, label, color, border, bg }) => {
              const questions = data[key];
              if (questions.length === 0) return null;
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className={`ds-h3 ${color}`}>{label}</h3>
                    <span className="ds-chip ds-chip-muted">{questions.length}</span>
                  </div>
                  <QuestionAccordion questions={questions} color={color} border={border} bg={bg} />
                </div>
              );
            })}
          </div>

          {data.topics_to_revise.length > 0 && (
            <div className="ds-card p-8 space-y-5 text-left">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-forest" />
                <h3 className="ds-h3">Topics to revise</h3>
              </div>
              <p className="ds-body ds-muted">From your gaps and this role’s requirements. Check them off as you go.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.topics_to_revise.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => toggleTopic(i)}
                    className={`flex items-center gap-3 p-4 rounded-[16px] border text-[16px] font-medium text-left cursor-pointer ${
                      checkedTopics.has(i)
                        ? 'bg-forest/10 border-forest/30 text-forest'
                        : 'bg-cream border-line text-ink hover:border-forest/30'
                    }`}
                  >
                    {checkedTopics.has(i)
                      ? <CheckSquare className="h-5 w-5 shrink-0" />
                      : <Square className="h-5 w-5 shrink-0 text-stone" />}
                    <span>{topic}</span>
                  </button>
                ))}
              </div>
              {checkedTopics.size > 0 && (
                <p className="ds-body text-forest font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold" />
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
