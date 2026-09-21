import React from 'react';
import {
  Lightbulb,
  Globe,
  Leaf,
  Award,
  Users,
  Target,
  Heart,
  GraduationCap,
  Route,
  Briefcase,
  Wallet,
  LifeBuoy,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react';
import type { TitledItem } from '../../content/siteContentDefaults';

export const BLUE = '#1f4e79';
export const BLUE_DEEP = '#102a43';

// Hover effect for the small cards: the card lifts slightly and glows blue.
export const CARD_HOVER =
  'transition duration-200 ease-out hover:-translate-y-1.5 hover:border-[#1f4e79] hover:shadow-[0_14px_32px_-10px] hover:shadow-[#1f4e79]/60 hover:ring-4 hover:ring-[#1f4e79]/15 motion-reduce:transition-none motion-reduce:hover:translate-y-0';

// Same idea for cards that sit on the dark blue background (lighter glow).
export const CARD_HOVER_ON_DARK =
  'transition duration-200 ease-out hover:-translate-y-1.5 hover:border-[#9cc4e8] hover:bg-white/15 hover:shadow-[0_14px_32px_-10px] hover:shadow-[#9cc4e8]/60 hover:ring-4 hover:ring-[#9cc4e8]/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0';

/** Only allow normal web links or site-relative paths in admin editable URLs. */
export function safeUrl(url: string): string | null {
  const value = (url || '').trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return null;
}

/**
 * A real link (right click, open in new tab and copy link all work) that
 * switches tabs inside the app without reloading the page.
 */
export const TabLink: React.FC<{
  tab: string;
  onNavigate: (tab: string) => void;
  className?: string;
  children: React.ReactNode;
}> = ({ tab, onNavigate, className, children }) => (
  <a
    href={`#/${tab}`}
    className={className}
    onClick={(e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      onNavigate(tab);
    }}
  >
    {children}
  </a>
);

// ---- Card colour themes ------------------------------------------------------
// Every theme stays inside the blue family. The small cards pick one by position
// so neighbouring cards look different, and the choice suits the meaning of the
// starting text (for example a blue-green for Sustainability).
export interface CardTheme {
  /** border and background classes for the card */
  card: string;
  /** background and text classes for the icon tile */
  icon: string;
  /** colour of the soft corner circle */
  accent: string;
}

const THEMES = {
  steel: {
    card: 'border-[#b9d0e8] bg-gradient-to-br from-[#eaf2fa] to-[#d3e3f3]',
    icon: 'bg-[#1f4e79] text-white',
    accent: '#1f4e79',
  },
  sky: {
    card: 'border-[#a8d4f0] bg-gradient-to-br from-[#e7f5fd] to-[#cbe8f9]',
    icon: 'bg-[#2a7fb9] text-white',
    accent: '#2a7fb9',
  },
  ocean: {
    card: 'border-[#a9c8ee] bg-gradient-to-br from-[#e6effc] to-[#c9dcf6]',
    icon: 'bg-[#2c62b4] text-white',
    accent: '#2c62b4',
  },
  teal: {
    card: 'border-[#9dd7dd] bg-gradient-to-br from-[#e4f5f6] to-[#c5eaed]',
    icon: 'bg-[#1c7f8e] text-white',
    accent: '#1c7f8e',
  },
  indigo: {
    card: 'border-[#b8c2ee] bg-gradient-to-br from-[#eceffc] to-[#d6dcf6]',
    icon: 'bg-[#4655a8] text-white',
    accent: '#4655a8',
  },
  navy: {
    card: 'border-[#96b1cf] bg-gradient-to-br from-[#e0e9f3] to-[#bfd0e4]',
    icon: 'bg-[#102a43] text-white',
    accent: '#102a43',
  },
  cornflower: {
    card: 'border-[#b1c4f2] bg-gradient-to-br from-[#e9eefd] to-[#cfdafa]',
    icon: 'bg-[#3a62c8] text-white',
    accent: '#3a62c8',
  },
};

// Default order of the values: Innovation, Global Mindset, Sustainability,
// Credibility, Collaboration, Value Creation, Customer Obsession.
export const VALUE_THEMES: CardTheme[] = [
  THEMES.sky,
  THEMES.ocean,
  THEMES.teal,
  THEMES.navy,
  THEMES.indigo,
  THEMES.steel,
  THEMES.cornflower,
];

// Number cards: positions, countries, categories, work types.
export const STAT_THEMES: CardTheme[] = [THEMES.steel, THEMES.ocean, THEMES.teal, THEMES.indigo];

// Vision, mission, purpose.
export const PILLAR_THEMES: CardTheme[] = [THEMES.sky, THEMES.navy, THEMES.indigo];

export const themeAt = (themes: CardTheme[], index: number): CardTheme => themes[index % themes.length];

/** A tinted card with a soft corner circle, the blue hover glow and a lift. */
export const ThemedCard: React.FC<{ theme: CardTheme; className?: string; children: React.ReactNode }> = ({
  theme,
  className = '',
  children,
}) => (
  <div className={`relative overflow-hidden rounded-2xl border ${theme.card} ${CARD_HOVER} ${className}`}>
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.14]"
      style={{ backgroundColor: theme.accent }}
    />
    <div className="relative">{children}</div>
  </div>
);

const VALUE_ICONS: LucideIcon[] = [Lightbulb, Globe, Leaf, Award, Users, Target, Heart];
const BENEFIT_ICONS: LucideIcon[] = [Globe, GraduationCap, Route, Briefcase, Wallet, LifeBuoy];

export const valueIcon = (index: number): LucideIcon => VALUE_ICONS[index % VALUE_ICONS.length] || BadgeCheck;
export const benefitIcon = (index: number): LucideIcon => BENEFIT_ICONS[index % BENEFIT_ICONS.length] || BadgeCheck;

export const SectionHeading: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: 'light' | 'dark';
}> = ({ eyebrow, title, subtitle, tone = 'light' }) => {
  const dark = tone === 'dark';
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <span
          className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${
            dark ? 'border-white/20 bg-white/10 text-blue-100' : 'border-blue-100 bg-blue-50 text-[#1f4e79]'
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl ${dark ? 'text-white' : 'text-[#102a43]'}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-7 ${dark ? 'text-blue-100' : 'text-slate-600'}`}>{subtitle}</p>
      )}
    </div>
  );
};

/** Seven value cards laid out 4 + 3 on wide screens, like the reference design. */
export const ValueGrid: React.FC<{ items: TitledItem[] }> = ({ items }) => (
  <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {items.map((item, index) => {
      const Icon = valueIcon(index);
      const theme = themeAt(VALUE_THEMES, index);
      return (
        <ThemedCard key={`${item.title}-${index}`} theme={theme} className="p-6 shadow-sm">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${theme.icon}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-[#102a43]">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
        </ThemedCard>
      );
    })}
  </div>
);

export const CtaButtons: React.FC<{
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}> = ({ primaryLabel, secondaryLabel, onPrimary, onSecondary }) => (
  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
    {primaryLabel && (
      <button
        type="button"
        onClick={onPrimary}
        className="cursor-pointer rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#1f4e79] shadow-md transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {primaryLabel}
      </button>
    )}
    {secondaryLabel && (
      <button
        type="button"
        onClick={onSecondary}
        className="cursor-pointer rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {secondaryLabel}
      </button>
    )}
  </div>
);