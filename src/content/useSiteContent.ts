import { useEffect, useState } from 'react';
import { fetchJobs } from '../api/jobsApi';
import { fetchSiteContent } from '../api/siteContentApi';
import { buildSiteContent, DEFAULT_SITE_CONTENT, SiteContent } from './siteContentDefaults';

// ---- Saved page content (with defaults) -----------------------------------

let contentCache: SiteContent | null = null;
let contentInflight: Promise<SiteContent> | null = null;
const contentListeners = new Set<(c: SiteContent) => void>();

function loadContent(): Promise<SiteContent> {
  if (contentCache) return Promise.resolve(contentCache);
  if (!contentInflight) {
    contentInflight = fetchSiteContent().then((stored) => {
      contentCache = buildSiteContent(stored);
      contentInflight = null;
      return contentCache;
    });
  }
  return contentInflight;
}

/** Call after an admin saves so every public page picks up the change. */
export async function refreshSiteContent(): Promise<SiteContent> {
  contentCache = null;
  contentInflight = null;
  const fresh = await loadContent();
  contentListeners.forEach((listener) => listener(fresh));
  return fresh;
}

export function useSiteContent(): { content: SiteContent; loading: boolean } {
  const [content, setContent] = useState<SiteContent>(contentCache || DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(!contentCache);

  useEffect(() => {
    let active = true;
    const listener = (c: SiteContent) => active && setContent(c);
    contentListeners.add(listener);
    loadContent().then((c) => {
      if (!active) return;
      setContent(c);
      setLoading(false);
    });
    return () => {
      active = false;
      contentListeners.delete(listener);
    };
  }, []);

  return { content, loading };
}

// ---- Live numbers from the job listings -----------------------------------

export interface LiveJobStats {
  loading: boolean;
  openPositions: number;
  countries: number;
  categories: number;
  workTypes: number;
}

const EMPTY_STATS: LiveJobStats = { loading: true, openPositions: 0, countries: 0, categories: 0, workTypes: 0 };

export function useLiveJobStats(): LiveJobStats {
  const [stats, setStats] = useState<LiveJobStats>(EMPTY_STATS);

  useEffect(() => {
    let active = true;
    fetchJobs().then((jobs) => {
      if (!active) return;
      const distinct = (values: (string | undefined)[]) =>
        new Set(values.map((v) => (v || '').trim().toLowerCase()).filter(Boolean)).size;
      setStats({
        loading: false,
        openPositions: jobs.length,
        countries: distinct(jobs.map((j) => j.country)),
        categories: distinct(jobs.map((j) => j.department)),
        workTypes: distinct(jobs.map((j) => j.workType)),
      });
    });
    return () => {
      active = false;
    };
  }, []);

  return stats;
}

/** Replaces {{openPositions}}, {{countries}}, {{categories}} and {{workTypes}}. */
export function applyLiveTokens(text: string, stats: LiveJobStats): string {
  return text.replace(/\{\{\s*(openPositions|countries|categories|workTypes)\s*\}\}/g, (_m, key: keyof LiveJobStats) =>
    stats.loading ? '...' : String(stats[key])
  );
}