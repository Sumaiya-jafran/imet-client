export type RfqStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ROUTED'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DECLINED';
export type LeadStatus = 'NEW' | 'VIEWED' | 'QUOTED' | 'DECLINED' | 'CLOSED';
export interface RfqInput {
  machineId: string | null;
  categoryId: string | null;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  targetBudget: string | null;
  budgetCurrency: string | null;
  deliveryLocation: string;
  deliveryTimeline: string;
  supplierCountry: string | null;
  preferredLanguage: 'en' | 'bn' | 'zh';
}
export interface QuoteInput {
  unitPrice: string;
  currency: string;
  moq: string;
  leadTimeDays: number;
  validUntil: string;
  notes: string;
}
export interface RfqAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}
export interface RfqQuote extends QuoteInput {
  id: string;
  rfqId: string;
  recipientId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  updatedAt: string;
  createdAt: string;
  attachments: RfqAttachment[];
  rfq?: { id: string; rfqNumber: string; title: string; status: RfqStatus };
}
export interface RfqRecipient {
  id: string;
  recipientId: string;
  recipientRole: 'SUPPLIER' | 'MANUFACTURER' | 'SALESPERSON' | 'SELLER';
  leadStatus: LeadStatus;
  name: string;
  isVerified: boolean;
  removedAt: string | null;
  quotes: RfqQuote[];
  contact: {
    contactName: string;
    email: string;
    phone: string;
    address: string;
  } | null;
  buyerContact: { email: string } | null;
}
export interface RfqDetail extends Omit<
  RfqInput,
  'targetBudget' | 'budgetCurrency'
> {
  id: string;
  rfqNumber: string;
  buyerId: string;
  buyer: { displayName: string };
  status: RfqStatus;
  updatedAt: string;
  createdAt: string;
  expiresAt: string | null;
  isFlagged: boolean;
  flagReason: string | null;
  targetBudget?: string | null;
  budgetCurrency?: string | null;
  machine: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string } | null;
  attachments: RfqAttachment[];
  recipients: RfqRecipient[];
  events: {
    id: string;
    eventType: string;
    createdAt: string;
    actorId?: string | null;
    metadata?: unknown;
  }[];
}
export interface RfqList {
  rfqs: {
    id: string;
    rfqNumber: string;
    title: string;
    status: RfqStatus;
    updatedAt: string;
    createdAt: string;
    expiresAt: string | null;
    category: { id: string; name: string } | null;
    recipients?: { id: string; leadStatus: LeadStatus }[];
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface RfqMessage {
  id: string;
  senderId: string;
  sender: { displayName: string };
  body: string;
  createdAt: string;
  readAt: string | null;
}
export interface LeadOverview {
  id: string;
  companyName: string;
  totalLeads: number;
  responses: number;
  responseRate: number;
  monthlyUsage: number;
  leadLimitPerMonth: number | null;
  rfqEnabled: boolean;
}
