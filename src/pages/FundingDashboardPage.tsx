import React, { useState } from 'react';
import {
  ArrowLeft,
  Wallet,
  Info,
  Plane,
  Briefcase,
  FileText as FileIcon,
  UtensilsCrossed
} from 'lucide-react';

interface FundingDashboardPageProps {
  onBack: () => void;
}

const MOCK_WITHDRAWALS = [
  { date: 'Oct 12, 2024', category: 'Air Tickets', icon: Plane, amount: 'KSh 45,000', status: 'Paid' },
  { date: 'Oct 05, 2024', category: 'Visa Costs', icon: Briefcase, amount: 'KSh 15,000', status: 'Paid' },
  { date: 'Oct 01, 2024', category: 'Passport Registration', icon: FileIcon, amount: 'KSh 6,500', status: 'Processing' }
];

const MOCK_CATEGORY_LIMITS = [
  { label: 'Air Tickets', icon: Plane, used: 75, max: 'KSh 60,000 max' },
  { label: 'Visa Costs', icon: Briefcase, used: 60, max: 'KSh 20,000 max' },
  { label: 'Meals & Transport', icon: UtensilsCrossed, used: 40, max: 'KSh 15,000 / mo' }
];

export const FundingDashboardPage: React.FC<FundingDashboardPageProps> = ({ onBack }) => {
  const [category, setCategory] = useState('Air Tickets');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Preview only — this page is UI-only for now, no request is sent.
  };

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
          <Wallet className="h-3.5 w-3.5 text-[#49769c]" />
          Funding Dashboard
        </span>

        <h1 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-[-0.035em] text-slate-900 sm:text-4xl">
          Track your sponsorship funding.
        </h1>

        <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-black sm:text-[15px]">
          Once funding is approved, eligible relocation costs will be available for disbursement in line with the
          program guidelines.
        </p>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Preview — sample data shown for illustration only
        </span>
      </section>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900">Sponsorship Overview</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Total Funded Amount</p>
                <p className="mt-1 text-xl font-extrabold text-slate-900">
                  KSh 0 <span className="text-xs font-semibold text-slate-400">(sample)</span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1f4e79]">
                  Maximum Fundable Amount
                </p>
                <p className="mt-1 text-xl font-extrabold text-[#1f4e79]">KSh 350,000</p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <Info className="h-4 w-4 text-[#1f4e79] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#1f4e79] leading-5">
                Once funding is approved, eligible expenses may be requested in accordance with program policy.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">Recent Withdrawals</h2>
              <span className="text-xs font-bold text-[#1f4e79]">Sample data</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 border-b border-slate-100">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_WITHDRAWALS.map((w) => {
                    const Icon = w.icon;
                    return (
                      <tr key={w.date + w.category} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4 text-slate-500">{w.date}</td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                            <Icon className="h-3.5 w-3.5 text-[#49769c]" />
                            {w.category}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-slate-800">{w.amount}</td>
                        <td className="py-3">
                          <span
                            className={
                              w.status === 'Paid'
                                ? 'rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase'
                                : 'rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-[10px] font-bold uppercase'
                            }
                          >
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900">Request Funds</h2>
            <p className="mt-1 text-xs text-slate-500">Preview only — requesting funds isn't wired up yet.</p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30"
                >
                  <option>Air Tickets</option>
                  <option>Visa Costs</option>
                  <option>Passport Registration</option>
                  <option>Meals &amp; Transport</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount (KSh)</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Note (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Brief reason..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#102a43] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1f4e79] transition-colors cursor-pointer"
              >
                Submit Request
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Category Limits</h2>
            <div className="mt-4 space-y-4">
              {MOCK_CATEGORY_LIMITS.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                        <Icon className="h-3.5 w-3.5 text-[#49769c]" />
                        {c.label}
                      </span>
                      <span className="font-bold text-slate-800">{c.max}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#1f4e79]" style={{ width: `${c.used}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};