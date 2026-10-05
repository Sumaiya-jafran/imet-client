import { apiClient } from './client';
import type {
  TicketDetail,
  TicketList,
  TicketHistory,
  EligiblePurchases,
  TicketCandidate,
} from '@/types/serviceTicket';
import type { ServiceTicketFormValues } from '@/lib/schema-validations/serviceTicket.schema';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
const mutate = (token: string, path: string, body: unknown, method = 'PATCH') =>
  apiClient.request(path, {
    method,
    headers: headers(token),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
export const serviceTicketApi = {
  eligible: (token: string, query: URLSearchParams, signal?: AbortSignal) =>
    apiClient.get<EligiblePurchases>(
      `/service-tickets/eligible-purchases?${query}`,
      { headers: headers(token), signal },
    ),
  create: (
    token: string,
    input: ServiceTicketFormValues & { customerRequestId: string },
  ) =>
    apiClient.post<{ id: string; reference: string }>(
      '/service-tickets',
      input,
      { headers: headers(token), signal: AbortSignal.timeout(15000) },
    ),
  list: (
    token: string,
    q: URLSearchParams,
    admin = false,
    signal?: AbortSignal,
  ) =>
    apiClient.get<TicketList>(`${admin ? '/admin' : ''}/service-tickets?${q}`, {
      headers: headers(token),
      signal,
    }),
  detail: (token: string, id: string, signal?: AbortSignal) =>
    apiClient.get<TicketDetail>(`/service-tickets/${id}`, {
      headers: headers(token),
      signal,
    }),
  history: (token: string, id: string, page = 1, signal?: AbortSignal) =>
    apiClient.get<TicketHistory>(
      `/service-tickets/${id}/events?page=${page}&limit=20`,
      { headers: headers(token), signal },
    ),
  candidates: (token: string, id: string) =>
    apiClient.get<{ candidates: TicketCandidate[] }>(
      `/admin/service-tickets/${id}/assignees`,
      { headers: headers(token) },
    ),
  note: (
    token: string,
    t: TicketDetail,
    input: { note: string; visibility: 'PUBLIC' | 'INTERNAL' },
  ) =>
    mutate(
      token,
      `/service-tickets/${t.id}/notes`,
      { updatedAt: t.updatedAt, ...input },
      'POST',
    ),
  status: (
    token: string,
    t: TicketDetail,
    status: 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
    note?: string,
  ) =>
    mutate(token, `/service-tickets/${t.id}/status`, {
      updatedAt: t.updatedAt,
      status,
      ...(note
        ? status === 'RESOLVED'
          ? { resolution: note }
          : { note }
        : {}),
    }),
  assign: (token: string, t: TicketDetail, assignedToId: string) =>
    mutate(token, `/admin/service-tickets/${t.id}/assignment`, {
      updatedAt: t.updatedAt,
      assignedToId,
    }),
  warranty: (
    token: string,
    t: TicketDetail,
    assessment: 'APPROVED' | 'DECLINED',
    note: string,
  ) =>
    mutate(token, `/admin/service-tickets/${t.id}/warranty`, {
      updatedAt: t.updatedAt,
      assessment,
      note,
    }),
};
