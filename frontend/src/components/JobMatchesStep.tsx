import React, { useState, useEffect } from 'react';
import {
  Target,
  Search,
  Filter,
  Building2,
  MapPin,
  AlertCircle,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Info,
  AlertTriangle,
  FileText,
  Mic,
} from 'lucide-react';
import type { Student, StudentMatchesResponse, JobMatch } from '../types';
import { getStudentMatches } from '../services/api';
import { JobDetailModal } from './JobDetailModal';

interface JobMatchesStepProps {
  student: Student;
  onOpenAgent: (job: JobMatch, agent: 'skill-gap' | 'customize' | 'interview-prep') => void;
}

export const JobMatchesStep: React.FC<JobMatchesStepProps> = ({ student, onOpenAgent }) => {
  const [matchesData, setMatchesData] = useState<StudentMatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentMatches(student.id, 10);
      setMatchesData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate job matches.');
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
        const res = await getStudentMatches(student.id, 10);
        if (!cancelled) setMatchesData(res);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to calculate job matches.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [student.id]);

  const filteredMatches = (matchesData?.matches || []).filter((job) => {
    const matchesQuery =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.required_skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesScore = job.match_score >= minScoreFilter;
    const matchesType =
      typeFilter === 'all' ? true : job.posting_type.toLowerCase() === typeFilter.toLowerCase();

    return matchesQuery && matchesScore && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in py-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] text-xs font-semibold">
            <Target className="h-3.5 w-3.5" />
            <span>Step 3 of 3 · RAG Retrieval & LLM Evaluation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#171B16]">
            Ranked Job Matches for {student.name}
          </h2>
          <p className="text-slate-600 text-sm font-sans">
            Postings retrieved via pgvector vector embeddings & scored by Google Gemini AI.
          </p>
        </div>

        <button
          onClick={fetchMatches}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2 bg-white hover:bg-[#FAF9F5] text-slate-700 text-xs font-semibold rounded-xl border border-[#E2E0D5] flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#2C5F2D]' : 'text-slate-500'}`} />
          <span>Re-run Agent Reranker</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4 animate-fade-in">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="skeleton h-5 w-48 rounded-lg" />
                <div className="skeleton h-7 w-20 rounded-full" />
              </div>
              <div className="skeleton h-3 w-full rounded-lg" />
              <div className="skeleton h-3 w-3/4 rounded-lg" />
              <div className="flex gap-2 pt-1">
                {[...Array(4)].map((_, j) => <div key={j} className="skeleton h-6 w-16 rounded-md" />)}
              </div>
            </div>
          ))}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 animate-pulse">
              Embedding profile · Vector search · Gemini scoring...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 text-xs font-sans space-y-2 text-left">
          <div className="flex items-center space-x-2 font-bold text-rose-700">
            <AlertCircle className="h-5 w-5" />
            <span>Matching Pipeline Error</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* Main Matches Dashboard */}
      {!loading && !error && matchesData && (
        <div className="space-y-6 font-sans">
          
          {/* Search & Filter Bar */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search job title, company, or required skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FAF9F5] border border-[#D5D3C5] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D]"
              />
            </div>

            {/* Minimum Score Filter */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                className="bg-[#FAF9F5] border border-[#D5D3C5] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] cursor-pointer"
              >
                <option value={0}>All Match Scores</option>
                <option value={80}>80%+ High Fit</option>
                <option value={60}>60%+ Moderate Fit</option>
              </select>
            </div>

            {/* Posting Type Filter */}
            <div className="w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#D5D3C5] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] cursor-pointer"
              >
                <option value="all">All Posting Types</option>
                <option value="internship">Internships Only</option>
                <option value="full-time">Full-time Only</option>
              </select>
            </div>

          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-800">{filteredMatches.length}</strong> of{' '}
              <strong className="text-slate-800">{matchesData.total_matches}</strong> ranked matches
            </span>
            <span>Sorted by LLM Match Score (descending)</span>
          </div>

          {/* Ranked Cards List */}
          {filteredMatches.length === 0 ? (
            <div className="bg-white border border-[#E2E0D5] rounded-2xl p-8 text-center space-y-2">
              <Info className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-serif font-bold text-[#171B16]">No job matches found matching current filters.</p>
              <p className="text-xs text-slate-500">Try clearing your search terms or lowering minimum match score.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((job, index) => (
                <div
                  key={job.job_id}
                  className="bg-white hover:bg-[#FAF9F5] border border-[#E2E0D5] hover:border-[#2C5F2D]/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 space-y-4 text-left group"
                >
                  {/* Top Row: Title, Company, Score Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      
                      {/* Rank Badge */}
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-[#FAF9F5] border border-[#E2E0D5] flex flex-col items-center justify-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Rank</span>
                        <span className="text-sm font-black font-serif text-[#2C5F2D]">#{index + 1}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-serif font-bold text-[#171B16] group-hover:text-[#2C5F2D] transition-colors">
                            {job.title}
                          </h3>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FAF9F5] text-slate-700 border border-[#E2E0D5]">
                            {job.posting_type}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center space-x-1 font-semibold text-slate-800">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>{job.company}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{job.location}</span>
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">{job.experience_level}</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="self-start sm:self-auto flex items-center space-x-3">
                      <div
                        className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-2xs border ${
                          job.match_score >= 80
                            ? 'bg-[#2C5F2D] text-white border-[#2C5F2D]'
                            : job.match_score >= 60
                            ? 'bg-[#C9A63B] text-white border-[#C9A63B]'
                            : 'bg-slate-700 text-white border-slate-700'
                        }`}
                      >
                        {job.match_score}% Match
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendation Reasoning Callout */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#FAF9F5] to-[#F3F2EC] border border-[#2C5F2D]/15 text-xs text-slate-700 flex items-start space-x-2.5">
                    <Sparkles className="h-4 w-4 text-[#C9A63B] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-[#2C5F2D]">AI Recommendation Rationale:</span>
                      <p className="text-slate-600 leading-relaxed">{job.reasoning}</p>
                    </div>
                  </div>

                  {/* Required Skills vs Missing Skill Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    
                    {/* Required Skills */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Required Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.required_skills.slice(0, 6).map((skill, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#2C5F2D]/10 text-[#2C5F2D] border border-[#2C5F2D]/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skill Gaps (Terracotta / Soft Amber tags) */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#C85A32] uppercase tracking-wider">
                        Skill Gaps:
                      </span>
                      {job.missing_skills.length === 0 ? (
                        <div className="text-xs text-[#2C5F2D] font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Complete Skill Alignment</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {job.missing_skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#C85A32]/15 text-[#C85A32] border border-[#C85A32]/30"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Card Action */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#E2E0D5]">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onOpenAgent(job, 'skill-gap')}
                        className="flex items-center space-x-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#C85A32]/10 text-[#C85A32] border border-[#C85A32]/20 hover:bg-[#C85A32]/20 transition-all cursor-pointer"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>Skill Gap</span>
                      </button>
                      <button
                        onClick={() => onOpenAgent(job, 'customize')}
                        className="flex items-center space-x-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#2C5F2D]/10 text-[#2C5F2D] border border-[#2C5F2D]/20 hover:bg-[#2C5F2D]/20 transition-all cursor-pointer"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Tailor Resume</span>
                      </button>
                      <button
                        onClick={() => onOpenAgent(job, 'interview-prep')}
                        className="flex items-center space-x-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#C9A63B]/15 text-[#8A6D1D] border border-[#C9A63B]/30 hover:bg-[#C9A63B]/25 transition-all cursor-pointer"
                      >
                        <Mic className="h-3 w-3" />
                        <span>Interview Prep</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="text-xs text-[#2C5F2D] hover:text-[#234E25] font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-all cursor-pointer"
                    >
                      <span>Full details</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Detail Modal */}
      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

    </div>
  );
};
