import { ReactNode } from 'react';

// One meaning per tone, used the same way on every page:
// active = normal/running, attention = needs a look (current session, custom fee), muted = inactive/left.
export type BadgeTone = 'active' | 'attention' | 'muted';

const toneClasses: Record<BadgeTone, string> = {
  active: 'bg-teal-50 text-teal-700',
  attention: 'bg-amber-400/15 text-amber-700',
  muted: 'bg-ink/5 text-ink/50',
};

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
