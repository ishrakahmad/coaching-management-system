import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Pencil, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useLedger, useStudent } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuth } from '../../contexts/AuthContext';
import { canManage, canSeeFinance, isInstituteAdmin } from '../../lib/roles';
import {
  feeStatusMeta, formatDate, formatTaka, methodLabel, relationLabel, studentStatusMeta, todayInDhaka,
} from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DetailList, Panel } from '../../components/ui/Panel';
import { DataTable, RowButton } from '../../components/ui/DataTable';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CollectPaymentDrawer } from '../../components/finance/CollectPaymentDrawer';
import { StudentEditDrawer } from './StudentEditDrawer';
import { GuardianLinkDrawer } from './GuardianLinkDrawer';
import { EnrollDrawer, EnrollmentEditDrawer } from './EnrollmentDrawers';
import { AddFeeDrawer, FeeDrawer } from './FeeDrawers';
import type { Enrollment, StudentFee } from '../../types';

type Open =
  | { kind: 'edit' | 'guardian' | 'enroll' | 'collect' | 'addFee' }
  | { kind: 'enrollment'; enrollment: Enrollment }
  | { kind: 'fee'; fee: StudentFee }
  | null;

export default function StudentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const manage = canManage(user?.role);
  const finance = canSeeFinance(user?.role);
  const student = useStudent(id);
  const ledger = useLedger(id, finance);
  const [open, setOpen] = useState<Open>(null);
  const [leaving, setLeaving] = useState<Enrollment | null>(null);
  const close = () => setOpen(null);

  const leave = useApiMutation<{ enrollment: Enrollment; date: string }, Enrollment & { waivedFeeCount?: number }>(
    ({ enrollment, date }) => api.post(`/enrollments/${enrollment.id}/leave`, { leftAt: date }),
    {
      invalidate: [['students'], ['batches'], ['fees']],
      success: (e) => (e.waivedFeeCount ? `Batch ছেড়ে দিয়েছে; পরের ${e.waivedFeeCount}টা মাসের fee মওকুফ হয়েছে` : 'Batch ছেড়ে দিয়েছে'),
      onSuccess: () => setLeaving(null),
    },
  );

  if (student.isLoading) return <p className="p-8 text-sm text-ink/40">Loading...</p>;
  if (student.isError || !student.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger-600">Student পাওয়া যায়নি।</p>
        <Link to="/dashboard/students" className="mt-2 inline-block text-sm text-teal-700 underline">Students-এ ফিরে যান</Link>
      </div>
    );
  }

  const s = student.data;
  const enrollments = s.enrollments ?? [];
  const activeBatchIds = enrollments.filter((e) => e.status === 'active').map((e) => e.batchId);
  const summary = ledger.data?.summary;
  const today = todayInDhaka();

  return (
    <div className="p-8 space-y-6">
      <div>
        <button onClick={() => navigate('/dashboard/students')} className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded">
          <ArrowLeft size={16} aria-hidden /> Students
        </button>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-ink">{s.user?.fullName}</h1>
              <StatusBadge tone={studentStatusMeta[s.status].tone}>{studentStatusMeta[s.status].label}</StatusBadge>
            </div>
            <p className="mt-1 text-sm text-ink/50">
              <span className="font-mono">{s.studentId}</span>, ভর্তি {formatDate(s.admissionDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {manage && (
              <Button variant="secondary" onClick={() => setOpen({ kind: 'edit' })}>
                <Pencil size={16} aria-hidden /> তথ্য বদলান
              </Button>
            )}
            {finance && (
              <Button onClick={() => setOpen({ kind: 'collect' })} disabled={!summary || summary.due === 0}>
                <Banknote size={16} aria-hidden /> টাকা জমা নিন
              </Button>
            )}
          </div>
        </div>
      </div>

      {finance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryFigure label="বকেয়া" value={summary?.due} tone={summary && summary.due > 0 ? 'amber' : 'ink'} />
          <SummaryFigure label="মোট পরিশোধ" value={summary?.paid} />
          <SummaryFigure label="ছাড় ও মওকুফ" value={summary ? summary.discount + summary.waived : undefined} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="তথ্য">
          <DetailList
            items={[
              { label: 'Email', value: s.user?.email },
              { label: 'Mobile', value: s.user?.phone },
              { label: 'জন্ম তারিখ', value: formatDate(s.dateOfBirth) },
              { label: 'ঠিকানা', value: s.address },
            ]}
          />
        </Panel>
        <Panel
          title="Guardian"
          actions={manage && <Button size="sm" variant="secondary" onClick={() => setOpen({ kind: 'guardian' })}>{s.guardian ? 'বদলান' : 'যুক্ত করুন'}</Button>}
        >
          {s.guardian ? (
            <DetailList
              items={[
                { label: 'নাম', value: s.guardian.fullName },
                { label: 'সম্পর্ক', value: s.guardianRelation ? relationLabel[s.guardianRelation] : null },
                { label: 'Mobile', value: s.guardian.phone && <a href={`tel:${s.guardian.phone}`} className="tabular-nums text-teal-700 underline-offset-2 hover:underline">{s.guardian.phone}</a> },
                { label: 'পেশা', value: s.guardian.occupation },
              ]}
            />
          ) : (
            <p className="px-5 py-4 text-sm text-ink/50">কোনো guardian যুক্ত নেই।</p>
          )}
        </Panel>
      </div>

      <Panel
        title="Batch"
        actions={manage && <Button size="sm" variant="secondary" onClick={() => setOpen({ kind: 'enroll' })}><Plus size={14} aria-hidden /> Batch-এ ভর্তি</Button>}
      >
        <DataTable bare columns={['Batch', 'ভর্তি', 'মাসিক fee', 'Status', '']} isLoading={false} isError={false} isEmpty={!enrollments.length} emptyMessage="কোনো batch-এ ভর্তি নেই।">
          {enrollments.map((e) => (
            <tr key={e.id} className="border-t border-border">
              <td className="px-4 py-3 text-ink">{e.batch?.name}</td>
              <td className="px-4 py-3 text-ink/60 whitespace-nowrap tabular-nums">
                {formatDate(e.enrolledAt)}
                {e.leftAt && ` থেকে ${formatDate(e.leftAt)}`}
              </td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                {e.feeOverride !== null ? (
                  <span className="text-amber-700" title="এই student-এর জন্য আলাদা fee">{formatTaka(e.feeOverride)} <span className="text-xs">(আলাদা)</span></span>
                ) : (
                  <span className="text-ink/70">{formatTaka(e.batch?.monthlyFee)}</span>
                )}
              </td>
              <td className="px-4 py-3">
                {e.status === 'active' ? <StatusBadge tone="active">চলছে</StatusBadge> : <StatusBadge tone="muted">ছেড়ে দিয়েছে</StatusBadge>}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {manage && e.status === 'active' && (
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setOpen({ kind: 'enrollment', enrollment: e })}>বদলান</Button>
                    <Button size="sm" variant="danger" onClick={() => setLeaving(e)}>ছেড়ে দিয়েছে</Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {finance && (
        <Panel
          title="Fee"
          actions={manage && <Button size="sm" variant="secondary" onClick={() => setOpen({ kind: 'addFee' })}><Plus size={14} aria-hidden /> Fee যোগ</Button>}
        >
          <DataTable
            bare
            columns={['Fee', 'শেষ তারিখ', { label: 'টাকা', align: 'right' }, { label: 'ছাড়', align: 'right' }, { label: 'পরিশোধ', align: 'right' }, { label: 'বকেয়া', align: 'right' }, 'Status']}
            isLoading={ledger.isLoading}
            isError={ledger.isError}
            isEmpty={!ledger.data?.fees.length}
            emptyMessage="এখনো কোনো fee তৈরি হয়নি।"
          >
            {ledger.data?.fees.map((f) => {
              const overdue = f.dueAmount > 0 && f.dueDate && f.dueDate < today;
              return (
                <RowButton key={f.id} onOpen={() => setOpen({ kind: 'fee', fee: f })}>
                  <td className="px-4 py-3 text-ink">{f.title}</td>
                  <td className={`px-4 py-3 whitespace-nowrap tabular-nums ${overdue ? 'text-danger-600' : 'text-ink/60'}`}>{formatDate(f.dueDate) ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/70">{formatTaka(f.amount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/50">{f.discount ? formatTaka(f.discount) : '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/70">{f.paidAmount ? formatTaka(f.paidAmount) : '—'}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${f.dueAmount > 0 ? 'text-amber-700' : 'text-ink/40'}`}>{formatTaka(f.dueAmount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={overdue ? 'danger' : feeStatusMeta[f.status].tone}>{overdue ? 'মেয়াদ পার' : feeStatusMeta[f.status].label}</StatusBadge>
                  </td>
                </RowButton>
              );
            })}
          </DataTable>
        </Panel>
      )}

      {finance && (
        <Panel title="Payment">
          <DataTable
            bare
            columns={['রসিদ', 'তারিখ', 'মাধ্যম', { label: 'টাকা', align: 'right' }, 'Status']}
            isLoading={ledger.isLoading}
            isError={ledger.isError}
            isEmpty={!ledger.data?.payments.length}
            emptyMessage="এখনো কোনো payment নেই।"
          >
            {ledger.data?.payments.map((p) => (
              <RowButton key={p.id} onOpen={() => navigate(`/dashboard/payments/${p.id}/receipt`)}>
                <td className="px-4 py-3 font-mono text-xs text-ink/70">{p.receiptNo}</td>
                <td className="px-4 py-3 text-ink/60 whitespace-nowrap tabular-nums">{formatDate(p.paidAt)}</td>
                <td className="px-4 py-3 text-ink/70">{methodLabel[p.method]}{p.reference && <span className="text-xs text-ink/40"> ({p.reference})</span>}</td>
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${p.voidedAt ? 'text-ink/40 line-through' : 'text-teal-700'}`}>{formatTaka(p.amount)}</td>
                <td className="px-4 py-3">{p.voidedAt ? <StatusBadge tone="danger">বাতিল</StatusBadge> : <StatusBadge tone="active">জমা</StatusBadge>}</td>
              </RowButton>
            ))}
          </DataTable>
        </Panel>
      )}

      {open?.kind === 'edit' && <StudentEditDrawer student={s} canDelete={isInstituteAdmin(user?.role)} onClose={close} />}
      {open?.kind === 'guardian' && <GuardianLinkDrawer student={s} onClose={close} />}
      {open?.kind === 'enroll' && <EnrollDrawer studentId={s.id} activeBatchIds={activeBatchIds} onClose={close} />}
      {open?.kind === 'enrollment' && <EnrollmentEditDrawer enrollment={open.enrollment} onClose={close} />}
      {open?.kind === 'collect' && <CollectPaymentDrawer studentId={s.id} onClose={close} />}
      {open?.kind === 'addFee' && <AddFeeDrawer studentId={s.id} onClose={close} />}
      {open?.kind === 'fee' && <FeeDrawer fee={open.fee} canEdit={manage || finance} onClose={close} />}

      <ConfirmDialog
        open={!!leaving}
        title="Batch ছেড়ে দিয়েছে?"
        message={`${s.user?.fullName} "${leaving?.batch?.name}" থেকে বের হবে। ওই মাসের fee থাকবে; পরের মাসগুলোর না-দেওয়া fee মওকুফ হবে।`}
        confirmLabel="নিশ্চিত করুন"
        dateLabel="শেষ দিন"
        defaultDate={today}
        loading={leave.isPending}
        onConfirm={({ date }) => leaving && leave.mutate({ enrollment: leaving, date })}
        onCancel={() => setLeaving(null)}
      />
    </div>
  );
}

function SummaryFigure({ label, value, tone = 'ink' }: { label: string; value: number | undefined; tone?: 'ink' | 'amber' }) {
  return (
    <div className="rounded-xl border border-border bg-white px-5 py-4">
      <div className="text-sm text-ink/50">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold tabular-nums ${tone === 'amber' ? 'text-amber-700' : 'text-ink'}`}>
        {value === undefined ? '–' : formatTaka(value)}
      </div>
    </div>
  );
}
