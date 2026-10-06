import React from 'react';
import {
  ArrowRight, FileCheck2, Target, Brain, ShieldCheck,
  Zap, MessageSquare, Layers, TrendingUp, Bot, Cpu,
  Compass, Award, CheckCircle2, Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const STEPS = [
  {
    n: '01',
    icon: <FileCheck2 className="h-6 w-6" />,
    title: 'Upload Resume',
    desc: 'PyMuPDF extracts text deterministically. Gemini AI structures skills, education, and projects into a verified, schema-validated profile.',
  },
  {
    n: '02',
    icon: <Target className="h-6 w-6" />,
    title: 'Get Matched',
    desc: 'Sentence-transformer embeddings and cosine similarity retrieve top roles. Gemini then scores fit and identifies exact skill gaps.',
  },
  {
    n: '03',
    icon: <Brain className="h-6 w-6" />,
    title: 'Prepare & Apply',
    desc: 'Tailored resume bullets, a role-specific cover letter, and a structured interview prep package — all generated from your real profile data.',
  },
];

const FEATURES = [
  {
    icon: <Target className="h-5 w-5" />,
    title: 'Transparent Match Rationale',
    desc: 'We explain exactly why a job matches your background — specific skill alignments, not an opaque black-box score.',
    color: 'var(--color-forest)',
    bg: 'var(--color-leaf-bg)',
  },
  {
    icon: <Layers className="h-5 w-5" />,
    title: 'Deep Skill Gap Analysis',
    desc: 'Five-category breakdown of missing technologies with role-specific explanations and actionable recommendations.',
    color: 'var(--color-clay)',
    bg: 'var(--color-clay-light)',
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: 'Structured Interview Prep',
    desc: 'Interview questions derived from your actual projects and work history with per-question preparation guidance.',
    color: 'var(--color-forest)',
    bg: 'var(--color-leaf-bg)',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Schema-Validated Extraction',
    desc: 'LLM outputs are strictly validated before database commit. Hallucinations never enter your candidate profile.',
    color: 'var(--color-gold-deep)',
    bg: 'rgba(201,150,58,.10)',
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'AI Resume & Cover Letter',
    desc: 'Role-specific cover letters grounded only in your real experience — never invented details. Side-by-side bullet rewrites.',
    color: 'var(--color-forest)',
    bg: 'var(--color-leaf-bg)',
  },
  {
    icon: <Bot className="h-5 w-5" />,
    title: 'Grounded Career Assistant',
    desc: 'Conversational assistant grounded in your profile data to help compare roles, understand gaps, and prepare for interviews.',
    color: 'var(--color-gold-deep)',
    bg: 'rgba(201,150,58,.10)',
  },
];

const TECH_LAYERS = [
  {
    label: 'Layer 1 · Extraction',
    body: 'PyMuPDF for deterministic PDF text extraction · Gemini AI for JSON schema structuring · Schema validation before DB commit',
    badge: 'FastAPI + SQLAlchemy',
  },
  {
    label: 'Layer 2 · Dense Retrieval',
    body: 'sentence-transformers all-MiniLM-L6-v2 local embeddings · 384-dim dense vectors · Cosine similarity over indexed postings',
    badge: 'Dense Retrieval',
  },
  {
    label: 'Layer 3 · Agent Scoring',
    body: 'Gemini Flash reranker · Skill gap analysis · Resume tailoring · Interview prep · Career assistant multi-turn chat',
    badge: 'Gemini AI',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section
        style={{
          background: 'linear-gradient(160deg, #0A100B 0%, #0F1810 45%, #111A12 100%)',
          color: 'var(--color-paper)',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: '-160px', right: '-160px',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(26,66,32,.30) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-200px', left: '-200px',
          width: '700px', height: '700px',
          background: 'radial-gradient(circle, rgba(201,150,58,.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: .025, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(163,196,167,1) 1px, transparent 1px), linear-gradient(90deg, rgba(163,196,167,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="ds-shell" style={{ paddingTop: '96px', paddingBottom: '96px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '64px', alignItems: 'center' }}
               className="hero-grid">
            {/* Left column */}
            <div style={{ maxWidth: '680px' }} className="stagger">
              {/* Kicker */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 16px', borderRadius: '999px',
                background: 'rgba(26,66,32,.30)', border: '1px solid rgba(163,196,167,.20)',
                color: 'var(--color-leaf)', fontSize: '14px', fontWeight: '700',
                letterSpacing: '.02em', marginBottom: '32px',
              }}>
                <Sparkles style={{ width: '14px', height: '14px', color: 'var(--color-gold)' }} />
                RAG · Dense Similarity · Gemini AI · 4 Intelligent Agents
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: 'var(--font-serif)', fontSize: 'clamp(42px, 6vw, 64px)',
                fontWeight: '700', lineHeight: '1.08', letterSpacing: '-0.025em',
                color: 'var(--color-paper)', marginBottom: '28px',
              }}>
                Land the internship<br />
                you{' '}
                <span className="text-gradient-warm">actually</span>
                {' '}want.
              </h1>

              {/* Sub */}
              <p style={{
                fontSize: '20px', lineHeight: '1.6', color: 'rgba(247,245,239,.72)',
                maxWidth: '540px', marginBottom: '40px',
              }}>
                Stop applying blindly. Our AI pipeline parses your resume, semantically matches
                your profile against real internship postings, analyses your skill gaps, tailors your
                materials, and prepares you for the interview.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginBottom: '56px' }}>
                <button
                  onClick={onGetStarted}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    padding: '16px 32px', borderRadius: '14px',
                    background: 'var(--color-forest)', color: 'white',
                    fontSize: '17px', fontWeight: '700', border: 'none', cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(26,66,32,.50)',
                    transition: 'all .15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  Start Matching
                  <ArrowRight style={{ width: '20px', height: '20px', color: 'var(--color-amber)' }} />
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(247,245,239,.55)', fontSize: '15px' }}>
                  <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--color-leaf)' }} />
                  Upload PDF and go — no manual form entry
                </span>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '32px', paddingTop: '32px',
                borderTop: '1px solid rgba(255,255,255,.08)',
              }}>
                {[
                  { val: '160+', label: 'Indexed Postings' },
                  { val: '4', label: 'AI Agents' },
                  { val: 'Gemini', label: 'LLM Engine' },
                ].map(s => (
                  <div key={s.val}>
                    <div style={{
                      fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: '700',
                      color: 'var(--color-amber)', lineHeight: 1,
                    }}>{s.val}</div>
                    <div style={{ fontSize: '14px', color: 'rgba(247,245,239,.50)', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — product mockup card */}
            <div style={{ display: 'flex', justifyContent: 'center' }} className="animate-float">
              <MockupCard />
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════════════ */}
      <section style={{ padding: '128px 0', background: 'var(--color-paper)' }}>
        <div className="ds-shell">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="ds-kicker" style={{ marginBottom: '20px' }}>
              <Compass style={{ width: '16px', height: '16px' }} />
              3 steps · from PDF to offer-ready
            </div>
            <h2 className="ds-h1" style={{ color: 'var(--color-ink)', marginBottom: '16px' }}>How it works</h2>
            <p className="ds-lead" style={{ maxWidth: '480px', margin: '0 auto', color: 'var(--color-stone)' }}>
              From resume upload to interview-ready in under two minutes.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }} className="stagger">
            {STEPS.map(s => (
              <div key={s.n} className="ds-card card-lift" style={{ padding: '40px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: 'var(--color-leaf-bg)', color: 'var(--color-forest)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.icon}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-serif)', fontSize: '48px', fontWeight: '700',
                    color: 'var(--color-mist)', lineHeight: 1,
                  }}>{s.n}</span>
                </div>
                <h3 className="ds-h3" style={{ color: 'var(--color-ink)', marginBottom: '12px' }}>{s.title}</h3>
                <p className="ds-body" style={{ color: 'var(--color-stone)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═══════════════════════════════════════════════════ */}
      <section style={{
        padding: '128px 0',
        background: 'var(--color-cream)',
        borderTop: '1px solid var(--color-line)',
        borderBottom: '1px solid var(--color-line)',
      }}>
        <div className="ds-shell">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="ds-kicker" style={{ marginBottom: '20px', background: 'rgba(201,150,58,.10)', borderColor: 'rgba(201,150,58,.22)', color: 'var(--color-gold-deep)' }}>
              <Zap style={{ width: '16px', height: '16px' }} />
              What makes this different
            </div>
            <h2 className="ds-h1" style={{ color: 'var(--color-ink)', marginBottom: '16px' }}>
              6 features built to stand out
            </h2>
            <p className="ds-lead" style={{ maxWidth: '500px', margin: '0 auto', color: 'var(--color-stone)' }}>
              Every feature is grounded in your actual resume data — never generic templates, never invented details.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }} className="stagger">
            {FEATURES.map(f => (
              <div key={f.title} className="ds-card card-lift" style={{ padding: '28px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '13px', flexShrink: 0,
                  background: f.bg, color: f.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <div>
                  <h4 className="ds-h4" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>{f.title}</h4>
                  <p className="ds-body" style={{ color: 'var(--color-stone)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TECH STACK ═════════════════════════════════════════════════ */}
      <section style={{ padding: '128px 0', background: 'var(--color-paper)' }}>
        <div className="ds-shell">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="ds-kicker" style={{ marginBottom: '20px', background: 'var(--color-cream)', borderColor: 'var(--color-line)', color: 'var(--color-stone)' }}>
              <Cpu style={{ width: '16px', height: '16px' }} />
              Technical Architecture
            </div>
            <h2 className="ds-h2" style={{ color: 'var(--color-ink)' }}>Built on real AI infrastructure</h2>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }} className="stagger">
            {TECH_LAYERS.map(t => (
              <div key={t.label} className="ds-card" style={{ padding: '32px' }}>
                <div style={{
                  fontSize: '12px', fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '.1em', color: 'var(--color-forest)', marginBottom: '16px',
                }}>{t.label}</div>
                <p className="ds-body" style={{ color: 'var(--color-stone)', marginBottom: '20px' }}>{t.body}</p>
                <span className="ds-chip ds-chip-forest">{t.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '128px 0',
        background: 'linear-gradient(160deg, #0A100B 0%, #0F1810 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '600px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(26,66,32,.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="ds-shell" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '999px',
            background: 'rgba(26,66,32,.30)', border: '1px solid rgba(163,196,167,.20)',
            color: 'var(--color-leaf)', fontSize: '14px', fontWeight: '700',
            marginBottom: '32px',
          }}>
            <Award style={{ width: '14px', height: '14px', color: 'var(--color-gold)' }} />
            AI Career Companion · Milestone 4
          </div>
          <h2 className="ds-h1" style={{ color: 'var(--color-paper)', marginBottom: '20px' }}>
            Ready to land the internship<br />you actually want?
          </h2>
          <p style={{ fontSize: '20px', color: 'rgba(247,245,239,.65)', maxWidth: '440px', margin: '0 auto 40px', lineHeight: '1.6' }}>
            Upload your resume and get matched, analysed, tailored, and prepared — all with clear AI reasoning.
          </p>
          <button
            onClick={onGetStarted}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '12px',
              padding: '18px 40px', borderRadius: '14px',
              background: 'var(--color-forest)', color: 'white',
              fontSize: '18px', fontWeight: '700', border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 40px rgba(26,66,32,.55)',
              transition: 'all .15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Create Profile & Start Matching
            <ArrowRight style={{ width: '22px', height: '22px', color: 'var(--color-amber)' }} />
          </button>
        </div>
      </section>

      <style>{`
        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 7fr 5fr !important;
          }
        }
      `}</style>
    </div>
  );
};

/* ── Product mockup card ──────────────────────────────────────────── */
function MockupCard() {
  return (
    <div style={{
      width: '100%', maxWidth: '420px',
      background: '#141A14', border: '1px solid rgba(255,255,255,.10)',
      borderRadius: '20px', overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,.55)',
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '14px 18px', background: '#0F1210',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(192,82,40,.80)' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(201,150,58,.80)' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(26,66,32,.80)' }} />
        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'rgba(247,245,239,.35)', fontWeight: 600 }}>
          Match Analysis
        </span>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(247,245,239,.40)', marginBottom: '6px' }}>
              Top Match #1
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', color: 'var(--color-paper)', marginBottom: '4px' }}>
              Software Engineering Intern
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(247,245,239,.45)' }}>CloudScale Systems · San Francisco</div>
          </div>
          {/* Mini score ring */}
          <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(163,196,167,.12)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-forest-mid)"
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - 0.85)}`} />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: '700', color: 'var(--color-leaf)', lineHeight: 1 }}>85</span>
              <span style={{ fontSize: '10px', color: 'var(--color-leaf)', opacity: .7 }}>%</span>
            </div>
          </div>
        </div>

        {/* Rationale */}
        <div style={{
          padding: '14px', borderRadius: '12px',
          background: 'rgba(26,66,32,.18)', border: '1px solid rgba(163,196,167,.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles style={{ width: '14px', height: '14px', color: 'var(--color-gold)' }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-gold)' }}>AI Rationale</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(247,245,239,.65)', lineHeight: '1.6', margin: 0 }}>
            Strong backend alignment — Python, FastAPI, and PostgreSQL all present in verified profile.
          </p>
        </div>

        {/* Skills grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(26,66,32,.12)', border: '1px solid rgba(163,196,167,.12)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-leaf)', opacity: .6, marginBottom: '8px' }}>Matched</div>
            {['Python', 'FastAPI', 'PostgreSQL'].map(s => (
              <span key={s} style={{
                display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '999px',
                background: 'rgba(26,66,32,.30)', color: 'var(--color-leaf)', marginRight: '4px', marginBottom: '4px',
              }}>{s}</span>
            ))}
          </div>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(192,82,40,.08)', border: '1px solid rgba(192,82,40,.15)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(192,82,40,.8)', marginBottom: '8px' }}>Gaps</div>
            {['gRPC', 'Kubernetes'].map(s => (
              <span key={s} style={{
                display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '999px',
                background: 'rgba(192,82,40,.18)', color: 'rgba(224,130,100,1)', marginRight: '4px', marginBottom: '4px',
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Skill Gap', 'Tailor Resume', 'Interview Prep'].map(label => (
            <span key={label} style={{
              flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: '8px',
              background: '#1C231C', border: '1px solid rgba(255,255,255,.07)',
              fontSize: '11px', fontWeight: '600', color: 'rgba(247,245,239,.40)',
            }}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
