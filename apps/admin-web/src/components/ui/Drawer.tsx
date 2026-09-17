import { ReactNode, useEffect, useRef } from 'react';

import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Sticky action bar (buttons). */
  footer?: ReactNode;
  width?: 'md' | 'lg';
}

/** Right-side panel for create/edit, so the list behind it stays in view. */
export function Drawer({ open, onClose, title, description, children, footer, width = 'md' }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Parents usually pass a new onClose function on every render. Keeping it in a ref means
  // the effect below runs only when the drawer opens/closes, not on every parent re-render
  // (which would steal focus back to the first field while the user is typing).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Focus the first form control, or the panel itself.
    const frame = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea');
      (first ?? panelRef.current)?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-teal-900/30 animate-fade-in" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex h-full w-full flex-col bg-paper outline-none animate-drawer-in ${width === 'lg' ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border bg-white px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            {description && <p className="text-sm text-ink/50 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/50 hover:bg-paper hover:text-ink outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label="বন্ধ করুন"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-border bg-white px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
