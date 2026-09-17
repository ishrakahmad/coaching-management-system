import type { Role } from '../types';

const has = (role: string | undefined, allowed: Role[]) => role === 'super_admin' || allowed.includes(role as Role);

// Mirrors apps/api/src/common/constants/roles.ts. The API enforces these; the UI only hides what would fail.
export const canManage = (role?: string) => has(role, ['institute_admin', 'manager']);
export const canSeeFinance = (role?: string) => has(role, ['institute_admin', 'manager', 'accountant']);
export const canVoidPayment = (role?: string) => has(role, ['institute_admin', 'accountant']);
export const canSeeStudents = (role?: string) => has(role, ['institute_admin', 'manager', 'accountant', 'teacher']);
export const isInstituteAdmin = (role?: string) => has(role, ['institute_admin']);
