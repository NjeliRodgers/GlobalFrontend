import React from 'react';
import { Globe, Lightbulb, Target, Award, Building2, Layers, Clock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { resolveContentImageUrl } from '../api/siteContentApi';
import { applyLiveTokens, useLiveJobStats, useSiteContent } from '../content/useSiteContent';
import {
  CtaButtons,
  PILLAR_THEMES,
  STAT_THEMES,
  SectionHeading,
  ThemedCard,
  ValueGrid,
  themeAt,
} from '../components/public/PublicBlocks';

interface AboutUsPageProps {
  onNavigate: (tab: string) => void;
}

const ACHIEVEMENT_ICONS = [Building2, Globe, Layers, Clock];

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { content } = useSiteContent();
  const stats = useLiveJobStats();
  const about = content.about;
  const imageUrl = resolveContentImageUrl(about.story.imageUrl);

  const pillars = [
    { data: about.vision, Icon: Lightbulb },
    { data: about.mission, Icon: Target },
    { data: about.purpose, Icon: Award },
  ];

  const handleSecondary = () => {
    if (isAuthenticated) onNavigate('job_board');
    else openAuthModal();
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="text-white"
        style={{ backgroundImage: 'linear-gradient(135deg, #1f4e79 0%, #102a43 100%)' }}
      >
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {about.hero.title} <span className="text-[#9cc4e8]">{about.hero.highlight}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg sm:leading-8">
            {about.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#102a43]">{about.story.heading}</h2>
            <div className="mt-6 max-w-prose space-y-5 text-base leading-7 text-slate-600">
              {about.story.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="relative pb-8 pr-4 lg:pr-8">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-72 w-full rounded-2xl object-cover shadow-xl shadow-slate-900/10 sm:h-96"
              />
            ) : (
              <div
                className="flex h-72 w-full items-center justify-center rounded-2xl shadow-xl shadow-slate-900/10 sm:h-96"
                style={{
                  backgroundImage:
                    'radial-gradient(28rem 16rem at 80% 10%, rgba(91,139,181,0.45), transparent 70%), linear-gradient(135deg, #1f4e79 0%, #102a43 100%)',
                }}
                aria-hidden="true"
              >
                <Globe className="h-24 w-24 text-white/30" strokeWidth={1.25} />
              </div>
            )}
            {(about.story.badgeValue || about.story.badgeLabel) && (
              <div className="absolute bottom-0 right-0 rounded-2xl bg-[#1f4e79] px-6 py-4 text-white shadow-lg">
                <p className="text-3xl font-extrabold leading-none">{about.story.badgeValue}</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">{about.story.badgeLabel}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="bg-[#f5f8fc] px-6 py-20">
        <SectionHeading title={about.achievements.title} subtitle={about.achievements.subtitle} />
        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {about.achievements.items.map((item, index) => {
            const Icon = ACHIEVEMENT_ICONS[index % ACHIEVEMENT_ICONS.length];
            const theme = themeAt(STAT_THEMES, index);
            return (
              <ThemedCard key={`${item.label}-${index}`} theme={theme} className="p-6 text-center shadow-sm">
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${theme.icon}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#102a43]">
                  {applyLiveTokens(item.value, stats)}
                </p>
                <p className="mt-1 text-sm font-bold text-[#1f4e79]">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
              </ThemedCard>
            );
          })}
        </div>
      </section>

      {/* Values */}
      <section className="bg-white px-6 py-20">
        <SectionHeading title={about.values.title} subtitle={about.values.subtitle} />
        <ValueGrid items={about.values.items} />
      </section>

      {/* Vision, mission, purpose */}
      <section className="bg-[#f5f8fc] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {pillars.map(({ data, Icon }, index) => {
            const theme = themeAt(PILLAR_THEMES, index);
            return (
              <ThemedCard key={data.title} theme={theme} className="p-7">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${theme.icon}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-[#102a43]">{data.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{data.text}</p>
              </ThemedCard>
            );
          })}
        </div>
      </section>

      {/* Call to action */}
      <section
        className="px-6 py-16 text-center text-white"
        style={{ backgroundImage: 'linear-gradient(135deg, #1f4e79 0%, #102a43 100%)' }}
      >
        <h2 className="text-3xl font-extrabold tracking-tight">{about.cta.title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-blue-100">{about.cta.subtitle}</p>
        <CtaButtons
          primaryLabel={about.cta.primaryCta}
          secondaryLabel={about.cta.secondaryCta}
          onPrimary={() => onNavigate('job_board')}
          onSecondary={handleSecondary}
        />
      </section>
    </div>
  );
};