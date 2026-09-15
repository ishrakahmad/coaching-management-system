export enum Role {
  SUPER_ADMIN = 'super_admin',
  INSTITUTE_ADMIN = 'institute_admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  TEACHER = 'teacher',
  EMPLOYEE = 'employee',
  STUDENT = 'student',
  GUARDIAN = 'guardian',
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  instituteId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Institute {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
}

export interface Teacher {
  id: string;
  userId: string;
  designation?: string;
  qualification?: string;
  monthlySalary?: number;
  isActive: boolean;
  user?: { fullName: string; email: string; phone?: string };
  subjects?: Subject[];
}

export interface Batch {
  id: string;
  name: string;
  session?: string;
  monthlyFee: number;
  schedule?: string;
  isActive: boolean;
  leadTeacherId?: string;
  subjects?: Subject[];
}

export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'graduated';

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  dateOfBirth?: string;
  status: StudentStatus;
  admissionDate: string;
  user?: { fullName: string; email: string; phone?: string };
  batches?: Batch[];
}
