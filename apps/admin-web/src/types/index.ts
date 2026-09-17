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
  dateOfBirth: string | null;
  address: string | null;
  guardianId: string | null;
  guardianRelation: GuardianRelation | null;
  guardian: Guardian | null;
  user?: UserSummary;
  enrollments?: Enrollment[];
}

// ---------------- Phase 3: fees & payments ----------------

export type Role = 'super_admin' | 'institute_admin' | 'manager' | 'accountant' | 'teacher' | 'employee' | 'student' | 'guardian';

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
}

export type FeeType = 'monthly' | 'admission' | 'exam' | 'other';
export type FeeStatus = 'unpaid' | 'partial' | 'paid' | 'waived';

export interface StudentFee {
  id: string;
  studentId: string;
  enrollmentId: string | null;
  batchId: string | null;
  batch?: Batch | null;
  type: FeeType;
  title: string;
  period: string | null;
  amount: number;
  discount: number;
  paidAmount: number;
  dueAmount: number;
  status: FeeStatus;
  dueDate: string | null;
  note: string | null;
  waivedReason: string | null;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'card';

export interface PaymentAllocation {
  id: string;
  feeId: string;
  amount: number;
  fee?: StudentFee;
}

export interface Payment {
  id: string;
  receiptNo: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  note: string | null;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
  receivedBy?: { fullName: string } | null;
  student?: Student;
  allocations?: PaymentAllocation[];
  institute?: { name: string; address?: string | null; phone?: string | null; email?: string | null };
}

export interface Ledger {
  student: Student;
  summary: { billed: number; discount: number; paid: number; due: number; waived: number };
  fees: StudentFee[];
  payments: Payment[];
}

export interface DueRow {
  id: string;
  studentCode: string;
  fullName: string;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  due: number;
  feeCount: number;
  overdueCount: number;
  oldestDueDate: string | null;
}

export interface DuesResponse {
  totalDue: number;
  studentCount: number;
  students: DueRow[];
}

export interface FeeSummary {
  period: string;
  label: string;
  collected: { total: number; count: number };
  collectedToday: number;
  byMethod: { method: PaymentMethod; total: number; count: number }[];
  billed: { total: number; count: number };
  outstanding: { total: number; students: number };
}

export interface GenerateResult {
  period: string;
  label: string;
  eligible: number;
  created: number;
  alreadyBilled: number;
}
