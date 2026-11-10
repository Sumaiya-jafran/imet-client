import { apiClient } from './client';
import type { SalesHistory, SaleRecord } from '@/types/sales';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
export const salesApi = {
  history: (token: string, query: URLSearchParams, admin = false) =>
    apiClient.get<SalesHistory>(
      `${admin ? '/admin' : ''}/sales/records?${query}`,
      { headers: headers(token) },
    ),
  sale: (token: string, id: string) =>
    apiClient.get<SaleRecord>(`/sales/records/${id}`, {
      headers: headers(token),
    }),
};
