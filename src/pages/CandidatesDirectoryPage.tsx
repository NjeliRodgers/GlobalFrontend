import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchCandidatesDirectoryReport,
  CandidateDirectoryRow,
  CandidatesDirectoryAnalytics
} from '../api/usersApi';
import { Search, Users, ChevronDown, ChevronUp, ShieldCheck, FolderOpen, BarChart3, Clock3 } from 'lucide-react';

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
  dailyCollections: []
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
  const [applicationsOnly, setApplicationsOnly] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async (filters?: { fromDate?: string; toDate?: string }) => {
    setLoading(true);
    const data = await fetchCandidatesDirectoryReport(filters);
    setRows(data.candidates);
    setPeriodAnalytics(data.analytics || EMPTY_ANALYTICS);
    setLoading(false);
  };

  const applyDateFilter = async () => {
    await loadData({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined
    });
  };

  const clearDateFilter = async () => {
    setFromDate('');
    setToDate('');
    await loadData();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(value || 0);

  const scopedRows = useMemo(() => {
    if (!initialJobId) return rows;

    return rows
      .map((row) => {
        const scopedApplications = row.applications.filter((app) => app.jobId === initialJobId);
        const statusSummary = scopedApplications.reduce<Record<string, number>>((acc, app) => {
          acc[app.stage] = (acc[app.stage] || 0) + 1;
          return acc;
        }, {});

        return {
          ...row,
          applications: scopedApplications,
          totalApplications: scopedApplications.length,
          lastAppliedAt: scopedApplications[0]?.appliedAt || null,
          statusSummary
        };
      })
      .filter((row) => row.totalApplications > 0);
  }, [rows, initialJobId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const baseRows = applicationsOnly ? scopedRows.filter((row) => row.totalApplications > 0) : scopedRows;
    if (!q) return baseRows;
    return baseRows.filter((row) => {
      const inProfile =
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q);
      const inApplications = row.applications.some(
        (app) => app.jobTitle.toLowerCase().includes(q) || app.stage.toLowerCase().includes(q)
      );
      return inProfile || inApplications;
    });
  }, [scopedRows, search, applicationsOnly]);

  const analytics = useMemo(() => {
    const totalCandidates = filtered.length;
    const withApplications = filtered.filter((row) => row.totalApplications > 0).length;
    const withAtesta = filtered.filter((row) => row.hasAtestaAccount).length;
    const atestaActive = filtered.filter((row) => row.atestaAccountActive).length;

    const totalApplications = filtered.reduce((sum, row) => sum + row.totalApplications, 0);
    const atestaCoverage = totalCandidates > 0 ? Math.round((withAtesta / totalCandidates) * 100) : 0;

    return {
      totalCandidates,
      withApplications,
      withAtesta,
      atestaActive,
      totalApplications,
      atestaCoverage
    };
  }, [filtered]);

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
            View all registered candidates, application history, current statuses, and Atesta account readiness.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate, email, location, role, stage..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="pt-3 flex items-center gap-2">
          <button
            onClick={() => setApplicationsOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${
              applicationsOnly
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {applicationsOnly ? 'Showing: Applied Only' : 'Filter: Applied Only'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={applyDateFilter}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
          >
            Apply Date Filter
          </button>
          <button
            onClick={clearDateFilter}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            Clear Filter
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          Date filter applies to registrations, applications, and payment analytics. Leave blank for all-time totals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Paid Candidates</span>
            <BarChart3 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{periodAnalytics.paidCandidatesInPeriod}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Candidates who paid any amount</p>
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
          <p className="text-[10px] text-slate-500 mt-0.5">Total applications: {analytics.totalApplications}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Atesta Created</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{analytics.withAtesta}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Active Atesta: {analytics.atestaActive}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Atesta Coverage</span>
            <Clock3 className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{analytics.atestaCoverage}%</div>
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
            No candidates matched your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Platform Account</th>
                  <th className="p-3">Atesta Account</th>
                  <th className="p-3">Atesta Created</th>
                  <th className="p-3">Applications</th>
                  <th className="p-3">Last Applied</th>
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
                        <td className="p-3 text-slate-600 text-[11px]">
                          {row.atestaRegisteredAt ? new Date(row.atestaRegisteredAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-3 font-bold text-slate-800">{row.totalApplications}</td>
                        <td className="p-3 text-slate-600">
                          {row.lastAppliedAt ? new Date(row.lastAppliedAt).toLocaleString() : 'Never applied'}
                        </td>
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
                                <p className="text-xs text-slate-700">
                                  Atesta Created: {row.atestaRegisteredAt ? new Date(row.atestaRegisteredAt).toLocaleString() : 'N/A'}
                                </p>
                              </div>

                              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Status Summary
                                </h4>
                                {Object.keys(row.statusSummary).length === 0 ? (
                                  <p className="text-xs text-slate-500">No applications yet.</p>
                                ) : (
                                  <div className="space-y-1">
                                    {Object.entries(row.statusSummary).map(([stage, count]) => (
                                      <div key={stage} className="flex items-center justify-between text-xs bg-slate-50 rounded-md px-2 py-1 border border-slate-200">
                                        <span className="text-slate-700">{stage}</span>
                                        <span className="font-bold text-slate-900">{count}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                                  <FolderOpen className="h-3.5 w-3.5 text-sky-600" /> Applied Jobs
                                </h4>
                                {row.applications.length === 0 ? (
                                  <p className="text-xs text-slate-500">No job applications submitted yet.</p>
                                ) : (
                                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                                    {row.applications.map((app) => (
                                      <div key={app.applicationId} className="text-xs bg-slate-50 rounded-md px-2 py-1.5 border border-slate-200">
                                        <div className="font-semibold text-slate-900">{app.jobTitle}</div>
                                        <div className="text-[10px] text-slate-500">Status: {app.stage}</div>
                                        <div className="text-[10px] text-slate-500">Applied: {new Date(app.appliedAt).toLocaleDateString()}</div>
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
