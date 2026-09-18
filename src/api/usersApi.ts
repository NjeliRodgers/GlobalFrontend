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
    assignedPackageIds?: string[];
    assignedPackages?: Array<{
      id: string;
      packageId: string;
      name: string;
    }>;
    voucher?: {
      code: string;
      redeemedAt: string | null;
      issuedAt: string | null;
    } | null;
  }>;
  totalPaidKsh?: number;
  paidTransactionsCount?: number;
  lastPaymentAt?: string | null;
  periodPaidKsh?: number;
  periodPaidTransactionsCount?: number;
  periodLastPaymentAt?: string | null;
  salesStage?: string;
  actionTags?: string[];
  daysSinceRegistration?: number;
  daysSinceLastActivity?: number | null;
}

export interface CandidatesDirectoryAnalytics {
  fromDate: string | null;
  toDate: string | null;
  registrationsInPeriod: number;
  atestaRegistrationsInPeriod: number;
  applicationsInPeriod: number;
  applicationRecordsInPeriod?: number;
  paidCandidatesInPeriod: number;
  paymentTransactionsInPeriod: number;
  totalCashCollectedKsh: number;
  manualPaymentTransactionsInPeriod: number;
  manualCashCollectedKsh: number;
  firstPaymentAt: string | null;
  lastPaymentAt: string | null;
  dailyCollections: Array<{
    date: string;
    amountKsh: number;
  }>;
  totals: {
    totalCandidateAccounts: number;
    totalApplicationsAllTime: number;
    totalAppliedPeopleAllTime?: number;
    totalApplicationRecordsAllTime?: number;
    totalAtestaAccounts: number;
    paidAtestaCandidatesAllTime: number;
    filteredCandidates: number;
    filteredWithApplications: number;
    filteredAtestaAccounts: number;
    filteredPaidAtestaAccounts: number;
  };
  funnelPercentages: {
    applicationsVsTotalAccounts: number;
    atestaAccountsVsApplications: number;
    paidAtestaUsersVsAtestaAccounts: number;
    filteredApplicationsVsTotalAccounts: number;
    filteredAtestaAccountsVsApplications: number;
    filteredPaidAtestaUsersVsAtestaAccounts: number;
  };
  salesStageDistribution: Record<string, number>;
  dropOff: {
    registeredWithoutApplications: number;
    appliedWithoutAtesta: number;
    atestaWithoutPayment: number;
  };
  salesActions: Array<{
    id: string;
    label: string;
    description: string;
    count: number;
    candidateIds: string[];
  }>;
  filtersApplied?: Record<string, unknown>;
}

export interface CandidatesDirectoryFilters {
  fromDate?: string;
  toDate?: string;
  search?: string;
  jobId?: string;
  stage?: string;
  stages?: string[];
  atestaStatus?: 'any' | 'none' | 'created' | 'active' | 'inactive';
  salesStage?: string;
  hasApplications?: boolean;
  hasPayments?: boolean;
  hasAtesta?: boolean;
  platformActive?: boolean;
  minApplications?: number;
  maxApplications?: number;
  minTotalPaidKsh?: number;
  maxTotalPaidKsh?: number;
  sortBy?: 'registeredAt' | 'name' | 'totalApplications' | 'totalPaidKsh' | 'lastAppliedAt' | 'lastPaymentAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
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
  applicationRecordsInPeriod: 0,
  paidCandidatesInPeriod: 0,
  paymentTransactionsInPeriod: 0,
  totalCashCollectedKsh: 0,
  firstPaymentAt: null,
  lastPaymentAt: null,
  dailyCollections: [],
  totals: {
    totalCandidateAccounts: 0,
    totalApplicationsAllTime: 0,
    totalAppliedPeopleAllTime: 0,
    totalApplicationRecordsAllTime: 0,
    totalAtestaAccounts: 0,
    paidAtestaCandidatesAllTime: 0,
    filteredCandidates: 0,
    filteredWithApplications: 0,
    filteredAtestaAccounts: 0,
    filteredPaidAtestaAccounts: 0
  },
  funnelPercentages: {
    applicationsVsTotalAccounts: 0,
    atestaAccountsVsApplications: 0,
    paidAtestaUsersVsAtestaAccounts: 0,
    filteredApplicationsVsTotalAccounts: 0,
    filteredAtestaAccountsVsApplications: 0,
    filteredPaidAtestaUsersVsAtestaAccounts: 0
  },
  salesStageDistribution: {},
  dropOff: {
    registeredWithoutApplications: 0,
    appliedWithoutAtesta: 0,
    atestaWithoutPayment: 0
  },
  salesActions: []
};

export async function fetchCandidatesDirectoryReport(filters?: CandidatesDirectoryFilters): Promise<CandidatesDirectoryResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.fromDate) params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params.set('toDate', filters.toDate);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.jobId) params.set('jobId', filters.jobId);
    if (filters?.stage) params.set('stage', filters.stage);
    if (filters?.stages?.length) params.set('stages', filters.stages.join(','));
    if (filters?.atestaStatus) params.set('atestaStatus', filters.atestaStatus);
    if (filters?.salesStage) params.set('salesStage', filters.salesStage);
    if (typeof filters?.hasApplications === 'boolean') params.set('hasApplications', String(filters.hasApplications));
    if (typeof filters?.hasPayments === 'boolean') params.set('hasPayments', String(filters.hasPayments));
    if (typeof filters?.hasAtesta === 'boolean') params.set('hasAtesta', String(filters.hasAtesta));
    if (typeof filters?.platformActive === 'boolean') params.set('platformActive', String(filters.platformActive));
    if (typeof filters?.minApplications === 'number') params.set('minApplications', String(filters.minApplications));
    if (typeof filters?.maxApplications === 'number') params.set('maxApplications', String(filters.maxApplications));
    if (typeof filters?.minTotalPaidKsh === 'number') params.set('minTotalPaidKsh', String(filters.minTotalPaidKsh));
    if (typeof filters?.maxTotalPaidKsh === 'number') params.set('maxTotalPaidKsh', String(filters.maxTotalPaidKsh));
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);
    if (typeof filters?.limit === 'number') params.set('limit', String(filters.limit));

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

export async function fetchCandidatesDirectory(filters?: CandidatesDirectoryFilters): Promise<CandidateDirectoryRow[]> {
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