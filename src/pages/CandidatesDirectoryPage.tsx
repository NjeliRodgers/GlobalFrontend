import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchCandidatesDirectoryReport,
  CandidateDirectoryRow,
  CandidatesDirectoryAnalytics,
  CandidatesDirectoryFilters
} from '../api/usersApi';
import {
  createCandidateApplicationAndSendAccessCode,
  sendApplicationAccessCodeEmail,
  sendApplicationReviewEmail,
  sendApplicationAcceptanceEmail
} from '../api/applicationsApi';
import { fetchJobs } from '../api/jobsApi';
import { Job } from '../types';
import {
  Search,
  Users,
  ShieldCheck,
  BarChart3,
  Clock3,
  SlidersHorizontal,
  HandCoins,
  Target,
  RefreshCw,
  Copy,
  Check,
  Eye,
  X,
  Loader2,
  Mail,
  CalendarDays,
  StickyNote,
  Ban,
  RotateCcw,
  BookOpen,
  GraduationCap,
  UserPlus
} from 'lucide-react';
import { fetchCandidateSupportProfile, SupportProfile, updateCandidateOperations, CandidateOperationsUpdate } from '../api/supportApi';

interface CandidatesDirectoryPageProps {
  initialJobId?: string;
  initialJobTitle?: string;
}

type UiToast = {
  id: string;
  kind: 'success' | 'error' | 'info';
  message: string;
};

const EMPTY_ANALYTICS: CandidatesDirectoryAnalytics = {
  fromDate: null,
  toDate: null,
  registrationsInPeriod: 0,
  atestaRegistrationsInPeriod: 0,
  applicationsInPeriod: 0,
  paidCandidatesInPeriod: 0,
  paymentTransactionsInPeriod: 0,
  totalCashCollectedKsh: 0,
  manualPaymentTransactionsInPeriod: 0,
  manualCashCollectedKsh: 0,
  firstPaymentAt: null,
  lastPaymentAt: null,
  dailyCollections: [],
  totals: {
    totalCandidateAccounts: 0,
    totalApplicationsAllTime: 0,
    totalAtestaAccounts: 0,
    paidAtestaCandidatesAllTime: 0,
    filteredCandidates: 0,
    filteredWithApplications: 0,
    filteredAtestaAccounts: 0,
    filteredPaidAtestaAccounts: 0
  },
  funnelPercentages: {
    applicationsVsTotalAccounts: 0,
    atestaAccountsVsApplications: 0,
    paidAtestaUsersVsAtestaAccounts: 0,
    filteredApplicationsVsTotalAccounts: 0,
    filteredAtestaAccountsVsApplications: 0,
    filteredPaidAtestaUsersVsAtestaAccounts: 0
  },
  salesStageDistribution: {},
  dropOff: {
    registeredWithoutApplications: 0,
    appliedWithoutAtesta: 0,
    atestaWithoutPayment: 0
  },
  salesActions: []
};

const SALES_STAGE_LABELS: Record<string, string> = {
  registered_no_application: 'Registered, no application',
  applied_no_atesta: 'Applied, no Atesta',
  atesta_inactive: 'Atesta inactive',
  atesta_unpaid: 'Atesta active, unpaid',
  paying_in_pipeline: 'Paid and in pipeline',
  hired: 'Hired'
};

export const CandidatesDirectoryPage: React.FC<CandidatesDirectoryPageProps> = ({
  initialJobId,
  initialJobTitle
}) => {
  const [rows, setRows] = useState<CandidateDirectoryRow[]>([]);
  const [periodAnalytics, setPeriodAnalytics] = useState<CandidatesDirectoryAnalytics>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDirectoryRow | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<SupportProfile | null>(null);
  const [candidateProfileLoading, setCandidateProfileLoading] = useState(false);
  const [candidateProfileError, setCandidateProfileError] = useState('');
  const [activeModalApplicationId, setActiveModalApplicationId] = useState<string | null>(null);
  const [candidateNote, setCandidateNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [savingCandidateOperation, setSavingCandidateOperation] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sendingCodeEmailForAppId, setSendingCodeEmailForAppId] = useState<string | null>(null);
  const [codeEmailStatusByAppId, setCodeEmailStatusByAppId] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [sendingManualEmail, setSendingManualEmail] = useState<string | null>(null);
  const [manualEmailStatusByAppId, setManualEmailStatusByAppId] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [toasts, setToasts] = useState<UiToast[]>([]);

  const [showApplyOnBehalfModal, setShowApplyOnBehalfModal] = useState(false);
  const [applyOnBehalfLoading, setApplyOnBehalfLoading] = useState(false);
  const [applyOnBehalfError, setApplyOnBehalfError] = useState('');
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [applyOnBehalfForm, setApplyOnBehalfForm] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    candidateLocation: '',
    jobId: ''
  });

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [atestaStatus, setAtestaStatus] = useState<'any' | 'none' | 'created' | 'active' | 'inactive'>('any');
  const [salesStageFilter, setSalesStageFilter] = useState('any');
  const [hasPayments, setHasPayments] = useState<'any' | 'yes' | 'no'>('any');
  const [hasApplications, setHasApplications] = useState<'any' | 'yes' | 'no'>('any');
  const [platformActive, setPlatformActive] = useState<'any' | 'yes' | 'no'>('any');
  const [followUpFilter, setFollowUpFilter] = useState<'any' | 'overdue' | 'today' | 'upcoming_7' | 'scheduled' | 'none'>('any');
  const [includeBlocked, setIncludeBlocked] = useState(false);
  const [minApplications, setMinApplications] = useState('');
  const [maxApplications, setMaxApplications] = useState('');
  const [minTotalPaidKsh, setMinTotalPaidKsh] = useState('');
  const [sortBy, setSortBy] = useState<'registeredAt' | 'name' | 'totalApplications' | 'totalPaidKsh' | 'lastAppliedAt' | 'lastPaymentAt'>('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const hasPaymentsBoolean = (value: 'any' | 'yes' | 'no') => {
    if (value === 'yes') return true;
    if (value === 'no') return false;
    return undefined;
  };

  const showToast = (kind: UiToast['kind'], message: string) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const buildCurrentFilters = (): CandidatesDirectoryFilters => ({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    atestaStatus,
    salesStage: salesStageFilter === 'any' ? undefined : salesStageFilter,
    hasPayments: hasPaymentsBoolean(hasPayments),
    hasApplications: hasPaymentsBoolean(hasApplications),
    platformActive: hasPaymentsBoolean(platformActive),
    minApplications: minApplications ? Number(minApplications) : undefined,
    maxApplications: maxApplications ? Number(maxApplications) : undefined,
    minTotalPaidKsh: minTotalPaidKsh ? Number(minTotalPaidKsh) : undefined,
    sortBy,
    sortOrder,
    search: search || undefined,
    includeBlocked
  });

  const loadData = async (filters?: CandidatesDirectoryFilters, options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
      setLoadError('');
    }
    const requestFilters: CandidatesDirectoryFilters = {
      ...(initialJobId ? { jobId: initialJobId } : {}),
      ...(filters || {})
    };
    try {
      const data = await fetchCandidatesDirectoryReport(requestFilters);
      setRows(data.candidates);
      setPeriodAnalytics(data.analytics || EMPTY_ANALYTICS);
    } catch (error: any) {
      if (silent) {
        showToast('error', error?.message || 'Unable to refresh candidates.');
      } else {
        setLoadError(error?.message || 'Unable to load candidates directory.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, [initialJobId]);

  const applyFilters = async () => {
    await loadData(buildCurrentFilters(), { silent: true });
    showToast('info', 'Filters applied.');
  };

  const clearAllFilters = async () => {
    setFromDate('');
    setToDate('');
    setAtestaStatus('any');
    setSalesStageFilter('any');
    setHasPayments('any');
    setHasApplications('any');
    setPlatformActive('any');
    setFollowUpFilter('any');
    setMinApplications('');
    setMaxApplications('');
    setMinTotalPaidKsh('');
    setSortBy('registeredAt');
    setSortOrder('desc');
    setSearch('');
    setIncludeBlocked(false);
    setSelectedActionId('all');
    await loadData({ includeBlocked: false }, { silent: true });
    showToast('info', 'Filters reset.');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(value || 0);

  const getFollowUpMeta = (nextFollowUpAt?: string | null) => {
    if (!nextFollowUpAt) {
      return {
        label: 'Not scheduled',
        tone: 'bg-slate-100 text-slate-600 border-slate-200'
      };
    }

    const date = new Date(nextFollowUpAt);
    if (Number.isNaN(date.getTime())) {
      return {
        label: 'Invalid date',
        tone: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((targetStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)}d`,
        tone: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }

    if (diffDays === 0) {
      return {
        label: 'Due today',
        tone: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }

    if (diffDays <= 7) {
      return {
        label: `In ${diffDays}d`,
        tone: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    }

    return {
      label: date.toLocaleDateString(),
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('success', 'Access code copied to clipboard.');
    window.setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleSendCodeEmail = async (applicationId: string, candidateEmail: string) => {
    setSendingCodeEmailForAppId(applicationId);
    setCodeEmailStatusByAppId((prev) => {
      const next = { ...prev };
      delete next[applicationId];
      return next;
    });

    try {
      const result = await sendApplicationAccessCodeEmail(applicationId);
      const message = result.delivered
        ? `Access-code email sent to ${candidateEmail}.`
        : `Send attempted but delivery was not confirmed for ${candidateEmail}.`;
      setCodeEmailStatusByAppId((prev) => ({
        ...prev,
        [applicationId]: {
          ok: result.delivered,
          message
        }
      }));
      showToast(result.delivered ? 'success' : 'info', message);
    } catch (error: any) {
      const message = error?.message || 'Failed to send access-code email.';
      setCodeEmailStatusByAppId((prev) => ({
        ...prev,
        [applicationId]: {
          ok: false,
          message
        }
      }));
      showToast('error', message);
    } finally {
      setSendingCodeEmailForAppId(null);
    }
  };

  const handleSendManualApplicationEmail = async (applicationId: string, kind: 'review' | 'acceptance') => {
    const actionKey = `${kind}:${applicationId}`;
    setSendingManualEmail(actionKey);
    setManualEmailStatusByAppId((prev) => ({ ...prev, [applicationId]: { ok: false, message: '' } }));
    try {
      const result = kind === 'review'
        ? await sendApplicationReviewEmail(applicationId)
        : await sendApplicationAcceptanceEmail(applicationId);
      const message = result.delivered ? 'Email sent instantly.' : 'Email was not delivered.';
      setManualEmailStatusByAppId((prev) => ({
        ...prev,
        [applicationId]: { ok: result.delivered, message }
      }));
      showToast(result.delivered ? 'success' : 'info', message);
    } catch (err: any) {
      const message = err.message || 'Failed to send email.';
      setManualEmailStatusByAppId((prev) => ({
        ...prev,
        [applicationId]: { ok: false, message }
      }));
      showToast('error', message);
    } finally {
      setSendingManualEmail(null);
    }
  };

  const openCandidate = async (row: CandidateDirectoryRow) => {
    setSelectedCandidate(row);
    setCandidateProfile(null);
    setCandidateProfileError('');
    setCandidateNote('');
    setCandidateProfileLoading(true);
    try {
      const profile = await fetchCandidateSupportProfile(row.email);
      setCandidateProfile(profile);
      setActiveModalApplicationId(profile.applications[0]?.id || null);
      setFollowUpDate(profile.operations.nextFollowUpAt ? profile.operations.nextFollowUpAt.slice(0, 10) : '');
      setBlockReason(profile.operations.blockedReason || '');
    } catch (error: any) {
      setCandidateProfileError(error?.message || 'Unable to load candidate details.');
    } finally {
      setCandidateProfileLoading(false);
    }
  };

  const closeCandidate = () => {
    if (savingCandidateOperation) return;
    setSelectedCandidate(null);
    setCandidateProfile(null);
    setCandidateNote('');
    setCandidateProfileError('');
  };

  const saveCandidateOperation = async (payload: CandidateOperationsUpdate) => {
    if (!selectedCandidate || !candidateProfile) return;
    setSavingCandidateOperation(true);
    try {
      const operations = await updateCandidateOperations({ candidateEmail: selectedCandidate.email, ...payload });
      setCandidateProfile((current) => current ? { ...current, operations } : current);
      setRows((prev) => prev
        .map((row) => {
          if (row.email.toLowerCase() !== selectedCandidate.email.toLowerCase()) return row;
          const existingTags = Array.isArray(row.actionTags) ? row.actionTags : [];
          const updatedTags = operations.isPromisedToPay
            ? Array.from(new Set([...existingTags, 'promise_to_pay_follow_up']))
            : existingTags.filter((tag) => tag !== 'promise_to_pay_follow_up');
          return {
            ...row,
            nextFollowUpAt: operations.nextFollowUpAt,
            isBlocked: operations.isBlocked,
            blockedAt: operations.blockedAt,
            blockedReason: operations.blockedReason,
            isPromisedToPay: operations.isPromisedToPay,
            promisedToPayAt: operations.promisedToPayAt,
            actionTags: updatedTags,
            notesCount: operations.notes.length
          };
        })
        .filter((row) => {
          if (row.email.toLowerCase() !== selectedCandidate.email.toLowerCase()) return true;
          return includeBlocked ? row.isBlocked : !row.isBlocked;
        }));

      if (payload.notes) {
        showToast('success', 'Candidate notes saved.');
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'nextFollowUpAt')) {
        showToast('success', payload.nextFollowUpAt ? 'Follow-up date updated.' : 'Follow-up date cleared.');
      }
      if (typeof payload.isBlocked === 'boolean') {
        showToast('success', payload.isBlocked ? 'Candidate moved to blocked bin.' : 'Candidate restored to active list.');
      }
      if (typeof payload.isPromisedToPay === 'boolean') {
        showToast('success', payload.isPromisedToPay ? 'Candidate marked as Promise to Pay.' : 'Promise to Pay removed.');
      }

      void loadData(buildCurrentFilters(), { silent: true });
      if (!includeBlocked && payload.isBlocked === true) {
        closeCandidate();
      }
      if (includeBlocked && payload.isBlocked === false) {
        closeCandidate();
      }
    } catch (error: any) {
      setCandidateProfileError(error?.message || 'Unable to save candidate action.');
      showToast('error', error?.message || 'Unable to save candidate action.');
    } finally {
      setSavingCandidateOperation(false);
    }
  };

  const addCandidateNote = async () => {
    const text = candidateNote.trim();
    if (!text || !candidateProfile) return;
    await saveCandidateOperation({
      notes: [{ id: `note-${Date.now()}`, text, createdAt: new Date().toISOString() }, ...candidateProfile.operations.notes]
    });
    setCandidateNote('');
  };

  const openApplyOnBehalfModal = async () => {
    setApplyOnBehalfError('');
    setShowApplyOnBehalfModal(true);
    if (activeJobs.length > 0) return;

    setJobsLoading(true);
    try {
      const jobs = await fetchJobs();
      const openJobs = jobs
        .filter((job) => job.status === 'active')
        .sort((a, b) => a.title.localeCompare(b.title));
      setActiveJobs(openJobs);
    } catch (error: any) {
      setApplyOnBehalfError(error?.message || 'Failed to load active jobs.');
    } finally {
      setJobsLoading(false);
    }
  };

  const closeApplyOnBehalfModal = () => {
    if (applyOnBehalfLoading) return;
    setShowApplyOnBehalfModal(false);
    setApplyOnBehalfError('');
  };

  const submitApplyOnBehalf = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyOnBehalfError('');

    const payload = {
      candidateName: applyOnBehalfForm.candidateName.trim(),
      candidateEmail: applyOnBehalfForm.candidateEmail.trim(),
      candidatePhone: applyOnBehalfForm.candidatePhone.trim() || undefined,
      candidateLocation: applyOnBehalfForm.candidateLocation.trim() || undefined,
      jobId: applyOnBehalfForm.jobId
    };

    if (!payload.candidateName || !payload.candidateEmail || !payload.jobId) {
      setApplyOnBehalfError('Candidate name, candidate email, and target job are required.');
      return;
    }

    setApplyOnBehalfLoading(true);
    try {
      const result = await createCandidateApplicationAndSendAccessCode(payload);
      const summary = result.delivered
        ? `Application captured for ${payload.candidateEmail}. Access-code email sent. ${result.applicationCreated ? 'New application created.' : 'Existing application reused.'}`
        : `Application captured for ${payload.candidateEmail}, but email delivery could not be confirmed.`;

      showToast(result.delivered ? 'success' : 'info', summary);
      setShowApplyOnBehalfModal(false);
      setApplyOnBehalfForm({
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        candidateLocation: '',
        jobId: ''
      });

      await loadData(buildCurrentFilters(), { silent: true });
    } catch (error: any) {
      setApplyOnBehalfError(error?.message || 'Failed to apply on behalf.');
      showToast('error', error?.message || 'Failed to apply on behalf.');
    } finally {
      setApplyOnBehalfLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byAction =
      selectedActionId === 'all'
        ? rows
        : rows.filter((row) => Array.isArray(row.actionTags) && row.actionTags.includes(selectedActionId));

    const bySearch = !q
      ? byAction
      : byAction.filter((row) => {
      const inProfile =
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q) ||
        String(row.salesStage || '').toLowerCase().includes(q);
      const inApplications = row.applications.some(
        (app) => app.jobTitle.toLowerCase().includes(q) || app.stage.toLowerCase().includes(q)
      );
      return inProfile || inApplications;
    });

    return bySearch.filter((row) => {
      const followUp = row.nextFollowUpAt;
      if (followUpFilter === 'any') return true;
      if (followUpFilter === 'none') return !followUp;
      if (!followUp) return false;

      const date = new Date(followUp);
      if (Number.isNaN(date.getTime())) return false;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffDays = Math.floor((targetStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));

      if (followUpFilter === 'overdue') return diffDays < 0;
      if (followUpFilter === 'today') return diffDays === 0;
      if (followUpFilter === 'upcoming_7') return diffDays > 0 && diffDays <= 7;
      if (followUpFilter === 'scheduled') return diffDays >= 0;
      return true;
    });
  }, [rows, search, selectedActionId, followUpFilter]);

  const analytics = useMemo(() => {
    const totalCandidates = filtered.length;
    const withApplications = filtered.filter((row) => row.totalApplications > 0).length;
    const withAtesta = filtered.filter((row) => row.hasAtestaAccount).length;
    const withPayments = filtered.filter((row) => (row.totalPaidKsh || 0) > 0).length;

    return {
      totalCandidates,
      withApplications,
      withAtesta,
      withPayments
    };
  }, [filtered]);

  const stageEntries = Object.entries(periodAnalytics.salesStageDistribution || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
          Candidate Intelligence
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {initialJobId ? 'Job Applicants Directory' : 'Candidates Directory'}
        </h1>
        {initialJobId ? (
          <p className="text-xs text-slate-500 mt-0.5">
            Showing only candidates who applied for {initialJobTitle || 'the selected role'} (Job Ref: {initialJobId}).
          </p>
        ) : (
          <p className="text-xs text-slate-500 mt-0.5">
            Sales funnel visibility from registration to Atesta payment conversion.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-600" /> Dynamic Filters
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void openApplyOnBehalfModal()}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              <UserPlus className="h-3.5 w-3.5" /> Apply On Behalf
            </button>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, stage, role..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={atestaStatus}
            onChange={(e) => setAtestaStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">Atesta: Any</option>
            <option value="none">Atesta: Not created</option>
            <option value="created">Atesta: Created</option>
            <option value="active">Atesta: Active</option>
            <option value="inactive">Atesta: Inactive</option>
          </select>

          <select
            value={salesStageFilter}
            onChange={(e) => setSalesStageFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">Sales Stage: Any</option>
            <option value="registered_no_application">Registered, no application</option>
            <option value="applied_no_atesta">Applied, no Atesta</option>
            <option value="atesta_inactive">Atesta inactive</option>
            <option value="atesta_unpaid">Atesta active, unpaid</option>
            <option value="paying_in_pipeline">Paid and in pipeline</option>
            <option value="hired">Hired</option>
          </select>

          <select
            value={hasApplications}
            onChange={(e) => setHasApplications(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">Applications: Any</option>
            <option value="yes">Has applications</option>
            <option value="no">No applications</option>
          </select>

          <select
            value={hasPayments}
            onChange={(e) => setHasPayments(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">Payments: Any</option>
            <option value="yes">Has payments</option>
            <option value="no">No payments</option>
          </select>

          <select
            value={platformActive}
            onChange={(e) => setPlatformActive(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">Platform Account: Any</option>
            <option value="yes">Platform active</option>
            <option value="no">Platform inactive</option>
          </select>

          <select
            value={followUpFilter}
            onChange={(e) => setFollowUpFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">Follow-up: Any</option>
            <option value="overdue">Follow-up: Overdue</option>
            <option value="today">Follow-up: Due today</option>
            <option value="upcoming_7">Follow-up: Next 7 days</option>
            <option value="scheduled">Follow-up: Scheduled</option>
            <option value="none">Follow-up: Not scheduled</option>
          </select>

          <select
            value={includeBlocked ? 'bin' : 'active'}
            onChange={(e) => setIncludeBlocked(e.target.value === 'bin')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="active">Candidate view: Active only</option>
            <option value="bin">Candidate view: Blocked bin</option>
          </select>

          <input
            type="number"
            value={minApplications}
            onChange={(e) => setMinApplications(e.target.value)}
            placeholder="Min applications"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="number"
            value={maxApplications}
            onChange={(e) => setMaxApplications(e.target.value)}
            placeholder="Max applications"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="number"
            value={minTotalPaidKsh}
            onChange={(e) => setMinTotalPaidKsh(e.target.value)}
            placeholder="Min paid (KES)"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="registeredAt">Sort: Registration date</option>
            <option value="name">Sort: Name</option>
            <option value="totalApplications">Sort: Applications</option>
            <option value="totalPaidKsh">Sort: Paid amount</option>
            <option value="lastAppliedAt">Sort: Last application</option>
            <option value="lastPaymentAt">Sort: Last payment</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="desc">Order: Descending</option>
            <option value="asc">Order: Ascending</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
          >
            Apply Filters
          </button>
          <span className="text-[11px] text-slate-500">
            Filters also recalculate analytics so sales can see conversion movement in each segment.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Applied People vs Accounts</span>
            <BarChart3 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {periodAnalytics.funnelPercentages.applicationsVsTotalAccounts}%
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {periodAnalytics.totals.totalApplicationsAllTime} applied people / {periodAnalytics.totals.totalCandidateAccounts} accounts
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Atesta Creation vs Applied People</span>
            <Target className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {periodAnalytics.funnelPercentages.atestaAccountsVsApplications}%
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {periodAnalytics.totals.totalAtestaAccounts} Atesta / {periodAnalytics.totals.totalApplicationsAllTime} applied people
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Paid Atesta vs Atesta Accounts</span>
            <HandCoins className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {periodAnalytics.funnelPercentages.paidAtestaUsersVsAtestaAccounts}%
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {periodAnalytics.totals.paidAtestaCandidatesAllTime} paid / {periodAnalytics.totals.totalAtestaAccounts} Atesta accounts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Paid Candidates</span>
            <BarChart3 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{periodAnalytics.paidCandidatesInPeriod}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Candidates who paid in selected period</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Total Collected</span>
            <Clock3 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{formatCurrency(periodAnalytics.totalCashCollectedKsh)}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Approved payments in selected period</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Payment Transactions</span>
            <ShieldCheck className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{periodAnalytics.paymentTransactionsInPeriod}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            First: {periodAnalytics.firstPaymentAt ? new Date(periodAnalytics.firstPaymentAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Registrations</span>
            <Users className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1">{periodAnalytics.registrationsInPeriod}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Atesta registrations: {periodAnalytics.atestaRegistrationsInPeriod}</p>
        </div>

        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-800">Manual Recorded Payments</span>
            <HandCoins className="h-4 w-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1">{formatCurrency(periodAnalytics.manualCashCollectedKsh)}</div>
          <p className="text-[10px] text-amber-700 mt-0.5">{periodAnalytics.manualPaymentTransactionsInPeriod} transaction(s) in selected period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Sales Stage Distribution</h3>
          {stageEntries.length === 0 ? (
            <p className="text-xs text-slate-500">No stage distribution available for this segment.</p>
          ) : (
            <div className="space-y-1.5">
              {stageEntries.map(([key, count]) => (
                <div key={key} className="flex items-center justify-between text-xs bg-slate-50 rounded-md px-2 py-1 border border-slate-200">
                  <span className="text-slate-700">{SALES_STAGE_LABELS[key] || key}</span>
                  <span className="font-bold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Drop-Off Risk</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-md px-2 py-1">
              <span className="text-rose-800">Registered without application</span>
              <span className="font-black text-rose-900">{periodAnalytics.dropOff.registeredWithoutApplications}</span>
            </div>
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
              <span className="text-amber-800">Applied without Atesta</span>
              <span className="font-black text-amber-900">{periodAnalytics.dropOff.appliedWithoutAtesta}</span>
            </div>
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-md px-2 py-1">
              <span className="text-indigo-800">Atesta without payment</span>
              <span className="font-black text-indigo-900">{periodAnalytics.dropOff.atestaWithoutPayment}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">Sales Actions</h3>
        {periodAnalytics.salesActions.length === 0 ? (
          <p className="text-xs text-slate-500">No action recommendations generated for this segment.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedActionId('all')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
                selectedActionId === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({rows.length})
            </button>
            {periodAnalytics.salesActions.map((action) => (
              <button
                key={action.id}
                onClick={() => setSelectedActionId(action.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
                  selectedActionId === action.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title={action.description}
              >
                {action.label} ({action.count})
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">Daily Collections</h3>
        {periodAnalytics.dailyCollections.length === 0 ? (
          <p className="text-xs text-slate-500">No payments found for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-2">Date</th>
                  <th className="p-2">Collected Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodAnalytics.dailyCollections.map((day) => (
                  <tr key={day.date}>
                    <td className="p-2 text-slate-700">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="p-2 font-bold text-emerald-700">{formatCurrency(day.amountKsh)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Candidates</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{analytics.totalCandidates}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Applied Candidates</span>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">{analytics.withApplications}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Atesta Created</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{analytics.withAtesta}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Candidates With Payments</span>
            <HandCoins className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{analytics.withPayments}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">{includeBlocked ? 'Blocked Candidate Bin' : 'All Registered Candidates'} ({filtered.length})</h2>
        </div>

        {loadError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-xs text-slate-400">Loading candidate directory...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            No candidates matched your active filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Platform Account</th>
                  <th className="p-3">Atesta</th>
                  <th className="p-3">Sales Stage</th>
                  <th className="p-3">Next Follow-up</th>
                  <th className="p-3">Applications</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((row) => {
                  return (
                    <React.Fragment key={row.id}>
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{row.name}</div>
                          <div className="text-[10px] text-slate-500">{row.email}</div>
                          <div className="text-[10px] text-slate-400">{row.phone || 'No phone'} • {row.location || 'No location'}{row.age ? ` • Age ${row.age}` : ''}</div>
                          {row.isPromisedToPay && <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Promise to Pay</span>}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.isPlatformAccountActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {row.isPlatformAccountActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.hasAtestaAccount ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {row.hasAtestaAccount ? (row.atestaAccountActive ? 'Created (Active)' : 'Created (Inactive)') : 'Not Created'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">{SALES_STAGE_LABELS[row.salesStage || ''] || row.salesStage || 'Unknown'}</td>
                        <td className="p-3">
                          {(() => {
                            const followUpMeta = getFollowUpMeta(row.nextFollowUpAt || null);
                            return (
                              <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${followUpMeta.tone}`}>
                                {followUpMeta.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-3 font-bold text-slate-800">{row.totalApplications}</td>
                        <td className="p-3 font-bold text-emerald-700">{formatCurrency(row.totalPaidKsh || 0)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => void openCandidate(row)}
                            title={`Open full profile for ${row.name}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px]"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Candidate details">
          <div className="mx-auto w-full max-w-6xl rounded-2xl bg-slate-50 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-white border-b border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-full bg-[#1f4e79] text-white flex items-center justify-center font-black text-lg shrink-0">
                  {selectedCandidate.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-900 truncate">{selectedCandidate.name}</h2>
                  <p className="text-xs text-slate-500 truncate">{selectedCandidate.email} · {selectedCandidate.phone || 'No phone'} · {selectedCandidate.location || 'No location'}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">{SALES_STAGE_LABELS[selectedCandidate.salesStage || ''] || selectedCandidate.salesStage || 'Unknown'}</span>
                    {candidateProfile?.operations.isBlocked && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Blocked</span>}
                    {candidateProfile?.operations.isPromisedToPay && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Promise to Pay</span>}
                  </div>
                </div>
              </div>
              <button type="button" onClick={closeCandidate} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="Close candidate details"><X className="h-5 w-5" /></button>
            </div>

            {candidateProfileLoading ? (
              <div className="p-16 text-center text-sm text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading full candidate profile...</div>
            ) : candidateProfileError ? (
              <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{candidateProfileError}</div>
            ) : candidateProfile ? (
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                  <div className="bg-white rounded-xl border border-slate-200 p-3"><p className="text-[10px] uppercase font-bold text-slate-500">Applications</p><p className="text-xl font-black text-slate-900">{candidateProfile.applications.length}</p></div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3"><p className="text-[10px] uppercase font-bold text-slate-500">Paid</p><p className="text-xl font-black text-emerald-700">{formatCurrency(selectedCandidate.totalPaidKsh || 0)}</p></div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3"><p className="text-[10px] uppercase font-bold text-slate-500">Atesta</p><p className="text-xl font-black text-indigo-700">{candidateProfile.atestaAccount ? (candidateProfile.atestaAccount.isActive ? 'Active' : 'Inactive') : 'None'}</p></div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3"><p className="text-[10px] uppercase font-bold text-slate-500">Notes</p><p className="text-xl font-black text-slate-900">{candidateProfile.operations.notes.length}</p></div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3"><p className="text-[10px] uppercase font-bold text-slate-500">Follow-up</p><p className="text-sm font-black text-amber-700 mt-1">{candidateProfile.operations.nextFollowUpAt ? new Date(candidateProfile.operations.nextFollowUpAt).toLocaleDateString() : 'Not set'}</p></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><h3 className="font-black text-sm text-slate-900">Applications and progression</h3><div className="flex gap-1.5 flex-wrap">{candidateProfile.applications.map((app) => <button key={app.id} onClick={() => setActiveModalApplicationId(app.id)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${activeModalApplicationId === app.id ? 'bg-[#1f4e79] text-white' : 'bg-slate-100 text-slate-600'}`}>{app.jobTitle}</button>)}</div></div>
                      {candidateProfile.applications.length === 0 ? <p className="text-xs text-slate-500">No job applications found.</p> : candidateProfile.applications.filter((app) => app.id === activeModalApplicationId || (!activeModalApplicationId && app === candidateProfile.applications[0])).map((app) => (
                        <div key={app.id} className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-black text-slate-900">{app.jobTitle}</p><p className="text-xs text-slate-500">Applied {new Date(app.appliedAt).toLocaleDateString()} · <span className="font-bold text-indigo-700">{app.stage}</span></p></div><div className="text-right"><p className="text-xl font-black text-indigo-700">{app.readinessProgress.percentage}%</p><p className="text-[10px] text-slate-500">readiness</p></div></div>
                          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs">
                            <div className="text-indigo-800 font-semibold">Access Code: <span className="font-mono tracking-wide">{app.voucher?.code || 'Not generated'}</span></div>
                            <div className="text-indigo-700 mt-1">Package ID(s): {app.assignedPackages.length > 0 ? app.assignedPackages.map((pkg) => pkg.packageId).join(', ') : 'Not assigned'}</div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs space-y-2">
                            <h4 className="font-bold text-slate-900">Application Email Actions</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => void handleSendCodeEmail(app.id, candidateProfile.candidate.email)}
                                disabled={sendingCodeEmailForAppId === app.id}
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-bold py-2"
                              >
                                {sendingCodeEmailForAppId === app.id ? 'Sending Atesta Instructions...' : 'Send Atesta Instructions'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSendManualApplicationEmail(app.id, 'review')}
                                disabled={sendingManualEmail === `review:${app.id}`}
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-bold py-2"
                              >
                                {sendingManualEmail === `review:${app.id}` ? 'Sending Review Summary...' : 'Send Review Summary'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSendManualApplicationEmail(app.id, 'acceptance')}
                                disabled={sendingManualEmail === `acceptance:${app.id}`}
                                className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[11px] font-bold py-2"
                              >
                                {sendingManualEmail === `acceptance:${app.id}` ? 'Sending Acceptance Update...' : 'Send Acceptance Update'}
                              </button>
                            </div>
                            {codeEmailStatusByAppId[app.id]?.message && (
                              <p className={`text-[11px] ${codeEmailStatusByAppId[app.id].ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {codeEmailStatusByAppId[app.id].message}
                              </p>
                            )}
                            {manualEmailStatusByAppId[app.id]?.message && (
                              <p className={`text-[11px] ${manualEmailStatusByAppId[app.id].ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {manualEmailStatusByAppId[app.id].message}
                              </p>
                            )}
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-indigo-600" style={{ width: `${app.readinessProgress.percentage}%` }} /></div>
                          <div className="grid grid-cols-2 gap-2 text-xs">{app.readinessProgress.items.map((item) => <div key={item.id} className={`rounded-lg border p-2 ${item.complete ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>{item.complete ? 'Complete' : 'Pending'} · {item.message}</div>)}</div>
                          {app.assignedPackages.map((pkg) => <div key={pkg.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="font-bold text-xs text-slate-900 flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-indigo-600" />{pkg.name}</p><div className="mt-2 space-y-1">{[...pkg.courses.map((item) => ({ ...item, type: 'Course' })), ...pkg.exams.map((item) => ({ ...item, type: 'Exam' }))].map((item) => <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-2 text-[11px]"><span className="flex items-center gap-1"><GraduationCap className="h-3 w-3 text-slate-400" />{item.type}: {item.name}</span><span className={`font-bold ${item.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>{item.isPaid ? 'Paid / unlocked' : item.enrollmentStatus || 'Not paid'}</span></div>)}</div></div>)}
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4"><h3 className="font-black text-sm text-slate-900 mb-3">Communication history</h3>{candidateProfile.emailHistory.length === 0 ? <p className="text-xs text-slate-500">No email history.</p> : <div className="space-y-2 max-h-48 overflow-y-auto">{candidateProfile.emailHistory.map((log) => <div key={log.id} className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-2"><span><span className="font-bold text-slate-800">{log.subject}</span><span className="block text-[10px] text-slate-500">{new Date(log.sentAt).toLocaleString()}</span></span><span className="text-[10px] font-bold uppercase text-slate-500">{log.status}</span></div>)}</div>}</div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4"><h3 className="font-black text-sm text-slate-900 mb-3">Candidate Contact and Profile</h3><div className="space-y-2 text-xs"><p className="text-slate-700"><span className="font-semibold text-slate-900">Full Name:</span> {candidateProfile.candidate.name}</p><p className="text-slate-700"><span className="font-semibold text-slate-900">Email:</span> {candidateProfile.candidate.email}</p><p className="text-slate-700"><span className="font-semibold text-slate-900">Phone:</span> {candidateProfile.candidate.phone || 'Not provided'}</p><p className="text-slate-700"><span className="font-semibold text-slate-900">Location:</span> {candidateProfile.candidate.location || 'Not provided'}</p><p className="text-slate-700"><span className="font-semibold text-slate-900">Platform account:</span> {candidateProfile.candidate.hasPlatformAccount ? (candidateProfile.candidate.platformAccountActive ? 'Active' : 'Inactive') : 'Not registered'}</p><p className="text-slate-700"><span className="font-semibold text-slate-900">Joined:</span> {candidateProfile.candidate.platformJoinedAt ? new Date(candidateProfile.candidate.platformJoinedAt).toLocaleDateString() : 'N/A'}</p></div></div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4"><h3 className="font-black text-sm text-slate-900 mb-3 flex items-center gap-1"><CalendarDays className="h-4 w-4 text-amber-600" />Follow-up and status</h3><label className="text-[10px] uppercase font-bold text-slate-500">Next follow-up date</label><input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full mt-1 mb-2 px-3 py-2 rounded-lg border border-slate-200 text-xs" /><button disabled={savingCandidateOperation} onClick={() => void saveCandidateOperation({ nextFollowUpAt: followUpDate ? new Date(`${followUpDate}T09:00:00`).toISOString() : null })} className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2">Save follow-up</button><div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5"><p className="text-[10px] uppercase font-bold text-amber-700">Promise to pay</p><p className="text-[11px] text-amber-800 mt-0.5">{candidateProfile.operations.isPromisedToPay ? `Marked ${candidateProfile.operations.promisedToPayAt ? new Date(candidateProfile.operations.promisedToPayAt).toLocaleString() : 'recently'}` : 'Not marked yet'}</p><button disabled={savingCandidateOperation} onClick={() => void saveCandidateOperation({ isPromisedToPay: !candidateProfile.operations.isPromisedToPay })} className={`mt-2 w-full inline-flex justify-center items-center gap-1 rounded-lg text-white text-xs font-bold py-2 ${candidateProfile.operations.isPromisedToPay ? 'bg-slate-700 hover:bg-slate-800' : 'bg-amber-600 hover:bg-amber-700'}`}>{candidateProfile.operations.isPromisedToPay ? <><RotateCcw className="h-3.5 w-3.5" />Remove promise to pay</> : <><HandCoins className="h-3.5 w-3.5" />Mark as promise to pay</>}</button></div><div className="border-t border-slate-100 mt-3 pt-3"><label className="text-[10px] uppercase font-bold text-slate-500">Block reason</label><input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Optional reason" className="w-full mt-1 mb-2 px-3 py-2 rounded-lg border border-slate-200 text-xs" />{candidateProfile.operations.isBlocked ? <button disabled={savingCandidateOperation} onClick={() => void saveCandidateOperation({ isBlocked: false })} className="w-full inline-flex justify-center items-center gap-1 rounded-lg bg-slate-700 text-white text-xs font-bold py-2"><RotateCcw className="h-3.5 w-3.5" />Restore candidate</button> : <button disabled={savingCandidateOperation} onClick={() => void saveCandidateOperation({ isBlocked: true, blockedReason: blockReason })} className="w-full inline-flex justify-center items-center gap-1 rounded-lg bg-rose-600 text-white text-xs font-bold py-2"><Ban className="h-3.5 w-3.5" />Block candidate</button>}</div></div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4"><h3 className="font-black text-sm text-slate-900 mb-3 flex items-center gap-1"><StickyNote className="h-4 w-4 text-indigo-600" />Call notes</h3><textarea value={candidateNote} onChange={(e) => setCandidateNote(e.target.value)} placeholder="Record the outcome, commitment, or next step..." rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs resize-y" /><button disabled={!candidateNote.trim() || savingCandidateOperation} onClick={() => void addCandidateNote()} className="mt-2 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2">Save note</button><div className="mt-3 space-y-2 max-h-40 overflow-y-auto">{candidateProfile.operations.notes.map((note) => <div key={note.id} className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs"><p className="text-slate-700 whitespace-pre-wrap">{note.text}</p><p className="text-[10px] text-slate-400 mt-1">{new Date(note.createdAt).toLocaleString()}</p></div>)}</div></div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showApplyOnBehalfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60" role="dialog" aria-modal="true" aria-label="Apply on behalf">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Apply On Behalf</h3>
                <p className="text-xs text-slate-500">Create a candidate application and send Atesta access code in one step.</p>
              </div>
              <button type="button" onClick={closeApplyOnBehalfModal} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="Close"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={(e) => void submitApplyOnBehalf(e)} className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={applyOnBehalfForm.candidateName}
                  onChange={(e) => setApplyOnBehalfForm((prev) => ({ ...prev, candidateName: e.target.value }))}
                  placeholder="Candidate full name *"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  type="email"
                  value={applyOnBehalfForm.candidateEmail}
                  onChange={(e) => setApplyOnBehalfForm((prev) => ({ ...prev, candidateEmail: e.target.value }))}
                  placeholder="Candidate email *"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  value={applyOnBehalfForm.candidatePhone}
                  onChange={(e) => setApplyOnBehalfForm((prev) => ({ ...prev, candidatePhone: e.target.value }))}
                  placeholder="Candidate phone"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  value={applyOnBehalfForm.candidateLocation}
                  onChange={(e) => setApplyOnBehalfForm((prev) => ({ ...prev, candidateLocation: e.target.value }))}
                  placeholder="Candidate location"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <select
                value={applyOnBehalfForm.jobId}
                onChange={(e) => setApplyOnBehalfForm((prev) => ({ ...prev, jobId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                disabled={jobsLoading}
              >
                <option value="">{jobsLoading ? 'Loading active jobs...' : 'Select target job *'}</option>
                {activeJobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>

              {applyOnBehalfError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  {applyOnBehalfError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeApplyOnBehalfModal} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={applyOnBehalfLoading} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">
                  {applyOnBehalfLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {applyOnBehalfLoading ? 'Submitting...' : 'Create Application + Send Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed top-4 right-4 z-[70] flex w-[320px] max-w-[90vw] flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg ${{
              success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
              error: 'border-rose-200 bg-rose-50 text-rose-700',
              info: 'border-indigo-200 bg-indigo-50 text-indigo-700'
            }[toast.kind]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};
