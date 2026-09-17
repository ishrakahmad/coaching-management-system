import { useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useBatches } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { formatTaka, todayInDhaka } from '../../lib/format';
import { isValidAmount } from '../../lib/money';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Checkbox, Field, Input, Select } from '../../components/ui/Field';
import type { Enrollment } from '../../types';

const invalidate = [['students'], ['batches'], ['fees']];

/** Put a student into another batch. */
export function EnrollDrawer({ studentId, activeBatchIds, onClose }: { studentId: string; activeBatchIds: string[]; onClose: () => void }) {
  const batches = useBatches();
  const options = useMemo(() => (batches.data ?? []).filter((b) => b.isActive && !activeBatchIds.includes(b.id)), [batches.data, activeBatchIds]);
  const [batchId, setBatchId] = useState('');
  const [enrolledAt, setEnrolledAt] = useState(todayInDhaka());
  const [fee, setFee] = useState('');
  const [billNow, setBillNow] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const batch = options.find((b) => b.id === batchId);
  const errors = {
    batchId: !batchId ? 'Batch বাছাই করুন' : undefined,
    fee: fee && !isValidAmount(fee) ? 'সঠিক অঙ্ক দিন' : undefined,
    enrolledAt: !enrolledAt ? 'তারিখ দিন' : undefined,
  };
  const save = useApiMutation(
    () => api.post(`/students/${studentId}/enrollments`, { batchId, enrolledAt, feeOverride: fee ? Number(fee) : undefined, billCurrentMonth: billNow }),
    { invalidate, success: 'Batch-এ ভর্তি হয়েছে', onSuccess: onClose },
  );
  const submit = () => {
    setSubmitted(true);
    if (!Object.values(errors).some(Boolean)) save.mutate();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Batch-এ ভর্তি"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button onClick={submit} loading={save.isPending}>ভর্তি করুন</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Batch" required error={submitted ? errors.batchId : undefined}>
          {(id) => (
            <Select id={id} value={batchId} invalid={submitted && !!errors.batchId} onChange={(e) => setBatchId(e.target.value)}>
              <option value="">{batches.isLoading ? 'Loading...' : options.length ? 'বাছাই করুন' : 'ভর্তি করার মতো সক্রিয় batch নেই'}</option>
              {options.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({formatTaka(b.monthlyFee)}){b.academicSession ? `, ${b.academicSession.name}` : ''}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ভর্তির তারিখ" required error={submitted ? errors.enrolledAt : undefined}>
            {(id) => <Input id={id} type="date" value={enrolledAt} onChange={(e) => setEnrolledAt(e.target.value)} />}
          </Field>
          <Field label="আলাদা মাসিক fee" error={errors.fee} hint={batch ? `ফাঁকা রাখলে batch-এর ${formatTaka(batch.monthlyFee)}` : 'ফাঁকা রাখলে batch-এর fee'}>
            {(id, d) => <Input id={id} inputMode="decimal" aria-describedby={d} invalid={!!errors.fee} value={fee} onChange={(e) => setFee(e.target.value)} />}
          </Field>
        </div>
        <Checkbox label="এই মাসের fee এখনই ধরুন" hint="না ধরলেও রাতের স্বয়ংক্রিয় হিসাবে ধরা হবে" checked={billNow} onChange={(e) => setBillNow(e.target.checked)} />
      </div>
    </Drawer>
  );
}

/** Change joining date or the student's own monthly fee for this batch. */
export function EnrollmentEditDrawer({ enrollment, onClose }: { enrollment: Enrollment; onClose: () => void }) {
  const [enrolledAt, setEnrolledAt] = useState(enrollment.enrolledAt);
  const [fee, setFee] = useState(enrollment.feeOverride === null ? '' : String(enrollment.feeOverride));
  const feeError = fee && !isValidAmount(fee) ? 'সঠিক অঙ্ক দিন' : undefined;
  const save = useApiMutation(
    () => api.patch(`/enrollments/${enrollment.id}`, { enrolledAt, feeOverride: fee === '' ? null : Number(fee) }),
    { invalidate, success: 'Batch-এর তথ্য save হয়েছে', onSuccess: onClose },
  );
  return (
    <Drawer
      open
      onClose={onClose}
      title={enrollment.batch?.name ?? 'Batch'}
      description="নতুন fee আগামী মাসের হিসাব থেকে ধরা হবে; আগে তৈরি হওয়া fee বদলাতে Fee অংশ থেকে ছাড় দিন"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>বাতিল</Button>
          <Button onClick={() => !feeError && enrolledAt && save.mutate()} loading={save.isPending}>Save করুন</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="ভর্তির তারিখ" required>
          {(id) => <Input id={id} type="date" value={enrolledAt} onChange={(e) => setEnrolledAt(e.target.value)} />}
        </Field>
        <Field label="আলাদা মাসিক fee" error={feeError} hint={`ফাঁকা রাখলে batch-এর ${formatTaka(enrollment.batch?.monthlyFee)}`}>
          {(id, d) => <Input id={id} inputMode="decimal" aria-describedby={d} invalid={!!feeError} value={fee} onChange={(e) => setFee(e.target.value)} />}
        </Field>
      </div>
    </Drawer>
  );
}
