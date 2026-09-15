import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export default function BatchesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => api.get('/batches').then((r) => r.data),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Batches</h1>
          <p className="text-sm text-ink/50 mt-1">সব batch-এর তালিকা</p>
        </div>
        <button className="rounded-lg bg-teal-800 text-paper text-sm font-medium px-4 py-2.5 hover:bg-teal-900 transition">
          + নতুন Batch
        </button>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-ink/40 text-sm">Loading...</p>}
        {data?.length === 0 && <p className="text-ink/40 text-sm">এখনো কোনো batch নেই।</p>}
        {data?.map((b: any) => (
          <div key={b.id} className="rounded-xl border border-border bg-white p-5">
            <div className="font-display font-semibold text-ink">{b.name}</div>
            <div className="text-sm text-ink/50">{b.session}</div>
            <div className="text-sm text-teal-700 font-medium mt-2">৳ {b.monthlyFee} / মাস</div>
            <div className="text-xs text-ink/40 mt-1">{b.schedule}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
