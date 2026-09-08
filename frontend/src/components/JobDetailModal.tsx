import React from 'react';
import { X, Building2, MapPin, Award, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { JobMatch } from '../types';

interface JobDetailModalProps {
  job: JobMatch | null;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose }) => {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171B16]/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white border border-[#E2E0D5] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-left">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E2E0D5]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#2C5F2D] uppercase tracking-wider mb-1">
              <span>{job.posting_type}</span>
              <span>•</span>
              <span>{job.experience_level}</span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#171B16]">{job.title}</h3>
            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-600">
              <span className="flex items-center space-x-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{job.company}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{job.location}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#FAF9F5] hover:bg-[#EAE8DE] text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* AI Score & Rationale Box */}
        <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#2C5F2D]/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Award className="h-4 w-4 text-[#2C5F2D]" />
              <span>AI Match Analysis Score</span>
            </span>
            <div className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#2C5F2D] text-white shadow-xs">
              {job.match_score}% Match
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed italic">
            "{job.reasoning}"
          </p>
        </div>

        {/* Required & Missing Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Required Skills */}
          <div className="p-4 rounded-xl bg-white border border-[#E2E0D5] space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#2C5F2D]" />
              <span>Required Skills ({job.required_skills.length})</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.map((skill, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#2C5F2D]/10 text-[#2C5F2D] border border-[#2C5F2D]/20">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skill Gaps */}
          <div className="p-4 rounded-xl bg-[#C85A32]/5 border border-[#C85A32]/20 space-y-2">
            <h4 className="text-xs font-bold text-[#C85A32] flex items-center space-x-1.5 uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5 text-[#C85A32]" />
              <span>Skill Gaps ({job.missing_skills.length})</span>
            </h4>
            {job.missing_skills.length === 0 ? (
              <p className="text-xs text-[#2C5F2D] font-semibold">Complete skill alignment for this role!</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {job.missing_skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#C85A32]/15 text-[#C85A32] border border-[#C85A32]/30">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Full Job Description */}
        <div className="space-y-2 pt-2 border-t border-[#E2E0D5]">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Job Description</h4>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E0D5]">
            {job.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#171B16] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
