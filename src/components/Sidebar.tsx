import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { PanelsTopLeft } from 'lucide-react';
import {
  Briefcase,
  Globe,
  Layers,
  Calendar,
  Mail,
  ShieldCheck,
  FolderLock,
  Sliders,
  Wallet,
  UserRound,
  Users
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { tab: 'job_board', label: 'Public Job Openings', icon: Globe, iconColor: 'text-slate-300' },
  { tab: 'recruiter_dashboard', label: 'Create Jobs & Dashboard', icon: Briefcase, iconColor: 'text-[#5b8bb5]' },
  { tab: 'candidates_directory', label: 'Candidates', icon: Users, iconColor: 'text-indigo-400' },
  { tab: 'interviews', label: 'Interview Scheduling Center', icon: Calendar, iconColor: 'text-emerald-400' },
  { tab: 'email_logs', label: ' Email Logs and Archive', icon: Mail, iconColor: 'text-amber-400' },
  { tab: 'document_vault', label: ' Document storage Vault', icon: FolderLock, iconColor: 'text-sky-400' },
  { tab: 'team_rbac', label: 'RBAC & Team Access Control', icon: ShieldCheck, iconColor: 'text-rose-400' },
  { tab: 'apex_recruiter', label: 'Atesta System Admin Control', icon: Sliders, iconColor: 'text-purple-400' },
  { tab: 'site_content_admin', label: 'Public Pages Editor', icon: PanelsTopLeft, iconColor: 'text-sky-300', adminOnly: true },
];

const CANDIDATE_NAV_ITEMS = [
  { tab: 'job_board', label: 'Browse Job Openings', icon: Globe, iconColor: 'text-slate-300' },
  { tab: 'candidate_portal', label: 'Candidate Console', icon: UserRound, iconColor: 'text-indigo-400' },
  { tab: 'sponsorship_process', label: 'Sponsorship Process', icon: Layers, iconColor: 'text-[#5b8bb5]' },
  { tab: 'funding_dashboard', label: 'Funding Dashboard', icon: Wallet, iconColor: 'text-emerald-400' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { role, isAuthenticated } = useAuth();

  const isRecruiterOrAdmin = role === 'recruiter' || role === 'hiring_manager' || role === 'admin';
  const isCandidate = isAuthenticated && role === 'candidate';

  if (!isRecruiterOrAdmin && !isCandidate) {
    return null;
  }

  const items = isRecruiterOrAdmin ? NAV_ITEMS.filter((item) => !item.adminOnly || role === 'admin' || role === 'recruiter') : CANDIDATE_NAV_ITEMS;
  const sectionLabel = isRecruiterOrAdmin ? 'Global Talent Plus Operations' : 'My Sponsorship';
  const mobileVisibility = isOpen ? 'translate-x-0' : '-translate-x-full';

  return (
    <>
      {/* Mobile Backdrop — only shown when fully expanded on small screens */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 shrink-0 transform transition-[width,transform] duration-200 ${mobileVisibility} md:translate-x-0 ${
          isOpen ? 'w-64' : 'w-[72px]'
        }`}
      >
        <div className="p-3 space-y-6 overflow-y-auto overflow-x-hidden flex-1">
          <div>
            {isOpen && (
              <div className="flex items-center justify-between px-3 mb-3 border-b border-slate-800 pb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {sectionLabel}
                </span>
              </div>
            )}

            <div className="space-y-1">
              {items.map(({ tab, label, icon: Icon, iconColor }) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  title={label}
                  className={`w-full flex items-center rounded-xl text-xs font-bold cursor-pointer ${
                    isOpen ? 'space-x-3 px-3 py-2.5' : 'justify-center py-2.5'
                  } ${
                    activeTab === tab
                      ? 'bg-[#1f4e79] text-white shadow-xs'
                      : 'text-slate-300 hover:bg-[#102a43] hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                  {isOpen && <span>{label}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        
      </aside>
    </>
  );
};