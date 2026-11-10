import type { Pagination } from '@/types/api';
import { apiClient } from './client';
import type { MachineInput } from '@/lib/schema-validations/catalogue.schema';
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  updatedAt?: string;
  parentId?: string | null;
  _count?: { machines: number };
}
export interface AdminMachine extends MachineInput {
  supplierId: string | null;
  supplier?: { id: string; companyName: string } | null;
  id: string;
  updatedAt: string;
}
export interface AdminCatalogueResult {
  activeCount?: number;
  machines: {
    id: string;
    name: string;
    slug: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    supplier?: { id: string; companyName: string; status: string } | null;
    updatedAt: string;
    category: { name: string };
  }[];
  pagination: Pagination;
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
  save: (
    token: string,
    data: MachineInput,
    machine?: AdminMachine,
    supplierId?: string | null,
  ) =>
    apiClient.request<AdminMachine>(
      `/admin/catalogue/machines${machine ? `/${machine.id}` : ''}`,
      {
        method: machine ? 'PUT' : 'POST',
        headers: headers(token),
        body: JSON.stringify({
          ...data,
          ...(supplierId !== undefined ? { supplierId } : {}),
          ...(machine ? { updatedAt: machine.updatedAt } : {}),
        }),
      },
    ),
  status: (
    token: string,
    id: string,
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    updatedAt: string,
  ) =>
    apiClient.request(`/admin/catalogue/machines/${id}/status`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ status, updatedAt }),
    }),
  remove: (token: string, id: string, updatedAt: string) =>
    apiClient.request(`/admin/catalogue/machines/${id}`, {
      method: 'DELETE',
      headers: headers(token),
      body: JSON.stringify({ updatedAt }),
    }),
  saveCategory: (
    token: string,
    data: { name: string; slug: string; parentId?: string | null },
    category?: AdminCategory,
  ) =>
    apiClient.request<AdminCategory>(
      `/admin/catalogue/categories${category ? `/${category.id}` : ''}`,
      {
        method: category ? 'PUT' : 'POST',
        headers: headers(token),
        body: JSON.stringify({
          ...data,
          ...(category ? { updatedAt: category.updatedAt } : {}),
        }),
      },
    ),
  removeCategory: (token: string, id: string) =>
    apiClient.request(`/admin/catalogue/categories/${id}`, {
      method: 'DELETE',
      headers: headers(token),
    }),
};
