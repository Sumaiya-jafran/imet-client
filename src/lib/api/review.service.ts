import { apiClient } from './client';
import type {
  Review,
  ReviewList,
  ReviewEligibility,
  ReviewTarget,
  PublicReview,
  PublicReviewsResult,
} from '@/types/review';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
export const reviewApi = {
  public: (target: ReviewTarget, targetId: string, page = 1) =>
    apiClient.get<PublicReviewsResult>(
      `/reviews/public?${new URLSearchParams({ target, targetId, page: String(page), limit: '5' })}`,
      { signal: AbortSignal.timeout(10000) },
    ),
  highlights: () =>
    apiClient.get<PublicReview[]>('/reviews/highlights?limit=3', {
      signal: AbortSignal.timeout(10000),
    }),
  eligibility: (token: string, saleId: string) =>
    apiClient.get<ReviewEligibility>(`/reviews/eligibility/${saleId}`, {
      headers: headers(token),
    }),
  list: (token: string, q: URLSearchParams, admin = false) =>
    apiClient.get<ReviewList>(`${admin ? '/admin' : ''}/reviews?${q}`, {
      headers: headers(token),
    }),
  create: (
    token: string,
    saleId: string,
    target: ReviewTarget,
    data: { rating: number; body: string },
  ) =>
    apiClient.post<Review>(
      '/reviews',
      { saleId, target, ...data },
      { headers: headers(token) },
    ),
  update: (token: string, r: Review, data: { rating: number; body: string }) =>
    apiClient.request<Review>(`/reviews/${r.id}`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ ...data, updatedAt: r.updatedAt }),
    }),
  withdraw: (token: string, r: Review) =>
    apiClient.post<Review>(
      `/reviews/${r.id}/withdraw`,
      { updatedAt: r.updatedAt },
      { headers: headers(token) },
    ),
  moderate: (
    token: string,
    r: Review,
    status: 'PUBLISHED' | 'REJECTED' | 'HIDDEN',
    note: string,
  ) =>
    apiClient.request<Review>(`/admin/reviews/${r.id}`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ updatedAt: r.updatedAt, status, note }),
    }),
};
