import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Users, Eye, X, ArrowLeft, type LucideIcon } from 'lucide-react';
import type { LegalDoc } from '../../content/siteContentDefaults';

export type LegalDocKey = 'terms' | 'privacy' | 'diversity' | 'accessibility';

const DOC_ICONS: Record<LegalDocKey, LucideIcon> = {
  terms: ShieldCheck,
  privacy: Lock,
  diversity: Users,
  accessibility: Eye,
};

type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

// "## Heading", "- bullet" and blank-line separated paragraphs.
function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: 'list', items: list });
    list = [];
  };

  for (const rawLine of (body || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
    } else if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: line.slice(3).trim() });
    } else if (line.startsWith('- ')) {
      flushParagraph();
      list.push(line.slice(2).trim());
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

interface LegalModalProps {
  docKey: LegalDocKey;
  doc: LegalDoc;
  onClose: () => void;
  onBackToOpenPositions: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ docKey, doc, onClose, onBackToOpenPositions }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const Icon = DOC_ICONS[docKey];
  const blocks = parseBody(doc.body);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 bg-[#1f4e79] px-6 py-5 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-xl font-extrabold tracking-tight">
                {doc.title}
              </h2>
              {doc.subtitle && <p className="mt-1 text-sm text-blue-100">{doc.subtitle}</p>}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1.5 text-blue-100 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {doc.lastUpdated && (
            <p className="mb-4 text-xs font-semibold text-slate-500">Last updated: {doc.lastUpdated}</p>
          )}
          <div className="space-y-3 text-sm leading-6 text-slate-700">
            {blocks.map((block, index) => {
              if (block.type === 'heading') {
                return (
                  <h3 key={index} className="pt-3 text-base font-bold text-[#102a43]">
                    {block.text}
                  </h3>
                );
              }
              if (block.type === 'list') {
                return (
                  <ul key={index} className="list-disc space-y-1.5 pl-5 marker:text-[#1f4e79]">
                    {block.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={index}>{block.text}</p>;
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onBackToOpenPositions}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1f4e79] px-5 py-2 text-xs font-semibold tracking-wide text-white shadow-xs transition hover:bg-[#102a43]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Open Positions
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200/60 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};