import React, { useEffect } from 'react';
import {
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Home,
  Plane,
  Ticket,
  Utensils,
  X
} from 'lucide-react';

interface RecruitmentProcessModalProps {
  onClose: () => void;
}

const supportHighlights = [
  { icon: Utensils, label: 'Food allowance' },
  { icon: Home, label: 'Accommodation support' },
  { icon: Ticket, label: 'Visa costs' },
  { icon: Plane, label: 'Flight tickets for relocation roles' }
];

const processSteps = [
  'Complete your online application.',
  'After screening your details, we invite you to an interview.',
  'When you meet the client\'s technical and professional requirements, we present your profile to the client.',
  'If the client accepts you, you join our candidate pool and continue toward placement.'
];

export const RecruitmentProcessModal: React.FC<RecruitmentProcessModalProps> = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="recruitment-process-title"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="bg-[#102a43] px-5 py-6 text-white sm:px-8 sm:py-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recruitment process notice"
            className="absolute right-4 top-4 rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start gap-4 pr-8">
            <div className="rounded-xl bg-amber-300 p-3 text-[#102a43]">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Global Talent Plus</p>
              <h2 id="recruitment-process-title" className="text-xl font-extrabold sm:text-2xl">
                Your pathway to international opportunity
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-200">
                We specialize in connecting qualified professionals with companies that value their employees and invest in their success.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-7">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">What selected opportunities may offer</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Depending on the position and employer, packages may include a competitive salary together with:
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {supportHighlights.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                  <Icon className="h-4 w-4 shrink-0 text-[#1f4e79]" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900">Our selection process</h3>
            <ol className="mt-3 space-y-3">
              {processSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f0f7] text-xs font-extrabold text-[#1f4e79]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <p className="text-sm leading-relaxed text-amber-950">
                To maintain a high success rate, we generally present trained professionals to clients. If you are not yet trained in your field, you may be required to complete a relevant professional training course and obtain a certificate before your profile is sent to a client.
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1f4e79] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#102a43] focus:outline-none focus:ring-2 focus:ring-[#1f4e79] focus:ring-offset-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Continue
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
