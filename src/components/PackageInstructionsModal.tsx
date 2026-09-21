import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { ApexPackage, ApexPackageInstructions } from '../types';

interface Props {
  pkg: ApexPackage;
  onClose: () => void;
  onSave: (updated: ApexPackage) => void | Promise<void>;
}

export default function PackageInstructionsModal({ pkg, onClose, onSave }: Props) {
  const [form, setForm] = useState<ApexPackageInstructions>({
    whatItCarries: pkg.instructions?.whatItCarries || '',
    whyStudyIt: pkg.instructions?.whyStudyIt || '',
    whyCertificateMatters: pkg.instructions?.whyCertificateMatters || '',
    howToCompleteSteps: pkg.instructions?.howToCompleteSteps?.length
      ? pkg.instructions.howToCompleteSteps
      : [],
    confidentialityNote: pkg.instructions?.confidentialityNote || '',
    examIntro: pkg.instructions?.examIntro || '',
    courseIntro: pkg.instructions?.courseIntro || '',
    interviewIntro: pkg.instructions?.interviewIntro || ''
  });
  const [stepsText, setStepsText] = useState(
    (pkg.instructions?.howToCompleteSteps || []).join('\n')
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const steps = stepsText.split('\n').map((s) => s.trim()).filter(Boolean);
    await onSave({ ...pkg, instructions: { ...form, howToCompleteSteps: steps } });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="font-extrabold text-sm text-amber-400">Instructions &amp; Guidelines</span>
            <p className="text-[11px] text-slate-400">{pkg.name} </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">What this package carries</label>
          <textarea
            value={form.whatItCarries}
            onChange={(e) => setForm({ ...form, whatItCarries: e.target.value })}
            rows={2}
            placeholder="Default: auto-generated from the exam/course/interview attached to this package"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Why study it</label>
          <textarea
            value={form.whyStudyIt}
            onChange={(e) => setForm({ ...form, whyStudyIt: e.target.value })}
            rows={4}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Why the certificate matters</label>
          <textarea
            value={form.whyCertificateMatters}
            onChange={(e) => setForm({ ...form, whyCertificateMatters: e.target.value })}
            rows={8}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">How to complete this package (one step per line)</label>
          <textarea
            value={stepsText}
            onChange={(e) => setStepsText(e.target.value)}
            rows={4}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Confidentiality note</label>
          <textarea
            value={form.confidentialityNote}
            onChange={(e) => setForm({ ...form, confidentialityNote: e.target.value })}
            rows={3}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Exam page intro (shown on the Exams module page)</label>
          <textarea
            value={form.examIntro}
            onChange={(e) => setForm({ ...form, examIntro: e.target.value })}
            rows={3}
            placeholder="Default: generic exam instructions"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Course page intro (shown on the Course module page)</label>
          <textarea
            value={form.courseIntro}
            onChange={(e) => setForm({ ...form, courseIntro: e.target.value })}
            rows={3}
            placeholder="Default: generic course instructions"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">AI Interview page intro (shown on the Interview module page)</label>
          <textarea
            value={form.interviewIntro}
            onChange={(e) => setForm({ ...form, interviewIntro: e.target.value })}
            rows={3}
            placeholder="Default: generic interview instructions"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Instructions'}
        </button>
      </div>
    </div>
  );
}