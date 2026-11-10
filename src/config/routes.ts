// Shared public catalogue and direct contact destinations.
export const MACHINERY_HREF = '/machinery';
export const machineContactHref = (slug?: string) =>
  slug
    ? `/machinery/${encodeURIComponent(slug)}#contact-supplier`
    : MACHINERY_HREF;
