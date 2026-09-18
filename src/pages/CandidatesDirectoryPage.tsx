import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchCandidatesDirectoryReport,
  CandidateDirectoryRow,
  CandidatesDirectoryAnalytics,
  CandidatesDirectoryFilters
} from '../api/usersApi';
import {
  sendApplicationAccessCodeEmail,
  sendApplicationReviewEmail,
  sendApplicationAcceptanceEmail
} from '../api/applicationsApi';
import {
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FolderOpen,
  BarChart3,
  Clock3,
  SlidersHorizontal,
  HandCoins,
  Target,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

interface CandidatesDirectoryPageProps {
  initialJobId?: string;
  initialJobTitle?: string;
}

const EMPTY_ANALYTICS: CandidatesDirectoryAnalytics = {
  fromDate: null,
  toDate: null,
  registrationsInPeriod: 0,
  atestaRegistrationsInPeriod: 0,
  applicationsInPeriod: 0,
  paidCandidatesInPeriod: 0,
  paymentTransactionsInPeriod: 0,
  totalCashCollectedKsh: 0,
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
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sendingCodeEmailForAppId, setSendingCodeEmailForAppId] = useState<string | null>(null);
  const [codeEmailStatusByAppId, setCodeEmailStatusByAppId] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [sendingManualEmail, setSendingManualEmail] = useState<string | null>(null);
  const [manualEmailStatusByAppId, setManualEmailStatusByAppId] = useState<Record<string, { ok: boolean; message: string }>>({});

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [atestaStatus, setAtestaStatus] = useState<'any' | 'none' | 'created' | 'active' | 'inactive'>('any');
  const [salesStageFilter, setSalesStageFilter] = useState('any');
  const [hasPayments, setHasPayments] = useState<'any' | 'yes' | 'no'>('any');
  const [hasApplications, setHasApplications] = useState<'any' | 'yes' | 'no'>('any');
  const [platformActive, setPlatformActive] = useState<'any' | 'yes' | 'no'>('any');
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

  const loadData = async (filters?: CandidatesDirectoryFilters) => {
    setLoading(true);
    const requestFilters: CandidatesDirectoryFilters = {
      ...(initialJobId ? { jobId: initialJobId } : {}),
      ...(filters || {})
    };

    const data = await fetchCandidatesDirectoryReport(requestFilters);
    setRows(data.candidates);
    setPeriodAnalytics(data.analytics || EMPTY_ANALYTICS);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [initialJobId]);

  const applyFilters = async () => {
    await loadData({
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
      search: search || undefined
    });
  };

  const clearAllFilters = async () => {
    setFromDate('');
    setToDate('');
    setAtestaStatus('any');
    setSalesStageFilter('any');
    setHasPayments('any');
    setHasApplications('any');
    setPlatformActive('any');
    setMinApplications('');
    setMaxApplications('');
    setMinTotalPaidKsh('');
    setSortBy('registeredAt');
    setSortOrder('desc');
    setSearch('');
    setSelectedActionId('all');
    await loadData();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(value || 0);

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
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
      setCodeEmailStatusByAppId((prev) => ({
        ...prev,
        [applicationId]: {
          ok: result.delivered,
          message: result.delivered
            ? `Access-code email sent to ${candidateEmail}.`
            : `Send attempted but delivery was not confirmed for ${candidateEmail}.`
        }
      }));
      await loadData({
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
        search: search || undefined
      });
    } catch (error: any) {
      setCodeEmailStatusByAppId((prev) => ({
        ...prev,
        [applicationId]: {
          ok: false,
          message: error?.message || 'Failed to send access-code email.'
        }
      }));
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
      setManualEmailStatusByAppId((prev) => ({
        ...prev,
        [applicationId]: { ok: result.delivered, message: result.delivered ? 'Email sent instantly.' : 'Email was not delivered.' }
      }));
    } catch (err: any) {
      setManualEmailStatusByAppId((prev) => ({
        ...prev,
        [applicationId]: { ok: false, message: err.message || 'Failed to send email.' }
      }));
    } finally {
      setSendingManualEmail(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byAction =
      selectedActionId === 'all'
        ? rows
        : rows.filter((row) => Array.isArray(row.actionTags) && row.actionTags.includes(selectedActionId));

    if (!q) return byAction;

    return byAction.filter((row) => {
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
  }, [rows, search, selectedActionId]);

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
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </button>
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
          <h2 className="text-base font-extrabold text-slate-900">All Registered Candidates ({filtered.length})</h2>
        </div>

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
                  <th className="p-3">Applications</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((row) => {
                  const isOpen = expandedId === row.id;

                  return (
                    <React.Fragment key={row.id}>
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{row.name}</div>
                          <div className="text-[10px] text-slate-500">{row.email}</div>
                          <div className="text-[10px] text-slate-400">{row.phone || 'No phone'} • {row.location || 'No location'}</div>
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
                        <td className="p-3 font-bold text-slate-800">{row.totalApplications}</td>
                        <td className="p-3 font-bold text-emerald-700">{formatCurrency(row.totalPaidKsh || 0)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setExpandedId(isOpen ? null : row.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px]"
                          >
                            {isOpen ? 'Hide' : 'View'}
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="p-3 bg-slate-50/70">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5 text-indigo-600" /> Account Details
                                </h4>
                                <p className="text-xs text-slate-700">Registered: {new Date(row.registeredAt).toLocaleString()}</p>
                                <p className="text-xs text-slate-700">Atesta ID: {row.atestaAccountId || 'Not linked yet'}</p>
                                <p className="text-xs text-slate-700">Days since registration: {row.daysSinceRegistration ?? 'N/A'}</p>
                                <p className="text-xs text-slate-700">Days since activity: {row.daysSinceLastActivity ?? 'N/A'}</p>
                              </div>

                              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Sales Actions
                                </h4>
                                {!row.actionTags || row.actionTags.length === 0 ? (
                                  <p className="text-xs text-slate-500">No immediate action suggestion.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {row.actionTags.map((tag) => (
                                      <span key={tag} className="px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                        {tag.replace(/_/g, ' ')}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs text-slate-700">Last payment: {row.lastPaymentAt ? new Date(row.lastPaymentAt).toLocaleString() : 'Never'}</p>
                              </div>

                              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                                  <FolderOpen className="h-3.5 w-3.5 text-sky-600" /> Applied Jobs
                                </h4>
                                {row.applications.length === 0 ? (
                                  <p className="text-xs text-slate-500">No job applications submitted yet.</p>
                                ) : (
                                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {row.applications.map((app) => (
                                      <div key={app.applicationId} className="text-xs bg-slate-50 rounded-md px-2 py-2 border border-slate-200 space-y-1">
                                        <div className="font-semibold text-slate-900">{app.jobTitle}</div>
                                        <div className="text-[10px] text-slate-500">Status: {app.stage}</div>
                                        <div className="text-[10px] text-slate-500">Applied: {new Date(app.appliedAt).toLocaleDateString()}</div>
                                        {(app.assignedPackages?.length || 0) > 0 && (
                                          <div className="text-[10px] text-indigo-700">
                                            Package ID(s): {app.assignedPackages?.map((pkg) => pkg.packageId).join(', ')}
                                          </div>
                                        )}
                                        {app.voucher?.code ? (
                                          <div className="flex items-center justify-between gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1">
                                            <div>
                                              <div className="text-[10px] text-indigo-700 font-semibold">One-time Access Code</div>
                                              <div className="font-mono tracking-wider text-indigo-900 font-bold">{app.voucher.code}</div>
                                              <div className="text-[10px] text-slate-500">
                                                {app.voucher.redeemedAt ? `Used on ${new Date(app.voucher.redeemedAt).toLocaleString()}` : 'Not used yet'}
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => void copyCode(app.voucher!.code)}
                                              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-indigo-300 bg-white hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold"
                                            >
                                              {copiedCode === app.voucher.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                              {copiedCode === app.voucher.code ? 'Copied' : 'Copy'}
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="text-[10px] text-amber-700">No course access code generated for this application.</div>
                                        )}
                                        <div className="pt-1">
                                          <button
                                            type="button"
                                            onClick={() => void handleSendCodeEmail(app.applicationId, row.email)}
                                            disabled={sendingCodeEmailForAppId === app.applicationId}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[10px] font-bold"
                                          >
                                            {sendingCodeEmailForAppId === app.applicationId
                                              ? 'Sending Access Email...'
                                              : 'Send Access Code Email'}
                                          </button>
                                          {codeEmailStatusByAppId[app.applicationId] && (
                                            <p
                                              className={`mt-1 text-[10px] ${
                                                codeEmailStatusByAppId[app.applicationId].ok
                                                  ? 'text-emerald-700'
                                                  : 'text-rose-700'
                                              }`}
                                            >
                                              {codeEmailStatusByAppId[app.applicationId].message}
                                            </p>
                                          )}
                                          <div className="flex flex-wrap gap-1.5 mt-1">
                                            <button
                                              type="button"
                                              onClick={() => void handleSendManualApplicationEmail(app.applicationId, 'review')}
                                              disabled={sendingManualEmail === `review:${app.applicationId}`}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[10px] font-bold"
                                            >
                                              {sendingManualEmail === `review:${app.applicationId}` ? 'Sending Review...' : 'Send Review Summary'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => void handleSendManualApplicationEmail(app.applicationId, 'acceptance')}
                                              disabled={sendingManualEmail === `acceptance:${app.applicationId}`}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[10px] font-bold"
                                            >
                                              {sendingManualEmail === `acceptance:${app.applicationId}` ? 'Sending Acceptance...' : 'Send Acceptance Update'}
                                            </button>
                                          </div>
                                          {manualEmailStatusByAppId[app.applicationId]?.message && (
                                            <p className={`mt-1 text-[10px] ${manualEmailStatusByAppId[app.applicationId].ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                                              {manualEmailStatusByAppId[app.applicationId].message}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
