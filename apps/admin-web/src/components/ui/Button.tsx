import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-teal-800 text-paper hover:bg-teal-900 border border-teal-800',
  secondary: 'bg-white text-ink border border-border hover:border-teal-300 hover:bg-teal-50/40',
  danger: 'bg-white text-danger-600 border border-danger-100 hover:bg-danger-50',
  ghost: 'bg-transparent text-teal-700 border border-transparent hover:bg-teal-50',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, disabled, className = '', children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
      } ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
