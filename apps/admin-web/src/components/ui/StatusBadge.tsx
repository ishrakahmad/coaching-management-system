import { ReactNode } from 'react';

// One meaning per tone, used the same way on every page:
// active = normal/running/paid, attention = needs a look (money due, current session, custom fee),
// muted = inactive/left/waived, danger = void or failed.
export type BadgeTone = 'active' | 'attention' | 'muted' | 'danger';

const toneClasses: Record<BadgeTone, string> = {
  active: 'bg-teal-50 text-teal-700',
  attention: 'bg-amber-50 text-amber-700',
  muted: 'bg-ink/5 text-ink/50',
  danger: 'bg-danger-50 text-danger-700',
};

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
