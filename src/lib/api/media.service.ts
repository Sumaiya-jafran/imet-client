import { apiClient } from './client';
import { config } from '@/config/env';
import type { MachineryMedia } from '@/types/media';
export const mediaUrl = (id: string) =>
  `${config.NEXT_PUBLIC_BACKEND_API_URL}/catalogue/media/${encodeURIComponent(id)}/content`;
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
export const mediaApi = {
  list: (token: string, machineId: string, signal?: AbortSignal) =>
    apiClient.get<{ configured: boolean; media: MachineryMedia[] }>(
      `/catalogue/machines/${machineId}/media`,
      { headers: headers(token), signal },
    ),
  upload: (token: string, machineId: string, data: FormData) =>
    apiClient.request<MachineryMedia>(
      `/catalogue/machines/${machineId}/media`,
      {
        method: 'POST',
        headers: headers(token),
        body: data,
        signal: AbortSignal.timeout(60000),
      },
    ),
  remove: (token: string, id: string) =>
    apiClient.request(`/catalogue/media/${id}`, {
      method: 'DELETE',
      headers: headers(token),
      signal: AbortSignal.timeout(30000),
    }),
  preview: async (token: string, id: string) => {
    const r = await fetch(
      `${config.NEXT_PUBLIC_BACKEND_API_URL}/catalogue/media/${id}/preview`,
      {
        headers: headers(token),
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!r.ok) throw new Error('Media preview is unavailable');
    return r.blob();
  },
};
