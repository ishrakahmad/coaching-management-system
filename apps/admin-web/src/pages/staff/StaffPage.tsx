import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useStaff } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { optionalText, requiredText } from '../../lib/forms';
import { roleLabel } from '../../lib/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, RowButton } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Checkbox, Field, Input, Select } from '../../components/ui/Field';
import type { StaffUser } from '../../types';

const ROLES = ['manager', 'accountant', 'employee'] as const;
const roleHelp: Record<(typeof ROLES)[number], string> = {
  manager: 'Student, batch, guardian সামলাতে পারে; টাকা নিতে পারে, কিন্তু payment বাতিল করতে পারে না',
  accountant: 'Fee, payment আর বকেয়া দেখে; payment বাতিল করতে পারে',
  employee: 'শুধু login; পরের phase-এ হাজিরার মতো কাজের অনুমতি পাবে',
};

export default function StaffPage() {
  const { data = [], isLoading, isError } = useStaff();
  const [editing, setEditing] = useState<StaffUser | 'new' | null>(null);

  return (
    <div className="p-8">
      <PageHeader
        title="Staff"
        description="Office-এর login: manager, accountant, employee। Teacher-দের Teachers page থেকে যোগ করুন।"
        actions={<Button onClick={() => setEditing('new')}><Plus size={16} aria-hidden /> নতুন staff</Button>}
      />
      <DataTable columns={['নাম', 'Email', 'Role', 'Status']} isLoading={isLoading} isError={isError} isEmpty={data.length === 0} emptyMessage="এখনো কোনো staff নেই।">
        {data.map((u) => (
          <RowButton key={u.id} onOpen={u.role === 'institute_admin' ? undefined : () => setEditing(u)}>
            <td className="px-4 py-3">
              <div className="text-ink">{u.fullName}</div>
              {u.phone && <div className="text-xs text-ink/50 tabular-nums">{u.phone}</div>}
            </td>
            <td className="px-4 py-3 text-ink/70">{u.email}</td>
            <td className="px-4 py-3 text-ink/80">{roleLabel[u.role] ?? u.role}</td>
            <td className="px-4 py-3">{u.isActive ? <StatusBadge tone="active">সক্রিয়</StatusBadge> : <StatusBadge tone="muted">নিষ্ক্রিয়</StatusBadge>}</td>
          </RowButton>
        ))}
      </DataTable>
      {editing && <StaffDrawer staff={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const schema = z.object({
  fullName: requiredText('নাম'),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: optionalText(20),
  role: z.enum(ROLES),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function StaffDrawer({ staff, onClose }: { staff: StaffUser | null; onClose: () => void }) {
  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: staff?.fullName ?? '',
      email: '',
      password: '',
      phone: staff?.phone ?? '',
      role: (staff?.role as FormValues['role']) ?? 'accountant',
      isActive: staff?.isActive ?? true,
    },
  });
  const save = useApiMutation(
    ({ email, password, isActive, ...v }: FormValues) =>
      staff ? api.patch(`/staff/${staff.id}`, { ...v, isActive }) : api.post('/staff', { ...v, email: email?.trim(), password }),
    { invalidate: [['staff']], success: staff ? 'Staff save হয়েছে' : 'Staff যোগ হয়েছে', onSuccess: onClose },
  );
  const submit = (v: FormValues) => {
    if (!staff) {
      let bad = false;
      if (!/\S+@\S+\.\S+/.test(v.email ?? '')) { setError('email', { message: 'সঠিক email দিন' }); bad = true; }
      if ((v.password ?? '').length < 6) { setError('password', { message: 'Password অন্তত ৬ অক্ষরের হতে হবে' }); bad = true; }
      if (bad) return;
    }
    save.mutate(v);
  };
  const role = watch('role');

  return (
    <Drawer
      open
      onClose={onClose}
      title={staff ? staff.fullName : 'নতুন staff'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" form="staff-form" loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Field label="পুরো নাম" required error={errors.fullName?.message}>
          {(id) => <Input id={id} invalid={!!errors.fullName} {...register('fullName')} />}
        </Field>
        {!staff ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" required error={errors.email?.message}>
              {(id) => <Input id={id} type="email" autoComplete="off" invalid={!!errors.email} {...register('email')} />}
            </Field>
            <Field label="Password" required error={errors.password?.message}>
              {(id) => <Input id={id} autoComplete="new-password" invalid={!!errors.password} {...register('password')} />}
            </Field>
          </div>
        ) : (
          <p className="text-xs text-ink/50">Login email: {staff.email}</p>
        )}
        <Field label="Mobile">{(id) => <Input id={id} inputMode="tel" {...register('phone')} />}</Field>
        <Field label="Role" required hint={roleHelp[role]}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} {...register('role')}>
              {ROLES.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
            </Select>
          )}
        </Field>
        {staff && <Checkbox label="সক্রিয়" hint="নিষ্ক্রিয় করলে login বন্ধ হবে" {...register('isActive')} />}
      </form>
    </Drawer>
  );
}
