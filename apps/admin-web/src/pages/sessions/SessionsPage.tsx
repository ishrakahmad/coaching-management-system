import { useSessions } from '../../hooks/queries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/format';

export default function SessionsPage() {
  const { data = [], isLoading, isError } = useSessions();

  return (
    <div className="p-8">
      <PageHeader title="Sessions" description="প্রতিটা শিক্ষাবর্ষ; একসাথে একটাই চলতি session থাকে" />

      <DataTable
        columns={['Session', 'সময়কাল', 'Status']}
        isLoading={isLoading}
        isError={isError}
        isEmpty={data.length === 0}
        emptyMessage="এখনো কোনো session নেই।"
      >
        {data.map((s) => {
          const start = formatDate(s.startDate);
          const end = formatDate(s.endDate);
          return (
            <tr key={s.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
              <td className="px-4 py-3 text-ink/60 tabular-nums whitespace-nowrap">
                {start || end ? `${start ?? '?'} থেকে ${end ?? '?'}` : <span className="text-ink/40">দেওয়া নেই</span>}
              </td>
              <td className="px-4 py-3">
                {s.isCurrent ? (
                  <StatusBadge tone="attention">চলতি</StatusBadge>
                ) : s.isActive ? (
                  <StatusBadge tone="active">সক্রিয়</StatusBadge>
                ) : (
                  <StatusBadge tone="muted">নিষ্ক্রিয়</StatusBadge>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
