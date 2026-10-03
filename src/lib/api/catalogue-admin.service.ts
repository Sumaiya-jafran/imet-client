import { apiClient } from './client';
import type { MachineInput } from '@/lib/schema-validations/catalogue.schema';
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  _count?: { machines: number };
}
export interface AdminMachine extends MachineInput {
  id: string;
  updatedAt: string;
}
export interface AdminCatalogueResult {
  machines: {
    id: string;
    name: string;
    slug: string;
    status: 'DRAFT' | 'PUBLISHED';
    updatedAt: string;
    category: { name: string };
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
export const catalogueAdminApi = {
  categories: (token: string, signal?: AbortSignal) =>
    apiClient.get<AdminCategory[]>('/admin/catalogue/categories', {
      headers: headers(token),
      signal,
    }),
  list: (token: string, query: URLSearchParams, signal?: AbortSignal) =>
    apiClient.get<AdminCatalogueResult>(`/admin/catalogue/machines?${query}`, {
      headers: headers(token),
      signal,
    }),
  detail: (token: string, id: string) =>
    apiClient.get<AdminMachine>(`/admin/catalogue/machines/${id}`, {
      headers: headers(token),
    }),
  save: (token: string, data: MachineInput, machine?: AdminMachine) =>
    apiClient.request<AdminMachine>(
      `/admin/catalogue/machines${machine ? `/${machine.id}` : ''}`,
      {
        method: machine ? 'PUT' : 'POST',
        headers: headers(token),
        body: JSON.stringify({
          ...data,
          ...(machine ? { updatedAt: machine.updatedAt } : {}),
        }),
      },
    ),
  remove: (token: string, id: string, updatedAt: string) =>
    apiClient.request(`/admin/catalogue/machines/${id}`, {
      method: 'DELETE',
      headers: headers(token),
      body: JSON.stringify({ updatedAt }),
    }),
  saveCategory: (
    token: string,
    data: { name: string; slug: string },
    id?: string,
  ) =>
    apiClient.request<AdminCategory>(
      `/admin/catalogue/categories${id ? `/${id}` : ''}`,
      {
        method: id ? 'PUT' : 'POST',
        headers: headers(token),
        body: JSON.stringify(data),
      },
    ),
  removeCategory: (token: string, id: string) =>
    apiClient.request(`/admin/catalogue/categories/${id}`, {
      method: 'DELETE',
      headers: headers(token),
    }),
};
