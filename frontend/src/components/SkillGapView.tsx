import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle2, AlertCircle, Lightbulb,
  Target, GraduationCap, Briefcase, Star, RefreshCw,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import type { Student, JobMatch, SkillGapResponse, GapItem } from '../types';
import { getSkillGap } from '../services/api';
import { ScoreRing } from './ui';

interface SkillGapViewProps {
  student: Student;
  job: JobMatch;
  onBack: () => void;
}

function GapSection({
  title, icon, items, labelKey, accentColor, accentBg, borderColor, defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  items: GapItem[];
  labelKey: 'skill' | 'area';
  accentColor: string;
  accentBg: string;
  borderColor: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;

  return (
    <div className="ds-card" style={{ overflow: 'hidden', border: `1px solid ${borderColor}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 32px', background: 'none', border: 'none', cursor: 'pointer',
          transition: 'background .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-paper)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: accentBg, color: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {React.cloneElement(icon as React.ReactElement, { style: { width: '18px', height: '18px' } })}
          </div>
          <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>{title}</h3>
          <span style={{
            padding: '3px 10px', borderRadius: '999px',
            background: 'var(--color-cream)', color: 'var(--color-stone)',
            border: '1px solid var(--color-line)', fontSize: '13px', fontWeight: '700',
          }}>{items.length}</span>
        </div>
        {open
          ? <ChevronUp style={{ width: '18px', height: '18px', color: 'var(--color-stone)' }} />
          : <ChevronDown style={{ width: '18px', height: '18px', color: 'var(--color-stone)' }} />}
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${borderColor}` }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                padding: '28px 32px',
                borderBottom: i < items.length - 1 ? '1px solid var(--color-line)' : 'none',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: '700', color: accentColor, marginBottom: '16px' }}>
                {item[labelKey] || item.skill || item.area || 'Gap'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertTriangle style={{ width: '18px', height: '18px', color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '16px', lineHeight: '1.65', color: 'var(--color-charcoal)', margin: 0 }}>
                    <strong style={{ color: 'var(--color-ink)' }}>Why it matters: </strong>
                    {item.why_it_matters}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Lightbulb style={{ width: '18px', height: '18px', color: 'var(--color-forest)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '16px', lineHeight: '1.65', color: 'var(--color-charcoal)', margin: 0 }}>
                    <strong style={{ color: 'var(--color-ink)' }}>Recommendation: </strong>
                    {item.recommendation}
                  </p>
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
    try { setData(await getSkillGap(student.id, job.job_id)); }
    catch (err: any) { setError(err.message || 'Skill gap analysis failed.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try { const r = await getSkillGap(student.id, job.job_id); if (!cancelled) setData(r); }
      catch (err: any) { if (!cancelled) setError(err.message || 'Skill gap analysis failed.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [student.id, job.job_id]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <div>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '600', color: 'var(--color-stone)', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 0', transition: 'color .15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-stone)')}
        >
          ← Back to matches
        </button>
        <div className="ds-kicker" style={{ marginBottom: '16px', background: 'var(--color-clay-light)', borderColor: 'rgba(192,82,40,.22)', color: 'var(--color-clay)' }}>
          <Target style={{ width: '16px', height: '16px' }} />
          Skill gap analysis
        </div>
        <h1 className="ds-h2" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>Skill gap: {job.title}</h1>
        <p className="ds-lead" style={{ color: 'var(--color-stone)' }}>{job.company} · for {student.name}</p>
      </div>

      {loading && (
        <div className="ds-card" style={{ padding: '80px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div className="ds-spinner" />
          <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>Analysing skill gaps…</h3>
          <p className="ds-body" style={{ color: 'var(--color-stone)' }}>This usually takes a few seconds.</p>
        </div>
      )}

      {error && !loading && (
        <div className="ds-alert ds-alert-error">
          <AlertCircle className="ds-alert-icon" />
          <div className="ds-alert-copy">
            <strong>Analysis error</strong>
            <div>{error}</div>
            <button onClick={fetchGap} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-forest)', fontWeight: '600', fontSize: '15px', padding: '8px 0' }}>Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Readiness card */}
          <div className="ds-card" style={{ padding: '32px 36px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '32px' }}>
            <ScoreRing score={data.overall_readiness_score} size={112} stroke={8} />
            <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>Overall readiness</h3>
              <p style={{ fontSize: '16px', lineHeight: '1.65', color: 'var(--color-charcoal)' }}>{data.readiness_summary}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                <span className="ds-chip ds-chip-clay">{data.critical_missing.length} critical</span>
                <span className="ds-chip ds-chip-gold">{data.partially_demonstrated.length} partial</span>
                <span className="ds-chip ds-chip-forest">{data.preferred_gaps.length} nice-to-have</span>
              </div>
            </div>
            <button
              onClick={fetchGap}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '11px 18px', borderRadius: '11px',
                background: 'white', border: '1.5px solid var(--color-line)',
                fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)',
                cursor: 'pointer', alignSelf: 'flex-start', transition: 'all .15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-sage)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; }}
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              Refresh
            </button>
          </div>

          <GapSection
            title="Critical / Missing Skills"
            icon={<AlertTriangle />}
            items={data.critical_missing}
            labelKey="skill"
            accentColor="var(--color-clay)"
            accentBg="var(--color-clay-light)"
            borderColor="rgba(192,82,40,.25)"
            defaultOpen={true}
          />
          <GapSection
            title="Partially Demonstrated Skills"
            icon={<Star />}
            items={data.partially_demonstrated}
            labelKey="skill"
            accentColor="var(--color-gold-deep)"
            accentBg="rgba(201,150,58,.10)"
            borderColor="rgba(201,150,58,.28)"
            defaultOpen={true}
          />
          <GapSection
            title="Preferred / Nice-to-Have Skills"
            icon={<CheckCircle2 />}
            items={data.preferred_gaps}
            labelKey="skill"
            accentColor="var(--color-forest)"
            accentBg="var(--color-leaf-bg)"
            borderColor="rgba(26,66,32,.20)"
            defaultOpen={false}
          />
          <GapSection
            title="Experience Gaps"
            icon={<Briefcase />}
            items={data.experience_gaps}
            labelKey="area"
            accentColor="var(--color-charcoal)"
            accentBg="var(--color-cream)"
            borderColor="var(--color-line)"
            defaultOpen={false}
          />
          <GapSection
            title="Qualification Gaps"
            icon={<GraduationCap />}
            items={data.qualification_gaps}
            labelKey="area"
            accentColor="var(--color-charcoal)"
            accentBg="var(--color-cream)"
            borderColor="var(--color-line)"
            defaultOpen={false}
          />

          {data.critical_missing.length === 0 && data.partially_demonstrated.length === 0 && (
            <div className="ds-card" style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-leaf-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 style={{ width: '28px', height: '28px', color: 'var(--color-forest)' }} />
              </div>
              <h3 className="ds-h3" style={{ color: 'var(--color-ink)' }}>Strong alignment</h3>
              <p className="ds-body" style={{ color: 'var(--color-stone)' }}>No critical gaps identified. Your profile closely matches this role.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
