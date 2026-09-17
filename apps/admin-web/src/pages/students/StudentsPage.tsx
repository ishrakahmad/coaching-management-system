import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useStudents } from '../../hooks/queries';
import { useAuth } from '../../contexts/AuthContext';
import { canManage } from '../../lib/roles';
import { relationLabel, studentStatusMeta } from '../../lib/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, RowButton } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { AdmissionDrawer } from './AdmissionDrawer';

export default function StudentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data = [], isLoading, isError } = useStudents();
  const [admitting, setAdmitting] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    const digits = term.replace(/\D/g, '');
    return data.filter(
      (s) =>
        s.user?.fullName.toLowerCase().includes(term) ||
        s.studentId.toLowerCase().includes(term) ||
        (digits.length >= 3 && (s.guardian?.phone?.includes(digits) || s.user?.phone?.includes(digits))),
    );
  }, [data, search]);

  return (
    <div className="p-8">
      <PageHeader
        title="Students"
        description="সব student, তাদের guardian আর বর্তমান batch"
        actions={
          <>
            <label className="relative block">
              <span className="sr-only">নাম, ID বা phone দিয়ে খুঁজুন</span>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
              <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম, ID বা phone" className="w-64 pl-9" />
            </label>
            {canManage(user?.role) && (
              <Button onClick={() => setAdmitting(true)}>
                <Plus size={16} aria-hidden /> নতুন ভর্তি
              </Button>
            )}
          </>
        }
      />

      <DataTable
        columns={['Student ID', 'নাম', 'Guardian', 'বর্তমান batch', 'Status']}
        isLoading={isLoading}
        isError={isError}
        isEmpty={filtered.length === 0}
        emptyMessage={search ? `"${search}" মেলে এমন কোনো student নেই।` : 'এখনো কোনো student নেই। "নতুন ভর্তি" দিয়ে শুরু করুন।'}
      >
        {filtered.map((s) => (
          <RowButton key={s.id} onOpen={() => navigate(`/dashboard/students/${s.id}`)} className="align-top">
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
                    {s.guardianRelation && <span className="text-ink/50"> ({relationLabel[s.guardianRelation]})</span>}
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
                    <span key={e.id} className="rounded-full bg-teal-50 text-teal-800 text-xs px-2.5 py-1">{e.batch?.name}</span>
                  ))}
                </div>
              ) : (
                <span className="text-ink/40">কোনো batch-এ নেই</span>
              )}
            </td>
            <td className="px-4 py-3">
              <StatusBadge tone={studentStatusMeta[s.status].tone}>{studentStatusMeta[s.status].label}</StatusBadge>
            </td>
          </RowButton>
        ))}
      </DataTable>

      {admitting && <AdmissionDrawer onClose={() => setAdmitting(false)} />}
    </div>
  );
}
