import { apiClient } from './client';
import { config } from '@/config/env';
export interface UploadedCatalogueImage {
  assetId: string;
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}
export const catalogueImageUrl = (path: string) =>
  /^\/catalogue\/images\/[0-9a-f-]{36}\/content$/.test(path)
    ? `${config.NEXT_PUBLIC_BACKEND_API_URL}${path}`
    : path;
export const catalogueImagesApi = {
  status: (token: string) =>
    apiClient.get<{ configured: boolean; maxBytes: number }>(
      '/admin/catalogue/image-uploads/status',
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      },
    ),
  upload: async (token: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient.request<UploadedCatalogueImage>(
      '/admin/catalogue/image-uploads',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
        signal: AbortSignal.timeout(30000),
      },
    );
  },
  remove: (token: string, id: string) =>
    apiClient.request(`/admin/catalogue/image-uploads/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    }),
  preview: async (token: string, id: string, signal: AbortSignal) => {
    const response = await fetch(
      `${config.NEXT_PUBLIC_BACKEND_API_URL}/admin/catalogue/image-uploads/${id}/preview`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal,
        cache: 'no-store',
      },
    );
    if (!response.ok) throw new Error('Image preview unavailable');
    return response.blob();
  },
};
