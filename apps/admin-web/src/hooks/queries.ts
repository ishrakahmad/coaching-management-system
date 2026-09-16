import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AcademicClass, AcademicSession, Batch, Guardian, Student, Teacher } from '../types';

const get = <T,>(url: string, params?: Record<string, string | undefined>) =>
  api.get<T>(url, { params }).then((r) => r.data);

export const useStudents = () => useQuery({ queryKey: ['students'], queryFn: () => get<Student[]>('/students') });

export const useTeachers = () => useQuery({ queryKey: ['teachers'], queryFn: () => get<Teacher[]>('/teachers') });

export const useBatches = (sessionId?: string) =>
  useQuery({
    queryKey: ['batches', { sessionId }],
    queryFn: () => get<Batch[]>('/batches', { sessionId }),
  });

export const useGuardians = (search?: string) =>
  useQuery({
    queryKey: ['guardians', { search }],
    queryFn: () => get<Guardian[]>('/guardians', { search: search || undefined }),
    placeholderData: (previous) => previous, // keep the list on screen while a new search loads
  });

export const useClasses = () => useQuery({ queryKey: ['classes'], queryFn: () => get<AcademicClass[]>('/classes') });

export const useSessions = () => useQuery({ queryKey: ['sessions'], queryFn: () => get<AcademicSession[]>('/sessions') });
