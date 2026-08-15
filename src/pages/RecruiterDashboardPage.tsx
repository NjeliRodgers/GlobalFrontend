import React, { useState, useEffect } from 'react';
import { Job, Application } from '../types';
import { fetchJobs, createJob } from '../api/jobsApi';
import { fetchApplications } from '../api/applicationsApi';
import { RichTextEditor } from '../components/RichTextEditor';
import {
  Users,
  Briefcase,
  TrendingUp,
  Award,
  Plus,
  X,
  MapPin,
  CheckCircle2,
  DollarSign,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';

interface RecruiterDashboardPageProps {
  onNavigateToPipeline: (jobId?: string) => void;
  onNavigateToScheduler: () => void;
}

export const RecruiterDashboardPage: React.FC<RecruiterDashboardPageProps> = ({
  onNavigateToPipeline,
  onNavigateToScheduler
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // New Job Modal State
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('Engineering');
  const [newLocation, setNewLocation] = useState('San Francisco, CA (Hybrid)');
  const [newWorkType, setNewWorkType] = useState('Hybrid');
  const [newSalary, setNewSalary] = useState('$130,000 - $170,000 / yr');
  const [newDescription, setNewDescription] = useState('');
  const [newApexExamId, setNewApexExamId] = useState('');
  const [newJobError, setNewJobError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const [jobsData, appsData] = await Promise.all([fetchJobs(), fetchApplications()]);
    setJobs(jobsData);
    setApplications(appsData);
    setLoading(false);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDepartment) return;
    setNewJobError('');

    try {
      await createJob({
        title: newTitle,
        department: newDepartment,
        location: newLocation,
        workType: newWorkType as any,
        salaryRange: newSalary,
        description: newDescription || 'Join our high-performing team to build scalable enterprise solutions.',
        responsibilities: ['Architect scalable software services.', 'Collaborate with cross-functional partners.'],
        requirements: ['Proven experience in domain engineering.', 'Strong communication and analytical skills.'],
        benefits: ['Health, Dental, Vision', 'Competitive salary & bonus'],
        status: 'active',
        apexExamId: newApexExamId.trim()
      });

      setIsNewJobModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewApexExamId('');
      loadDashboardData();
    } catch (err: any) {
      setNewJobError(err.message || 'Failed to post job. Check the Exam ID and try again.');
    }
  };

  // Metrics Calculations
  const totalOpenings = jobs.filter((j) => j.status === 'active').length;
  const totalApplications = applications.length;
  const assessmentPassedCount = applications.filter((a) => a.stage === 'Assessment Passed').length;
  const interviewScheduledCount = applications.filter(
    (a) => a.stage === 'Technical Interview' || a.stage === 'Final Interview'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
            Recruiter Operations Center
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">Enterprise Hiring & Pipeline Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor posted job openings, application counts, stage conversion metrics, and bulk candidate status updates.
          </p>
        </div>

        <button
          onClick={() => setIsNewJobModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Post New Job Opening</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Openings</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalOpenings}</div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Currently accepting candidates
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Candidates</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalApplications}</div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Applications across all postings
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Passed Assessment</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{assessmentPassedCount}</div>
          <p className="text-[11px] text-slate-500">Auto-qualified via test questions</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Interviews Scheduled</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{interviewScheduledCount}</div>
          <p className="text-[11px] text-slate-500">Active calendar technical loops</p>
        </div>
      </div>

      {/* Posted Job Openings Table with Application Counts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">All Posted Job Openings</h2>
            <p className="text-xs text-slate-500">View application counts and jump directly into candidate stage pipelines</p>
          </div>

          <button
            onClick={() => onNavigateToPipeline()}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Open Kanban Pipeline</span>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading job positions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Job Title & ID</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Location & Work Type</th>
                  <th className="p-3">Salary Range</th>
                  <th className="p-3 text-center">Application Count</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <span className="font-extrabold text-slate-900 text-sm block">{job.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">REF: {job.id}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{job.department}</td>
                    <td className="p-3 text-slate-600">
                      <div>{job.location}</div>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-semibold">
                        {job.workType}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-700">{job.salaryRange}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-xs">
                        <Users className="h-3.5 w-3.5" /> {job.applicationCount}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onNavigateToPipeline(job.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer shadow-2xs"
                      >
                        Manage Applicants
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Post New Job Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Post New Job Opening</h3>
              <button onClick={() => setIsNewJobModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Position Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Type</label>
                  <select
                    value={newWorkType}
                    onChange={(e) => setNewWorkType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam ID</label>
                <input
                  type="text"
                  value={newApexExamId}
                  onChange={(e) => setNewApexExamId(e.target.value)}
                  required
                  placeholder="e.g. 56743"
                  maxLength={5}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Must match a 5-digit Exam ID already created in Exam Builder — the job won't post otherwise.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description Overview</label>
                <RichTextEditor
                  value={newDescription}
                  onChange={setNewDescription}
                  placeholder="Describe the role — use the toolbar for bold, italic, or lists…"
                />
              </div>

              {newJobError && (
                <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                  {newJobError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Publish Job Opening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
