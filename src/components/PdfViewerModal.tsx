import React from 'react';
import { X, Download, FileText, CheckCircle2 } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDataUrl: string;
  pdfFileName: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  pdfDataUrl,
  pdfFileName
}) => {
  if (!isOpen || !pdfDataUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-500 text-white rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{pdfFileName}</h3>
              <p className="text-[11px] text-slate-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Official Next Stage Rules & Regulations Document
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={pdfDataUrl}
              download={pdfFileName}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame Preview */}
        <div className="flex-1 bg-slate-100 p-2 relative">
          <iframe src={pdfDataUrl} title={pdfFileName} className="w-full h-full rounded-xl border border-slate-300 shadow-inner" />
        </div>
      </div>
    </div>
  );
};
