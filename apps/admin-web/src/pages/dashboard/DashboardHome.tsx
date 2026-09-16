import { useQuery } from '@tanstack/react-query';
import { CalendarRange, GraduationCap, Layers, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useBatches, useStudents, useTeachers } from '../../hooks/queries';
import { StatCard } from '../../components/ui/StatCard';
import type { AcademicSession } from '../../types';

export default function DashboardHome() {
  const students = useStudents();
  const teachers = useTeachers();
  const batches = useBatches();
  const current = useQuery({
    queryKey: ['sessions', 'current'],
    queryFn: () => api.get<AcademicSession>('/sessions/current').then((r) => r.data),
    retry: false, // 404 simply means no current session is set
  });

  const activeStudents = students.data?.filter((s) => s.status === 'active').length;
  const activeBatches = batches.data?.filter((b) => b.isActive).length;

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="text-sm text-ink/50 mt-1">আপনার institute-এর overview</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard label="চলতি session" value={current.data?.name ?? (current.isLoading ? '–' : 'নেই')} icon={CalendarRange} accent="amber" />
        <StatCard label="সক্রিয় student" value={activeStudents ?? '–'} icon={GraduationCap} />
        <StatCard label="মোট teacher" value={teachers.data?.length ?? '–'} icon={Users} />
        <StatCard label="সক্রিয় batch" value={activeBatches ?? '–'} icon={Layers} />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-white p-6">
        <h2 className="font-display font-semibold text-ink mb-1">পরবর্তী ধাপ</h2>
        <p className="text-sm text-ink/60">
          Session, class, guardian আর batch enrollment এখন আছে। Fees ও payment Phase 3-তে যোগ হবে, আর তার আগে
          browser থেকে data যোগ করার form আসবে।
        </p>
      </div>
    </div>
  );
}
