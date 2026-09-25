import React, { useState, useEffect } from 'react';
import {
  Target,
  Search,
  Filter,
  Building2,
  MapPin,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Info,
  AlertTriangle,
  FileText,
  Mic,
  Cpu,
} from 'lucide-react';
import type { Student, StudentMatchesResponse, JobMatch } from '../types';
import { getStudentMatches } from '../services/api';
import { JobDetailModal } from './JobDetailModal';
import { ScoreRing, Chip, EmptyState, AlertBanner } from './ui';

interface JobMatchesStepProps {
  student: Student;
  onOpenAgent: (job: JobMatch, agent: 'skill-gap' | 'customize' | 'interview-prep') => void;
}

export const JobMatchesStep: React.FC<JobMatchesStepProps> = ({ student, onOpenAgent }) => {
  const [matchesData, setMatchesData] = useState<StudentMatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  const fetchMatches = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentMatches(student.id, 10, forceRefresh);
      setMatchesData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate job matches.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMatches(false); }, [student.id]);

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
    <div className="space-y-12 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4 text-left">
          <div className="ds-kicker">
            <Target className="h-4 w-4" />
            <span>Step 3 of 3 · Matches</span>
          </div>
          <h1 className="ds-h1">Ranked matches for {student.name}</h1>
          <p className="ds-lead max-w-2xl">
            Retrieved by semantic search, then scored with a written explanation of fit.
          </p>
        </div>

        <button
          onClick={() => fetchMatches(true)}
          disabled={loading}
          className="ds-btn-secondary self-start"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-forest' : ''}`} />
          Re-run matching
        </button>
      </div>

      {loading && (
        <div className="space-y-8 animate-fade-in">
          <div className="ds-card p-8 space-y-5">
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-forest animate-pulse" />
              <h2 className="ds-h3">Matching in progress</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                'Embedding the candidate profile',
                'Searching related postings',
                'Scoring fit and naming gaps',
              ].map((label) => (
                <div key={label} className="ds-card-inset p-5 flex items-center gap-3 ds-body">
                  <div className="h-2.5 w-2.5 rounded-full bg-forest animate-ping shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="ds-card p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="skeleton h-8 w-64 rounded-lg" />
                  <div className="skeleton h-20 w-20 rounded-full" />
                </div>
                <div className="skeleton h-4 w-full rounded-lg" />
                <div className="skeleton h-4 w-3/4 rounded-lg" />
                <div className="flex gap-2 pt-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="skeleton h-8 w-20 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && !loading && (
        <AlertBanner
          tone="error"
          title="Matching could not finish"
          action={
            <button onClick={() => fetchMatches()} className="ds-btn-secondary !py-3 shrink-0">Retry</button>
          }
        >
          {error}
        </AlertBanner>
      )}

      {!loading && !error && matchesData && (
        <div className="space-y-8">
          <div className="ds-card p-5 flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone" />
              <input
                type="text"
                placeholder="Search title, company, or skill"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ds-input pl-12"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-stone hidden sm:block" />
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                className="ds-select w-full md:w-[200px]"
              >
                <option value={0}>All match scores</option>
                <option value={80}>80%+ high fit</option>
                <option value={60}>60%+ moderate fit</option>
              </select>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="ds-select w-full md:w-[200px]"
            >
              <option value="all">All posting types</option>
              <option value="internship">Internships only</option>
              <option value="full-time">Full-time only</option>
            </select>
          </div>

          <div className="flex items-center justify-between ds-caption px-1">
            <span>
              Showing <strong className="text-ink">{filteredMatches.length}</strong> of{' '}
              <strong className="text-ink">{matchesData.total_matches}</strong> ranked matches
            </span>
            <span>Sorted by match score</span>
          </div>

          {filteredMatches.length === 0 ? (
            <EmptyState
              icon={<Info className="h-6 w-6" />}
              title="No matches for these filters"
              body="Clear the search or lower the minimum score to see more roles."
            />
          ) : (
            <div className="space-y-6 stagger-children">
              {filteredMatches.map((job, index) => (
                <article key={job.job_id} className="card-hover ds-card p-8 sm:p-10 space-y-8 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex items-start gap-5 min-w-0">
                      <div className="h-14 w-14 shrink-0 rounded-[16px] bg-cream border border-line flex flex-col items-center justify-center">
                        <span className="ds-caption !text-[11px] uppercase tracking-wider">Rank</span>
                        <span className="font-serif text-[24px] leading-none text-forest">#{index + 1}</span>
                      </div>
                      <div className="space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="ds-h3">{job.title}</h2>
                          <Chip tone="muted">{job.posting_type}</Chip>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 ds-body ds-muted">
                          <span className="inline-flex items-center gap-2 font-semibold text-ink">
                            <Building2 className="h-4 w-4 text-stone" />
                            {job.company}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-stone" />
                            {job.location}
                          </span>
                          <span>{job.experience_level}</span>
                        </div>
                      </div>
                    </div>
                    <ScoreRing score={job.match_score} size={104} />
                  </div>

                  <div className="ds-card-inset p-6">
                    <div className="flex items-center gap-2 text-gold-deep font-semibold text-[14px] mb-3">
                      <Sparkles className="h-4 w-4" />
                      Why this match
                    </div>
                    <p className="ds-body">{job.reasoning}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="ds-label !mb-0">Required skills</div>
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills.slice(0, 8).map((skill, i) => (
                          <Chip key={i} tone="forest">{skill}</Chip>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="ds-label !mb-0 !text-clay">Skill gaps</div>
                      {job.missing_skills.length === 0 ? (
                        <div className="ds-body text-forest font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Complete skill alignment
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {job.missing_skills.map((skill, i) => (
                            <Chip key={i} tone="clay">{skill}</Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-line">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => onOpenAgent(job, 'skill-gap')} className="ds-btn-tertiary !text-clay !bg-[color-mix(in_srgb,var(--color-clay)_10%,white)] !border-[color-mix(in_srgb,var(--color-clay)_22%,transparent)]">
                        <AlertTriangle className="h-4 w-4" />
                        Skill gap
                      </button>
                      <button onClick={() => onOpenAgent(job, 'customize')} className="ds-btn-tertiary">
                        <FileText className="h-4 w-4" />
                        Tailor resume
                      </button>
                      <button onClick={() => onOpenAgent(job, 'interview-prep')} className="ds-btn-tertiary !text-gold-deep !bg-[color-mix(in_srgb,var(--color-gold)_14%,white)] !border-[color-mix(in_srgb,var(--color-gold)_28%,transparent)]">
                        <Mic className="h-4 w-4" />
                        Interview prep
                      </button>
                    </div>
                    <button onClick={() => setSelectedJob(job)} className="ds-btn-ghost">
                      Full details
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
};
