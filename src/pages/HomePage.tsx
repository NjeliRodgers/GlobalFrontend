import React from 'react';
import { Sparkles, ChevronDown, Building2, Globe, Layers, Clock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { applyLiveTokens, useLiveJobStats, useSiteContent } from '../content/useSiteContent';
import {
  CARD_HOVER_ON_DARK,
  CtaButtons,
  STAT_THEMES,
  SectionHeading,
  ThemedCard,
  ValueGrid,
  benefitIcon,
  themeAt,
} from '../components/public/PublicBlocks';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

const STAT_ICONS = [Building2, Globe, Layers, Clock];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { content } = useSiteContent();
  const stats = useLiveJobStats();
  const { hero, values, benefits, cta } = content.home;

  const scrollToStats = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('home-stats')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const handleGetStarted = () => {
    if (isAuthenticated) onNavigate('job_board');
    else openAuthModal();
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          backgroundImage:
            'radial-gradient(52rem 26rem at 82% 8%, rgba(91,139,181,0.38), transparent 70%), linear-gradient(135deg, #1f4e79 0%, #102a43 100%)',
        }}
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-32 pt-20 text-center sm:pb-36 sm:pt-28">
          {hero.badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-50">
              <Sparkles className="h-3.5 w-3.5 text-blue-200" aria-hidden="true" />
              {hero.badge}
            </span>
          )}

          <h1 className="mt-7 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block">{hero.titleLine1}</span>
            <span className="block text-[#9cc4e8]">{hero.titleLine2}</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg sm:leading-8">{hero.subtitle}</p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('job_board')}
              className="cursor-pointer rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#1f4e79] shadow-lg transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {hero.primaryCta}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="cursor-pointer rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {hero.secondaryCta}
            </button>
          </div>

          <button
            type="button"
            onClick={scrollToStats}
            className="mt-14 flex cursor-pointer flex-col items-center gap-1 text-xs font-semibold text-blue-100 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {hero.scrollLabel}
            <ChevronDown className="h-4 w-4 motion-safe:animate-bounce" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Live numbers and values share one pale background */}
      <div className="flow-root bg-[#f5f8fc]">
        <section id="home-stats" className="relative z-10 -mt-16 scroll-mt-24 px-6 pb-16">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
            {content.home.stats.map((stat, index) => {
              const Icon = STAT_ICONS[index % STAT_ICONS.length];
              const theme = themeAt(STAT_THEMES, index);
              return (
                <ThemedCard
                  key={`${stat.label}-${index}`}
                  theme={theme}
                  className="p-6 text-center shadow-lg shadow-slate-900/5"
                >
                  <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${theme.icon}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#102a43]">
                    {applyLiveTokens(stat.value, stats)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</p>
                </ThemedCard>
              );
            })}
          </div>
        </section>

        {/* Values */}
        <section className="px-6 pb-20 pt-4">
          <SectionHeading eyebrow={values.eyebrow} title={values.title} subtitle={values.subtitle} />
          <ValueGrid items={values.items} />
        </section>
      </div>

      {/* Benefits */}
      <section className="bg-gradient-to-br from-[#1f4e79] to-[#102a43] px-6 py-20">
        <SectionHeading eyebrow={benefits.eyebrow} title={benefits.title} subtitle={benefits.subtitle} tone="dark" />
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          {benefits.items.map((item, index) => {
            const Icon = benefitIcon(index);
            return (
              <div
                key={`${item.title}-${index}`}
                className={`rounded-2xl border border-white/15 bg-white/10 p-6 ${CARD_HOVER_ON_DARK}`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-[#9cc4e8]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-blue-100">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-white px-6 py-20">
        <div
          className="mx-auto max-w-4xl rounded-3xl px-6 py-14 text-center text-white shadow-xl shadow-[#102a43]/20 sm:px-14"
          style={{ backgroundImage: 'linear-gradient(135deg, #1f4e79 0%, #102a43 100%)' }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{cta.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-blue-100">{cta.subtitle}</p>
          <CtaButtons
            primaryLabel={cta.primaryCta}
            secondaryLabel={cta.secondaryCta}
            onPrimary={handleGetStarted}
            onSecondary={() => onNavigate('job_board')}
          />
        </div>
      </section>
    </div>
  );
};