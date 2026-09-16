import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useGuardians } from '../../hooks/queries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';

function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function GuardiansPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search.trim());
  const { data = [], isLoading, isError } = useGuardians(debouncedSearch);

  return (
    <div className="p-8">
      <PageHeader
        title="Guardians"
        description="একই phone নম্বরের ভাই-বোন একজন guardian-এর অধীনে থাকে"
        actions={
          <label className="relative block">
            <span className="sr-only">নাম বা phone দিয়ে খুঁজুন</span>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম বা phone"
              className="w-64 rounded-lg border border-border bg-white pl-9 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition"
            />
          </label>
        }
      />

      <DataTable
        columns={['নাম', 'Phone', 'সন্তান', 'Portal login']}
        isLoading={isLoading}
        isError={isError}
        isEmpty={data.length === 0}
        emptyMessage={debouncedSearch ? `"${debouncedSearch}" নামে বা নম্বরে কোনো guardian পাওয়া যায়নি।` : 'এখনো কোনো guardian নেই। Student ভর্তির সময় guardian যোগ হয়।'}
      >
        {data.map((g) => (
          <tr key={g.id} className="border-t border-border align-top">
            <td className="px-4 py-3">
              <div className="text-ink">{g.fullName}</div>
              {g.occupation && <div className="text-xs text-ink/50">{g.occupation}</div>}
            </td>
            <td className="px-4 py-3 tabular-nums text-ink/70 whitespace-nowrap">
              {g.phone ?? <span className="text-ink/40">নেই</span>}
            </td>
            <td className="px-4 py-3">
              {g.students?.length ? (
                <ul className="space-y-0.5">
                  {g.students.map((s) => (
                    <li key={s.id}>
                      {s.user?.fullName} <span className="font-mono text-xs text-ink/50">{s.studentId}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-ink/40">কেউ যুক্ত নেই</span>
              )}
            </td>
            <td className="px-4 py-3">
              {g.userId ? <StatusBadge tone="active">আছে</StatusBadge> : <StatusBadge tone="muted">নেই</StatusBadge>}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
