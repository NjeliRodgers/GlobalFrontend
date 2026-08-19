import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { useAuth } from '../auth/AuthContext';
import { fetchApplications } from '../api/applicationsApi';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface JobDetailPageProps {
  job: Job;
  onBack: () => void;
  onApply: (job: Job) => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ job, onBack, onApply }) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setAlreadyApplied(false);
      return;
    }
    fetchApplications({ candidateId: user.id, jobId: job.id }).then((apps) => {
      setAlreadyApplied(apps.length > 0);
    });
  }, [isAuthenticated, user?.id, job.id]);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      openAuthModal(job.id);
    } else if (!alreadyApplied) {
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
            disabled={isAuthenticated && alreadyApplied}
            className={
              isAuthenticated && alreadyApplied
                ? 'px-6 py-3 bg-slate-100 text-slate-400 font-semibold text-sm tracking-wide rounded-lg cursor-not-allowed shrink-0'
                : 'inline-flex items-center gap-2 px-6 py-3 bg-[#1f4e79] hover:bg-[#102a43] text-white font-semibold text-sm tracking-wide rounded-lg shadow-md transition cursor-pointer shrink-0'
            }
          >
            {isAuthenticated && alreadyApplied ? 'Already Applied' : 'Apply For Position'}
            {!(isAuthenticated && alreadyApplied) && <ArrowRight className="h-4 w-4" />}
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
            <div
              className="text-sm text-slate-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_u]:underline [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
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

          <div className="bg-[#102a43] rounded-2xl p-4 text-white shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 bg-white/10 text-[#c3d3e2] rounded-lg shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm leading-tight">Automated Hiring Process</h4>
                  <p className="text-[11px] text-indigo-200 leading-snug mt-1">
                    Submit once, receive confirmation instantly, and get next-step guidance by email after CV review.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleApplyClick}
              disabled={isAuthenticated && alreadyApplied}
              className={
                isAuthenticated && alreadyApplied
                  ? 'mt-3 w-full py-2 bg-slate-300/80 text-slate-500 font-bold text-xs rounded-lg cursor-not-allowed'
                  : 'mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 bg-amber-300 hover:bg-amber-200 text-slate-900 font-extrabold text-xs rounded-lg transition cursor-pointer'
              }
            >
              {isAuthenticated && alreadyApplied ? 'Already Applied' : 'Tap to Start Application'}
              {!(isAuthenticated && alreadyApplied) && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
