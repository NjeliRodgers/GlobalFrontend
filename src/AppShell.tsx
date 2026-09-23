import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './auth/AuthContext';
import { Job } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './auth/AuthModal';
import { HomePage } from './pages/HomePage';
import { AboutUsPage } from './pages/AboutUsPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { SiteContentAdminPage } from './pages/SiteContentAdminPage';
import { PublicFooter } from './components/public/PublicFooter';
import { RecruitmentProcessModal } from './components/RecruitmentProcessModal';

import { JobBoardPage } from './pages/JobBoardPage';
import { SponsorshipProcessPage } from './pages/SponsorshipProcessPage';
import { FundingDashboardPage } from './pages/FundingDashboardPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { ApplyPage } from './pages/ApplyPage';
import { ApexRecruiterPage } from './pages/ApexRecruiterPage';
import { CandidateControlPanelPage } from './pages/CandidateControlPanelPage';
import { CandidatePortalPage } from './pages/CandidatePortalPage';
import { RecruiterDashboardPage } from './pages/RecruiterDashboardPage';
import { PipelinePage } from './pages/PipelinePage';
import { InterviewSchedulerPage } from './pages/InterviewSchedulerPage';
import { EmailLogsPage } from './pages/EmailLogsPage';
import { DocumentVaultPage } from './pages/DocumentVaultPage';
import { TeamRbacPage } from './pages/TeamRbacPage';
import { CandidatesDirectoryPage } from './pages/CandidatesDirectoryPage';
import { ImportDetailPage } from './pages/ImportDetailPage';
import { fetchJobById } from './api/jobsApi';
import { ActivateAccount } from './auth/ActivateAccount';
import { ResetPasswordForm } from './auth/ResetPasswordForm';

const JOB_SCOPED_TABS = new Set(['job_detail', 'apply', 'pipeline']);
const APPLICATION_SCOPED_TABS = new Set(['import_detail']);

// The only screens a signed-out visitor may see: the public job board and
// an individual job's public description page. Everything else — for any
// role — requires being logged in.
const PUBLIC_TABS = new Set(['job_board', 'job_detail', 'home', 'about', 'contact']);

const parseHash = (): { tab: string; id?: string } => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { tab: 'job_board' };
  const [tab, id] = raw.split('/');
  return { tab: tab || 'job_board', id: id || undefined };
};

const buildHash = (tab: string, id?: string): string => {
  if ((JOB_SCOPED_TABS.has(tab) || APPLICATION_SCOPED_TABS.has(tab) || tab === 'job_board') && id) {
    return `#/${tab}/${id}`;
  }
  return `#/${tab}`;
};

export const AppShell: React.FC = () => {
  type UrlAuthAction =
  | { type: 'activate'; email: string; token: string }
  | { type: 'reset'; email: string; token: string }
  | null;


  const { isAuthenticated, role, pendingJobId, clearPendingJobId } = useAuth();

  const initialHash = parseHash();
  const [activeTab, setActiveTab] = useState(
    PUBLIC_TABS.has(initialHash.tab) || isAuthenticated ? initialHash.tab || 'job_board' : 'job_board'
  );
  const [resolvingHashJob, setResolvingHashJob] = useState(
    Boolean(initialHash.id) && JOB_SCOPED_TABS.has(initialHash.tab)
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [readinessApplicationId, setReadinessApplicationId] = useState<string | undefined>(
    APPLICATION_SCOPED_TABS.has(initialHash.tab) ? initialHash.id : undefined
  );

  // Detect activation/reset-password links from emails, e.g.
  // http://localhost:5173/?activationToken=...&email=...
  // http://localhost:5173/?resetToken=...&email=...
 
  const [urlAuthAction, setUrlAuthAction] = useState<UrlAuthAction>(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const activationToken = params.get('activationToken');
    const resetToken = params.get('resetToken');

    if (email && activationToken) {
      return { type: 'activate', email, token: activationToken };
    }
    if (email && resetToken) {
      return { type: 'reset', email, token: resetToken };
    }
    return null;
  });

  const clearUrlAuthAction = () => {
    setUrlAuthAction(null);
    // Strip the token params from the address bar so refreshing doesn't re-trigger this
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Active selections
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [highlightedJobId, setHighlightedJobId] = useState<string | undefined>(
    initialHash.tab === 'job_board' ? initialHash.id : undefined
  );
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);

  const wasAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    const wasAuthenticated = wasAuthenticatedRef.current;
    wasAuthenticatedRef.current = isAuthenticated;

    if (!wasAuthenticated && isAuthenticated && (activeTab === 'home' || activeTab === 'about')) {
      setActiveTab('job_board');
      return;
    }

    if (wasAuthenticated && !isAuthenticated) {
      setActiveTab('job_board');
      setSelectedJob(null);
      setReadinessApplicationId(undefined);
      setHighlightedJobId(undefined);
      return;
    }

    if (!isAuthenticated && !PUBLIC_TABS.has(activeTab)) {
      setActiveTab('job_board');
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    setShowRecruitmentModal(activeTab === 'job_detail' || activeTab === 'apply');
  }, [activeTab]);

  const applyHashRoute = async (route: { tab: string; id?: string }, showLoader = false) => {
    const { tab, id } = route;

    if (tab === 'job_board') {
      setHighlightedJobId(id);
      setActiveTab('job_board');
      return;
    }

    if (APPLICATION_SCOPED_TABS.has(tab)) {
      if (!id) {
        setActiveTab('job_board');
        return;
      }
      setReadinessApplicationId(id);
      setActiveTab(tab);
      return;
    }

    if (JOB_SCOPED_TABS.has(tab)) {
      if (!id) {
        setActiveTab('job_board');
        return;
      }

      if (showLoader) {
        setResolvingHashJob(true);
      }

      try {
        const job = await fetchJobById(id);
        if (job) {
          setSelectedJob(job);
          if (tab === 'apply' && !isAuthenticated) {
            setActiveTab('job_detail');
          } else {
            setActiveTab(tab);
          }
        } else {
          setActiveTab('job_board');
        }
      } finally {
        if (showLoader) {
          setResolvingHashJob(false);
        }
      }
      return;
    }

    setActiveTab(tab || 'job_board');
  };

  useEffect(() => {
    void applyHashRoute(initialHash, true);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      void applyHashRoute(parseHash(), true);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [selectedJob?.id, isAuthenticated, role]);

  // Keep the address bar in sync with in-app navigation so refreshing (or
  // sharing the link) restores the same tab/job/application instead of the
  // home page.
  useEffect(() => {
    const id = APPLICATION_SCOPED_TABS.has(activeTab)
      ? readinessApplicationId
      : activeTab === 'job_board'
      ? highlightedJobId
      : selectedJob?.id;
    const nextHash = buildHash(activeTab, id);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, [activeTab, selectedJob?.id, readinessApplicationId, highlightedJobId]);

  const handleApplicationSubmitted = (applicationId: string) => {
    setReadinessApplicationId(applicationId);
    setActiveTab('import_detail');
  };

  // If user just authenticated and had a pending job apply
  useEffect(() => {
    if (isAuthenticated && pendingJobId) {
      fetchJobById(pendingJobId).then((job) => {
        if (job) {
          setSelectedJob(job);
          setActiveTab('apply');
        }
        clearPendingJobId();
      });
    }
  }, [isAuthenticated, pendingJobId]);

  const goToPublicTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };

  const handleSelectJobForDetails = (job: Job) => {
    setSelectedJob(job);
    setActiveTab('job_detail');
  };

  const handleSelectJobForApply = (job: Job) => {
    setSelectedJob(job);
    setActiveTab('apply');
  };

  if (urlAuthAction?.type === 'activate') {
    return (
      <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
          <ActivateAccount email={urlAuthAction.email} token={urlAuthAction.token} onSuccess={clearUrlAuthAction} />
        </div>
      </div>
    );
  }

  if (urlAuthAction?.type === 'reset') {
    return (
      <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
          <ResetPasswordForm email={urlAuthAction.email} token={urlAuthAction.token} onSuccess={clearUrlAuthAction} />
        </div>
      </div>
    );
  }

  if (resolvingHashJob) {
    return (
      <div className="min-h-screen bg-slate-100/70 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApplicationProgress={(applicationId) => {
          setReadinessApplicationId(applicationId);
          setActiveTab('import_detail');
        }}
      />

      <div className="flex-1 w-full flex items-start">
        {isAuthenticated && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <main
          className={
            activeTab === 'home' || activeTab === 'about' || activeTab === 'contact'
              ? 'flex-1 w-full min-w-0'
              : 'flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 min-w-0'
          }
        >
          {activeTab === 'home' && <HomePage onNavigate={goToPublicTab} />}

          {activeTab === 'about' && <AboutUsPage onNavigate={goToPublicTab} />}

          {activeTab === 'contact' && <ContactUsPage />}

          {activeTab === 'site_content_admin' && isAuthenticated && (role === 'admin' || role === 'recruiter') && <SiteContentAdminPage />}
          {activeTab === 'job_board' && (
            <JobBoardPage
              highlightJobId={highlightedJobId}
              onSelectJobForDetails={handleSelectJobForDetails}
              onSelectJobForApply={handleSelectJobForApply}
              onNavigateToSponsorship={() => setActiveTab('sponsorship_process')}
              onNavigateToFunding={() => setActiveTab('funding_dashboard')}
            />
          )}

          {activeTab === 'sponsorship_process' && isAuthenticated && (
            <SponsorshipProcessPage onBack={() => setActiveTab('job_board')} />
          )}

          {activeTab === 'funding_dashboard' && isAuthenticated && (
            <FundingDashboardPage onBack={() => setActiveTab('job_board')} />
          )}

          {activeTab === 'job_detail' && selectedJob && (
            <JobDetailPage
              job={selectedJob}
              onBack={() => setActiveTab('job_board')}
              onApply={handleSelectJobForApply}
            />
          )}

          {activeTab === 'apply' && selectedJob && isAuthenticated && (
            <ApplyPage
              job={selectedJob}
              onBack={() => setActiveTab('job_board')}
              onSubmitted={handleApplicationSubmitted}
            />
          )}

          {activeTab === 'import_detail' && readinessApplicationId && isAuthenticated && (
            <ImportDetailPage
              applicationId={readinessApplicationId}
              onBackToJobBoard={() => setActiveTab('job_board')}
            />
          )}

          {activeTab === 'apex_recruiter' && isAuthenticated && <ApexRecruiterPage />}

          {activeTab === 'candidate_control_panel' && isAuthenticated && <CandidateControlPanelPage />}

          {activeTab === 'candidate_portal' && isAuthenticated && (
            <CandidatePortalPage
              onViewReadiness={(applicationId) => {
                setReadinessApplicationId(applicationId);
                setActiveTab('import_detail');
              }}
            />
          )}

          {activeTab === 'recruiter_dashboard' && isAuthenticated && (
            <RecruiterDashboardPage
              onNavigateToPipeline={async (jobId) => {
                if (jobId) {
                  const job = await fetchJobById(jobId);
                  if (job) {
                    setSelectedJob(job);
                  }
                }
                setActiveTab('pipeline');
              }}
              onNavigateToScheduler={() => setActiveTab('interviews')}
            />
          )}

          {activeTab === 'pipeline' && isAuthenticated && <PipelinePage initialJobId={selectedJob?.id} />}

          {activeTab === 'interviews' && isAuthenticated && <InterviewSchedulerPage />}

          {activeTab === 'email_logs' && isAuthenticated && <EmailLogsPage />}

          {activeTab === 'document_vault' && isAuthenticated && <DocumentVaultPage />}

          {activeTab === 'team_rbac' && isAuthenticated && <TeamRbacPage />}

          {activeTab === 'candidates_directory' && isAuthenticated && <CandidatesDirectoryPage />}
        </main>
      </div>

      {(!isAuthenticated || activeTab === 'home' || activeTab === 'about' || activeTab === 'contact') && (
        <PublicFooter onNavigate={goToPublicTab} />
      )}

      <AuthModal />

      {showRecruitmentModal && (
        <RecruitmentProcessModal onClose={() => setShowRecruitmentModal(false)} />
      )}
    </div>
  );
};