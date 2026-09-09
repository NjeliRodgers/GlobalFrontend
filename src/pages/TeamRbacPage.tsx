import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { fetchUsers, createUser } from '../api/usersApi';
import { useAuth } from '../auth/AuthContext';
import { ShieldCheck, Users, Check, X, KeyRound, UserPlus, CheckCircle2, Eye, EyeOff, Search } from 'lucide-react';
import { isValidEmail, EMAIL_ERROR_MESSAGE } from '../utils/validators';

export const TeamRbacPage: React.FC = () => {
  const { user: currentUser, role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New Recruiter Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('Recruitment & Talent Ops');
  const [newRole, setNewRole] = useState<UserRole>('recruiter');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addSuccessMsg, setAddSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isPrimaryAdminOrRecruiter = role === 'admin' || role === 'recruiter';
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!normalizedQuery) return true;
    return (
      u.name.toLowerCase().includes(normalizedQuery) ||
      u.email.toLowerCase().includes(normalizedQuery) ||
      u.role.toLowerCase().includes(normalizedQuery) ||
      (u.department || '').toLowerCase().includes(normalizedQuery)
    );
  });
  const roleOrder: UserRole[] = ['admin', 'recruiter', 'hiring_manager', 'interviewer'];
  const roleCounts = roleOrder.reduce<Record<UserRole, number>>((acc, roleKey) => {
    acc[roleKey] = filteredUsers.filter((u) => u.role === roleKey).length;
    return acc;
  }, {} as Record<UserRole, number>);
  const candidateCount = filteredUsers.filter((u) => u.role === 'candidate').length;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleCreateRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;
    if (!isValidEmail(newEmail)) {
      setFormError(EMAIL_ERROR_MESSAGE);
      return;
    }
    setFormError('');

    const newUser = await createUser({
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      department: newDepartment
    });

    setUsers([newUser, ...users]);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setIsAddModalOpen(false);
    setAddSuccessMsg(`Successfully provisioned new recruiter account for ${newUser.name} (${newUser.email})`);
    setTimeout(() => setAddSuccessMsg(''), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
            Team Access & Governance
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">Role-Based Access Control (RBAC) System</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure team permissions and provision recruiters. Only primary admin & recruiters can create new team members.
          </p>
        </div>

        {isPrimaryAdminOrRecruiter && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create New Recruiter</span>
          </button>
        )}
      </div>

      {addSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{addSuccessMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team member, email, role, or department..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {roleOrder.map((roleKey) => {
          const roleLabel = roleKey.replace('_', ' ');
          return (
            <div key={roleKey} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">{roleLabel}</p>
              <p className="text-3xl font-extrabold text-slate-900">{roleCounts[roleKey] ?? 0}</p>
            </div>
          );
        })}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Candidates</p>
          <p className="text-3xl font-extrabold text-slate-900">{candidateCount}</p>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" /> RBAC Permissions Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="p-3">Platform Capability / Action</th>
                <th className="p-3 text-center">Admin</th>
                <th className="p-3 text-center">Recruiter</th>
                <th className="p-3 text-center">Hiring Manager</th>
                <th className="p-3 text-center">Interviewer</th>
                <th className="p-3 text-center">Candidate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              <tr>
                <td className="p-3 font-bold text-slate-900">View Public Job Openings</td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Submit Application & Take Assessment</td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Post & Edit Job Openings</td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Bulk Edit Candidate Pipeline Statuses</td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Schedule Technical Interviews & Calendar Invites</td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">Access Encrypted Document Storage Vault</td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900">View System Real-Time Email Logs</td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-emerald-600"><Check className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
                <td className="p-3 text-center text-slate-300"><X className="h-4 w-4 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Team Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" /> System Accounts & Roles
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading team members...</div>
        ) : (
          <div className="space-y-5">
            {(['admin', 'recruiter', 'hiring_manager', 'interviewer'] as UserRole[]).map((roleKey) => {
              const roleUsers = filteredUsers.filter((u) => u.role === roleKey);
              if (roleUsers.length === 0) return null;
              const roleLabel = roleKey.replace('_', ' ');
              return (
                <div key={roleKey}>
                  <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    {roleLabel} ({roleUsers.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roleUsers.map((u) => (
                      <div key={u.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{u.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold rounded-full uppercase">
                          {roleLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredUsers.filter((u) => u.role === 'candidate').length > 0 && (
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                {filteredUsers.filter((u) => u.role === 'candidate').length} candidate account(s) not shown here — this page covers team access only.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Create Recruiter Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" /> Provision Recruiter Account
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecruiter} className="space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">{formError}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah.j@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 pr-9 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="recruiter">Recruiter / Talent Partner</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="interviewer">Technical Interviewer</option>
                  <option value="admin">Primary Admin</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
