import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
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
      // Read-only derived value — no setState needed here
      if (parsingStatus === 'none' && latest.parsing_status !== 'none') {
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-4">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] text-xs font-semibold">
          <FileText className="h-3.5 w-3.5" />
          <span>Step 2 of 3 · Resume Parsing & Skill Structuring</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#171B16]">
          Upload Resume PDF
        </h2>
        <p className="text-slate-600 text-sm max-w-xl mx-auto font-sans">
          PyMuPDF extracts raw text deterministically, while Google Gemini AI structures your skills, education, and project cards.
        </p>
      </div>

      {/* Upload Zone & Status Card */}
      <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Drag and Drop Box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            selectedFile
              ? 'border-[#2C5F2D] bg-[#2C5F2D]/5'
              : 'border-[#D5D3C5] hover:border-[#2C5F2D] bg-[#FAF9F5]'
          }`}
        >
          <div className="max-w-sm mx-auto space-y-4 font-sans">
            <div className="h-14 w-14 mx-auto rounded-full bg-[#2C5F2D]/10 text-[#2C5F2D] flex items-center justify-center">
              <UploadCloud className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Drag and drop your PDF resume here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Accepts PDF files up to 5MB</p>
            </div>

            <div className="flex items-center justify-center space-x-3">
              <label className="cursor-pointer px-4 py-2 bg-[#EAE8DE] hover:bg-[#DFDCD0] text-slate-800 rounded-xl text-xs font-semibold transition-colors">
                Browse Files
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </label>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-5 py-2 bg-[#2C5F2D] hover:bg-[#234E25] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#2C5F2D]/20 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {uploading ? (
                    <span>Parsing PDF...</span>
                  ) : (
                    <>
                      <span>Parse & Structure Resume</span>
                      <Sparkles className="h-3.5 w-3.5 text-[#C9A63B]" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="space-y-2 font-sans">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-[#2C5F2D] animate-ping" />
                <span className="font-semibold">Extracting text & structuring skills via Gemini API...</span>
              </span>
              <span className="font-bold text-[#2C5F2D]">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[#EAE8DE] rounded-full h-2 overflow-hidden border border-[#D5D3C5]">
              <div
                className="bg-[#2C5F2D] h-2 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Friendly Error State */}
        {parsingStatus === 'failed' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans space-y-1 text-left">
            <div className="flex items-center space-x-2 font-bold text-rose-700">
              <AlertCircle className="h-4 w-4" />
              <span>Resume Extraction Issue</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {errorMsg || 'The uploaded file could not be parsed into structured candidate profile data. Please try another clear PDF resume.'}
            </p>
          </div>
        )}

        {/* Success Banner */}
        {parsingStatus === 'success' && (
          <div className="p-4 rounded-xl bg-[#2C5F2D]/10 border border-[#2C5F2D]/30 text-[#171B16] text-xs font-sans flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-[#2C5F2D]" />
              <span className="font-bold text-slate-800">Resume parsed and verified successfully into candidate profile!</span>
            </div>
            <button
              onClick={onProceedToMatches}
              className="px-4 py-2 bg-[#2C5F2D] hover:bg-[#234E25] text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>View Job Matches</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#C9A63B]" />
            </button>
          </div>
        )}

      </div>

      {/* Extracted Structured Profile View (Cards & Skill Tags) */}
      {profile && (
        <div className="space-y-6 text-left font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-[#C9A63B]" />
              <h3 className="text-base font-serif font-bold text-[#171B16]">
                Extracted Candidate Profile
              </h3>
            </div>
            <button
              onClick={reloadProfile}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1 bg-white px-3 py-1.5 rounded-lg border border-[#E2E0D5] cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Refresh Profile</span>
            </button>
          </div>

          {/* Skills Section (Chips grouped by Category) */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Code2 className="h-4 w-4 text-[#2C5F2D]" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Skills ({profile.skills.length})
              </h4>
            </div>

            {profile.skills.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No skills extracted yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      skill.category === 'technical'
                        ? 'bg-[#2C5F2D]/10 text-[#2C5F2D] border-[#2C5F2D]/30'
                        : skill.category === 'tool'
                        ? 'bg-[#C9A63B]/15 text-[#8A6D1D] border-[#C9A63B]/30'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Education Cards */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-[#2C5F2D]" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Education ({profile.education.length})
              </h4>
            </div>

            {profile.education.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No education entries listed.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.education.map((edu) => (
                  <div key={edu.id} className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2E0D5] space-y-1">
                    <div className="text-xs font-bold text-[#171B16]">{edu.institution}</div>
                    <div className="text-xs font-semibold text-[#2C5F2D]">
                      {edu.degree || 'Degree'} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>{edu.start_date || ''} - {edu.end_date || 'Present'}</span>
                      {edu.grade && <span className="font-semibold text-slate-700">{edu.grade}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Experience Cards */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-[#2C5F2D]" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Experience ({profile.experience.length})
              </h4>
            </div>

            {profile.experience.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No experience entries listed.</p>
            ) : (
              <div className="space-y-3">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2E0D5] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#171B16]">{exp.title}</span>
                      <span className="text-[11px] text-slate-500">{exp.start_date || ''} - {exp.end_date || 'Present'}</span>
                    </div>
                    {exp.organization && <div className="text-xs font-semibold text-[#8A6D1D]">{exp.organization}</div>}
                    {exp.description && <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects Cards */}
          <div className="bg-white border border-[#E2E0D5] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-4 w-4 text-[#2C5F2D]" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Projects ({profile.projects.length})
              </h4>
            </div>

            {profile.projects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No projects listed.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.projects.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2E0D5] space-y-2">
                    <div className="text-xs font-bold text-[#171B16]">{proj.title}</div>
                    {proj.description && <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>}
                    {proj.technologies && (
                      <div className="text-[11px] font-medium text-[#2C5F2D] bg-[#2C5F2D]/10 border border-[#2C5F2D]/20 px-2.5 py-1 rounded-md">
                        Tech: {proj.technologies}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Proceed Button */}
          {hasExtractedData && (
            <div className="pt-4 flex justify-end">
              <button
                onClick={onProceedToMatches}
                className="px-6 py-3.5 bg-[#2C5F2D] hover:bg-[#234E25] text-white font-bold rounded-xl text-sm shadow-md shadow-[#2C5F2D]/25 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <span>Run Job Matching RAG Pipeline</span>
                <ArrowRight className="h-4 w-4 text-[#C9A63B]" />
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
