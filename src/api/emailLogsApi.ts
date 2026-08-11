import { EmailLog } from '../types';
import { apiFetch } from './client';

export async function fetchEmailLogs(candidateId?: string): Promise<EmailLog[]> {
  try {
    const query = candidateId ? `?candidateId=${candidateId}` : '';
    const res = await apiFetch(`/email-logs${query}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.emailLogs || [];
  } catch (err) {
    return [];
  }
}
