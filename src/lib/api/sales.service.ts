import { apiClient } from './client';
import type {
  PipelineResult,
  SalesHistory,
  SalesDetail,
  SaleRecord,
} from '@/types/sales';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
const mutate = (token: string, path: string, body: unknown, method = 'PATCH') =>
  apiClient.request(path, {
    method,
    headers: headers(token),
    body: JSON.stringify(body),
  });
export const salesApi = {
  pipeline: (token: string, query: URLSearchParams, admin = false) =>
    apiClient.get<PipelineResult>(
      `${admin ? '/admin' : ''}/sales/opportunities?${query}`,
      { headers: headers(token) },
    ),
  detail: (token: string, id: string) =>
    apiClient.get<SalesDetail>(`/sales/opportunities/${id}`, {
      headers: headers(token),
    }),
  update: (
    token: string,
    id: string,
    body: {
      updatedAt: string;
      stage?: 'QUALIFIED' | 'NEGOTIATION';
      internalNotes?: string;
    },
  ) => mutate(token, `/sales/opportunities/${id}`, body),
  record: (token: string, id: string, updatedAt: string) =>
    mutate(
      token,
      `/sales/opportunities/${id}/record-sale`,
      { updatedAt },
      'POST',
    ),
  history: (token: string, query: URLSearchParams, admin = false) =>
    apiClient.get<SalesHistory>(
      `${admin ? '/admin' : ''}/sales/records?${query}`,
      { headers: headers(token) },
    ),
  sale: (token: string, id: string) =>
    apiClient.get<SaleRecord>(`/sales/records/${id}`, {
      headers: headers(token),
    }),
  saleUpdate: (
    token: string,
    s: SaleRecord,
    status: 'COMPLETED' | 'CANCELLED',
    reason?: string,
  ) =>
    mutate(token, `/sales/records/${s.id}`, {
      updatedAt: s.updatedAt,
      status,
      ...(reason ? { reason } : {}),
    }),
};
