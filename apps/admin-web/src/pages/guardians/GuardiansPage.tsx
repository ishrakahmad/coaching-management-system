import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useGuardians } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useDebounced } from '../../hooks/useDebounced';
import { useAuth } from '../../contexts/AuthContext';
import { canManage, isInstituteAdmin } from '../../lib/roles';
import { bdPhone, optionalText, requiredText } from '../../lib/forms';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, RowButton } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Field, FormSection, Input, Textarea } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Guardian } from '../../types';

export default function GuardiansPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search.trim());
  const { data = [], isLoading, isError } = useGuardians(debouncedSearch);
  const [editing, setEditing] = useState<Guardian | 'new' | null>(null);
  const manage = canManage(user?.role);

  return (
    <div className="p-8">
      <PageHeader
        title="Guardians"
        description="একই phone নম্বরের ভাই-বোন একজন guardian-এর অধীনে থাকে"
        actions={
          <>
            <label className="relative block">
              <span className="sr-only">নাম বা phone দিয়ে খুঁজুন</span>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
              <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম বা phone" className="w-64 pl-9" />
            </label>
            {manage && <Button onClick={() => setEditing('new')}><Plus size={16} aria-hidden /> নতুন guardian</Button>}
          </>
        }
      />

      <DataTable
        columns={['নাম', 'Phone', 'সন্তান', 'Portal login']}
        isLoading={isLoading}
        isError={isError}
        isEmpty={data.length === 0}
        emptyMessage={debouncedSearch ? `"${debouncedSearch}" নামে বা নম্বরে কোনো guardian পাওয়া যায়নি।` : 'এখনো কোনো guardian নেই। Student ভর্তির সময় guardian যোগ হয়।'}
      >
        {data.map((g) => (
          <RowButton key={g.id} onOpen={manage ? () => setEditing(g) : undefined} className="align-top">
            <td className="px-4 py-3">
              <div className="text-ink">{g.fullName}</div>
              {g.occupation && <div className="text-xs text-ink/50">{g.occupation}</div>}
            </td>
            <td className="px-4 py-3 tabular-nums text-ink/70 whitespace-nowrap">{g.phone ?? <span className="text-ink/40">নেই</span>}</td>
            <td className="px-4 py-3">
              {g.students?.length ? (
                <ul className="space-y-0.5">
                  {g.students.map((s) => (
                    <li key={s.id}>{s.user?.fullName} <span className="font-mono text-xs text-ink/50">{s.studentId}</span></li>
                  ))}
                </ul>
              ) : (
                <span className="text-ink/40">কেউ যুক্ত নেই</span>
              )}
            </td>
            <td className="px-4 py-3">{g.userId ? <StatusBadge tone="active">আছে</StatusBadge> : <StatusBadge tone="muted">নেই</StatusBadge>}</td>
          </RowButton>
        ))}
      </DataTable>

      {editing && <GuardianDrawer guardian={editing === 'new' ? null : editing} canDelete={isInstituteAdmin(user?.role)} onClose={() => setEditing(null)} />}
    </div>
  );
}

const schema = z.object({
  fullName: requiredText('নাম'),
  phone: bdPhone,
  email: z.preprocess((v) => (v === '' ? undefined : v), z.string().email('সঠিক email দিন').optional()),
  occupation: optionalText(100),
  address: optionalText(300),
});
type FormValues = z.infer<typeof schema>;

function GuardianDrawer({ guardian, canDelete, onClose }: { guardian: Guardian | null; canDelete: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [accountEmail, setAccountEmail] = useState(guardian?.email ?? '');
  const [accountPassword, setAccountPassword] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: guardian?.fullName ?? '',
      phone: guardian?.phone ?? '',
      email: guardian?.email ?? '',
      occupation: guardian?.occupation ?? '',
      address: guardian?.address ?? '',
    },
  });
  const invalidate = [['guardians'], ['students']];
  const save = useApiMutation((v: FormValues) => (guardian ? api.patch(`/guardians/${guardian.id}`, v) : api.post('/guardians', v)), {
    invalidate,
    success: guardian ? 'Guardian save হয়েছে' : 'Guardian যোগ হয়েছে',
    onSuccess: onClose,
  });
  const remove = useApiMutation(() => api.delete(`/guardians/${guardian!.id}`), { invalidate, success: 'Guardian মুছে ফেলা হয়েছে', onSuccess: onClose });
  const createAccount = useApiMutation(() => api.post(`/guardians/${guardian!.id}/account`, { email: accountEmail.trim(), password: accountPassword }), {
    invalidate,
    success: 'Guardian-এর login তৈরি হয়েছে',
    onSuccess: onClose,
  });
  const accountValid = /\S+@\S+\.\S+/.test(accountEmail) && accountPassword.length >= 6;

  return (
    <Drawer
      open
      onClose={onClose}
      title={guardian ? guardian.fullName : 'নতুন guardian'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button type="submit" form="guardian-form" loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <div className="space-y-6">
        <form id="guardian-form" onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
          <Field label="নাম" required error={errors.fullName?.message}>
            {(id) => <Input id={id} invalid={!!errors.fullName} {...register('fullName')} />}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mobile" error={errors.phone?.message}>
              {(id) => <Input id={id} inputMode="tel" invalid={!!errors.phone} {...register('phone')} />}
            </Field>
            <Field label="Email" error={errors.email?.message}>
              {(id) => <Input id={id} type="email" invalid={!!errors.email} {...register('email')} />}
            </Field>
          </div>
          <Field label="পেশা">{(id) => <Input id={id} {...register('occupation')} />}</Field>
          <Field label="ঠিকানা">{(id) => <Textarea id={id} rows={2} {...register('address')} />}</Field>
        </form>

        {guardian && guardian.students?.length ? (
          <FormSection title="সন্তান">
            <ul className="rounded-lg border border-border bg-white divide-y divide-border">
              {guardian.students.map((s) => (
                <li key={s.id}>
                  <button onClick={() => navigate(`/dashboard/students/${s.id}`)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-paper/60 outline-none focus-visible:bg-teal-50">
                    <span className="text-ink">{s.user?.fullName}</span>
                    <span className="font-mono text-xs text-ink/50">{s.studentId}</span>
                  </button>
                </li>
              ))}
            </ul>
          </FormSection>
        ) : null}

        {guardian && !guardian.userId && (
          <FormSection title="Guardian portal login">
            <p className="text-xs text-ink/50">Guardian পরে নিজের সন্তানের হাজিরা, fee আর result দেখতে পারবেন।</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">{(id) => <Input id={id} type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} />}</Field>
              <Field label="Password" hint="অন্তত ৬ অক্ষর">
                {(id, d) => <Input id={id} aria-describedby={d} value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} />}
              </Field>
            </div>
            <Button variant="secondary" disabled={!accountValid} loading={createAccount.isPending} onClick={() => createAccount.mutate()}>Login তৈরি করুন</Button>
          </FormSection>
        )}

        {guardian && canDelete && (
          <div className="border-t border-border pt-5">
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>Guardian মুছুন</Button>
            <p className="mt-2 text-xs text-ink/50">কোনো student যুক্ত থাকলে মোছা যাবে না।</p>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Guardian মুছবেন?"
        message={`${guardian?.fullName} মুছে ফেলা হবে।`}
        confirmLabel="মুছুন"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </Drawer>
  );
}
