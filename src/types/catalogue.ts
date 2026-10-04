export interface MachineCategory {
  name: string;
  slug: string;
}
export interface MachineImage {
  url: string;
  alt: string;
}
export interface MachineSummary {
  supplier?: { id: string; companyName: string; isVerified: boolean } | null;
  id: string;
  name: string;
  slug: string;
  description: string;
  manufacturer: string;
  model: string;
  category: MachineCategory;
  images: MachineImage[];
}
export interface MachineDetail extends MachineSummary {
  specifications: { label: string; value: string }[];
}
export interface CatalogueResult {
  machines: MachineSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
