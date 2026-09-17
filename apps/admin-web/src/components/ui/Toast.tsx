import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastTone = 'success' | 'error';
interface ToastItem { id: number; tone: ToastTone; message: string }

const ToastContext = createContext<(tone: ToastTone, message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = (id: number) => setToasts((all) => all.filter((t) => t.id !== id));

  const show = useCallback((tone: ToastTone, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all, { id, tone, message }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* Top centre: clear of drawer footers (primary buttons), the drawer close button and the sidebar. */}
      <div className="no-print fixed top-4 left-1/2 z-[60] flex w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm animate-fade-in ${
              t.tone === 'success' ? 'border-teal-100 bg-teal-50 text-teal-800' : 'border-danger-100 bg-danger-50 text-danger-700'
            }`}
          >
            {t.tone === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="বন্ধ করুন" className="opacity-60 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
