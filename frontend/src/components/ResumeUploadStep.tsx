import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Code2,
  Wrench,
  RotateCcw,
} from 'lucide-react';
import type { Student, StudentProfile } from '../types';
import { uploadResume, getStudentProfile } from '../services/api';
import { AlertBanner, Chip, EmptyState } from './ui';

interface ResumeUploadStepProps {
  student: Student;
  profile: StudentProfile | null;
  onProfileUpdated: (profile: StudentProfile) => void;
  onProceedToMatches: () => void;
}

export const ResumeUploadStep: React.FC<ResumeUploadStepProps> = ({
  student,
  profile,
  onProfileUpdated,
  onProceedToMatches,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingStatus, setParsingStatus] = useState<'none' | 'pending' | 'success' | 'failed'>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.resumes?.length) {
      const latest = profile.resumes[profile.resumes.length - 1];
      if (parsingStatus === 'none') {
        setParsingStatus(latest.parsing_status as 'pending' | 'success' | 'failed');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
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
    setUploadProgress(25);
    setParsingStatus('pending');
    setErrorMsg(null);

    try {
      setUploadProgress(60);
      const res = await uploadResume(student.id, selectedFile);
      setUploadProgress(90);

      const updatedProfile = await getStudentProfile(student.id);
      setUploadProgress(100);

      onProfileUpdated(updatedProfile);
      setParsingStatus(res.parsing_status as any);
    } catch (err: any) {
      setParsingStatus('failed');
      setErrorMsg(err.message || 'Resume parsing pipeline encountered an extraction issue.');
    } finally {
      setUploading(false);
    }
  };

  const reloadProfile = async () => {
    try {
      const p = await getStudentProfile(student.id);
      onProfileUpdated(p);
    } catch (err) {
      console.error(err);
    }
  };

  const hasExtractedData =
    profile &&
    (profile.skills.length > 0 ||
      profile.education.length > 0 ||
      profile.experience.length > 0 ||
      profile.projects.length > 0);

  const skillTone = (category?: string) => {
    if (category === 'technical') return 'forest' as const;
    if (category === 'tool') return 'gold' as const;
    return 'muted' as const;
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="ds-kicker">
          <FileText className="h-4 w-4" />
          <span>Step 2 of 3 · Resume</span>
        </div>
        <h1 className="ds-h1">Upload your resume</h1>
        <p className="ds-lead max-w-xl mx-auto">
          We extract the PDF, then structure skills, education, experience, and projects into a profile you can review.
        </p>
      </div>

      <div className="ds-card p-8 sm:p-10 space-y-8">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-[20px] p-12 text-center transition-all ${
            selectedFile
              ? 'border-forest bg-forest/5'
              : 'border-line hover:border-forest bg-cream'
          }`}
        >
          <div className="max-w-md mx-auto space-y-5">
            <div className="h-16 w-16 mx-auto rounded-full bg-forest/10 text-forest flex items-center justify-center">
              <UploadCloud className="h-8 w-8" />
            </div>

            <div>
              <p className="text-[18px] font-semibold text-ink">
                {selectedFile ? selectedFile.name : 'Drop your PDF resume here'}
              </p>
              <p className="ds-caption mt-2">PDF files up to 5MB</p>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <label className="ds-btn-secondary cursor-pointer">
                Browse files
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </label>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="ds-btn-primary"
                >
                  {uploading ? (
                    <span>Parsing PDF…</span>
                  ) : (
                    <>
                      <span>Parse & structure</span>
                      <Sparkles className="h-4 w-4 text-gold" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {uploading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between ds-body">
              <span className="flex items-center gap-3 font-semibold">
                <div className="h-2.5 w-2.5 rounded-full bg-forest animate-ping" />
                Extracting text and structuring skills…
              </span>
              <span className="font-bold text-forest">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-mist rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-forest h-2.5 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {parsingStatus === 'failed' && (
          <AlertBanner tone="error" title="Resume could not be parsed">
            {errorMsg || 'Please try another clear PDF resume.'}
          </AlertBanner>
        )}

        {parsingStatus === 'success' && (
          <AlertBanner
            tone="success"
            title="Resume parsed successfully"
            action={
              <button onClick={onProceedToMatches} className="ds-btn-primary !py-3 !px-5 shrink-0">
                View matches
                <ArrowRight className="h-4 w-4 text-gold" />
              </button>
            }
          >
            Skills, education, and experience are now in {student.name}'s profile.
          </AlertBanner>
        )}
      </div>

      {profile && (
        <div className="space-y-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="ds-h2">Extracted profile</h2>
              <p className="ds-muted ds-body mt-2">Review what we found before matching.</p>
            </div>
            <button onClick={reloadProfile} className="ds-btn-secondary !py-3">
              <RotateCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <section className="ds-card p-8 sm:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Code2 className="h-6 w-6 text-forest" />
              <h3 className="ds-h3">Skills</h3>
              <span className="ds-chip ds-chip-muted">{profile.skills.length}</span>
            </div>
            {profile.skills.length === 0 ? (
              <EmptyState title="No skills yet" body="Upload a resume to extract skills into this section." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Chip key={skill.id} tone={skillTone(skill.category)}>{skill.name}</Chip>
                ))}
              </div>
            )}
          </section>

          <section className="ds-card p-8 sm:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-forest" />
              <h3 className="ds-h3">Education</h3>
              <span className="ds-chip ds-chip-muted">{profile.education.length}</span>
            </div>
            {profile.education.length === 0 ? (
              <p className="ds-body ds-muted">No education entries yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {profile.education.map((edu) => (
                  <div key={edu.id} className="ds-card-inset p-6 space-y-2">
                    <div className="text-[18px] font-serif font-bold text-ink">{edu.institution}</div>
                    <div className="ds-body text-forest font-semibold">
                      {edu.degree || 'Degree'} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                    </div>
                    <div className="ds-caption flex items-center justify-between pt-2">
                      <span>{edu.start_date || ''} — {edu.end_date || 'Present'}</span>
                      {edu.grade && <span className="font-semibold text-ink">{edu.grade}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ds-card p-8 sm:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-forest" />
              <h3 className="ds-h3">Experience</h3>
              <span className="ds-chip ds-chip-muted">{profile.experience.length}</span>
            </div>
            {profile.experience.length === 0 ? (
              <p className="ds-body ds-muted">No experience entries yet.</p>
            ) : (
              <div className="space-y-4">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="ds-card-inset p-6 space-y-2">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <span className="text-[18px] font-serif font-bold text-ink">{exp.title}</span>
                      <span className="ds-caption">{exp.start_date || ''} — {exp.end_date || 'Present'}</span>
                    </div>
                    {exp.organization && <div className="text-[16px] font-semibold text-gold-deep">{exp.organization}</div>}
                    {exp.description && <p className="ds-body ds-muted">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ds-card p-8 sm:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Wrench className="h-6 w-6 text-forest" />
              <h3 className="ds-h3">Projects</h3>
              <span className="ds-chip ds-chip-muted">{profile.projects.length}</span>
            </div>
            {profile.projects.length === 0 ? (
              <p className="ds-body ds-muted">No projects yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {profile.projects.map((proj) => (
                  <div key={proj.id} className="ds-card-inset p-6 space-y-3">
                    <div className="text-[18px] font-serif font-bold text-ink">{proj.title}</div>
                    {proj.description && <p className="ds-body ds-muted">{proj.description}</p>}
                    {proj.technologies && (
                      <div className="ds-chip ds-chip-forest">{proj.technologies}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {hasExtractedData && (
            <div className="flex justify-end pt-2">
              <button onClick={onProceedToMatches} className="ds-btn-primary">
                <span>Run job matching</span>
                <ArrowRight className="h-5 w-5 text-gold" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
