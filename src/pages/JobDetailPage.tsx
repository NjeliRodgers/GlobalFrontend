import React from 'react';
import { Job } from '../types';
import { useAuth } from '../auth/AuthContext';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  CheckCircle2,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface JobDetailPageProps {
  job: Job;
  onBack: () => void;
  onApply: (job: Job) => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ job, onBack, onApply }) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      openAuthModal(job.id);
    } else {
      onApply(job);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg transition cursor-pointer"
      >
        Back to All Openings
      </button>

      {/* Main Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
              {job.department}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{job.title}</h1>
          </div>

          <button
            onClick={handleApplyClick}
            className="px-6 py-3 bg-[#1f4e79] hover:bg-[#102a43] text-white font-semibold text-sm tracking-wide rounded-lg shadow-md transition cursor-pointer shrink-0"
          >
            Apply For Position
          </button>
        </div>

        {/* Badges Grid */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium">
            <MapPin className="h-4 w-4 text-slate-400" />
            {job.location}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium">
            <Briefcase className="h-4 w-4 text-slate-400" />
            {job.workType} ({job.experienceLevel})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            {job.salaryRange}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium">
            <Users className="h-4 w-4 text-slate-400" />
            {job.applicationCount} Applicants
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium">
            <Calendar className="h-4 w-4 text-slate-400" />
            Posted {job.postedAt}
          </span>
        </div>
      </div>

      {/* Description & Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Role Overview</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Key Responsibilities</h3>
            <ul className="space-y-2.5">
              {job.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Requirements & Qualifications</h3>
            <ul className="space-y-2.5">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Benefits & Perks</h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {job.benefits.map((ben, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span>{ben}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#102a43] rounded-2xl p-6 text-white space-y-3 shadow-md">
            <div className="p-2 bg-white/10 text-[#c3d3e2] rounded-xl w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm">Automated Hiring Process</h4>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Upon submitting your application and documents, you'll receive an immediate confirmation email. Once our team has reviewed your CV, we'll follow up by email with next steps and a secure link to the Apex Assessment test for your interview stages.
            </p>
            <button
              onClick={handleApplyClick}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-indigo-900 font-bold text-xs rounded-xl transition cursor-pointer mt-2"
            >
              Start Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
