import { Job } from '../types';
import { apiFetch, jsonHeaders } from './client';

export async function fetchJobs(filters?: { location?: string; department?: string; workType?: string }): Promise<Job[]> {
  try {
    const query = new URLSearchParams(filters as any).toString();
    const res = await apiFetch(`/jobs?${query}`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    const data = await res.json();
    return data.jobs || [];
  } catch (err) {
    console.warn('Backend fetch fallback to local state:', err);
    return [];
  }
}

export async function fetchJobById(id: string): Promise<Job | null> {
  try {
    const res = await apiFetch(`/jobs/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.job || null;
  } catch (err) {
    return null;
  }
}

export async function createJob(jobData: Partial<Job>): Promise<Job> {
  const res = await apiFetch('/jobs', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(jobData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create job');
  return data.job;
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<Job> {
  const res = await apiFetch(`/jobs/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update job');
  return data.job;
}
