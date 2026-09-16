import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Job, Application } from '../types';
import { fetchJobs, createJob, updateJob, deleteJob, sendCustomEmailToJobApplicants } from '../api/jobsApi';
import { fetchApplications } from '../api/applicationsApi';
import { getApexPackages } from '../api/apexAssessmentApi';
import { RichTextEditor } from '../components/RichTextEditor';
import {
  Users,
  Briefcase,
  TrendingUp,
  Award,
  Search,
  Plus,
  X,
  MapPin,
  CheckCircle2,
  DollarSign,
  Filter,
  Layers,
  Sparkles,
  Pencil,
  Trash2,
  Mail,
  Send
} from 'lucide-react';

interface RecruiterDashboardPageProps {
  onNavigateToPipeline: (jobId?: string) => void;
  onNavigateToScheduler: () => void;
}

export const RecruiterDashboardPage: React.FC<RecruiterDashboardPageProps> = ({
  onNavigateToPipeline,
  onNavigateToScheduler
}) => {
  const DEFAULT_BULK_SUBJECT = 'Important Update On Your {{jobTitle}} Application';
  const DEFAULT_BULK_MESSAGE =
    'Dear {{candidateName}},\n\n' +
    'Congratulations. You have been accepted for the {{jobTitle}} opportunity at {{companyName}}.\n\n' +
    'We would love to submit your profile to our client immediately. Please contact us urgently on WhatsApp: {{whatsappNumber}}\n' +
    'Direct link: {{whatsappLink}}\n\n' +
    'When you message us, include your email ({{candidateEmail}}) and job title ({{jobTitle}}) for faster processing.\n\n' +
    'Kind regards,\nRecruitment Team\n{{companyName}}';

  const DRAG_FIELDS: Array<{ token: string; label: string }> = [
    { token: '{{candidateName}}', label: 'Candidate Name' },
    { token: '{{candidateEmail}}', label: 'Candidate Email' },
    { token: '{{jobTitle}}', label: 'Job Title' },
    { token: '{{jobLocation}}', label: 'Job Location' },
    { token: '{{jobDepartment}}', label: 'Department' },
    { token: '{{whatsappNumber}}', label: 'WhatsApp Number' },
    { token: '{{whatsappLink}}', label: 'WhatsApp Link' },
    { token: '{{companyName}}', label: 'Company Name' }
  ];

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [packages, setPackages] = useState<Array<{ id: string; packageId?: string; name: string; isActive: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  // New Job Modal State
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newWorkType, setNewWorkType] = useState('Full-Time');
  const [newSalary, setNewSalary] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [expiryAmount, setExpiryAmount] = useState('');
  const [expiryUnit, setExpiryUnit] = useState<'hours' | 'days' | 'weeks' | 'months'>('days');
  const [newApexPackageIds, setNewApexPackageIds] = useState<string[]>([]);
  const [packagePickerValue, setPackagePickerValue] = useState('');
  const [newJobError, setNewJobError] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [bulkEmailModalJob, setBulkEmailModalJob] = useState<Job | null>(null);
  const [bulkEmailSubject, setBulkEmailSubject] = useState(DEFAULT_BULK_SUBJECT);
  const [bulkEmailMessage, setBulkEmailMessage] = useState(DEFAULT_BULK_MESSAGE);
  const [bulkEmailSending, setBulkEmailSending] = useState(false);
  const [bulkEmailError, setBulkEmailError] = useState('');
  const [bulkEmailNotice, setBulkEmailNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [activeDropField, setActiveDropField] = useState<'subject' | 'message' | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const [jobsData, appsData, packagesData] = await Promise.all([fetchJobs(), fetchApplications(), getApexPackages().catch((err) => { console.error('Failed to load packages:', err); return []; })]);
    setJobs(jobsData);
    setApplications(appsData);
    setPackages((packagesData || []).filter((p) => p.isActive));
    setLoading(false);
  };

  const handleOpenEditJob = (job: Job) => {
    setEditingJobId(job.id);
    setNewTitle(job.title);
    setNewDepartment(job.department);
    setNewLocation(job.location);
    setNewWorkType(job.workType);
    setNewSalary(job.salaryRange);
    setNewDescription(job.description);
    setNewApexPackageIds(
      job.apexPackageIds && job.apexPackageIds.length ? job.apexPackageIds : job.apexPackageId ? [job.apexPackageId] : []
    );
    setNewJobError('');
    setIsNewJobModalOpen(true);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDepartment) return;
    if (newApexPackageIds.length === 0) {
      setNewJobError('Please choose a package before publishing this job.');
      return;
    }
    setNewJobError('');

    const selectedPackages = newApexPackageIds
      .map((ref) => packages.find((p) => p.id === ref || p.packageId === ref))
      .filter((p): p is { id: string; packageId?: string; name: string; isActive: boolean } => Boolean(p));
    if (selectedPackages.length !== newApexPackageIds.length) {
      setNewJobError('Selected package could not be found. Refresh and try again.');
      return;
    }

    let computedExpiresAt: string | undefined;
    if (expiryAmount && Number(expiryAmount) > 0) {
      const amount = Number(expiryAmount);
      const expires = new Date();
      if (expiryUnit === 'months') expires.setMonth(expires.getMonth() + amount);
      else if (expiryUnit === 'weeks') expires.setDate(expires.getDate() + amount * 7);
      else if (expiryUnit === 'days') expires.setDate(expires.getDate() + amount);
      else if (expiryUnit === 'hours') expires.setHours(expires.getHours() + amount);
      computedExpiresAt = expires.toISOString();
    }

    const jobPayload: any = {
      title: newTitle,
      department: newDepartment,
      location: newLocation,
      workType: newWorkType as any,
      salaryRange: newSalary,
      description: newDescription || 'Join our high-performing team to build scalable enterprise solutions.',
      apexPackageIds: selectedPackages.map((p) => p.packageId || p.id)
    };
    if (computedExpiresAt) jobPayload.expiresAt = computedExpiresAt;

    // Only stamp default status/benefits on a brand-new posting — editing an
    // existing job must never silently reactivate it or wipe its benefits.
    if (!editingJobId) {
      jobPayload.status = 'active';
      jobPayload.benefits = ['Health, Dental, Vision', 'Competitive salary & bonus'];
    }

    try {
      if (editingJobId) {
        await updateJob(editingJobId, jobPayload);
      } else {
        await createJob(jobPayload);
      }

      setIsNewJobModalOpen(false);
      setEditingJobId(null);
      setNewTitle('');
      setNewDescription('');
      setNewApexPackageIds([]);
      setExpiryAmount('');
      setExpiryUnit('days');
      loadDashboardData();
    } catch (err: any) {
      setNewJobError(
        err.message ||
          (editingJobId
            ? 'Failed to update job. Check the selected package and try again.'
            : 'Failed to post job. Check the selected package and try again.')
      );
    }
  };

  const handleDeleteJob = async (job: Job) => {
    const confirmed = window.confirm(
      `Delete job "${job.title}"? This removes the posting from the system.`
    );
    if (!confirmed) return;

    try {
      await deleteJob(job.id);
      await loadDashboardData();
    } catch (err: any) {
      window.alert(err.message || 'Failed to delete this job.');
    }
  };

  // Metrics Calculations
  const totalOpenings = jobs.filter((j) => j.status === 'active').length;
  const totalApplications = applications.length;
  const assessmentPassedCount = applications.filter((a) => a.stage === 'Assessment Passed').length;
  const interviewScheduledCount = applications.filter(
    (a) => a.stage === 'Technical Interview' || a.stage === 'Final Interview'
  ).length;
  const filteredJobs = jobs.filter((job) => {
    const query = jobSearchQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      job.title.toLowerCase().includes(query) ||
      job.department.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      job.workType.toLowerCase().includes(query) ||
      job.salaryRange.toLowerCase().includes(query) ||
      job.id.toLowerCase().includes(query)
    );
  });

  const selectedJobApplicants = useMemo(() => {
    if (!bulkEmailModalJob) return [];
    return applications.filter((app) => app.jobId === bulkEmailModalJob.id);
  }, [applications, bulkEmailModalJob]);

  const insertToken = (field: 'subject' | 'message', token: string) => {
    if (field === 'subject') {
      const input = subjectRef.current;
      if (!input) {
        setBulkEmailSubject((prev) => `${prev}${token}`);
        return;
      }
      const start = input.selectionStart ?? bulkEmailSubject.length;
      const end = input.selectionEnd ?? start;
      const next = `${bulkEmailSubject.slice(0, start)}${token}${bulkEmailSubject.slice(end)}`;
      setBulkEmailSubject(next);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start + token.length, start + token.length);
      });
      return;
    }

    const textarea = messageRef.current;
    if (!textarea) {
      setBulkEmailMessage((prev) => `${prev}${token}`);
      return;
    }
    const start = textarea.selectionStart ?? bulkEmailMessage.length;
    const end = textarea.selectionEnd ?? start;
    const next = `${bulkEmailMessage.slice(0, start)}${token}${bulkEmailMessage.slice(end)}`;
    setBulkEmailMessage(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleDragTokenStart = (e: React.DragEvent<HTMLButtonElement>, token: string) => {
    e.dataTransfer.setData('text/plain', token);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropToken = (field: 'subject' | 'message', e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setActiveDropField(null);
    const token = e.dataTransfer.getData('text/plain');
    if (!token) return;
    insertToken(field, token);
  };

  const openBulkEmailModal = (job: Job) => {
    setBulkEmailModalJob(job);
    setBulkEmailSubject(DEFAULT_BULK_SUBJECT);
    setBulkEmailMessage(DEFAULT_BULK_MESSAGE);
    setBulkEmailError('');
    setBulkEmailNotice(null);
    setActiveDropField(null);
  };

  const closeBulkEmailModal = () => {
    if (bulkEmailSending) return;
    setBulkEmailModalJob(null);
    setBulkEmailError('');
    setActiveDropField(null);
  };

  const handleSendBulkCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkEmailModalJob) return;

    const subject = bulkEmailSubject.trim();
    const message = bulkEmailMessage.trim();

    if (!subject || !message) {
      setBulkEmailError('Subject and message are required before sending.');
      return;
    }

    setBulkEmailError('');
    setBulkEmailSending(true);
    setBulkEmailNotice(null);

    try {
      const result = await sendCustomEmailToJobApplicants(bulkEmailModalJob.id, { subject, message });
      setBulkEmailNotice({
        ok: result.failedCount === 0,
        message:
          result.failedCount === 0
            ? `Custom email sent to ${result.deliveredCount} candidate(s) for ${bulkEmailModalJob.title}.`
            : `Sent to ${result.deliveredCount} candidate(s), ${result.failedCount} failed delivery.`
      });
      await loadDashboardData();
      setBulkEmailModalJob(null);
    } catch (err: any) {
      setBulkEmailError(err?.message || 'Failed to send custom email to applicants.');
    } finally {
      setBulkEmailSending(false);
    }
  };

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
          onClick={() => {
            setEditingJobId(null);
            setNewTitle('');
            setNewDepartment('  ');
            setNewLocation(' ');
            setNewWorkType(' ');
            setNewSalary('ksh.130,000 - KSh.170,000 / month');
            setNewDescription('');
            setNewApexPackageIds([]);
            setNewJobError('');
            setIsNewJobModalOpen(true);
          }}
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
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={jobSearchQuery}
            onChange={(e) => setJobSearchQuery(e.target.value)}
            placeholder="Search job title, department, location, type, or ref..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">All Posted Job Openings ({filteredJobs.length})</h2>
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
                  <th className="p-3">Last Custom Email</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredJobs.map((job) => (
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
                    <td className="p-3 text-slate-600">
                      {job.lastCustomEmail ? (
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{job.lastCustomEmail.subject}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-2">{job.lastCustomEmail.messagePreview}</p>
                          <p className="text-[10px] text-slate-400">{new Date(job.lastCustomEmail.sentAt).toLocaleString()}</p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No custom email sent yet</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditJob(job)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 text-slate-600 font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job)}
                          className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                        <button
                          onClick={() => openBulkEmailModal(job)}
                          disabled={job.applicationCount <= 0}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          title={job.applicationCount <= 0 ? 'No applicants yet for this job' : 'Compose and send custom email to all applicants'}
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Send Bulk Email
                        </button>
                        <button
                          onClick={() => onNavigateToPipeline(job.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer shadow-2xs"
                        >
                          Manage Applicants
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {bulkEmailNotice && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
            bulkEmailNotice.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {bulkEmailNotice.ok ? <CheckCircle2 className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          {bulkEmailNotice.message}
        </div>
      )}

      {bulkEmailModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl p-6 relative max-h-[92vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Send Custom Email To All Applicants</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bulkEmailModalJob.title} · {selectedJobApplicants.length} applicant(s)
                </p>
              </div>
              <button
                onClick={closeBulkEmailModal}
                disabled={bulkEmailSending}
                className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">Drag Or Click Fields</p>
              <div className="flex flex-wrap gap-2">
                {DRAG_FIELDS.map((field) => (
                  <button
                    key={field.token}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragTokenStart(e, field.token)}
                    onClick={() => insertToken(activeDropField || 'message', field.token)}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-[11px] font-bold hover:bg-indigo-50 cursor-grab active:cursor-grabbing"
                  >
                    {field.label}: {field.token}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendBulkCustomEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject</label>
                <input
                  ref={subjectRef}
                  type="text"
                  value={bulkEmailSubject}
                  onChange={(e) => setBulkEmailSubject(e.target.value)}
                  onFocus={() => setActiveDropField('subject')}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setActiveDropField('subject');
                  }}
                  onDrop={(e) => handleDropToken('subject', e)}
                  placeholder="Enter subject"
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    activeDropField === 'subject' ? 'border-indigo-400' : 'border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  ref={messageRef}
                  value={bulkEmailMessage}
                  onChange={(e) => setBulkEmailMessage(e.target.value)}
                  onFocus={() => setActiveDropField('message')}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setActiveDropField('message');
                  }}
                  onDrop={(e) => handleDropToken('message', e)}
                  rows={11}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    activeDropField === 'message' ? 'border-indigo-400' : 'border-slate-200'
                  }`}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Use placeholders such as {'{{candidateName}}'}, {'{{jobTitle}}'}, and {'{{whatsappLink}}'} to personalize each email.
                </p>
              </div>

              {bulkEmailError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 font-semibold">
                  {bulkEmailError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeBulkEmailModal}
                  disabled={bulkEmailSending}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkEmailSending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {bulkEmailSending ? <Sparkles className="h-3.5 w-3.5 animate-pulse" /> : <Send className="h-3.5 w-3.5" />}
                  {bulkEmailSending ? 'Sending...' : `Send To ${selectedJobApplicants.length} Applicant(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post New Job Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-lg">{editingJobId ? 'Edit Job Opening' : 'Post New Job Opening'}</h3>
              <button
                onClick={() => {
                  setIsNewJobModalOpen(false);
                  setEditingJobId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Application Deadline</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={expiryAmount}
                    onChange={(e) => setExpiryAmount(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={expiryUnit}
                    onChange={(e) => setExpiryUnit(e.target.value as any)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank to keep this posting open indefinitely.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Packages</label>
                <select
                  value={packagePickerValue}
                  onChange={(e) => {
                    const ref = e.target.value;
                    if (ref && !newApexPackageIds.includes(ref)) {
                      setNewApexPackageIds((current) => [...current, ref]);
                    }
                    setPackagePickerValue('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Add a package…</option>
                  {packages
                    .filter((pkg) => !newApexPackageIds.includes(pkg.packageId || pkg.id))
                    .map((pkg) => (
                      <option key={pkg.id} value={pkg.packageId || pkg.id}>
                        {pkg.packageId ? `${pkg.packageId} - ` : ''}{pkg.name}
                      </option>
                    ))}
                </select>

                {newApexPackageIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newApexPackageIds.map((ref) => {
                      const pkg = packages.find((p) => p.id === ref || p.packageId === ref);
                      return (
                        <span
                          key={ref}
                          className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        >
                          {pkg?.packageId ? `${pkg.packageId} - ` : ''}{pkg?.name || ref}
                          <button
                            type="button"
                            onClick={() => setNewApexPackageIds((current) => current.filter((id) => id !== ref))}
                            className="hover:text-indigo-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 mt-1">
                  Add one or more active packages.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description Overview</label>
                <RichTextEditor
                  value={newDescription}
                  onChange={setNewDescription}
                  placeholder="Describe the role — use the toolbar for bold, italic, or lists…"
                />
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />
                  Key Responsibilities and Requirements & Qualifications.
                </p>
              </div>

              {newJobError && (
                <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                  {newJobError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewJobModalOpen(false);
                    setEditingJobId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingJobId ? 'Save Changes' : 'Publish Job Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
