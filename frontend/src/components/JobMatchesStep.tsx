import React, { useState, useEffect } from 'react';
import {
  Target, Search, Filter, Building2, MapPin, AlertCircle,
  Sparkles, ChevronRight, RefreshCw, CheckCircle2, AlertTriangle,
  FileText, Mic, Cpu, Info,
} from 'lucide-react';
import type { Student, StudentMatchesResponse, JobMatch } from '../types';
import { getStudentMatches } from '../services/api';
import { JobDetailModal } from './JobDetailModal';
import { ScoreRing } from './ui';

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

  const fetchMatches = async (forceRefresh = false) => {
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

  const filteredMatches = (matchesData?.matches || []).filter(job => {
    const q = searchQuery.toLowerCase();
    const matchesQ = !q || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q) ||
      job.required_skills.some(s => s.toLowerCase().includes(q));
    return matchesQ && job.match_score >= minScoreFilter &&
      (typeFilter === 'all' || job.posting_type.toLowerCase() === typeFilter.toLowerCase());
  });

  const scoreLabel = (score: number) => score >= 80 ? 'High Fit' : score >= 60 ? 'Moderate Fit' : 'Developing';
  const scoreStyle = (score: number): React.CSSProperties => score >= 80
    ? { background: 'var(--color-leaf-bg)', color: 'var(--color-forest)', border: '1px solid rgba(26,66,32,.20)' }
    : score >= 60
      ? { background: 'rgba(201,150,58,.10)', color: 'var(--color-gold-deep)', border: '1px solid rgba(201,150,58,.25)' }
      : { background: 'var(--color-clay-light)', color: 'var(--color-clay)', border: '1px solid rgba(192,82,40,.22)' };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="ds-kicker">
            <Target style={{ width: '16px', height: '16px' }} />
            Step 3 of 3 · RAG Retrieval & LLM Evaluation
          </div>
          <h1 className="ds-h2" style={{ color: 'var(--color-ink)' }}>
            Ranked matches for {student.name}
          </h1>
          <p className="ds-body" style={{ color: 'var(--color-stone)' }}>
            Postings retrieved via sentence-transformers dense embeddings & scored by Google Gemini AI.
          </p>
        </div>
        <button
          onClick={() => fetchMatches(true)}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', borderRadius: '12px',
            background: 'white', border: '1.5px solid var(--color-line)',
            fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? .6 : 1,
            transition: 'all .15s ease',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--color-sage)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; }}
        >
          <RefreshCw style={{ width: '15px', height: '15px', ...(loading ? { animation: 'spin .8s linear infinite', color: 'var(--color-forest)' } : { color: 'var(--color-stone)' }) }} />
          Re-run Agent Reranker
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="ds-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Cpu style={{ width: '18px', height: '18px', color: 'var(--color-forest)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--color-ink)', fontFamily: 'var(--font-serif)' }}>
                RAG Matching Pipeline Executing…
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                '1. Embedding candidate profile',
                '2. Dense similarity search',
                '3. Gemini AI scoring & gaps',
              ].map((step, i) => (
                <div key={step} className="ds-card-inset" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: i === 1 ? 'var(--color-gold)' : 'var(--color-forest)',
                    animation: `ping 1s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-charcoal)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
          {[0, 1, 2].map(i => (
            <div key={i} className="ds-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton" style={{ height: '24px', width: '200px', borderRadius: '8px' }} />
                <div className="skeleton" style={{ height: '72px', width: '72px', borderRadius: '50%' }} />
              </div>
              <div className="skeleton" style={{ height: '16px', width: '100%', borderRadius: '6px' }} />
              <div className="skeleton" style={{ height: '16px', width: '75%', borderRadius: '6px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                {[80, 64, 72, 56].map(w => <div key={w} className="skeleton" style={{ height: '28px', width: `${w}px`, borderRadius: '999px' }} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="ds-alert ds-alert-error">
          <AlertCircle className="ds-alert-icon" />
          <div className="ds-alert-copy">
            <strong>Matching Pipeline Error</strong>
            <div>{error}</div>
            <button onClick={() => fetchMatches()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-forest)', fontWeight: '600', padding: '8px 0', fontSize: '15px' }}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && matchesData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Search & filter bar */}
          <div className="ds-card" style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--color-stone)' }} />
              <input
                type="text"
                placeholder="Search job title, company, or skill…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', paddingLeft: '42px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px',
                  background: 'var(--color-paper)', border: '1.5px solid var(--color-line)',
                  borderRadius: '11px', fontSize: '16px', color: 'var(--color-ink)', outline: 'none',
                  fontFamily: 'var(--font-sans)', transition: 'border-color .15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-forest-mid)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-line)')}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter style={{ width: '15px', height: '15px', color: 'var(--color-stone)' }} />
              <select
                value={minScoreFilter}
                onChange={e => setMinScoreFilter(Number(e.target.value))}
                style={{ padding: '11px 14px', background: 'var(--color-paper)', border: '1.5px solid var(--color-line)', borderRadius: '11px', fontSize: '15px', color: 'var(--color-ink)', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-sans)' }}
              >
                <option value={0}>All scores</option>
                <option value={80}>80%+ High Fit</option>
                <option value={60}>60%+ Moderate</option>
              </select>
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '11px 14px', background: 'var(--color-paper)', border: '1.5px solid var(--color-line)', borderRadius: '11px', fontSize: '15px', color: 'var(--color-ink)', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-sans)' }}
            >
              <option value="all">All types</option>
              <option value="internship">Internships</option>
              <option value="full-time">Full-time</option>
            </select>
          </div>

          {/* Summary row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '0 2px' }}>
            <span style={{ fontSize: '16px', color: 'var(--color-stone)' }}>
              Showing <strong style={{ color: 'var(--color-ink)' }}>{filteredMatches.length}</strong> of{' '}
              <strong style={{ color: 'var(--color-ink)' }}>{matchesData.total_matches}</strong> ranked matches
            </span>
            <span style={{ fontSize: '14px', color: 'var(--color-stone)' }}>Sorted by LLM Match Score ↓</span>
          </div>

          {/* Empty state */}
          {filteredMatches.length === 0 ? (
            <div className="ds-card" style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--color-cream)', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info style={{ width: '24px', height: '24px', color: 'var(--color-stone)' }} />
              </div>
              <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>No matches for current filters</h3>
              <p className="ds-body" style={{ color: 'var(--color-stone)' }}>Try clearing your search or lowering the minimum score filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="stagger">
              {filteredMatches.map((job, index) => (
                <JobCard
                  key={job.job_id}
                  job={job}
                  index={index}
                  scoreLabel={scoreLabel}
                  scoreStyle={scoreStyle}
                  onOpenAgent={onOpenAgent}
                  onViewDetails={() => setSelectedJob(job)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:.5; } 50% { opacity:1; } }
        @keyframes ping { 0%,100% { transform:scale(1); opacity:.6; } 50% { transform:scale(1.5); opacity:1; } }
      `}</style>
    </div>
  );
};

/* ── Individual job card ─────────────────────────────────────────── */
function JobCard({
  job, index, scoreLabel, scoreStyle, onOpenAgent, onViewDetails,
}: {
  job: JobMatch;
  index: number;
  scoreLabel: (s: number) => string;
  scoreStyle: (s: number) => React.CSSProperties;
  onOpenAgent: (job: JobMatch, agent: 'skill-gap' | 'customize' | 'interview-prep') => void;
  onViewDetails: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="ds-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '32px 36px',
        border: `1px solid ${hovered ? 'var(--color-sage)' : 'var(--color-line)'}`,
        background: hovered ? 'rgba(26,66,32,.015)' : 'white',
        transition: 'all .2s ease',
        display: 'flex', flexDirection: 'column', gap: '24px',
      }}
    >
      {/* Title + score row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
          {/* Rank badge */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '13px', flexShrink: 0,
            background: 'var(--color-paper)', border: '1px solid var(--color-line)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--color-stone)' }}>Rank</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: '700', color: 'var(--color-forest)', lineHeight: 1 }}>#{index + 1}</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: '700', color: 'var(--color-ink)', lineHeight: 1.2 }}>
                {job.title}
              </h3>
              <span style={{
                padding: '3px 10px', borderRadius: '999px',
                background: 'var(--color-cream)', color: 'var(--color-stone)',
                border: '1px solid var(--color-line)', fontSize: '12px', fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: '.06em',
              }}>{job.posting_type}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', fontSize: '15px', color: 'var(--color-stone)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--color-charcoal)' }}>
                <Building2 style={{ width: '14px', height: '14px', color: 'var(--color-stone)' }} />
                {job.company}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <MapPin style={{ width: '14px', height: '14px' }} />
                {job.location}
              </span>
              <span>{job.experience_level}</span>
            </div>
          </div>
        </div>

        {/* Score ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <ScoreRing score={job.match_score} size={88} stroke={7} />
          <span style={{
            padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700',
            ...scoreStyle(job.match_score),
          }}>{scoreLabel(job.match_score)}</span>
        </div>
      </div>

      {/* AI Rationale */}
      <div style={{
        padding: '20px 24px', borderRadius: '14px',
        background: 'linear-gradient(135deg, var(--color-paper) 0%, var(--color-leaf-bg) 100%)',
        border: '1px solid rgba(26,66,32,.12)',
        display: 'flex', alignItems: 'flex-start', gap: '14px',
      }}>
        <Sparkles style={{ width: '18px', height: '18px', color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-forest)', display: 'block', marginBottom: '8px' }}>
            AI Recommendation Rationale
          </span>
          <p style={{ fontSize: '16px', lineHeight: '1.65', color: 'var(--color-charcoal)', margin: 0 }}>{job.reasoning}</p>
        </div>
      </div>

      {/* Skills grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-stone)', marginBottom: '10px' }}>
            Required Skills
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {job.required_skills.slice(0, 7).map((skill, i) => (
              <span key={i} style={{
                padding: '5px 12px', borderRadius: '999px',
                background: 'var(--color-leaf-bg)', color: 'var(--color-forest)',
                border: '1px solid rgba(26,66,32,.18)', fontSize: '13px', fontWeight: '600',
              }}>{skill}</span>
            ))}
          </div>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-clay)', marginBottom: '10px' }}>
            Skill Gaps
          </span>
          {job.missing_skills.length === 0 ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-forest)', fontSize: '15px', fontWeight: '600' }}>
              <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              Complete alignment
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {job.missing_skills.map((skill, i) => (
                <span key={i} style={{
                  padding: '5px 12px', borderRadius: '999px',
                  background: 'var(--color-clay-light)', color: 'var(--color-clay)',
                  border: '1px solid rgba(192,82,40,.22)', fontSize: '13px', fontWeight: '600',
                }}>{skill}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ paddingTop: '8px', borderTop: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <ActionBtn
            icon={<AlertTriangle style={{ width: '14px', height: '14px' }} />}
            label="Skill Gap"
            bg="var(--color-clay-light)" color="var(--color-clay)"
            border="rgba(192,82,40,.22)"
            hoverBg="rgba(192,82,40,.18)"
            onClick={() => onOpenAgent(job, 'skill-gap')}
          />
          <ActionBtn
            icon={<FileText style={{ width: '14px', height: '14px' }} />}
            label="Tailor Resume"
            bg="var(--color-leaf-bg)" color="var(--color-forest)"
            border="rgba(26,66,32,.18)"
            hoverBg="rgba(26,66,32,.12)"
            onClick={() => onOpenAgent(job, 'customize')}
          />
          <ActionBtn
            icon={<Mic style={{ width: '14px', height: '14px' }} />}
            label="Interview Prep"
            bg="rgba(201,150,58,.10)" color="var(--color-gold-deep)"
            border="rgba(201,150,58,.22)"
            hoverBg="rgba(201,150,58,.18)"
            onClick={() => onOpenAgent(job, 'interview-prep')}
          />
        </div>
        <button
          onClick={onViewDetails}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '15px', fontWeight: '700', color: 'var(--color-forest)',
            transition: 'all .15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.gap = '10px')}
          onMouseLeave={e => (e.currentTarget.style.gap = '6px')}
        >
          Full details
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, bg, color, border, hoverBg, onClick }: {
  icon: React.ReactNode; label: string;
  bg: string; color: string; border: string; hoverBg: string;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        padding: '9px 16px', borderRadius: '10px',
        background: hov ? hoverBg : bg, color,
        border: `1px solid ${border}`, cursor: 'pointer',
        fontSize: '14px', fontWeight: '600',
        transition: 'all .15s ease',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
