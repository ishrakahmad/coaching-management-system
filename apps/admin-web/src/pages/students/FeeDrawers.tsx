import { useState } from 'react';
import { api } from '../../services/api';
import { useApiMutation } from '../../hooks/useApiMutation';
import { feeStatusMeta, feeTypeLabel, formatDate, formatTaka, todayInDhaka } from '../../lib/format';
import { fromPaisa, isValidAmount, toPaisa } from '../../lib/money';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { FeeType, StudentFee } from '../../types';

const invalidate = [['fees'], ['payments']];
const ONE_OFF: FeeType[] = ['admission', 'exam', 'other'];

/** Add a one-off charge (admission, exam, other). Monthly fees come from generation. */
export function AddFeeDrawer({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [type, setType] = useState<FeeType>('exam');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [dueDate, setDueDate] = useState(todayInDhaka());
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    title: !title.trim() ? 'শিরোনাম দিন' : undefined,
    amount: !isValidAmount(amount) || toPaisa(amount) === 0 ? 'সঠিক অঙ্ক দিন' : undefined,
    discount: discount && !isValidAmount(discount) ? 'সঠিক অঙ্ক দিন' : discount && toPaisa(discount) > toPaisa(amount) ? 'ছাড় fee-র চেয়ে বেশি হতে পারে না' : undefined,
  };
  const save = useApiMutation(
    () => api.post('/fees', { studentId, type, title: title.trim(), amount: Number(amount), discount: discount ? Number(discount) : undefined, dueDate, note: note.trim() || undefined }),
    { invalidate, success: 'Fee যোগ হয়েছে', onSuccess: onClose },
  );
  const submit = () => {
    setSubmitted(true);
    if (!Object.values(errors).some(Boolean)) save.mutate();
  };
  const e = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);

  return (
    <Drawer
      open
      onClose={onClose}
      title="Fee যোগ করুন"
      description="ভর্তি, পরীক্ষা বা অন্য একবারের fee। মাসিক fee নিজে থেকে তৈরি হয়।"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button onClick={submit} loading={save.isPending}>যোগ করুন</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ধরন" required>
            {(id) => (
              <Select id={id} value={type} onChange={(ev) => setType(ev.target.value as FeeType)}>
                {ONE_OFF.map((t) => <option key={t} value={t}>{feeTypeLabel[t]}</option>)}
              </Select>
            )}
          </Field>
          <Field label="শেষ তারিখ">
            {(id) => <Input id={id} type="date" value={dueDate} onChange={(ev) => setDueDate(ev.target.value)} />}
          </Field>
        </div>
        <Field label="শিরোনাম" required error={e('title')} hint="যেমন Model test, Lab fee">
          {(id, d) => <Input id={id} aria-describedby={d} invalid={!!e('title')} value={title} maxLength={150} onChange={(ev) => setTitle(ev.target.value)} />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="টাকা" required error={e('amount')}>
            {(id) => <Input id={id} inputMode="decimal" invalid={!!e('amount')} value={amount} onChange={(ev) => setAmount(ev.target.value)} />}
          </Field>
          <Field label="ছাড়" error={e('discount')}>
            {(id) => <Input id={id} inputMode="decimal" invalid={!!e('discount')} value={discount} onChange={(ev) => setDiscount(ev.target.value)} />}
          </Field>
        </div>
        <Field label="নোট">{(id) => <Textarea id={id} rows={2} maxLength={300} value={note} onChange={(ev) => setNote(ev.target.value)} />}</Field>
      </div>
    </Drawer>
  );
}

/** Adjust one fee: amount, discount (scholarship), due date; waive or delete it. */
export function FeeDrawer({ fee, canEdit, onClose }: { fee: StudentFee; canEdit: boolean; onClose: () => void }) {
  const [title, setTitle] = useState(fee.title);
  const [amount, setAmount] = useState(String(fee.amount));
  const [discount, setDiscount] = useState(String(fee.discount));
  const [dueDate, setDueDate] = useState(fee.dueDate ?? '');
  const [note, setNote] = useState(fee.note ?? '');
  const [confirm, setConfirm] = useState<'waive' | 'delete' | null>(null);
  const waived = fee.status === 'waived';
  const editable = canEdit && !waived;

  const net = toPaisa(amount) - toPaisa(discount);
  const errors = {
    title: !title.trim() ? 'শিরোনাম দিন' : undefined,
    amount: !isValidAmount(amount) ? 'সঠিক অঙ্ক দিন' : undefined,
    discount: !isValidAmount(discount) ? 'সঠিক অঙ্ক দিন' : toPaisa(discount) > toPaisa(amount) ? 'ছাড় fee-র চেয়ে বেশি হতে পারে না' : net < toPaisa(fee.paidAmount) ? `ইতিমধ্যে ${formatTaka(fee.paidAmount)} দেওয়া হয়েছে` : undefined,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const save = useApiMutation(
    () => api.patch(`/fees/${fee.id}`, { title: title.trim(), amount: Number(amount), discount: Number(discount), dueDate: dueDate || null, note: note.trim() }),
    { invalidate, success: 'Fee save হয়েছে', onSuccess: onClose },
  );
  const waive = useApiMutation((reason: string) => api.post(`/fees/${fee.id}/waive`, { reason }), { invalidate, success: 'Fee মওকুফ হয়েছে', onSuccess: onClose });
  const remove = useApiMutation(() => api.delete(`/fees/${fee.id}`), { invalidate, success: 'Fee মুছে ফেলা হয়েছে', onSuccess: onClose });

  return (
    <Drawer
      open
      onClose={onClose}
      title={fee.title}
      description={`${feeTypeLabel[fee.type]} fee${fee.dueDate ? `, শেষ তারিখ ${formatDate(fee.dueDate)}` : ''}`}
      footer={
        editable ? (
          <>
            <Button variant="secondary" onClick={onClose}>বাতিল</Button>
            <Button onClick={() => !hasErrors && save.mutate()} disabled={hasErrors} loading={save.isPending}>Save করুন</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>বন্ধ করুন</Button>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
          <div>
            <div className="text-xs text-ink/50">বকেয়া</div>
            <div className={`font-display text-xl font-semibold tabular-nums ${fee.dueAmount > 0 ? 'text-amber-700' : 'text-ink'}`}>{formatTaka(fee.dueAmount)}</div>
          </div>
          <div className="text-right">
            <StatusBadge tone={feeStatusMeta[fee.status].tone}>{feeStatusMeta[fee.status].label}</StatusBadge>
            <div className="text-xs text-ink/50 mt-1">পরিশোধ {formatTaka(fee.paidAmount)}</div>
          </div>
        </div>
        {waived && fee.waivedReason && <p className="text-sm text-ink/60">মওকুফের কারণ: {fee.waivedReason}</p>}

        <fieldset disabled={!editable} className="space-y-4">
          <Field label="শিরোনাম" required error={errors.title}>
            {(id) => <Input id={id} invalid={!!errors.title} value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} />}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="টাকা" required error={errors.amount}>
              {(id) => <Input id={id} inputMode="decimal" invalid={!!errors.amount} value={amount} onChange={(e) => setAmount(e.target.value)} />}
            </Field>
            <Field label="ছাড় বা বৃত্তি" error={errors.discount} hint={!errors.discount ? `দিতে হবে ${formatTaka(fromPaisa(Math.max(net, 0)))}` : undefined}>
              {(id, d) => <Input id={id} inputMode="decimal" aria-describedby={d} invalid={!!errors.discount} value={discount} onChange={(e) => setDiscount(e.target.value)} />}
            </Field>
          </div>
          <Field label="শেষ তারিখ">{(id) => <Input id={id} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}</Field>
          <Field label="নোট">{(id) => <Textarea id={id} rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        </fieldset>

        {editable && fee.paidAmount === 0 && (
          <div className="border-t border-border pt-5 flex flex-wrap gap-2">
            <Button variant="danger" onClick={() => setConfirm('waive')}>মওকুফ করুন</Button>
            {fee.type !== 'monthly' && <Button variant="danger" onClick={() => setConfirm('delete')}>ভুল করে যোগ হয়েছে, মুছুন</Button>}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm === 'waive'}
        title="Fee মওকুফ করবেন?"
        message={`"${fee.title}" আর বকেয়া হিসেবে ধরা হবে না। হিসাবে মওকুফ হিসেবে থেকে যাবে।`}
        confirmLabel="মওকুফ করুন"
        reasonLabel="কারণ"
        loading={waive.isPending}
        onConfirm={({ reason }) => waive.mutate(reason)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Fee মুছবেন?"
        message={`"${fee.title}" পুরোপুরি মুছে যাবে।`}
        confirmLabel="মুছুন"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirm(null)}
      />
    </Drawer>
  );
}
