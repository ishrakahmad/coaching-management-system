import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // error already surfaced via context
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-teal-900 text-paper p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-teal-800/60" />
        <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-amber-400/10" />
        <div className="relative z-10">
          <div className="font-display text-2xl font-semibold tracking-tight">
            শিক্ষা<span className="text-amber-400">সেবা</span>
          </div>
          <p className="mt-2 text-teal-100 text-sm">Coaching Management System</p>
        </div>
        <div className="relative z-10 space-y-6">
          <p className="font-display text-3xl leading-snug max-w-md">
            প্রতিটা ব্যাচ, প্রতিটা ছাত্র, প্রতিটা টাকার হিসাব — এক জায়গায়।
          </p>
          <div className="flex gap-8 pt-4 border-t border-teal-700/60 text-sm text-teal-200">
            <div>
              <div className="text-amber-400 font-display text-xl">01</div>
              Admission থেকে Result — পুরো cycle track করুন
            </div>
            <div>
              <div className="text-amber-400 font-display text-xl">02</div>
              Fee due, attendance — সব এক dashboard-এ
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-paper">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 font-display text-xl font-semibold text-teal-800">
            শিক্ষা<span className="text-amber-500">সেবা</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">সাইন ইন করুন</h1>
          <p className="mt-1 text-sm text-ink/60">আপনার institute account দিয়ে লগইন করুন</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">ইমেইল</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@democoaching.com"
                className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1.5">পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-teal-800 text-paper font-medium py-2.5 text-sm hover:bg-teal-900 transition disabled:opacity-60"
            >
              {isLoading ? 'সাইন ইন হচ্ছে...' : 'সাইন ইন'}
            </button>
          </form>

          <p className="mt-6 text-xs text-ink/40">
            Demo: admin@democoaching.com / Admin@123 (seed script চালানোর পর)
          </p>
        </div>
      </div>
    </div>
  );
}
