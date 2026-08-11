import React, { useState } from 'react';
import { Application, ApplicationStage } from '../types';
import { StatusBadge } from './StatusBadge';
import { X, CheckSquare, Layers, Send } from 'lucide-react';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedApplications: Application[];
  onApplyBulkUpdate: (stage: ApplicationStage) => Promise<void>;
}

const STAGES: ApplicationStage[] = [
  'Submitted',
  'Assessment Passed',
  'Screening',
  'Technical Interview',
  'Final Interview',
  'Offer Extended',
  'Hired',
  'Rejected'
];

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  selectedApplications,
  onApplyBulkUpdate
}) => {
  const [targetStage, setTargetStage] = useState<ApplicationStage>('Technical Interview');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onApplyBulkUpdate(targetStage);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Bulk Status Update</h3>
              <p className="text-xs text-slate-500">Apply pipeline stage updates & send automated emails</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Selected Candidates ({selectedApplications.length})
            </span>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {selectedApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100">
                  <div className="font-medium text-slate-800">
                    {app.candidateName} <span className="text-slate-400 font-normal">({app.candidateLocation})</span>
                  </div>
                  <StatusBadge stage={app.stage} size="sm" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Select Target Pipeline Stage</label>
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map((stg) => (
                <button
                  type="button"
                  key={stg}
                  onClick={() => setTargetStage(stg)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition flex items-center justify-between cursor-pointer ${
                    targetStage === stg
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{stg}</span>
                  {targetStage === stg && <CheckSquare className="h-4 w-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <Send className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Updating status will automatically trigger real-time candidate email notifications & log them in the system archive.</span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Updating...' : `Apply Bulk Change to ${selectedApplications.length} Candidates`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
