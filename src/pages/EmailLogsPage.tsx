import React, { useState, useEffect } from 'react';
import { EmailLog } from '../types';
import { fetchEmailLogs } from '../api/emailLogsApi';
import { Mail, Search, FileText, CheckCircle2, ChevronDown, ChevronUp, Download, Clock } from 'lucide-react';

export const EmailLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchEmailLogs();
    setLogs(data);
    setLoading(false);
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.triggerEvent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
            Real-Time Audit Archive
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">Automated Candidate Email Notification Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal log archive for all system emails sent to candidates (assessment passes, PDF regulations attachments, interview invitations).
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span>Refresh Live Archive</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, email, or subject line..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Email Logs List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
          Archived System Emails ({filteredLogs.length})
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading email archive logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            No email notification logs found matching your criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              return (
                <div
                  key={log.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">{log.candidateName}</span>
                        <span className="text-xs text-slate-400 font-mono ml-2">({log.candidateEmail})</span>
                        {(log.candidateLocation || log.candidateAge) && (
                          <span className="text-[10px] text-slate-400 ml-2">
                            {log.candidateLocation}{log.candidateLocation && log.candidateAge ? ' • ' : ''}{log.candidateAge ? `Age ${log.candidateAge}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {log.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-800 pt-1">
                    Subject: {log.subject}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">{log.bodyPreview}</p>

                  <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span>Sent At: {new Date(log.sentAt).toLocaleString()}</span>
                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase font-semibold">
                      Trigger: {log.triggerEvent}
                    </span>
                  </div>

                  {/* Expanded Full Body */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed">
                        {log.fullBody}
                      </div>

                      {log.pdfAttachmentName && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                          <span className="font-bold flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-emerald-600" /> Attachment: {log.pdfAttachmentName}
                          </span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono">
                            PDF Validated
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
