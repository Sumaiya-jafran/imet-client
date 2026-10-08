import type { SupplierProfile, SubscriptionPlan } from './supplier';
export type PaymentStatus =
  'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REVIEW';
export interface Payment {
  id: string;
  transactionId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  gatewayUrl: string | null;
  createdAt: string;
  paidAt: string | null;
  reviewReason: string | null;
  planId: string;
  planName: string;
  supplierId: string;
  companyName: string;
  subscriptionStatus: string;
  startsAt: string;
  endsAt: string;
  activationMethod: 'PAYMENT' | 'ADMIN_MANUAL' | null;
}
export interface Onboarding {
  supplier: SupplierProfile;
  plans: SubscriptionPlan[];
  payments: Payment[];
  onlineAvailable: boolean;
  currencies: string[];
}
export interface AdminPayment {
  id: string;
  transactionId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  gatewayStatus: string | null;
  validationId: string | null;
  riskLevel: string | null;
  reviewReason: string | null;
  createdAt: string;
  paidAt: string | null;
  subscription: { planName: string };
}
