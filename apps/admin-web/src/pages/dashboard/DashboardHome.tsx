import { Link } from 'react-router-dom';
import { AlertCircle, Banknote, CalendarRange, GraduationCap, Layers, Wallet } from 'lucide-react';
import { useBatches, useCurrentSession, useDues, useFeeSummary, useStudents } from '../../hooks/queries';
import { useAuth } from '../../contexts/AuthContext';
import { canSeeFinance, canSeeStudents } from '../../lib/roles';
import { formatTaka } from '../../lib/format';
import { StatCard } from '../../components/ui/StatCard';
import { Panel } from '../../components/ui/Panel';

export default function DashboardHome() {
  const { user } = useAuth();
  const finance = canSeeFinance(user?.role);
  const people = canSeeStudents(user?.role);
  const students = useStudents(people);
  const batches = useBatches();
  const current = useCurrentSession();
  const summary = useFeeSummary(undefined, finance);
  const dues = useDues({ enabled: finance });

  const activeStudents = students.data?.filter((s) => s.status === 'active').length;
  const activeBatches = batches.data?.filter((b) => b.isActive).length;
  const s = summary.data;
  const topDues = dues.data?.students.slice(0, 5) ?? [];

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="text-sm text-ink/50 mt-1">{current.data ? `চলতি session ${current.data.name}` : 'আপনার institute-এর overview'}</p>

      {finance && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <StatCard label="মোট বকেয়া" value={s ? formatTaka(s.outstanding.total) : '–'} hint={s ? `${s.outstanding.students} জন student` : undefined} icon={AlertCircle} accent="amber" />
          <StatCard label={s ? `${s.label}-এ জমা` : 'এই মাসে জমা'} value={s ? formatTaka(s.collected.total) : '–'} hint={s ? `এই মাসে ধরা হয়েছে ${formatTaka(s.billed.total)}` : undefined} icon={Wallet} />
          <StatCard label="আজ জমা" value={s ? formatTaka(s.collectedToday) : '–'} icon={Banknote} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <StatCard label="চলতি session" value={current.data?.name ?? (current.isLoading ? '–' : 'নেই')} icon={CalendarRange} hint={!current.isLoading && !current.data ? 'Sessions page থেকে ঠিক করুন' : undefined} />
        {people && <StatCard label="সক্রিয় student" value={activeStudents ?? '–'} icon={GraduationCap} />}
        <StatCard label="সক্রিয় batch" value={activeBatches ?? '–'} icon={Layers} />
      </div>

      {finance && (
        <Panel
          className="mt-8"
          title="সবচেয়ে বেশি বকেয়া"
          actions={<Link to="/dashboard/fees" className="text-sm text-teal-700 hover:underline underline-offset-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-teal-400">সব বকেয়া দেখুন</Link>}
        >
          {dues.isLoading ? (
            <p className="px-5 py-4 text-sm text-ink/40">Loading...</p>
          ) : topDues.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink/50">কারো কাছে কোনো বকেয়া নেই।</p>
          ) : (
            <ul className="divide-y divide-border">
              {topDues.map((d) => (
                <li key={d.id}>
                  <Link to={`/dashboard/students/${d.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-paper/60 outline-none focus-visible:bg-teal-50">
                    <span>
                      <span className="text-sm text-ink">{d.fullName}</span>
                      <span className="ml-2 font-mono text-xs text-ink/50">{d.studentCode}</span>
                    </span>
                    <span className="text-sm font-medium tabular-nums text-amber-700">{formatTaka(d.due)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
