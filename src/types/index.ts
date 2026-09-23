export type UserRole = 'candidate' | 'recruiter' | 'hiring_manager' | 'interviewer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  phone?: string;
  gender?: string;
  location?: string;
  age?: number;
  createdAt: string;
}

export type JobStatus = 'active' | 'draft' | 'closed';
export type WorkType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Remote' | 'Hybrid';

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  points: number;
}

export interface JobAssessment {
  id: string;
  jobId: string;
  title: string;
  passingScore: number; // e.g., 70
  durationMinutes: number;
  questions: AssessmentQuestion[];
}

export interface Job {
  id: string;
  title: string;
  department: string;
  country?: string;
  location: string;
  workType: WorkType;
  experienceLevel: string;
  salaryRange: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  status: JobStatus;
  applicationCount: number;
  assessmentId?: string;
  apexPackageId?: string;
  apexExamId?: string;
  apexPackageIds?: string[];
  postedAt: string;
  deadline?: string;
  expiresAt?: string | null;
  lastCustomEmail?: {
    sentAt: string;
    subject: string;
    messagePreview: string;
  } | null;
}

export type ApplicationStage =
  | 'Submitted'
  | 'Assessment Passed'
  | 'Assessment Failed'
  | 'Screening'
  | 'Technical Interview'
  | 'Final Interview'
  | 'Offer Extended'
  | 'Hired'
  | 'Rejected';

export interface SubmittedDocument {
  id: string;
  applicationId: string;
  fileName: string;
  fileType: 'resume' | 'id_card' | 'cover_letter' | 'certificate' | 'passport' | 'covid_cover' | 'good_conduct' | 'other';
  fileSize: string;
  uploadedAt: string;
  encryptedHash: string;
  status: 'verified' | 'pending' | 'flagged';
  downloadUrl?: string;
}


export type ComplianceQuestionId =
  | 'hasCovidCover'
  | 'hasForeignExperience'
  | 'hasPassport'
  | 'hasApexCertificate'
  | 'hasGoodConduct'
  | 'willingToRelocate'
  | 'hasLegalRestrictions';

export interface ReadinessItem {
  id: ComplianceQuestionId;
  answer: 'yes' | 'no' | null;
  complete: boolean;
  status: 'complete' | 'missing' | 'not_available' | 'needs_upload';
  documentType?: SubmittedDocument['fileType'];
  message: string;
}

export interface ReadinessProgress {
  percentage: number;
  completed: number;
  total: number;
  items: ReadinessItem[];
}

export interface ApplicationVoucher {
  id: string;
  applicationId: string;
  candidateId: string;
  code: string;
  packageIds: string[];
  issuedAt: string;
  redeemedByCandidateId?: string | null;
  redeemedAt?: string | null;
}
export interface CandidateAssessmentResult {
  id: string;
  applicationId: string;
  score: number; // percentage e.g. 85
  passed: boolean;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  answers: Record<string, number>; // questionId -> selectedIndex
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLocation: string;
  experienceYears: number;
  currentCompany?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  stage: ApplicationStage;
  appliedAt: string;
  lastUpdated: string;
  assessmentResult?: CandidateAssessmentResult;
  documents: SubmittedDocument[];
  notes?: string[];
  rating?: number; // 1-5

  // Apex Assessment System (2-stage paid pipeline: assessment test + AI video interview)
  apexStage1Paid?: boolean;
  apexStage1Passed?: boolean;
  apexStage1Score?: number;
  apexStage2Paid?: boolean;
  apexStage2Passed?: boolean;
  apexStage2AiScore?: number;
  apexInterviewExpiresAt?: string;

  complianceAnswers?: Partial<Record<ComplianceQuestionId, 'yes' | 'no'>>;
  atestaCertificateId?: string | null;
  atestaCertificateVerified?: boolean;
  readinessProgress?: ReadinessProgress;
  readinessUpdatedAt?: string;
}

export type PaystackProvider = 'mpesa' | 'visa' | 'airtel_money';

export interface PaystackPayment {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  amountKsh: number;
  provider: PaystackProvider;
  phoneNumberOrCard: string;
  transactionRef: string;
  stage: 'stage_1_assessment' | 'stage_2_ai_interview';
  status: 'approved' | 'failed' | 'pending';
  createdAt: string;
}

export interface ApexExam {
  id: string;
  jobTitle: string;
  name: string;
  description?: string;
  category?: string;
  costKsh: number;
  isActive: boolean;
  questionsPerAttempt: number;
  timeLimitMinutes: number;
  passMarkPercent: number;
  examType: 'general' | 'professional';
  interviewCostKsh?: number | null;
  interviewPassMarkPercent?: number | null;
}

export interface ApexModuleQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ApexCourseModule {
  id: string;
  courseId: string;
  title: string;
  contentType: 'text' | 'video' | 'quiz';
  summary?: string | null;
  externalLink?: string | null;
  externalLinkLabel?: string | null;
  quiz?: ApexModuleQuizQuestion[] | null;
  contentBody?: string | null;
  contentUrl?: string | null;
  documentUrl?: string | null;
  documentName?: string | null;
  orderIndex: number;
}

export interface ApexCourse {
  id: string;
  name: string;
  description?: string;
  category?: string;
  durationDays: number;
  costKsh: number;
  passMarkPercent: number;
  isActive: boolean;
  documentUrl?: string | null;
  documentName?: string | null;
  modules?: ApexCourseModule[];
}

export interface ApexPackageInstructions {
  whatItCarries?: string;
  whyStudyIt?: string;
  whyCertificateMatters?: string;
  howToCompleteSteps?: string[];
  confidentialityNote?: string;
  examIntro?: string;
  courseIntro?: string;
  interviewIntro?: string;
}

export interface ApexPackage {
  id: string;
  name: string;
  packageId?: string;
  description?: string;
  category?: string;
  examId?: string;
  courseId?: string;
  examIds?: string[];
  courseIds?: string[];
  costKsh: number;
  interviewCostKsh?: number | null;
  interviewPassMarkPercent?: number | null;
  certificateRule: 'AND' | 'OR';
  isActive: boolean;
  instructions?: ApexPackageInstructions | null;
}

export interface ApexInterviewProduct {
  id: string;
  jobTitle: string;
  name: string;
  description?: string;
  costKsh: number;
  isActive: boolean;
}

export interface ApexCertificate {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string | null;
  sourceType: 'exam' | 'course' | 'package' | 'manual';
  sourceId: string;
  sourceName: string;
  verificationCode: string;
  examScorePercent?: number | null;
  screeningScorePercent?: number | null;
  resultLabel?: string;
  taglineText?: string;
  verifyUrlText?: string | null;
  signedByName?: string;
  signedByTitle?: string;
  recognitionText?: string;
  generatedManually?: boolean;
  pdfUrl?: string | null;
  status: 'pending_approval' | 'approved';
  approvedAt?: string | null;
  approvedBy?: string | null;
  issuedAt: string;
}

export interface ApexQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  points: number;
  examId: string | null;
}

export interface AiInterviewConfig {
  id: string;
  jobId: string;
  promptScript: string;
  timeLimitPerQuestionSeconds: number;
  passingScore: number;
  questions: string[];
}

export interface AiInterviewSession {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  status: 'pending_payment' | 'paid_ready' | 'in_progress' | 'completed';
  score?: number;
  transcript?: Array<{ speaker: 'AI Recruiter' | 'Candidate'; message: string; timestamp: string }>;
  videoFeedStatus?: boolean;
  completedAt?: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  interviewerId: string;
  interviewerName: string;
  stage: ApplicationStage;
  scheduledAt: string; // ISO date string
  durationMinutes: number;
  meetingLink: string;
  locationOrPlatform: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
}

export interface EmailLog {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  subject: string;
  bodyPreview: string;
  fullBody: string;
  sentAt: string;
  status: 'delivered' | 'sent' | 'failed';
  triggerEvent: 'assessment_pass' | 'assessment_fail' | 'assessment_completed' | 'interview_pass' | 'interview_fail' | 'application_received' | 'interview_scheduled' | 'stage_change' | 'password_reset' | 'account_activation' | 'apex_enrollment_payment_received' | 'national_id_recovery' | 'custom' | 'custom_job_broadcast';  pdfAttachmentName?: string;
  pdfDataUrl?: string;
  candidateLocation?: string;
  candidateAge?: number;
}

export interface RbacRole {
  role: UserRole;
  title: string;
  description: string;
  permissions: {
    viewJobs: boolean;
    manageJobs: boolean;
    applyToJobs: boolean;
    viewCandidates: boolean;
    updateCandidateStatus: boolean;
    bulkEditCandidates: boolean;
    scheduleInterviews: boolean;
    viewDocumentVault: boolean;
    viewEmailLogs: boolean;
    manageTeamRbac: boolean;
  };
}
