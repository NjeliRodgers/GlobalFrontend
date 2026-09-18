import React, { useState } from 'react';
import {
  LifeBuoy,
  Search,
  Loader2,
  Mail,
  MessageCircle,
  UserPlus,
  Phone,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  Award,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  History,
  ExternalLink,
  X
} from 'lucide-react';
import { Job } from '../types';
import {
  fetchCandidateSupportProfile,
  assumeSupportItemPaid,
  SupportProfile,
  SupportApplication
} from '../api/supportApi';
import {
  createCandidateApplicationAndSendAccessCode,
  sendApplicationAccessCodeEmail
} from '../api/applicationsApi';
import { fetchJobs } from '../api/jobsApi';

const ATESTA_URL = 'https://atesta.mobit.co.ke/';

const CircularReadiness: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const color = percentage >= 100 ? '#059669' : percentage >= 50 ? '#4f46e5' : '#dc2626';

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-extrabold text-slate-900">{percentage}%</span>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ status: 'delivered' | 'sent' | 'failed' }> = ({ status }) => {
  const map = {
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sent: 'bg-sky-50 text-sky-700 border-sky-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200'
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${map[status]}`}>
      {status === 'failed' ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
      {status}
    </span>
  );
};

export const CandidateControlPanelPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<SupportProfile | null>(null);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [panelNotice, setPanelNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [showNonRegisteredModal, setShowNonRegisteredModal] = useState(false);
  const [nonRegisteredSending, setNonRegisteredSending] = useState(false);
  const [nonRegisteredError, setNonRegisteredError] = useState('');
  const [assumingPaidKey, setAssumingPaidKey] = useState<string | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [nonRegisteredForm, setNonRegisteredForm] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    candidateLocation: '',
    jobId: ''
  });

  const activeApplication: SupportApplication | undefined =
    profile?.applications.find((a) => a.id === activeApplicationId) || profile?.applications[0];

  const handleImport = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setSendResult(null);
    setPanelNotice(null);
    setProfile(null);
    try {
      const data = await fetchCandidateSupportProfile(email.trim());
      setProfile(data);
      setActiveApplicationId(data.applications[0]?.id || null);
    } catch (err: any) {
      setError(err.message || 'Failed to import candidate details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!profile || !activeApplication) return;
    setSending(true);
    setSendResult(null);
    setPanelNotice(null);
    try {
      const result = await sendApplicationAccessCodeEmail(activeApplication.id);
      setSendResult({
        ok: result.delivered,
        message: result.delivered
          ? `Access-code email sent to ${profile.candidate.email}.`
          : `Send attempted but delivery was not confirmed for ${profile.candidate.email}.`
      });
      // Refresh email history so the log we just created shows up immediately.
      const refreshed = await fetchCandidateSupportProfile(profile.candidate.email);
      setProfile(refreshed);
    } catch (err: any) {
      setSendResult({ ok: false, message: err.message || 'Failed to send access-code email.' });
    } finally {
      setSending(false);
    }
  };

  const openNonRegisteredModal = async () => {
    setShowNonRegisteredModal(true);
    setNonRegisteredError('');
    setPanelNotice(null);

    if (jobs.length > 0) {
      return;
    }

    setJobsLoading(true);
    try {
      const allJobs = await fetchJobs();
      const activeJobs = allJobs
        .filter((job) => job.status === 'active')
        .sort((a, b) => a.title.localeCompare(b.title));
      setJobs(activeJobs);
    } catch (err: any) {
      setNonRegisteredError(err?.message || 'Unable to load open positions.');
    } finally {
      setJobsLoading(false);
    }
  };

  const closeNonRegisteredModal = () => {
    if (nonRegisteredSending) return;
    setShowNonRegisteredModal(false);
    setNonRegisteredError('');
  };

  const handleSendToNonRegistered = async (e: React.FormEvent) => {
    e.preventDefault();
    setNonRegisteredError('');
    setPanelNotice(null);

    const payload = {
      candidateName: nonRegisteredForm.candidateName.trim(),
      candidateEmail: nonRegisteredForm.candidateEmail.trim(),
      candidatePhone: nonRegisteredForm.candidatePhone.trim(),
      candidateLocation: nonRegisteredForm.candidateLocation.trim(),
      jobId: nonRegisteredForm.jobId
    };

    if (!payload.candidateName || !payload.candidateEmail || !payload.jobId) {
      setNonRegisteredError('Candidate name, email, and position are required.');
      return;
    }

    setNonRegisteredSending(true);
    try {
      const result = await createCandidateApplicationAndSendAccessCode(payload);

      const candidateStatus = result.candidateCreated ? 'Candidate account created' : 'Candidate account reused';
      const appStatus = result.applicationCreated ? 'application created' : 'existing application reused';

      setPanelNotice({
        ok: result.delivered,
        message: result.delivered
          ? `${candidateStatus}; ${appStatus}; access-code email sent to ${payload.candidateEmail}.`
          : `Send attempted for ${payload.candidateEmail}, but delivery was not confirmed.`
      });

      setEmail(payload.candidateEmail);
      setShowNonRegisteredModal(false);
      setNonRegisteredForm({
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        candidateLocation: '',
        jobId: ''
      });

      try {
        const refreshed = await fetchCandidateSupportProfile(payload.candidateEmail);
        setProfile(refreshed);
        const createdOrExistingApp = refreshed.applications.find((item) => item.id === result.application.id);
        setActiveApplicationId(createdOrExistingApp?.id || refreshed.applications[0]?.id || null);
      } catch {
        // Keep the success notice even if profile refresh fails.
      }
    } catch (err: any) {
      setNonRegisteredError(err?.message || 'Failed to create candidate and send access code.');
    } finally {
      setNonRegisteredSending(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(code);
      setTimeout(() => setCodeCopied(null), 2000);
    });
  };

  const buildAssumePaidKey = (
    applicationId: string,
    packageRef: string,
    itemType: 'course' | 'exam',
    itemId: string
  ) => `${applicationId}:${packageRef}:${itemType}:${itemId}`;

  const handleAssumePaid = async (
    applicationId: string,
    packageRef: string,
    itemType: 'course' | 'exam',
    itemId: string,
    itemName: string
  ) => {
    if (!profile) return;

    const key = buildAssumePaidKey(applicationId, packageRef, itemType, itemId);
    setAssumingPaidKey(key);
    setPanelNotice(null);
    setError('');

    try {
      const result = await assumeSupportItemPaid({
        applicationId,
        packageRef,
        itemType,
        itemId
      });

      setPanelNotice({
        ok: true,
        message: `${itemName}: ${result.message}`
      });

      const refreshed = await fetchCandidateSupportProfile(profile.candidate.email);
      setProfile(refreshed);
      setActiveApplicationId((prev) => prev || refreshed.applications[0]?.id || null);
    } catch (err: any) {
      setPanelNotice({
        ok: false,
        message: err?.message || `Could not mark ${itemName} as paid.`
      });
    } finally {
      setAssumingPaidKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
            <LifeBuoy className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
              Candidate Support Desk
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">Candidate Control Panel</h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              Look up any candidate by email to pull their full application, assigned Atesta package(s), and
              voucher code — then re-send it to them by email in one click, without retyping anything.
            </p>
          </div>
        </div>
      </div>

      {/* Search / import card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleImport} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
              Candidate Email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="px-5 py-2.5 bg-[#1f4e79] hover:bg-[#102a43] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Import User Details
          </button>
          <button
            type="button"
            onClick={() => void openNonRegisteredModal()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Send Atesta Code To Non-Registered User
          </button>
        </form>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {panelNotice && (
          <div
            className={`mt-3 flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 border ${
              panelNotice.ok
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-rose-700 bg-rose-50 border-rose-200'
            }`}
          >
            {panelNotice.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
            {panelNotice.message}
          </div>
        )}
      </div>

      {!profile && !loading && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <LifeBuoy className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">
            Enter a candidate's email above and click "Import User Details" to get started.
          </p>
        </div>
      )}

      {profile && (
        <>
          {/* Candidate identity card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-[#1f4e79] text-white flex items-center justify-center font-extrabold text-lg shrink-0">
                  {profile.candidate.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{profile.candidate.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{profile.candidate.email}</span>
                    {profile.candidate.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{profile.candidate.phone}</span>
                    )}
                    {profile.candidate.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.candidate.location}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg border ${
                    profile.candidate.platformAccountActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {profile.candidate.platformAccountActive ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                  GTP Account {profile.candidate.hasPlatformAccount ? (profile.candidate.platformAccountActive ? 'Active' : 'Inactive') : 'Not Found'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg border ${
                    profile.atestaAccount?.isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  Atesta {profile.atestaAccount ? (profile.atestaAccount.isActive ? 'Active' : 'Inactive') : 'Not Registered'}
                </span>
              </div>
            </div>
          </div>

          {/* Applications */}
          {profile.applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-sm text-amber-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              This candidate has no job applications on file yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  Applications ({profile.applications.length})
                </h3>
                {profile.applications.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.applications.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => setActiveApplicationId(app.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          activeApplication?.id === app.id
                            ? 'bg-[#1f4e79] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {app.jobTitle}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activeApplication && (
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/60 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <CircularReadiness percentage={activeApplication.readinessProgress.percentage} />
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">{activeApplication.jobTitle}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          Applied {new Date(activeApplication.appliedAt).toLocaleDateString()} · Stage:{' '}
                          <span className="font-bold text-indigo-700">{activeApplication.stage}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {activeApplication.documentsCount} document(s) on file
                    </span>
                  </div>

                  {/* Assigned packages */}
                  {activeApplication.assignedPackages.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Assigned Atesta Package(s)
                      </p>
                      <div className="space-y-3">
                        {activeApplication.assignedPackages.map((pkg) => (
                          <div key={`${pkg.id}-${pkg.packageId}`} className="border border-slate-200 rounded-xl p-3 bg-white space-y-3">
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">{pkg.name}</p>
                              <p className="text-xs font-bold text-indigo-700 mt-0.5">Package ID: {pkg.packageId}</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/70 space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Courses</p>
                                {pkg.courses.length === 0 ? (
                                  <p className="text-xs text-slate-500">No courses attached to this package.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {pkg.courses.map((course) => {
                                      const itemKey = buildAssumePaidKey(activeApplication.id, pkg.id, 'course', course.id);
                                      const loadingAssume = assumingPaidKey === itemKey;
                                      const canAssumePaid = course.needsPayment && !course.isPaid;
                                      return (
                                        <div key={course.id} className="rounded-md border border-slate-200 bg-white p-2.5 space-y-1.5">
                                          <p className="text-xs font-bold text-slate-800">{course.name}</p>
                                          <p className="text-[11px] text-slate-500">
                                            Cost: {typeof course.costKsh === 'number' ? `KSh ${course.costKsh.toLocaleString()}` : 'Not set'}
                                          </p>
                                          <p className={`text-[11px] font-semibold ${course.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {course.isPaid ? 'Paid / Unlocked' : course.needsPayment ? 'Awaiting payment' : 'No payment required'}
                                          </p>
                                          {course.paymentRef && (
                                            <p className="text-[10px] text-slate-500">Ref: {course.paymentRef}</p>
                                          )}
                                          {canAssumePaid && (
                                            <button
                                              type="button"
                                              disabled={loadingAssume}
                                              onClick={() =>
                                                void handleAssumePaid(activeApplication.id, pkg.id, 'course', course.id, course.name)
                                              }
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[10px] font-bold"
                                            >
                                              {loadingAssume ? 'Updating...' : 'Assume Paid'}
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/70 space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Exams</p>
                                {pkg.exams.length === 0 ? (
                                  <p className="text-xs text-slate-500">No exams attached to this package.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {pkg.exams.map((exam) => {
                                      const itemKey = buildAssumePaidKey(activeApplication.id, pkg.id, 'exam', exam.id);
                                      const loadingAssume = assumingPaidKey === itemKey;
                                      const canAssumePaid = exam.needsPayment && !exam.isPaid;
                                      return (
                                        <div key={exam.id} className="rounded-md border border-slate-200 bg-white p-2.5 space-y-1.5">
                                          <p className="text-xs font-bold text-slate-800">{exam.name}</p>
                                          <p className="text-[11px] text-slate-500">
                                            Cost: {typeof exam.costKsh === 'number' ? `KSh ${exam.costKsh.toLocaleString()}` : 'Not set'}
                                          </p>
                                          <p className={`text-[11px] font-semibold ${exam.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {exam.isPaid ? 'Paid / Unlocked' : exam.needsPayment ? 'Awaiting payment' : 'No payment required'}
                                          </p>
                                          {exam.paymentRef && (
                                            <p className="text-[10px] text-slate-500">Ref: {exam.paymentRef}</p>
                                          )}
                                          {canAssumePaid && (
                                            <button
                                              type="button"
                                              disabled={loadingAssume}
                                              onClick={() =>
                                                void handleAssumePaid(activeApplication.id, pkg.id, 'exam', exam.id, exam.name)
                                              }
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[10px] font-bold"
                                            >
                                              {loadingAssume ? 'Updating...' : 'Assume Paid'}
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voucher */}
                  {activeApplication.voucher && (
                    <div className="border border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50/60 flex flex-col sm:flex-row sm:items-center gap-3">
                      <KeyRound className="h-5 w-5 text-indigo-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-slate-600">
                          Atesta access voucher{activeApplication.voucher.redeemedAt ? ' (already used)' : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-lg font-extrabold tracking-widest text-indigo-800">
                            {activeApplication.voucher.code}
                          </p>
                          <button
                            onClick={() => copyCode(activeApplication.voucher!.code)}
                            className="p-1.5 rounded-md border border-indigo-200 bg-white hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                          >
                            {codeCopied === activeApplication.voucher.code ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <a
                        href={ATESTA_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-indigo-700 flex items-center gap-1 hover:underline shrink-0"
                      >
                        Open Atesta <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Outstanding requirements */}
                  {activeApplication.readinessProgress.items.some((i) => !i.complete) && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Outstanding Requirements
                      </p>
                      <ul className="space-y-1.5">
                        {activeApplication.readinessProgress.items
                          .filter((i) => !i.complete)
                          .map((item) => (
                            <li key={item.id} className="flex items-start gap-2 text-xs text-slate-600">
                              <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                              {item.message}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Send actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Send Details To Candidate</h3>
            <p className="text-xs text-slate-500">
              Sends the same access-code email used in Candidates Directory to{' '}
              <strong>{profile.candidate.email}</strong> — no retyping needed.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSendEmail}
                disabled={sending || !activeApplication}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send Access Code Email
              </button>

              <button
                disabled
                title="WhatsApp sending is coming in a future update"
                className="px-5 py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Send via WhatsApp
                <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md uppercase">Coming soon</span>
              </button>
            </div>

            {sendResult && (
              <div
                className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 border ${
                  sendResult.ok
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
              >
                {sendResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                {sendResult.message}
              </div>
            )}
          </div>

          {/* Recent support activity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              Recent Email Activity For This Candidate
            </h3>
            {profile.emailHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No emails on record for this candidate yet.</p>
            ) : (
              <div className="space-y-2">
                {profile.emailHistory.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{log.subject}</p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(log.sentAt).toLocaleString()} · {log.triggerEvent.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <StatusPill status={log.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showNonRegisteredModal && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 px-4 py-6 sm:py-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Send Atesta Code To Non-Registered User</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This creates the candidate record, creates or reuses their job application, and sends one access-code email.
                </p>
              </div>
              <button
                type="button"
                onClick={closeNonRegisteredModal}
                disabled={nonRegisteredSending}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendToNonRegistered} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    Position Applied
                  </label>
                  <select
                    value={nonRegisteredForm.jobId}
                    onChange={(e) => setNonRegisteredForm((prev) => ({ ...prev, jobId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={jobsLoading || nonRegisteredSending}
                  >
                    <option value="">Select a position</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} {job.location ? `- ${job.location}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    value={nonRegisteredForm.candidateName}
                    onChange={(e) => setNonRegisteredForm((prev) => ({ ...prev, candidateName: e.target.value }))}
                    placeholder="Full name"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={nonRegisteredSending}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    value={nonRegisteredForm.candidateEmail}
                    onChange={(e) => setNonRegisteredForm((prev) => ({ ...prev, candidateEmail: e.target.value }))}
                    placeholder="candidate@example.com"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={nonRegisteredSending}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={nonRegisteredForm.candidatePhone}
                    onChange={(e) => setNonRegisteredForm((prev) => ({ ...prev, candidatePhone: e.target.value }))}
                    placeholder="e.g. +254..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={nonRegisteredSending}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={nonRegisteredForm.candidateLocation}
                    onChange={(e) => setNonRegisteredForm((prev) => ({ ...prev, candidateLocation: e.target.value }))}
                    placeholder="Current location"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={nonRegisteredSending}
                  />
                </div>
              </div>

              {jobsLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading open positions...
                </div>
              )}

              {nonRegisteredError && (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {nonRegisteredError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeNonRegisteredModal}
                  disabled={nonRegisteredSending}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={nonRegisteredSending || jobsLoading}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 flex items-center gap-2"
                >
                  {nonRegisteredSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Create And Send Access Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};