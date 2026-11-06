import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, Sparkles, ArrowRight,
  GraduationCap, Briefcase, Code2, Wrench, RotateCcw, AlertCircle,
  Zap,
} from 'lucide-react';
import type { Student, StudentProfile } from '../types';
import { uploadResume, getStudentProfile } from '../services/api';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

interface ResumeUploadStepProps {
  student: Student;
  profile: StudentProfile | null;
  onProfileUpdated: (profile: StudentProfile) => void;
  onProceedToMatches: () => void;
}

const STAGES = [
  { pct: 15,  label: 'Waking up server…' },
  { pct: 30,  label: 'Uploading file…' },
  { pct: 50,  label: 'Extracting text from PDF…' },
  { pct: 70,  label: 'Sending to Gemini AI…' },
  { pct: 88,  label: 'Structuring skills & experience…' },
  { pct: 97,  label: 'Saving to profile…' },
];

export const ResumeUploadStep: React.FC<ResumeUploadStepProps> = ({
  student, profile, onProfileUpdated, onProceedToMatches,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [parsingStatus, setParsingStatus] = useState<'none' | 'pending' | 'success' | 'failed'>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [serverReady, setServerReady] = useState<boolean | null>(null); // null=checking, true=ready, false=cold
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ping the health endpoint on mount to detect cold-start state early
  useEffect(() => {
    const pingServer = async () => {
      try {
        const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
        setServerReady(r.ok);
      } catch {
        setServerReady(false); // cold / slow
      }
    };
    pingServer();
  }, []);

  // If the student already has a parsed resume, reflect that on mount
  useEffect(() => {
    if (profile?.resumes?.length && parsingStatus === 'none') {
      const latest = profile.resumes[profile.resumes.length - 1];
      if (latest.parsing_status === 'success') setParsingStatus('success');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Advance animated progress bar while uploading
  useEffect(() => {
    if (!uploading) {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      return;
    }
    let idx = 0;
    stageTimerRef.current = setInterval(() => {
      idx = Math.min(idx + 1, STAGES.length - 1);
      setStageIdx(idx);
      setProgress(STAGES[idx].pct);
    }, 3500); // ~3.5s per stage → ~21s to reach final stage
    return () => { if (stageTimerRef.current) clearInterval(stageTimerRef.current); };
  }, [uploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Only PDF files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File exceeds 5 MB limit.');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setParsingStatus('none');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Only PDF files are accepted.');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setParsingStatus('none');
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setStageIdx(0);
    setProgress(STAGES[0].pct);
    setParsingStatus('pending');
    setErrorMsg(null);

    try {
      // If server was detected as cold, ping it first and wait for it to wake
      if (serverReady === false) {
        try {
          await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(55_000) });
          setServerReady(true);
        } catch {
          // Continue anyway — the main request will handle it
        }
      }

      // The backend runs the full pipeline synchronously.
      // parsing_status in the response is "success" or "failed" — no polling needed.
      const res = await uploadResume(student.id, selectedFile);

      setProgress(100);

      if (res.parsing_status === 'success') {
        // Fetch the updated profile now that parsing is complete
        const updatedProfile = await getStudentProfile(student.id);
        onProfileUpdated(updatedProfile);
        setParsingStatus('success');
      } else {
        setParsingStatus('failed');
        setErrorMsg('Resume parsing failed. Please try a different PDF.');
      }
    } catch (err: any) {
      setParsingStatus('failed');
      const msg: string = err.message || 'Upload failed — please try again.';
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const reloadProfile = async () => {
    try {
      const p = await getStudentProfile(student.id);
      onProfileUpdated(p);
    } catch { /* ignore */ }
  };

  const hasData = profile && (
    profile.skills.length > 0 || profile.education.length > 0 ||
    profile.experience.length > 0 || profile.projects.length > 0
  );

  const skillChipStyle = (cat?: string): React.CSSProperties => {
    if (cat === 'technical') return {
      background: 'var(--color-leaf-bg)', color: 'var(--color-forest)',
      border: '1px solid rgba(26,66,32,.20)',
    };
    if (cat === 'tool') return {
      background: 'rgba(201,150,58,.10)', color: 'var(--color-gold-deep)',
      border: '1px solid rgba(201,150,58,.22)',
    };
    return {
      background: 'var(--color-cream)', color: 'var(--color-stone)',
      border: '1px solid var(--color-line)',
    };
  };

  const currentStageLabel = STAGES[stageIdx]?.label ?? 'Processing…';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>

      {/* Page header */}
      <div style={{ textAlign: 'center' }}>
        <div className="ds-kicker" style={{ marginBottom: '20px' }}>
          <FileText style={{ width: '16px', height: '16px' }} />
          Step 2 of 3 · Resume
        </div>
        <h1 className="ds-h1" style={{ color: 'var(--color-ink)', marginBottom: '16px' }}>
          Upload your resume
        </h1>
        <p className="ds-lead" style={{ maxWidth: '480px', margin: '0 auto', color: 'var(--color-stone)' }}>
          We extract the PDF, then structure skills, education, experience, and projects into a verified profile.
        </p>
      </div>

      {/* Upload card */}
      <div className="ds-card" style={{ padding: '40px' }}>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-forest)' : selectedFile ? 'var(--color-sage)' : 'var(--color-line)'}`,
            borderRadius: '16px', padding: '56px 32px', textAlign: 'center',
            background: dragOver ? 'var(--color-leaf-bg)' : selectedFile ? 'rgba(26,66,32,.025)' : 'var(--color-paper)',
            transition: 'all .2s ease', marginBottom: '28px',
          }}
        >
          <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: selectedFile ? 'var(--color-leaf-bg)' : 'var(--color-cream)',
              color: selectedFile ? 'var(--color-forest)' : 'var(--color-stone)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s ease',
            }}>
              <UploadCloud style={{ width: '36px', height: '36px' }} />
            </div>

            <div>
              <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '6px' }}>
                {selectedFile ? selectedFile.name : 'Drop your PDF here'}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--color-stone)' }}>
                {selectedFile
                  ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · PDF`
                  : 'PDF only · up to 5 MB'}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 22px', borderRadius: '12px',
                background: 'white', border: '1.5px solid var(--color-line)',
                fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)',
                cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all .15s',
              }}
                onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = 'var(--color-sage)'; e.currentTarget.style.background = 'var(--color-leaf-bg)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.background = 'white'; }}
              >
                Browse files
                <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} disabled={uploading} />
              </label>

              {selectedFile && !uploading && (
                <button
                  onClick={handleUpload}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '12px 22px', borderRadius: '12px',
                    background: 'var(--color-forest)', color: 'white',
                    fontSize: '16px', fontWeight: '600', border: 'none',
                    cursor: 'pointer', boxShadow: 'var(--shadow-forest)',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  Parse &amp; structure
                  <Sparkles style={{ width: '16px', height: '16px', color: 'var(--color-amber)' }} />
                </button>
              )}
            </div>

            {/* Server cold-start warning */}
            {serverReady === false && !uploading && (
              <div style={{
                marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '13px', color: 'var(--color-gold-deep)',
                background: 'rgba(201,150,58,.09)', border: '1px solid rgba(201,150,58,.22)',
                borderRadius: '8px', padding: '8px 14px',
              }}>
                <Zap style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                Server is starting up — first parse may take 30–60s. Subsequent ones are fast.
              </div>
            )}
          </div>
        </div>

        {/* Progress while uploading */}
        {uploading && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '600', color: 'var(--color-forest)' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--color-forest)', animation: 'pulseDot 1.2s ease-in-out infinite' }} />
                {currentStageLabel}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-forest)' }}>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--color-mist)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '999px',
                background: 'linear-gradient(90deg, var(--color-forest), var(--color-sage))',
                width: `${progress}%`, transition: 'width .5s ease',
              }} />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-stone)', marginTop: '10px', textAlign: 'center' }}>
              AI extraction takes 15–60s depending on server state. Please don't close this tab.
            </p>
          </div>
        )}

        {/* Error */}
        {parsingStatus === 'failed' && !uploading && (
          <div className="ds-alert ds-alert-error">
            <AlertCircle className="ds-alert-icon" />
            <div className="ds-alert-copy" style={{ flex: 1 }}>
              <strong>Resume could not be parsed</strong>
              <div>{errorMsg || 'Please try a clear, text-based PDF resume (not a scanned image).'}</div>
              {(errorMsg || '').includes('timed out') && (
                <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-clay)' }}>
                  The server was waking up from sleep. It's now ready — click "Parse & structure" again.
                </div>
              )}
            </div>
            <button
              onClick={() => { setParsingStatus('none'); setErrorMsg(null); }}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-clay)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', flexShrink: 0 }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Success */}
        {parsingStatus === 'success' && !uploading && (
          <div className="ds-alert ds-alert-success" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <CheckCircle2 className="ds-alert-icon" />
            <div className="ds-alert-copy" style={{ flex: 1 }}>
              <strong>Resume parsed successfully</strong>
              <div>Skills, education, and experience are now in {student.name}'s profile.</div>
            </div>
            <button
              onClick={onProceedToMatches}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px', borderRadius: '11px',
                background: 'var(--color-forest)', color: 'white',
                fontSize: '15px', fontWeight: '700', border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              View matches
              <ArrowRight style={{ width: '16px', height: '16px', color: 'var(--color-amber)' }} />
            </button>
          </div>
        )}
      </div>

      {/* Extracted profile */}
      {profile && !uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="ds-h2" style={{ color: 'var(--color-ink)', marginBottom: '8px' }}>Extracted profile</h2>
              <p className="ds-body" style={{ color: 'var(--color-stone)' }}>Review what we found before matching.</p>
            </div>
            <button
              onClick={reloadProfile}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '11px',
                background: 'white', border: '1.5px solid var(--color-line)',
                fontSize: '15px', fontWeight: '600', color: 'var(--color-ink)', cursor: 'pointer',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-sage)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; }}
            >
              <RotateCcw style={{ width: '15px', height: '15px' }} />
              Refresh
            </button>
          </div>

          {/* Skills */}
          <ProfileSection icon={<Code2 />} title="Skills" count={profile.skills.length}>
            {profile.skills.length === 0
              ? <p className="ds-body" style={{ color: 'var(--color-stone)' }}>No skills extracted. Upload a resume to populate this section.</p>
              : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.skills.map(skill => (
                    <span key={skill.id} style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '6px 14px', borderRadius: '999px',
                      fontSize: '14px', fontWeight: '600',
                      ...skillChipStyle(skill.category),
                    }}>{skill.name}</span>
                  ))}
                </div>
              )}
          </ProfileSection>

          {/* Education */}
          <ProfileSection icon={<GraduationCap />} title="Education" count={profile.education.length}>
            {profile.education.length === 0
              ? <p className="ds-body" style={{ color: 'var(--color-stone)' }}>No education entries yet.</p>
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {profile.education.map(edu => (
                    <div key={edu.id} className="ds-card-inset" style={{ padding: '24px' }}>
                      <div style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '6px' }}>
                        {edu.institution}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-forest)', marginBottom: '10px' }}>
                        {edu.degree || 'Degree'}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-stone)' }}>
                        <span>{edu.start_date || ''}{edu.start_date && edu.end_date ? ' — ' : ''}{edu.end_date || (edu.start_date ? 'Present' : '')}</span>
                        {edu.grade && <span style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{edu.grade}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </ProfileSection>

          {/* Experience */}
          <ProfileSection icon={<Briefcase />} title="Experience" count={profile.experience.length}>
            {profile.experience.length === 0
              ? <p className="ds-body" style={{ color: 'var(--color-stone)' }}>No experience entries yet.</p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.experience.map(exp => (
                    <div key={exp.id} className="ds-card-inset" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--color-ink)' }}>{exp.title}</span>
                        <span style={{ fontSize: '14px', color: 'var(--color-stone)' }}>
                          {exp.start_date || ''}{exp.start_date && exp.end_date ? ' — ' : ''}{exp.end_date || (exp.start_date ? 'Present' : '')}
                        </span>
                      </div>
                      {exp.organization && (
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-gold-deep)', marginBottom: '8px' }}>{exp.organization}</div>
                      )}
                      {exp.description && (
                        <p style={{ fontSize: '15px', color: 'var(--color-stone)', lineHeight: '1.6', margin: 0 }}>{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </ProfileSection>

          {/* Projects */}
          <ProfileSection icon={<Wrench />} title="Projects" count={profile.projects.length}>
            {profile.projects.length === 0
              ? <p className="ds-body" style={{ color: 'var(--color-stone)' }}>No projects yet.</p>
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {profile.projects.map(proj => (
                    <div key={proj.id} className="ds-card-inset" style={{ padding: '24px' }}>
                      <div style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>
                        {proj.title}
                      </div>
                      {proj.description && (
                        <p style={{ fontSize: '15px', color: 'var(--color-stone)', lineHeight: '1.6', marginBottom: '12px' }}>{proj.description}</p>
                      )}
                      {proj.technologies && (
                        <span style={{
                          display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
                          background: 'var(--color-leaf-bg)', color: 'var(--color-forest)',
                          border: '1px solid rgba(26,66,32,.18)', fontSize: '13px', fontWeight: '600',
                        }}>{proj.technologies}</span>
                      )}
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer"
                          style={{ display: 'block', fontSize: '13px', color: 'var(--color-sage)', marginTop: '8px', wordBreak: 'break-all' }}>
                          {proj.link}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </ProfileSection>

          {hasData && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button
                onClick={onProceedToMatches}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '16px 32px', borderRadius: '14px',
                  background: 'var(--color-forest)', color: 'white',
                  fontSize: '17px', fontWeight: '700', border: 'none', cursor: 'pointer',
                  boxShadow: 'var(--shadow-forest)', transition: 'all .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                Run job matching
                <ArrowRight style={{ width: '20px', height: '20px', color: 'var(--color-amber)' }} />
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulseDot {
          0%,100% { opacity:.5; transform:scale(1); }
          50%      { opacity:1; transform:scale(1.35); }
        }
      `}</style>
    </div>
  );
};

function ProfileSection({ icon, title, count, children }: {
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="ds-card" style={{ padding: '32px 36px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        marginBottom: '24px', paddingBottom: '20px',
        borderBottom: '1px solid var(--color-line)',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'var(--color-leaf-bg)', color: 'var(--color-forest)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon, { style: { width: '22px', height: '22px' } })}
        </div>
        <h3 className="ds-h3" style={{ color: 'var(--color-ink)', flex: 1 }}>{title}</h3>
        <span style={{
          padding: '4px 12px', borderRadius: '999px',
          background: 'var(--color-cream)', color: 'var(--color-stone)',
          border: '1px solid var(--color-line)', fontSize: '14px', fontWeight: '700',
        }}>{count}</span>
      </div>
      {children}
    </div>
  );
}
