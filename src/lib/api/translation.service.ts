import { apiClient } from './client';
import type {
  Language,
  TranslationReference,
  TranslationResult,
  TranslationResources,
  TranslationDetail,
} from '@/types/translation';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
export const translationApi = {
  read: (resources: TranslationReference[], targetLanguage: Language) =>
    apiClient.post<TranslationResult[]>(
      '/translations/read',
      { resources, targetLanguage },
      { signal: AbortSignal.timeout(10000) },
    ),
  resources: (token: string, q: URLSearchParams) =>
    apiClient.get<TranslationResources>(`/admin/translations/resources?${q}`, {
      headers: headers(token),
    }),
  detail: (token: string, type: string, id: string) =>
    apiClient.get<TranslationDetail>(
      `/admin/translations/resources/${type}/${id}`,
      { headers: headers(token) },
    ),
  generate: (
    token: string,
    data: {
      resource: TranslationReference;
      sourceLanguage: Language;
      targetLanguage: Language;
      sourceHash: string;
      regenerate: boolean;
    },
  ) =>
    apiClient.post<TranslationResult>('/admin/translations/generate', data, {
      headers: headers(token),
      signal: AbortSignal.timeout(75000),
    }),
};
