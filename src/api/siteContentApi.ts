import { API_BASE_URL, apiFetch, jsonHeaders } from './client';
import type { SiteContentPageKey } from '../content/siteContentDefaults';

// Public: returns whatever an admin has saved for each page. Pages that have
// never been edited are simply missing, and the defaults are used instead.
export async function fetchSiteContent(): Promise<Partial<Record<SiteContentPageKey, unknown>>> {
  try {
    const res = await apiFetch('/site-content');
    if (!res.ok) return {};
    const data = await res.json();
    return data.content || {};
  } catch (err) {
    console.warn('Could not load public page content, using defaults:', err);
    return {};
  }
}

// Admin only.
export async function saveSiteContentPage(pageKey: SiteContentPageKey, content: unknown): Promise<void> {
  const res = await apiFetch(`/site-content/${pageKey}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ content }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to save changes');
}

// Admin only. Removes the saved version so the page goes back to its defaults.
export async function resetSiteContentPage(pageKey: SiteContentPageKey): Promise<void> {
  const res = await apiFetch(`/site-content/${pageKey}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to reset page');
}

// ---- Pictures --------------------------------------------------------------

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // the server accepts up to 4MB
const MAX_PICTURE_SIDE = 1600; // pixels on the longest side

/**
 * Turns the address saved in the page text into something an <img> can load.
 * Pictures uploaded in the editor are saved as "/site-content/image/<id>" and
 * are loaded from the backend; full web addresses are used as they are.
 */
export function resolveContentImageUrl(value: string): string | null {
  const url = (value || '').trim();
  if (!url) return null;
  if (url.startsWith('/site-content/image/')) return `${API_BASE_URL}${url}`;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}

/**
 * Checks the chosen file and, when it is large, shrinks it in the browser first
 * (longest side 1600px, JPEG) so the upload is quick and the page loads fast.
 */
export async function preparePictureForUpload(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
    throw new Error('Please choose a JPG, PNG, WEBP or GIF picture.');
  }
  if (file.size > 30 * 1024 * 1024) {
    throw new Error('That picture is too large. Please choose one under 30MB.');
  }

  // Animated GIFs are sent untouched.
  if (file.type === 'image/gif') {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error('The GIF must be smaller than 4MB.');
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This picture could not be read. Please try a different file.');
  }

  const scale = Math.min(1, MAX_PICTURE_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('This picture could not be processed. Please try a different file.');
  }
  ctx.fillStyle = '#ffffff'; // transparent areas become white in a JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
  if (!blob) throw new Error('This picture could not be processed. Please try a different file.');
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error('The picture is still too large. Please choose a smaller one.');

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'picture';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

// Admin only. Returns the address to save in the page text.
export async function uploadSitePicture(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiFetch('/site-content/images', { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to upload the picture');
  return data.url as string;
}