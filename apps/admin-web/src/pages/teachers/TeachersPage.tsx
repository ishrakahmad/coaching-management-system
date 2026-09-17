import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useSubjects, useTeachers } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuth } from '../../contexts/AuthContext';
import { canManage, isInstituteAdmin } from '../../lib/roles';
import { optionalMoney, optionalText, requiredText } from '../../lib/forms';
import { formatTaka } from '../../lib/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Checkbox, Field, FormSection, Input } from '../../components/ui/Field';
import { CheckboxList } from '../../components/ui/CheckboxList';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Teacher } from '../../types';

export default function TeachersPage() {
  const { user } = useAuth();
  const { data = [], isLoading, isError } = useTeachers();
  const [editing, setEditing] = useState<Teacher | 'new' | null>(null);
  const manage = canManage(user?.role);

  return (
    <div className="p-8">
      <PageHeader
        title="Teachers"
        description="সব teacher, তাদের subject আর বেতন"
        actions={manage && <Button onClick={() => setEditing('new')}><Plus size={16} aria-hidden /> নতুন teacher</Button>}
      />

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-ink/40 text-sm">Loading...</p>}
        {isError && <p className="text-danger-600 text-sm">Data load করা যায়নি। Backend চলছে কিনা দেখুন।</p>}
        {!isLoading && !isError && data.length === 0 && <p className="text-ink/40 text-sm">এখনো কোনো teacher নেই।</p>}
        {data.map((t) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display font-semibold text-ink">{t.user?.fullName}</h2>
                {!t.isActive && <StatusBadge tone="muted">নিষ্ক্রিয়</StatusBadge>}
              </div>
              <div className="text-sm text-ink/50">{t.designation || 'Teacher'}</div>
              <div className="text-xs text-ink/40 mt-2">{t.user?.email}</div>
              {t.monthlySalary ? <div className="text-xs text-ink/60 mt-1 tabular-nums">বেতন {formatTaka(t.monthlySalary)}</div> : null}
              {t.subjects?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.subjects.map((s) => <span key={s.id} className="text-xs bg-teal-50 text-teal-800 rounded-full px-2.5 py-1">{s.name}</span>)}
                </div>
              ) : null}
            </>
          );
          const cls = `rounded-xl border border-border bg-white p-5 text-left ${t.isActive ? '' : 'opacity-70'}`;
          return manage ? (
            <button key={t.id} onClick={() => setEditing(t)} className={`${cls} hover:border-teal-300 outline-none focus-visible:ring-2 focus-visible:ring-teal-400`}>{body}</button>
          ) : (
            <article key={t.id} className={cls}>{body}</article>
          );
        })}
      </div>

      {editing && <TeacherDrawer teacher={editing === 'new' ? null : editing} canDelete={isInstituteAdmin(user?.role)} onClose={() => setEditing(null)} />}
    </div>
  );
}

const baseSchema = {
  fullName: requiredText('নাম'),
  phone: optionalText(20),
  designation: optionalText(100),
  qualification: optionalText(200),
  monthlySalary: optionalMoney('বেতন'),
  subjectIds: z.array(z.string()),
  isActive: z.boolean(),
};
const createSchema = z.object({ ...baseSchema, email: z.string().trim().email('সঠিক email দিন'), password: z.string().min(6, 'Password অন্তত ৬ অক্ষরের হতে হবে') });
const editSchema = z.object({ ...baseSchema, email: z.string().optional(), password: z.string().optional() });
type FormValues = z.infer<typeof createSchema>;

function TeacherDrawer({ teacher, canDelete, onClose }: { teacher: Teacher | null; canDelete: boolean; onClose: () => void }) {
  const subjects = useSubjects();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(teacher ? editSchema : createSchema) as never,
    defaultValues: {
      fullName: teacher?.user?.fullName ?? '',
      email: teacher?.user?.email ?? '',
      password: '',
      phone: teacher?.user?.phone ?? '',
      designation: teacher?.designation ?? '',
      qualification: teacher?.qualification ?? '',
      monthlySalary: teacher?.monthlySalary ?? undefined,
      subjectIds: teacher?.subjects?.map((s) => s.id) ?? [],
      isActive: teacher?.isActive ?? true,
    },
  });
  const invalidate = [['teachers'], ['batches']];
  const save = useApiMutation(
    ({ email, password, isActive, ...rest }: FormValues) =>
      teacher ? api.patch(`/teachers/${teacher.id}`, { ...rest, isActive }) : api.post('/teachers', { ...rest, email, password }),
    { invalidate, success: teacher ? 'Teacher save হয়েছে' : 'Teacher যোগ হয়েছে', onSuccess: onClose },
  );
  const remove = useApiMutation(() => api.delete(`/teachers/${teacher!.id}`), { invalidate, success: 'Teacher মুছে ফেলা হয়েছে', onSuccess: onClose });

  return (
    <Drawer
      open
      onClose={onClose}
      title={teacher ? teacher.user?.fullName ?? 'Teacher' : 'নতুন teacher'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" form="teacher-form" loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <form id="teacher-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-6" noValidate>
        <FormSection title="পরিচয়">
          <Field label="পুরো নাম" required error={errors.fullName?.message}>
            {(id) => <Input id={id} invalid={!!errors.fullName} {...register('fullName')} />}
          </Field>
          {!teacher && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" required error={errors.email?.message} hint="Login-এর জন্য">
                {(id, d) => <Input id={id} type="email" autoComplete="off" aria-describedby={d} invalid={!!errors.email} {...register('email')} />}
              </Field>
              <Field label="Password" required error={errors.password?.message}>
                {(id) => <Input id={id} autoComplete="new-password" invalid={!!errors.password} {...register('password')} />}
              </Field>
            </div>
          )}
          {teacher && <p className="text-xs text-ink/50">Login email: {teacher.user?.email}</p>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mobile">{(id) => <Input id={id} inputMode="tel" {...register('phone')} />}</Field>
            <Field label="পদবি">{(id) => <Input id={id} {...register('designation')} />}</Field>
          </div>
          <Field label="শিক্ষাগত যোগ্যতা">{(id) => <Input id={id} {...register('qualification')} />}</Field>
          <Field label="মাসিক বেতন" error={errors.monthlySalary?.message}>
            {(id) => <Input id={id} inputMode="decimal" invalid={!!errors.monthlySalary} {...register('monthlySalary')} />}
          </Field>
        </FormSection>
        <FormSection title="Subject">
          <Controller
            control={control}
            name="subjectIds"
            render={({ field }) => (
              <CheckboxList
                label="Subject"
                options={(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name, detail: s.code ?? undefined }))}
                value={field.value}
                onChange={field.onChange}
                emptyMessage="কোনো subject নেই। Subjects page থেকে যোগ করুন।"
              />
            )}
          />
        </FormSection>
        {teacher && <Checkbox label="সক্রিয়" hint="নিষ্ক্রিয় করলে login বন্ধ হবে" {...register('isActive')} />}
      </form>

      {teacher && canDelete && (
        <div className="mt-10 border-t border-border pt-5">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Teacher মুছুন</Button>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Teacher মুছবেন?"
        message={`${teacher?.user?.fullName} মুছে ফেলা হবে আর login বন্ধ হবে।`}
        confirmLabel="মুছুন"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </Drawer>
  );
}
