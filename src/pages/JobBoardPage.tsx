import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { fetchJobs } from '../api/jobsApi';
import { JobCard } from '../components/JobCard';
import { JobFilter } from '../components/JobFilter';
import { useAuth } from '../auth/AuthContext';
import { Briefcase, Sparkles, Building2, Globe } from 'lucide-react';
import rodPhoto from '../public/Rod.png.jpg';
interface JobBoardPageProps {
  onSelectJobForDetails: (job: Job) => void;
  onSelectJobForApply: (job: Job) => void;
}

export const JobBoardPage: React.FC<JobBoardPageProps> = ({ onSelectJobForDetails, onSelectJobForApply }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const data = await fetchJobs();
    setJobs(data);
    setLoading(false);
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
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-900/10 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f4e79] shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#49769c]" />
              Global Talent Plus
            </span>

            <h1 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-[-0.035em] text-slate-900 sm:text-4xl lg:text-[2.7rem] lg:leading-[1.08]">
              Build a career that
              <span className="block text-[#1f4e79]">takes you further.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Discover international opportunities for both skilled and non-skilled professionals. Explore each role, understand
              what employers need, and apply with confidence when you find the right fit.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1f4e79]">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xl font-extrabold leading-none text-slate-900">
                    {loading ? '—' : jobs.length}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Active positions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-slate-600">
                <Globe className="h-4 w-4 text-[#49769c]" />
                International opportunities
              </div>
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
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApplyClick={handleApplyClick}
              onViewDetails={onSelectJobForDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
