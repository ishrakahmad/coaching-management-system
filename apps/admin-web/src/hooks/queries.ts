import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  AcademicClass, AcademicSession, Batch, DuesResponse, Enrollment, FeeSummary, Guardian, Ledger, Payment, StaffUser,
  Student, Subject, Teacher,
} from '../types';

type Params = Record<string, string | boolean | undefined>;
const get = <T,>(url: string, params?: Params) => api.get<T>(url, { params }).then((r) => r.data);

// Query keys are grouped by resource so a mutation can refresh everything related with one key.
export const useStudents = (enabled = true) => useQuery({ queryKey: ['students'], queryFn: () => get<Student[]>('/students'), enabled });
export const useStudent = (id: string) =>
  useQuery({ queryKey: ['students', id], queryFn: () => get<Student>(`/students/${id}`) });
export const useEnrollments = (studentId: string) =>
  useQuery({ queryKey: ['students', studentId, 'enrollments'], queryFn: () => get<Enrollment[]>(`/students/${studentId}/enrollments`) });

export const useTeachers = (enabled = true) =>
  useQuery({ queryKey: ['teachers'], queryFn: () => get<Teacher[]>('/teachers'), enabled });

export const useBatches = (sessionId?: string) =>
  useQuery({ queryKey: ['batches', { sessionId }], queryFn: () => get<Batch[]>('/batches', { sessionId }) });

export const useGuardians = (search?: string) =>
  useQuery({
    queryKey: ['guardians', { search }],
    queryFn: () => get<Guardian[]>('/guardians', { search: search || undefined }),
    placeholderData: (previous) => previous,
  });

export const useClasses = () => useQuery({ queryKey: ['classes'], queryFn: () => get<AcademicClass[]>('/classes') });
export const useSessions = () => useQuery({ queryKey: ['sessions'], queryFn: () => get<AcademicSession[]>('/sessions') });
export const useSubjects = () => useQuery({ queryKey: ['subjects'], queryFn: () => get<Subject[]>('/subjects') });
export const useStaff = () => useQuery({ queryKey: ['staff'], queryFn: () => get<StaffUser[]>('/staff') });

export const useLedger = (studentId: string, enabled = true) =>
  useQuery({ queryKey: ['fees', 'ledger', studentId], queryFn: () => get<Ledger>(`/students/${studentId}/fees`), enabled });

export const useDues = ({ enabled = true, ...params }: { batchId?: string; search?: string; overdueOnly?: boolean; enabled?: boolean }) =>
  useQuery({
    enabled,
    queryKey: ['fees', 'dues', params],
    queryFn: () =>
      get<DuesResponse>('/fees/dues', {
        batchId: params.batchId || undefined,
        search: params.search || undefined,
        overdueOnly: params.overdueOnly ? 'true' : undefined,
      }),
    placeholderData: (previous) => previous,
  });

export const useFeeSummary = (period?: string, enabled = true) =>
  useQuery({ queryKey: ['fees', 'summary', period], queryFn: () => get<FeeSummary>('/fees/summary', { period }), enabled });

export const usePayments = (params: { from?: string; to?: string; method?: string; includeVoided?: boolean }) =>
  useQuery({
    queryKey: ['payments', params],
    queryFn: () =>
      get<Payment[]>('/payments', {
        from: params.from || undefined,
        to: params.to || undefined,
        method: params.method || undefined,
        includeVoided: params.includeVoided ? 'true' : undefined,
      }),
    placeholderData: (previous) => previous,
  });

export const usePayment = (id: string) => useQuery({ queryKey: ['payments', id], queryFn: () => get<Payment>(`/payments/${id}`) });

export const useCurrentSession = () =>
  useQuery({
    queryKey: ['sessions', 'current'],
    queryFn: () => get<AcademicSession>('/sessions/current'),
    retry: false, // 404 just means no current session is set
  });
