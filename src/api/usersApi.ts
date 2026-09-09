import { User } from '../types';
import { apiFetch, jsonHeaders } from './client';

export async function loginApi(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await apiFetch('/users/login', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data.error || 'Login failed');
    err.code = data.code; // e.g. 'ACCOUNT_NOT_ACTIVATED'
    throw err;
  }
  return data;
}

export async function signUpApi(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  department?: string;
  gender?: string;
}): Promise<{ user: User; message: string }> {
  const res = await apiFetch('/users/signup', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sign up failed');
  // No token is returned here — the account is inactive until the
  // activation link is clicked, so callers must NOT treat this as a login.
  return data;
}

export async function activateAccountApi(email: string, token: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch('/users/activate', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, token })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to activate account');
  return data;
}

export async function resendActivationApi(email: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch('/users/resend-activation', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to resend activation link');
  return data;
}

export async function forgotPasswordApi(email: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch('/users/forgot-password', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request password reset');
  return data;
}

export async function resetPasswordApi(data: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch('/users/reset-password', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Failed to reset password');
  return result;
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await apiFetch('/users');
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    return [];
  }
}


export interface CandidateDirectoryRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  isPlatformAccountActive: boolean;
  registeredAt: string;
  hasAtestaAccount: boolean;
  atestaAccountId: string | null;
  atestaAccountActive: boolean;
  atestaRegisteredAt: string | null;
  totalApplications: number;
  lastAppliedAt: string | null;
  statusSummary: Record<string, number>;
  applications: Array<{
    applicationId: string;
    jobId: string;
    jobTitle: string;
    stage: string;
    appliedAt: string;
    lastUpdated: string;
    documentsCount: number;
  }>;
  totalPaidKsh?: number;
  paidTransactionsCount?: number;
  lastPaymentAt?: string | null;
}

export interface CandidatesDirectoryAnalytics {
  fromDate: string | null;
  toDate: string | null;
  registrationsInPeriod: number;
  atestaRegistrationsInPeriod: number;
  applicationsInPeriod: number;
  paidCandidatesInPeriod: number;
  paymentTransactionsInPeriod: number;
  totalCashCollectedKsh: number;
  firstPaymentAt: string | null;
  lastPaymentAt: string | null;
  dailyCollections: Array<{
    date: string;
    amountKsh: number;
  }>;
}

export interface CandidatesDirectoryResponse {
  candidates: CandidateDirectoryRow[];
  analytics: CandidatesDirectoryAnalytics;
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

export async function fetchCandidatesDirectoryReport(filters?: { fromDate?: string; toDate?: string }): Promise<CandidatesDirectoryResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.fromDate) params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params.set('toDate', filters.toDate);

    const query = params.toString();
    const res = await apiFetch(`/users/candidates/directory${query ? `?${query}` : ''}`);
    if (!res.ok) return { candidates: [], analytics: EMPTY_ANALYTICS };
    const data = await res.json();
    return {
      candidates: data.candidates || [],
      analytics: data.analytics || EMPTY_ANALYTICS
    };
  } catch (err) {
    return { candidates: [], analytics: EMPTY_ANALYTICS };
  }
}

export async function fetchCandidatesDirectory(filters?: { fromDate?: string; toDate?: string }): Promise<CandidateDirectoryRow[]> {
  const data = await fetchCandidatesDirectoryReport(filters);
  return data.candidates;
}
export async function updateUserProfile(userId: string, updates: {
  name?: string;
  phone?: string;
  department?: string;
  gender?: string;
  location?: string;
}): Promise<User> {
  const res = await apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data.user;
}

export async function uploadAvatarApi(userId: string, file: File): Promise<User> {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await apiFetch(`/users/${userId}/avatar`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload avatar');
  return data.user;
}
export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  department?: string;
}): Promise<User> {
  try {
    const res = await signUpApi(userData);
    return res.user;
  } catch (err) {
    return {
      id: `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: (userData.role || 'recruiter') as any,
      department: userData.department,
      createdAt: new Date().toISOString()
    };
  }
}