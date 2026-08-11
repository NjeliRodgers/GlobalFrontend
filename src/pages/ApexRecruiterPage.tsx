import React, { useState, useEffect } from 'react';
import { ApexQuestion, ApexExam, ApexInterviewProduct, ApexCourse, ApexCourseModule, ApexPackage, PaystackPayment, AiInterviewSession, ApexCertificate } from '../types';
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
  getPaystackPayments,
  getAiInterviewSessions,
  unlockCandidateStageTwo,
  getApexCertificates,
  approveApexCertificate,
  getApexCourses,
  saveApexCourse,
  deleteApexCourse,
  saveApexCourseModule,
  deleteApexCourseModule,
  uploadApexCourseModuleDocument,
  getApexPackages,
  saveApexPackage,
  deleteApexPackage
} from '../api/apexAssessmentApi';
import { NewExamBuilderPage } from './NewExamBuilderPage';
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
  Clock3
} from 'lucide-react';

type Tab = 'exams' | 'courses' | 'packages' | 'interview_products' | 'questions' | 'financials' | 'certificates' | 'transcripts';

export const ApexRecruiterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('exams');

  // Exams
  const [exams, setExams] = useState<ApexExam[]>([]);
  const [editingExam, setEditingExam] = useState<ApexExam | null>(null);
  const [managingQuestionsForExam, setManagingQuestionsForExam] = useState<ApexExam | null>(null);
  const [showNewExamBuilder, setShowNewExamBuilder] = useState(false);

  // Courses
  const [courses, setCourses] = useState<ApexCourse[]>([]);
  const [editingCourse, setEditingCourse] = useState<ApexCourse | null>(null);
  const [managingModulesForCourse, setManagingModulesForCourse] = useState<ApexCourse | null>(null);
  const [editingModule, setEditingModule] = useState<ApexCourseModule | null>(null);
  const [uploadingDocFor, setUploadingDocFor] = useState<string | null>(null);
  const [docUploadError, setDocUploadError] = useState('');

  // Packages
  const [packages, setPackages] = useState<ApexPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<ApexPackage | null>(null);

  // Interview Products
  const [products, setProducts] = useState<ApexInterviewProduct[]>([]);
  const [editingProduct, setEditingProduct] = useState<ApexInterviewProduct | null>(null);

  // Questions
  const [questions, setQuestions] = useState<ApexQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<ApexQuestion | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);

  // Financial Ledger
  const [payments, setPayments] = useState<PaystackPayment[]>([]);

  // AI Transcripts
  const [aiSessions, setAiSessions] = useState<AiInterviewSession[]>([]);

  // Certificates
  const [certificates, setCertificates] = useState<ApexCertificate[]>([]);
  const [approvingCertId, setApprovingCertId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
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

  const handleDeleteModule = async (id: string) => {
    if (confirm('Delete this module?')) {
      await deleteApexCourseModule(id);
      loadData();
    }
  };

  // ── Packages ──
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    await saveApexPackage(editingPackage);
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
  const filteredQuestions = questions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exams.find((ex) => ex.id === q.examId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    await saveApexQuestion(editingQuestion);
    setEditingQuestion(null);
    setIsNewQuestion(false);
    loadData();
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Delete this question from the Apex question bank?')) {
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
              <h1 className="text-2xl font-black text-white">Apex Recruiter & Admin Management</h1>
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
                  <label className="block text-xs font-bold text-slate-300 mb-1">AI Interview Cost (KSh)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingExam.interviewCostKsh ?? 0}
                    onChange={(e) => setEditingExam({ ...editingExam, interviewCostKsh: Number(e.target.value) })}
                    placeholder="Leave 0 to keep the interview stage hidden"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Only unlocks for a candidate once they've passed this exam.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">AI Interview Pass Mark (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingExam.interviewPassMarkPercent ?? 70}
                    onChange={(e) => setEditingExam({ ...editingExam, interviewPassMarkPercent: Number(e.target.value) })}
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
            {exams.length === 0 && <p className="text-center py-8 text-slate-400 text-xs">No exams created yet.</p>}
            {exams.map((ex) => (
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
              <p className="text-[11px] text-slate-400">
                {questions.filter((q) => q.examId === managingQuestionsForExam.id).length} attached · check a question to attach it here, uncheck to return it to the bank.
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {questions.map((q) => {
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
            <form onSubmit={handleSaveCourse} className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-extrabold text-sm text-sky-400">Course Details</span>
                <button type="button" onClick={() => setEditingCourse(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Course Name</label>
                <input
                  type="text"
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  placeholder="e.g. Workplace Communication Essentials"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingCourse.category || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    placeholder="e.g. Soft Skills"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingCourse.durationDays}
                    onChange={(e) => setEditingCourse({ ...editingCourse, durationDays: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Course Cost (KSh)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingCourse.costKsh || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, costKsh: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={editingCourse.isActive}
                  onChange={(e) => setEditingCourse({ ...editingCourse, isActive: e.target.checked })}
                />
                Active (visible in the open catalog)
              </label>

              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Course
              </button>
            </form>
          )}

          <div className="space-y-3">
            {courses.length === 0 && <p className="text-center py-8 text-slate-400 text-xs">No courses created yet.</p>}
            {courses.map((c) => (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Content Type</label>
                      <select
                        value={editingModule.contentType}
                        onChange={(e) => setEditingModule({ ...editingModule, contentType: e.target.value as 'text' | 'video' | 'quiz' })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      >
                        <option value="text">Text</option>
                        <option value="video">Video</option>
                        <option value="quiz">Quiz</option>
                      </select>
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
                  </div>
                  {editingModule.contentType === 'video' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Video URL</label>
                      <input
                        type="text"
                        value={editingModule.contentUrl || ''}
                        onChange={(e) => setEditingModule({ ...editingModule, contentUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Content</label>
                      <textarea
                        value={editingModule.contentBody || ''}
                        onChange={(e) => setEditingModule({ ...editingModule, contentBody: e.target.value })}
                        rows={3}
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  )}

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
                        {m.orderIndex + 1}. {m.title} <span className="text-slate-500">({m.contentType})</span>
                        {m.documentUrl && <FileText className="h-3 w-3 text-sky-400" titleAccess="Has PDF" />}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingModule(m)} className="p-1.5 text-indigo-400 hover:bg-indigo-950 rounded-lg cursor-pointer">
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
                  description: '',
                  category: '',
                  examId: exams[0]?.id || '',
                  courseId: courses[0]?.id || '',
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
            <form onSubmit={handleSavePackage} className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-extrabold text-sm text-amber-400">Package Details</span>
                <button type="button" onClick={() => setEditingPackage(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Package Name</label>
                <input
                  type="text"
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Exam</label>
                  <select
                    value={editingPackage.examId}
                    onChange={(e) => setEditingPackage({ ...editingPackage, examId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Course</label>
                  <select
                    value={editingPackage.courseId}
                    onChange={(e) => setEditingPackage({ ...editingPackage, courseId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingPackage.category || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Combined Package Cost (KSh)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingPackage.costKsh || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, costKsh: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  value={editingPackage.description || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Certificate Rule</label>
                <select
                  value={editingPackage.certificateRule}
                  onChange={(e) => setEditingPackage({ ...editingPackage, certificateRule: e.target.value as 'AND' | 'OR' })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="AND">AND — candidate must complete both the exam and the course</option>
                  <option value="OR">OR — candidate can qualify by completing either one</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={editingPackage.isActive}
                  onChange={(e) => setEditingPackage({ ...editingPackage, isActive: e.target.checked })}
                />
                Active (visible in the open catalog)
              </label>

              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Package
              </button>
            </form>
          )}

          <div className="space-y-3">
            {packages.length === 0 && <p className="text-center py-8 text-slate-400 text-xs">No packages created yet.</p>}
            {packages.map((p) => {
              const exam = exams.find((ex) => ex.id === p.examId);
              const course = courses.find((c) => c.id === p.courseId);
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
                    <h4 className="text-xs font-extrabold text-slate-900">{p.name}</h4>
                    <p className="text-[11px] text-slate-600">
                      {exam?.name || 'Unknown exam'} + {course?.name || 'Unknown course'} · <strong className="text-amber-700">KSh {p.costKsh.toLocaleString()}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
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
            {products.length === 0 && <p className="text-center py-8 text-slate-400 text-xs">No AI interview packages created yet.</p>}
            {products.map((p) => (
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions or exam name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

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
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                      No Paystack candidate payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
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
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-rose-500" />
              Certificate Approval Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              A certificate only becomes downloadable to the candidate once you approve it here.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Verification Code</th>
                  <th className="p-3">Issued</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                      No certificates issued yet.
                    </td>
                  </tr>
                ) : (
                  certificates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.candidateName}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-700 block">{c.sourceName}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{c.sourceType}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{c.verificationCode}</td>
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
            {aiSessions.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs">No completed AI Interview sessions found yet.</p>
            ) : (
              aiSessions.map((sess) => (
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