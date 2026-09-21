import React, { useState, useEffect, useRef } from 'react';
import { Job, SubmittedDocument } from '../types';
import { useAuth } from '../auth/AuthContext';
import { submitApplication, fetchApplications, uploadApplicationDocument } from '../api/applicationsApi';
import { validateAtestaCertificate, AtestaValidationResult } from '../api/apexAssessmentApi';
import { isValidEmail, isValidPhone, EMAIL_ERROR_MESSAGE, PHONE_ERROR_MESSAGE } from '../utils/validators';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  ShieldCheck,
  Lock,
  Globe2,
  Plane,
  Award,
  Scale,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface ApplyPageProps {
  job: Job;
  onBack: () => void;
  onSubmitted: (applicationId: string) => void;
}

type ComplianceAnswer = 'yes' | 'no' | null;

interface ComplianceQuestion {
  id: string;
  label: string;
  icon: React.ReactNode;
  needsUploadOnYes?: boolean;
  optionalUploadOnYes?: boolean;
  uploadLabel?: string;
  uploadAccept?: string;
  uploadFileType?: SubmittedDocument['fileType'];
}

// Phase 6: asked after CV/ID upload, before final submit. Every question is
// required (marked with *); a "yes" on an upload-linked question unlocks
// that upload and the application cannot be sent until it's attached.
const COMPLIANCE_QUESTIONS: ComplianceQuestion[] = [
  {
    id: 'hasCovidCover',
    label: 'Do you have COVID-19 medical cover?',
    icon: <ShieldCheck className="h-4 w-4" />,
    needsUploadOnYes: true,
    uploadLabel: 'Upload COVID-19 Cover',
    uploadAccept: '.pdf,.png,.jpg',
    uploadFileType: 'covid_cover'
  },
  {
    id: 'hasForeignExperience',
    label: 'Have you worked in a foreign country before?',
    icon: <Globe2 className="h-4 w-4" />
  },
  {
    id: 'hasPassport',
    label: 'Do you have a valid passport?',
    icon: <Plane className="h-4 w-4" />,
    needsUploadOnYes: true,
    uploadLabel: 'Upload Passport',
    uploadAccept: '.pdf,.png,.jpg',
    uploadFileType: 'passport'
  },
  {
    id: 'hasApexCertificate',
    label: 'Have you completed any Atesta Training Certification required in this role?',
    icon: <Award className="h-4 w-4" />,
    needsUploadOnYes: true,
    uploadLabel: 'Upload Atesta Assessment Certificate',
    uploadAccept: '.pdf,.png,.jpg',
    uploadFileType: 'certificate'
  },
  {
    id: 'hasGoodConduct',
    label: 'Do you have a Good Conduct certificate?',
    icon: <ShieldCheck className="h-4 w-4" />,
    needsUploadOnYes: true,
    optionalUploadOnYes: true,
    uploadLabel: 'Upload Good Conduct Certificate (Optional)',
    uploadAccept: '.pdf,.png,.jpg',
    uploadFileType: 'good_conduct'
  },
  {
    id: 'willingToRelocate',
    label: 'Are you willing to relocate internationally for this role?',
    icon: <MapPin className="h-4 w-4" />
  },
  {
    id: 'hasLegalRestrictions',
    label: 'Do you have any pending legal or immigration restrictions that would prevent you from working abroad?',
    icon: <Scale className="h-4 w-4" />
  }
];

export const ApplyPage: React.FC<ApplyPageProps> = ({ job, onBack, onSubmitted }) => {
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  // Form States
  const [candidateName, setCandidateName] = useState(user?.name || '');
  const [candidateEmail, setCandidateEmail] = useState(user?.email || '');
  const [candidatePhone, setCandidatePhone] = useState(user?.phone || '');
  const [candidateLocation, setCandidateLocation] = useState(user?.location || '');
  const [experienceYears, setExperienceYears] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Task 3: LinkedIn / Portfolio only make sense for tech-adjacent roles.
  // Add more department/title keywords here as new job categories are introduced.
  const TECH_ROLE_KEYWORDS = ['engineer', 'developer', 'software', 'it ', 'information technology', 'data', 'devops', 'qa', 'programmer', 'tech'];
  const isTechRole = TECH_ROLE_KEYWORDS.some(
    (kw) => job.department?.toLowerCase().includes(kw) || job.title?.toLowerCase().includes(kw)
  );

  // Document Uploads
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  // Atesta Certificate ID — pasted, checked against the Atesta database.
  const [atestaCertificateId, setAtestaCertificateId] = useState('');
  const [atestaSkipped, setAtestaSkipped] = useState(false);
  const [atestaCheckStatus, setAtestaCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [atestaCheckMessage, setAtestaCheckMessage] = useState('');
  const atestaQuestionRef = useRef<HTMLDivElement | null>(null);

  // Phase 6: compliance question answers + their conditional uploads
  const [complianceAnswers, setComplianceAnswers] = useState<Record<string, ComplianceAnswer>>(
    Object.fromEntries(COMPLIANCE_QUESTIONS.map((q) => [q.id, null]))
  );
  const [complianceFiles, setComplianceFiles] = useState<Record<string, File | null>>(
    Object.fromEntries(COMPLIANCE_QUESTIONS.map((q) => [q.id, null]))
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Task 2: after a successful submit we show a confirmation + loader screen
  // for a couple seconds, THEN send the candidate back to the job board —
  // they should never land straight back on recommended jobs with no feedback.
  const [submitted, setSubmitted] = useState(false);

  // Block re-applying to a job the candidate has already applied for —
  // checked once on mount so the form never even renders for a duplicate.
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setCheckingExisting(false);
      return;
    }
    fetchApplications({ candidateId: user.id, jobId: job.id }).then((apps) => {
      setAlreadyApplied(apps.length > 0);
      setCheckingExisting(false);
    });
  }, [user?.id, job.id]);

  const setComplianceAnswer = (questionId: string, answer: ComplianceAnswer) => {
    setComplianceAnswers((current) => ({ ...current, [questionId]: answer }));
    // Answering "no" (or re-answering) after a file was attached clears the
    // now-irrelevant upload so a stale file can't sneak into submission.
    if (answer !== 'yes') {
      setComplianceFiles((current) => ({ ...current, [questionId]: null }));
    }
  };

  const handleContinueToCompliance = (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!candidateName.trim()) missing.push('Full Name');
    if (!candidateEmail.trim()) missing.push('Email Address');
    if (!candidatePhone.trim()) missing.push('Phone Number');
    if (!candidateLocation.trim()) missing.push('Current Location');
    if (!resumeFile) missing.push('Resume / CV');
    if (!idFile) missing.push('National ID / Passport');

    if (missing.length > 0) {
      setError(`Please complete all required fields before continuing: ${missing.join(', ')}.`);
      return;
    }

    if (!isValidEmail(candidateEmail)) {
      setError(EMAIL_ERROR_MESSAGE);
      return;
    }
    if (!isValidPhone(candidatePhone)) {
      setError(PHONE_ERROR_MESSAGE);
      return;
    }

    setError('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const complianceIncomplete = COMPLIANCE_QUESTIONS.some((q) => {
    const answer = complianceAnswers[q.id];
    if (answer === null) return true;
    if (answer === 'yes' && q.needsUploadOnYes && !q.optionalUploadOnYes && !complianceFiles[q.id]) return true;
    return false;
  });

  // The Atesta question only blocks submission when the candidate said
  // "yes" and hasn't verified an ID and hasn't chosen "provide it later".
  const atestaAnswer = complianceAnswers['hasApexCertificate'];
  // Only blocks Submit when they said "yes" and gave us nothing at all —
  // the actual ID gets checked at submit time, in handleSaveApplication.
  const atestaIdIncomplete = atestaAnswer === 'yes' && !atestaSkipped && !atestaCertificateId.trim();



  const handleSaveApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (complianceIncomplete) {
      setError('Please answer every question and attach any required document before applying.');
      return;
    }

    if (atestaIdIncomplete) {
      setError('Please enter your Atesta Certificate ID, or choose to provide it later, before applying.');
      return;
    }

    setSaving(true);
    setError('');

    // The Atesta Certificate ID is checked now, at submit time — not while
    // the candidate was still filling in the form. If it's wrong, we stop
    // the submission and send them back up to the question; every other
    // answer on the form stays exactly as they left it.
    if (atestaAnswer === 'yes' && !atestaSkipped && atestaCheckStatus !== 'valid') {
      setAtestaCheckStatus('checking');
      setAtestaCheckMessage('');
      try {
        const result: AtestaValidationResult = await validateAtestaCertificate(
          atestaCertificateId.trim(),
          candidateName,
          candidateEmail
        );
        if (result.status === 'valid') {
          setAtestaCheckStatus('valid');
          setAtestaCheckMessage(`Verified — matches ${result.certificate.candidateName}.`);
        } else {
          const message =
            result.status === 'mismatch'
              ? `We noticed the certificate you provided is not yours — it belongs to ${result.ownerName}. Please provide the Atesta Certificate ID that matches your own details.`
              : 'This Atesta Certificate ID could not be found. Please check it and try again, or choose to provide it later.';
          setAtestaCheckStatus('invalid');
          setAtestaCheckMessage(message);
          setSaving(false);
          setError('Please fix your Atesta Certificate ID before we can submit your application.');
          atestaQuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      } catch (err: any) {
        setAtestaCheckStatus('invalid');
        setAtestaCheckMessage(err.message || 'Could not verify this ID right now. Please try again.');
        setSaving(false);
        setError('Please fix your Atesta Certificate ID before we can submit your application.');
        atestaQuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    try {
      if (!resumeFile || !idFile) {
        throw new Error('Resume/CV and National ID/Passport are required.');
      }

      const uploads: Array<{ file: File; fileType: SubmittedDocument['fileType'] }> = [
        { file: resumeFile, fileType: 'resume' },
        { file: idFile, fileType: 'id_card' }
      ];

      if (coverLetterFile) uploads.push({ file: coverLetterFile, fileType: 'cover_letter' });
      if (certificateFile) uploads.push({ file: certificateFile, fileType: 'certificate' });

      for (const q of COMPLIANCE_QUESTIONS) {
        const file = complianceFiles[q.id];
        if (file && q.uploadFileType) {
          uploads.push({ file, fileType: q.uploadFileType });
        }
      }

      const uploadedDocuments: SubmittedDocument[] = [];
      for (const item of uploads) {
        try {
          const uploaded = await uploadApplicationDocument(item.file, item.fileType);
          uploadedDocuments.push(uploaded);
        } catch (uploadError: any) {
          throw new Error(
            `Could not upload your ${item.fileType.replace('_', ' ')} document. ${uploadError.message || 'Please try again.'}`
          );
        }
      }

      const { application } = await submitApplication({
        jobId: job.id,
        jobTitle: job.title,
        candidateId: user?.id || `usr-${Date.now()}`,
        candidateName,
        candidateEmail,
        candidatePhone,
        candidateLocation,
        experienceYears,
        currentCompany,
        linkedinUrl: isTechRole ? linkedinUrl : undefined,
        portfolioUrl: isTechRole ? portfolioUrl : undefined,
        documents: uploadedDocuments,
        complianceAnswers,
        atestaCertificateId: atestaCheckStatus === 'valid' ? atestaCertificateId.trim() : null
      });

      setSaving(false);
      setSubmitted(true);
      setTimeout(() => {
        onSubmitted(application.id);
      }, 2600);
    } catch (err: any) {
      setError(err.message || 'Failed to save application');
      setSaving(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex justify-center">
        <div className="h-8 w-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-xs flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">You have already applied for this position</h2>
          <p className="text-sm text-slate-500 max-w-sm">
            You've already submitted an application for <strong className="text-slate-700">{job.title}</strong>.
            You can track its progress from your candidate portal.
          </p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-[#1f4e79] hover:bg-[#102a43] text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer"
          >
            Back to Job Board
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-xs flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Your application has been sent!</h2>
          <p className="text-sm text-slate-500 max-w-sm">
            We've received your application for <strong className="text-slate-700">{job.title}</strong> and emailed
            you a confirmation. Wait and see your application summary update…
          </p>
          <div className="h-8 w-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <button
        onClick={onBack}
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg transition cursor-pointer"
      >
        Cancel & Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
              {step === 1 ? 'Application & Credentials' : 'Deployment Readiness'}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">Applying for: {job.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Linked to Account Reference: <strong className="text-slate-800">{user?.email || candidateEmail}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              1
            </span>
            <span className="w-6 h-px bg-slate-200" />
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </span>
          </div>
        </div>

        {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleContinueToCompliance} className="space-y-6">
            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                Candidate Personal Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={candidatePhone}
                      onChange={(e) => setCandidatePhone(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={candidateLocation}
                      onChange={(e) => setCandidateLocation(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                Experience & Portfolio
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience (Optional)</label>
                  <input
                    type="text"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 3 years 5 months"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Company (Optional)</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                {isTechRole && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL (Optional)</label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio / Github URL (Optional)</label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                  Required Documents Upload
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock className="h-3 w-3" /> AES-256 Encrypted Storage
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100/80 transition text-center space-y-2">
                  <FileText className="h-6 w-6 text-indigo-600 mx-auto" />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Upload Resume / CV *</span>
                    <span className="text-[11px] text-slate-500">PDF or DOCX up to 10MB</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {resumeFile && <span className="block text-[11px] text-emerald-600 font-semibold">{resumeFile.name}</span>}
                </div>

                <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100/80 transition text-center space-y-2">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 mx-auto" />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">National ID / Passport *</span>
                    <span className="text-[11px] text-slate-500">Required for verification</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg"
                    onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {idFile && <span className="block text-[11px] text-emerald-600 font-semibold">{idFile.name}</span>}
                </div>

                <div className="border border-dashed border-slate-200 rounded-2xl p-3 bg-slate-50 text-center space-y-1">
                  <span className="block text-xs font-semibold text-slate-700">Cover Letter (Optional)</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <div className="border border-dashed border-slate-200 rounded-2xl p-3 bg-slate-50 text-center space-y-1">
                  <span className="block text-xs font-semibold text-slate-700">Certifications / Transcripts</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveApplication} className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                Deployment Readiness Questions
              </h3>
              <p className="text-xs text-slate-500 pt-2">
                Every question is required (*). Answering "Yes" on some questions will ask you to attach supporting
                documentation. Good Conduct upload is optional if available.
              </p>
            </div>

            <div className="space-y-3">
              {COMPLIANCE_QUESTIONS.map((q) => {
                const answer = complianceAnswers[q.id];
                const showUpload = q.needsUploadOnYes && answer === 'yes';
                const file = complianceFiles[q.id];

                return (
                  <div
                    key={q.id}
                    ref={q.id === 'hasApexCertificate' ? atestaQuestionRef : undefined}
                    className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3"
                  >
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                      {q.label} <span className="text-rose-600">*</span>
                    </p>

                    <div className="flex items-center gap-2">
                      {(['yes', 'no'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setComplianceAnswer(q.id, option)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            answer === option
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {option === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>

                    {showUpload && (
                      <div>
                        <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white text-center space-y-1">
                          <span className="block text-[11px] font-bold text-slate-800">
                            {q.uploadLabel} {!q.optionalUploadOnYes && <span className="text-rose-600">*</span>}
                          </span>
                          <input
                            type="file"
                            accept={q.uploadAccept}
                            onChange={(e) =>
                              setComplianceFiles((current) => ({ ...current, [q.id]: e.target.files?.[0] || null }))
                            }
                            className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                          />
                          {file && <span className="block text-[11px] text-emerald-600 font-semibold">{file.name}</span>}
                        </div>
                      </div>
                    )}

                    {q.id === 'hasApexCertificate' && answer === 'yes' && (
                      <div className="border-t border-slate-200 pt-3 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-800">
                          Atesta Certificate ID
                        </label>
                        {!atestaSkipped ? (
                          <>
                            <input
                              value={atestaCertificateId}
                              onChange={(e) => {
                                setAtestaCertificateId(e.target.value);
                                setAtestaCheckStatus('idle');
                                setAtestaCheckMessage('');
                              }}
                              placeholder="e.g. ATC-2026-004821"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-[11px] text-slate-400">
                              We'll check this against the Atesta database when you submit your application.
                            </p>
                            {atestaCheckMessage && atestaCheckStatus === 'invalid' && (
                              <p className="text-[11px] font-semibold text-rose-600">{atestaCheckMessage}</p>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setAtestaSkipped(true);
                                setAtestaCheckStatus('idle');
                                setAtestaCheckMessage('');
                                setAtestaCertificateId('');
                              }}
                              className="text-[11px] font-semibold text-slate-500 underline cursor-pointer"
                            >
                              I don't have my Certificate ID right now — I'll provide it later
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-slate-500">
                              You've chosen to provide your Atesta Certificate ID later.
                            </p>
                            <button
                              type="button"
                              onClick={() => setAtestaSkipped(false)}
                              className="text-[11px] font-semibold text-indigo-600 underline cursor-pointer"
                            >
                              Actually, I have it
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={saving || complianceIncomplete || atestaIdIncomplete}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};