import React, { useState } from 'react';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useSiteContent } from '../../content/useSiteContent';
import { LegalModal, LegalDocKey } from './LegalModal';
import { TabLink, safeUrl } from './PublicBlocks';

const LEGAL_LINKS: { key: LegalDocKey; label: string }[] = [
  { key: 'terms', label: 'Terms of Service' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'diversity', label: 'Diversity & Inclusion' },
  { key: 'accessibility', label: 'Accessibility Statement' },
];

const linkClass =
  'cursor-pointer text-left text-sm text-blue-100 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

interface PublicFooterProps {
  onNavigate: (tab: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { content } = useSiteContent();
  const [openDoc, setOpenDoc] = useState<LegalDocKey | null>(null);
  const footer = content.footer;

  const socials = [
    { label: 'Facebook', url: safeUrl(footer.facebook), Icon: Facebook },
    { label: 'X (Twitter)', url: safeUrl(footer.twitter), Icon: Twitter },
    { label: 'LinkedIn', url: safeUrl(footer.linkedin), Icon: Linkedin },
    { label: 'Instagram', url: safeUrl(footer.instagram), Icon: Instagram },
  ].filter((s) => s.url);

  return (
    <>
      <footer className="bg-[#1f4e79] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg font-extrabold text-[#1f4e79]">
                G
              </span>
              <span className="text-lg font-extrabold tracking-tight">Global Talent Plus</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">{footer.description}</p>
            {socials.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                {socials.map(({ label, url, Icon }) => (
                  <a
                    key={label}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav aria-label="Quick links">
            <h2 className="text-sm font-bold text-white">Quick Links</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <TabLink tab="job_board" onNavigate={onNavigate} className={linkClass}>
                  Open Positions
                </TabLink>
              </li>
              <li>
                <TabLink tab="about" onNavigate={onNavigate} className={linkClass}>
                  About Us
                </TabLink>
              </li>
              <li>
                <TabLink tab="contact" onNavigate={onNavigate} className={linkClass}>
                  Contact Us
                </TabLink>
              </li>
              {!isAuthenticated && (
                <li>
                  <button type="button" onClick={() => openAuthModal()} className={linkClass}>
                    Sign In
                  </button>
                </li>
              )}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="text-sm font-bold text-white">Company</h2>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map(({ key, label }) => (
                <li key={key}>
                  <button type="button" onClick={() => setOpenDoc(key)} className={linkClass}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-6 py-8 text-center">
            <p className="text-2xl font-extrabold tracking-tight">Global Talent Plus</p>
            {footer.tagline && <p className="text-xs font-semibold text-blue-100">{footer.tagline}</p>}
            <p className="mt-4 text-xs text-blue-100">
              &copy; {new Date().getFullYear()} {footer.copyright}
            </p>
          </div>
        </div>
      </footer>

      {openDoc && (
        <LegalModal
          docKey={openDoc}
          doc={content.legal[openDoc]}
          onClose={() => setOpenDoc(null)}
          onBackToOpenPositions={() => {
            setOpenDoc(null);
            onNavigate('job_board');
          }}
        />
      )}
    </>
  );
};