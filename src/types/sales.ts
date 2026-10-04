import type { RfqStatus } from './rfq';
export type SalesStage =
  'NEW' | 'QUALIFIED' | 'QUOTED' | 'NEGOTIATION' | 'WON' | 'LOST';
export type SaleStatus = 'RECORDED' | 'COMPLETED' | 'CANCELLED';
export interface SalesRfq {
  id: string;
  rfqNumber: string;
  title: string;
  description: string;
  status: RfqStatus;
  quantity: string;
  unit: string;
  deliveryLocation: string;
  deliveryTimeline: string;
  expiresAt: string | null;
  isFlagged: boolean;
  buyer: { displayName: string };
  machine: { id: string; name: string; slug: string } | null;
}
export interface SalesQuote {
  id: string;
  status: string;
  unitPrice: string;
  currency: string;
  moq: string;
  leadTimeDays: number;
  validUntil: string;
  notes: string;
}
export interface SaleRecord {
  canEdit?: boolean;
  readOnlyReason?: string | null;
  id: string;
  opportunityId: string;
  status: SaleStatus;
  updatedAt: string;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  rfq: Pick<
    SalesRfq,
    | 'id'
    | 'rfqNumber'
    | 'title'
    | 'buyer'
    | 'quantity'
    | 'unit'
    | 'deliveryLocation'
    | 'deliveryTimeline'
  >;
  sellerName: string;
  quote: Omit<SalesQuote, 'status'>;
  totalAmount: string;
}
export interface SalesOpportunity {
  id: string;
  stage: SalesStage;
  updatedAt: string;
  createdAt: string;
  leadId: string;
  ownerId: string;
  ownerName: string;
  assignmentRemoved: boolean;
  rfq: SalesRfq;
  sale: { id: string; status: SaleStatus } | null;
}
export interface SalesDetail extends Omit<SalesOpportunity, 'sale'> {
  canEdit: boolean;
  readOnlyReason: string | null;
  internalNotes: string;
  quotes: SalesQuote[];
  events: {
    id: string;
    eventType: string;
    metadata: unknown;
    createdAt: string;
    actor: { displayName: string } | null;
  }[];
  sale: SaleRecord | null;
}
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface PipelineResult {
  opportunities: SalesOpportunity[];
  counts: Partial<Record<SalesStage, number>>;
  pagination: Pagination;
}
export interface SalesHistory {
  records: SaleRecord[];
  pagination: Pagination;
}
