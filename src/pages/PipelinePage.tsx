import React, { useEffect, useMemo, useState } from 'react';
import { Application, ApplicationStage } from '../types';
import { fetchApplications, updateApplicationStage, sendApplicationAccessCodeEmail } from '../api/applicationsApi';
import { StatusBadge } from '../components/StatusBadge';
import { ScheduleInterviewModal } from '../components/ScheduleInterviewModal';
import { scheduleInterview } from '../api/interviewsApi';
import {
  Search,
  MapPin,
  Filter,
  X,
  FileText,
  ExternalLink,
  ClipboardCheck,
  Award,
  ChevronRight,
  Calendar,
  UserRound,
  Mail,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface PipelinePageProps {
  initialJobId?: string;
}

const STAGES: ApplicationStage[] = [
  'Submitted',
  'Assessment Passed',
  'Assessment Failed',
  'Screening',
  'Technical Interview',
  'Final Interview',
  'Offer Extended',
  'Hired',
  'Rejected'
];

const COMPLIANCE_LABELS: Record<string, string> = {
  hasCovidCover: 'Has COVID-19 medical cover',
  hasForeignExperience: 'Has worked in a foreign country before',
  hasPassport: 'Has a valid passport',
  hasApexCertificate: 'Completed required Atesta training certification',
  hasGoodConduct: 'Has a Good Conduct certificate',
  willingToRelocate: 'Willing to relocate internationally',
  hasLegalRestrictions: 'Has legal/immigration restrictions for working abroad'
};

export const PipelinePage: React.FC<PipelinePageProps> = ({ initialJobId }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [scheduleModalApp, setScheduleModalApp] = useState<Application | null>(null);
  const [sendingAccessEmailForId, setSendingAccessEmailForId] = useState<string | null>(null);
  const [accessEmailResult, setAccessEmailResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    loadApplications();
  }, [initialJobId]);

  const loadApplications = async () => {
    setLoading(true);
    const data = await fetchApplications({ jobId: initialJobId });
    setApplications(data);
    setLoading(false);
  };

  const locations = useMemo(
    () => Array.from(new Set(applications.map((a) => a.candidateLocation).filter(Boolean))),
    [applications]
  );

  const filteredApps = useMemo(
    () =>
      applications.filter((app) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          app.candidateName.toLowerCase().includes(query) ||
          app.candidateEmail.toLowerCase().includes(query) ||
          app.jobTitle.toLowerCase().includes(query) ||
          app.id.toLowerCase().includes(query);

        const matchesStage = !selectedStage || app.stage === selectedStage;
        const matchesLocation =
          !selectedLocation || app.candidateLocation.toLowerCase().includes(selectedLocation.toLowerCase());

        return matchesSearch && matchesStage && matchesLocation;
      }),
    [applications, searchQuery, selectedStage, selectedLocation]
  );

  const handleStageChange = async (appId: string, stage: ApplicationStage) => {
    await updateApplicationStage(appId, stage, `Moved to ${stage} from recruiter applicants table`);
    await loadApplications();
    if (selectedApp?.id === appId) {
      setSelectedApp((prev) => (prev ? { ...prev, stage } : prev));
    }
  };

  const handleConfirmScheduleInterview = async (data: any) => {
    await scheduleInterview(data);
    await loadApplications();
  };

  const handleSendAccessCodeEmail = async () => {
    if (!selectedApp) return;
    setSendingAccessEmailForId(selectedApp.id);
    setAccessEmailResult(null);
    try {
      const result = await sendApplicationAccessCodeEmail(selectedApp.id);
      setAccessEmailResult({
        ok: result.delivered,
        message: result.delivered
          ? `Access-code email sent to ${selectedApp.candidateEmail}. Code: ${result.voucher.code}.`
          : `Send attempted but delivery was not confirmed for ${selectedApp.candidateEmail}.`
      });
    } catch (err: any) {
      setAccessEmailResult({ ok: false, message: err.message || 'Failed to send access-code email.' });
    } finally {
      setSendingAccessEmailForId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
          Recruiter Applicant Explorer
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">Application Review Table</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review all submitted applications, open a full answer breakdown, and access every uploaded document URL in one place.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, email, role, or ref..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">All Stages</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        {loading ? (
          <div className="py-10 text-center text-xs text-slate-400">Loading applications...</div>
        ) : filteredApps.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            No applications matched your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Job</th>
                  <th className="p-3">Applied</th>
                  <th className="p-3">Documents</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{app.candidateName}</div>
                      <div className="text-[10px] text-slate-500">{app.candidateEmail}</div>
                      <div className="text-[10px] text-slate-400 font-mono">REF: {app.id}</div>
                    </td>
                    <td className="p-3 text-slate-700">{app.jobTitle}</td>
                    <td className="p-3 text-slate-600">{new Date(app.appliedAt).toLocaleString()}</td>
                    <td className="p-3 text-slate-700">{app.documents.length}</td>
                    <td className="p-3">
                      <div className="space-y-1.5">
                        <StatusBadge stage={app.stage} />
                        <select
                          value={app.stage}
                          onChange={(e) => handleStageChange(app.id, e.target.value as ApplicationStage)}
                          className="w-full max-w-[180px] px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-800"
                        >
                          {STAGES.map((stage) => (
                            <option key={stage} value={stage}>
                              Move to: {stage}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer"
                      >
                        <span>View Application</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">REF: {selectedApp.id}</span>
                <h3 className="font-extrabold text-slate-900 text-lg">{selectedApp.candidateName}</h3>
                <p className="text-xs text-slate-500">{selectedApp.jobTitle}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-78px)] space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider">Candidate Profile</h4>
                  <p className="text-slate-700"><strong>Email:</strong> {selectedApp.candidateEmail}</p>
                  <p className="text-slate-700"><strong>Phone:</strong> {selectedApp.candidatePhone}</p>
                  <p className="text-slate-700"><strong>Location:</strong> {selectedApp.candidateLocation || 'Not specified'}</p>
                  <p className="text-slate-700"><strong>Experience:</strong> {selectedApp.experienceYears || 'Not specified'}</p>
                  {selectedApp.linkedinUrl && (
                    <p className="text-slate-700 break-all"><strong>LinkedIn:</strong> {selectedApp.linkedinUrl}</p>
                  )}
                  {selectedApp.portfolioUrl && (
                    <p className="text-slate-700 break-all"><strong>Portfolio:</strong> {selectedApp.portfolioUrl}</p>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-emerald-600" /> Assessment Result
                  </h4>
                  {selectedApp.assessmentResult ? (
                    <>
                      <p className="text-slate-700"><strong>Score:</strong> {selectedApp.assessmentResult.score}%</p>
                      <p className="text-slate-700">
                        <strong>Correct:</strong> {selectedApp.assessmentResult.correctAnswers} / {selectedApp.assessmentResult.totalQuestions}
                      </p>
                      <p className="text-slate-700">
                        <strong>Status:</strong> {selectedApp.assessmentResult.passed ? 'Passed' : 'Failed'}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500 italic">No assessment result has been submitted yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-indigo-600" /> Compliance Answers
                </h4>
                {(() => {
                  const answers = selectedApp.complianceAnswers;
                  if (!answers) {
                    return (
                      <p className="text-xs text-slate-500 italic">No compliance answers were attached to this application.</p>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(answers).map(([key, value]) => (
                        <div key={key} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <span className="font-semibold text-slate-700 block">{COMPLIANCE_LABELS[key] || key}</span>
                          <span className={`font-bold ${value === 'yes' ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {(value || 'no').toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserRound className="h-4 w-4 text-sky-600" /> Submitted Assessment Answers
                </h4>
                {selectedApp.assessmentResult?.answers && Object.keys(selectedApp.assessmentResult.answers).length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {Object.entries(selectedApp.assessmentResult.answers).map(([questionId, selectedIndex]) => (
                      <div key={questionId} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <div className="font-semibold text-slate-700">Question ID: {questionId}</div>
                        <div className="text-slate-600">Selected Option Index: {Number(selectedIndex) + 1}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No assessment answer payload is available for this application.</p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600" /> Uploaded Documents ({selectedApp.documents.length})
                </h4>
                {selectedApp.documents.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No uploaded documents found.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedApp.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{doc.fileName}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{doc.fileType.replace('_', ' ')} • {doc.fileSize}</div>
                          <div className="text-[10px] text-slate-400 break-all">{doc.downloadUrl || 'No URL saved'}</div>
                        </div>

                        {doc.downloadUrl ? (
                          <a
                            href={doc.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
                          </a>
                        ) : (
                          <span className="shrink-0 text-[10px] font-bold text-rose-600">URL Missing</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => void handleSendAccessCodeEmail()}
                  disabled={sendingAccessEmailForId === selectedApp.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {sendingAccessEmailForId === selectedApp.id ? 'Sending Access Email...' : 'Send Atesta Access Code Email'}
                </button>
                <button
                  onClick={() => setScheduleModalApp(selectedApp)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule Interview
                </button>
              </div>

              {accessEmailResult && (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold flex items-center gap-2 ${
                    accessEmailResult.ok
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {accessEmailResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {accessEmailResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ScheduleInterviewModal
        isOpen={!!scheduleModalApp}
        onClose={() => setScheduleModalApp(null)}
        application={scheduleModalApp}
        onSchedule={handleConfirmScheduleInterview}
      />
    </div>
  );
};
