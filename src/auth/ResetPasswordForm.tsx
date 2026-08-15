import React, { useState } from 'react';
import { resetPasswordApi } from '../api/usersApi';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';

interface ResetPasswordFormProps {
  email: string;
  token: string;
  onSuccess: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ email, token, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi({ email, token, newPassword });
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'This reset link is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-5 text-center py-2">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Password updated</h3>
          <p className="text-sm text-slate-500 mt-1">Your password has been changed. You can now sign in with your new password.</p>
        </div>
        <button
          type="button"
          onClick={onSuccess}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm cursor-pointer"
        >
          Continue to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-indigo-600" />
          Choose a new password
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Setting a new password for <strong className="text-slate-700">{email}</strong>.
        </p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password</label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? <span className="text-xs">Updating password...</span> : <span>Update Password</span>}
        </button>
      </form>
    </div>
  );
};