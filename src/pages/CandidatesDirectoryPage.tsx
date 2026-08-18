import React, { useEffect, useMemo, useState } from 'react';
import { fetchCandidatesDirectory, CandidateDirectoryRow } from '../api/usersApi';
import { Search, Users, ChevronDown, ChevronUp, ShieldCheck, FolderOpen } from 'lucide-react';

export const CandidatesDirectoryPage: React.FC = () => {
  const [rows, setRows] = useState<CandidateDirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchCandidatesDirectory();
    setRows(data);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
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
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
          Candidate Intelligence
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">Candidates Directory</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View all registered candidates, application history, current statuses, and Atesta account readiness.
        </p>
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
                          <td colSpan={6} className="p-3 bg-slate-50/70">
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
