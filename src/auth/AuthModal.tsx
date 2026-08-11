import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { X, Briefcase } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto my-auto shrink-0">
        <div className="sticky -top-5 sm:-top-6 bg-white pt-2 pb-3 mb-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg">Global Talent Plus</span>
              <span className="text-xs text-slate-400 block -mt-1 font-medium">Recruitment Platform</span>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === 'login' && (
          <LoginForm
            onSuccess={closeAuthModal}
            onSwitchToSignUp={() => setMode('signup')}
            onSwitchToForgotPassword={() => setMode('forgot')}
          />
        )}
        {mode === 'signup' && <SignUpForm onSuccess={closeAuthModal} onSwitchToLogin={() => setMode('login')} />}
        {mode === 'forgot' && <ForgotPasswordForm onSwitchToLogin={() => setMode('login')} />}
      </div>
    </div>
  );
};