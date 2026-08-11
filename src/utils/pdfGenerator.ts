import jsPDF from 'jspdf';

export interface PdfRulesParams {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  score: number;
  applicationId: string;
  nextStageName?: string;
  estimatedLinkHours?: number;
}

export function generateInterviewRulesPdf(params: PdfRulesParams): { pdfDataUrl: string; fileName: string; doc: jsPDF } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const nextStage = params.nextStageName || 'Technical Architecture & Deep-Dive Interview';
  const hours = params.estimatedLinkHours || 24;
  const fileName = `Interview_Rules_and_Next_Steps_${params.candidateName.replace(/\s+/g, '_')}.pdf`;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Global Talent Plus Candidate Evaluation Portal', 15, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Official Candidate Next Steps & Interview Regulations Guidelines', 15, 26);

  // Status Badge Block
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.roundedRect(15, 45, 180, 22, 3, 3, 'FD');

  doc.setTextColor(6, 95, 70); // emerald-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ASSESSMENT PASSED — CONGRATULATIONS!', 22, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text(`Candidate: ${params.candidateName} | Test Score: ${params.score}% | Application Ref: ${params.applicationId}`, 22, 61);

  // Section 1: Position & Next Interview Stage
  let y = 78;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('1. Next Interview Stage & Schedule Timeline', 15, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Target Position: ${params.jobTitle} (${params.department})`, 18, y);
  
  y += 6;
  doc.text(`Next Interview Stage: ${nextStage}`, 18, y);

  y += 6;
  doc.text(`Interview Invitation Link Delivery: Within ${hours} hours to ${params.candidateEmail}`, 18, y);

  y += 6;
  doc.text(`Format: Interactive Video Session (Google Meet / Screen Share) — 45 Minutes`, 18, y);

  // Section 2: Essential Rules & Regulations
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Candidate Rules & Evaluation Regulations', 15, y);

  const rules = [
    'Camera & Microphone Setup: Candidates must join with HD camera enabled and high-quality audio in a quiet environment.',
    'Identity Verification: Please have your National ID or Passport available for verification at the start of the call.',
    'Code of Conduct: Maintain utmost professional integrity. Screen sharing and live pair-programming may be required.',
    'Rescheduling Policy: Reschedule requests must be submitted at least 12 hours prior to the slot via the Candidate Portal.',
    'Confidentiality Agreement: System architecture questions and coding exercises are proprietary to Global Talent Plus.',
    'Technical Preparation: Ensure your modern browser, IDE, and internet connection are tested before the session.'
  ];

  y += 4;
  rules.forEach((rule, idx) => {
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Rule 2.${idx + 1}:`, 18, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const splitText = doc.splitTextToSize(rule, 155);
    doc.text(splitText, 35, y);
    if (splitText.length > 1) {
      y += (splitText.length - 1) * 4;
    }
  });

  // Section 3: Document & Security Notice
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Secure Document Storage & Verification', 15, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'All uploaded documents (Resume, ID Card, Certificates) are stored in our AES-256 encrypted vault system.\nOnly authorized recruiters and assigned interviewers are granted permission to inspect these credentials.',
    18,
    y
  );

  // Footer
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(15, 275, 195, 275);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Global Talent Plus Automated HR System — Reference ID: ${params.applicationId}`, 15, 281);
  doc.text(`Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 130, 281);

  const pdfDataUrl = doc.output('datauristring');
  return { pdfDataUrl, fileName, doc };
}

export function triggerPdfDownload(doc: jsPDF, fileName: string) {
  doc.save(fileName);
}
