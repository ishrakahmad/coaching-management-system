import { ReactNode } from 'react';

/** A titled white section on detail pages. */
export function Panel({ title, actions, children, className = '' }: { title: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-white ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="font-display font-semibold text-ink">{title}</h2>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div>{children}</div>
    </section>
  );
}

/** Label/value pairs inside a panel. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 px-5 py-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs text-ink/50">{item.label}</dt>
          <dd className="text-sm text-ink mt-0.5">{item.value ?? <span className="text-ink/40">দেওয়া নেই</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
