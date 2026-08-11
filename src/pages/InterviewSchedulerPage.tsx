import React, { useState, useEffect } from 'react';
import { Interview } from '../types';
import { fetchInterviews } from '../api/interviewsApi';
import { Calendar, Clock, Video, User, Plus, Search, CheckCircle2 } from 'lucide-react';

export const InterviewSchedulerPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    const data = await fetchInterviews();
    setInterviews(data);
    setLoading(false);
  };

  const filteredInterviews = interviews.filter(
    (i) =>
      i.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.interviewerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
            Integrated Coordination Tools
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">Interview Scheduling Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate video interviews, assign technical reviewers, track calendar slots, and view automated invitation logs.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate or interviewer name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Scheduled List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
          Scheduled Candidate Interviews ({filteredInterviews.length})
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading scheduled interviews...</div>
        ) : filteredInterviews.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            No scheduled interview sessions found. Schedule technical interviews directly from the Candidate Pipeline board!
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInterviews.map((int) => (
              <div key={int.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:bg-white transition">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                      {int.stage}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-1">
                      {int.candidateName} — <span className="text-slate-600 font-medium">{int.jobTitle}</span>
                    </h3>
                  </div>

                  <span className="text-xs font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {int.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span>{new Date(int.scheduledAt).toLocaleString()} ({int.durationMinutes} mins)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Interviewer: <strong>{int.interviewerName}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-indigo-700 truncate">
                    <Video className="h-4 w-4 text-indigo-600 shrink-0" />
                    <a href={int.meetingLink} target="_blank" rel="noreferrer" className="hover:underline truncate">
                      {int.meetingLink}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
