import { forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useId } from 'react';

export const controlClass =
  'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 disabled:bg-paper disabled:text-ink/50 aria-[invalid=true]:border-danger-500 aria-[invalid=true]:focus:ring-danger-500';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink/80 mb-1.5">
        {label}
        {required && <span className="text-danger-600" aria-hidden> *</span>}
      </label>
      {children(id, error || hint ? messageId : undefined)}
      {error ? (
        <p id={messageId} className="mt-1 text-xs text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1 text-xs text-ink/50">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type WithInvalid = { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & WithInvalid>(
  function Input({ invalid, className = '', ...props }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={`${controlClass} ${className}`} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & WithInvalid>(
  function Select({ invalid, className = '', ...props }, ref) {
    return <select ref={ref} aria-invalid={invalid || undefined} className={`${controlClass} ${className}`} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & WithInvalid>(
  function Textarea({ invalid, className = '', ...props }, ref) {
    return <textarea ref={ref} rows={3} aria-invalid={invalid || undefined} className={`${controlClass} ${className}`} {...props} />;
  },
);

export function Checkbox({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input id={id} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border accent-teal-800" {...props} />
      <label htmlFor={id} className="text-sm text-ink/80">
        {label}
        {hint && <span className="block text-xs text-ink/50">{hint}</span>}
      </label>
    </div>
  );
}

/** Groups related fields inside a form with a small heading. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <legend className="font-display text-sm font-semibold text-ink mb-1">{title}</legend>
      {children}
    </fieldset>
  );
}
