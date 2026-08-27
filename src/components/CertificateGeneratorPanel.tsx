import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { generateAtestaCertificatePdf } from '../utils/certificatePdfGenerator';
import { generateApexCertificate } from '../api/apexAssessmentApi';
import { ApexCertificate } from '../types';

interface Props {
  onClose: () => void;
  onGenerated: (cert: ApexCertificate) => void;
}

export const CertificateGeneratorPanel: React.FC<Props> = ({ onClose, onGenerated }) => {
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [taglineText, setTaglineText] = useState('International Customer Support Certification');
  const [examScorePercent, setExamScorePercent] = useState('');
  const [screeningScorePercent, setScreeningScorePercent] = useState('');
  const [resultLabel, setResultLabel] = useState('PASSED');
  const [verifyUrlText, setVerifyUrlText] = useState('');
  const [signedByName, setSignedByName] = useState('H. Kariuki');
  const [signedByTitle, setSignedByTitle] = useState('Certification Director');
  const [recognitionText, setRecognitionText] = useState('Recognized by International Job Boards');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!candidateName.trim()) {
      setError('Candidate name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Certificate ID isn't known until the backend assigns it, so we
      // render a placeholder-free PDF first, then re-render once we have
      // the real ID before uploading — two quick client-side renders,
      // no extra backend round trip.
      const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      // Ask the backend to create the record + assign the Certificate ID.
      // We upload a placeholder first, then patch with the final PDF.
      const created = await generateApexCertificate({
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim() || undefined,
        taglineText,
        examScorePercent: examScorePercent ? Number(examScorePercent) : null,
        screeningScorePercent: screeningScorePercent ? Number(screeningScorePercent) : null,
        resultLabel,
        verifyUrlText: verifyUrlText || undefined,
        signedByName,
        signedByTitle,
        recognitionText,
        pdfBase64: '' // placeholder — no PDF yet, filled in below
      });

      const { doc } = generateAtestaCertificatePdf({
        candidateName: candidateName.trim(),
        taglineText,
        certificateId: created.verificationCode,
        examScorePercent: examScorePercent ? Number(examScorePercent) : null,
        screeningScorePercent: screeningScorePercent ? Number(screeningScorePercent) : null,
        resultLabel,
        issueDate,
        verifyUrlText: verifyUrlText || `verify.atesta.io/${created.verificationCode}`,
        signedByName,
        signedByTitle,
        recognitionText
      });

      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // PATCH the real PDF (and the resolved verify URL) onto the record
      // we just created.
      const { updateApexCertificateFields } = await import('../api/apexAssessmentApi');
      const final = await updateApexCertificateFields(created.id, {
        verifyUrlText: verifyUrlText || `verify.atesta.io/${created.verificationCode}`,
        pdfBase64
      });

      onGenerated(final);
    } catch (err: any) {
      setError(err.message || 'Failed to generate certificate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Generate Atesta Certificate
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in the details below — the Certificate ID is generated automatically once you click Generate.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Queue
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Candidate Name *</label>
          <input
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Amara N. Wanjiru"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Candidate Email (for ID matching)</label>
          <input
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="amara@example.com"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Coursework / Exam / Screening Line
          </label>
          <input
            value={taglineText}
            onChange={(e) => setTaglineText(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Exam Score (%)</label>
          <input
            type="number"
            value={examScorePercent}
            onChange={(e) => setExamScorePercent(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Screening Score (%)</label>
          <input
            type="number"
            value={screeningScorePercent}
            onChange={(e) => setScreeningScorePercent(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Result</label>
          <select
            value={resultLabel}
            onChange={(e) => setResultLabel(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="PASSED">PASSED</option>
            <option value="FAILED">FAILED</option>
            <option value="DISTINCTION">DISTINCTION</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Verify URL text</label>
          <input
            value={verifyUrlText}
            onChange={(e) => setVerifyUrlText(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="verify.atesta.io/ATC-2026-004821"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Signed by (name)</label>
          <input
            value={signedByName}
            onChange={(e) => setSignedByName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Signed by (title)</label>
          <input
            value={signedByTitle}
            onChange={(e) => setSignedByTitle(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1">Recognition line</label>
          <input
            value={recognitionText}
            onChange={(e) => setRecognitionText(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:opacity-50"
      >
        {saving ? 'Generating…' : 'Generate Certificate'}
      </button>
    </div>
  );
};