// Response shapes from the API (apps/api). Keep in sync with packages/types.

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  isActive: boolean;
}

export interface AcademicClass {
  id: string;
  name: string;
  code: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code?: string | null;
}

export interface Teacher {
  id: string;
  designation?: string | null;
  qualification?: string | null;
  monthlySalary?: number | null;
  isActive: boolean;
  user?: UserSummary;
  subjects?: Subject[];
}

export interface Batch {
  id: string;
  name: string;
  monthlyFee: number;
  schedule: string | null;
  isActive: boolean;
  sessionId: string | null;
  classId: string | null;
  academicSession: AcademicSession | null;
  academicClass: AcademicClass | null;
  leadTeacher: { id: string; designation?: string | null; user?: { fullName: string } } | null;
  subjects: Subject[];
  activeStudentCount: number;
}

export type EnrollmentStatus = 'active' | 'left';

export interface Enrollment {
  id: string;
  studentId: string;
  batchId: string;
  enrolledAt: string;
  leftAt: string | null;
  status: EnrollmentStatus;
  feeOverride: number | null;
  batch?: Batch;
}

export type GuardianRelation = 'father' | 'mother' | 'sibling' | 'relative' | 'other';

export interface Guardian {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  address: string | null;
  userId: string | null;
  students?: Student[];
}

export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'graduated';

export interface Student {
  id: string;
  studentId: string;
  status: StudentStatus;
  admissionDate: string;
  address: string | null;
  guardianId: string | null;
  guardianRelation: GuardianRelation | null;
  guardian: Guardian | null;
  user?: UserSummary;
  enrollments?: Enrollment[];
}
