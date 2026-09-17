import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePayments } from '../../hooks/queries';
import { formatDate, formatTaka, methodLabel, todayInDhaka } from '../../lib/format';
import { sumMoney } from '../../lib/money';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, RowButton } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Checkbox, Input, Select } from '../../components/ui/Field';
import type { PaymentMethod } from '../../types';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const today = todayInDhaka();
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const [method, setMethod] = useState('');
  const [includeVoided, setIncludeVoided] = useState(false);
  const rangeError = from && to && to < from;
  const { data = [], isLoading, isError } = usePayments({ from: rangeError ? undefined : from, to: rangeError ? undefined : to, method, includeVoided });
  const total = useMemo(() => sumMoney(data.filter((p) => !p.voidedAt).map((p) => p.amount)), [data]);

  return (
    <div className="p-8">
      <PageHeader title="Payments" description="কে কবে কত টাকা দিয়েছে; যেকোনো রসিদ খুলে আবার print করা যায়" />

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm text-ink/60">
          <span className="block mb-1">থেকে</span>
          <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        </label>
        <label className="text-sm text-ink/60">
          <span className="block mb-1">পর্যন্ত</span>
          <Input type="date" value={to} min={from || undefined} invalid={!!rangeError} onChange={(e) => setTo(e.target.value)} className="w-44" />
        </label>
        <label className="text-sm text-ink/60">
          <span className="block mb-1">মাধ্যম</span>
          <Select value={method} onChange={(e) => setMethod(e.target.value)} className="w-40">
            <option value="">সব</option>
            {(Object.keys(methodLabel) as PaymentMethod[]).map((m) => <option key={m} value={m}>{methodLabel[m]}</option>)}
          </Select>
        </label>
        <div className="pb-2.5">
          <Checkbox label="বাতিল করা payment দেখান" checked={includeVoided} onChange={(e) => setIncludeVoided(e.target.checked)} />
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-ink/50">{data.filter((p) => !p.voidedAt).length}টা payment</div>
          <div className="font-display text-lg font-semibold text-teal-700 tabular-nums">{formatTaka(total)}</div>
        </div>
      </div>
      {rangeError && <p className="mt-2 text-xs text-danger-600">"পর্যন্ত" তারিখ "থেকে" তারিখের আগে হতে পারে না।</p>}

      <DataTable
        className="mt-4"
        columns={['রসিদ', 'তারিখ', 'Student', 'মাধ্যম', 'গ্রহণ করেছেন', { label: 'টাকা', align: 'right' }]}
        isLoading={isLoading}
        isError={isError}
        isEmpty={data.length === 0}
        emptyMessage="এই সময়ে কোনো payment নেই।"
      >
        {data.map((p) => (
          <RowButton key={p.id} onOpen={() => navigate(`/dashboard/payments/${p.id}/receipt`)}>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="font-mono text-xs text-ink/70">{p.receiptNo}</span>
              {p.voidedAt && <span className="ml-2"><StatusBadge tone="danger">বাতিল</StatusBadge></span>}
            </td>
            <td className="px-4 py-3 text-ink/60 whitespace-nowrap tabular-nums">{formatDate(p.paidAt)}</td>
            <td className="px-4 py-3">
              <div className="text-ink">{p.student?.user?.fullName}</div>
              <div className="font-mono text-xs text-ink/50">{p.student?.studentId}</div>
            </td>
            <td className="px-4 py-3 text-ink/70">
              {methodLabel[p.method]}
              {p.reference && <div className="text-xs text-ink/40">{p.reference}</div>}
            </td>
            <td className="px-4 py-3 text-ink/60">{p.receivedBy?.fullName ?? '—'}</td>
            <td className={`px-4 py-3 text-right tabular-nums font-medium ${p.voidedAt ? 'text-ink/40 line-through' : 'text-teal-700'}`}>{formatTaka(p.amount)}</td>
          </RowButton>
        ))}
      </DataTable>
    </div>
  );
}
