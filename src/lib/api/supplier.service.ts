import { apiClient } from './client';
import type {
  SupplierProfile,
  SupplierProfileInput,
  SubscriptionPlan,
  PlanInput,
  SupplierList,
  PublicSupplier,
  SupplierSubscription,
} from '@/types/supplier';
import type { MachineInput } from '@/lib/schema-validations/catalogue.schema';
import type {
  AdminMachine,
  AdminCategory,
  AdminCatalogueResult,
} from './catalogue-admin.service';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
const request = <T>(
  token: string,
  path: string,
  method: string,
  body: unknown,
) =>
  apiClient.request<T>(path, {
    method,
    headers: headers(token),
    body: JSON.stringify(body),
  });
export const supplierApi = {
  own: (token: string) =>
    apiClient.get<SupplierProfile | null>('/supplier/me', {
      headers: headers(token),
    }),
  apply: (token: string, body: SupplierProfileInput) =>
    request<SupplierProfile>(token, '/supplier/applications', 'POST', body),
  updateOwn: (
    token: string,
    body: SupplierProfileInput,
    supplier: SupplierProfile,
  ) =>
    request<SupplierProfile>(token, '/supplier/me', 'PUT', {
      description: body.description,
      contactName: body.contactName,
      businessEmail: body.businessEmail,
      businessPhone: body.businessPhone,
      website: body.website,
      logoUrl: body.logoUrl,
      updatedAt: supplier.updatedAt,
    }),
  plans: (token: string) =>
    apiClient.get<SubscriptionPlan[]>('/supplier/plans', {
      headers: headers(token),
    }),
  adminList: (token: string, query: URLSearchParams, signal?: AbortSignal) =>
    apiClient.get<SupplierList>(`/admin/suppliers?${query}`, {
      headers: headers(token),
      signal,
    }),
  adminDetail: (token: string, id: string) =>
    apiClient.get<SupplierProfile>(`/admin/suppliers/${id}`, {
      headers: headers(token),
    }),
  review: (
    token: string,
    supplier: SupplierProfile,
    body: Pick<
      SupplierProfile,
      'status' | 'isVerified' | 'marketplaceVisible' | 'reviewNote'
    >,
  ) =>
    request<SupplierProfile>(
      token,
      `/admin/suppliers/${supplier.id}/review`,
      'PATCH',
      { ...body, updatedAt: supplier.updatedAt },
    ),
  adminUpdate: (
    token: string,
    body: SupplierProfileInput,
    supplier: SupplierProfile,
  ) =>
    request<SupplierProfile>(token, `/admin/suppliers/${supplier.id}`, 'PUT', {
      ...body,
      updatedAt: supplier.updatedAt,
    }),
  adminPlans: (token: string) =>
    apiClient.get<SubscriptionPlan[]>('/admin/subscriptions/plans', {
      headers: headers(token),
    }),
  savePlan: (token: string, body: PlanInput, plan?: SubscriptionPlan) =>
    request<SubscriptionPlan>(
      token,
      `/admin/subscriptions/plans${plan ? `/${plan.id}` : ''}`,
      plan ? 'PUT' : 'POST',
      { ...body, ...(plan ? { updatedAt: plan.updatedAt } : {}) },
    ),
  assign: (
    token: string,
    supplierId: string,
    body: {
      planId: string;
      state: SupplierSubscription['state'];
      startsAt: string;
      endsAt: string;
    },
    current?: SupplierSubscription,
  ) =>
    request<SupplierSubscription>(
      token,
      `/admin/suppliers/${supplierId}/subscriptions`,
      'POST',
      {
        ...body,
        expectedCurrentId: current?.id ?? null,
        expectedCurrentUpdatedAt: current?.updatedAt ?? null,
      },
    ),
  updateTerm: (
    token: string,
    term: SupplierSubscription,
    body: {
      state: SupplierSubscription['state'];
      startsAt: string;
      endsAt: string;
    },
  ) =>
    request<SupplierSubscription>(
      token,
      `/admin/subscriptions/${term.id}`,
      'PUT',
      { ...body, updatedAt: term.updatedAt },
    ),
  publicList: (query: URLSearchParams) =>
    apiClient.get<{
      suppliers: PublicSupplier[];
      pagination: { page: number; totalPages: number; total: number };
    }>(`/suppliers?${query}`, { signal: AbortSignal.timeout(10000) }),
  publicDetail: (id: string) =>
    apiClient.get<PublicSupplier>(`/suppliers/${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(10000),
    }),
};
export const supplierCatalogueApi = {
  categories: (token: string, signal?: AbortSignal) =>
    apiClient.get<AdminCategory[]>('/supplier/catalogue/categories', {
      headers: headers(token),
      signal,
    }),
  list: (token: string, query: URLSearchParams, signal?: AbortSignal) =>
    apiClient.get<AdminCatalogueResult>(
      `/supplier/catalogue/machines?${query}`,
      { headers: headers(token), signal },
    ),
  detail: (token: string, id: string) =>
    apiClient.get<AdminMachine>(`/supplier/catalogue/machines/${id}`, {
      headers: headers(token),
    }),
  save: (token: string, data: MachineInput, machine?: AdminMachine) =>
    request<AdminMachine>(
      token,
      `/supplier/catalogue/machines${machine ? `/${machine.id}` : ''}`,
      machine ? 'PUT' : 'POST',
      { ...data, ...(machine ? { updatedAt: machine.updatedAt } : {}) },
    ),
  remove: (token: string, id: string, updatedAt: string) =>
    request(token, `/supplier/catalogue/machines/${id}`, 'DELETE', {
      updatedAt,
    }),
};
