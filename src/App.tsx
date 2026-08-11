import React from 'react';
import { AuthProvider } from './auth/AuthContext';
import { AppShell } from './AppShell';
import { ResetPasswordForm } from './auth/ResetPasswordForm';
import { ActivateAccount } from './auth/ActivateAccount';
import { Briefcase } from 'lucide-react';

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('resetToken');
  const resetEmail = params.get('email');
  const activationToken = params.get('activationToken');
  const activationEmail = params.get('email');

  const backToApp = () => {
    window.location.href = window.location.origin + window.location.pathname;
  };

  if (resetToken && resetEmail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto my-auto shrink-0">
          <div className="pt-2 pb-3 mb-4 border-b border-slate-100 flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg">Global Talent Plus</span>
              <span className="text-xs text-slate-400 block -mt-1 font-medium">Recruitment Platform</span>
            </div>
          </div>
          <ResetPasswordForm email={resetEmail} token={resetToken} onSuccess={backToApp} />
        </div>
      </div>
    );
  }

  if (activationToken && activationEmail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto my-auto shrink-0">
          <div className="pt-2 pb-3 mb-4 border-b border-slate-100 flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg">Global Talent Plus</span>
              <span className="text-xs text-slate-400 block -mt-1 font-medium">Recruitment Platform</span>
            </div>
          </div>
          <ActivateAccount email={activationEmail} token={activationToken} onSuccess={backToApp} />
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}