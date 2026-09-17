import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Banknote, CalendarPlus, HandCoins, Search, Wallet } from 'lucide-react';
import { api } from '../../services/api';
import { useBatches, useDues, useFeeSummary } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useDebounced } from '../../hooks/useDebounced';
import { formatDate, formatPeriod, formatTaka, methodLabel, shiftPeriod, todayInDhaka } from '../../lib/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, RowButton } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Checkbox, Field, Input, Select } from '../../components/ui/Field';
import { CollectPaymentDrawer } from '../../components/finance/CollectPaymentDrawer';
import type { GenerateResult } from '../../types';

export default function FeesPage() {
  const navigate = useNavigate();
  const batches = useBatches();
  const summary = useFeeSummary();
  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const dues = useDues({ batchId, search: useDebounced(search.trim()), overdueOnly });
  const [collectFor, setCollectFor] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const s = summary.data;

  return (
    <div className="p-8">
      <PageHeader
        title="Fees"
        description={s ? `${s.label}-এর হিসাব আর কার কাছে কত বকেয়া` : 'মাসের হিসাব আর কার কাছে কত বকেয়া'}
        actions={
          <Button variant="secondary" onClick={() => setGenerating(true)}>
            <CalendarPlus size={16} aria-hidden /> মাসিক fee তৈরি
          </Button>
        }
      />

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="মোট বকেয়া" value={s ? formatTaka(s.outstanding.total) : '–'} hint={s ? `${s.outstanding.students} জন student` : undefined} icon={AlertCircle} accent="amber" />
        <StatCard label="এই মাসে জমা" value={s ? formatTaka(s.collected.total) : '–'} hint={s ? `${s.collected.count}টা payment` : undefined} icon={Wallet} />
        <StatCard label="আজ জমা" value={s ? formatTaka(s.collectedToday) : '–'} icon={Banknote} />
        <StatCard label="এই মাসে ধরা হয়েছে" value={s ? formatTaka(s.billed.total) : '–'} hint={s ? `${s.billed.count}টা fee` : undefined} icon={HandCoins} />
      </div>
      {s && s.byMethod.length > 0 && (
        <p className="mt-3 text-xs text-ink/50">
          এই মাসে জমা: {s.byMethod.map((m) => `${methodLabel[m.method]} ${formatTaka(m.total)}`).join(', ')}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-end gap-3">
        <label className="relative block">
          <span className="sr-only">নাম, ID বা guardian-এর phone দিয়ে খুঁজুন</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম, ID বা guardian-এর phone" className="w-72 pl-9" />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink/60">
          Batch
          <Select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="w-56">
            <option value="">সব batch</option>
            {batches.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </label>
        <div className="pb-2.5">
          <Checkbox label="শুধু মেয়াদ পার হওয়া" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
        </div>
        {dues.data && (
          <div className="ml-auto text-right">
            <div className="text-xs text-ink/50">{dues.data.studentCount} জনের বকেয়া</div>
            <div className="font-display text-lg font-semibold text-amber-700 tabular-nums">{formatTaka(dues.data.totalDue)}</div>
          </div>
        )}
      </div>

      <DataTable
        className="mt-4"
        columns={['Student', 'Guardian', 'সবচেয়ে পুরোনো বকেয়া', { label: 'বকেয়া', align: 'right' }, '']}
        isLoading={dues.isLoading}
        isError={dues.isError}
        isEmpty={!dues.data?.students.length}
        emptyMessage={search || batchId || overdueOnly ? 'এই filter-এ কোনো বকেয়া নেই।' : 'কারো কাছে কোনো বকেয়া নেই।'}
      >
        {dues.data?.students.map((d) => (
          <RowButton key={d.id} onOpen={() => navigate(`/dashboard/students/${d.id}`)}>
            <td className="px-4 py-3">
              <div className="text-ink">{d.fullName}</div>
              <div className="font-mono text-xs text-ink/50">{d.studentCode}</div>
            </td>
            <td className="px-4 py-3">
              {d.guardianName ? (
                <>
                  <div className="text-ink/80">{d.guardianName}</div>
                  {d.guardianPhone && <div className="text-xs text-ink/50 tabular-nums">{d.guardianPhone}</div>}
                </>
              ) : (
                <span className="text-ink/40">—</span>
              )}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="text-ink/60 tabular-nums">{formatDate(d.oldestDueDate) ?? '—'}</span>
              {d.overdueCount > 0 && (
                <span className="ml-2"><StatusBadge tone="danger">{d.overdueCount}টা মেয়াদ পার</StatusBadge></span>
              )}
            </td>
            <td className="px-4 py-3 text-right">
              <div className="font-medium text-amber-700 tabular-nums">{formatTaka(d.due)}</div>
              <div className="text-xs text-ink/40">{d.feeCount}টা fee</div>
            </td>
            <td className="px-4 py-3 text-right">
              <Button size="sm" onClick={(e) => { e.stopPropagation(); setCollectFor(d.id); }}>টাকা নিন</Button>
            </td>
          </RowButton>
        ))}
      </DataTable>

      {collectFor && <CollectPaymentDrawer studentId={collectFor} onClose={() => setCollectFor(null)} />}
      {generating && <GenerateDrawer onClose={() => setGenerating(false)} />}
    </div>
  );
}

function GenerateDrawer({ onClose }: { onClose: () => void }) {
  const batches = useBatches();
  const current = todayInDhaka().slice(0, 7);
  const periods = [shiftPeriod(current, -2), shiftPeriod(current, -1), current, shiftPeriod(current, 1)];
  const [period, setPeriod] = useState(current);
  const [batchId, setBatchId] = useState('');
  const [result, setResult] = useState<GenerateResult | null>(null);

  const generate = useApiMutation<void, GenerateResult>(
    () => api.post('/fees/generate-monthly', { period, batchId: batchId || undefined }),
    { invalidate: [['fees']], onSuccess: setResult },
  );

  return (
    <Drawer
      open
      onClose={onClose}
      title="মাসিক fee তৈরি"
      description="প্রতিদিন রাতে চলতি মাসের fee নিজে থেকেই তৈরি হয়। আগের বা পরের মাসের জন্য, বা এখনই চাইলে এখান থেকে করুন।"
      footer={
        result ? (
          <Button onClick={onClose}>ঠিক আছে</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>বাতিল</Button>
            <Button onClick={() => generate.mutate()} loading={generate.isPending}>Fee তৈরি করুন</Button>
          </>
        )
      }
    >
      {result ? (
        <div role="status" className="rounded-xl border border-teal-100 bg-teal-50 px-5 py-4 text-sm text-teal-800 space-y-1">
          <p className="font-display text-base font-semibold">{result.label}</p>
          <p>{result.created}টা নতুন fee তৈরি হয়েছে।</p>
          {result.alreadyBilled > 0 && <p>{result.alreadyBilled}টা আগেই তৈরি ছিল, আবার ধরা হয়নি।</p>}
          {result.eligible === 0 && <p>এই মাসে fee ধরার মতো কোনো সক্রিয় ভর্তি নেই।</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="মাস" required>
            {(id) => (
              <Select id={id} value={period} onChange={(e) => setPeriod(e.target.value)}>
                {periods.map((p) => <option key={p} value={p}>{formatPeriod(p)}{p === current ? ' (চলতি)' : ''}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Batch" hint="ফাঁকা রাখলে সব সক্রিয় batch">
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                <option value="">সব batch</option>
                {batches.data?.filter((b) => b.isActive).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            )}
          </Field>
          <p className="text-xs text-ink/50">
            ওই মাসে যারা ভর্তি ছিল (আর student সক্রিয়), শুধু তাদের fee ধরা হবে। কাউকে একই মাসের জন্য দুবার ধরা হয় না, তাই বারবার চালালেও সমস্যা নেই।
          </p>
        </div>
      )}
    </Drawer>
  );
}
