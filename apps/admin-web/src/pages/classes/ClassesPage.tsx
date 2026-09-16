import { useClasses } from '../../hooks/queries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function ClassesPage() {
  const { data = [], isLoading, isError } = useClasses();

  return (
    <div className="p-8">
      <PageHeader title="Classes" description="নিচু থেকে উঁচু ক্রমে সাজানো; পরে promotion এই ক্রম মেনে হবে" />

      <DataTable
        columns={['Class', 'Code', 'Status']}
        isLoading={isLoading}
        isError={isError}
        isEmpty={data.length === 0}
        emptyMessage="এখনো কোনো class নেই।"
      >
        {data.map((c) => (
          <tr key={c.id} className="border-t border-border">
            <td className="px-4 py-3 text-ink">{c.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-ink/60">{c.code ?? '—'}</td>
            <td className="px-4 py-3">
              {c.isActive ? <StatusBadge tone="active">সক্রিয়</StatusBadge> : <StatusBadge tone="muted">নিষ্ক্রিয়</StatusBadge>}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
