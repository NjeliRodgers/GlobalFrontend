import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Users } from 'lucide-react';
import {
  fetchRecruiterSupportAgents,
  setRecruiterSupportAgent,
  RecruiterSupportAgentRow
} from '../api/usersApi';

type PageToast = {
  kind: 'success' | 'error' | 'info';
  message: string;
};

export const GtpRecruitersPage: React.FC = () => {
  const [recruiters, setRecruiters] = useState<RecruiterSupportAgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingRecruiterId, setTogglingRecruiterId] = useState<string | null>(null);
  const [toast, setToast] = useState<PageToast | null>(null);

  const showToast = (kind: PageToast['kind'], message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 3200);
  };

  const loadRecruiters = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const rows = await fetchRecruiterSupportAgents();
      setRecruiters(rows);
    } catch (error: any) {
      showToast('error', error?.message || 'Unable to load recruiters.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadRecruiters();
  }, []);

  const toggleSupportAgent = async (recruiter: RecruiterSupportAgentRow, nextValue: boolean) => {
    setTogglingRecruiterId(recruiter.id);
    try {
      const result = await setRecruiterSupportAgent(recruiter.id, nextValue);
      setRecruiters((prev) => prev.map((row) => (row.id === recruiter.id && result.recruiter ? result.recruiter : row)));

      if (!nextValue && (result.reassignmentSummary.reassigned > 0 || result.reassignmentSummary.unassigned > 0)) {
        showToast(
          'info',
          `Support disabled. Reassigned ${result.reassignmentSummary.reassigned} candidate(s), unassigned ${result.reassignmentSummary.unassigned}.`
        );
      } else {
        showToast('success', nextValue ? 'Recruiter enabled as support agent.' : 'Recruiter removed from support agents.');
      }

      await loadRecruiters(true);
    } catch (error: any) {
      showToast('error', error?.message || 'Failed to update recruiter support status.');
    } finally {
      setTogglingRecruiterId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
          Recruiter Operations
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">GTP Recruiters</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage recruiter support-agent switches used for automated candidate assignment.
        </p>
      </div>

      {toast && (
        <div
          className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
            toast.kind === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : toast.kind === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" /> Recruiters ({recruiters.length})
          </h2>
          <button
            type="button"
            onClick={() => void loadRecruiters(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading recruiters...
          </div>
        ) : recruiters.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            No recruiters found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Recruiter</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Candidates</th>
                  <th className="p-3 text-right">Support Agent Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recruiters.map((recruiter) => (
                  <tr key={recruiter.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{recruiter.name}</div>
                      <div className="text-[10px] text-slate-500">{recruiter.email}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                          recruiter.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {recruiter.isActive ? 'Active account' : 'Inactive account'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{recruiter.assignedCandidates}</td>
                    <td className="p-3 text-right">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <span className="text-[11px] font-semibold text-slate-600">{recruiter.isSupportAgent ? 'ON' : 'OFF'}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={recruiter.isSupportAgent}
                          disabled={togglingRecruiterId === recruiter.id}
                          onClick={() => void toggleSupportAgent(recruiter, !recruiter.isSupportAgent)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            recruiter.isSupportAgent ? 'bg-emerald-500' : 'bg-slate-300'
                          } ${togglingRecruiterId === recruiter.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              recruiter.isSupportAgent ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
