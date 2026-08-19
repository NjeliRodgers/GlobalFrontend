import React, { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthContext';
import { Job } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './auth/AuthModal';

import { JobBoardPage } from './pages/JobBoardPage';
import { SponsorshipProcessPage } from './pages/SponsorshipProcessPage';
import { FundingDashboardPage } from './pages/FundingDashboardPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { ApplyPage } from './pages/ApplyPage';
import { ApexRecruiterPage } from './pages/ApexRecruiterPage';
import { CandidatePortalPage } from './pages/CandidatePortalPage';
import { RecruiterDashboardPage } from './pages/RecruiterDashboardPage';
import { PipelinePage } from './pages/PipelinePage';
import { InterviewSchedulerPage } from './pages/InterviewSchedulerPage';
import { EmailLogsPage } from './pages/EmailLogsPage';
import { DocumentVaultPage } from './pages/DocumentVaultPage';
import { TeamRbacPage } from './pages/TeamRbacPage';
import { CandidatesDirectoryPage } from './pages/CandidatesDirectoryPage';
import { fetchJobById } from './api/jobsApi';
import { ActivateAccount } from './auth/ActivateAccount';
import { ResetPasswordForm } from './auth/ResetPasswordForm';

export const AppShell: React.FC = () => {
  type UrlAuthAction =
  | { type: 'activate'; email: string; token: string }
  | { type: 'reset'; email: string; token: string }
  | null;


  const { isAuthenticated, pendingJobId, clearPendingJobId } = useAuth();

  const [activeTab, setActiveTab] = useState('job_board');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'job_board' && (
            <JobBoardPage
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

          {activeTab === 'apply' && selectedJob && (
            <ApplyPage
              job={selectedJob}
              onBack={() => setActiveTab('job_board')}
            />
          )}

          {activeTab === 'apex_recruiter' && <ApexRecruiterPage />}

          {activeTab === 'candidate_portal' && <CandidatePortalPage />}

          {activeTab === 'recruiter_dashboard' && (
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

          {activeTab === 'pipeline' && (
            <CandidatesDirectoryPage
              initialJobId={selectedJob?.id}
              initialJobTitle={selectedJob?.title}
            />
          )}

          {activeTab === 'interviews' && <InterviewSchedulerPage />}

          {activeTab === 'email_logs' && <EmailLogsPage />}

          {activeTab === 'document_vault' && <DocumentVaultPage />}

          {activeTab === 'team_rbac' && <TeamRbacPage />}

          {activeTab === 'candidates_directory' && <CandidatesDirectoryPage />}
        </main>
      </div>

      <AuthModal />
    </div>
  );
};