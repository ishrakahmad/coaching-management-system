import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  /** Right-aligned slot: filters, search, create button. */
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        <p className="text-sm text-ink/50 mt-1">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
