import type { Pagination } from './api';
import type { MachineryMedia } from './media';
export interface MachineCategory {
  name: string;
  slug: string;
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
  supplier?: {
    id: string;
    slug?: string;
    companyName: string;
    isVerified: boolean;
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
