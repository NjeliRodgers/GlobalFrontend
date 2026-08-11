import { Interview } from '../types';
import { apiFetch, jsonHeaders } from './client';

export async function fetchInterviews(): Promise<Interview[]> {
  try {
    const res = await apiFetch('/interviews');
    if (!res.ok) return [];
    const data = await res.json();
    return data.interviews || [];
  } catch (err) {
    return [];
  }
}

export async function scheduleInterview(payload: {
  applicationId: string;
  interviewerId?: string;
  interviewerName?: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingLink?: string;
  notes?: string;
}): Promise<{ interview: Interview; emailLog: any }> {
  const res = await apiFetch('/interviews', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to schedule interview');
  return data;
}
