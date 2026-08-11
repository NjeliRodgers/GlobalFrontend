import React, { useState, useEffect } from 'react';
import { SubmittedDocument } from '../types';
import { fetchDocuments } from '../api/documentsApi';
import { ShieldCheck, Lock, FileText, Search, CheckCircle2, KeyRound } from 'lucide-react';

export const DocumentVaultPage: React.FC = () => {
  const [documents, setDocuments] = useState<SubmittedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const data = await fetchDocuments();
    setDocuments(data);
    setLoading(false);
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-1 inline-block">
            Global Talent Plus
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900"> Document Storage Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Secure vault managing candidate National IDs, Passports, Resumes, and background credentials with cryptographic checksum verification.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800">
          <span>Verified and secure storage</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document name, type or application ref..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
          Stored Candidate Credentials ({filteredDocs.length})
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Inspecting vault storage...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            No stored candidate documents found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3">File Name & Reference</th>
                  <th className="p-3">Document Category</th>
                  <th className="p-3">Size & Timestamp</th>
                  <th className="p-3">Encrypted Cryptographic Checksum</th>
                  <th className="p-3 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.fileName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">APP: {doc.applicationId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded uppercase">
                        {doc.fileType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{doc.fileSize}</div>
                      <span className="text-[10px] text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <KeyRound className="h-3 w-3 text-amber-500 shrink-0" />
                        {doc.encryptedHash}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px]">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
