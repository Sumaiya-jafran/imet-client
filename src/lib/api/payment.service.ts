import { apiClient } from './client';
import type { Payment, Onboarding, AdminPayment } from '@/types/payment';
import type {
  SupplierProfile,
  SupplierProfileInput,
  SupplierRegistrationInput,
} from '@/types/supplier';
const options = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
  signal: AbortSignal.timeout(25000),
});
export const paymentApi = {
  register: (
    account: { displayName: string; email: string; password: string },
    profile: SupplierRegistrationInput,
    planId: string,
    files?: { logo?: File; document?: File },
    paymentMethod?: string,
  ) => {
    const data = { ...account, profile, planId, paymentMethod };
    if (!files?.logo && !files?.document)
      return apiClient.post('/auth/register-supplier', data, {
        signal: AbortSignal.timeout(25000),
      });
    const body = new FormData();
    body.set('data', JSON.stringify(data));
    if (files.logo) body.set('logo', files.logo);
    if (files.document) body.set('document', files.document);
    return apiClient.request('/auth/register-supplier', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(180000),
    });
  },
  activateFree: (token: string, planId: string) =>
    apiClient.post('/payments/activate-free', { planId }, options(token)),
  onboarding: (token: string) =>
    apiClient.get<Onboarding>('/payments/onboarding', options(token)),
  profile: (
    token: string,
    body: SupplierProfileInput,
    supplier: SupplierProfile,
  ) =>
    apiClient.request('/payments/onboarding', {
      ...options(token),
      method: 'PATCH',
      body: JSON.stringify({ ...body, updatedAt: supplier.updatedAt }),
    }),
  checkout: (token: string, planId: string, idempotencyKey: string) =>
    apiClient.post<Payment>(
      '/payments/checkout',
      { planId, idempotencyKey },
      options(token),
    ),
  get: (token: string, id: string) =>
    apiClient.get<Payment>(`/payments/${id}`, options(token)),
  reconcile: (token: string, id: string) =>
    apiClient.post<Payment>(`/payments/${id}/reconcile`, {}, options(token)),
  history: (token: string, supplierId: string) =>
    apiClient.get<AdminPayment[]>(
      `/admin/suppliers/${supplierId}/payments`,
      options(token),
    ),
  manual: (
    token: string,
    supplier: SupplierProfile,
    body: {
      planId: string;
      startsAt: string;
      endsAt: string;
      reason: string;
      confirmed: true;
    },
  ) => {
    const term = supplier.subscriptions.find((t) => t.isCurrent);
    return apiClient.post(
      `/admin/suppliers/${supplier.id}/activate`,
      {
        ...body,
        updatedAt: supplier.updatedAt,
        expectedCurrentId: term?.id ?? null,
        expectedCurrentUpdatedAt: term?.updatedAt ?? null,
      },
      options(token),
    );
  },
};
