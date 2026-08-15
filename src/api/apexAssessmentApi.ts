import { ApexQuestion, ApexExam, ApexInterviewProduct, ApexCourse, ApexCourseModule, ApexPackage, PaystackPayment, AiInterviewSession, ApexCertificate } from '../types';
import { apiFetch, jsonHeaders } from './client';

// Exams
export const getApexExams = async (): Promise<ApexExam[]> => {
  const res = await apiFetch('/apex/exams');
  if (!res.ok) throw new Error('Failed to load exams');
  return res.json();
};

export const saveApexExam = async (exam: ApexExam): Promise<ApexExam> => {
  const res = await apiFetch('/apex/exams', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(exam)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save exam');
  return data.exam;
};

export const deleteApexExam = async (id: string): Promise<boolean> => {
  const res = await apiFetch(`/apex/exams/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete exam');
  return true;
};

// Courses
export const getApexCourses = async (): Promise<ApexCourse[]> => {
  const res = await apiFetch('/apex/courses');
  if (!res.ok) throw new Error('Failed to load courses');
  return res.json();
};

export const saveApexCourse = async (course: ApexCourse): Promise<ApexCourse> => {
  const res = await apiFetch('/apex/courses', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(course)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save course');
  return data.course;
};

export const deleteApexCourse = async (id: string): Promise<boolean> => {
  const res = await apiFetch(`/apex/courses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete course');
  return true;
};

export const saveApexCourseModule = async (module: ApexCourseModule): Promise<ApexCourseModule> => {
  const res = await apiFetch('/apex/courses/modules', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(module)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save module');
  return data.module;
};

export const deleteApexCourseModule = async (id: string): Promise<boolean> => {
  const res = await apiFetch(`/apex/courses/modules/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete module');
  return true;
};

// PDF study material for a module. Deliberately not sending jsonHeaders here —
// the browser needs to set its own multipart/form-data boundary.
export const uploadApexCourseModuleDocument = async (moduleId: string, file: File): Promise<ApexCourseModule> => {
  const formData = new FormData();
  formData.append('document', file);

  const res = await apiFetch(`/apex/courses/modules/${moduleId}/document`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload the PDF');
  return data.module;
};

// Packages
export const getApexPackages = async (): Promise<ApexPackage[]> => {
  const res = await apiFetch('/apex/packages');
  if (!res.ok) throw new Error('Failed to load packages');
  return res.json();
};

export const saveApexPackage = async (pkg: ApexPackage): Promise<ApexPackage> => {
  const res = await apiFetch('/apex/packages', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(pkg)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save package');
  return data.package;
};

export const deleteApexPackage = async (id: string): Promise<boolean> => {
  const res = await apiFetch(`/apex/packages/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete package');
  return true;
};

// Interview Products
export const getApexInterviewProducts = async (): Promise<ApexInterviewProduct[]> => {
  const res = await apiFetch('/apex/interview-products');
  if (!res.ok) throw new Error('Failed to load interview products');
  return res.json();
};

export const saveApexInterviewProduct = async (product: ApexInterviewProduct): Promise<ApexInterviewProduct> => {
  const res = await apiFetch('/apex/interview-products', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(product)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save interview product');
  return data.product;
};

export const deleteApexInterviewProduct = async (id: string): Promise<boolean> => {
  const res = await apiFetch(`/apex/interview-products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete interview product');
  return true;
};

// Questions
export const getApexQuestions = async (): Promise<ApexQuestion[]> => {
  const res = await apiFetch('/apex/questions');
  if (!res.ok) throw new Error('Failed to load assessment questions');
  return res.json();
};

export const saveApexQuestion = async (q: ApexQuestion): Promise<ApexQuestion> => {
  const res = await apiFetch('/apex/questions', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(q)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save question');
  return data.question;
};

export const deleteApexQuestion = async (id: string): Promise<boolean> => {
  const res = await apiFetch(`/apex/questions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete question');
  return true;
};

export interface BulkQuestionUploadResult {
  success: boolean;
  inserted: number;
  skipped: number;
  totalRows: number;
  rowErrors: { row: number; reason: string }[];
}

// CSV bulk-load of questions into the shared question bank. Same multipart
// pattern as uploadApexCourseModuleDocument — no jsonHeaders, browser sets its own boundary.
export const uploadApexQuestionsCsv = async (file: File, examId?: string | null): Promise<BulkQuestionUploadResult> => {
  const formData = new FormData();
  formData.append('csvFile', file);
  if (examId) formData.append('examId', examId);

  const res = await apiFetch('/apex/questions/bulk-upload-csv', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload questions CSV');
  return data;
};

// Payments (recordPaystackPayment intentionally omitted — legacy, no longer called by any frontend flow)
export const getPaystackPayments = async (): Promise<PaystackPayment[]> => {
  const res = await apiFetch('/apex/paystack/history');
  if (!res.ok) throw new Error('Failed to load payment history');
  return res.json();
};

// AI Interview Sessions
export const saveAiInterviewSession = async (session: AiInterviewSession): Promise<AiInterviewSession> => {
  const res = await apiFetch('/apex/ai-interview/save', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(session)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save interview session');
  return data.session;
};

export const getAiInterviewSessions = async (): Promise<AiInterviewSession[]> => {
  const res = await apiFetch('/apex/ai-interview/history');
  if (!res.ok) throw new Error('Failed to load interview sessions');
  return res.json();
};
export const unlockCandidateStageTwo = async (
  candidateId: string
): Promise<{ eligibleAt: string; adminUnlockedAt: string }> => {
  const res = await apiFetch(`/apex/candidates/${candidateId}/stage-two/unlock`, {
    method: 'POST',
    headers: jsonHeaders
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to unlock the candidate’s next action');
  }

  return data;
};

// Certificates
export const getApexCertificates = async (): Promise<ApexCertificate[]> => {
  const res = await apiFetch('/apex/certificates');
  if (!res.ok) throw new Error('Failed to load certificates');
  return res.json();
};

export const approveApexCertificate = async (id: string): Promise<ApexCertificate> => {
  const res = await apiFetch(`/apex/certificates/${id}/approve`, {
    method: 'POST',
    headers: jsonHeaders
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve certificate');
  return data.certificate;
};