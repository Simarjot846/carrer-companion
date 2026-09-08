import React from 'react';
import {
  Sparkles,
  ArrowRight,
  FileCheck2,
  Target,
  MessageSquare,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Cpu,
  Layers,
  Compass,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="space-y-24 animate-fade-in pb-16">
      
      {/* ---------------------------------------------------- */}
      {/* HERO SECTION                                         */}
      {/* ---------------------------------------------------- */}
      <section className="relative rounded-3xl bg-[#171B16] text-[#FAF9F5] p-8 sm:p-12 lg:p-16 overflow-hidden border border-[#2C5F2D]/30 shadow-2xl">
        {/* Subtle warm background glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#2C5F2D]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#C9A63B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#2C5F2D]/20 border border-[#2C5F2D]/40 text-[#A7BEAE] text-xs font-medium tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-[#C9A63B]" />
              <span>AI Internship Intelligence & Preparation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-[#FAF9F5] leading-[1.15]">
              Your AI partner for landing the internship you <span className="italic text-[#C9A63B]">actually</span> want.
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
              Stop applying blindly to hundreds of generic listings. Our RAG-powered agent matches your exact resume skills against target postings, explains why you fit, and prepares you for real technical interviews.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-[#2C5F2D] hover:bg-[#234E25] text-white font-semibold rounded-xl text-base shadow-xl shadow-[#2C5F2D]/25 flex items-center justify-center space-x-3 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>Upload Your Resume</span>
                <ArrowRight className="h-5 w-5 text-[#C9A63B]" />
              </button>

              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 py-2">
                <CheckCircle2 className="h-4 w-4 text-[#A7BEAE]" />
                <span>No manual form entry required</span>
              </div>
            </div>

            {/* Quick stats trust strip */}
            <div className="pt-8 border-t border-slate-800 grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-[#C9A63B]">160+</div>
                <div className="text-xs text-slate-400 mt-0.5">Indexed Internship Roles</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-[#FAF9F5]">pgvector</div>
                <div className="text-xs text-slate-400 mt-0.5">Semantic RAG Search</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-serif text-[#FAF9F5]">Gemini AI</div>
                <div className="text-xs text-slate-400 mt-0.5">Verified Match Rationale</div>
              </div>
            </div>

          </div>

          {/* Hero Right Visual Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="bg-[#212620] border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-[#2C5F2D]/30 border border-[#2C5F2D]/50 flex items-center justify-center text-[#C9A63B] font-bold text-sm">
                    AI
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Candidate Match Result</div>
                    <div className="text-[11px] text-slate-400">Software Engineering Intern</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#2C5F2D] text-white shadow-sm">
                  92% Match
                </span>
              </div>

              {/* Reasoning Preview */}
              <div className="p-3.5 rounded-xl bg-[#171B16] border border-slate-800 space-y-1.5 text-xs">
                <div className="font-semibold text-[#C9A63B] flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Recommendation Rationale</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Strong backend alignment with demonstrated experience in Python, FastAPI, and PostgreSQL database migrations.
                </p>
              </div>

              {/* Skills Tags Preview */}
              <div className="space-y-2 text-xs">
                <div className="text-[#A7BEAE] font-medium">Matched Skills:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#2C5F2D]/20 text-[#A7BEAE] border border-[#2C5F2D]/30">Python</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#2C5F2D]/20 text-[#A7BEAE] border border-[#2C5F2D]/30">FastAPI</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#2C5F2D]/20 text-[#A7BEAE] border border-[#2C5F2D]/30">PostgreSQL</span>
                </div>

                <div className="text-[#C85A32] font-medium pt-1">Skill Gap:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#C85A32]/15 text-[#E58364] border border-[#C85A32]/30">Docker Containers</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* HOW IT WORKS SECTION                                 */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-12 text-center max-w-5xl mx-auto">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] text-xs font-semibold">
            <Compass className="h-3.5 w-3.5" />
            <span>3-Step Simple Flow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#171B16] font-bold">
            How AI Career Companion Works
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto font-sans">
            From raw resume PDF to tailored interview preparation in three straightforward steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          
          {/* Step 1 */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="h-12 w-12 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] flex items-center justify-center font-bold text-lg font-serif">
              1
            </div>
            <div className="flex items-center space-x-2">
              <FileCheck2 className="h-5 w-5 text-[#2C5F2D]" />
              <h3 className="text-lg font-bold font-serif text-[#171B16]">Upload Your Resume</h3>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed font-sans">
              PyMuPDF extracts raw text deterministically, while Google Gemini AI structures your skills, education, and real project experience into a verified profile.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="h-12 w-12 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] flex items-center justify-center font-bold text-lg font-serif">
              2
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-[#2C5F2D]" />
              <h3 className="text-lg font-bold font-serif text-[#171B16]">Get Matched</h3>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed font-sans">
              Single-block embeddings + pgvector similarity search retrieve top relevant postings. Gemini scores fit, explains rationale, and flags missing skills.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="h-12 w-12 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] flex items-center justify-center font-bold text-lg font-serif">
              3
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-[#2C5F2D]" />
              <h3 className="text-lg font-bold font-serif text-[#171B16]">Prepare Confidently</h3>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed font-sans">
              Review targeted preparation hints and practice technical questions rooted directly in your background and specific project tech stack.
            </p>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* WHY THIS IS DIFFERENT SECTION                        */}
      {/* ---------------------------------------------------- */}
      <section className="bg-[#F3F2EC] border border-[#E2E0D5] rounded-3xl p-8 sm:p-12 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C9A63B]/15 text-[#8A6D1D] text-xs font-semibold">
            <Zap className="h-3.5 w-3.5" />
            <span>Built Differently</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#171B16] font-bold">
            Why Students & Mentors Trust Us
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto font-sans">
            We avoid generic keyword matching. Here is how our AI matching agent delivers genuine engineering & career value.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-[#E2E0D5] shadow-sm flex items-start space-x-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-base font-bold font-serif text-[#171B16]">Transparent Match Rationale</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                We explain WHY a job matches your background, highlighting specific skill alignments rather than giving an arbitrary black-box score.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E0D5] shadow-sm flex items-start space-x-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-base font-bold font-serif text-[#171B16]">Clear Skill Gap Analysis</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                See exactly which required technologies or tools you are missing so you can address gaps before your interview.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E0D5] shadow-sm flex items-start space-x-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-base font-bold font-serif text-[#171B16]">Contextual Preparation</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                Interview questions are derived from YOUR actual projects and education history, avoiding static, one-size-fits-all question banks.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E0D5] shadow-sm flex items-start space-x-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-base font-bold font-serif text-[#171B16]">Schema-Validated Extraction</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                LLM outputs are strictly validated before being saved to PostgreSQL, preventing malformed data or hallucinations from entering your candidate profile.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* UNDER THE HOOD (TECHNICAL CREDIBILITY)               */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-8 text-center max-w-4xl mx-auto">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
            <Cpu className="h-3.5 w-3.5" />
            <span>Under the Hood Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#171B16] font-bold">
            How Our System Architecture Is Built
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left font-sans">
          
          <div className="p-5 rounded-2xl bg-white border border-[#E2E0D5] space-y-2">
            <div className="text-xs font-bold uppercase text-[#2C5F2D]">Layer 1 · Resume Extraction</div>
            <p className="text-xs text-slate-600">
              PyMuPDF deterministic text extraction + Gemini JSON schema structuring saved directly to PostgreSQL.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E0D5] space-y-2">
            <div className="text-xs font-bold uppercase text-[#2C5F2D]">Layer 2 · RAG & Vector Store</div>
            <p className="text-xs text-slate-600">
              PostgreSQL + pgvector single-block job embeddings for fast, unfragmented semantic retrieval.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E0D5] space-y-2">
            <div className="text-xs font-bold uppercase text-[#2C5F2D]">Layer 3 · Agent Scoring</div>
            <p className="text-xs text-slate-600">
              Gemini LLM reranker scores fit (0-100%), evaluates reasoning, and flags missing skill gaps.
            </p>
          </div>

        </div>
      </section>


      {/* ---------------------------------------------------- */}
      {/* FINAL CTA SECTION                                    */}
      {/* ---------------------------------------------------- */}
      <section className="rounded-3xl bg-[#171B16] text-[#FAF9F5] p-10 sm:p-14 text-center space-y-6 border border-[#2C5F2D]/30 shadow-xl">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#FAF9F5]">
          Ready to land the internship you actually want?
        </h2>
        <p className="text-slate-300 text-sm max-w-lg mx-auto font-sans">
          Create your candidate profile now and experience AI-driven job matching and interview preparation.
        </p>

        <div className="pt-2">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-[#2C5F2D] hover:bg-[#234E25] text-white font-semibold rounded-xl text-base shadow-xl shadow-[#2C5F2D]/30 inline-flex items-center space-x-3 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <span>Create Profile & Match Jobs</span>
            <ArrowRight className="h-5 w-5 text-[#C9A63B]" />
          </button>
        </div>
      </section>

    </div>
  );
};
