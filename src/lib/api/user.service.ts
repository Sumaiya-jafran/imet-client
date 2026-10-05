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
export const userService = {
  list: (token: string, page = 1) =>
    apiClient.get<{
      users: CurrentUser[];
      page: number;
      limit: number;
      total: number;
    }>(`/user?page=${page}`, { headers: { Authorization: `Bearer ${token}` } }),
  update: (
    token: string,
    id: string,
    body: { status?: CurrentUser['status']; roles?: CurrentUser['roles'] },
  ) =>
    apiClient.request<CurrentUser>(`/user/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token}` },
    }),
  profile: (token: string, displayName: string) =>
    apiClient.request<CurrentUser>('/user/me', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
      headers: { Authorization: `Bearer ${token}` },
    }),
};
