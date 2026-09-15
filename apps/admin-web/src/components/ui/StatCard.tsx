import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'teal' | 'amber';
}

export function StatCard({ label, value, icon: Icon, accent = 'teal' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center ${
          accent === 'amber' ? 'bg-amber-400/15 text-amber-600' : 'bg-teal-400/10 text-teal-600'
        }`}
      >
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-display font-semibold text-ink">{value}</div>
        <div className="text-sm text-ink/50">{label}</div>
      </div>
    </div>
  );
}
