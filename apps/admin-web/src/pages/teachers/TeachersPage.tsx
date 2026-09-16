import { useTeachers } from '../../hooks/queries';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function TeachersPage() {
  const { data = [], isLoading, isError } = useTeachers();

  return (
    <div className="p-8">
      <PageHeader title="Teachers" description="সব teacher আর তাদের subject" />

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-ink/40 text-sm">Loading...</p>}
        {isError && <p className="text-red-600 text-sm">Data load করা যায়নি। Backend চলছে কিনা check করুন।</p>}
        {!isLoading && !isError && data.length === 0 && <p className="text-ink/40 text-sm">এখনো কোনো teacher নেই।</p>}
        {data.map((t) => (
          <article key={t.id} className={`rounded-xl border border-border bg-white p-5 ${t.isActive ? '' : 'opacity-70'}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display font-semibold text-ink">{t.user?.fullName}</h2>
              {!t.isActive && <StatusBadge tone="muted">নিষ্ক্রিয়</StatusBadge>}
            </div>
            <div className="text-sm text-ink/50">{t.designation || 'Teacher'}</div>
            <div className="text-xs text-ink/40 mt-2">{t.user?.email}</div>
            {t.subjects?.length ? (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {t.subjects.map((s) => (
                  <span key={s.id} className="text-xs bg-amber-400/10 text-amber-700 rounded-full px-2.5 py-1">
                    {s.name}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
