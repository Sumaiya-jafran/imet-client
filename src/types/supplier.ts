import type { PaymentRegion } from '@/config/payment-regions';
import type { Pagination } from './api';
export type SupplierType = 'LOCAL' | 'INTERNATIONAL';
export const supplierTypeLabels: Record<SupplierType, string> = {
  LOCAL: 'Local supplier / dealer',
  INTERNATIONAL: 'International manufacturer',
};
// Used where plans list which supplier types may subscribe.
export const supplierTypePluralLabels: Record<SupplierType, string> = {
  LOCAL: 'Local suppliers / dealers',
  INTERNATIONAL: 'International manufacturers',
};
export type SupplierStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'INACTIVE';
export interface SupplierProfileInput {
  slug?: string;
  companyName: string;
  type: SupplierType;
  description: string;
  contactName: string;
  businessEmail: string;
  businessPhone: string;
  address: string;
  city: string;
  country: string;
  paymentRegion?: PaymentRegion | null;
  registrationNumber: string | null;
  website: string | null;
  logoUrl: string | null;
  logoAssetId?: string | null;
  documents: { name: string; url: string; assetId?: string }[];
}
export interface SupplierRegistrationInput extends SupplierProfileInput {
  paymentRegion: PaymentRegion;
}
export type PlanVisibility = 'HIDDEN' | 'STANDARD' | 'FEATURED';
// Commercial terms shared by a plan and the subscription created from it.
export interface PlanEntitlements {
  description?: string;
  billingInterval?: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  sparePartsLimit?: number;
  serviceLimit?: number;
  featuredLimit?: number;
  hiddenPriceAllowed?: boolean;
  features?: string[];
  price: string;
  currency: string;
  listingLimit: number;
  imageLimit: number;
  specificationLimit: number;
  canPublishMachinery: boolean;
  rfqEnabled: boolean;
  leadLimitPerMonth: number | null;
  canRevealContacts: boolean;
  visibility: PlanVisibility;
}
export interface PlanInput extends PlanEntitlements {
  isFree?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
  name: string;
  eligibleTypes: SupplierType[];
  durationDays: number;
  isActive: boolean;
}
export interface SubscriptionPlan extends PlanInput {
  id: string;
  updatedAt: string;
}
export interface SupplierSubscription extends PlanEntitlements {
  selectedPaymentMethod?: string | null;
  id: string;
  planId: string;
  supplierType: SupplierType;
  planName: string;
  isCurrent: boolean;
  isScheduled?: boolean;
  state: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  activationMethod?: 'PAYMENT' | 'ADMIN_MANUAL' | null;
  activatedAt?: string | null;
  activatedById?: string | null;
  activationReason?: string | null;
  effectiveStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  startsAt: string;
  endsAt: string;
  updatedAt: string;
}
export interface SupplierProfile extends SupplierProfileInput {
  paymentRegion: PaymentRegion | null;
  slug: string;
  user?: { id: string; status: string; isEmailVerified: boolean };
  id: string;
  status: SupplierStatus;
  isVerified: boolean;
  marketplaceVisible: boolean;
  reviewNote: string | null;
  updatedAt: string;
  subscriptions: SupplierSubscription[];
}
export interface PublicSupplier {
  slug: string;
  id: string;
  companyName: string;
  type: SupplierType;
  description: string;
  city: string;
  country: string;
  website: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  visibility: Exclude<PlanVisibility, 'HIDDEN'>;
}
export interface SupplierList {
  suppliers: SupplierProfile[];
  pagination: Pagination;
}
