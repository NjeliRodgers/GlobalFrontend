import { SubmittedDocument } from '../types';
import { apiFetch } from './client';

export async function fetchDocuments(): Promise<SubmittedDocument[]> {
  try {
    const res = await apiFetch('/documents');
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
  } catch (err) {
    return [];
  }
}
