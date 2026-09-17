import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { optionalDate, optionalText, requiredText } from '../../lib/forms';
import { studentStatusMeta } from '../../lib/format';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Student, StudentStatus } from '../../types';

const STATUSES = Object.keys(studentStatusMeta) as StudentStatus[];
const schema = z.object({
  fullName: requiredText('নাম'),
  phone: optionalText(20),
  dateOfBirth: optionalDate,
  address: optionalText(300),
  status: z.enum(STATUSES as [StudentStatus, ...StudentStatus[]]),
});
type FormValues = z.infer<typeof schema>;

export function StudentEditDrawer({ student, canDelete, onClose }: { student: Student; canDelete: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: student.user?.fullName ?? '',
      phone: student.user?.phone ?? '',
      dateOfBirth: student.dateOfBirth?.slice(0, 10) ?? '',
      address: student.address ?? '',
      status: student.status,
    },
  });
  const save = useApiMutation((v: FormValues) => api.patch(`/students/${student.id}`, v), {
    invalidate: [['students'], ['guardians']],
    success: 'Student-এর তথ্য save হয়েছে',
    onSuccess: onClose,
  });
  const remove = useApiMutation(() => api.delete(`/students/${student.id}`), {
    invalidate: [['students'], ['guardians'], ['batches'], ['fees']],
    success: 'Student মুছে ফেলা হয়েছে',
    onSuccess: () => navigate('/dashboard/students'),
  });

  return (
    <Drawer
      open
      onClose={onClose}
      title="Student-এর তথ্য"
      description={student.studentId}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" form="student-edit-form" loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <form id="student-edit-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
        <Field label="পুরো নাম" required error={errors.fullName?.message}>
          {(id) => <Input id={id} invalid={!!errors.fullName} {...register('fullName')} />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mobile">{(id) => <Input id={id} inputMode="tel" {...register('phone')} />}</Field>
          <Field label="জন্ম তারিখ">{(id) => <Input id={id} type="date" {...register('dateOfBirth')} />}</Field>
        </div>
        <Field label="ঠিকানা">{(id) => <Textarea id={id} rows={2} {...register('address')} />}</Field>
        <Field label="Status" hint="সক্রিয় ছাড়া অন্য status-এ মাসিক fee ধরা হয় না">
          {(id, d) => (
            <Select id={id} aria-describedby={d} {...register('status')}>
              {STATUSES.map((s) => <option key={s} value={s}>{studentStatusMeta[s].label}</option>)}
            </Select>
          )}
        </Field>
      </form>

      {canDelete && (
        <div className="mt-10 border-t border-border pt-5">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Student মুছুন</Button>
          <p className="mt-2 text-xs text-ink/50">সব batch থেকে বের হয়ে যাবে, আর login বন্ধ হবে। আগের payment-এর হিসাব থেকে যাবে।</p>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Student মুছবেন?"
        message={`${student.user?.fullName} (${student.studentId}) মুছে ফেলা হবে। এটা ফেরানো যায় না।`}
        confirmLabel="মুছুন"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </Drawer>
  );
}
