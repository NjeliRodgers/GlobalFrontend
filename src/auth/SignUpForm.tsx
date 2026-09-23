import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '../types';
import { User, Mail, Phone, UserPlus, MailCheck } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { isValidEmail, isValidPhone, EMAIL_ERROR_MESSAGE, PHONE_ERROR_MESSAGE } from '../utils/validators';

interface SignUpFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      setError('Name, email, phone number and password are required');
      return;
    }
    if (!location.trim()) {
      setError('Location is required');
      return;
    }
    const parsedAge = Number(age);
    if (!age || Number.isNaN(parsedAge) || parsedAge < 16 || parsedAge > 100) {
      setError('A valid age is required');
      return;
    }
    if (!isValidEmail(email)) {
      setError(EMAIL_ERROR_MESSAGE);
      return;
    }
    if (!isValidPhone(phone)) {
      setError(PHONE_ERROR_MESSAGE);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signup({ name, email, password, role, phone, gender, location, age: parsedAge });
      setLoading(false);
      // Account is created but inactive — no session was started.
      // Show a confirmation screen instead of closing the modal via onSuccess.
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-5 text-center py-2">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
          <MailCheck className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Check your inbox</h3>
          <p className="text-sm text-slate-500 mt-1">
            We've sent an activation link to <strong className="text-slate-700">{email}</strong>. Click it to activate your account before signing in. The link expires in 1 hour.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Create Account</h3>
        <p className="text-sm text-slate-500 mt-1">Register to browse and apply for Job vacancies.</p>
      </div>
      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              placeholder="enter your full name"
            />
          </div>
        </div>

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
              placeholder="Your real email account"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              placeholder="phone number with country code"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          >
            <option value="">Select gender (optional)</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-Binary">Non-Binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              placeholder="City, Country"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={16}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              placeholder="Your age"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm Password</label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          {loading ? (
            <span className="text-xs">Creating account...</span>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 text-xs text-slate-500">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-indigo-600 font-semibold hover:underline cursor-pointer">
          Sign In
        </button>
      </div>
    </div>
  );
};