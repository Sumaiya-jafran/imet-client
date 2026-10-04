import { apiClient } from './client';
import { config } from '@/config/env';
import type {
  RfqDetail,
  RfqInput,
  RfqList,
  QuoteInput,
  RfqQuote,
  RfqAttachment,
  RfqMessage,
  LeadOverview,
} from '@/types/rfq';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
const mutation = <T>(
  token: string,
  path: string,
  body: unknown = {},
  method = 'POST',
) =>
  apiClient.request<T>(path, {
    method,
    headers: headers(token),
    body: JSON.stringify(body),
  });
export const rfqApi = {
  candidates: (token: string, q = '', buyers = false) =>
    apiClient.get<
      {
        id: string;
        displayName: string;
        supplier: { companyName: string } | null;
      }[]
    >(
      `/rfq-options/recipients?${new URLSearchParams({ q, kind: buyers ? 'buyer' : 'recipient' })}`,
      { headers: headers(token) },
    ),
  categories: (token: string) =>
    apiClient.get<{ id: string; name: string; slug: string }[]>(
      '/rfq-options/categories',
      { headers: headers(token) },
    ),
  list: (
    token: string,
    query: URLSearchParams,
    scope: 'buyer' | 'leads' | 'admin',
  ) =>
    apiClient.get<RfqList>(
      `${scope === 'buyer' ? '/rfqs' : scope === 'leads' ? '/leads' : '/admin/rfqs'}?${query}`,
      { headers: headers(token) },
    ),
  detail: (token: string, id: string, lead = false) =>
    apiClient.get<RfqDetail>(`/${lead ? 'leads' : 'rfqs'}/${id}`, {
      headers: headers(token),
    }),
  create: (token: string, input: RfqInput) =>
    mutation<Pick<RfqDetail, 'id'>>(token, '/rfqs', input),
  update: (token: string, rfq: RfqDetail, input: RfqInput) =>
    mutation<RfqDetail>(
      token,
      `/rfqs/${rfq.id}`,
      { ...input, updatedAt: rfq.updatedAt },
      'PATCH',
    ),
  action: (
    token: string,
    r: RfqDetail,
    action: 'submit' | 'cancel' | 'close',
  ) => mutation(token, `/rfqs/${r.id}/${action}`, { updatedAt: r.updatedAt }),
  viewed: (token: string, id: string) => mutation(token, `/leads/${id}/viewed`),
  decline: (token: string, id: string) =>
    mutation(token, `/leads/${id}/decline`),
  quote: (token: string, rfqId: string, body: QuoteInput, quote?: RfqQuote) =>
    mutation<RfqQuote>(
      token,
      quote ? `/quotes/${quote.id}` : `/rfqs/${rfqId}/quotes`,
      quote ? { ...body, updatedAt: quote.updatedAt } : body,
      quote ? 'PATCH' : 'POST',
    ),
  quoteAction: (
    token: string,
    q: RfqQuote,
    action: 'accept' | 'reject' | 'withdraw',
  ) => mutation(token, `/quotes/${q.id}/${action}`, { updatedAt: q.updatedAt }),
  quotes: (token: string, query = new URLSearchParams()) =>
    apiClient.get<{
      quotes: RfqQuote[];
      pagination: { page: number; totalPages: number; total: number };
    }>(`/quotes?${query}`, { headers: headers(token) }),
  messages: (token: string, rfqId: string, recipientId: string) =>
    apiClient.get<RfqMessage[]>(
      `/rfqs/${rfqId}/messages?${new URLSearchParams({ recipientId })}`,
      { headers: headers(token) },
    ),
  message: (token: string, rfqId: string, recipientId: string, body: string) =>
    mutation(token, `/rfqs/${rfqId}/messages`, { recipientId, body }),
  route: (token: string, r: RfqDetail, userIds: string[], remove = false) =>
    mutation(token, `/rfqs/${r.id}/recipients`, {
      updatedAt: r.updatedAt,
      userIds,
      action: remove ? 'REMOVE' : 'ADD',
    }),
  reroute: (token: string, r: RfqDetail) =>
    mutation(token, `/admin/rfqs/${r.id}/reroute`, { updatedAt: r.updatedAt }),
  flag: (
    token: string,
    r: RfqDetail,
    isFlagged: boolean,
    reason: string,
    blockSupplierContact: boolean,
  ) =>
    mutation(token, `/admin/rfqs/${r.id}/flag`, {
      updatedAt: r.updatedAt,
      isFlagged,
      reason,
      blockSupplierContact,
    }),
  resend: (token: string, r: RfqDetail) =>
    mutation(token, `/admin/rfqs/${r.id}/resend-notifications`, {
      updatedAt: r.updatedAt,
    }),
  overview: (token: string, query = new URLSearchParams()) =>
    apiClient.get<{
      suppliers: LeadOverview[];
      pagination: { page: number; totalPages: number; total: number };
    }>(`/admin/leads?${query}`, { headers: headers(token) }),
  upload: (token: string, id: string, file: File, quote = false) => {
    const body = new FormData();
    body.set('file', file);
    return apiClient.request<RfqAttachment>(
      `/${quote ? 'quotes' : 'rfqs'}/${id}/attachments`,
      { method: 'POST', headers: headers(token), body },
    );
  },
  async download(token: string, file: RfqAttachment, quote = false) {
    const response = await fetch(
      `${config.NEXT_PUBLIC_BACKEND_API_URL}/${quote ? 'quote-attachments' : 'rfq-attachments'}/${file.id}`,
      { headers: headers(token), cache: 'no-store' },
    );
    if (!response.ok) throw new Error('Unable to download attachment');
    const url = URL.createObjectURL(await response.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
