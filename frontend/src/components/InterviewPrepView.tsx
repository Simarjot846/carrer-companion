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
  if (questions.length === 0) return <p className="text-xs text-slate-400 italic px-2">No questions generated.</p>;

  return (
    <div className={`border ${border} rounded-xl overflow-hidden divide-y divide-[#F0EEE8]`}>
      {questions.map((q, i) => (
        <div key={i} className="bg-white">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-start justify-between px-4 py-3.5 text-left hover:bg-[#FAF9F5] transition-colors cursor-pointer gap-3"
          >
            <div className="flex items-start space-x-2.5 flex-1">
              <span className={`text-[10px] font-black mt-0.5 shrink-0 ${color}`}>Q{i + 1}</span>
              <span className="text-sm font-semibold text-[#171B16] leading-snug">{q.question}</span>
            </div>
            {openIdx === i
              ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />}
          </button>
          {openIdx === i && (
            <div className={`px-5 pb-4 pt-1 ${bg} border-t border-[#F0EEE8]`}>
              <div className="flex items-start space-x-2 text-xs">
                <BookOpen className="h-3.5 w-3.5 text-[#C9A63B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700">Prep guidance: </span>
                  <span className="text-slate-600 leading-relaxed">{q.prep_guidance}</span>
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInterviewPrep(student.id, job.job_id);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Interview prep generation failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [student.id, job.job_id]);

  const toggleTopic = (i: number) => {
    setCheckedTopics(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const totalQ = data
    ? (data.technical_questions.length + data.resume_questions.length +
       data.project_questions.length + data.role_questions.length + data.hr_questions.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-4 font-sans">
      {/* Header */}
      <div className="space-y-2">
        <button onClick={onBack} className="text-xs text-[#2C5F2D] font-semibold hover:underline cursor-pointer">
          ← Back to matches
        </button>
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] text-xs font-semibold">
          <Mic className="h-3.5 w-3.5" />
          <span>M3.3 · Interview Preparation</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#171B16]">
          Interview Prep: {job.title}
        </h2>
        <p className="text-slate-600 text-sm">{job.company} · for {student.name}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-[#E2E0D5] rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="h-10 w-10 mx-auto border-2 border-[#2C5F2D] border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-serif font-bold text-[#171B16]">Generating your personalised interview prep...</p>
            <p className="text-xs text-slate-500 mt-1">Gemini AI is building questions from your profile and this role's requirements.</p>
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

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-serif font-bold text-[#171B16]">{totalQ} interview questions generated</p>
              <p className="text-xs text-slate-500">Click any question to reveal the prep guidance. Questions are grounded in your actual profile.</p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer px-3 py-2 rounded-lg bg-[#FAF9F5] border border-[#E2E0D5]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Regenerate</span>
            </button>
          </div>

          {/* Question sections */}
          {SECTION_CONFIG.map(({ key, label, color, border, bg }) => {
            const questions = data[key];
            if (questions.length === 0) return null;
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className={`text-sm font-bold ${color}`}>{label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">{questions.length}</span>
                </div>
                <QuestionAccordion questions={questions} color={color} border={border} bg={bg} />
              </div>
            );
          })}

          {/* Topics to revise — checklist */}
          {data.topics_to_revise.length > 0 && (
            <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-[#2C5F2D]" />
                <h3 className="font-serif font-bold text-[#171B16]">Topics to Revise Before Interview</h3>
              </div>
              <p className="text-xs text-slate-500">Derived from your skill gaps and this role's technical requirements. Check off as you go.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.topics_to_revise.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => toggleTopic(i)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      checkedTopics.has(i)
                        ? 'bg-[#2C5F2D]/10 border-[#2C5F2D]/30 text-[#2C5F2D]'
                        : 'bg-[#FAF9F5] border-[#E2E0D5] text-slate-700 hover:border-[#2C5F2D]/30'
                    }`}
                  >
                    {checkedTopics.has(i)
                      ? <CheckSquare className="h-4 w-4 shrink-0" />
                      : <Square className="h-4 w-4 shrink-0 text-slate-400" />}
                    <span>{topic}</span>
                  </button>
                ))}
              </div>
              {checkedTopics.size > 0 && (
                <p className="text-xs text-[#2C5F2D] font-semibold">
                  {checkedTopics.size}/{data.topics_to_revise.length} topics reviewed ✓
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
