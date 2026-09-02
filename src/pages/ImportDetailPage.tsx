import React, { useEffect, useMemo, useState } from 'react';
import {
  Application,
  ApexPackage,
  ApplicationVoucher,
  ComplianceQuestionId,
  ReadinessItem,
  ReadinessProgress,
  SubmittedDocument
} from '../types';
import {
  fetchApplicationReadiness,
  uploadApplicationReadinessDocument
} from '../api/applicationsApi';
import { getApexPackages } from '../api/apexAssessmentApi';
import {
  CheckCircle2,
  XCircle,
  UploadCloud,
  ShieldCheck,
  Globe2,
  Plane,
  Award,
  MapPin,
  Scale,
  KeyRound,
  Sparkles,
  ArrowLeft,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

interface ImportDetailPageProps {
  applicationId: string;
  onBackToJobBoard: () => void;
}

interface QuestionMeta {
  id: ComplianceQuestionId;
  label: string;
  icon: React.ReactNode;
  optionalUpload?: boolean;
}
const QUESTION_META: QuestionMeta[] = [
  { id: 'hasCovidCover', label: 'COVID-19 medical cover', icon: <ShieldCheck className="h-4 w-4" /> },
  { id: 'hasForeignExperience', label: 'Foreign work experience', icon: <Globe2 className="h-4 w-4" /> },
  { id: 'hasPassport', label: 'Valid passport', icon: <Plane className="h-4 w-4" /> },
  { id: 'hasApexCertificate', label: 'Atesta Training Certification', icon: <Award className="h-4 w-4" /> },
  { id: 'hasGoodConduct', label: 'Good Conduct certificate', icon: <ShieldCheck className="h-4 w-4" />, optionalUpload: true },
  { id: 'willingToRelocate', label: 'Willing to relocate internationally', icon: <MapPin className="h-4 w-4" /> },
  { id: 'hasLegalRestrictions', label: 'No pending legal/immigration restrictions', icon: <Scale className="h-4 w-4" /> }
];

const SUPPORTABLE_IDS: ComplianceQuestionId[] = ['hasCovidCover', 'hasPassport', 'hasGoodConduct'];

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const color = percentage >= 100 ? '#059669' : percentage >= 50 ? '#4f46e5' : '#dc2626';

  return (
    <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg sm:text-xl font-extrabold text-slate-900">{percentage}%</span>
        <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Ready</span>
      </div>
    </div>
  );
};

export const ImportDetailPage: React.FC<ImportDetailPageProps> = ({ applicationId, onBackToJobBoard }) => {
  const [application, setApplication] = useState<Application | null>(null);
  const [readinessProgress, setReadinessProgress] = useState<ReadinessProgress | null>(null);
  const [voucher, setVoucher] = useState<ApplicationVoucher | null>(null);
  const [assignedPackageIds, setAssignedPackageIds] = useState<string[]>([]);
  const [packages, setPackages] = useState<ApexPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const loadReadiness = async () => {
    try {
      const [readinessData, packagesData] = await Promise.all([
        fetchApplicationReadiness(applicationId),
        getApexPackages().catch(() => [])
      ]);
      setApplication(readinessData.application);
      setReadinessProgress(readinessData.readinessProgress);
      setVoucher(readinessData.voucher);
      setAssignedPackageIds(readinessData.assignedPackageIds || readinessData.voucher?.packageIds || []);
      setPackages(packagesData || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load your application summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();
  }, [applicationId]);

  const itemsById = useMemo(() => {
    const map = new Map<ComplianceQuestionId, ReadinessItem>();
    (readinessProgress?.items || []).forEach((item) => map.set(item.id, item));
    return map;
  }, [readinessProgress]);

  const handleUpload = async (questionId: ComplianceQuestionId, fileType: SubmittedDocument['fileType'], file: File) => {
    setUploadingId(questionId);
    setError('');
    try {
      const result = await uploadApplicationReadinessDocument(applicationId, file, fileType);
      setApplication(result.application);
      setReadinessProgress(result.readinessProgress);
      setVoucher(result.voucher);
      if (result.assignedPackageIds) setAssignedPackageIds(result.assignedPackageIds);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploadingId(null);
    }
  };

  const assignedPackages = useMemo(() => {
    const assignedIds = assignedPackageIds.length > 0 ? assignedPackageIds : (voucher?.packageIds || []);
    return assignedIds.map((pkgId) => {
      const match = packages.find((p) => p.packageId === pkgId || p.id === pkgId);
      return { id: pkgId, name: match?.name || 'Assigned Certification Package' };
    });
  }, [assignedPackageIds, voucher, packages]);

  const supportItems = QUESTION_META.filter((q) => {
    const item = itemsById.get(q.id);
    return SUPPORTABLE_IDS.includes(q.id) && item && item.answer === 'no';
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error && !readinessProgress) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <p className="text-sm text-rose-700 font-semibold">{error}</p>
          <button
            onClick={onBackToJobBoard}
            className="px-5 py-2.5 bg-[#1f4e79] hover:bg-[#102a43] text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer"
          >
            Back to Job Board
          </button>
        </div>
      </div>
    );
  }

  if (!application || !readinessProgress) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <button
        onClick={onBackToJobBoard}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg transition cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Job Board
      </button>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">{error}</div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
              Application Received
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Applying for: {application.jobTitle}</h1>
            <p className="text-xs text-slate-500 mt-1">
             To: <strong className="text-slate-800">{application.candidateEmail}</strong>
            </p>
          </div>
          <CircularProgress percentage={readinessProgress.percentage} />
        </div>
      </div>

      {/* Requirement status grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          Your current application Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUESTION_META.map((q) => {
            const item = itemsById.get(q.id);
            if (!item) return null;
            const isComplete = item.complete;
            const needsUpload = item.status === 'needs_upload';

            return (
              <div
                key={q.id}
                className={`border rounded-2xl p-4 space-y-2 ${
                  isComplete ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    {q.icon}
                    <span className="text-xs font-bold text-slate-800">{q.label}</span>
                  </div>
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-500">{item.message}</p>

                {q.optionalUpload && !isComplete && (
                  <p className="text-[10px] text-slate-400 italic">Optional — attach when available.</p>
                )}

                {needsUpload && item.documentType && (
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg cursor-pointer transition">
                    {uploadingId === q.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5" />
                    )}
                    Upload now
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg"
                      className="hidden"
                      disabled={uploadingId === q.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && item.documentType) handleUpload(q.id, item.documentType, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {supportItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">How We Support You</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            At Global Talent Plus, we walk alongside every candidate through this international application
            journey. Based on your answers, our support team can help you arrange:
          </p>
          <ul className="space-y-2">
            {supportItems.map((q) => (
              <li key={q.id} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900">{q.label}</strong> — our team can guide you through
                  obtaining this so it doesn't hold up your application.
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-500 italic">
            The one requirement we can't obtain on your behalf is the Atesta Training Certification below —
            that one requires you to complete the course and examination yourself.
          </p>
        </div>
      )}
{/* Atesta panel */}
<div className="bg-white rounded-2xl border border-indigo-200 p-6 sm:p-8 shadow-xs space-y-4">
  <div className="flex items-center gap-2">
    <Award className="h-5 w-5 text-indigo-600" />
    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Guidelines to Atesta Training Certification Program</h3>
  </div>

  <ol className="text-xs text-slate-600 space-y-3 list-decimal list-inside">
    <li>
      If you don't have an Atesta Certificate, create an account on the Atesta website. Use this link :{' '}
      <a href="https://atesta.mobit.co.ke/" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 underline">
        https://atesta.mobit.co.ke/
      </a>
    </li>
    <li>
      After creating an account, search for the package assigned to you that matches the job position you are applying for.
      {assignedPackages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {assignedPackages.map((pkg) => (
            <div key={pkg.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <p className="text-[11px] text-slate-500">Assigned Package</p>
              <p className="text-sm font-extrabold text-slate-900">{pkg.name}</p>
              <p className="text-xs font-bold text-indigo-700">ID: {pkg.id}</p>
            </div>
          ))}
        </div>
      )}
    </li>
    <li>After finding your training and certification package, click on the "View Package &amp; Start" button.</li>
    <li>
      That lands you on the instruction page where you are required to read and understand what Atesta certification is all about.
      This information is provided by the Atesta certification program and approved by the International Job Association Board.
    </li>
    <li>
      After reading and understanding, click Accept you can then start or access the exams and courses. However, the screening
      interview is only accessible to candidates who have completed and passed their exams.
    </li>
    <li>
      Global Talent Plus has a partnership program with Atesta Job Training. Through this partnership, we always provide a voucher
      code so candidates can access the course materials and study for free choose "Global Talent Plus" from the dropdown and use
      the code below to access the course material.
      {voucher && (
        <div className="border border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50/60 flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
          <KeyRound className="h-5 w-5 text-indigo-600 shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-slate-600">
              Your one-time Atesta access code
              {voucher.redeemedAt ? ' (already used)' : ''}:
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-lg font-extrabold tracking-widest text-indigo-800">{voucher.code}</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(voucher.code).then(() => {
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2000);
                  });
                }}
                className="p-1.5 rounded-md border border-indigo-200 bg-white hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                title="Copy code"
              >
                {codeCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              {codeCopied && <span className="text-[11px] font-semibold text-emerald-700">Copied!</span>}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              This code is unique to your application and can only be used once. Use it on the Atesta platform to access your funded
              course.
            </p>
          </div>
        </div>
      )}
    </li>
    <li>
      Exams and the online screening interview are provided at a fee for the candidate to complete, because this is a certificate
      that a candidate will own and can use to access several job positions.
    </li>
    <li>
      Atesta Training Certification is only issued by the Atesta Certification Institute of International Job Programs, a recognized
      body responsible for certifying candidates for international job placements.
    </li>
    <li>
      When you finish all the tasks assigned within the package, the institution awards those who have passed a certificate bearing
      their name, ID, and approval that they performed and passed the task.
    </li>
    <li>
      Global Talent Plus always assigns our job applicants to obtain this certificate with the ID, because it confirms to us that we
      do not need to run a separate interview with an applicant the certificate itself assures us the applicant has met the given
      requirement, and our task remains to process the applicant and make sure they achieve their dream job.
    </li>
    <li>
      Obtaining this certificate demonstrates to potential employers abroad that you have undergone the proper vetting and
      qualification process expected of candidates seeking work opportunities outside the country.
    </li>
  </ol>
</div>
    </div>
  );
};