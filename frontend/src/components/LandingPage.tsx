import React from 'react';
import {
  Sparkles, ArrowRight, FileCheck2, Target, MessageSquare,
  ShieldCheck, Zap, CheckCircle2, Cpu, Layers, Compass, Bot,
  TrendingUp, Brain, Award,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const FEATURES = [
  { icon: <Target className="h-5 w-5" />, title: 'Transparent Match Rationale', desc: 'We explain WHY a job matches your background, highlighting specific skill alignments rather than giving an arbitrary black-box score.', color: 'text-[#2C5F2D]', bg: 'bg-[#2C5F2D]/10' },
  { icon: <Layers className="h-5 w-5" />, title: 'Deep Skill Gap Analysis', desc: 'Five-category breakdown of exactly which required technologies you\'re missing, with role-specific explanations and actionable recommendations.', color: 'text-[#C85A32]', bg: 'bg-[#C85A32]/10' },
  { icon: <MessageSquare className="h-5 w-5" />, title: 'Contextual Interview Prep', desc: 'Questions derived from YOUR actual projects and work history. Not a static bank — every question references something real from your resume.', color: 'text-[#2C5F2D]', bg: 'bg-[#2C5F2D]/10' },
  { icon: <ShieldCheck className="h-5 w-5" />, title: 'Schema-Validated Extraction', desc: 'LLM outputs are strictly validated before DB commit. Malformed data or hallucinations never enter your candidate profile.', color: 'text-[#C9A63B]', bg: 'bg-[#C9A63B]/10' },
  { icon: <TrendingUp className="h-5 w-5" />, title: 'AI Cover Letter & Resume Tailoring', desc: 'Role-specific cover letters grounded only in your real experience — never invented details. Side-by-side bullet rewrites for your resume.', color: 'text-[#2C5F2D]', bg: 'bg-[#2C5F2D]/10' },
  { icon: <Bot className="h-5 w-5" />, title: 'Career Assistant Chat', desc: 'Ask anything — compare jobs, understand gaps, plan your prep. Every answer grounded in your actual profile data.', color: 'text-[#C9A63B]', bg: 'bg-[#C9A63B]/10' },
];

const STEPS = [
  { n: '01', icon: <FileCheck2 className="h-5 w-5" />, title: 'Upload Resume', desc: 'PyMuPDF extracts text deterministically. Gemini AI structures skills, education, and projects into a verified profile.' },
  { n: '02', icon: <Target className="h-5 w-5" />, title: 'Get Matched', desc: 'Semantic embeddings + vector search retrieve top roles. Gemini scores fit and identifies skill gaps in seconds.' },
  { n: '03', icon: <Brain className="h-5 w-5" />, title: 'Prepare & Apply', desc: 'Tailored resume edits, role-specific cover letter, and a personalised interview prep package — all AI-generated from your real data.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="space-y-20 animate-fade-in pb-20">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative rounded-3xl overflow-hidden bg-[#0F1210] text-[#FAF9F5] border border-[#2C5F2D]/25 shadow-2xl">
        {/* Background mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#2C5F2D]/15 rounded-full blur-[80px]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[#C9A63B]/8 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#2C5F2D]/5 rounded-full blur-[60px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#2C5F2D 1px,transparent 1px),linear-gradient(90deg,#2C5F2D 1px,transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <div className="relative z-10 p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left */}
            <div className="lg:col-span-7 space-y-7 stagger-children">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#2C5F2D]/20 border border-[#2C5F2D]/40 text-[#A7BEAE] text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-[#C9A63B]" />
                <span>RAG · Vector Search · Gemini AI · 4 Intelligent Agents</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-[#FAF9F5] leading-[1.12]">
                Land the internship you{' '}
                <span className="relative inline-block">
                  <span className="text-gradient">actually</span>
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2C5F2D] to-[#C9A63B] rounded-full opacity-60" />
                </span>{' '}
                want.
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
                Stop applying blindly. Our AI pipeline parses your resume, semantically matches you to 160+ roles, analyses your skill gaps, tailors your application materials, and prepares you for the real interview.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={onGetStarted}
                  className="group px-7 py-3.5 bg-gradient-to-r from-[#2C5F2D] to-[#234E25] hover:from-[#234E25] hover:to-[#1a3d1b] text-white font-semibold rounded-xl shadow-xl shadow-[#2C5F2D]/30 flex items-center justify-center space-x-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[#2C5F2D]/50"
                >
                  <span>Start Matching</span>
                  <ArrowRight className="h-4 w-4 text-[#C9A63B] group-hover:translate-x-0.5 transition-transform" />
                </button>
                <div className="flex items-center space-x-2 text-xs text-slate-400 px-2">
                  <CheckCircle2 className="h-4 w-4 text-[#A7BEAE] shrink-0" />
                  <span>No manual form entry · Upload PDF and go</span>
                </div>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/8">
                {[
                  { val: '160+', label: 'Indexed Roles' },
                  { val: '4', label: 'AI Agents' },
                  { val: 'Gemini', label: 'LLM Engine' },
                ].map((s) => (
                  <div key={s.val}>
                    <div className="text-xl sm:text-2xl font-black font-serif text-[#C9A63B]">{s.val}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — live card mockup */}
            <div className="lg:col-span-5">
              <div className="animate-float">
                <div className="bg-[#1A1F18] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Window chrome */}
                  <div className="flex items-center space-x-1.5 px-4 py-3 bg-[#141812] border-b border-white/5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#C85A32]/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#C9A63B]/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#2C5F2D]/70" />
                    <span className="ml-2 text-[11px] text-slate-600">AI Career Companion — Match Results</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400">Top Match</div>
                        <div className="text-sm font-bold text-[#FAF9F5]">Software Engineering Intern</div>
                        <div className="text-xs text-slate-500">CloudScale Systems · San Francisco</div>
                      </div>
                      <div className="h-14 w-14 rounded-full bg-[#2C5F2D]/20 border-2 border-[#2C5F2D]/40 flex items-center justify-center">
                        <span className="text-base font-black text-[#2C5F2D]">98%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0F1210] border border-white/5 space-y-1.5 text-xs">
                      <div className="flex items-center space-x-1.5 text-[#C9A63B] font-semibold">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Rationale</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        Strong backend alignment — Python, FastAPI, and PostgreSQL all present. Docker and Redis demonstrated in personal projects.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#2C5F2D]/10 border border-[#2C5F2D]/20">
                        <div className="text-[#A7BEAE] font-medium mb-1">Matched</div>
                        <div className="flex flex-wrap gap-1">
                          {['Python','FastAPI','PostgreSQL'].map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-[#2C5F2D]/20 text-[#A7BEAE] text-[10px]">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#C85A32]/10 border border-[#C85A32]/20">
                        <div className="text-[#E58364] font-medium mb-1">Gaps</div>
                        <div className="flex flex-wrap gap-1">
                          {['gRPC','Kubernetes'].map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-[#C85A32]/20 text-[#E58364] text-[10px]">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['Skill Gap','Tailor Resume','Interview Prep'].map((label, i) => (
                        <span key={i} className="flex-1 text-center py-1.5 rounded-lg bg-[#212620] border border-white/5 text-[10px] text-slate-500 font-medium">{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="space-y-10 max-w-5xl mx-auto text-center">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] text-xs font-semibold border border-[#2C5F2D]/20">
            <Compass className="h-3.5 w-3.5" />
            <span>3 steps · from PDF to offer-ready</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#171B16]">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children text-left">
          {STEPS.map((s) => (
            <div key={s.n} className="card-hover bg-white border border-[#E2E0D5] rounded-2xl p-7 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-[#2C5F2D]/10 text-[#2C5F2D] flex items-center justify-center">
                  {s.icon}
                </div>
                <span className="text-4xl font-black font-serif text-[#E2E0D5]">{s.n}</span>
              </div>
              <h3 className="text-base font-bold font-serif text-[#171B16]">{s.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────── */}
      <section className="bg-[#F3F2EC] border border-[#E2E0D5] rounded-3xl p-8 sm:p-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#C9A63B]/15 text-[#8A6D1D] text-xs font-semibold border border-[#C9A63B]/20">
            <Zap className="h-3.5 w-3.5" />
            <span>What makes this different</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#171B16]">6 Features Built to Stand Out</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">Every feature is grounded in your actual resume data — never generic templates, never invented details.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-hover bg-white border border-[#E2E0D5] rounded-2xl p-5 shadow-sm flex items-start space-x-4">
              <div className={`h-10 w-10 shrink-0 rounded-xl ${f.bg} ${f.color} flex items-center justify-center`}>
                {f.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold font-serif text-[#171B16]">{f.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto space-y-8 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
            <Cpu className="h-3.5 w-3.5" />
            <span>Technical Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#171B16]">Built on Real AI Infrastructure</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children text-left">
          {[
            { label: 'Layer 1 · Extraction', body: 'PyMuPDF for deterministic PDF parsing · Gemini LLM for JSON schema structuring · Schema validation before DB commit', badge: 'FastAPI + SQLAlchemy' },
            { label: 'Layer 2 · RAG Search', body: 'sentence-transformers all-MiniLM-L6-v2 local embeddings · 384-dim dense vectors · Cosine similarity over 160 job postings', badge: 'Vector Search' },
            { label: 'Layer 3 · Agent Scoring', body: 'Gemini 3.6 Flash reranker · Skill gap analysis · Resume tailoring · Interview prep · Career assistant chat', badge: 'Gemini AI' },
          ].map((t) => (
            <div key={t.label} className="card-hover bg-white border border-[#E2E0D5] rounded-2xl p-5 space-y-2.5 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-[#2C5F2D] tracking-wider">{t.label}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{t.body}</p>
              <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] border border-[#2C5F2D]/20">{t.badge}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative rounded-3xl overflow-hidden bg-[#0F1210] text-[#FAF9F5] p-10 sm:p-14 text-center space-y-6 border border-[#2C5F2D]/25 shadow-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#2C5F2D]/15 rounded-full blur-[60px]" />
        </div>
        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#2C5F2D]/20 border border-[#2C5F2D]/40 text-[#A7BEAE] text-xs">
            <Award className="h-3.5 w-3.5 text-[#C9A63B]" />
            <span>AI Career Companion · Milestone 3</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#FAF9F5]">
            Ready to land the internship you actually want?
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Upload your resume and get matched, analysed, tailored, and prepared in minutes.</p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#2C5F2D] to-[#234E25] hover:from-[#234E25] hover:to-[#1a3d1b] text-white font-semibold rounded-xl shadow-xl shadow-[#2C5F2D]/30 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[#2C5F2D]/50"
          >
            <span>Create Profile & Start Matching</span>
            <ArrowRight className="h-5 w-5 text-[#C9A63B] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

    </div>
  );
};
