import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Field, Input } from './Field';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  /** Ask for a reason (void, waive); confirm stays disabled until it's filled. */
  reasonLabel?: string;
  /** Ask for a date (leaving a batch). */
  dateLabel?: string;
  defaultDate?: string;
  loading?: boolean;
  onConfirm: (values: { reason: string; date: string }) => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel, tone = 'danger', reasonLabel, dateLabel, defaultDate = '', loading, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(defaultDate);

  useEffect(() => {
    if (open) {
      setReason('');
      setDate(defaultDate);
    }
  }, [open, defaultDate]);

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation(); // close only the dialog, not the drawer under it
      onCancelRef.current();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  if (!open) return null;
  const blocked = (reasonLabel && !reason.trim()) || (dateLabel && !date);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal-900/40 animate-fade-in" onClick={onCancel} aria-hidden />
      <div role="alertdialog" aria-modal="true" aria-label={title} className="relative w-full max-w-md rounded-xl bg-white p-6 animate-fade-in">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        <div className="mt-2 text-sm text-ink/70">{message}</div>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!blocked) onConfirm({ reason: reason.trim(), date });
          }}
        >
          {dateLabel && (
            <Field label={dateLabel} required>
              {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} autoFocus />}
            </Field>
          )}
          {reasonLabel && (
            <Field label={reasonLabel} required>
              {(id) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus={!dateLabel} />}
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={onCancel}>
              বাতিল
            </Button>
            <Button type="submit" variant={tone} loading={loading} disabled={!!blocked}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
