import { JobAssessment } from '../types';
import { apiFetch, jsonHeaders } from './client';

export async function fetchAssessmentForJob(jobId: string): Promise<JobAssessment | null> {
  try {
    const res = await apiFetch(`/assessments/job/${jobId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.assessment || null;
  } catch (err) {
    return null;
  }
}

export async function submitAssessmentTest(payload: {
  applicationId: string;
  jobId: string;
  answers: Record<string, number>;
  pdfDataUrl?: string;
}): Promise<any> {
  const res = await apiFetch('/assessments/submit', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit test');
  return data;
}
