import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useBatches, useGuardians } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useDebounced } from '../../hooks/useDebounced';
import { bdPhone, optionalDate, optionalMoney, optionalText, requiredText } from '../../lib/forms';
import { formatTaka, relationLabel } from '../../lib/format';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Checkbox, Field, FormSection, Input, Select, Textarea } from '../../components/ui/Field';
import { CheckboxList } from '../../components/ui/CheckboxList';
import type { GuardianRelation, Student } from '../../types';

const RELATIONS = Object.keys(relationLabel) as GuardianRelation[];

const schema = z
  .object({
    fullName: requiredText('নাম'),
    email: z.string().trim().email('সঠিক email দিন'),
    password: z.string().min(6, 'Password অন্তত ৬ অক্ষরের হতে হবে'),
    phone: optionalText(20),
    dateOfBirth: optionalDate,
    address: optionalText(300),
    guardianName: optionalText(150),
    guardianPhone: bdPhone,
    guardianRelation: z.preprocess((v) => (v === '' ? undefined : v), z.enum(RELATIONS as [GuardianRelation, ...GuardianRelation[]]).optional()),
    guardianOccupation: optionalText(100),
    batchIds: z.array(z.string()),
    admissionFee: optionalMoney('ভর্তি fee'),
    billCurrentMonth: z.boolean(),
  })
  .refine((v) => !v.guardianPhone || v.guardianName, { path: ['guardianName'], message: 'Guardian-এর phone দিলে নামও দিন' });
type FormValues = z.infer<typeof schema>;

export function AdmissionDrawer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const batches = useBatches();
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', batchIds: [], billCurrentMonth: true, guardianRelation: undefined },
  });

  // Show early that this phone already belongs to a guardian (a sibling's parent); the API links them.
  const typedPhone = useDebounced((watch('guardianPhone') ?? '').replace(/\D/g, '').replace(/^88/, ''));
  const matches = useGuardians(typedPhone.length === 11 ? typedPhone : '__none__');
  const existingGuardian = typedPhone.length === 11 ? matches.data?.find((g) => g.phone === typedPhone) : undefined;

  const batchOptions = useMemo(
    () =>
      (batches.data ?? [])
        .filter((b) => b.isActive)
        .map((b) => ({
          value: b.id,
          label: b.name,
          detail: `${[b.academicSession?.name, formatTaka(b.monthlyFee)].filter(Boolean).join(', ')}`,
        })),
    [batches.data],
  );

  const admit = useApiMutation<FormValues, Student>(
    (v) =>
      api.post('/students', {
        fullName: v.fullName,
        email: v.email,
        password: v.password,
        phone: v.phone,
        dateOfBirth: v.dateOfBirth,
        address: v.address,
        guardian: v.guardianName ? { fullName: v.guardianName, phone: v.guardianPhone, occupation: v.guardianOccupation } : undefined,
        guardianRelation: v.guardianName ? v.guardianRelation : undefined,
        batchIds: v.batchIds,
        admissionFee: v.admissionFee || undefined,
        billCurrentMonth: v.batchIds.length ? v.billCurrentMonth : undefined,
      }),
    {
      invalidate: [['students'], ['guardians'], ['batches'], ['fees']],
      success: (s) => `${s.user?.fullName} ভর্তি হয়েছে (${s.studentId})`,
      onSuccess: (s) => navigate(`/dashboard/students/${s.id}`),
    },
  );

  const selectedBatches = watch('batchIds');
  return (
    <Drawer
      open
      width="lg"
      onClose={onClose}
      title="নতুন ভর্তি"
      description="Student ID নিজে থেকে তৈরি হবে"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" form="admission-form" loading={admit.isPending}>ভর্তি করুন</Button>
        </>
      }
    >
      <form id="admission-form" onSubmit={handleSubmit((v) => admit.mutate(v))} className="space-y-6" noValidate>
        <FormSection title="Student">
          <Field label="পুরো নাম" required error={errors.fullName?.message}>
            {(id) => <Input id={id} invalid={!!errors.fullName} {...register('fullName')} />}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" required error={errors.email?.message} hint="Login-এর জন্য">
              {(id, d) => <Input id={id} type="email" autoComplete="off" aria-describedby={d} invalid={!!errors.email} {...register('email')} />}
            </Field>
            <Field label="Password" required error={errors.password?.message}>
              {(id) => <Input id={id} type="text" autoComplete="new-password" invalid={!!errors.password} {...register('password')} />}
            </Field>
            <Field label="Mobile">
              {(id) => <Input id={id} inputMode="tel" {...register('phone')} />}
            </Field>
            <Field label="জন্ম তারিখ">
              {(id) => <Input id={id} type="date" {...register('dateOfBirth')} />}
            </Field>
          </div>
          <Field label="ঠিকানা">
            {(id) => <Textarea id={id} rows={2} {...register('address')} />}
          </Field>
        </FormSection>

        <FormSection title="Guardian">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mobile" error={errors.guardianPhone?.message} hint="একই নম্বরের guardian থাকলে তার সাথেই যুক্ত হবে">
              {(id, d) => <Input id={id} inputMode="tel" aria-describedby={d} invalid={!!errors.guardianPhone} {...register('guardianPhone')} />}
            </Field>
            <Field label="নাম" error={errors.guardianName?.message}>
              {(id) => <Input id={id} invalid={!!errors.guardianName} {...register('guardianName')} />}
            </Field>
          </div>
          {existingGuardian && (
            <div role="status" className="rounded-lg border border-teal-100 bg-teal-50 px-3.5 py-2.5 text-sm text-teal-800">
              এই নম্বরে আগে থেকেই guardian আছে: <strong>{existingGuardian.fullName}</strong>
              {existingGuardian.students?.length ? ` (${existingGuardian.students.map((s) => s.user?.fullName).join(', ')})` : ''}। নতুন student তার সাথেই যুক্ত হবে।
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="সম্পর্ক">
              {(id) => (
                <Select id={id} {...register('guardianRelation')}>
                  <option value="">বাছাই করুন</option>
                  {RELATIONS.map((r) => <option key={r} value={r}>{relationLabel[r]}</option>)}
                </Select>
              )}
            </Field>
            <Field label="পেশা">
              {(id) => <Input id={id} {...register('guardianOccupation')} />}
            </Field>
          </div>
        </FormSection>

        <FormSection title="Batch ও fee">
          <Controller
            control={control}
            name="batchIds"
            render={({ field }) => (
              <CheckboxList
                label="Batch"
                options={batchOptions}
                value={field.value}
                onChange={field.onChange}
                emptyMessage={batches.isLoading ? 'Loading...' : 'কোনো সক্রিয় batch নেই। আগে Batches page থেকে batch যোগ করুন।'}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="ভর্তি fee" error={errors.admissionFee?.message} hint="ফাঁকা রাখলে কোনো ভর্তি fee ধরা হবে না">
              {(id, d) => <Input id={id} inputMode="decimal" aria-describedby={d} invalid={!!errors.admissionFee} {...register('admissionFee')} />}
            </Field>
          </div>
          <Controller
            control={control}
            name="billCurrentMonth"
            render={({ field }) => (
              <Checkbox
                label="এই মাসের batch fee এখনই ধরুন"
                hint={selectedBatches.length ? 'না ধরলেও রাতের স্বয়ংক্রিয় হিসাবে ধরা হবে' : 'আগে অন্তত একটা batch বাছাই করুন'}
                checked={field.value}
                disabled={!selectedBatches.length}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </FormSection>
      </form>
    </Drawer>
  );
}
