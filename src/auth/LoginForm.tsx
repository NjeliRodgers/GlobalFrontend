import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { resendActivationApi } from '../api/usersApi';
import { Mail, Lock, MailCheck } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToSignUp, onSwitchToForgotPassword }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsActivation, setNeedsActivation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError('');
    setNeedsActivation(false);
    setResendMessage('');
    try {
      await login(email, password);
      setLoading(false);
      onSuccess();
    } catch (err: any) {
      if (err.code === 'ACCOUNT_NOT_ACTIVATED') {
        setNeedsActivation(true);
      }
      setError(err.message || 'Login failed. Please check credentials.');
      setLoading(false);
    }
  };

  const handleResendActivation = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await resendActivationApi(email);
      setResendMessage(res.message);
    } catch (err: any) {
      setResendMessage(err.message || 'Failed to resend activation link');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Sign in to Global Talent Plus</h3>
        <p className="text-sm text-slate-500 mt-1">Sign in with your email to view job applications or manage recruiter & admin operations.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 space-y-2">
          <p>{error}</p>
          {needsActivation && (
            <button
              type="button"
              onClick={handleResendActivation}
              disabled={resendLoading}
              className="flex items-center gap-1.5 text-red-700 font-semibold hover:underline cursor-pointer disabled:opacity-50"
            >
              <MailCheck className="h-3.5 w-3.5" />
              {resendLoading ? 'Sending...' : 'Resend activation email'}
            </button>
          )}
        </div>
      )}

      {resendMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">{resendMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              placeholder="user@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          <div className="text-right mt-1.5">
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#1f4e79] hover:bg-[#102a43] text-white font-semibold text-sm tracking-wide rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Signing in...' : 'Sign In & Continue'}
        </button>
      </form>
      <div className="text-center pt-2 text-xs text-slate-500">
        Don't have a candidate account yet?{' '}
        <button type="button" onClick={onSwitchToSignUp} className="text-indigo-600 font-semibold hover:underline cursor-pointer">
          Create Account
        </button>
      </div>
    </div>
  );
};