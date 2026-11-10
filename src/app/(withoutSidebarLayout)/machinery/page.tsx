import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import MachineCard from '@/components/cards/MachineCard';
import { catalogueApi } from '@/lib/api/catalogue.service';
import { catalogueSearchSchema } from '@/lib/catalogue-search';
export const metadata = {
  title: 'Machinery marketplace | Machinmate',
  description:
    'Find machinery from approved suppliers. Compare fixed prices and contact eligible suppliers directly.',
};
export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const normalized = Object.fromEntries(
    Object.keys(catalogueSearchSchema.shape).map((k) => [
      k,
      raw[k] === '' ? undefined : raw[k],
    ]),
  );
  const parsed = catalogueSearchSchema.safeParse(normalized);
  if (!parsed.success)
    return (
      <EmptyState
        title="Check your catalogue filters"
        description={parsed.error.issues.map((i) => i.message).join(' ')}
      >
        <Link href="/machinery" className="underline">
          Reset filters
        </Link>
      </EmptyState>
    );
  const filters = parsed.data,
    query = new URLSearchParams({ limit: '12' });
  for (const [k, v] of Object.entries(filters))
    if (v !== undefined && v !== '') query.set(k, String(v));
  const [result, categories] = await Promise.all([
    catalogueApi.list(query),
    catalogueApi.categories(),
  ]);
  const href = (page: number) => {
    const q = new URLSearchParams(query);
    q.delete('limit');
    q.set('page', String(page));
    return `/machinery?${q}`;
  };
  const select = (
    name: keyof typeof filters,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <label className="min-w-0 text-nav font-medium">
      {label}
      <select
        name={name}
        defaultValue={String(filters[name] ?? '')}
        className="mt-1 w-full"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const text = (name: keyof typeof filters, label: string, max = 200) => (
    <label className="min-w-0 text-nav font-medium">
      {label}
      <input
        name={name}
        defaultValue={String(filters[name] ?? '')}
        maxLength={max}
        className="mt-1 w-full"
      />
    </label>
  );
  const roots = categories.filter((c) => !c.parentId),
    subs = categories.filter(
      (c) =>
        c.parentId &&
        (!filters.category || c.parent?.slug === filters.category),
    );
  return (
    <section>
      <PageHeader
        eyebrow="Machinery marketplace"
        title="Machines"
        description="Discover machinery from approved suppliers. Compare fixed prices or contact a supplier directly."
      />
      <form
        action="/machinery"
        className="surface my-6 grid min-w-0 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {filters.supplier && (
          <input type="hidden" name="supplier" value={filters.supplier} />
        )}
        {text('q', 'Search machinery', 100)}
        {select(
          'category',
          'Category',
          roots.map((c) => ({ value: c.slug, label: c.name })),
        )}
        {select(
          'subcategory',
          'Subcategory',
          subs.map((c) => ({
            value: c.slug,
            label: `${c.parent?.name ?? ''} / ${c.name}`,
          })),
        )}
        {text('brand', 'Brand / manufacturer')}
        {select('condition', 'Condition', [
          { value: 'NEW', label: 'New' },
          { value: 'USED', label: 'Used' },
          { value: 'REFURBISHED', label: 'Refurbished' },
        ])}
        {text('supplierName', 'Supplier name')}
        {text('country', 'Supplier country or city', 100)}
        {select('pricingMode', 'Pricing mode', [
          { value: 'FIXED_PRICE', label: 'Fixed price' },
          { value: 'CONTACT_FOR_PRICE', label: 'Contact for Price' },
        ])}
        {text('currency', 'Currency (ISO code)', 3)}
        {text('minPrice', 'Minimum fixed price', 17)}
        {text('maxPrice', 'Maximum fixed price', 17)}
        {select('sort', 'Sort', [
          { value: 'newest', label: 'Newest first' },
          { value: 'oldest', label: 'Oldest first' },
          { value: 'price_asc', label: 'Price: low to high' },
          { value: 'price_desc', label: 'Price: high to low' },
        ])}
        {text('specLabel', 'Specification label', 100)}
        {text('specValue', 'Specification contains', 500)}
        <p className="text-meta text-muted sm:col-span-2">
          Price ranges and price sorting require a currency and include
          fixed-price listings only. Contact prices are never used for those
          comparisons.
        </p>
        <button className="rounded bg-accent px-4 py-2 font-semibold text-foreground">
          Apply filters
        </button>
        <Link
          href="/machinery"
          className="self-center font-semibold text-secondary underline"
        >
          Clear filters
        </Link>
      </form>
      <p role="status" className="mb-4 text-nav">
        {result.pagination.total} publicly available machines
      </p>
      {result.machines.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No machines found"
          description="Try different filters or return to the first page."
        >
          <Link className="underline" href={href(1)}>
            First page with these filters
          </Link>
        </EmptyState>
      )}
      <nav
        aria-label="Catalogue pagination"
        className="mt-6 flex flex-wrap items-center justify-between gap-4"
      >
        {filters.page > 1 && (
          <Link className="underline" rel="prev" href={href(filters.page - 1)}>
            Previous
          </Link>
        )}
        <span>
          Page {filters.page} of {Math.max(1, result.pagination.totalPages)}
        </span>
        {filters.page < result.pagination.totalPages && (
          <Link className="underline" rel="next" href={href(filters.page + 1)}>
            Next
          </Link>
        )}
      </nav>
    </section>
  );
}
