export type SupplierType = 'LOCAL' | 'INTERNATIONAL';
export type SupplierStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'INACTIVE';
export interface SupplierProfileInput {
  companyName: string;
  type: SupplierType;
  description: string;
  contactName: string;
  businessEmail: string;
  businessPhone: string;
  address: string;
  city: string;
  country: string;
  registrationNumber: string | null;
  website: string | null;
  logoUrl: string | null;
  documents: { name: string; url: string }[];
}
export interface PlanInput {
  name: string;
  eligibleTypes: SupplierType[];
  durationDays: number;
  price: string;
  currency: string;
  listingLimit: number;
  imageLimit: number;
  specificationLimit: number;
  canPublishMachinery: boolean;
  visibility: 'HIDDEN' | 'STANDARD' | 'FEATURED';
  isActive: boolean;
}
export interface SubscriptionPlan extends PlanInput {
  id: string;
  updatedAt: string;
}
export interface SupplierSubscription {
  id: string;
  planId: string;
  planName: string;
  isCurrent: boolean;
  state: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  effectiveStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  startsAt: string;
  endsAt: string;
  updatedAt: string;
  price: string;
  currency: string;
  listingLimit: number;
  imageLimit: number;
  specificationLimit: number;
  canPublishMachinery: boolean;
  visibility: 'HIDDEN' | 'STANDARD' | 'FEATURED';
}
export interface SupplierProfile extends SupplierProfileInput {
  id: string;
  status: SupplierStatus;
  isVerified: boolean;
  marketplaceVisible: boolean;
  reviewNote: string | null;
  updatedAt: string;
  subscriptions: SupplierSubscription[];
}
export interface PublicSupplier {
  id: string;
  companyName: string;
  type: SupplierType;
  description: string;
  city: string;
  country: string;
  website: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  visibility: 'STANDARD' | 'FEATURED';
}
export interface SupplierList {
  suppliers: SupplierProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
