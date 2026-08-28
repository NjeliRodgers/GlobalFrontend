import React, { useState, useEffect, useRef } from 'react';
import { Job } from '../types';
import { fetchJobs, fetchJobById } from '../api/jobsApi';
import { fetchApplications } from '../api/applicationsApi';
import { JobCard } from '../components/JobCard';
import { JobFilter } from '../components/JobFilter';
import { useAuth } from '../auth/AuthContext';
import { Briefcase, Sparkles, Building2, Globe, Layers, Wallet, ChevronRight } from 'lucide-react';
import rodPhoto from '../public/Rod.png.jpg';
interface JobBoardPageProps {
  onSelectJobForDetails: (job: Job) => void;
  onSelectJobForApply: (job: Job) => void;
  onNavigateToSponsorship?: () => void;
  onNavigateToFunding?: () => void;
  highlightJobId?: string;
}

export const JobBoardPage: React.FC<JobBoardPageProps> = ({
  onSelectJobForDetails,
  onSelectJobForApply,
  onNavigateToSponsorship,
  onNavigateToFunding,
  highlightJobId
}) => {
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  // Track which jobs this candidate has already applied to, so the "Apply"
  // button can be disabled instead of letting them submit a duplicate.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setAppliedJobIds(new Set());
      return;
    }
    fetchApplications({ candidateId: user.id }).then((apps) => {
      setAppliedJobIds(new Set(apps.map((a) => a.jobId)));
    });
  }, [isAuthenticated, user?.id]);

  const loadJobs = async () => {
    setLoading(true);
    const data = await fetchJobs();
    setJobs(data);
    setLoading(false);
  };

  // If someone opens a copied link to a job that isn't in the normal
  // fetched list for some reason, fetch it directly and splice it in.
  useEffect(() => {
    if (!highlightJobId || loading) return;
    if (jobs.some((j) => j.id === highlightJobId)) return;
    fetchJobById(highlightJobId).then((job) => {
      if (job) setJobs((current) => [job, ...current]);
    });
  }, [highlightJobId, jobs, loading]);

  // Scroll the highlighted job into view once it's rendered.
  useEffect(() => {
    if (highlightJobId && !loading && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [highlightJobId, loading]);

  const handleCopyLink = async (job: Job) => {
    const url = `${window.location.origin}${window.location.pathname}#/job_board/${job.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedJobId(job.id);
    setTimeout(() => setCopiedJobId((current) => (current === job.id ? null : current)), 2000);
  };

  // Filter logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = !selectedLocation || job.location.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesDepartment = !selectedDepartment || job.department === selectedDepartment;
    const matchesWorkType = !selectedWorkType || job.workType === selectedWorkType;

    return matchesSearch && matchesLocation && matchesDepartment && matchesWorkType;
  });

  const locations = Array.from(new Set(jobs.map((j) => j.location)));
  const departments = Array.from(new Set(jobs.map((j) => j.department)));
  const workTypes = Array.from(new Set(jobs.map((j) => j.workType)));

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedDepartment('');
    setSelectedWorkType('');
  };

  const handleApplyClick = (job: Job) => {
    if (!isAuthenticated) {
      // Trigger Auth Modal with reference to this job
      openAuthModal(job.id);
    } else {
      onSelectJobForApply(job);
    }
  };

  return (
    <div className="space-y-6">
        <section className="relative w-full overflow-hidden rounded-[28px] border border-slate-200 bg-[#f5f8fc] shadow-[0_20px_55px_-38px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[43%] bg-[#102a43]" aria-hidden="true" />
        <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full border-2 border-white/20 overflow-hidden shadow-lg shadow-black/20" aria-hidden="true">
          <img
            src={rodPhoto}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute right-16 bottom-[-120px] h-64 w-64 rounded-full bg-blue-300/10 blur-3xl" aria-hidden="true" />

        <div className="relative grid lg:grid-cols-[1.45fr_0.55fr]">
          <div className="px-6 py-8 sm:px-10 sm:py-11 lg:px-12">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-900/10 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f4e79] shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#49769c]" />
                Global Talent Plus
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-900/10 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f4e79] shadow-sm">
                <Globe className="h-3.5 w-3.5 text-[#49769c]" />
                International opportunities
              </span>
            </div>

            <h1 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-[-0.035em] text-slate-900 sm:text-4xl lg:text-[2.7rem] lg:leading-[1.08]">
              Build a career that
              <span className="block text-[#1f4e79]">takes you further.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Discover international opportunities for both skilled and non-skilled professionals. Explore each role, understand
              what employers need, and apply with confidence when you find the right fit.
            </p>

            <div className="mt-8 flex flex-wrap items-stretch gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1f4e79] shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-extrabold leading-none text-slate-900">
                    {loading ? '—' : jobs.length}
                  </p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 whitespace-nowrap">
                    Active positions
                  </p>
                </div>
              </div>

              {isAuthenticated && onNavigateToSponsorship && (
                <button
                  type="button"
                  onClick={onNavigateToSponsorship}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm text-left hover:border-[#1f4e79]/40 hover:shadow-md transition-all cursor-pointer shrink-0 max-w-[190px]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1f4e79] shrink-0">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold leading-tight text-slate-900 truncate">Sponsorship process</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 truncate">
                      Packages &amp; how it works
                    </p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 ml-0.5 shrink-0" />
                </button>
              )}

              {isAuthenticated && onNavigateToFunding && (
                <button
                  type="button"
                  onClick={onNavigateToFunding}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm text-left hover:border-[#1f4e79]/40 hover:shadow-md transition-all cursor-pointer shrink-0 max-w-[190px]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1f4e79] shrink-0">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold leading-tight text-slate-900 truncate">Funding Dashboard</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 truncate">
                      Track your sponsorship
                    </p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 ml-0.5 shrink-0" />
                </button>
              )}
            </div>
          </div>

          <div className="relative flex min-h-[230px] flex-col justify-end p-6 text-white sm:p-8 lg:min-h-0 lg:p-10">
            <div className="mt-16">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">
                International Job Board
              </p>
              <p className="mt-3 max-w-xs text-lg font-semibold leading-snug text-white">
                Your next opportunity can start with one well-matched role.
              </p>
              <div className="mt-5 h-px w-16 bg-blue-200/60" />
            </div>
          </div>
        </div>
      </section>

      {/* Filter Component */}
      <JobFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        selectedWorkType={selectedWorkType}
        setSelectedWorkType={setSelectedWorkType}
        locations={locations}
        departments={departments}
        workTypes={workTypes}
        onReset={handleResetFilters}
      />

      {/* Job Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium text-sm">
          Loading current job listings...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="p-3 bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-500">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900">No Job Openings Found</h3>
          <p className="text-xs text-slate-500">Try clearing your location or department search filters to view all available roles.</p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...filteredJobs]
            .sort((a, b) => (a.id === highlightJobId ? -1 : b.id === highlightJobId ? 1 : 0))
            .map((job) => (
              <div key={job.id} ref={job.id === highlightJobId ? highlightRef : undefined}>
                <JobCard
                  job={job}
                  onApplyClick={handleApplyClick}
                  onViewDetails={onSelectJobForDetails}
                  alreadyApplied={appliedJobIds.has(job.id)}
                  isHighlighted={job.id === highlightJobId}
                  isCopied={copiedJobId === job.id}
                  onCopyLink={() => handleCopyLink(job)}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
