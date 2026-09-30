import {
  Application,
  ApplicationStage,
  ApplicationVoucher,
  ReadinessProgress,
  SubmittedDocument
} from '../types';
import { apiFetch, jsonHeaders } from './client';

export async function fetchApplications(params?: { jobId?: string; stage?: string; candidateId?: string }): Promise<Application[]> {
  try {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiFetch(`/applications?${query}`);
    if (!res.ok) throw new Error('Failed to fetch applications');
    const data = await res.json();
    return data.applications || [];
  } catch (err) {
    return [];
  }
}

export async function submitApplication(appData: any): Promise<{ application: Application; emailLog: any }> {
  const res = await apiFetch('/applications', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(appData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit application');
  return data;
}

export async function uploadApplicationDocument(file: File, fileType: string) {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('fileType', fileType);

  const res = await apiFetch('/applications/documents/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload document');
  return data.document;
}

export async function updateApplicationStage(id: string, stage: ApplicationStage, notes?: string): Promise<{ application: Application; emailLog: any }> {
  const res = await apiFetch(`/applications/${id}/stage`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ stage, notes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update application stage');
  return data;
}

export async function bulkUpdateApplicationStages(applicationIds: string[], stage: ApplicationStage): Promise<Application[]> {
  const res = await apiFetch('/applications/bulk-stage', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ applicationIds, stage })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to bulk update stages');
  return data.applications;
}

export async function sendApplicationAccessCodeEmail(applicationId: string): Promise<{
  delivered: boolean;
  voucher: { code: string; redeemedAt: string | null; issuedAt: string | null };
  packageRefs: string[];
}> {
  const res = await apiFetch(`/applications/${applicationId}/send-access-code-email`, {
    method: 'POST',
    headers: jsonHeaders
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send access code email');
  return {
    delivered: !!data.delivered,
    voucher: data.voucher,
    packageRefs: data.packageRefs || []
  };
}

export async function createCandidateApplicationAndSendAccessCode(payload: {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateLocation?: string;
  jobId: string;
}): Promise<{
  delivered: boolean;
  candidateCreated: boolean;
  applicationCreated: boolean;
  application: { id: string; jobId: string; jobTitle: string; candidateEmail: string };
}> {
  const res = await apiFetch('/applications/send-access-code/non-registered', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create candidate application and send access code email');

  return {
    delivered: !!data.delivered,
    candidateCreated: !!data.candidateCreated,
    applicationCreated: !!data.applicationCreated,
    application: data.application
  };
}

export async function fetchApplicationReadiness(applicationId: string): Promise<{
  application: Application;
  readinessProgress: ReadinessProgress;
  assignedPackageIds: string[];
  voucher: ApplicationVoucher | null;
}> {
  const res = await apiFetch(`/applications/${applicationId}/readiness`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load application readiness.');
  }

  return data;
}

export async function updateApplicationReadiness(
  applicationId: string,
  payload: {
    complianceAnswers?: Partial<Application['complianceAnswers']>;
    documents?: Application['documents'];
  }
): Promise<{
  application: Application;
  readinessProgress: ReadinessProgress;
  assignedPackageIds: string[];
  voucher: ApplicationVoucher | null;
}> {
  const res = await apiFetch(`/applications/${applicationId}/readiness`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update application readiness.');
  }

  return data;
}


export async function uploadApplicationReadinessDocument(
  applicationId: string,
  file: File,
  fileType: string
): Promise<{
  document: SubmittedDocument;
  application: Application;
  readinessProgress: ReadinessProgress;
  assignedPackageIds: string[];
  voucher: ApplicationVoucher | null;
}> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('fileType', fileType);

  const res = await apiFetch(`/applications/${applicationId}/readiness/documents`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload document');
  return data;
}

export async function sendApplicationReviewEmail(applicationId: string): Promise<{ delivered: boolean; emailLog: any }> {
  const res = await apiFetch(`/applications/${applicationId}/send-review-email`, {
    method: 'POST',
    headers: jsonHeaders
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send application review email');
  return { delivered: !!data.delivered, emailLog: data.emailLog };
}

export async function sendApplicationAcceptanceEmail(applicationId: string): Promise<{ delivered: boolean; emailLog: any }> {
  const res = await apiFetch(`/applications/${applicationId}/send-acceptance-email`, {
    method: 'POST',
    headers: jsonHeaders
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send acceptance email');
  return { delivered: !!data.delivered, emailLog: data.emailLog };
}