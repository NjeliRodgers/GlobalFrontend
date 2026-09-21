import React, { useState, useEffect } from 'react';
import { ApexQuestion, ApexExam, ApexInterviewProduct, ApexCourse, ApexCourseModule, ApexPackage, PaystackPayment, AiInterviewSession, ApexCertificate } from '../types';
import PackageInstructionsModal from '../components/PackageInstructionsModal';
import { NotesRichEditor } from '../components/NotesRichEditor';
import { listQuestionImports, getQuestionImportQuestions } from '../api/apexAssessmentApi';
import { toEditableNotesHtml, getTocHeadings } from '../utils/moduleNotesFormat';
import {
  getApexExams,
  saveApexExam,
  deleteApexExam,
  getApexInterviewProducts,
  saveApexInterviewProduct,
  deleteApexInterviewProduct,
  getApexQuestions,
  saveApexQuestion,
  deleteApexQuestion,
  uploadApexQuestionsCsv,
  getPaystackPayments,
  getAiInterviewSessions,
  unlockCandidateStageTwo,
  getApexCertificates,
  approveApexCertificate,
  generateApexCertificate,
  getApexCourses,
  saveApexCourse,
  deleteApexCourse,
  saveApexCourseModule,
  deleteApexCourseModule,
  generateModuleContentFromPdfApi,
  uploadApexCourseModuleDocument,
  uploadApexCourseDocument,
  getApexPackages,
  saveApexPackage,
  deleteApexPackage
} from '../api/apexAssessmentApi';
import { NewExamBuilderPage } from './NewExamBuilderPage';
import { CertificateGeneratorPanel } from '../components/CertificateGeneratorPanel';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  DollarSign,
  Bot,
  FileText,
  Users,
  Sliders,
  ClipboardList,
  Video,
  BookOpen,
  Package,
  Award,
  CheckCircle2,
  Clock3,
  Eye,
  FileDown,
  Download,
  Link2,
  HelpCircle,
  Upload
} from 'lucide-react';

type Tab = 'exams' | 'courses' | 'packages' | 'interview_products' | 'questions' | 'financials' | 'certificates' | 'transcripts';

const PACKAGE_ID_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const suggestPackageId = (existing: ApexPackage[]): string => {
  let candidate = '';
  do {
    candidate = Array.from({ length: 6 }, () => PACKAGE_ID_LETTERS[Math.floor(Math.random() * PACKAGE_ID_LETTERS.length)]).join('');
  } while (existing.some((p) => p.packageId === candidate));
  return candidate;
};

export const ApexRecruiterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('exams');

  // Exams
  const [exams, setExams] = useState<ApexExam[]>([]);
  const [editingExam, setEditingExam] = useState<ApexExam | null>(null);
  const [managingQuestionsForExam, setManagingQuestionsForExam] = useState<ApexExam | null>(null);
  const [showNewExamBuilder, setShowNewExamBuilder] = useState(false);
  const [csvEditingExam, setCsvEditingExam] = useState<ApexExam | null>(null);
  const [csvEditQuestions, setCsvEditQuestions] = useState<ApexQuestion[]>([]);
  const [csvEditSelectedIds, setCsvEditSelectedIds] = useState<Set<string>>(new Set());
  const [csvEditUploading, setCsvEditUploading] = useState(false);
  const [csvEditSaving, setCsvEditSaving] = useState(false);
  const [csvEditError, setCsvEditError] = useState('');
  const [csvEditShowSavedPicker, setCsvEditShowSavedPicker] = useState(false);

  // Courses
  const [courses, setCourses] = useState<ApexCourse[]>([]);
  const [editingCourse, setEditingCourse] = useState<ApexCourse | null>(null);
  const [managingModulesForCourse, setManagingModulesForCourse] = useState<ApexCourse | null>(null);
  const [questionPoolImportFilter, setQuestionPoolImportFilter] = useState('');
  const [savedQuestionImports, setSavedQuestionImports] = useState<{ id: string; fileName: string; questionCount: number }[]>([]);
  const [editingModule, setEditingModule] = useState<ApexCourseModule | null>(null);
  const [quizDraft, setQuizDraft] = useState({ question: '', options: ['', '', '', ''], correctIndex: 0 });
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [uploadingDocFor, setUploadingDocFor] = useState<string | null>(null);
  const [docUploadError, setDocUploadError] = useState('');
  const [uploadingCourseDoc, setUploadingCourseDoc] = useState(false);
  const [courseDocUploadError, setCourseDocUploadError] = useState('');

  // Packages
  const [packages, setPackages] = useState<ApexPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<ApexPackage | null>(null);
  const [instructionsPackage, setInstructionsPackage] = useState<ApexPackage | null>(null);
    const [packageExamSearch, setPackageExamSearch] = useState('');
  const [packageCourseSearch, setPackageCourseSearch] = useState('');

  // Interview Products
  const [products, setProducts] = useState<ApexInterviewProduct[]>([]);
  const [editingProduct, setEditingProduct] = useState<ApexInterviewProduct | null>(null);

  // Questions
  const [questions, setQuestions] = useState<ApexQuestion[]>([]);
  const [tabSearchQuery, setTabSearchQuery] = useState('');
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<ApexQuestion | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvUploadResult, setCsvUploadResult] = useState<{ inserted: number; skipped: number; totalRows: number; rowErrors: { row: number; reason: string }[] } | null>(null);
  const [csvUploadError, setCsvUploadError] = useState('');

  // Financial Ledger
  const [payments, setPayments] = useState<PaystackPayment[]>([]);

  // AI Transcripts
  const [aiSessions, setAiSessions] = useState<AiInterviewSession[]>([]);

  // Certificates
  const [certificates, setCertificates] = useState<ApexCertificate[]>([]);
  const [showCertificateGenerator, setShowCertificateGenerator] = useState(false);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{ id: string; url: string; verificationCode: string } | null>(null);

  const handlePreviewCertificatePdf = async (certId: string) => {
    setPreviewLoadingId(certId);
    try {
      const { apiFetch } = await import('../api/client');
      const res = await apiFetch(`/apex/certificates/${certId}/pdf`);
      if (!res.ok) throw new Error('Failed to load PDF');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const cert = certificates.find((c) => c.id === certId);
      setPreviewPdf({ id: certId, url: blobUrl, verificationCode: cert?.verificationCode || 'certificate' });
    } catch (err: any) {
      window.alert(err.message || 'Could not load the certificate PDF');
    } finally {
      setPreviewLoadingId(null);
    }
  };
  const [approvingCertId, setApprovingCertId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    listQuestionImports().then(setSavedQuestionImports).catch(() => {});
  }, []);

  const loadData = async () => {
    setExams(await getApexExams());
    setCourses(await getApexCourses());
    setPackages(await getApexPackages());
    setProducts(await getApexInterviewProducts());
    setQuestions(await getApexQuestions());
    setPayments(await getPaystackPayments());
    setAiSessions(await getAiInterviewSessions());
    setCertificates(await getApexCertificates());
  };

  // ── Certificates ──
  const handleApproveCertificate = async (id: string) => {
    setApprovingCertId(id);
    try {
      await approveApexCertificate(id);
      await loadData();
    } catch (err: any) {
      window.alert(err.message || 'Failed to approve this certificate');
    } finally {
      setApprovingCertId(null);
    }
  };

  // ── Exams ──
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    await saveApexExam(editingExam);
    setEditingExam(null);
    loadData();
  };

  const handleDeleteExam = async (id: string) => {
    if (confirm('Delete this exam? Its questions will remain but become unassigned.')) {
      await deleteApexExam(id);
      loadData();
    }
  };

  // ── CSV-driven exam question editor (separate from the manual Manage Question Pool panel) ──
  const openCsvQuestionEditor = (ex: ApexExam) => {
    setCsvEditingExam(ex);
    setCsvEditQuestions([]);
    setCsvEditSelectedIds(new Set());
    setCsvEditError('');
    setCsvEditShowSavedPicker(false);
  };

  const loadCsvEditQuestions = (loaded: ApexQuestion[], examId: string) => {
    const sorted = [...loaded].sort((a, b) => {
      const aTop = a.examId === examId ? 0 : 1;
      const bTop = b.examId === examId ? 0 : 1;
      return aTop - bTop;
    });
    setCsvEditQuestions(sorted);
    setCsvEditSelectedIds(new Set(sorted.filter((q) => q.examId === examId).map((q) => q.id)));
  };

  const handleCsvEditUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !csvEditingExam) return;
    setCsvEditUploading(true);
    setCsvEditError('');
    try {
      const result = await uploadApexQuestionsCsv(file);
      loadCsvEditQuestions(result.insertedQuestions, csvEditingExam.id);
      listQuestionImports().then(setSavedQuestionImports).catch(() => {});
    } catch (err: any) {
      setCsvEditError(err.message || 'Failed to upload CSV');
    } finally {
      setCsvEditUploading(false);
    }
  };

  const handleCsvEditUseSaved = async (importId: string) => {
    if (!csvEditingExam) return;
    setCsvEditUploading(true);
    setCsvEditError('');
    setCsvEditShowSavedPicker(false);
    try {
      const loaded = await getQuestionImportQuestions(importId);
      loadCsvEditQuestions(loaded, csvEditingExam.id);
    } catch (err: any) {
      setCsvEditError(err.message || 'Failed to load saved file');
    } finally {
      setCsvEditUploading(false);
    }
  };

  const toggleCsvEditQuestion = (id: string) => {
    setCsvEditSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveCsvEditSelections = async () => {
    if (!csvEditingExam) return;
    setCsvEditSaving(true);
    try {
      await Promise.all(
        csvEditQuestions.map((q) => {
          const shouldBeAssigned = csvEditSelectedIds.has(q.id);
          const isAssigned = q.examId === csvEditingExam.id;
          if (shouldBeAssigned === isAssigned) return Promise.resolve();
          return saveApexQuestion({ ...q, examId: shouldBeAssigned ? csvEditingExam.id : null });
        })
      );
      setCsvEditingExam(null);
      await loadData();
    } catch (err: any) {
      setCsvEditError(err.message || 'Failed to save changes');
    } finally {
      setCsvEditSaving(false);
    }
  };

  // ── Courses ──
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    await saveApexCourse(editingCourse);
    setEditingCourse(null);
    loadData();
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm('Delete this course? Its modules will be removed too.')) {
      await deleteApexCourse(id);
      loadData();
    }
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;
    await saveApexCourseModule(editingModule);
    setEditingModule(null);
    loadData();
  };

  const handleGenerateFromPdf = async () => {
    if (!editingModule?.documentUrl) return;
    setGeneratingAi(true);
    setAiError('');
    try {
      const generated = await generateModuleContentFromPdfApi(editingModule.documentUrl);
      setEditingModule({
        ...editingModule,
        contentBody: generated.contentBody || editingModule.contentBody,
        summary: generated.summary || editingModule.summary,
        quiz: generated.quiz.length > 0 ? generated.quiz : editingModule.quiz
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate content from this PDF');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAddQuizQuestion = () => {
    if (!editingModule) return;
    if (!quizDraft.question.trim() || quizDraft.options.some((o) => !o.trim())) return;
    const newQuestion = { id: `q-${Date.now()}`, question: quizDraft.question, options: quizDraft.options, correctIndex: quizDraft.correctIndex };
    setEditingModule({ ...editingModule, quiz: [...(editingModule.quiz || []), newQuestion] });
    setQuizDraft({ question: '', options: ['', '', '', ''], correctIndex: 0 });
  };

  const handleRemoveQuizQuestion = (id: string) => {
    if (!editingModule) return;
    setEditingModule({ ...editingModule, quiz: (editingModule.quiz || []).filter((q) => q.id !== id) });
  };

  const handleUploadModuleDocument = async (moduleId: string, file: File) => {
    if (file.type !== 'application/pdf') {
      setDocUploadError('Only PDF files are allowed.');
      return;
    }
    setDocUploadError('');
    setUploadingDocFor(moduleId);
    try {
      const updated = await uploadApexCourseModuleDocument(moduleId, file);
      setEditingModule((cur) => (cur && cur.id === moduleId ? updated : cur));
      await loadData();
    } catch (err: any) {
      setDocUploadError(err.message || 'Failed to upload the PDF');
    } finally {
      setUploadingDocFor(null);
    }
  };

  const ALLOWED_COURSE_DOC_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const handleUploadCourseDocument = async (courseId: string, file: File) => {
    if (!ALLOWED_COURSE_DOC_TYPES.includes(file.type)) {
      setCourseDocUploadError('Only PDF or Word (.doc/.docx) files are allowed.');
      return;
    }
    setCourseDocUploadError('');
    setUploadingCourseDoc(true);
    try {
      const updated = await uploadApexCourseDocument(courseId, file);
      setEditingCourse((cur) => (cur && cur.id === courseId ? updated : cur));
      await loadData();
    } catch (err: any) {
      setCourseDocUploadError(err.message || 'Failed to upload the file');
    } finally {
      setUploadingCourseDoc(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm('Delete this module?')) {
      await deleteApexCourseModule(id);
      loadData();
    }
  };

  // ── Packages ──
  const [packageIdError, setPackageIdError] = useState('');
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    const normalized = (editingPackage.packageId || '').toUpperCase();
    if (!/^[A-Z]{1,6}$/.test(normalized)) {
      setPackageIdError('Package ID must be 1–6 letters (A–Z only).');
      return;
    }
    if (packages.some((p) => p.packageId === normalized && p.id !== editingPackage.id)) {
      setPackageIdError('That Package ID is already used by another package — choose a different one.');
      return;
    }
    setPackageIdError('');
    await saveApexPackage({ ...editingPackage, packageId: normalized });
    setEditingPackage(null);
    loadData();
  };

  const handleDeletePackage = async (id: string) => {
    if (confirm('Delete this package?')) {
      await deleteApexPackage(id);
      loadData();
    }
  };

  // ── Interview Products ──
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await saveApexInterviewProduct(editingProduct);
    setEditingProduct(null);
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this AI interview pricing package?')) {
      await deleteApexInterviewProduct(id);
      loadData();
    }
  };

  // ── Questions ──
  const normalizedTabSearch = tabSearchQuery.trim().toLowerCase();
  const normalizedQuestionSearch = questionSearchQuery.trim().toLowerCase();

  const filteredExams = exams.filter((ex) => {
    if (!normalizedTabSearch) return true;
    return (
      ex.name.toLowerCase().includes(normalizedTabSearch) ||
      ex.jobTitle.toLowerCase().includes(normalizedTabSearch) ||
      (ex.category || '').toLowerCase().includes(normalizedTabSearch) ||
      (ex.description || '').toLowerCase().includes(normalizedTabSearch)
    );
  });

  const filteredCourses = courses.filter((course) => {
    if (!normalizedTabSearch) return true;
    const moduleMatches = (course.modules || []).some((module) =>
      module.title.toLowerCase().includes(normalizedTabSearch)
    );
    return (
      course.name.toLowerCase().includes(normalizedTabSearch) ||
      (course.category || '').toLowerCase().includes(normalizedTabSearch) ||
      (course.description || '').toLowerCase().includes(normalizedTabSearch) ||
      moduleMatches
    );
  });

  const filteredPackages = packages.filter((pkg) => {
    if (!normalizedTabSearch) return true;
    return (
      pkg.name.toLowerCase().includes(normalizedTabSearch) ||
      (pkg.packageId || '').toLowerCase().includes(normalizedTabSearch) ||
      (pkg.category || '').toLowerCase().includes(normalizedTabSearch) ||
      (pkg.description || '').toLowerCase().includes(normalizedTabSearch)
    );
  });

  const filteredProducts = products.filter((product) => {
    if (!normalizedTabSearch) return true;
    return (
      product.name.toLowerCase().includes(normalizedTabSearch) ||
      product.jobTitle.toLowerCase().includes(normalizedTabSearch) ||
      (product.description || '').toLowerCase().includes(normalizedTabSearch)
    );
  });

  const filteredPayments = payments.filter((payment) => {
    if (!normalizedTabSearch) return true;
    return (
      payment.transactionRef.toLowerCase().includes(normalizedTabSearch) ||
      payment.candidateName.toLowerCase().includes(normalizedTabSearch) ||
      payment.candidateEmail.toLowerCase().includes(normalizedTabSearch) ||
      payment.provider.toLowerCase().includes(normalizedTabSearch) ||
      payment.stage.toLowerCase().includes(normalizedTabSearch)
    );
  });

  const filteredCertificates = certificates.filter((cert) => {
    if (!normalizedTabSearch) return true;
    return (
      cert.candidateName.toLowerCase().includes(normalizedTabSearch) ||
      cert.sourceName.toLowerCase().includes(normalizedTabSearch) ||
      cert.sourceType.toLowerCase().includes(normalizedTabSearch) ||
      cert.verificationCode.toLowerCase().includes(normalizedTabSearch) ||
      cert.status.toLowerCase().includes(normalizedTabSearch)
    );
  });

  const filteredAiSessions = aiSessions.filter((session) => {
    if (!normalizedTabSearch) return true;
    const transcriptMatches = (session.transcript || []).some(
      (line) =>
        line.speaker.toLowerCase().includes(normalizedTabSearch) ||
        line.message.toLowerCase().includes(normalizedTabSearch)
    );
    return (
      session.candidateName.toLowerCase().includes(normalizedTabSearch) ||
      session.candidateEmail.toLowerCase().includes(normalizedTabSearch) ||
      transcriptMatches
    );
  });

  const combinedQuestionQuery = [normalizedTabSearch, normalizedQuestionSearch].filter(Boolean).join(' ').trim();
  const filteredQuestions = questions.filter(
    (q) =>
      !combinedQuestionQuery ||
      q.question.toLowerCase().includes(combinedQuestionQuery) ||
      (exams.find((ex) => ex.id === q.examId)?.name || '').toLowerCase().includes(combinedQuestionQuery)
  );

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    await saveApexQuestion(editingQuestion);
    setEditingQuestion(null);
    setIsNewQuestion(false);
    loadData();
  };

  const handleUploadQuestionsCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file name later
    if (!file) return;

    setUploadingCsv(true);
    setCsvUploadError('');
    setCsvUploadResult(null);
    try {
      const result = await uploadApexQuestionsCsv(file);
      setCsvUploadResult(result);
      loadData();
    } catch (err: any) {
      setCsvUploadError(err.message || 'Failed to upload CSV');
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Delete this question from the Atesta question bank?')) {
      await deleteApexQuestion(id);
      loadData();
    }
  };

  const handleToggleQuestionAssignment = async (question: ApexQuestion, exam: ApexExam, assign: boolean) => {
    await saveApexQuestion({ ...question, examId: assign ? exam.id : null });
    loadData();
  };

  const handleUnlockStageTwo = async (candidateId: string, candidateName: string) => {
    const confirmed = window.confirm(
      `Unlock the candidate's next action for ${candidateName}? The server will reject this if the 24-hour wait is not complete.`
    );

    if (!confirmed) return;

    try {
      await unlockCandidateStageTwo(candidateId);
      window.alert(`Next action unlocked for ${candidateName}.`);
    } catch (err: any) {
      window.alert(err.message || 'Could not unlock the candidate’s next action.');
    }
  };

  if (showNewExamBuilder) {
    return (
      <NewExamBuilderPage
        questions={questions}
        exams={exams}
        onCancel={() => setShowNewExamBuilder(false)}
        onSaved={() => {
          setShowNewExamBuilder(false);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-linear-to-tr from-[#1f4e79] to-[#102a43] rounded-2xl shadow-lg">
            <Sliders className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Atesta Recruiter & Admin Management</h1>
              <span className="text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                System Control
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Configure exam pricing, questions, AI interview pricing, and review the Paystack ledger and interview transcripts.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'exams' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="h-4 w-4 text-emerald-400" />
          <span>Exams & Pricing ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'courses' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="h-4 w-4 text-sky-400" />
          <span>Courses ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'packages' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="h-4 w-4 text-amber-400" />
          <span>Packages ({packages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interview_products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'interview_products' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Video className="h-4 w-4 text-purple-400" />
          <span>AI Interview Pricing ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'questions' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="h-4 w-4 text-indigo-400" />
          <span>Question Bank ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'financials' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <span>Paystack Ledger ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'certificates' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="h-4 w-4 text-rose-400" />
          <span>Certificates ({certificates.filter((c) => c.status === 'pending_approval').length} pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('transcripts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'transcripts' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4 text-amber-400" />
          <span>AI Transcripts ({aiSessions.length})</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={tabSearchQuery}
            onChange={(e) => setTabSearchQuery(e.target.value)}
            placeholder="Search current tab by name, title, candidate, source, or reference..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tab: Exams & Pricing */}
      {activeTab === 'exams' && showNewExamBuilder && (
        <NewExamBuilderPage
          questions={questions}
          exams={exams}
          onCancel={() => setShowNewExamBuilder(false)}
          onSaved={() => {
            setShowNewExamBuilder(false);
            loadData();
          }}
        />
      )}

      {activeTab === 'exams' && !showNewExamBuilder && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Exams</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                One exam per job title. Candidates are auto-matched to the exam whose Job Title matches their application.
              </p>
            </div>
            <button
              onClick={() => setShowNewExamBuilder(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Exam
            </button>
          </div>

          {editingExam && (
            <form onSubmit={handleSaveExam} className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-extrabold text-sm text-emerald-400">Exam Details</span>
                <button type="button" onClick={() => setEditingExam(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Job Title (match key)</label>
                  <input
                    type="text"
                    value={editingExam.jobTitle}
                    onChange={(e) => setEditingExam({ ...editingExam, jobTitle: e.target.value })}
                    placeholder="e.g. English Teacher"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Must exactly match the job's title as posted.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Exam Cost (KSh)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingExam.costKsh || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, costKsh: Number(e.target.value) })}
                    placeholder="Set the price for this exam"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Questions per Attempt</label>
                  <input
                    type="number"
                    min={1}
                    value={editingExam.questionsPerAttempt}
                    onChange={(e) => setEditingExam({ ...editingExam, questionsPerAttempt: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Randomly picked from the question pool below.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Time Limit (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingExam.timeLimitMinutes}
                    onChange={(e) => setEditingExam({ ...editingExam, timeLimitMinutes: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pass Mark (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingExam.passMarkPercent}
                    onChange={(e) => setEditingExam({ ...editingExam, passMarkPercent: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Screening Interview Cost (KSh)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingExam.interviewCostKsh ?? ''}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, interviewCostKsh: e.target.value === '' ? null : Number(e.target.value) })
                    }
                    placeholder="Optional. Leave empty if this exam is only used inside a package"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Optional. Only used when this exam is given on its own, outside a package. Inside a package, the package's Interview screening section (cost and pass mark) is used instead.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Screening Interview Pass Mark (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingExam.interviewPassMarkPercent ?? ''}
                    placeholder="Optional (70 if left empty)"
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, interviewPassMarkPercent: e.target.value === '' ? null : Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Exam Name</label>
                <input
                  type="text"
                  value={editingExam.name}
                  onChange={(e) => setEditingExam({ ...editingExam, name: e.target.value })}
                  placeholder="e.g. English Teacher Competency Assessment"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={editingExam.category || ''}
                  onChange={(e) => setEditingExam({ ...editingExam, category: e.target.value })}
                  placeholder="e.g. Healthcare, Hospitality, IT — used for catalog search/filter"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  value={editingExam.description || ''}
                  onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Exam Type</label>
                <select
                  value={editingExam.examType}
                  onChange={(e) => setEditingExam({ ...editingExam, examType: e.target.value as 'general' | 'professional' })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="general">General — random draw of {editingExam.questionsPerAttempt} questions per attempt</option>
                  <option value="professional">Professional — fixed, admin-curated set (no randomization)</option>
                </select>
                {editingExam.examType === 'professional' && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    Set "Questions per Attempt" above to match the exact number of questions you attach below, so none get cut off.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={editingExam.isActive}
                  onChange={(e) => setEditingExam({ ...editingExam, isActive: e.target.checked })}
                />
                Active (visible to matching candidates)
              </label>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Exam
              </button>
            </form>
          )}

          <div className="space-y-3">
            {filteredExams.length === 0 && <p className="text-center py-8 text-slate-400 text-xs">No exams matched your search.</p>}
            {filteredExams.map((ex) => (
              <div
                key={ex.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{ex.jobTitle}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        ex.examType === 'professional' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {ex.examType === 'professional' ? 'PROFESSIONAL' : 'GENERAL'}
                    </span>
                    {!ex.isActive && <span className="text-[10px] font-extrabold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">INACTIVE</span>}
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">{ex.name}</h4>
                  <p className="text-[11px] text-slate-600">
                    {questions.filter((q) => q.examId === ex.id).length} in pool · picks {ex.questionsPerAttempt} · {ex.timeLimitMinutes} min · pass {ex.passMarkPercent}% · <strong className="text-emerald-700">KSh {ex.costKsh.toLocaleString()}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => openCsvQuestionEditor(ex)}
                    title="Edit questions via CSV"
                    className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setManagingQuestionsForExam(ex)}
                    title="Manage question pool"
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg cursor-pointer"
                  >
                    <ClipboardList className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingExam(ex)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteExam(ex.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {managingQuestionsForExam && (
            <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-extrabold text-sm text-purple-400">Manage Question Pool</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {managingQuestionsForExam.name} ·{' '}
                    {managingQuestionsForExam.examType === 'professional' ? 'Professional — fixed set' : 'General — random draw'}
                  </p>
                </div>
                <button type="button" onClick={() => setManagingQuestionsForExam(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {questions.filter((q) => q.examId === managingQuestionsForExam.id).length} attached · check a question to attach it here, uncheck to return it to the bank.
              </p>
              {savedQuestionImports.length > 0 && (
                <select
                  value={questionPoolImportFilter}
                  onChange={(e) => setQuestionPoolImportFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                >
                  <option value="">Filter by CSV file — all questions</option>
                  {savedQuestionImports.map((imp) => (
                    <option key={imp.id} value={imp.id}>{imp.fileName} ({imp.questionCount})</option>
                  ))}
                </select>
              )}
              {savedQuestionImports.length > 0 && (
                <select
                  value={questionPoolImportFilter}
                  onChange={(e) => setQuestionPoolImportFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="">Filter by CSV file — all questions</option>
                  {savedQuestionImports.map((imp) => (
                    <option key={imp.id} value={imp.id}>{imp.fileName} ({imp.questionCount})</option>
                  ))}
                </select>
              )}
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {[...questions]
                  .filter((q) => !questionPoolImportFilter || (q as any).sourceImportId === questionPoolImportFilter)
                  .sort((a, b) => {
                    const aTop = a.examId === managingQuestionsForExam.id ? 0 : 1;
                    const bTop = b.examId === managingQuestionsForExam.id ? 0 : 1;
                    return aTop - bTop;
                  })
                  .map((q) => {
                  const attached = q.examId === managingQuestionsForExam.id;
                  const attachedElsewhere = !!q.examId && q.examId !== managingQuestionsForExam.id;
                  return (
                    <label
                      key={q.id}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer ${
                        attached ? 'border-purple-500 bg-purple-950/40' : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={attached}
                        onChange={(e) => handleToggleQuestionAssignment(q, managingQuestionsForExam, e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="text-xs">
                        {q.question}
                        {attachedElsewhere && (
                          <span className="block text-[10px] text-amber-400 mt-0.5">
                            Currently in: {exams.find((ex) => ex.id === q.examId)?.name || 'another exam'} — checking this will move it here.
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
                {questions.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No questions in the bank yet — add some in the Question Bank tab.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {csvEditingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Edit Questions {csvEditingExam.name}</h3>
                <p className="text-xs text-slate-500">Import a CSV/Excel file or reuse a saved one, then tick which questions belong to this exam.</p>
              </div>
              <button type="button" onClick={() => setCsvEditingExam(null)} className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
              <label className="px-3 py-2 text-[10px] font-bold text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-100 cursor-pointer whitespace-nowrap flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                {csvEditUploading ? 'Loading…' : 'Upload CSV / Excel File'}
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleCsvEditUpload} disabled={csvEditUploading} className="hidden" />
              </label>
              {savedQuestionImports.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCsvEditShowSavedPicker((v) => !v)}
                    disabled={csvEditUploading}
                    className="px-3 py-2 text-[10px] font-bold text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-100 cursor-pointer whitespace-nowrap"
                  >
                    Use a Saved File
                  </button>
                  {csvEditShowSavedPicker && (
                    <div className="absolute z-10 mt-1 w-64 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
                      {savedQuestionImports.map((imp) => (
                        <button
                          key={imp.id}
                          type="button"
                          onClick={() => handleCsvEditUseSaved(imp.id)}
                          className="block w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          {imp.fileName} <span className="text-slate-400">({imp.questionCount} questions)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {csvEditQuestions.length > 0 && (
                <span className="text-xs font-bold text-emerald-600 ml-auto">{csvEditSelectedIds.size} selected</span>
              )}
              {csvEditError && <p className="w-full text-[11px] font-semibold text-rose-600">{csvEditError}</p>}
            </div>

            <div className="p-6 space-y-2 overflow-y-auto flex-1">
              {csvEditQuestions.length === 0 && !csvEditUploading && (
                <p className="text-center py-8 text-slate-400 text-xs">Upload a CSV or pick a saved file to see its questions here.</p>
              )}
              {csvEditQuestions.map((q) => {
                const checked = csvEditSelectedIds.has(q.id);
                const currentlyOnThisExam = q.examId === csvEditingExam.id;
                return (
                  <label
                    key={q.id}
                    className={`block p-3.5 rounded-2xl border cursor-pointer transition ${
                      checked ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={checked} onChange={() => toggleCsvEditQuestion(q.id)} className="mt-1 h-4 w-4 accent-emerald-600" />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {q.category && (
                            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">{q.category}</span>
                          )}
                          {currentlyOnThisExam && (
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Currently on this exam</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-900">{q.question}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCsvEditingExam(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCsvEditSelections}
                disabled={csvEditSaving || csvEditQuestions.length === 0}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
              >
                {csvEditSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Courses */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Courses</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Short courses candidates can enroll in and pay for independently, or as part of a package.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingCourse({
                  id: `course-${Date.now()}`,
                  name: '',
                  description: '',
                  category: '',
                  durationDays: 2,
                  costKsh: 0,
                  passMarkPercent: 70,
                  isActive: true
                })
              }
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Course
            </button>
          </div>

{editingCourse && (
            <form onSubmit={handleSaveCourse} className="p-5 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-extrabold text-sm text-slate-900">Course Details</span>
                <button type="button" onClick={() => setEditingCourse(null)} className="p-1 text-slate-400 hover:text-slate-900">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Course Name</label>
                <input
                  type="text"
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  placeholder="e.g. Workplace Communication Essentials"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingCourse.category || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    placeholder="e.g. Soft Skills"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingCourse.durationDays}
                    onChange={(e) => setEditingCourse({ ...editingCourse, durationDays: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Course Cost (KSh)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingCourse.costKsh || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, costKsh: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={editingCourse.isActive}
                  onChange={(e) => setEditingCourse({ ...editingCourse, isActive: e.target.checked })}
                />
                Active (visible in the open catalog)
              </label>

              <div className="border-t border-slate-200 pt-3">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Course Material (PDF or Word) - optional
                </label>
                <p className="text-[10px] text-slate-500 mb-2">
                  Candidates can open and preview this file, or download it, while working through the course.
                  Uploading a new file replaces the current one. Only a saved course (click "Save Course" first,
                  then re-open it from the list below using the edit icon) can have a file attached. Added for sometime, but I will delete it 
                </p>

                {editingCourse.documentUrl && (
                  <div className="flex items-center flex-wrap gap-3 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                      <FileText className="h-3.5 w-3.5" />
                      Current file: {editingCourse.documentName || 'document'}
                    </span>
                    <a href={"https://docs.google.com/viewer?url=" + encodeURIComponent(editingCourse.documentUrl) + "&embedded=true"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900">
                      <Eye className="h-3.5 w-3.5" /> View
                    </a>
                    <a href={editingCourse.documentUrl} download={editingCourse.documentName || 'course-material'} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900">
                      <FileDown className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                )}

                <input
                  type="file"
                  accept="application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={uploadingCourseDoc}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadCourseDocument(editingCourse.id, file);
                    e.target.value = '';
                  }}
                  className="block w-full text-[11px] text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                {uploadingCourseDoc && <p className="text-[10px] text-slate-500 mt-1">Uploading...</p>}
                {courseDocUploadError && <p className="text-[10px] text-rose-600 mt-1">{courseDocUploadError}</p>}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Course
              </button>
            </form>
          )}

          <div className="space-y-3">
            {filteredCourses.length === 0 && <p className="text-center py-8 text-slate-400 text-xs">No courses matched your search.</p>}
            {filteredCourses.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-sky-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {c.category && <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">{c.category}</span>}
                    {!c.isActive && <span className="text-[10px] font-extrabold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">INACTIVE</span>}
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">{c.name}</h4>
                  <p className="text-[11px] text-slate-600">
                    {(c.modules || []).length} modules · {c.durationDays} days · pass {c.passMarkPercent}% · <strong className="text-sky-700">KSh {c.costKsh.toLocaleString()}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => setManagingModulesForCourse(c)}
                    title="Manage modules"
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg cursor-pointer"
                  >
                    <ClipboardList className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingCourse(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteCourse(c.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {managingModulesForCourse && (
            <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-extrabold text-sm text-purple-400">Manage Modules</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{managingModulesForCourse.name}</p>
                </div>
                <button type="button" onClick={() => setManagingModulesForCourse(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={() =>
                  setEditingModule({
                    id: `module-${Date.now()}`,
                    courseId: managingModulesForCourse.id,
                    title: '',
                    contentType: 'text',
                    contentBody: '',
                    contentUrl: '',
                    summary: '',
                    externalLink: '',
                    externalLinkLabel: '',
                    quiz: [],
                    orderIndex: (managingModulesForCourse.modules || []).length
                  })
                }
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Module
              </button>

              {editingModule && (
                <form onSubmit={handleSaveModule} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Module Title</label>
                    <input
                      type="text"
                      value={editingModule.title}
                      onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Order</label>
                    <input
                      type="number"
                      min={0}
                      value={editingModule.orderIndex}
                      onChange={(e) => setEditingModule({ ...editingModule, orderIndex: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Notes (supports many paragraphs)</label>
                    <p className="text-[10px] text-slate-400 mb-1.5">
                      Type or paste your notes bold, italic, underline and color all work. Paste straight from the PDF: each
                      paragraph keeps the exact spacing it had in the source, no manual clean-up needed. To add an entry to the
                      candidate's Table of Contents, put the cursor on that line and click <strong>Subtitle</strong>.
                    </p>
                    <NotesRichEditor
                      value={editingModule.contentBody || ''}
                      onChange={(html) => setEditingModule({ ...editingModule, contentBody: html })}
                      placeholder="Write or paste the module notes here..."
                    />
                    {(() => {
                      const headings = getTocHeadings(editingModule.contentBody || '');
                      return headings.length > 0 ? (
                        <div className="mt-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Table of Contents Preview</p>
                          <div className="flex flex-wrap gap-1.5">
                            {headings.map((h, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-indigo-300">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-500 mt-1.5">
                          No subtitles yet — select a line and click "Subtitle" to add one to the candidate's Table of Contents.
                        </p>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Summary (2–5 paragraphs, shown after the notes)</label>
                    <textarea
                      value={editingModule.summary || ''}
                      onChange={(e) => setEditingModule({ ...editingModule, summary: e.target.value })}
                      rows={4}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Video URL — optional</label>
                    <input
                      type="text"
                      value={editingModule.contentUrl || ''}
                      onChange={(e) => setEditingModule({ ...editingModule, contentUrl: e.target.value })}
                      placeholder="YouTube or hosted video link"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">External Link — optional</label>
                      <input
                        type="text"
                        value={editingModule.externalLink || ''}
                        onChange={(e) => setEditingModule({ ...editingModule, externalLink: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Link Label</label>
                      <input
                        type="text"
                        value={editingModule.externalLinkLabel || ''}
                        onChange={(e) => setEditingModule({ ...editingModule, externalLinkLabel: e.target.value })}
                        placeholder="e.g. Watch on YouTube"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Study Material (PDF) — optional
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">
                      Candidates can download this while working through the module. Uploading a new PDF replaces the
                      current one. Only saved modules (click "Save Module" first, then re-open it from the list below)
                      can have a PDF attached.
                    </p>

                    {editingModule.documentUrl && (
                      <a
                        href={editingModule.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-400 hover:text-sky-300 mb-2"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Current file: {editingModule.documentName || 'document.pdf'}
                      </a>
                    )}

                    <input
                      type="file"
                      accept="application/pdf"
                      disabled={uploadingDocFor === editingModule.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadModuleDocument(editingModule.id, file);
                        e.target.value = '';
                      }}
                      className="block w-full text-[11px] text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
                    />
                    {uploadingDocFor === editingModule.id && (
                      <p className="text-[10px] text-sky-400 mt-1">Uploading…</p>
                    )}
                    {docUploadError && <p className="text-[10px] text-rose-400 mt-1">{docUploadError}</p>}
                    {editingModule.documentUrl && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleGenerateFromPdf}
                          disabled={generatingAi}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          {generatingAi ? 'Generating…' : '✨ Generate Notes, Summary & Quiz from this PDF'}
                        </button>
                        {aiError && <p className="text-[10px] text-rose-400 mt-1">{aiError}</p>}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-3">
                    <label className="block text-xs font-bold text-slate-300 mb-2">Sample Questions (quiz shown after the summary)</label>

                    {(editingModule.quiz || []).map((q) => (
                      <div key={q.id} className="flex items-start justify-between gap-2 p-2.5 mb-2 rounded-xl border border-slate-800 bg-slate-900">
                        <div className="text-[11px] text-slate-200">
                          <p className="font-bold">{q.question}</p>
                          <p className="text-slate-400 mt-0.5">Correct: {q.options[q.correctIndex]}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveQuizQuestion(q.id)} className="p-1 text-rose-400 hover:bg-rose-950 rounded-lg cursor-pointer shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <input
                        type="text"
                        value={quizDraft.question}
                        onChange={(e) => setQuizDraft({ ...quizDraft, question: e.target.value })}
                        placeholder="Question text"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                      {quizDraft.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={quizDraft.correctIndex === i}
                            onChange={() => setQuizDraft({ ...quizDraft, correctIndex: i })}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const options = [...quizDraft.options];
                              options[i] = e.target.value;
                              setQuizDraft({ ...quizDraft, options });
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddQuizQuestion}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                      >
                        + Add Question
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" /> Save Module
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {(managingModulesForCourse.modules || []).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No modules yet.</p>
                )}
                {(managingModulesForCourse.modules || [])
                  .slice()
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950">
                      <span className="text-xs flex items-center gap-1.5">
                        {m.orderIndex + 1}. {m.title}
                        {m.documentUrl && <FileText className="h-3 w-3 text-sky-400"><title>Has PDF</title></FileText>}
                        {m.contentUrl && <Video className="h-3 w-3 text-purple-400"><title>Has video</title></Video>}
                        {m.externalLink && <Link2 className="h-3 w-3 text-emerald-400"><title>Has external link</title></Link2>}
                        {m.quiz && m.quiz.length > 0 && <HelpCircle className="h-3 w-3 text-amber-400"><title>{m.quiz.length} quiz question(s)</title></HelpCircle>}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingModule({ ...m, contentBody: toEditableNotesHtml(m.contentBody) })} className="p-1.5 text-indigo-400 hover:bg-indigo-950 rounded-lg cursor-pointer">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteModule(m.id)} className="p-1.5 text-rose-400 hover:bg-rose-950 rounded-lg cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Packages */}
      {activeTab === 'packages' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Packages</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Combine one existing exam and one existing course under a single price. Candidates can start with either half.
              </p>
            </div>
            <button
              onClick={() =>
                setEditingPackage({
                  id: `package-${Date.now()}`,
                  name: '',
                  packageId: suggestPackageId(packages),
                  description: '',
                  category: '',
                  examIds: [] as string[],
                  courseIds: [] as string[],
                  interviewCostKsh: 0,
                  interviewPassMarkPercent: 70,
                  costKsh: 0,
                  certificateRule: 'AND',
                  isActive: true
                })
              }
              disabled={exams.length === 0 || courses.length === 0}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> New Package
            </button>
          </div>

          {(exams.length === 0 || courses.length === 0) && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              Create at least one exam and one course before building a package.
            </p>
          )}

          {editingPackage && (
            <form onSubmit={handleSavePackage} className="p-5 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-extrabold text-sm text-slate-900">Package Details</span>
                <button type="button" onClick={() => setEditingPackage(null)} className="p-1 text-slate-400 hover:text-slate-900">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Package Name</label>
                <input
                  type="text"
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-2">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wide block">
                  Package ID (you choose this)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingPackage.packageId || ''}
                    onChange={(e) => {
                      const lettersOnly = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();
                      setEditingPackage({ ...editingPackage, packageId: lettersOnly });
                    }}
                    placeholder="e.g. FHSORG"
                    maxLength={6}
                    className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-xl text-lg font-black text-slate-900 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingPackage({ ...editingPackage, packageId: suggestPackageId(packages) })}
                    className="px-3 py-2 text-[10px] font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                  >
                    Suggest ID
                  </button>
                </div>
                {packageIdError && <p className="text-[10px] text-rose-600 font-semibold">{packageIdError}</p>}
                <p className="text-[10px] text-slate-500">
                  Up to 6 letters, automatically capitalized. Shown to candidates right after the package title.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Exams (select all that apply)</label>
                  <div className="relative mb-1.5">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={packageExamSearch}
                      onChange={(e) => setPackageExamSearch(e.target.value)}
                      placeholder="Search exams by name or keyword..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                    {exams
                      .filter((ex) => {
                        const q = packageExamSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          ex.name.toLowerCase().includes(q) ||
                          ex.jobTitle.toLowerCase().includes(q) ||
                          (ex.category || '').toLowerCase().includes(q)
                        );
                      })
                      .map((ex) => (
                      <label key={ex.id} className="flex items-center gap-2 text-xs text-slate-700 px-1 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(editingPackage.examIds || []).includes(ex.id)}
                          onChange={(e) => {
                            const current = editingPackage.examIds || [];
                            const next = e.target.checked ? [...current, ex.id] : current.filter((id) => id !== ex.id);
                            setEditingPackage({ ...editingPackage, examIds: next });
                          }}
                        />
                        {ex.name} — KSh {ex.costKsh.toLocaleString()}
                      </label>
                    ))}
                    {exams.length > 0 && exams.filter((ex) => {
                      const q = packageExamSearch.trim().toLowerCase();
                      if (!q) return true;
                      return ex.name.toLowerCase().includes(q) || ex.jobTitle.toLowerCase().includes(q) || (ex.category || '').toLowerCase().includes(q);
                    }).length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-2">No exams match "{packageExamSearch}".</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Courses (select all that apply)</label>
                  <div className="relative mb-1.5">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={packageCourseSearch}
                      onChange={(e) => setPackageCourseSearch(e.target.value)}
                      placeholder="Search courses by name or keyword..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                    {courses
                      .filter((c) => {
                        const q = packageCourseSearch.trim().toLowerCase();
                        if (!q) return true;
                        return c.name.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q);
                      })
                      .map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 px-1 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(editingPackage.courseIds || []).includes(c.id)}
                          onChange={(e) => {
                            const current = editingPackage.courseIds || [];
                            const next = e.target.checked ? [...current, c.id] : current.filter((id) => id !== c.id);
                            setEditingPackage({ ...editingPackage, courseIds: next });
                          }}
                        />
                        {c.name}
                      </label>
                    ))}
                    {courses.length > 0 && courses.filter((c) => {
                      const q = packageCourseSearch.trim().toLowerCase();
                      if (!q) return true;
                      return c.name.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q);
                    }).length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-2">No courses match "{packageCourseSearch}".</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">AI Interview Cost (KSh)</label>
                    <input
                      type="number"
                      min={0}
                      value={editingPackage.interviewCostKsh ?? 0}
                      onChange={(e) => setEditingPackage({ ...editingPackage, interviewCostKsh: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">AI Interview Pass Mark (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editingPackage.interviewPassMarkPercent ?? 70}
                      onChange={(e) => setEditingPackage({ ...editingPackage, interviewPassMarkPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                <input
                  type="text"
                  value={editingPackage.category || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  value={editingPackage.description || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Certificate Rule</label>
                <select
                  value={editingPackage.certificateRule}
                  onChange={(e) => setEditingPackage({ ...editingPackage, certificateRule: e.target.value as 'AND' | 'OR' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                >
                  <option value="AND">AND — candidate must complete both the exam and the course</option>
                  <option value="OR">OR — candidate can qualify by completing either one</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={editingPackage.isActive}
                  onChange={(e) => setEditingPackage({ ...editingPackage, isActive: e.target.checked })}
                />
                Active (visible in the open catalog)
              </label>

              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Package
              </button>
            </form>
          )}

          {instructionsPackage && (
            <PackageInstructionsModal
              pkg={instructionsPackage}
              onClose={() => setInstructionsPackage(null)}
              onSave={async (updated) => {
                await saveApexPackage(updated);
                setPackages(await getApexPackages());
                setInstructionsPackage(null);
              }}
            />
          )}

          <div className="space-y-3">
            {filteredPackages.length === 0 && <p className="text-center py-8 text-slate-400 text-xs">No packages matched your search.</p>}
            {filteredPackages.map((p) => {
              const pExamIds: string[] = Array.isArray(p.examIds) && p.examIds.length > 0 ? p.examIds : p.examId ? [p.examId] : [];
              const pCourseIds: string[] = Array.isArray(p.courseIds) && p.courseIds.length > 0 ? p.courseIds : p.courseId ? [p.courseId] : [];
              return (
                <div
                  key={p.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-amber-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {p.category && <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{p.category}</span>}
                      <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{p.certificateRule}</span>
                      {!p.isActive && <span className="text-[10px] font-extrabold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">INACTIVE</span>}
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      {p.name}
                      {p.packageId && <span className="text-slate-900"> - {p.packageId}</span>}
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      {pExamIds.length} exam{pExamIds.length === 1 ? '' : 's'} + {pCourseIds.length} course{pCourseIds.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button onClick={() => setInstructionsPackage(p)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer" title="Edit Instructions & Guidelines">
                      <FileText className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingPackage(p)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeletePackage(p.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: AI Interview Pricing */}
      {activeTab === 'interview_products' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">AI Interview Pricing</h3>
              <p className="text-xs text-slate-500 mt-0.5">Same auto-match rule: one package per job title.</p>
            </div>
            <button
              onClick={() =>
                setEditingProduct({ id: `interview-${Date.now()}`, jobTitle: '', name: '', description: '', costKsh: 4000, isActive: true })
              }
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Package
            </button>
          </div>

          {editingProduct && (
            <form onSubmit={handleSaveProduct} className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-extrabold text-sm text-purple-400">AI Interview Package Details</span>
                <button type="button" onClick={() => setEditingProduct(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Job Title (match key)</label>
                  <input
                    type="text"
                    value={editingProduct.jobTitle}
                    onChange={(e) => setEditingProduct({ ...editingProduct, jobTitle: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cost (KSh)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingProduct.costKsh}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costKsh: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Package Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={editingProduct.isActive}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                />
                Active
              </label>

              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Package
              </button>
            </form>
          )}

          <div className="space-y-3">
            {filteredProducts.length === 0 && <p className="text-center py-8 text-slate-400 text-xs">No AI interview packages matched your search.</p>}
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-purple-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">{p.jobTitle}</span>
                    {!p.isActive && <span className="text-[10px] font-extrabold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">INACTIVE</span>}
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">{p.name}</h4>
                  <p className="text-[11px] text-slate-600">
                    <strong className="text-purple-700">KSh {p.costKsh.toLocaleString()}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button onClick={() => setEditingProduct(p)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Question Bank */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={questionSearchQuery}
                onChange={(e) => setQuestionSearchQuery(e.target.value)}
                placeholder="Search questions or exam name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="px-4 py-2 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                {uploadingCsv ? 'Uploading…' : 'Upload CSV / Excel File'}
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleUploadQuestionsCsv}
                  disabled={uploadingCsv}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  setIsNewQuestion(true);
                  setEditingQuestion({
                    id: `apex-q-${Date.now()}`,
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    category: '',
                    points: 2,
                    examId: null
                  });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Question
              </button>
            </div>
          </div>

          {csvUploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
              {csvUploadError}
            </div>
          )}
          {csvUploadResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold space-y-1">
              <p>
                Loaded {csvUploadResult.inserted} of {csvUploadResult.totalRows} rows into the question pool
                {csvUploadResult.skipped > 0 ? ` (${csvUploadResult.skipped} skipped)` : ''}.
              </p>
              {csvUploadResult.rowErrors.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-emerald-900/80">
                  {csvUploadResult.rowErrors.slice(0, 10).map((e, i) => (
                    <li key={i}>Row {e.row}: {e.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Questions live in a shared bank. Attach them to an exam from the Exams tab once you're ready to build a test.
          </p>

          {editingQuestion && (
            <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-extrabold text-sm text-indigo-400">
                  {isNewQuestion ? 'Add New Question' : 'Edit Question'}
                </span>
                <button onClick={() => setEditingQuestion(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Exam (optional — assign now or later)</label>
                  <select
                    value={editingQuestion.examId || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, examId: e.target.value || null })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="">— Unassigned (leave in the question bank) —</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Question Prompt Text</label>
                  <textarea
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                    rows={2}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Correct Answer Index</label>
                  <select
                    value={editingQuestion.correctAnswer}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value={0}>Option A (Index 0)</option>
                    <option value={1}>Option B (Index 1)</option>
                    <option value={2}>Option C (Index 2)</option>
                    <option value={3}>Option D (Index 3)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">Answer Choices (4 Options)</label>
                  {editingQuestion.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs font-bold text-indigo-400">{String.fromCharCode(65 + idx)}:</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...editingQuestion.options];
                          newOpts[idx] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: newOpts });
                        }}
                        required
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" /> Save Question
                </button>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      {exams.find((ex) => ex.id === q.examId)?.name || 'Unassigned exam'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">ID: {q.id}</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">{q.question}</h4>
                  <p className="text-[11px] text-slate-600">
                    Correct Option: <strong className="text-emerald-700">{q.options[q.correctAnswer]}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => {
                      setIsNewQuestion(false);
                      setEditingQuestion(q);
                    }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Paystack Financial Ledger */}
      {activeTab === 'financials' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Paystack Payment Audit Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time transaction history for candidate assessment payments (M-Pesa, Visa, Airtel Money).
              </p>
            </div>
            <span className="text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl">
              Paystack Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="p-3">Transaction Ref</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Amount (KSh)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                      No Paystack candidate payments matched your search.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{p.transactionRef}</td>
                      <td className="p-3">
                        <span className="font-bold block text-slate-900">{p.candidateName}</span>
                        <span className="text-[10px] text-slate-400">{p.candidateEmail}</span>
                      </td>
                      <td className="p-3 font-semibold text-indigo-700">
                        {p.stage === 'stage_1_assessment' ? 'Stage 1 Assessment' : 'Stage 2 AI Interview'}
                      </td>
                      <td className="p-3 uppercase font-extrabold text-slate-700">{p.provider}</td>
                      <td className="p-3 font-black text-emerald-700">KSh {p.amountKsh.toLocaleString()}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded text-[10px]">APPROVED</span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        {p.stage === 'stage_1_assessment' ? (
                          <button
                            type="button"
                            onClick={() => handleUnlockStageTwo(p.candidateId, p.candidateName)}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Unlock next action
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Certificate Approval Queue */}
      {activeTab === 'certificates' && showCertificateGenerator && (
        <CertificateGeneratorPanel
          onClose={() => setShowCertificateGenerator(false)}
          onGenerated={(cert) => {
            setCertificates((prev) => [cert, ...prev]);
            setShowCertificateGenerator(false);
          }}
        />
      )}

      {activeTab === 'certificates' && !showCertificateGenerator && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-rose-500" />
                Certificate Approval Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                A certificate only becomes downloadable to the candidate once you approve it here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCertificateGenerator(true)}
              className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
            >
              + Generate Certificate
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Verification Code</th>
                  <th className="p-3">PDF</th>
                  <th className="p-3">Issued</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                      No certificates matched your search.
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.candidateName}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-700 block">{c.sourceName}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{c.sourceType}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{c.verificationCode}</td>
                      <td className="p-3">{c.pdfUrl ? (<button type="button" onClick={() => handlePreviewCertificatePdf(c.id)} disabled={previewLoadingId === c.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold disabled:opacity-50"><Download className="h-3 w-3" /> {previewLoadingId === c.id ? 'Loading…' : 'View Certificate'}</button>) : (<span className="text-[10px] text-slate-400">Generating…</span>)}</td>
                      <td className="p-3 text-[11px] text-slate-500">{new Date(c.issuedAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        {c.status === 'approved' ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded text-[10px] w-fit">
                            <CheckCircle2 className="h-3 w-3" /> APPROVED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold rounded text-[10px] w-fit">
                            <Clock3 className="h-3 w-3" /> PENDING
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {c.status === 'approved' ? (
                          <span className="text-[10px] text-slate-400">—</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApproveCertificate(c.id)}
                            disabled={approvingCertId === c.id}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {approvingCertId === c.id ? 'Approving…' : 'Approve'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewPdf && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4" onClick={() => setPreviewPdf(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-900">Certificate — {previewPdf.verificationCode}</span>
              <div className="flex items-center gap-2">
                <a href={previewPdf.url} download={`${previewPdf.verificationCode}.pdf`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"><Download className="h-3.5 w-3.5" /> Download</a>
                <button type="button" onClick={() => setPreviewPdf(null)} className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-bold">Close</button>
              </div>
            </div>
            <iframe src={previewPdf.url} title="Certificate PDF" className="flex-1 w-full" />
          </div>
        </div>
      )}

      {/* Tab: AI Transcripts */}
      {activeTab === 'transcripts' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              Candidate AI Interview Transcripts & Evaluation Scorecards
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Review completed AI Agent interview sessions and transcript logs.</p>
          </div>

          <div className="space-y-4">
            {filteredAiSessions.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs">No completed AI Interview sessions matched your search.</p>
            ) : (
              filteredAiSessions.map((sess) => (
                <div key={sess.id} className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-200">{sess.candidateName}</span>
                      <span className="text-[10px] text-slate-400 block">{sess.candidateEmail}</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-lg">AI Score: {sess.score}%</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl space-y-2 max-h-48 overflow-y-auto text-xs">
                    {sess.transcript?.map((t, i) => (
                      <div key={i} className="space-y-0.5">
                        <span className={`text-[10px] font-bold ${t.speaker === 'AI Recruiter' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                          {t.speaker} ({t.timestamp}):
                        </span>
                        <p className="text-slate-300 leading-relaxed pl-2 border-l border-slate-800">{t.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};