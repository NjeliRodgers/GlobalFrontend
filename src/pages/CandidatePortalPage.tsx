import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Application, EmailLog, Interview, Job } from '../types';
import { fetchApplications } from '../api/applicationsApi';
import { fetchEmailLogs } from '../api/emailLogsApi';
import { fetchInterviews } from '../api/interviewsApi';
import { fetchJobs } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';
import { StatusBadge } from '../components/StatusBadge';
import { AvatarCircle } from '../components/AvatarCircle';
import {
  User as UserIcon,
  Briefcase,
  Mail,
  Calendar,
  Lock,
  Video,
  CheckCircle2,
  Camera,
  MapPin,
  Phone,
  Sparkles,
  Upload,
  Globe,
  Award
} from 'lucide-react';

interface CandidatePortalPageProps {
  onSelectJobForApply?: (job: Job) => void;
  onSelectJobForDetails?: (job: Job) => void;
}

export const CandidatePortalPage: React.FC<CandidatePortalPageProps> = ({
  onSelectJobForApply = () => {},
  onSelectJobForDetails = () => {}
}) => {
  const { user, updateUser, uploadAvatar } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Candidate Profile State (with defaults for active user or Elena Rostova)
  const candidateName = user?.name || 'Elena Rostova';
  const candidateEmail = user?.email || 'elena.rostova@example.com';
  const candidatePhone = user?.phone || '+1 (555) 234-5678';
  const candidateGender = user?.gender || 'Female';
  const candidateLocation = user?.location || 'San Francisco, CA';

  // Profile Edit Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(candidateName);
  const [editEmail, setEditEmail] = useState(candidateEmail);
  const [editPhone, setEditPhone] = useState(candidatePhone);
  const [editGender, setEditGender] = useState(candidateGender);
  const [editLocation, setEditLocation] = useState(candidateLocation);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone || candidatePhone);
      setEditGender(user.gender || candidateGender);
      setEditLocation(user.location || candidateLocation);
    }
  }, [user]);

  useEffect(() => {
    loadCandidateData();
  }, [user]);

  const loadCandidateData = async () => {
    setLoading(true);
    const [appsData, emailsData, interviewsData, jobsData] = await Promise.all([
      fetchApplications({ candidateId: user?.id || user?.email }),
      fetchEmailLogs(user?.id || user?.email),
      fetchInterviews(),
      fetchJobs()
    ]);

    // Match candidate applications by ID or email
    const myApps = appsData.filter(
      (a) => a.candidateId === user?.id || a.candidateEmail.toLowerCase() === candidateEmail.toLowerCase()
    );

    setApplications(myApps.length > 0 ? myApps : appsData.filter((a) => a.candidateName === 'Elena Rostova' || a.candidateName === candidateName));
    setEmailLogs(emailsData);
    setInterviews(interviewsData.filter((i) => i.candidateEmail?.toLowerCase() === candidateEmail.toLowerCase()));
    setJobs(jobsData);
    setLoading(false);
  };

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadError('');
    try {
      await uploadAvatar(file);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

  const [saveError, setSaveError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    try {
      await updateUser({
        name: editName,
        phone: editPhone,
        gender: editGender,
        location: editLocation
      });
      setIsEditingProfile(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Candidate Console Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider block mb-1">
            Candidate Console
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Good afternoon, {candidateName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your profile, CVs, and applications with clarity.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Verified Account
        </span>
      </div>

      {/* 2. Candidate Profile Card (Passport/Professional Picture Upload + Candidate Details) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-indigo-600" /> Candidate Profile & Credentials
          </h2>
          <div className="flex items-center gap-2">
            {uploadSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                ✓ Candidate Profile Updated!
              </span>
            )}
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
            >
              Edit Candidate Details
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pt-2">
          {/* Passport / Professional Photo Upload Area */}
          <div className="flex flex-col items-center space-y-2 shrink-0">
            <div className="relative group">
              <AvatarCircle name={candidateName} avatarUrl={user?.avatar} size="lg" rounded="2xl" />
              {uploading && (
                <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <label
                htmlFor="passport-file-input"
                className={`absolute bottom-1 right-1 p-2 text-white rounded-xl shadow-md ${
                  uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                }`}
                title="Upload Passport / Professional Photo"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                id="passport-file-input"
                type="file"
                accept="image/*"
                onChange={handlePassportUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>

            <label
              htmlFor="passport-file-input"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{uploading ? 'Uploading photo...' : 'Upload Passport / Professional Photo'}</span>
            </label>
            <span className="text-[10px] text-slate-400">Visible to recruitment committee</span>
            {uploadError && (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg max-w-[220px] text-center">
                {uploadError}
              </span>
            )}
          </div>

          {/* Profile Metadata Info */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Candidate Name</span>
              <span className="font-extrabold text-slate-900 text-sm block">{candidateName}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Email Address</span>
              <span className="font-semibold text-slate-800 text-xs block truncate">{candidateEmail}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Phone Number</span>
              <span className="font-semibold text-slate-800 text-xs block">{candidatePhone}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Gender</span>
              <span className="font-semibold text-slate-800 text-xs block">{candidateGender}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Location</span>
              <span className="font-semibold text-slate-800 text-xs block flex items-center gap-1">
                <MapPin className="h-3 w-3 text-indigo-500" /> {candidateLocation}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Account Status</span>
              <span className="font-bold text-emerald-700 text-xs block flex items-center gap-1">
                <Award className="h-3 w-3 text-emerald-500" /> Active & Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recommended Opportunities Section Header */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" /> Recommended Opportunities
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Positions curated for your candidate profile and location. Apply or save positions to your portfolio.
            </p>
          </div>
        </div>

        {/* Recommended Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApplyClick={onSelectJobForApply}
              onViewDetails={onSelectJobForDetails}
            />
          ))}
        </div>
      </div>

      {/* 4. Submitted Applications & Scheduled Interviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Left Column: My Applications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-600" /> My Submitted Applications
            </h2>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading candidate records...</div>
            ) : applications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No active applications found. Click "Apply" on any recommended opportunity above to submit your resume!
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          REF: {app.id}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm">{app.jobTitle}</h3>
                      </div>
                      <StatusBadge stage={app.stage} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Applied Date</span>
                        <span className="font-semibold text-slate-800">{new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Test Score</span>
                        <span className="font-bold text-emerald-600">
                          {app.assessmentResult ? `${app.assessmentResult.score}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Documents Vault</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Lock className="h-3 w-3 text-emerald-600" /> {app.documents.length} Encrypted
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Interviews */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" /> My Scheduled Interviews
            </h2>

            {interviews.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No interview sessions currently scheduled. You will receive an invitation email once assigned.
              </div>
            ) : (
              <div className="space-y-3">
                {interviews.map((int) => (
                  <div key={int.id} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-indigo-900">{int.jobTitle}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                        {int.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      Interviewer: <strong>{int.interviewerName}</strong> | Scheduled: {new Date(int.scheduledAt).toLocaleString()}
                    </p>

                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={int.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Join Video Interview Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Candidate Email Log */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-500" /> Candidate Email Audit Log
            </h2>

            {emailLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No notifications logged yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {emailLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="truncate pr-2">{log.subject}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{log.bodyPreview}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Candidate Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-indigo-600" /> Edit Candidate Profile
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-100 text-slate-500 cursor-not-allowed outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Login with your email and can't be changed here. Contact support if you need it updated.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location / Residence</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
