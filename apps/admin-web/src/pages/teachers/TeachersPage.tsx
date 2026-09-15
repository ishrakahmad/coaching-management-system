import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export default function TeachersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then((r) => r.data),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teachers</h1>
          <p className="text-sm text-ink/50 mt-1">সব teacher-এর তালিকা</p>
        </div>
        <button className="rounded-lg bg-teal-800 text-paper text-sm font-medium px-4 py-2.5 hover:bg-teal-900 transition">
          + নতুন Teacher
        </button>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-ink/40 text-sm">Loading...</p>}
        {data?.length === 0 && <p className="text-ink/40 text-sm">এখনো কোনো teacher নেই।</p>}
        {data?.map((t: any) => (
          <div key={t.id} className="rounded-xl border border-border bg-white p-5">
            <div className="font-display font-semibold text-ink">{t.user?.fullName}</div>
            <div className="text-sm text-ink/50">{t.designation || 'Teacher'}</div>
            <div className="text-xs text-ink/40 mt-2">{t.user?.email}</div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {t.subjects?.map((s: any) => (
                <span key={s.id} className="text-xs bg-amber-400/10 text-amber-700 rounded-full px-2.5 py-1">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
