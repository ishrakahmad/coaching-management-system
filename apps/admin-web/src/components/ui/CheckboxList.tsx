import { ReactNode } from 'react';

interface Option {
  value: string;
  label: string;
  detail?: ReactNode;
  disabled?: boolean;
}

interface CheckboxListProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  emptyMessage: string;
  /** Accessible name for the group. */
  label: string;
}

/** Scrollable multi-select for subjects, batches... Each option is a real checkbox. */
export function CheckboxList({ options, value, onChange, emptyMessage, label }: CheckboxListProps) {
  if (!options.length) return <p className="rounded-lg border border-dashed border-border px-3.5 py-3 text-sm text-ink/50">{emptyMessage}</p>;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div role="group" aria-label={label} className="max-h-60 overflow-y-auto rounded-lg border border-border bg-white divide-y divide-border">
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex items-center gap-3 px-3.5 py-2.5 text-sm ${o.disabled ? 'opacity-50' : 'cursor-pointer hover:bg-paper/60'}`}
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-teal-800"
            checked={value.includes(o.value)}
            disabled={o.disabled}
            onChange={() => toggle(o.value)}
          />
          <span className="flex-1 text-ink">{o.label}</span>
          {o.detail && <span className="text-xs text-ink/50 tabular-nums">{o.detail}</span>}
        </label>
      ))}
    </div>
  );
}
