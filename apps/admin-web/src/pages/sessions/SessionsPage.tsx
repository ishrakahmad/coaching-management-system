import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useSessions } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuth } from '../../contexts/AuthContext';
import { canManage, isInstituteAdmin } from '../../lib/roles';
import { nullableDate, requiredText } from '../../lib/forms';
import { formatDate } from '../../lib/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, RowButton } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Checkbox, Field, Input } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { AcademicSession } from '../../types';

const schema = z
  .object({
    name: requiredText('Session-এর নাম', 30),
    startDate: nullableDate,
    endDate: nullableDate,
    isCurrent: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { path: ['endDate'], message: 'শেষের তারিখ শুরুর আগে হতে পারে না' })
  .refine((v) => !v.isCurrent || v.isActive, { path: ['isCurrent'], message: 'নিষ্ক্রিয় session চলতি হতে পারে না' });
type FormValues = z.infer<typeof schema>;

export default function SessionsPage() {
  const { user } = useAuth();
  const { data = [], isLoading, isError } = useSessions();
  const [editing, setEditing] = useState<AcademicSession | 'new' | null>(null);

  return (
    <div className="p-8">
      <PageHeader
        title="Sessions"
        description="প্রতিটা শিক্ষাবর্ষ; একসাথে একটাই চলতি session থাকে"
        actions={
          canManage(user?.role) && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden /> নতুন session
            </Button>
          )
        }
      />

      <DataTable
        columns={['Session', 'সময়কাল', 'Status']}
        isLoading={isLoading}
        isError={isError}
        isEmpty={data.length === 0}
        emptyMessage="এখনো কোনো session নেই। প্রথম session যোগ করে সেটাকে চলতি করুন।"
      >
        {data.map((s) => {
          const start = formatDate(s.startDate);
          const end = formatDate(s.endDate);
          return (
            <RowButton key={s.id} onOpen={canManage(user?.role) ? () => setEditing(s) : undefined}>
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
            </RowButton>
          );
        })}
      </DataTable>

      {editing && <SessionDrawer session={editing === 'new' ? null : editing} canDelete={isInstituteAdmin(user?.role)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SessionDrawer({ session, canDelete, onClose }: { session: AcademicSession | null; canDelete: boolean; onClose: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: session?.name ?? '',
      startDate: session?.startDate ?? '',
      endDate: session?.endDate ?? '',
      isCurrent: session?.isCurrent ?? false,
      isActive: session?.isActive ?? true,
    },
  });

  const save = useApiMutation(
    (values: FormValues) =>
      session ? api.patch(`/sessions/${session.id}`, values) : api.post('/sessions', { ...values, isActive: undefined }),
    { invalidate: [['sessions'], ['batches']], success: session ? 'Session save হয়েছে' : 'Session যোগ হয়েছে', onSuccess: onClose },
  );
  const remove = useApiMutation(() => api.delete(`/sessions/${session!.id}`), {
    invalidate: [['sessions']],
    success: 'Session মুছে ফেলা হয়েছে',
    onSuccess: onClose,
  });

  return (
    <Drawer
      open
      onClose={onClose}
      title={session ? `${session.name} session` : 'নতুন session'}
      description="শিক্ষাবর্ষের নাম আর সময়কাল"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" form="session-form" loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <form id="session-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
        <Field label="নাম" required error={errors.name?.message} hint="যেমন 2026 বা 2026-2027">
          {(id, d) => <Input id={id} aria-describedby={d} invalid={!!errors.name} {...register('name')} />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="শুরু" error={errors.startDate?.message}>
            {(id) => <Input id={id} type="date" {...register('startDate')} />}
          </Field>
          <Field label="শেষ" error={errors.endDate?.message}>
            {(id, d) => <Input id={id} type="date" aria-describedby={d} invalid={!!errors.endDate} {...register('endDate')} />}
          </Field>
        </div>
        <Checkbox label="চলতি session" hint="চলতি করলে আগের চলতি session আর চলতি থাকবে না" {...register('isCurrent')} />
        {errors.isCurrent && <p className="text-xs text-danger-600">{errors.isCurrent.message}</p>}
        {session && <Checkbox label="সক্রিয়" {...register('isActive')} />}
      </form>

      {session && canDelete && (
        <div className="mt-10 border-t border-border pt-5">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Session মুছুন</Button>
          <p className="mt-2 text-xs text-ink/50">কোনো batch এই session-এ থাকলে মোছা যাবে না; তখন নিষ্ক্রিয় করুন।</p>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Session মুছবেন?"
        message={`"${session?.name}" session মুছে ফেলা হবে।`}
        confirmLabel="মুছুন"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
        onCancel={() => setConfirmDelete(false)}
      />
    </Drawer>
  );
}
