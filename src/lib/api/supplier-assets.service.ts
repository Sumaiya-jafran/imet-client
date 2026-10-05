import { apiClient } from './client';
import { config } from '@/config/env';
export const supplierAssetsApi = {
  status: (token: string) =>
    apiClient.get<{ configured: boolean }>('/supplier/assets/status', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    }),
  upload: (token: string, purpose: 'LOGO' | 'DOCUMENT', file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient.request<{
      assetId: string;
      url: string;
      fileName: string;
      fileType: string;
    }>(`/supplier/assets/${purpose}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
      signal: AbortSignal.timeout(30000),
    });
  },
  remove: (token: string, id: string) =>
    apiClient.request(`/supplier/assets/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    }),
  content: async (token: string, id: string, signal: AbortSignal) => {
    const response = await fetch(
      `${config.NEXT_PUBLIC_BACKEND_API_URL}/supplier/assets/${id}/content`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal,
        cache: 'no-store',
      },
    );
    if (!response.ok)
      throw new Error(
        'Private file unavailable. Retry or reload your session.',
      );
    return response.blob();
  },
};
