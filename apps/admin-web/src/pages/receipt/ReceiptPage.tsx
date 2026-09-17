import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { api } from '../../services/api';
import { usePayment } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuth } from '../../contexts/AuthContext';
import { canVoidPayment } from '../../lib/roles';
import { amountInWords, formatDate, formatTaka, methodLabel, relationLabel } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

/** A printable money receipt. Browser print gives a paper copy or "Save as PDF" (Bangla renders correctly). */
export default function ReceiptPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: p, isLoading, isError } = usePayment(id);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const voidPayment = useApiMutation((reason: string) => api.post(`/payments/${id}/void`, { reason }), {
    invalidate: [['payments'], ['fees']],
    success: 'Payment বাতিল হয়েছে; fee আবার বকেয়া হিসেবে দেখাবে',
    onSuccess: () => setConfirmVoid(false),
  });

  if (isLoading) return <p className="p-8 text-sm text-ink/40">Loading...</p>;
  if (isError || !p) return <p className="p-8 text-sm text-danger-600">রসিদ পাওয়া যায়নি।</p>;

  const voided = !!p.voidedAt;
  return (
    <div className="p-8 print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-2xl flex-wrap items-center justify-between gap-2">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink rounded outline-none focus-visible:ring-2 focus-visible:ring-teal-400">
          <ArrowLeft size={16} aria-hidden /> ফিরে যান
        </button>
        <div className="flex gap-2">
          {!voided && canVoidPayment(user?.role) && <Button variant="danger" onClick={() => setConfirmVoid(true)}>Payment বাতিল</Button>}
          {p.student && <Button variant="secondary" onClick={() => navigate(`/dashboard/students/${p.studentId}`)}>Student দেখুন</Button>}
          <Button onClick={() => window.print()}><Printer size={16} aria-hidden /> Print</Button>
        </div>
      </div>

      <article className="relative mx-auto max-w-2xl overflow-hidden rounded-xl border border-border bg-white print:max-w-none print:rounded-none print:border-0">
        {voided && (
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-lg border-4 border-danger-500 px-6 py-2 font-display text-5xl font-bold tracking-widest text-danger-500/60">VOID</span>
          </div>
        )}

        <header className="flex items-start justify-between gap-6 border-b-2 border-teal-800 px-8 py-6">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">{p.institute?.name}</h1>
            <div className="mt-1 text-xs text-ink/60 space-y-0.5">
              {p.institute?.address && <p>{p.institute.address}</p>}
              {(p.institute?.phone || p.institute?.email) && <p>{[p.institute?.phone, p.institute?.email].filter(Boolean).join(', ')}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-sm font-semibold text-teal-800">টাকা জমার রসিদ</p>
            <p className="mt-1 font-mono text-sm text-ink">{p.receiptNo}</p>
            <p className="text-xs text-ink/60">{formatDate(p.paidAt)}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-x-8 gap-y-2 px-8 py-5 text-sm">
          <div>
            <p className="text-xs text-ink/50">Student</p>
            <p className="text-ink">{p.student?.user?.fullName}</p>
            <p className="font-mono text-xs text-ink/60">{p.student?.studentId}</p>
          </div>
          {p.student?.guardian && (
            <div>
              <p className="text-xs text-ink/50">Guardian</p>
              <p className="text-ink">
                {p.student.guardian.fullName}
                {p.student.guardianRelation && <span className="text-ink/50"> ({relationLabel[p.student.guardianRelation]})</span>}
              </p>
              {p.student.guardian.phone && <p className="text-xs text-ink/60 tabular-nums">{p.student.guardian.phone}</p>}
            </div>
          )}
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border bg-paper text-left text-xs text-ink/60">
              <th scope="col" className="px-8 py-2 font-medium">বিবরণ</th>
              <th scope="col" className="px-8 py-2 text-right font-medium">টাকা</th>
            </tr>
          </thead>
          <tbody>
            {p.allocations?.map((a) => (
              <tr key={a.id} className="border-b border-border">
                <td className="px-8 py-2.5 text-ink">{a.fee?.title}</td>
                <td className="px-8 py-2.5 text-right tabular-nums text-ink">{formatTaka(a.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="px-8 py-3 text-left font-display font-semibold text-ink">মোট</th>
              <td className="px-8 py-3 text-right font-display text-lg font-semibold tabular-nums text-ink">{formatTaka(p.amount)}</td>
            </tr>
          </tfoot>
        </table>

        <section className="px-8 pb-6 text-sm space-y-1">
          <p className="text-ink/70 italic">{amountInWords(p.amount)}</p>
          <p className="text-ink/70">
            মাধ্যম: {methodLabel[p.method]}
            {p.reference && `, reference ${p.reference}`}
          </p>
          {p.note && <p className="text-ink/60">নোট: {p.note}</p>}
          {voided && (
            <p className="text-danger-700">
              বাতিল {formatDate(p.voidedAt!.slice(0, 10))}: {p.voidReason}
            </p>
          )}
        </section>

        <footer className="flex items-end justify-between border-t border-border px-8 py-6 text-xs text-ink/60">
          <p>গ্রহণ করেছেন: {p.receivedBy?.fullName ?? '—'}</p>
          <p className="w-40 border-t border-ink/40 pt-1 text-center">স্বাক্ষর</p>
        </footer>
      </article>

      <ConfirmDialog
        open={confirmVoid}
        title="Payment বাতিল করবেন?"
        message={`${p.receiptNo} (${formatTaka(p.amount)}) বাতিল হবে। যেসব fee-তে এই টাকা গিয়েছিল সেগুলো আবার বকেয়া হবে। রসিদ নম্বরটা "বাতিল" হিসেবে থেকে যাবে।`}
        confirmLabel="বাতিল করুন"
        reasonLabel="কারণ"
        loading={voidPayment.isPending}
        onConfirm={({ reason }) => voidPayment.mutate(reason)}
        onCancel={() => setConfirmVoid(false)}
      />
    </div>
  );
}
