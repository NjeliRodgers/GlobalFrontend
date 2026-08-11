import React, { useState, useEffect } from 'react';
import { Application, ApplicationStage } from '../types';
import { fetchApplications, updateApplicationStage, bulkUpdateApplicationStages } from '../api/applicationsApi';
import { StatusBadge } from '../components/StatusBadge';
import { BulkActionModal } from '../components/BulkActionModal';
import { ScheduleInterviewModal } from '../components/ScheduleInterviewModal';
import { scheduleInterview } from '../api/interviewsApi';
import {
  Search,
  MapPin,
  Filter,
  CheckSquare,
  Square,
  X,
  FileText,
  Lock,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck,
  Send
} from 'lucide-react';

interface PipelinePageProps {
  initialJobId?: string;
}

const KANBAN_STAGES: ApplicationStage[] = [
  'Submitted',
  'Assessment Passed',
  'Screening',
  'Technical Interview',
  'Final Interview',
  'Offer Extended',
  'Hired',
  'Rejected'
];

export const PipelinePage: React.FC<PipelinePageProps> = ({ initialJobId }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStage, setSelectedStage] = useState('');

  // Selection & Bulk Modal
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Candidate Drawer & Schedule Modal
  const [inspectApp, setInspectApp] = useState<Application | null>(null);
  const [scheduleModalApp, setScheduleModalApp] = useState<Application | null>(null);

  useEffect(() => {
    loadApplications();
  }, [initialJobId]);

  const loadApplications = async () => {
    setLoading(true);
    const data = await fetchApplications({ jobId: initialJobId });
    setApplications(data);
    setLoading(false);
  };

  // Unique Locations
  const locations = Array.from(new Set(applications.map((a) => a.candidateLocation)));

  // Filtered List
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = !selectedLocation || app.candidateLocation.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesStage = !selectedStage || app.stage === selectedStage;

    return matchesSearch && matchesLocation && matchesStage;
  });

  const toggleSelectApp = (id: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAppIds.length === filteredApps.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(filteredApps.map((a) => a.id));
    }
  };

  const handleApplyBulkStage = async (newStage: ApplicationStage) => {
    if (selectedAppIds.length === 0) return;
    await bulkUpdateApplicationStages(selectedAppIds, newStage);
    setSelectedAppIds([]);
    loadApplications();
  };

  const handleStageChangeSingle = async (appId: string, newStage: ApplicationStage) => {
    await updateApplicationStage(appId, newStage, `Moved to ${newStage} from Kanban board`);
    loadApplications();
    if (inspectApp && inspectApp.id === appId) {
      setInspectApp({ ...inspectApp, stage: newStage });
    }
  };

  const handleConfirmScheduleInterview = async (data: any) => {
    await scheduleInterview(data);
    loadApplications();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
            Talent Pipeline Kanban & Bulk Actions
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">Candidate Stage Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bulk edit applicant statuses, filter candidates by location, review uploaded IDs/Resumes, and trigger interview invites.
          </p>
        </div>

        {selectedAppIds.length > 0 && (
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            <Layers className="h-4 w-4" />
            <span>Bulk Edit Status ({selectedAppIds.length} Selected)</span>
          </button>
        )}
      </div>

      {/* Filtering Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidates, positions, email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter by Location */}
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">Filter By Location (All Locations)</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Stage */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">All Pipeline Stages</option>
              {KANBAN_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-select check all toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={toggleSelectAll}
            className="text-slate-700 font-semibold hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer"
          >
            {selectedAppIds.length === filteredApps.length && filteredApps.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-indigo-600" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>Select All Filtered Candidates ({filteredApps.length})</span>
          </button>

          {(searchQuery || selectedLocation || selectedStage) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('');
                setSelectedStage('');
              }}
              className="text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Kanban Stages Columns */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading pipeline candidates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => {
            const stageApps = filteredApps.filter((a) => a.stage === stage);
            return (
              <div key={stage} className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 flex flex-col min-h-[350px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
                  <span className="font-extrabold text-xs text-slate-800">{stage}</span>
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                    {stageApps.length}
                  </span>
                </div>

                {/* Candidates List in Stage */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageApps.map((app) => {
                    const isSelected = selectedAppIds.includes(app.id);
                    return (
                      <div
                        key={app.id}
                        className={`bg-white rounded-xl border p-3.5 shadow-2xs hover:shadow-md transition space-y-2 relative group ${
                          isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectApp(app.id);
                              }}
                              className="mt-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-indigo-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                            <div>
                              <h4
                                onClick={() => setInspectApp(app)}
                                className="font-bold text-slate-900 text-xs hover:text-indigo-600 transition cursor-pointer"
                              >
                                {app.candidateName}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium">{app.jobTitle}</p>
                            </div>
                          </div>
                        </div>

                        {/* Location & Test Score */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" /> {app.candidateLocation}
                          </span>
                          {app.assessmentResult && (
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Score: {app.assessmentResult.score}%
                            </span>
                          )}
                        </div>

                        {/* Quick Quick Stage Shift dropdown */}
                        <div className="pt-2 flex items-center justify-between gap-1">
                          <button
                            onClick={() => setInspectApp(app)}
                            className="text-[10px] font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer"
                          >
                            View Details
                          </button>

                          <button
                            onClick={() => setScheduleModalApp(app)}
                            className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 transition cursor-pointer"
                          >
                            Schedule Interview
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {stageApps.length === 0 && (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No candidates in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Profile Drawer Modal */}
      {inspectApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 relative border-l border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  REF: {inspectApp.id}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg">{inspectApp.candidateName}</h3>
                <p className="text-xs text-slate-500">{inspectApp.jobTitle}</p>
              </div>
              <button onClick={() => setInspectApp(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Stage Update */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Current Stage</span>
              <div className="flex items-center justify-between gap-2">
                <StatusBadge stage={inspectApp.stage} />
                <select
                  value={inspectApp.stage}
                  onChange={(e) => handleStageChangeSingle(inspectApp.id, e.target.value as ApplicationStage)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {KANBAN_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      Move to: {stg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Test Assessment Score Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" /> Automated Assessment Evaluation
              </h4>
              {inspectApp.assessmentResult ? (
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Score</span>
                    <span className="font-bold text-emerald-600 text-sm">{inspectApp.assessmentResult.score}%</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Correct</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {inspectApp.assessmentResult.correctAnswers} / {inspectApp.assessmentResult.totalQuestions}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Status</span>
                    <span className="font-bold text-emerald-700 text-xs">
                      {inspectApp.assessmentResult.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No test evaluation record available.</p>
              )}
            </div>

            {/* Uploaded Documents */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-indigo-600" /> Encrypted Submitted Credentials ({inspectApp.documents.length})
              </h4>
              <div className="space-y-2">
                {inspectApp.documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{doc.fileName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Type: {doc.fileType.toUpperCase()} | Size: {doc.fileSize}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate Details */}
            <div className="text-xs space-y-2 text-slate-700">
              <p>
                <strong>Email:</strong> {inspectApp.candidateEmail}
              </p>
              <p>
                <strong>Phone:</strong> {inspectApp.candidatePhone}
              </p>
              <p>
                <strong>Location:</strong> {inspectApp.candidateLocation}
              </p>
              <p>
                <strong>Experience:</strong> {inspectApp.experienceYears} Years
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setScheduleModalApp(inspectApp);
                  setInspectApp(null);
                }}
                className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition"
              >
                Schedule Technical Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedApplications={applications.filter((a) => selectedAppIds.includes(a.id))}
        onApplyBulkUpdate={handleApplyBulkStage}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={!!scheduleModalApp}
        onClose={() => setScheduleModalApp(null)}
        application={scheduleModalApp}
        onSchedule={handleConfirmScheduleInterview}
      />
    </div>
  );
};
