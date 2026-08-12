import React from 'react';
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Search,
  Users,
  Wallet,
  PlaneTakeoff,
  CheckCircle2,
  Info
} from 'lucide-react';

interface SponsorshipProcessPageProps {
  onBack: () => void;
}

const STEPS = [
  {
    icon: FileText,
    title: '1. Apply for Job',
    description:
      'Browse available roles, upload your professional CV, and answer the initial pre-qualification questions to demonstrate your fit.'
  },
  {
    icon: Search,
    title: '2. Review',
    description:
      'Our recruitment team thoroughly reviews your application to ensure your profile meets the standards of our international partners.'
  },
  {
    icon: Users,
    title: '3. Client Matching',
    description:
      'If accepted, your profile is actively shared and matched with prospective international employers seeking your specific skill set.'
  },
  {
    icon: Wallet,
    title: '4. Funding & Wallet',
    description:
      'Upon client acceptance, eligible relocation costs are tracked through your Funding Dashboard to support your transition.'
  },
  {
    icon: PlaneTakeoff,
    title: '5. Onboarding',
    description:
      'Prepare for travel, complete final documentation, and confidently start your new career on the global stage.'
  }
];

const SPONSORSHIP_ITEMS = [
  { label: 'Visa Costs', note: 'Sponsored' },
  { label: 'Flight Tickets', note: 'Sponsored' },
  { label: 'Passport Application', note: 'Sponsored' },
  { label: 'COVID-19 Tests', note: 'Sponsored' },
  { label: 'Accommodation', note: 'Sponsored' },
  { label: 'Food', note: 'Offered in most positions' }
];

export const SponsorshipProcessPage: React.FC<SponsorshipProcessPageProps> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1f4e79] hover:text-[#102a43] cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Job Board
      </button>

      <section className="relative w-full overflow-hidden rounded-[28px] border border-slate-200 bg-[#f5f8fc] shadow-[0_20px_55px_-38px_rgba(15,23,42,0.45)] px-6 py-8 sm:px-10 sm:py-11">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-900/10 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f4e79] shadow-sm">
          <Briefcase className="h-3.5 w-3.5 text-[#49769c]" />
          Sponsorship Process
        </span>

        <h1 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-[-0.035em] text-slate-900 sm:text-4xl">
          Your path to international success.
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
          We believe in a free and fair recruitment process. Global Talent Plus connects you with international
          opportunities with absolutely <span className="font-bold text-[#1f4e79]">zero placement fees</span>. Your
          talent is your currency.
        </p>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Preview — sample process shown for illustration only
        </span>
      </section>

      <div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">The Journey to Your New Career</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const highlighted = i === STEPS.length - 1;
            return (
              <div
                key={step.title}
                className={
                  highlighted
                    ? 'rounded-2xl p-5 bg-[#102a43] text-white shadow-sm'
                    : 'rounded-2xl p-5 bg-white border border-slate-200 shadow-sm'
                }
              >
                <div
                  className={
                    highlighted
                      ? 'flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white mb-3'
                      : 'flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1f4e79] mb-3'
                  }
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className={highlighted ? 'font-bold text-white' : 'font-bold text-slate-900'}>{step.title}</h3>
                <p
                  className={
                    highlighted
                      ? 'mt-2 text-xs leading-6 text-blue-100'
                      : 'mt-2 text-xs leading-6 text-slate-600'
                  }
                >
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900">The 'World-Class' Sponsorship Package</h2>
          <p className="mt-2 text-xs leading-6 text-slate-600">
            We remove the financial barriers to your international career. Here's what's typically covered when
            you're placed through Global Talent Plus.
          </p>
          <div className="mt-4 divide-y divide-slate-100">
            {SPONSORSHIP_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3">
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1f4e79]">
                  {item.note}
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm h-fit">
          <div className="flex items-start gap-2.5">
            <Info className="h-4.5 w-4.5 text-[#1f4e79] mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Important Note on Certifications</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                External certifications and professional exams are the <span className="font-bold">only</span> items
                not included in our sponsorship package. Exam preparation and success remain part of your own
                professional development journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};