import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** teal = normal figure, amber = money owed / needs attention. */
  accent?: 'teal' | 'amber';
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, accent = 'teal', hint }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center ${
          accent === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'
        }`}
      >
        <Icon size={20} aria-hidden />
      </div>
      <div className="min-w-0">
        <div className={`text-2xl font-display font-semibold tabular-nums truncate ${accent === 'amber' ? 'text-amber-700' : 'text-ink'}`}>{value}</div>
        <div className="text-sm text-ink/50">{label}</div>
        {hint && <div className="text-xs text-ink/40 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}
