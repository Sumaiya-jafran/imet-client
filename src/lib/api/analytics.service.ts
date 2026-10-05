import { apiClient } from './client';
import type { AnalyticsOverview, AuditList } from '@/types/analytics';
export const analyticsApi = {
  overview: (token: string, q: URLSearchParams, signal?: AbortSignal) =>
    apiClient.get<AnalyticsOverview>(`/admin/analytics/overview?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }),
  audit: (token: string, q: URLSearchParams, signal?: AbortSignal) =>
    apiClient.get<AuditList>(`/admin/audit-logs?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }),
};
