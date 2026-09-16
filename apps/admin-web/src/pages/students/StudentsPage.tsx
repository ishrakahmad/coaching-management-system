import { useStudents } from '../../hooks/queries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { relationLabel } from '../../lib/format';
import type { StudentStatus } from '../../types';

const statusTone: Record<StudentStatus, 'active' | 'muted'> = {
  active: 'active',
  inactive: 'muted',
  transferred: 'muted',
  graduated: 'muted',
};

export default function StudentsPage() {
  const { data = [], isLoading, isError } = useStudents();

  return (
    <div className="p-8">
      <PageHeader title="Students" description="সব student, তাদের guardian আর বর্তমান batch" />

      <DataTable
        columns={['Student ID', 'নাম', 'Guardian', 'বর্তমান batch', 'Status']}
        isLoading={isLoading}
        isError={isError}
        isEmpty={data.length === 0}
        emptyMessage="এখনো কোনো student নেই।"
      >
        {data.map((s) => (
          <tr key={s.id} className="border-t border-border align-top">
            <td className="px-4 py-3 font-mono text-xs text-ink/70 whitespace-nowrap">{s.studentId}</td>
            <td className="px-4 py-3">
              <div className="text-ink">{s.user?.fullName}</div>
              <div className="text-xs text-ink/50">{s.user?.email}</div>
            </td>
            <td className="px-4 py-3">
              {s.guardian ? (
                <>
                  <div className="text-ink">
                    {s.guardian.fullName}
                    {s.guardianRelation && (
                      <span className="text-ink/50"> ({relationLabel[s.guardianRelation]})</span>
                    )}
                  </div>
                  <div className="text-xs text-ink/50 tabular-nums">{s.guardian.phone ?? 'Phone নেই'}</div>
                </>
              ) : (
                <span className="text-ink/40">যুক্ত নেই</span>
              )}
            </td>
            <td className="px-4 py-3">
              {s.enrollments?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {s.enrollments.map((e) => (
                    <span key={e.id} className="rounded-full bg-teal-50 text-teal-800 text-xs px-2.5 py-1">
                      {e.batch?.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-ink/40">কোনো batch-এ নেই</span>
              )}
            </td>
            <td className="px-4 py-3">
              <StatusBadge tone={statusTone[s.status]}>
                <span className="capitalize">{s.status}</span>
              </StatusBadge>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
