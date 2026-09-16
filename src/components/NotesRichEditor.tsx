import React, { useRef } from 'react';
import { Bold, Italic, Underline, RemoveFormatting } from 'lucide-react';

interface NotesRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TEXT_COLORS: { label: string; value: string }[] = [
  { label: 'Default', value: '#e2e8f0' },
  { label: 'Indigo', value: '#818cf8' },
  { label: 'Amber', value: '#fbbf24' },
  { label: 'Emerald', value: '#34d399' },
  { label: 'Rose', value: '#fb7185' }
];

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' }
];

const FONT_SIZES: { label: string; value: string }[] = [
  { label: 'S', value: '2' },   // document.execCommand('fontSize') uses legacy 1-7 scale
  { label: 'M', value: '3' },
  { label: 'L', value: '5' },
  { label: 'XL', value: '7' }
];
// Whitelist-based paste sanitizer. Keeps bold/italic/underline/headings/lists/paragraph
// structure and text color; drops everything else (fonts, sizes, layout junk, scripts)
// that PDFs/Word tend to bring along. This is what makes a paragraph pasted from a PDF
// land as its own block, matching the source, instead of needing manual clean-up after.
const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'H3', 'P', 'DIV', 'BR', 'UL', 'OL', 'LI', 'SPAN', 'FONT']);

function sanitizeNode(node: ChildNode): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node.cloneNode();
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as HTMLElement;
  if (!ALLOWED_TAGS.has(el.tagName)) {
    const frag = document.createDocumentFragment();
    el.childNodes.forEach((child) => {
      const cleaned = sanitizeNode(child);
      if (cleaned) frag.appendChild(cleaned);
    });
    return frag;
  }
  const clean = document.createElement(el.tagName === 'FONT' ? 'span' : el.tagName.toLowerCase());
  if ((el.tagName === 'SPAN' || el.tagName === 'FONT') && el.style?.color) clean.style.color = el.style.color;
  if ((el.tagName === 'SPAN' || el.tagName === 'FONT') && el.style?.fontFamily) clean.style.fontFamily = el.style.fontFamily;
  if ((el.tagName === 'SPAN' || el.tagName === 'FONT') && el.style?.fontSize) clean.style.fontSize = el.style.fontSize;
  if (el.tagName === 'FONT' && el.getAttribute('face')) clean.style.fontFamily = el.getAttribute('face') || '';
  el.childNodes.forEach((child) => {
    const cleaned = sanitizeNode(child);
    if (cleaned) clean.appendChild(cleaned);
  });
  return clean;
}

function sanitizeHtml(html: string): string {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const out = document.createElement('div');
  wrapper.childNodes.forEach((child) => {
    const cleaned = sanitizeNode(child);
    if (cleaned) out.appendChild(cleaned);
  });
  return out.innerHTML;
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const BULLET_CHARS = ['•', '●', '▪', '‣', '◦'];
const BULLET_PATTERN = new RegExp(`[${BULLET_CHARS.join('')}]`);

function htmlHasBlockStructure(html: string): boolean {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  return wrapper.querySelectorAll('li, h1, h2, h3, h4, h5, h6, p, div').length > 1;
}

function plainTextParagraphsToHtml(raw: string): string {
  const paragraphs = raw
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return paragraphs.map((p) => `<div>${escapeHtml(p)}</div>`).join('');
}

function plainTextToNotesHtml(raw: string): string {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return '';

  if (!BULLET_PATTERN.test(text)) {
    return `<div>${escapeHtml(text)}</div>`;
  }

  const parts = text.split(BULLET_PATTERN).map((p) => p.trim()).filter(Boolean);
  const lead = parts.shift() || '';

  const blocks: string[] = [];
  if (lead) blocks.push(`<h3>${escapeHtml(lead)}</h3>`);

  let currentList: string[] = [];
  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push(`<ul>${currentList.map((li) => `<li>${escapeHtml(li)}</li>`).join('')}</ul>`);
      currentList = [];
    }
  };

  parts.forEach((part) => {
    const lastPeriod = part.lastIndexOf('. ');
    const hasTrailingHeading = lastPeriod > -1 && lastPeriod < part.length - 2;
    const bulletText = hasTrailingHeading ? part.slice(0, lastPeriod + 1).trim() : part;
    const remainder = hasTrailingHeading ? part.slice(lastPeriod + 2).trim() : '';

    if (bulletText) currentList.push(bulletText);

    // A short, period-free tail right after the last sentence reads as the start of the
    // next heading rather than more bullet text — e.g. "...opportunities. Interior Design Collective".
    if (remainder && remainder.length < 80 && !remainder.endsWith('.')) {
      flushList();
      blocks.push(`<h3>${escapeHtml(remainder)}</h3>`);
    }
  });
  flushList();

  return blocks.join('');
}

export const NotesRichEditor: React.FC<NotesRichEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValue = useRef<string>(value);

  if (editorRef.current && lastValue.current !== value && editorRef.current.innerHTML !== value) {
    editorRef.current.innerHTML = value || '';
  }
  lastValue.current = value;

  const emitChange = () => onChange(editorRef.current?.innerHTML || '');

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  };

  const toggleSubtitle = () => {
    editorRef.current?.focus();
    const current = document.queryCommandValue('formatBlock');
    document.execCommand('formatBlock', false, current.toLowerCase() === 'h3' ? 'p' : 'h3');
    emitChange();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');

    if (html && htmlHasBlockStructure(html)) {
      document.execCommand('insertHTML', false, sanitizeHtml(html));
    } else if (BULLET_PATTERN.test(text)) {
      document.execCommand('insertHTML', false, plainTextToNotesHtml(text));
    } else if (/\n\s*\n/.test(text)) {
      document.execCommand('insertHTML', false, plainTextParagraphsToHtml(text));
    } else if (html) {
      document.execCommand('insertHTML', false, sanitizeHtml(html));
    } else {
      document.execCommand('insertHTML', false, plainTextToNotesHtml(text));
    }
    emitChange();
  };

  const isEmpty = !value || value === '<br>' || value.trim() === '';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-800 bg-slate-900 flex-wrap">
        <button type="button" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer">
          <Italic className="h-3.5 w-3.5" />
        </button>
              <button type="button" title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer">
          <Underline className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-1" />
        <select
          title="Font"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { if (e.target.value) exec('fontName', e.target.value); e.target.value = ''; }}
          defaultValue=""
          className="text-[10px] bg-slate-900 text-slate-300 border border-slate-800 rounded-md px-1 py-1 cursor-pointer"
        >
          <option value="" disabled>Font</option>
          {FONT_FAMILIES.filter((f) => f.value).map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
          ))}
        </select>
        <select
          title="Font size"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { if (e.target.value) exec('fontSize', e.target.value); e.target.value = ''; }}
          defaultValue=""
          className="text-[10px] bg-slate-900 text-slate-300 border border-slate-800 rounded-md px-1 py-1 cursor-pointer"
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="w-px h-4 bg-slate-800 mx-1" />
        <button type="button" title="Subtitle — adds to the candidate's Table of Contents" onMouseDown={(e) => e.preventDefault()} onClick={toggleSubtitle} className="px-2 py-1 rounded-md text-[11px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer">
          Subtitle
        </button>
        <div className="w-px h-4 bg-slate-800 mx-1" />
        {TEXT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('foreColor', c.value)}
            className="h-4 w-4 rounded-full border border-slate-700 cursor-pointer"
            style={{ backgroundColor: c.value }}
          />
        ))}
        <div className="w-px h-4 bg-slate-800 mx-1" />
        <button type="button" title="Clear formatting" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('removeFormat')} className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer">
          <RemoveFormatting className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="relative">
        {isEmpty && <span className="pointer-events-none absolute top-2.5 left-3 text-xs text-slate-500">{placeholder}</span>}
        <div
          ref={editorRef}
          contentEditable
          onInput={emitChange}
          onPaste={handlePaste}
          className="w-full p-2.5 text-xs leading-relaxed text-white focus:outline-none overflow-y-auto min-h-[220px] max-h-[420px]"
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
};