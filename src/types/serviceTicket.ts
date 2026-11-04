import type { Pagination } from './api';
export type TicketStatus =
  'OPEN' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export interface TicketMachine {
  id: string;
  name: string;
  slug: string;
  model: string;
  manufacturer: string;
}
export interface TicketSummary {
  id: string;
  reference: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  warrantyAssessment: 'NOT_REQUESTED' | 'PENDING' | 'APPROVED' | 'DECLINED';
  machine: TicketMachine;
  customer: { id: string; displayName: string };
  assignedTo: { id: string; displayName: string } | null;
}
export interface TicketDetail extends TicketSummary {
  saleId: string;
  description: string;
  resolution: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  warrantyNote: string | null;
  warrantyReviewedAt: string | null;
  permissions: {
    canComment: boolean;
    canInternalNote: boolean;
    canReview: boolean;
    canAssign: boolean;
    canStart: boolean;
    canResolve: boolean;
    canClose: boolean;
    canAssessWarranty: boolean;
    readOnlyReason: string;
  };
}
export interface TicketEvent {
  id: string;
  type: string;
  visibility: 'PUBLIC' | 'INTERNAL';
  note: string | null;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus | null;
  createdAt: string;
  actor: { displayName: string };
  assignedTo: { displayName: string } | null;
}
export interface TicketList {
  tickets: TicketSummary[];
  pagination: Pagination;
}
export interface TicketHistory {
  events: TicketEvent[];
  pagination: Pagination;
}
export interface EligiblePurchases {
  purchases: {
    saleId: string;
    completedAt: string | null;
    machine: TicketMachine | null;
  }[];
  pagination: Pagination;
}
export interface TicketCandidate {
  id: string;
  displayName: string;
  supplier: { companyName: string } | null;
  eligible: boolean;
  reason: string;
}
