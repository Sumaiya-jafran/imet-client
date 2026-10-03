import { apiClient } from './client';
import type { HealthData } from '@/types/api';
export const healthService = {
  check: (signal?: AbortSignal) =>
    apiClient.get<HealthData>('/health', { signal }),
};
