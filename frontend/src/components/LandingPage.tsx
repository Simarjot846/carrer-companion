import React from 'react';
import {
  Sparkles, ArrowRight, FileCheck2, Target, MessageSquare,
  ShieldCheck, Zap, CheckCircle2, Cpu, Layers, Compass, Bot,
  TrendingUp, Brain, Award, MapPin, Building2,
} from 'lucide-react';
import { ScoreRing, Chip } from './ui';

interface LandingPageProps {
  onGetStarted: () => void;
}

const FEATURES = [
  { icon: Target, title: 'Transparent match rationale', desc: 'Every ranking comes with a written explanation of skill alignment — not a black-box score.' },
  { icon: Layers, title: 'Deep skill-gap analysis', desc: 'Five categories of missing skills, with role-specific reasons and what to do next.' },
  { icon: MessageSquare, title: 'Structured interview prep', desc: 'Questions drawn from your actual projects and history, with prep notes on each one.' },
  { icon: ShieldCheck, title: 'Schema-validated extraction', desc: 'LLM output is validated before it ever lands in your profile. Hallucinations do not get saved.' },
  { icon: TrendingUp, title: 'Resume & cover letter tailoring', desc: 'Rewrites grounded only in experience you already have. No invented internships.' },
  { icon: Bot, title: 'Grounded career assistant', desc: 'A conversation that knows your profile, matches, and gaps — and stays inside that evidence.' },
];

const STEPS = [
  { n: '01', icon: FileCheck2, title: 'Upload your resume', desc: 'We extract text from your PDF, then structure skills, education, and projects into a verified profile.' },
  { n: '02', icon: Target, title: 'See ranked matches', desc: 'Dense embeddings retrieve internships and roles. Gemini scores fit and names the gaps.' },
  { n: '03', icon: Brain, title: 'Prepare and apply', desc: 'Tailored bullets, a role-specific cover letter, and an interview package — all from your real data.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="animate-fade-in font-sans">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-16 w-[420px] h-[420px] rounded-full bg-forest/8" />
          <div className="absolute top-40 -left-24 w-[320px] h-[320px] rounded-full bg-gold/12" />
        </div>

        <div className="ds-shell relative grid grid-cols-1 lg:grid-cols-12 gap-16 items-center pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="lg:col-span-6 space-y-8">
            <div className="ds-kicker">
              <Sparkles className="h-4 w-4 text-gold" />
              <span>Matching · Gaps · Interview prep</span>
            </div>

            <h1 className="ds-display">
              Land the internship you{' '}
              <em className="not-italic text-gradient">actually</em> want.
            </h1>

            <p className="ds-lead max-w-xl">
              Upload a resume. Get ranked internships with written reasons, a clear skill-gap map, and application materials that stay faithful to your experience.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button onClick={onGetStarted} className="ds-btn-primary">
                <span>Get started</span>
                <ArrowRight className="h-5 w-5 text-gold" />
              </button>
              <div className="flex items-center gap-2 ds-body ds-muted">
                <CheckCircle2 className="h-5 w-5 text-forest shrink-0" />
                <span>PDF in. Ranked matches out.</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-line">
              {[
                { val: '160+', label: 'Indexed postings' },
                { val: '4', label: 'Specialist agents' },
                { val: 'Gemini', label: 'Reasoning engine' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-[32px] leading-none text-forest">{s.val}</div>
                  <div className="ds-caption mt-2">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="hero-canvas min-h-[480px] flex items-center justify-center">
              <div className="hero-blob absolute left-6 top-10 w-40 h-40 bg-forest/15 rotate-12" />
              <div className="hero-blob absolute right-4 bottom-8 w-48 h-48 bg-gold/20 -rotate-6" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-line" />

              <div className="hero-mock animate-float ds-card w-full max-w-[440px] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-cream/70">
                  <span className="ds-caption font-semibold text-ink">Top match</span>
                  <span className="ds-caption">CloudScale · SF</span>
                </div>
                <div className="p-7 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="ds-h3">Software Engineering Intern</h3>
                      <div className="flex items-center gap-3 mt-2 ds-caption">
                        <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" /> CloudScale</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> San Francisco</span>
                      </div>
                    </div>
                    <ScoreRing score={85} size={88} />
                  </div>
                  <div className="ds-card-inset p-5">
                    <div className="flex items-center gap-2 text-gold-deep font-semibold text-[14px] mb-2">
                      <Sparkles className="h-4 w-4" />
                      Why this match
                    </div>
                    <p className="ds-body">
                      Strong backend alignment — Python, FastAPI, and PostgreSQL are all in the verified profile.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Python', 'FastAPI', 'PostgreSQL'].map((s) => (
                      <Chip key={s} tone="forest">{s}</Chip>
                    ))}
                    {['gRPC', 'Kubernetes'].map((s) => (
                      <Chip key={s} tone="clay">{s}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section border-t border-line">
        <div className="ds-shell text-center space-y-12">
          <div className="space-y-4">
            <div className="ds-kicker">
              <Compass className="h-4 w-4" />
              <span>Three steps</span>
            </div>
            <h2 className="ds-h1">From PDF to interview-ready</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left stagger-children">
            {STEPS.map((s) => (
              <div key={s.n} className="card-hover ds-card p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-[14px] bg-forest/10 text-forest flex items-center justify-center">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <span className="font-serif text-[48px] leading-none text-mist">{s.n}</span>
                </div>
                <h3 className="ds-h3">{s.title}</h3>
                <p className="ds-body ds-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-shell">
          <div className="ds-card bg-[color-mix(in_srgb,var(--color-forest)_4%,var(--color-paper))] p-8 sm:p-16 space-y-12">
            <div className="text-center space-y-4">
              <div className="ds-kicker !bg-[color-mix(in_srgb,var(--color-gold)_16%,white)] !text-gold-deep !border-[color-mix(in_srgb,var(--color-gold)_28%,transparent)]">
                <Zap className="h-4 w-4" />
                <span>What is different</span>
              </div>
              <h2 className="ds-h1">Built to be specific, not generic</h2>
              <p className="ds-lead max-w-2xl mx-auto">
                Every feature is grounded in the resume you uploaded. No stock templates. No invented details.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {FEATURES.map((f) => (
                <div key={f.title} className="card-hover ds-card p-8 space-y-4">
                  <div className="h-12 w-12 rounded-[14px] bg-forest/10 text-forest flex items-center justify-center">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-[18px] font-serif font-bold text-ink leading-snug">{f.title}</h3>
                  <p className="ds-body ds-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section border-t border-line">
        <div className="ds-shell space-y-12 text-center">
          <div className="space-y-4">
            <div className="ds-kicker">
              <Cpu className="h-4 w-4" />
              <span>How it is built</span>
            </div>
            <h2 className="ds-h1">A real pipeline, not a chatbot wrapper</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left stagger-children">
            {[
              { label: 'Extraction', body: 'Deterministic PDF text, then Gemini structures skills, education, and projects. Schema checks before anything is saved.', badge: 'FastAPI + SQLAlchemy' },
              { label: 'Retrieval', body: 'Local MiniLM embeddings, 384-dimensional vectors, cosine search over indexed internship and job postings.', badge: 'Dense retrieval' },
              { label: 'Agents', body: 'Gemini reranks matches, maps skill gaps, rewrites bullets, and builds an interview package from verified data.', badge: 'Gemini' },
            ].map((t) => (
              <div key={t.label} className="card-hover ds-card p-8 space-y-4">
                <div className="ds-label !mb-0">{t.label}</div>
                <p className="ds-body ds-muted">{t.body}</p>
                <Chip tone="forest">{t.badge}</Chip>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ds-section pt-0">
        <div className="ds-shell">
          <div className="relative overflow-hidden rounded-[24px] bg-ink text-paper px-8 py-20 sm:px-16 text-center space-y-8">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[480px] h-[240px] rounded-full bg-forest/30 blur-3xl pointer-events-none" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gold text-[14px] font-semibold">
                <Award className="h-4 w-4" />
                Ready when you are
              </div>
              <h2 className="ds-h1 text-paper">Create a profile and run your first match.</h2>
              <p className="ds-lead max-w-lg mx-auto !text-[#C5C0B4]">
                One PDF is enough to see ranked roles, gaps, and a path to interview.
              </p>
              <button onClick={onGetStarted} className="ds-btn-primary">
                <span>Create profile</span>
                <ArrowRight className="h-5 w-5 text-gold" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
