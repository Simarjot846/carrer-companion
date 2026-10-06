import React, { useState, useEffect } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, Sparkles, ArrowRight,
  GraduationCap, Briefcase, Code2, Wrench, RotateCcw, AlertCircle,
} from 'lucide-react';
import type { Student, StudentProfile } from '../types';
import { uploadResume, getStudentProfile } from '../services/api';

interface ResumeUploadStepProps {
  student: Student;
  profile: StudentProfile | null;
  onProfileUpdated: (profile: StudentProfile) => void;
  onProceedToMatches: () => void;
}

export const ResumeUploadStep: React.FC<ResumeUploadStepProps> = ({
  student, profile, onProfileUpdated, onProceedToMatches,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingStatus, setParsingStatus] = useState<'none' | 'pending' | 'success' | 'failed'>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (profile?.resumes?.length && parsingStatus === 'none') {
      const latest = profile.resumes[profile.resumes.length - 1];
      setParsingStatus(latest.parsing_status as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('Only PDF resume files are accepted.');
        return;
      }
      setErrorMsg(null);
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('Only PDF resume files are accepted.');
        return;
      }
      setErrorMsg(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(20);
    setParsingStatus('pending');
    setErrorMsg(null);
    try {
      setUploadProgress(55);
      const res = await uploadResume(student.id, selectedFile);
      setUploadProgress(85);
      const updatedProfile = await getStudentProfile(student.id);
      setUploadProgress(100);
      onProfileUpdated(updatedProfile);
      setParsingStatus(res.parsing_status as any);
    } catch (err: any) {
      setParsingStatus('failed');
      setErrorMsg(err.message || 'Resume parsing pipeline encountered an error.');
    } finally {
      setUploading(false);
    }
  };

  const reloadProfile = async () => {
    try {
      const p = await getStudentProfile(student.id);
      onProfileUpdated(p);
    } catch (err) { console.error(err); }
  };

  const hasExtractedData = profile && (
    profile.skills.length > 0 || profile.education.length > 0 ||
    profile.experience.length > 0 || profile.projects.length > 0
  );

  const skillColor = (cat?: string) => {
    if (cat === 'technical') return { bg: 'var(--color-leaf-bg)', color: 'var(--color-forest)', border: 'rgba(26,66,32,.20)' };
    if (cat === 'tool') return { bg: 'rgba(201,150,58,.10)', color: 'var(--color-gold-deep)', border: 'rgba(201,150,58,.22)' };
    return { bg: 'var(--color-cream)', color: 'var(--color-stone)', border: 'var(--color-line)' };
  };

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
            borderRadius: '16px',
            padding: '56px 32px',
            textAlign: 'center',
            background: dragOver ? 'var(--color-leaf-bg)' : selectedFile ? 'rgba(26,66,32,.03)' : 'var(--color-paper)',
            transition: 'all .2s ease',
            marginBottom: '32px',
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
                {selectedFile ? selectedFile.name : 'Drop your PDF resume here'}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--color-stone)' }}>
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · PDF` : 'PDF files only · up to 5 MB'}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 22px', borderRadius: '12px',
                background: 'white', border: '1.5px solid var(--color-line)',
                fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)',
                cursor: 'pointer', transition: 'all .15s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-sage)'; e.currentTarget.style.background = 'var(--color-leaf-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.background = 'white'; }}
              >
                Browse files
                <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '12px 22px', borderRadius: '12px',
                    background: 'var(--color-forest)', color: 'white',
                    fontSize: '16px', fontWeight: '600', border: 'none',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? .7 : 1,
                    boxShadow: 'var(--shadow-forest)',
                    transition: 'all .15s ease',
                  }}
                >
                  {uploading ? (
                    <>
                      <div className="ds-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderColor: 'rgba(255,255,255,.3)', borderTopColor: 'white' }} />
                      Parsing PDF…
                    </>
                  ) : (
                    <>
                      Parse & structure
                      <Sparkles style={{ width: '16px', height: '16px', color: 'var(--color-amber)' }} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload progress */}
        {uploading && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '600', color: 'var(--color-forest)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-forest)', animation: 'pulse 1.2s ease-in-out infinite' }} />
                Extracting text and structuring skills…
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-forest)' }}>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--color-mist)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '999px',
                background: 'linear-gradient(90deg, var(--color-forest), var(--color-sage))',
                width: `${uploadProgress}%`, transition: 'width .4s ease',
              }} />
            </div>
            {/* Pipeline steps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
              {[
                { label: '1. Embedding profile', done: uploadProgress >= 40 },
                { label: '2. Extracting text', done: uploadProgress >= 70 },
                { label: '3. Structuring with AI', done: uploadProgress >= 95 },
              ].map(step => (
                <div key={step.label} style={{
                  padding: '10px 12px', borderRadius: '10px',
                  background: step.done ? 'var(--color-leaf-bg)' : 'var(--color-paper)',
                  border: `1px solid ${step.done ? 'rgba(26,66,32,.20)' : 'var(--color-line)'}`,
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: step.done ? 'var(--color-forest)' : 'var(--color-mist)',
                    transition: 'background .3s',
                  }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: step.done ? 'var(--color-forest)' : 'var(--color-stone)' }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {parsingStatus === 'failed' && (
          <div className="ds-alert ds-alert-error">
            <AlertCircle className="ds-alert-icon" />
            <div className="ds-alert-copy">
              <strong>Resume could not be parsed</strong>
              <div>{errorMsg || 'Please try another clear, text-based PDF resume.'}</div>
            </div>
          </div>
        )}

        {/* Success banner */}
        {parsingStatus === 'success' && (
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
                fontSize: '15px', fontWeight: '700', border: 'none', cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              View matches
              <ArrowRight style={{ width: '16px', height: '16px', color: 'var(--color-amber)' }} />
            </button>
          </div>
        )}
      </div>

      {/* Extracted profile */}
      {profile && (
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
                transition: 'all .15s ease',
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
            {profile.skills.length === 0 ? (
              <p className="ds-body" style={{ color: 'var(--color-stone)' }}>No skills extracted yet. Upload a resume to populate this section.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.skills.map(skill => {
                  const c = skillColor(skill.category);
                  return (
                    <span key={skill.id} style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '6px 14px', borderRadius: '999px',
                      background: c.bg, color: c.color,
                      border: `1px solid ${c.border}`,
                      fontSize: '14px', fontWeight: '600',
                    }}>{skill.name}</span>
                  );
                })}
              </div>
            )}
          </ProfileSection>

          {/* Education */}
          <ProfileSection icon={<GraduationCap />} title="Education" count={profile.education.length}>
            {profile.education.length === 0 ? (
              <p className="ds-body" style={{ color: 'var(--color-stone)' }}>No education entries yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {profile.education.map(edu => (
                  <div key={edu.id} className="ds-card-inset" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '6px' }}>{edu.institution}</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-forest)', marginBottom: '10px' }}>
                      {edu.degree || 'Degree'}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-stone)' }}>
                      <span>{edu.start_date || ''} — {edu.end_date || 'Present'}</span>
                      {edu.grade && <span style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{edu.grade}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ProfileSection>

          {/* Experience */}
          <ProfileSection icon={<Briefcase />} title="Experience" count={profile.experience.length}>
            {profile.experience.length === 0 ? (
              <p className="ds-body" style={{ color: 'var(--color-stone)' }}>No experience entries yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {profile.experience.map(exp => (
                  <div key={exp.id} className="ds-card-inset" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--color-ink)' }}>{exp.title}</span>
                      <span style={{ fontSize: '14px', color: 'var(--color-stone)' }}>{exp.start_date || ''} — {exp.end_date || 'Present'}</span>
                    </div>
                    {exp.organization && <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-gold-deep)', marginBottom: '8px' }}>{exp.organization}</div>}
                    {exp.description && <p style={{ fontSize: '16px', color: 'var(--color-stone)', lineHeight: '1.6' }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </ProfileSection>

          {/* Projects */}
          <ProfileSection icon={<Wrench />} title="Projects" count={profile.projects.length}>
            {profile.projects.length === 0 ? (
              <p className="ds-body" style={{ color: 'var(--color-stone)' }}>No projects yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {profile.projects.map(proj => (
                  <div key={proj.id} className="ds-card-inset" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>{proj.title}</div>
                    {proj.description && <p style={{ fontSize: '16px', color: 'var(--color-stone)', lineHeight: '1.6', marginBottom: '12px' }}>{proj.description}</p>}
                    {proj.technologies && (
                      <span style={{
                        display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
                        background: 'var(--color-leaf-bg)', color: 'var(--color-forest)',
                        border: '1px solid rgba(26,66,32,.18)', fontSize: '13px', fontWeight: '600',
                      }}>{proj.technologies}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ProfileSection>

          {hasExtractedData && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
              <button
                onClick={onProceedToMatches}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '16px 32px', borderRadius: '14px',
                  background: 'var(--color-forest)', color: 'white',
                  fontSize: '17px', fontWeight: '700', border: 'none', cursor: 'pointer',
                  boxShadow: 'var(--shadow-forest)',
                  transition: 'all .15s ease',
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
        @keyframes pulse { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.3); } }
      `}</style>
    </div>
  );
};

/* Reusable profile section wrapper */
function ProfileSection({ icon, title, count, children }: {
  icon: React.ReactNode; title: string; count: number; children: React.ReactNode;
}) {
  return (
    <div className="ds-card" style={{ padding: '32px 36px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--color-line)' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'var(--color-leaf-bg)', color: 'var(--color-forest)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon as React.ReactElement, { style: { width: '22px', height: '22px' } })}
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
