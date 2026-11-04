// Primary call to action used across public pages and dashboards.
export const QUOTE_HREF = '/dashboard/rfqs/new';
export const quoteHref = (machineSlug?: string) =>
  machineSlug
    ? `${QUOTE_HREF}?${new URLSearchParams({ machine: machineSlug })}`
    : QUOTE_HREF;
