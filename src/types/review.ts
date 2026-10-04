import type { Pagination } from './sales';
export type ReviewTarget = 'MACHINERY' | 'SUPPLIER';
export type ReviewStatus =
  'PENDING' | 'PUBLISHED' | 'REJECTED' | 'HIDDEN' | 'WITHDRAWN';
export interface PublicReview {
  id: string;
  target: ReviewTarget;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { displayName: string };
  machine: { id: string; name: string; slug: string } | null;
  supplier: { id: string; companyName: string } | null;
}
export interface Review extends PublicReview {
  saleId: string;
  status: ReviewStatus;
  moderationNote: string | null;
  sale: {
    id: string;
    opportunity: { recipient: { rfq: { title: string; rfqNumber: string } } };
  };
}
export interface ReviewList {
  reviews: Review[];
  pagination: Pagination;
}
export interface PublicReviewsResult {
  reviews: PublicReview[];
  summary: {
    average: number | null;
    count: number;
    distribution: Record<string, number>;
  };
  pagination: Pagination;
}
export interface ReviewEligibility {
  saleId: string;
  eligible: boolean;
  reason: string | null;
  targets: { target: ReviewTarget; id: string; name: string }[];
  reviews: Review[];
}
