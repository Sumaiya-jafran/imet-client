// Compatibility aliases for retired RFQ callers; direct buyers to the catalogue.
export const QUOTE_HREF = '/machinery';
export const quoteHref = (slug?: string) =>
  slug ? `/machinery/${encodeURIComponent(slug)}#contact-supplier` : QUOTE_HREF;
