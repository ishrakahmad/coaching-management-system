import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useClasses } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuth } from '../../contexts/AuthContext';
import { canManage, isInstituteAdmin } from '../../lib/roles';
import { optionalText, requiredText } from '../../lib/forms';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, RowButton } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Checkbox, Field, Input } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { AcademicClass } from '../../types';

const schema = z.object({
  name: requiredText('Class-এর নাম', 50),
  code: optionalText(20),
  sortOrder: z.coerce.number({ invalid_type_error: 'সংখ্যা দিন' }).int().min(0).max(1000),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function ClassesPage() {
  const { user } = useAuth();
  const { data = [], isLoading, isError } = useClasses();
  const [editing, setEditing] = useState<AcademicClass | 'new' | null>(null);
  const nextOrder = data.length ? Math.max(...data.map((c) => c.sortOrder)) + 10 : 10;

  return (
    <div className="p-8">
      <PageHeader
        title="Classes"
        description="নিচু থেকে উঁচু ক্রমে সাজানো; পরে promotion এই ক্রম মেনে হবে"
        actions={
          canManage(user?.role) && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden /> নতুন class
            </Button>
          )
        }
      />

      <DataTable
        columns={['Class', 'Code', 'Status']}
        isLoading={isLoading}
        isError={isError}
        isEmpty={data.length === 0}
        emptyMessage="এখনো কোনো class নেই।"
      >
        {data.map((c) => (
          <RowButton key={c.id} onOpen={canManage(user?.role) ? () => setEditing(c) : undefined}>
            <td className="px-4 py-3 text-ink">{c.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-ink/60">{c.code ?? '—'}</td>
            <td className="px-4 py-3">
              {c.isActive ? <StatusBadge tone="active">সক্রিয়</StatusBadge> : <StatusBadge tone="muted">নিষ্ক্রিয়</StatusBadge>}
            </td>
          </RowButton>
        ))}
      </DataTable>

      {editing && (
        <ClassDrawer
          item={editing === 'new' ? null : editing}
          nextOrder={nextOrder}
          canDelete={isInstituteAdmin(user?.role)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ClassDrawer({ item, nextOrder, canDelete, onClose }: { item: AcademicClass | null; nextOrder: number; canDelete: boolean; onClose: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: item?.name ?? '', code: item?.code ?? '', sortOrder: item?.sortOrder ?? nextOrder, isActive: item?.isActive ?? true },
  });
  const save = useApiMutation(
    (v: FormValues) => (item ? api.patch(`/classes/${item.id}`, v) : api.post('/classes', { ...v, isActive: undefined })),
    { invalidate: [['classes'], ['batches']], success: item ? 'Class save হয়েছে' : 'Class যোগ হয়েছে', onSuccess: onClose },
  );
  const remove = useApiMutation(() => api.delete(`/classes/${item!.id}`), { invalidate: [['classes']], success: 'Class মুছে ফেলা হয়েছে', onSuccess: onClose });

  return (
    <Drawer
      open
      onClose={onClose}
      title={item ? item.name : 'নতুন class'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" form="class-form" loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <form id="class-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
        <Field label="নাম" required error={errors.name?.message} hint="যেমন Class 9, HSC 1st Year">
          {(id, d) => <Input id={id} aria-describedby={d} invalid={!!errors.name} {...register('name')} />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Code" error={errors.code?.message}>
            {(id) => <Input id={id} {...register('code')} />}
          </Field>
          <Field label="ক্রম" error={errors.sortOrder?.message} hint="ছোট সংখ্যা আগে দেখায়">
            {(id, d) => <Input id={id} type="number" aria-describedby={d} {...register('sortOrder')} />}
          </Field>
        </div>
        {item && <Checkbox label="সক্রিয়" {...register('isActive')} />}
      </form>
      {item && canDelete && (
        <div className="mt-10 border-t border-border pt-5">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Class মুছুন</Button>
          <p className="mt-2 text-xs text-ink/50">কোনো batch এই class-এ থাকলে মোছা যাবে না।</p>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Class মুছবেন?"
        message={`"${item?.name}" মুছে ফেলা হবে।`}
        confirmLabel="মুছুন"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
        onCancel={() => setConfirmDelete(false)}
      />
    </Drawer>
  );
}
