import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useSubjects } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuth } from '../../contexts/AuthContext';
import { canManage, isInstituteAdmin } from '../../lib/roles';
import { optionalText, requiredText } from '../../lib/forms';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, RowButton } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Field, Input } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Subject } from '../../types';

const schema = z.object({ name: requiredText('Subject-এর নাম', 100), code: optionalText(30) });
type FormValues = z.infer<typeof schema>;

export default function SubjectsPage() {
  const { user } = useAuth();
  const { data = [], isLoading, isError } = useSubjects();
  const [editing, setEditing] = useState<Subject | 'new' | null>(null);

  return (
    <div className="p-8">
      <PageHeader
        title="Subjects"
        description="Batch আর teacher-এর সাথে যুক্ত করার বিষয়"
        actions={
          canManage(user?.role) && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden /> নতুন subject
            </Button>
          )
        }
      />
      <DataTable columns={['Subject', 'Code']} isLoading={isLoading} isError={isError} isEmpty={data.length === 0} emptyMessage="এখনো কোনো subject নেই।">
        {data.map((s) => (
          <RowButton key={s.id} onOpen={canManage(user?.role) ? () => setEditing(s) : undefined}>
            <td className="px-4 py-3 text-ink">{s.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-ink/60">{s.code || '—'}</td>
          </RowButton>
        ))}
      </DataTable>
      {editing && <SubjectDrawer item={editing === 'new' ? null : editing} canDelete={isInstituteAdmin(user?.role)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SubjectDrawer({ item, canDelete, onClose }: { item: Subject | null; canDelete: boolean; onClose: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: item?.name ?? '', code: item?.code ?? '' },
  });
  const save = useApiMutation((v: FormValues) => (item ? api.patch(`/subjects/${item.id}`, v) : api.post('/subjects', v)), {
    invalidate: [['subjects'], ['batches'], ['teachers']],
    success: item ? 'Subject save হয়েছে' : 'Subject যোগ হয়েছে',
    onSuccess: onClose,
  });
  const remove = useApiMutation(() => api.delete(`/subjects/${item!.id}`), { invalidate: [['subjects']], success: 'Subject মুছে ফেলা হয়েছে', onSuccess: onClose });

  return (
    <Drawer
      open
      onClose={onClose}
      title={item ? item.name : 'নতুন subject'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" form="subject-form" loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
        <Field label="নাম" required error={errors.name?.message}>
          {(id) => <Input id={id} invalid={!!errors.name} {...register('name')} />}
        </Field>
        <Field label="Code" error={errors.code?.message}>
          {(id) => <Input id={id} {...register('code')} />}
        </Field>
      </form>
      {item && canDelete && (
        <div className="mt-10 border-t border-border pt-5">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Subject মুছুন</Button>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Subject মুছবেন?"
        message={`"${item?.name}" মুছে ফেলা হবে।`}
        confirmLabel="মুছুন"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
        onCancel={() => setConfirmDelete(false)}
      />
    </Drawer>
  );
}
