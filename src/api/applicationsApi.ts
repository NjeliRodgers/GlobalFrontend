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