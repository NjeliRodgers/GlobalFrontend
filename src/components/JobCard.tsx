import React, { useState } from 'react';
import { Job } from '../types';
import { MapPin, Briefcase, Users, Bookmark, Calendar, Globe } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onApplyClick: (job: Job) => void;
  onViewDetails: (job: Job) => void;
  isSavedInitial?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApplyClick, onViewDetails, isSavedInitial = false }) => {
  const [isSaved, setIsSaved] = useState(isSavedInitial);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-[#1f4e79]/40 transition-all flex flex-col justify-between group relative">
      <div>
        {/* Top Header Row with Save button at top right corner */}
        <div className="flex items-start justify-between gap-3 mb-2 pr-1">
          <div>
            <span className="inline-block text-[11px] font-bold text-[#1f4e79] bg-[#1f4e79]/10 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
              {job.department}
            </span>
            <h3
              onClick={() => onViewDetails(job)}
              className="text-lg font-bold text-slate-900 group-hover:text-[#1f4e79] transition cursor-pointer"
            >
              {job.title}
            </h3>
          </div>

          {/* Top Right Save / Bookmark Button */}
          <button
            onClick={handleToggleSave}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              isSaved
                ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title={isSaved ? "Remove from saved jobs" : "Save job position"}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">{job.description}</p>

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-5">
          {job.country && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg font-medium text-slate-700">
              <Globe className="h-3.5 w-3.5 text-[#1f4e79]" />
              Country: {job.country}
            </span>
          )}
          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg font-medium text-slate-700">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            Location: {job.location}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg font-bold text-emerald-800">
            Salary: {job.salaryRange}
          </span>
          {job.deadline && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg font-semibold text-amber-800">
              <Calendar className="h-3.5 w-3.5 text-amber-600" />
              Deadline: {job.deadline}
            </span>
          )}
          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            {job.workType}
          </span>
        </div>
      </div>

      {/* Bottom Footer Row with Apply at left corner */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Apply Button at Left Corner */}
        <button
          onClick={() => onApplyClick(job)}
          className="text-xs font-semibold tracking-wide text-white bg-[#1f4e79] hover:bg-[#102a43] px-5 py-2 rounded-lg shadow-xs hover:shadow-md transition cursor-pointer"
        >
          Apply
        </button>

        <button
          onClick={() => onViewDetails(job)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
