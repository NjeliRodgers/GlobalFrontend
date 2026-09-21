import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ImagePlus,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  CircleCheck,
  CircleAlert,
} from 'lucide-react';
import {
  fetchSiteContent,
  preparePictureForUpload,
  resetSiteContentPage,
  resolveContentImageUrl,
  saveSiteContentPage,
  uploadSitePicture,
} from '../api/siteContentApi';
import { refreshSiteContent } from '../content/useSiteContent';
import {
  buildSiteContent,
  DEFAULT_SITE_CONTENT,
  SiteContent,
  SiteContentPageKey,
} from '../content/siteContentDefaults';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

type Path = (string | number)[];

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function getPath(obj: any, path: Path): any {
  return path.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function setPath<T>(obj: T, path: Path, value: unknown): T {
  const next: any = clone(obj);
  let cursor = next;
  for (let i = 0; i < path.length - 1; i += 1) cursor = cursor[path[i]];
  cursor[path[path.length - 1]] = value;
  return next;
}

interface EditorContextValue {
  draft: any;
  setValue: (path: Path, value: unknown) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);
const useEditor = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('Editor components must be used inside an editor');
  return ctx;
};

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1f4e79] focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/20';

// ---------------------------------------------------------------------------
// Form building blocks
// ---------------------------------------------------------------------------

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
    <h2 className="text-base font-bold text-[#102a43]">{title}</h2>
    {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    <div className="mt-5 space-y-4">{children}</div>
  </section>
);

const FieldShell: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
  </label>
);

const TextField: React.FC<{ label: string; path: Path; hint?: string; placeholder?: string }> = ({
  label,
  path,
  hint,
  placeholder,
}) => {
  const { draft, setValue } = useEditor();
  return (
    <FieldShell label={label} hint={hint}>
      <input
        type="text"
        className={inputClass}
        value={getPath(draft, path) ?? ''}
        placeholder={placeholder}
        onChange={(e) => setValue(path, e.target.value)}
      />
    </FieldShell>
  );
};

const AreaField: React.FC<{ label: string; path: Path; rows?: number; hint?: string }> = ({
  label,
  path,
  rows = 3,
  hint,
}) => {
  const { draft, setValue } = useEditor();
  return (
    <FieldShell label={label} hint={hint}>
      <textarea
        className={`${inputClass} resize-y leading-6`}
        rows={rows}
        value={getPath(draft, path) ?? ''}
        onChange={(e) => setValue(path, e.target.value)}
      />
    </FieldShell>
  );
};

/**
 * Upload box for a picture. The picture is uploaded straight away, and its
 * address goes into the page text, which is published when Save changes is used.
 */
const PictureField: React.FC<{ label: string; path: Path; hint?: string }> = ({ label, path, hint }) => {
  const { draft, setValue } = useEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const value: string = getPath(draft, path) ?? '';
  const previewUrl = resolveContentImageUrl(value);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allows choosing the same file again later
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const prepared = await preparePictureForUpload(file);
      const url = await uploadSitePicture(prepared);
      setValue(path, url);
    } catch (err: any) {
      setError(err?.message || 'Could not upload the picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center">
        <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white sm:w-48">
          {previewUrl ? (
            <img src={previewUrl} alt="Current picture" className="h-full w-full object-cover" />
          ) : (
            <span className="px-3 text-center text-xs font-medium text-slate-500">
              No picture yet. The blue globe panel is shown instead.
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFile}
              aria-label={label}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1f4e79] px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-xs transition hover:bg-[#102a43] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <ImagePlus className="h-4 w-4" />
              {uploading ? 'Uploading...' : value ? 'Change picture' : 'Upload picture'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setValue(path, '');
                }}
                disabled={uploading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove picture
              </button>
            )}
          </div>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
          {error && (
            <p role="alert" className="text-xs font-semibold text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface ListFieldDef {
  key: string;
  label: string;
  multiline?: boolean;
  hint?: string;
}

/**
 * Editable list of cards (values, benefits, stats and so on) with add, remove
 * and reorder controls. Pass fields=[] and stringItems for a list of plain text.
 */
const ListEditor: React.FC<{
  path: Path;
  itemLabel: string;
  fields: ListFieldDef[];
  template: any;
  stringItems?: boolean;
  addLabel?: string;
}> = ({ path, itemLabel, fields, template, stringItems = false, addLabel }) => {
  const { draft, setValue } = useEditor();
  const items: any[] = getPath(draft, path) || [];

  const commit = (next: any[]) => setValue(path, next);
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };
  const remove = (index: number) => commit(items.filter((_, i) => i !== index));
  const update = (index: number, key: string | null, value: string) =>
    commit(items.map((item, i) => (i !== index ? item : key === null ? value : { ...item, [key]: value })));

  const iconButton =
    'cursor-pointer rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          Nothing here yet. Use the button below to add the first {itemLabel.toLowerCase()}.
        </p>
      )}
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {itemLabel} {index + 1}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className={iconButton}
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} up`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} down`}
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`${iconButton} hover:!bg-red-50 hover:!text-red-600`}
                onClick={() => remove(index)}
                aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {stringItems ? (
            <textarea
              className={`${inputClass} resize-y leading-6`}
              rows={4}
              value={item}
              onChange={(e) => update(index, null, e.target.value)}
            />
          ) : (
            <div className="space-y-3">
              {fields.map((field) => (
                <FieldShell key={field.key} label={field.label} hint={field.hint}>
                  {field.multiline ? (
                    <textarea
                      className={`${inputClass} resize-y leading-6`}
                      rows={2}
                      value={item[field.key] ?? ''}
                      onChange={(e) => update(index, field.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className={inputClass}
                      value={item[field.key] ?? ''}
                      onChange={(e) => update(index, field.key, e.target.value)}
                    />
                  )}
                </FieldShell>
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => commit([...items, clone(template)])}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1f4e79]/30 bg-white px-4 py-2 text-xs font-semibold text-[#1f4e79] transition hover:bg-blue-50"
      >
        <Plus className="h-4 w-4" />
        {addLabel || `Add ${itemLabel.toLowerCase()}`}
      </button>
    </div>
  );
};

const CtaSection: React.FC<{ base: string; description?: string }> = ({ base, description }) => (
  <Section title="Call to action banner" description={description}>
    <TextField label="Heading" path={[base, 'title']} />
    <AreaField label="Text under the heading" path={[base, 'subtitle']} />
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="First button label" path={[base, 'primaryCta']} />
      <TextField label="Second button label" path={[base, 'secondaryCta']} />
    </div>
  </Section>
);

const LIVE_HINT =
  'Tip: type {{openPositions}}, {{countries}}, {{categories}} or {{workTypes}} to show a live number from your job listings, or type your own figure such as 500+.';

// ---------------------------------------------------------------------------
// Page editors
// ---------------------------------------------------------------------------

const HomeEditor: React.FC = () => (
  <div className="space-y-5">
    <Section title="Hero" description="The large banner at the top of the Home page.">
      <TextField label="Small badge above the heading" path={['hero', 'badge']} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Heading, first line" path={['hero', 'titleLine1']} />
        <TextField label="Heading, second line (highlighted)" path={['hero', 'titleLine2']} />
      </div>
      <AreaField label="Paragraph under the heading" path={['hero', 'subtitle']} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="First button label" path={['hero', 'primaryCta']} hint="Opens the Opportunities page." />
        <TextField label="Second button label" path={['hero', 'secondaryCta']} hint="Opens the About Us page." />
        <TextField label="Scroll hint" path={['hero', 'scrollLabel']} />
      </div>
    </Section>

    <Section title="Number cards" description="The four cards shown just below the hero.">
      <ListEditor
        path={['stats']}
        itemLabel="Card"
        template={{ value: '', label: '' }}
        fields={[
          { key: 'value', label: 'Number', hint: LIVE_HINT },
          { key: 'label', label: 'Label' },
        ]}
      />
    </Section>

    <Section title="Values section">
      <TextField label="Small badge" path={['values', 'eyebrow']} />
      <TextField label="Heading" path={['values', 'title']} />
      <AreaField label="Text under the heading" path={['values', 'subtitle']} />
      <ListEditor
        path={['values', 'items']}
        itemLabel="Value"
        template={{ title: '', description: '' }}
        fields={[
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description', multiline: true },
        ]}
      />
    </Section>

    <Section title="Benefits section">
      <TextField label="Small badge" path={['benefits', 'eyebrow']} />
      <TextField label="Heading" path={['benefits', 'title']} />
      <AreaField label="Text under the heading" path={['benefits', 'subtitle']} />
      <ListEditor
        path={['benefits', 'items']}
        itemLabel="Benefit"
        template={{ title: '', description: '' }}
        fields={[
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description', multiline: true },
        ]}
      />
    </Section>

    <CtaSection
      base="cta"
      description="The blue banner at the bottom of the Home page. The first button opens the sign in and register window; the second opens the Opportunities page."
    />
  </div>
);

const AboutEditor: React.FC = () => (
  <div className="space-y-5">
    <Section title="Hero" description="The banner at the top of the About Us page.">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Heading" path={['hero', 'title']} />
        <TextField label="Highlighted part of the heading" path={['hero', 'highlight']} />
      </div>
      <AreaField label="Paragraph under the heading" path={['hero', 'subtitle']} />
    </Section>

    <Section title="Our story">
      <TextField label="Heading" path={['story', 'heading']} />
      <ListEditor path={['story', 'paragraphs']} itemLabel="Paragraph" fields={[]} template="" stringItems />
      <PictureField
        label="Picture next to the story"
        path={['story', 'imageUrl']}
        hint="JPG, PNG, WEBP or GIF. A landscape picture about 1200 x 900 pixels works best. Large pictures are shrunk automatically. Press Save changes to publish it."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Badge on the picture, big text" path={['story', 'badgeValue']} />
        <TextField label="Badge on the picture, small text" path={['story', 'badgeLabel']} />
      </div>
    </Section>

    <Section title="Achievements">
      <TextField label="Heading" path={['achievements', 'title']} />
      <AreaField label="Text under the heading" path={['achievements', 'subtitle']} />
      <ListEditor
        path={['achievements', 'items']}
        itemLabel="Achievement"
        template={{ value: '', label: '', description: '' }}
        fields={[
          { key: 'value', label: 'Number', hint: LIVE_HINT },
          { key: 'label', label: 'Label' },
          { key: 'description', label: 'Description', multiline: true },
        ]}
      />
    </Section>

    <Section title="Values">
      <TextField label="Heading" path={['values', 'title']} />
      <AreaField label="Text under the heading" path={['values', 'subtitle']} />
      <ListEditor
        path={['values', 'items']}
        itemLabel="Value"
        template={{ title: '', description: '' }}
        fields={[
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description', multiline: true },
        ]}
      />
    </Section>

    <Section title="Vision, mission and purpose">
      {(['vision', 'mission', 'purpose'] as const).map((key) => (
        <div key={key} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <TextField label="Card title" path={[key, 'title']} />
          <AreaField label="Card text" path={[key, 'text']} />
        </div>
      ))}
    </Section>

    <CtaSection
      base="cta"
      description="The blue banner at the bottom of the About Us page. The first button opens the Opportunities page; the second opens the sign in and register window."
    />
  </div>
);

const FooterEditor: React.FC = () => (
  <div className="space-y-5">
    <Section
      title="Footer text"
      description="The footer appears at the bottom of every public page for visitors who have not signed in. Its links (Open Positions, About Us, Sign In and the four legal pop-ups) are fixed."
    >
      <AreaField label="Short description next to the logo" path={['description']} />
      <TextField label="Tagline under the large name" path={['tagline']} />
      <TextField
        label="Copyright text"
        path={['copyright']}
        hint="The current year is added in front automatically, for example 2026 Global Talent Plus. All rights reserved."
      />
    </Section>

    <Section
      title="Social media links"
      description="Paste the full address of each page (starting with https://). Icons for empty links are hidden."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Facebook" path={['facebook']} placeholder="https://facebook.com/..." />
        <TextField label="X (Twitter)" path={['twitter']} placeholder="https://x.com/..." />
        <TextField label="LinkedIn" path={['linkedin']} placeholder="https://linkedin.com/company/..." />
        <TextField label="Instagram" path={['instagram']} placeholder="https://instagram.com/..." />
      </div>
    </Section>
  </div>
);

const LEGAL_TABS: { key: 'terms' | 'privacy' | 'diversity' | 'accessibility'; label: string }[] = [
  { key: 'terms', label: 'Terms of Service' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'diversity', label: 'Diversity & Inclusion' },
  { key: 'accessibility', label: 'Accessibility Statement' },
];

const LegalEditor: React.FC = () => {
  const [active, setActive] = useState<(typeof LEGAL_TABS)[number]['key']>('terms');
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Legal pop-ups">
        {LEGAL_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              active === tab.key ? 'bg-blue-50 text-[#1f4e79] ring-1 ring-[#1f4e79]/30' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Section
        title="Pop-up content"
        description="This text appears in the pop-up card that opens from the footer link. Visitors also get a Back to Open Positions button."
      >
        <TextField label="Title" path={[active, 'title']} />
        <TextField label="Text under the title" path={[active, 'subtitle']} />
        <TextField label="Last updated" path={[active, 'lastUpdated']} placeholder="March 2, 2017" />
        <AreaField
          label="Body"
          path={[active, 'body']}
          rows={22}
          hint="Formatting: start a line with ## for a heading, start a line with - for a bullet point, and leave a blank line between paragraphs."
        />
      </Section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

const PAGE_TABS: { key: SiteContentPageKey; label: string; previewTab: string | null }[] = [
  { key: 'home', label: 'Home', previewTab: 'home' },
  { key: 'about', label: 'About Us', previewTab: 'about' },
  { key: 'footer', label: 'Footer', previewTab: 'home' },
  { key: 'legal', label: 'Legal pop-ups', previewTab: 'home' },
];

export const SiteContentAdminPage: React.FC = () => {
  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [activePage, setActivePage] = useState<SiteContentPageKey>('home');
  const [busy, setBusy] = useState<'save' | 'reset' | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetchSiteContent().then((stored) => {
      if (!active) return;
      const merged = buildSiteContent(stored);
      setSaved(merged);
      setDraft(clone(merged));
    });
    return () => {
      active = false;
    };
  }, []);

  const dirty = useMemo(
    () => (saved && draft ? JSON.stringify(saved[activePage]) !== JSON.stringify(draft[activePage]) : false),
    [saved, draft, activePage]
  );

  if (!draft || !saved) {
    return <div className="py-16 text-center text-sm font-medium text-slate-500">Loading public page content...</div>;
  }

  const editorValue: EditorContextValue = {
    draft: draft[activePage],
    setValue: (path, value) => {
      setNotice(null);
      setDraft((current) => (current ? { ...current, [activePage]: setPath(current[activePage], path, value) } : current));
    },
  };

  const handleSave = async () => {
    setBusy('save');
    setNotice(null);
    try {
      await saveSiteContentPage(activePage, draft[activePage]);
      setSaved((current) => (current ? { ...current, [activePage]: clone(draft[activePage]) } : current));
      await refreshSiteContent();
      setNotice({ type: 'success', text: 'Saved. Your changes are now live on the public site.' });
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Could not save your changes. Please try again.' });
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    const label = PAGE_TABS.find((t) => t.key === activePage)?.label;
    if (!window.confirm(`Reset "${label}" to the original text? Your saved changes for this page will be removed.`)) return;
    setBusy('reset');
    setNotice(null);
    try {
      await resetSiteContentPage(activePage);
      const original = clone(DEFAULT_SITE_CONTENT[activePage]);
      setSaved((current) => (current ? { ...current, [activePage]: clone(original) } : current));
      setDraft((current) => (current ? { ...current, [activePage]: original } : current));
      await refreshSiteContent();
      setNotice({ type: 'success', text: 'This page is back to its original text.' });
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Could not reset this page. Please try again.' });
    } finally {
      setBusy(null);
    }
  };

  const handlePreview = () => {
    const previewTab = PAGE_TABS.find((t) => t.key === activePage)?.previewTab || 'home';
    window.open(`${window.location.origin}${window.location.pathname}#/${previewTab}`, '_blank', 'noopener');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#102a43]">Public Pages Editor</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Edit the pages that visitors see before they sign in. The Opportunities page shows your live job listings and is
          not edited here. Save a page to publish your changes straight away.
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-1 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Pages">
            {PAGE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activePage === tab.key}
                onClick={() => {
                  setActivePage(tab.key);
                  setNotice(null);
                }}
                className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activePage === tab.key
                    ? 'bg-[#1f4e79] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dirty && <span className="text-xs font-semibold text-amber-700">Unsaved changes</span>}
            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              title="Opens the public page in a new browser tab. Save first to see your latest edits."
            >
              <ExternalLink className="h-4 w-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={busy !== null}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to original
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || busy !== null}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1f4e79] px-5 py-2 text-xs font-semibold tracking-wide text-white shadow-xs transition hover:bg-[#102a43] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save className="h-4 w-4" />
              {busy === 'save' ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        {notice && (
          <p
            role="status"
            className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
              notice.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {notice.type === 'success' ? <CircleCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
            {notice.text}
          </p>
        )}
      </div>

      <EditorContext.Provider value={editorValue}>
        {activePage === 'home' && <HomeEditor />}
        {activePage === 'about' && <AboutEditor />}
        {activePage === 'footer' && <FooterEditor />}
        {activePage === 'legal' && <LegalEditor />}
      </EditorContext.Provider>
    </div>
  );
};