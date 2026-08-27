import jsPDF from 'jspdf';

export interface CertificateFields {
  candidateName: string;
  taglineText: string;
  certificateId: string; // e.g. ATC-2026-004821
  examScorePercent?: number | null;
  screeningScorePercent?: number | null;
  resultLabel: string;
  issueDate: string; // pre-formatted, e.g. "August 26, 2026"
  verifyUrlText: string; // e.g. "verify.atesta.io/ATC-2026-004821"
  signedByName: string;
  signedByTitle: string;
  recognitionText: string;
}

const NAVY = [18, 33, 63] as const;
const NAVY_DEEP = [11, 23, 48] as const;
const BRASS = [185, 146, 47] as const;
const BRASS_LIGHT = [228, 200, 120] as const;
const INK = [34, 40, 58] as const;
const INK_SOFT = [91, 95, 114] as const;
const VERIFY_GREEN = [47, 111, 82] as const;

export function generateAtestaCertificatePdf(fields: CertificateFields): { doc: jsPDF; fileName: string } {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth(); // 297
  const pageHeight = doc.internal.pageSize.getHeight(); // 210
  const centerX = pageWidth / 2;

  // Paper background
  doc.setFillColor(251, 247, 238);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Corner triangles — sized so they never reach the footer text (the old
  // 74mm corners were large enough to slice through the right-hand column)
  const cornerSize = 40;
  doc.setFillColor(...NAVY_DEEP);
  doc.triangle(0, 0, cornerSize, 0, 0, cornerSize, 'F');
  doc.triangle(pageWidth, pageHeight, pageWidth - cornerSize, pageHeight, pageWidth, pageHeight - cornerSize, 'F');

  // Brass double frame
  doc.setDrawColor(...BRASS);
  doc.setLineWidth(0.6);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);
  doc.setDrawColor(216, 203, 160);
  doc.setLineWidth(0.3);
  doc.rect(15.5, 15.5, pageWidth - 31, pageHeight - 31);

  // Eyebrow
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('A T E S T A   C E R T I F I C A T I O N', centerX, 30, { align: 'center' });

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(11);
  doc.setTextColor(...INK_SOFT);
  doc.text('Coursework  ·  Examination  ·  International Screening', centerX, 37, { align: 'center' });

  // Title
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(30);
  doc.setTextColor(...NAVY);
  doc.text('Certificate of Certification', centerX, 51, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK_SOFT);
  doc.text('This is to certify that', centerX, 59, { align: 'center' });

  // Candidate name
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...NAVY_DEEP);
  doc.text(fields.candidateName, centerX, 73, { align: 'center' });
  doc.setDrawColor(...BRASS);
  doc.setLineWidth(0.4);
  doc.line(centerX - 65, 77, centerX + 65, 77);

  // Body / tagline (admin-editable)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  const bodyText = `has successfully completed the required coursework, passed the qualifying examination, and cleared international screening for ${fields.taglineText}, fulfilling every requirement set by the Atesta Certification Board.`;
  const bodyLines = doc.splitTextToSize(bodyText, 195);
  doc.text(bodyLines, centerX, 87, { align: 'center' });

  // Score strip
  const scoreY = 87 + bodyLines.length * 5.2 + 14;
  doc.setDrawColor(216, 203, 160);
  doc.setLineWidth(0.3);
  doc.line(centerX - 85, scoreY - 8, centerX + 85, scoreY - 8);
  doc.line(centerX - 85, scoreY + 5, centerX + 85, scoreY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text(fields.examScorePercent != null ? `${fields.examScorePercent}%` : '—', centerX - 55, scoreY, { align: 'center' });
  doc.text(fields.screeningScorePercent != null ? `${fields.screeningScorePercent}%` : '—', centerX, scoreY, { align: 'center' });
  doc.text(fields.resultLabel, centerX + 55, scoreY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);
  doc.text('EXAM SCORE', centerX - 55, scoreY + 4.5, { align: 'center' });
  doc.text('SCREENING SCORE', centerX, scoreY + 4.5, { align: 'center' });
  doc.text('RESULT', centerX + 55, scoreY + 4.5, { align: 'center' });

  // ── Footer row — fixed near the bottom, well clear of the corner triangles ──
  const footerY = pageHeight - 60; // top of footer block

  // Left: Certificate ID + issue date
  const leftX = 34;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);
  doc.text('CERTIFICATE ID', leftX, footerY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(fields.certificateId, leftX, footerY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);
  doc.text('ISSUE DATE', leftX, footerY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(fields.issueDate, leftX, footerY + 18.5);

  // Center: seal (sunburst ring + disc + monogram + ribbon)
  const sealX = centerX;
  const sealY = footerY + 8;
  const R = 13;

  // 24-tick sunburst
  doc.setDrawColor(...BRASS);
  doc.setLineWidth(0.45);
  for (let i = 0; i < 24; i++) {
    const angle = (i * 15 * Math.PI) / 180;
    const x1 = sealX + Math.sin(angle) * (R + 1);
    const y1 = sealY - Math.cos(angle) * (R + 1);
    const x2 = sealX + Math.sin(angle) * (R + 4);
    const y2 = sealY - Math.cos(angle) * (R + 4);
    doc.line(x1, y1, x2, y2);
  }

  // thin outer ring
  doc.setLineWidth(0.3);
  doc.circle(sealX, sealY, R + 2.2);

  // main disc
  doc.setFillColor(...NAVY_DEEP);
  doc.setDrawColor(...BRASS_LIGHT);
  doc.setLineWidth(0.6);
  doc.circle(sealX, sealY, R, 'FD');

  // inner accent ring
  doc.setDrawColor(...BRASS_LIGHT);
  doc.setLineWidth(0.25);
  doc.circle(sealX, sealY, R - 2.3);

  // monogram
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...BRASS_LIGHT);
  doc.text('A', sealX, sealY + 5, { align: 'center' });

  // ribbon tails beneath the disc — V-notch pennant, well clear of the frame
  doc.setFillColor(...NAVY_DEEP);
  doc.setDrawColor(...BRASS);
  doc.setLineWidth(0.4);
  doc.lines(
    [
      [16, 0],
      [0, 16],
      [-8, -6],
      [-8, 6],
      [0, -16]
    ],
    sealX - 8,
    sealY + R - 1,
    [1, 1],
    'FD',
    true
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...BRASS_LIGHT);
  doc.text('CERTIFIED', sealX, sealY + R + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);
  doc.text('Official Seal · Atesta Certification Board', sealX, sealY + R + 20, { align: 'center' });

  // Right: verify / signed / recognition — kept well inside the margin so
  // the corner triangle never crosses it
  const rightX = pageWidth - 42;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);
  doc.text('VERIFY AT', rightX, footerY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(fields.verifyUrlText, rightX, footerY + 5.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);
  doc.text('SIGNED', rightX, footerY + 13, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(`${fields.signedByName}, ${fields.signedByTitle}`, rightX, footerY + 18.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...VERIFY_GREEN);
  doc.text(fields.recognitionText, rightX, footerY + 26, { align: 'right' });

  const fileName = `Atesta_Certificate_${fields.candidateName.replace(/\s+/g, '_')}.pdf`;
  return { doc, fileName };
}