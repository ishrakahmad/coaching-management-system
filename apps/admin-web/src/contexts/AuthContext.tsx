import { createContext, useContext, useState, ReactNode } from 'react';
import { api, clearSession } from '../services/api';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  instituteId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'লগইন ব্যর্থ হয়েছে। ইমেইল/পাসওয়ার্ড আবার চেক করুন।',
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    // Revoke the refresh token on the server; clear locally even if that call fails.
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => {});
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
