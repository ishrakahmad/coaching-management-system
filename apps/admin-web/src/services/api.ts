import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({ baseURL: API_BASE_URL });

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Several requests can fail with 401 at the same moment (e.g. the dashboard
// fires three queries). They all wait for this one refresh call instead of
// each trying to refresh — which would trip the server's reuse detection.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refreshToken');
    refreshPromise = (
      refreshToken
        ? axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }).then(({ data }) => {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.accessToken as string;
          })
        : Promise.reject(new Error('No refresh token'))
    ).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;
    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    // Wrong password on the login page is a normal 401 — don't refresh or redirect.
    if (error.response?.status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      const accessToken = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (refreshError) {
      clearSession();
      if (window.location.pathname !== '/login') window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  },
);
