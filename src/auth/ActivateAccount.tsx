import React, { useEffect, useState } from 'react';
import { activateAccountApi } from '../api/usersApi';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ActivateAccountProps {
  email: string;
  token: string;
  onSuccess: () => void;
}

export const ActivateAccount: React.FC<ActivateAccountProps> = ({ email, token, onSuccess }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const activate = async () => {
      try {
        const res = await activateAccountApi(email, token);
        if (!cancelled) {
          setMessage(res.message);
          setStatus('success');
        }
      } catch (err: any) {
        if (!cancelled) {
          setMessage(err.message || 'This activation link is invalid or has expired.');
          setStatus('error');
        }
      }
    };

    activate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, token]);

  if (status === 'loading') {
    return (
      <div className="space-y-5 text-center py-6">
        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full mx-auto flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Activating your account...</h3>
          <p className="text-sm text-slate-500 mt-1">This will only take a moment.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-5 text-center py-2">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Account activated</h3>
          <p className="text-sm text-slate-500 mt-1">{message}</p>
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
    <div className="space-y-5 text-center py-2">
      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
        <XCircle className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900">Activation failed</h3>
        <p className="text-sm text-slate-500 mt-1">{message}</p>
      </div>
      <button
        type="button"
        onClick={onSuccess}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm cursor-pointer"
      >
        Back to Sign In
      </button>
    </div>
  );
};