import React from 'react';
import { ApplicationStage } from '../types';

interface StatusBadgeProps {
  stage: ApplicationStage | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ stage, size = 'md' }) => {
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (stage) {
    case 'Submitted':
      colorStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Assessment Passed':
      colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      break;
    case 'Assessment Failed':
      colorStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'Screening':
      colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'Technical Interview':
      colorStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
      break;
    case 'Final Interview':
      colorStyle = 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
      break;
    case 'Offer Extended':
      colorStyle = 'bg-teal-50 text-teal-700 border-teal-200 font-bold';
      break;
    case 'Hired':
      colorStyle = 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs';
      break;
    case 'Rejected':
      colorStyle = 'bg-slate-100 text-slate-500 border-slate-200 line-through';
      break;
    default:
      colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full border ${px} ${colorStyle} font-medium transition`}>
      {stage}
    </span>
  );
};
