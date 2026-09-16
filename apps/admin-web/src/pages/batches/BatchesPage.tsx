import { useEffect, useState } from 'react';
import { useBatches, useSessions } from '../../hooks/queries';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatTaka } from '../../lib/format';

const ALL = 'all';

export default function BatchesPage() {
  const sessions = useSessions();
  const [sessionId, setSessionId] = useState<string>();

  // Start on the current session once sessions load; the user can switch to "all".
  useEffect(() => {
    if (sessionId === undefined && sessions.data) {
      setSessionId(sessions.data.find((s) => s.isCurrent)?.id ?? ALL);
    }
  }, [sessions.data, sessionId]);

  const selected = sessionId && sessionId !== ALL ? sessionId : undefined;
  const { data = [], isLoading, isError } = useBatches(selected);
  const waiting = sessionId === undefined || isLoading;

  return (
    <div className="p-8">
      <PageHeader
        title="Batches"
        description="Session অনুযায়ী batch, class আর বর্তমান student সংখ্যা"
        actions={
          <label className="flex items-center gap-2 text-sm text-ink/60">
            Session
            <select
              value={sessionId ?? ALL}
              onChange={(e) => setSessionId(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
            >
              <option value={ALL}>সব session</option>
              {sessions.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isCurrent ? ' (চলতি)' : ''}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {waiting && <p className="text-ink/40 text-sm">Loading...</p>}
        {isError && <p className="text-red-600 text-sm">Data load করা যায়নি। Backend চলছে কিনা check করুন।</p>}
        {!waiting && !isError && data.length === 0 && (
          <p className="text-ink/40 text-sm">এই session-এ কোনো batch নেই।</p>
        )}
        {!waiting &&
          data.map((b) => (
            <article key={b.id} className={`rounded-xl border border-border bg-white p-5 ${b.isActive ? '' : 'opacity-70'}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display font-semibold text-ink">{b.name}</h2>
                {!b.isActive && <StatusBadge tone="muted">বন্ধ</StatusBadge>}
              </div>
              <div className="text-sm text-ink/50 mt-0.5">
                {[b.academicClass?.name, b.academicSession?.name].filter(Boolean).join(', ') || 'Class/session দেওয়া নেই'}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div>
                  <dt className="text-xs text-ink/50">মাসিক fee</dt>
                  <dd className="text-sm font-medium text-teal-700 tabular-nums">{formatTaka(b.monthlyFee)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink/50">Student</dt>
                  <dd className="text-sm font-medium text-ink tabular-nums">{b.activeStudentCount} জন</dd>
                </div>
              </dl>

              {(b.leadTeacher?.user || b.schedule) && (
                <div className="mt-3 text-xs text-ink/50 space-y-0.5">
                  {b.leadTeacher?.user && <div>শিক্ষক: {b.leadTeacher.user.fullName}</div>}
                  {b.schedule && <div>{b.schedule}</div>}
                </div>
              )}
            </article>
          ))}
      </div>
    </div>
  );
}
