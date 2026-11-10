import type { Pagination } from './api';
import type { MachineryMedia } from './media';
export interface MachineCategory {
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: { name: string; slug: string } | null;
  children?: { name: string; slug: string }[];
}
// Minimal machine reference embedded in RFQs, sales and reviews.
export interface MachineRef {
  id: string;
  name: string;
  slug: string;
}
// Category as returned by option endpoints (includes the id).
export interface CategoryOption extends MachineCategory {
  id: string;
}
export interface MachineImage {
  url: string;
  alt: string;
}
export interface MachineSummary extends MachineRef {
  condition?: 'NEW' | 'USED' | 'REFURBISHED' | null;
  manufacturingYear?: number | null;
  countryOfOrigin?: string | null;
  pricingMode?: 'FIXED_PRICE' | 'CONTACT_FOR_PRICE';
  price?: string | null;
  currency?: string | null;
  minimumOrderQuantity?: number;
  warranty?: string | null;
  availability?: 'IN_STOCK' | 'MADE_TO_ORDER' | 'OUT_OF_STOCK';
  negotiable?: boolean;
  supplier?: {
    id: string;
    slug?: string;
    companyName: string;
    isVerified: boolean;
    city?: string;
    country?: string;
  } | null;
  description: string;
  manufacturer: string;
  model: string;
  category: MachineCategory;
  images: MachineImage[];
}
export interface MachineDetail extends MachineSummary {
  media?: MachineryMedia[];
  specifications: { id: string; label: string; value: string }[];
}
export interface CatalogueResult {
  machines: MachineSummary[];
  pagination: Pagination;
}
