import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AvatarCircle } from './AvatarCircle';
import { Briefcase, Menu, ChevronDown, User, Globe, Layers, LogOut, ClipboardList } from 'lucide-react';
import { fetchApplications } from '../api/applicationsApi';
import { Application } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenApplicationProgress: (applicationId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeTab, setActiveTab, onOpenApplicationProgress }) => {
  const { user, role, isAuthenticated, logout, openAuthModal } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isApplicationMenuOpen, setIsApplicationMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const applicationsMenuRef = useRef<HTMLDivElement>(null);

  const isRecruiterOrAdmin = role === 'recruiter' || role === 'admin' || role === 'hiring_manager';

  // Links shown to visitors who have not signed in.
  const publicTabs = [
    { tab: 'home', label: 'Home' },
    { tab: 'job_board', label: 'Opportunities' },
    { tab: 'about', label: 'About Us' },
    { tab: 'contact', label: 'Contact Us' },
  ];
  const goToPublicTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };
  const isPublicTabActive = (tab: string) =>
    activeTab === tab || (tab === 'job_board' && activeTab === 'job_detail');

  const [myApplications, setMyApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchApplications({ candidateId: user.id }).then(setMyApplications);
    } else {
      setMyApplications([]);
    }
  }, [isAuthenticated, user?.id]);

  const orderedApplications = [...myApplications].sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (applicationsMenuRef.current && !applicationsMenuRef.current.contains(event.target as Node)) {
        setIsApplicationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setIsProfileMenuOpen(false);
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className={`p-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-xl cursor-pointer items-center justify-center ${
              isAuthenticated ? 'flex' : 'hidden'
            }`}
            title="Toggle Sidebar Navigation"
            aria-label="Toggle Sidebar Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div
            onClick={() => setActiveTab('job_board')}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">Global Talent Plus</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Recruitment Platform
              </span>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main">
            {publicTabs.map(({ tab, label }) => (
              <button
                key={tab}
                onClick={() => goToPublicTab(tab)}
                aria-current={isPublicTabActive(tab) ? 'page' : undefined}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  isPublicTabActive(tab)
                    ? 'bg-[#1f4e79]/10 text-[#1f4e79]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        )}

        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('job_board')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'job_board'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Public Job Openings
            </button>

            {isRecruiterOrAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('recruiter_dashboard')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeTab === 'recruiter_dashboard'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Create Jobs
                </button>
              </>
            )}

            {orderedApplications.length > 0 && (
              <div className="relative" ref={applicationsMenuRef}>
                <button
                  onClick={() => setIsApplicationMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeTab === 'import_detail' || isApplicationMenuOpen
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Application Progress
                  <ChevronDown className={`h-3.5 w-3.5 transition ${isApplicationMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isApplicationMenuOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-3 pb-2 mb-1 border-b border-slate-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">All My Applications</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto px-1">
                      {orderedApplications.map((application) => (
                        <button
                          key={application.id}
                          onClick={() => {
                            onOpenApplicationProgress(application.id);
                            setIsApplicationMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                        >
                          <div className="text-xs font-bold text-slate-900 truncate">{application.jobTitle}</div>
                          <div className="text-[10px] text-slate-500">REF: {application.id}</div>
                          <div className="text-[10px] text-slate-500">Applied: {new Date(application.appliedAt).toLocaleDateString()}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {role === 'candidate' && (
              <button
                onClick={() => setActiveTab('candidate_portal')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTab === 'candidate_portal'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Candidate Console
              </button>
            )}
          </nav>
        )}

        <div className="flex items-center space-x-3">
          {!isAuthenticated && activeTab !== 'job_board' && (
            <button
              onClick={() => goToPublicTab('job_board')}
              className="hidden sm:inline-flex px-5 py-2 border border-[#1f4e79] text-[#1f4e79] hover:bg-[#1f4e79]/10 text-xs font-semibold tracking-wide rounded-lg transition cursor-pointer"
            >
              View Jobs
            </button>
          )}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`flex items-center space-x-2.5 bg-slate-50 hover:bg-indigo-50/70 border px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs ${
                  isProfileMenuOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/80' : 'border-slate-200'
                }`}
                title="Open Candidate Account Menu"
              >
                <div className="relative">
                  <AvatarCircle name={user.name} avatarUrl={user.avatar} size="sm" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-extrabold text-slate-900 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {user.role === 'candidate' ? 'Candidate Console' : user.role.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 ${isProfileMenuOpen ? 'text-indigo-600' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center space-x-3 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-t-2xl">
                    <AvatarCircle name={user.name} avatarUrl={user.avatar} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {user.role === 'candidate' ? 'Candidate Account' : user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    {role === 'candidate' && (
                      <button
                        onClick={() => handleNavigate('candidate_portal')}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                          activeTab === 'candidate_portal'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <User className="h-4 w-4 text-indigo-500" />
                        <span>Candidate Console / Profile</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleNavigate('job_board')}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeTab === 'job_board'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Globe className="h-4 w-4 text-slate-400" />
                      <span>Browse Public Job Openings</span>
                    </button>

                    {isRecruiterOrAdmin && (
                      <button
                        onClick={() => handleNavigate('recruiter_dashboard')}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                          activeTab === 'recruiter_dashboard'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Layers className="h-4 w-4 text-indigo-500" />
                        <span>Recruiter Metrics Portal</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-slate-100 px-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4 text-slate-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal()}
              className="px-5 py-2 bg-[#1f4e79] hover:bg-[#102a43] text-white text-xs font-semibold tracking-wide rounded-lg shadow-xs transition cursor-pointer"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
      {!isAuthenticated && (
        <nav className="md:hidden flex items-center justify-around border-t border-slate-100 px-2 py-1.5" aria-label="Main">
          {publicTabs.map(({ tab, label }) => (
            <button
              key={tab}
              onClick={() => goToPublicTab(tab)}
              aria-current={isPublicTabActive(tab) ? 'page' : undefined}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                isPublicTabActive(tab) ? 'bg-[#1f4e79]/10 text-[#1f4e79]' : 'text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};
