import { ApexPackage, ApplicationVoucher, EmailLog, ReadinessProgress } from '../types';
import { apiFetch, jsonHeaders } from './client';

export interface SupportCandidate {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  location: string;
  age: number | null;
  hasPlatformAccount: boolean;
  platformAccountActive: boolean;
  platformJoinedAt: string | null;
}

export interface SupportAssignedPackage {
  id: string;
  name: string;
  packageId: string;
  costKsh: number | null;
  courses: SupportAssignedPackageItem[];
  exams: SupportAssignedPackageItem[];
}

export interface SupportAssignedPackageItem {
  id: string;
  name: string;
  costKsh: number | null;
  needsPayment: boolean;
  enrollmentStatus: string | null;
  isPaid: boolean;
  paymentRef: string | null;
}

export interface SupportApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  stage: string;
  appliedAt: string;
  lastUpdated: string;
  candidatePhone: string;
  candidateLocation: string;
  documentsCount: number;
  notes: string[];
  readinessProgress: ReadinessProgress;
  voucher: ApplicationVoucher | null;
  assignedPackages: SupportAssignedPackage[];
}

export interface SupportProfile {
  candidate: SupportCandidate;
  atestaAccount: { id: string; isActive: boolean; createdAt: string | null } | null;
  applications: SupportApplication[];
  emailHistory: EmailLog[];
  operations: {
    isBlocked: boolean;
    blockedAt: string | null;
    blockedReason: string | null;
    isPromisedToPay: boolean;
    promisedToPayAt: string | null;
    nextFollowUpAt: string | null;
    notes: Array<{ id: string; text: string; createdAt: string; createdBy?: string }>;
  };
}

export async function fetchCandidateSupportProfile(email: string): Promise<SupportProfile> {
  const res = await apiFetch(`/support/candidate?email=${encodeURIComponent(email)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to import candidate details.');
  return data as SupportProfile;
}

export async function sendCandidateSupportEmail(
  email: string,
  applicationId?: string
): Promise<{ delivered: boolean; emailLog: EmailLog }> {
  const res = await apiFetch('/support/candidate/send-email', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, applicationId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send support email.');
  return data;
}

export async function assumeSupportItemPaid(payload: {
  applicationId: string;
  packageRef: string;
  itemType: 'course' | 'exam';
  itemId: string;
}): Promise<{ success: boolean; message: string; transactionRef: string | null }> {
  const res = await apiFetch('/support/candidate/assume-paid', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to mark this item as paid.');
  return {
    success: !!data.success,
    message: String(data.message || 'Payment status updated.'),
    transactionRef: data.transactionRef || null
  };
}

export type CandidateOperationsUpdate = {
  isBlocked?: boolean;
  blockedReason?: string;
  isPromisedToPay?: boolean;
  nextFollowUpAt?: string | null;
  notes?: SupportProfile['operations']['notes'];
};

export async function updateCandidateOperations(payload: CandidateOperationsUpdate & { candidateEmail: string }) {
  const res = await apiFetch('/users/candidates/operations', {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update candidate operations.');
  return data.operations as SupportProfile['operations'];
}