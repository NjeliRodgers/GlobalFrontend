import { ApexPackage, ApplicationVoucher, EmailLog, ReadinessProgress } from '../types';
import { apiFetch, jsonHeaders } from './client';

export interface SupportCandidate {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  location: string;
  hasPlatformAccount: boolean;
  platformAccountActive: boolean;
  platformJoinedAt: string | null;
}

export interface SupportAssignedPackage {
  id: string;
  name: string;
  packageId: string;
  costKsh: number | null;
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