import React, { useMemo, useState } from 'react';
import { ApexExam, ApexQuestion } from '../types';
import { saveApexExam, saveApexQuestion } from '../api/apexAssessmentApi';
import {
  ArrowLeft,
  Save,
  Search,
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
  LoaderCircle,
  Info,
  SlidersHorizontal,
  Bot,
  Eye
} from 'lucide-react';

interface NewExamBuilderPageProps {
  questions: ApexQuestion[];
  exams: ApexExam[];
  onCancel: () => void;
  onSaved: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const fieldClass =
  'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';
const labelClass = 'block text-xs font-bold text-slate-700 mb-1';
const hintClass = 'text-[10px] text-slate-400 mt-1';

const suggestExamId = (existing: ApexExam[]): string => {
  let candidate = '';
  do {
    candidate = String(Math.floor(10000 + Math.random() * 90000)); // always 5 digits: 10000-99999
  } while (existing.some((e) => e.id === candidate));
  return candidate;
};

export const NewExamBuilderPage: React.FC<NewExamBuilderPageProps> = ({ questions, exams, onCancel, onSaved }) => {
  const [draft, setDraft] = useState<ApexExam>({
    id: '',
    jobTitle: '',
    name: '',
    category: '',
    description: '',
    costKsh: 0,
    isActive: true,
    questionsPerAttempt: 50,
    timeLimitMinutes: 30,
    passMarkPercent: 70,
    examType: 'general',
    interviewCostKsh: 0,
    interviewPassMarkPercent: 70
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [autoSelectMessage, setAutoSelectMessage] = useState('');

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-select questions from the pool that relate to a keyword (e.g. "security"),
  // matched against the question text and its category. Picks exactly as many
  // as "Questions per Attempt" asks for. To avoid handing out the exact same
  // set every time the same keyword is used for a different exam, it favors
  // questions that aren't attached to any other exam yet, and shuffles the
  // pool each time — so overlap can happen (especially with a small bank),
  // but the result isn't identical run to run. The admin can still manually
  // tick/untick individual questions afterward using the existing checkboxes.
  const shuffleQuestions = (arr: ApexQuestion[]): ApexQuestion[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const handleAutoSelectByKeyword = () => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return;

    const matches = questions.filter(
      (q) => q.question.toLowerCase().includes(kw) || (q.category || '').toLowerCase().includes(kw)
    );
    const required = draft.questionsPerAttempt || 0;

    const isUsedElsewhere = (q: ApexQuestion) => !!q.examId && exams.some((ex) => ex.id === q.examId);
    const unused = shuffleQuestions(matches.filter((q) => !isUsedElsewhere(q)));
    const usedElsewhere = shuffleQuestions(matches.filter(isUsedElsewhere));
    const orderedPool = [...unused, ...usedElsewhere];

    const picked = required > 0 ? orderedPool.slice(0, required) : orderedPool;
    setSelectedIds(new Set(picked.map((q) => q.id)));

    if (matches.length === 0) {
      setAutoSelectMessage(
        `No questions found matching "${keyword.trim()}" — try a different keyword, or add matching questions to the Question Bank first.`
      );
    } else if (required > 0 && matches.length < required) {
      setAutoSelectMessage(
        `Only found ${matches.length} of ${required} required questions matching "${keyword.trim()}" — selected all ${matches.length}. Add more matching questions to the bank, or tick extras manually below.`
      );
    } else {
      const reusedCount = picked.filter(isUsedElsewhere).length;
      const freshCount = picked.length - reusedCount;
      setAutoSelectMessage(
        reusedCount > 0
          ? `Selected ${picked.length} questions matching "${keyword.trim()}" — ${freshCount} not used in any other exam yet, ${reusedCount} reused from another exam to reach the required count.`
          : `Selected ${picked.length} question${picked.length === 1 ? '' : 's'} matching "${keyword.trim()}", none currently used in any other exam.`
      );
    }
  };

  const filteredQuestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (item) => item.question.toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q)
    );
  }, [questions, searchQuery]);

  const selectedCount = selectedIds.size;
  const required = draft.questionsPerAttempt || 0;
  const countMismatch = required > 0 && selectedCount !== required;

  const idIsValidFormat = /^\d{5}$/.test(draft.id);
  const idIsTaken = idIsValidFormat && exams.some((e) => e.id === draft.id);

  const canSave =
    draft.jobTitle.trim().length > 0 &&
    draft.name.trim().length > 0 &&
    draft.costKsh > 0 &&
    idIsValidFormat &&
    !idIsTaken &&
    !saving;

  const handleSave = async () => {
    setError('');
    if (!idIsValidFormat) {
      setError('Exam ID must be exactly 5 digits (e.g. 56743).');
      return;
    }
    if (idIsTaken) {
      setError('That Exam ID is already used by another exam — choose a different one.');
      return;
    }
    if (!canSave) {
      setError('Please fill in Job Title, Exam Name, and Exam Cost before saving.');
      return;
    }
    setSaving(true);
    try {
      const savedExam = await saveApexExam(draft);
      for (const id of selectedIds) {
        const question = questions.find((item) => item.id === id);
        if (question) {
          await saveApexQuestion({ ...question, examId: savedExam.id });
        }
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save exam');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer transition"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900">Create New Exam</h1>
              <p className="text-xs text-slate-500">Set the exam details, then attach questions from the pool below.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`text-xs font-extrabold px-3 py-2 rounded-xl border flex items-center gap-1.5 ${
                countMismatch
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {countMismatch && <AlertTriangle className="h-3.5 w-3.5" />}
              {selectedCount} selected · {required || 0} required
            </div>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Exam
            </button>
          </div>
        </div>
        {error && (
          <div className="max-w-5xl mx-auto px-6 pb-3">
            <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">{error}</div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Exam Details */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-900">Exam Details</h2>
          </div>

          <div className="p-6 space-y-7">
            {/* Section: Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                <Info className="h-3.5 w-3.5" /> Basic Info
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-2">
                <label className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide block">
                  Exam ID (you choose this)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.id}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setDraft({ ...draft, id: digitsOnly });
                    }}
                    placeholder="e.g. 56743"
                    maxLength={5}
                    className="w-32 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-lg font-black text-emerald-900 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, id: suggestExamId(exams) })}
                    className="px-3 py-2 text-[10px] font-bold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
                  >
                    Suggest ID
                  </button>
                </div>
                {draft.id && !idIsValidFormat && (
                  <p className="text-[10px] text-rose-600 font-semibold">Must be exactly 5 digits.</p>
                )}
                {idIsTaken && (
                  <p className="text-[10px] text-rose-600 font-semibold">This ID is already used by another exam.</p>
                )}
                <p className="text-[10px] text-emerald-700">
                  Create Exam ID for this exam. It must be exactly 5 digits and unique across all exams.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Exam Name</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. English Teacher Competency Assessment"
                    required
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Job Title (match key)</label>
                  <input
                    type="text"
                    value={draft.jobTitle}
                    onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
                    placeholder="e.g. English Teacher"
                    required
                    className={fieldClass}
                  />
                  <p className={hintClass}>Must exactly match the job's title as posted.</p>
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <input
                    type="text"
                    value={draft.category || ''}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    placeholder="e.g. Healthcare, Hospitality, IT"
                    className={fieldClass}
                  />
                  <p className={hintClass}>Used for catalog search/filter.</p>
                </div>
                <div>
                  <label className={labelClass}>Exam Cost (KSh)</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.costKsh || ''}
                    onChange={(e) => setDraft({ ...draft, costKsh: Number(e.target.value) })}
                    placeholder="Set the price for this exam"
                    required
                    className={fieldClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={draft.description || ''}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={2}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* Section: Exam Configuration */}
            <div className="space-y-3 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Exam Configuration
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Questions per Attempt</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.questionsPerAttempt}
                    onChange={(e) => setDraft({ ...draft, questionsPerAttempt: Number(e.target.value) })}
                    required
                    className={fieldClass}
                  />
                  <p className={hintClass}>Randomly picked from the pool below.</p>
                </div>
                <div>
                  <label className={labelClass}>Time Limit (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.timeLimitMinutes}
                    onChange={(e) => setDraft({ ...draft, timeLimitMinutes: Number(e.target.value) })}
                    required
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Pass Mark (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={draft.passMarkPercent}
                    onChange={(e) => setDraft({ ...draft, passMarkPercent: Number(e.target.value) })}
                    required
                    className={fieldClass}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClass}>Exam Type</label>
                  <select
                    value={draft.examType}
                    onChange={(e) => setDraft({ ...draft, examType: e.target.value as 'general' | 'professional' })}
                    className={fieldClass}
                  >
                    <option value="general">General — random draw of {draft.questionsPerAttempt} questions per attempt</option>
                    <option value="professional">Professional — fixed, admin-curated set (no randomization)</option>
                  </select>
                  {draft.examType === 'professional' && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      Set "Questions per Attempt" above to match the exact number of questions you attach below, so none get cut off.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section: AI Interview Stage */}
            <div className="space-y-3 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                <Bot className="h-3.5 w-3.5" /> AI Interview Stage
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>AI Interview Cost (KSh)</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.interviewCostKsh ?? 0}
                    onChange={(e) => setDraft({ ...draft, interviewCostKsh: Number(e.target.value) })}
                    placeholder="Leave 0 to keep the interview stage hidden"
                    className={fieldClass}
                  />
                  <p className={hintClass}>Only unlocks for a candidate once they've passed this exam.</p>
                </div>
                <div>
                  <label className={labelClass}>AI Interview Pass Mark (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={draft.interviewPassMarkPercent ?? 70}
                    onChange={(e) => setDraft({ ...draft, interviewPassMarkPercent: Number(e.target.value) })}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* Section: Visibility */}
            <div className="space-y-3 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                <Eye className="h-3.5 w-3.5" /> Visibility
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  className="h-4 w-4 accent-emerald-600"
                />
                Active (visible to matching candidates)
              </label>
            </div>
          </div>
        </div>

        {/* Question Pool */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-purple-600" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Question Pool</h2>
                <p className="text-xs text-slate-500">Tick each question you want attached to this exam.</p>
              </div>
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions or category..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-b border-emerald-200 bg-emerald-50 flex items-center gap-3 flex-wrap">
            <div className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide shrink-0">
              Keyword
            </div>
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder=" e.g Security"
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAutoSelectByKeyword}
              disabled={!keyword.trim()}
              className="px-3 py-2 text-[10px] font-bold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              Auto-Select
            </button>
            <p className="text-[10px] text-emerald-700 basis-full">
              Exam module
            </p>
            {autoSelectMessage && (
              <p className="w-full text-[11px] font-semibold text-emerald-700">{autoSelectMessage}</p>
            )}
          </div>

          <div className="p-6 space-y-2 max-h-[36rem] overflow-y-auto">
            {filteredQuestions.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-xs">
                {questions.length === 0
                  ? 'No questions in the bank yet — add some in the Question Bank tab first.'
                  : 'No questions match your search.'}
              </p>
            )}
            {filteredQuestions.map((q) => {
              const checked = selectedIds.has(q.id);
              const attachedElsewhere = !!q.examId && exams.some((ex) => ex.id === q.examId);
              return (
                <label
                  key={q.id}
                  className={`block p-3.5 rounded-2xl border cursor-pointer transition ${
                    checked ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleQuestion(q.id)}
                      className="mt-1 h-4 w-4 accent-emerald-600"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {q.category && (
                          <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                            {q.category}
                          </span>
                        )}
                        {attachedElsewhere && (
                          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            Currently in: {exams.find((ex) => ex.id === q.examId)?.name || 'another exam'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">{q.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {q.options.map((opt, idx) => {
                          const isCorrect = idx === q.correctAnswer;
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg border ${
                                isCorrect
                                  ? 'border-emerald-300 bg-emerald-100 text-emerald-800 font-bold'
                                  : 'border-slate-200 bg-white text-slate-600'
                              }`}
                            >
                              <span className="font-mono font-extrabold w-3.5 shrink-0">{OPTION_LETTERS[idx]}</span>
                              <span className="truncate">{opt}</span>
                              {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};