// Upgrades legacy plain-text module notes (blank-line paragraphs, "## " subtitle prefix)
// into the HTML shape the rich editor now saves, so old modules open correctly in the
// new editor with zero database migration.
export const isLegacyPlainNotes = (raw: string): boolean => !!raw && !/<[a-z][\s\S]*>/i.test(raw);

export const legacyMarkdownToHtml = (raw: string): string => {
  if (!raw) return '';
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('## ') ? `<h3>${p.replace(/^##\s*/, '')}</h3>` : `<div>${p.replace(/\n/g, '<br>')}</div>`))
    .join('');
};

export const toEditableNotesHtml = (raw: string | null | undefined): string =>
  !raw ? '' : isLegacyPlainNotes(raw) ? legacyMarkdownToHtml(raw) : raw;

// Table of Contents = every <h3> in the saved HTML (replaces the old "## " line scan).
export const getTocHeadings = (html: string): string[] => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html || '';
  return Array.from(wrapper.querySelectorAll('h3'))
    .map((h) => h.textContent?.trim() || '')
    .filter(Boolean);
};