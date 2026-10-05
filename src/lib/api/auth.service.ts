import { apiClient as sharedApiClient } from './client';
const timed = (options: RequestInit = {}) => ({
  ...options,
  signal: options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
    : AbortSignal.timeout(15000),
});
const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    sharedApiClient.get<T>(path, timed(options)),
  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    sharedApiClient.post<T>(path, body, timed(options)),
  request: <T>(path: string, options?: RequestInit) =>
    sharedApiClient.request<T>(path, timed(options)),
};
import type { CurrentUser } from '@/types/auth';
export const authService = {
  register: (body: { email: string; displayName: string; password: string }) =>
    apiClient.post('/auth/register', body),
  verify: (token: string) => apiClient.post('/auth/verify-user', { token }),
  resend: (email: string) =>
    apiClient.post('/auth/resend-verification', { email }),
  forgot: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  reset: (body: { token: string; password: string; confirmPassword: string }) =>
    apiClient.post('/auth/reset-password', body),
  me: (token: string) =>
    apiClient.get<CurrentUser>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  change: (
    body: {
      currentPassword: string;
      password: string;
      confirmPassword: string;
    },
    token: string,
  ) =>
    apiClient.post('/auth/change-password', body, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  logout: (token: string, all = false) =>
    apiClient.post(
      all ? '/auth/logout-all' : '/auth/logout',
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    ),
};
