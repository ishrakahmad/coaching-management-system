import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Users, Layers, Wallet } from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/ui/StatCard';

export default function DashboardHome() {
  const students = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((r) => r.data),
  });
  const teachers = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then((r) => r.data),
  });
  const batches = useQuery({
    queryKey: ['batches'],
    queryFn: () => api.get('/batches').then((r) => r.data),
  });

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="text-sm text-ink/50 mt-1">আপনার institute-এর overview</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard label="মোট Student" value={students.data?.length ?? '–'} icon={GraduationCap} />
        <StatCard label="মোট Teacher" value={teachers.data?.length ?? '–'} icon={Users} />
        <StatCard label="সক্রিয় Batch" value={batches.data?.length ?? '–'} icon={Layers} />
        <StatCard label="এই মাসের Due" value="৳ 0" icon={Wallet} accent="amber" />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-white p-6">
        <h2 className="font-display font-semibold text-ink mb-1">পরবর্তী ধাপ</h2>
        <p className="text-sm text-ink/60">
          Attendance, Fees/Payments, Exam ও Results module এখনো যোগ করা হয়নি — Phase 2-তে যোগ হবে।
          এখন Students, Teachers ও Batches manage করা যাবে।
        </p>
      </div>
    </div>
  );
}
