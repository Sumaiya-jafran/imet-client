import { apiClient } from './client';
import type { Payment, Onboarding, AdminPayment } from '@/types/payment';
import type { SupplierProfile, SupplierProfileInput } from '@/types/supplier';
const options = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
  signal: AbortSignal.timeout(25000),
});
export const paymentApi = {
  register: (
    account: { displayName: string; email: string; password: string },
    profile: SupplierProfileInput,
    planId: string,
  ) =>
    apiClient.post(
      '/auth/register-supplier',
      { ...account, profile, planId },
      { signal: AbortSignal.timeout(25000) },
    ),
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
