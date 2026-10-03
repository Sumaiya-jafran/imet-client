import { apiClient } from './client';
import type {
  CatalogueResult,
  MachineCategory,
  MachineDetail,
} from '@/types/catalogue';
export const catalogueApi = {
  async list(query: URLSearchParams) {
    const response = await apiClient.get<CatalogueResult>(
      `/catalogue/machines?${query}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!response.data) throw new Error('Catalogue data unavailable');
    return response.data;
  },
  async categories() {
    const response = await apiClient.get<MachineCategory[]>(
      '/catalogue/categories',
      { signal: AbortSignal.timeout(10000) },
    );
    if (!response.data) throw new Error('Categories unavailable');
    return response.data;
  },
  async detail(slug: string) {
    const response = await apiClient.get<MachineDetail>(
      `/catalogue/machines/${encodeURIComponent(slug)}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!response.data) throw new Error('Machine unavailable');
    return response.data;
  },
};
