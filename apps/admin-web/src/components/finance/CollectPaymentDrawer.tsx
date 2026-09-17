import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useLedger } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { formatDate, formatTaka, methodLabel, todayInDhaka } from '../../lib/format';
import { fromPaisa, isValidAmount, toPaisa } from '../../lib/money';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Field, FormSection, Input, Select, Textarea } from '../ui/Field';
import { StatusBadge } from '../ui/StatusBadge';
import type { Payment, PaymentMethod, StudentFee } from '../../types';

const METHODS = Object.keys(methodLabel) as PaymentMethod[];

interface Props {
  studentId: string;
  onClose: () => void;
}

/**
 * Take money from a student. Every open fee is listed oldest first and pre-filled with
 * its full due; the cashier unticks or lowers amounts for a partial payment.
 */
export function CollectPaymentDrawer({ studentId, onClose }: Props) {
  const navigate = useNavigate();
  const ledger = useLedger(studentId);
  const openFees = useMemo(
    () =>
      (ledger.data?.fees ?? [])
        .filter((f) => f.status === 'unpaid' || f.status === 'partial')
        // Same order the API uses: due date, monthly before one-off on the same date, then month.
        .sort(
          (a, b) =>
            (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
            Number(b.type === 'monthly') - Number(a.type === 'monthly') ||
            (a.period ?? '').localeCompare(b.period ?? ''),
        ),
    [ledger.data],
  );

  // feeId -> typed amount; a fee not in the map is not being paid.
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [initialised, setInitialised] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState(todayInDhaka());
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!initialised && ledger.data) {
      setAmounts(Object.fromEntries(openFees.map((f) => [f.id, String(f.dueAmount)])));
      setInitialised(true);
    }
  }, [ledger.data, openFees, initialised]);

  const errors: Record<string, string> = {};
  for (const fee of openFees) {
    const value = amounts[fee.id];
    if (value === undefined) continue;
    if (!isValidAmount(value) || toPaisa(value) === 0) errors[fee.id] = 'সঠিক অঙ্ক দিন';
    else if (toPaisa(value) > toPaisa(fee.dueAmount)) errors[fee.id] = `সর্বোচ্চ ${formatTaka(fee.dueAmount)}`;
  }
  const selected = openFees.filter((f) => amounts[f.id] !== undefined);
  const totalPaisa = selected.reduce((sum, f) => sum + (errors[f.id] ? 0 : toPaisa(amounts[f.id])), 0);
  const dateError = !paidAt ? 'তারিখ দিন' : paidAt > todayInDhaka() ? 'ভবিষ্যতের তারিখ দেওয়া যাবে না' : undefined;
  const referenceHint = method === 'cash' ? undefined : method === 'bank' ? 'Cheque বা bank reference' : 'Transaction ID (TrxID)';
  const canSubmit = selected.length > 0 && Object.keys(errors).length === 0 && totalPaisa > 0 && !dateError;

  const pay = useApiMutation<void, Payment>(
    () =>
      api.post('/payments', {
        studentId,
        amount: fromPaisa(totalPaisa),
        method,
        reference: reference.trim() || undefined,
        paidAt,
        note: note.trim() || undefined,
        allocations: selected.map((f) => ({ feeId: f.id, amount: Number(amounts[f.id]) })),
      }),
    {
      invalidate: [['fees'], ['payments']],
      success: (payment) => `${formatTaka(payment.amount)} জমা হয়েছে, রসিদ ${payment.receiptNo}`,
      onSuccess: (payment) => navigate(`/dashboard/payments/${payment.id}/receipt`),
    },
  );

  const toggle = (fee: StudentFee) =>
    setAmounts((current) => {
      const next = { ...current };
      if (next[fee.id] === undefined) next[fee.id] = String(fee.dueAmount);
      else delete next[fee.id];
      return next;
    });

  const student = ledger.data?.student;
  return (
    <Drawer
      open
      width="lg"
      onClose={onClose}
      title="টাকা জমা নিন"
      description={student ? `${student.user?.fullName}, ${student.studentId}` : undefined}
      footer={
        <>
          <div className="mr-auto self-center text-sm text-ink/60">
            মোট <span className="font-display text-lg font-semibold text-ink tabular-nums">{formatTaka(fromPaisa(totalPaisa))}</span>
          </div>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button
            loading={pay.isPending}
            disabled={!canSubmit && submitted}
            onClick={() => {
              setSubmitted(true);
              if (canSubmit) pay.mutate();
            }}
          >
            জমা নিন ও রসিদ দেখুন
          </Button>
        </>
      }
    >
      {ledger.isLoading && <p className="text-sm text-ink/40">Loading...</p>}
      {ledger.isError && <p className="text-sm text-danger-600">বকেয়ার তথ্য load করা যায়নি।</p>}
      {ledger.data && openFees.length === 0 && (
        <p className="rounded-lg border border-border bg-white px-4 py-6 text-center text-sm text-ink/60">এই student-এর কোনো বকেয়া নেই।</p>
      )}

      {openFees.length > 0 && (
        <div className="space-y-6">
          <FormSection title="কোন fee-র টাকা">
            <div className="rounded-lg border border-border bg-white divide-y divide-border">
              {openFees.map((fee) => {
                const checked = amounts[fee.id] !== undefined;
                const overdue = fee.dueDate && fee.dueDate < todayInDhaka();
                return (
                  <div key={fee.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                    <input
                      type="checkbox"
                      aria-label={`${fee.title} বাছাই`}
                      className="h-4 w-4 accent-teal-800"
                      checked={checked}
                      onChange={() => toggle(fee)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-ink">{fee.title}</div>
                      <div className="text-xs text-ink/50">
                        বকেয়া {formatTaka(fee.dueAmount)}
                        {fee.dueDate && `, শেষ তারিখ ${formatDate(fee.dueDate)}`}
                      </div>
                    </div>
                    {overdue && <StatusBadge tone="danger">মেয়াদ পার</StatusBadge>}
                    <div className="w-32">
                      <Input
                        aria-label={`${fee.title} এর অঙ্ক`}
                        inputMode="decimal"
                        disabled={!checked}
                        invalid={checked && !!errors[fee.id]}
                        value={checked ? amounts[fee.id] : ''}
                        onChange={(e) => setAmounts((current) => ({ ...current, [fee.id]: e.target.value }))}
                        className="text-right tabular-nums"
                      />
                      {checked && errors[fee.id] && <p className="mt-1 text-right text-xs text-danger-600">{errors[fee.id]}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            {submitted && selected.length === 0 && <p className="text-xs text-danger-600">অন্তত একটা fee বাছাই করুন।</p>}
          </FormSection>

          <FormSection title="কীভাবে দিয়েছে">
            <div className="grid grid-cols-2 gap-4">
              <Field label="মাধ্যম" required>
                {(id) => (
                  <Select id={id} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                    {METHODS.map((m) => (
                      <option key={m} value={m}>{methodLabel[m]}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="তারিখ" required error={submitted ? dateError : undefined}>
                {(id, d) => (
                  <Input id={id} type="date" max={todayInDhaka()} aria-describedby={d} invalid={submitted && !!dateError} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                )}
              </Field>
            </div>
            {referenceHint && (
              <Field label="Reference" hint={referenceHint}>
                {(id, d) => <Input id={id} aria-describedby={d} value={reference} maxLength={100} onChange={(e) => setReference(e.target.value)} />}
              </Field>
            )}
            <Field label="নোট">
              {(id) => <Textarea id={id} rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />}
            </Field>
          </FormSection>
        </div>
      )}
    </Drawer>
  );
}
