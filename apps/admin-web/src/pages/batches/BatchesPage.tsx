import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useBatches, useClasses, useSessions, useSubjects, useTeachers } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuth } from '../../contexts/AuthContext';
import { canManage, canSeeFinance, isInstituteAdmin } from '../../lib/roles';
import { money, nullableId, optionalText, requiredText } from '../../lib/forms';
import { formatTaka } from '../../lib/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Checkbox, Field, FormSection, Input, Select } from '../../components/ui/Field';
import { CheckboxList } from '../../components/ui/CheckboxList';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Batch } from '../../types';

const ALL = 'all';

export default function BatchesPage() {
  const { user } = useAuth();
  const manage = canManage(user?.role);
  const sessions = useSessions();
  const [sessionId, setSessionId] = useState<string>();
  const [editing, setEditing] = useState<Batch | 'new' | null>(null);

  // Start on the current session once sessions load; the user can switch to "all".
  useEffect(() => {
    if (sessionId === undefined && sessions.data) setSessionId(sessions.data.find((s) => s.isCurrent)?.id ?? ALL);
  }, [sessions.data, sessionId]);

  const selected = sessionId && sessionId !== ALL ? sessionId : undefined;
  const { data = [], isLoading, isError } = useBatches(selected);
  const waiting = sessionId === undefined || isLoading;

  return (
    <div className="p-8">
      <PageHeader
        title="Batches"
        description="Session অনুযায়ী batch, class আর বর্তমান student সংখ্যা"
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-ink/60">
              Session
              <Select value={sessionId ?? ALL} onChange={(e) => setSessionId(e.target.value)} className="w-48">
                <option value={ALL}>সব session</option>
                {sessions.data?.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (চলতি)' : ''}</option>)}
              </Select>
            </label>
            {manage && <Button onClick={() => setEditing('new')}><Plus size={16} aria-hidden /> নতুন batch</Button>}
          </>
        }
      />

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {waiting && <p className="text-ink/40 text-sm">Loading...</p>}
        {isError && <p className="text-danger-600 text-sm">Data load করা যায়নি। Backend চলছে কিনা দেখুন।</p>}
        {!waiting && !isError && data.length === 0 && <p className="text-ink/40 text-sm">এই session-এ কোনো batch নেই।</p>}
        {!waiting &&
          data.map((b) => {
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display font-semibold text-ink">{b.name}</h2>
                  {!b.isActive && <StatusBadge tone="muted">বন্ধ</StatusBadge>}
                </div>
                <div className="text-sm text-ink/50 mt-0.5">
                  {[b.academicClass?.name, b.academicSession?.name].filter(Boolean).join(', ') || 'Class/session দেওয়া নেই'}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <div>
                    <dt className="text-xs text-ink/50">মাসিক fee</dt>
                    <dd className="text-sm font-medium text-teal-700 tabular-nums">{formatTaka(b.monthlyFee)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink/50">Student</dt>
                    <dd className="text-sm font-medium text-ink tabular-nums">{b.activeStudentCount} জন</dd>
                  </div>
                </dl>
                {(b.leadTeacher?.user || b.schedule) && (
                  <div className="mt-3 text-xs text-ink/50 space-y-0.5">
                    {b.leadTeacher?.user && <div>শিক্ষক: {b.leadTeacher.user.fullName}</div>}
                    {b.schedule && <div>{b.schedule}</div>}
                  </div>
                )}
              </>
            );
            const cls = `rounded-xl border border-border bg-white p-5 text-left ${b.isActive ? '' : 'opacity-70'}`;
            return manage ? (
              <button key={b.id} onClick={() => setEditing(b)} className={`${cls} hover:border-teal-300 outline-none focus-visible:ring-2 focus-visible:ring-teal-400`}>{body}</button>
            ) : (
              <article key={b.id} className={cls}>{body}</article>
            );
          })}
      </div>

      {editing && (
        <BatchDrawer
          batch={editing === 'new' ? null : editing}
          defaultSessionId={selected}
          canDelete={isInstituteAdmin(user?.role)}
          canPickTeacher={canSeeFinance(user?.role)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

const schema = z.object({
  name: requiredText('Batch-এর নাম'),
  sessionId: nullableId,
  classId: nullableId,
  monthlyFee: money('মাসিক fee'),
  schedule: optionalText(200),
  leadTeacherId: nullableId,
  subjectIds: z.array(z.string()),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function BatchDrawer({ batch, defaultSessionId, canDelete, canPickTeacher, onClose }: {
  batch: Batch | null; defaultSessionId?: string; canDelete: boolean; canPickTeacher: boolean; onClose: () => void;
}) {
  const sessions = useSessions();
  const classes = useClasses();
  const subjects = useSubjects();
  // The teacher list includes salaries, so only roles allowed to see it load it.
  const teachers = useTeachers(canPickTeacher);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: batch?.name ?? '',
      sessionId: batch?.sessionId ?? defaultSessionId ?? '',
      classId: batch?.classId ?? '',
      monthlyFee: batch?.monthlyFee ?? ('' as never),
      schedule: batch?.schedule ?? '',
      leadTeacherId: batch?.leadTeacher?.id ?? '',
      subjectIds: batch?.subjects?.map((s) => s.id) ?? [],
      isActive: batch?.isActive ?? true,
    },
  });
  const invalidate = [['batches'], ['students']];
  const save = useApiMutation(
    ({ isActive, ...v }: FormValues) => (batch ? api.patch(`/batches/${batch.id}`, { ...v, isActive }) : api.post('/batches', v)),
    { invalidate, success: batch ? 'Batch save হয়েছে' : 'Batch যোগ হয়েছে', onSuccess: onClose },
  );
  const remove = useApiMutation(() => api.delete(`/batches/${batch!.id}`), { invalidate, success: 'Batch মুছে ফেলা হয়েছে', onSuccess: onClose });

  return (
    <Drawer
      open
      onClose={onClose}
      title={batch ? batch.name : 'নতুন batch'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" form="batch-form" loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <form id="batch-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-6" noValidate>
        <FormSection title="Batch">
          <Field label="নাম" required error={errors.name?.message} hint="যেমন HSC 2027 Science, সকাল">
            {(id, d) => <Input id={id} aria-describedby={d} invalid={!!errors.name} {...register('name')} />}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Session">
              {(id) => (
                <Select id={id} {...register('sessionId')}>
                  <option value="">দেওয়া নেই</option>
                  {sessions.data?.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (চলতি)' : ''}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Class">
              {(id) => (
                <Select id={id} {...register('classId')}>
                  <option value="">দেওয়া নেই</option>
                  {classes.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              )}
            </Field>
            <Field label="মাসিক fee" required error={errors.monthlyFee?.message} hint="নতুন fee আগামী মাসের হিসাব থেকে ধরা হবে">
              {(id, d) => <Input id={id} inputMode="decimal" aria-describedby={d} invalid={!!errors.monthlyFee} {...register('monthlyFee')} />}
            </Field>
            <Field label="সময়সূচি" hint="যেমন শনি, সোম, বুধ বিকেল ৪টা">
              {(id, d) => <Input id={id} aria-describedby={d} {...register('schedule')} />}
            </Field>
          </div>
          {canPickTeacher && (
            <Field label="প্রধান শিক্ষক">
              {(id) => (
                <Select id={id} {...register('leadTeacherId')}>
                  <option value="">দেওয়া নেই</option>
                  {teachers.data?.filter((t) => t.isActive).map((t) => <option key={t.id} value={t.id}>{t.user?.fullName}</option>)}
                </Select>
              )}
            </Field>
          )}
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
        {batch && <Checkbox label="সক্রিয়" hint="বন্ধ batch-এ নতুন ভর্তি আর মাসিক fee হয় না" {...register('isActive')} />}
      </form>

      {batch && canDelete && (
        <div className="mt-10 border-t border-border pt-5">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Batch মুছুন</Button>
          <p className="mt-2 text-xs text-ink/50">সক্রিয় student থাকলে মোছা যাবে না; তার বদলে batch বন্ধ করুন।</p>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Batch মুছবেন?"
        message={`"${batch?.name}" মুছে ফেলা হবে।`}
        confirmLabel="মুছুন"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </Drawer>
  );
}
