import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { z } from 'zod';
import { catalogueApi } from '@/lib/api/catalogue.service';
import MachineCard from '@/components/cards/MachineCard';
export const metadata = {
  title: 'Machinery catalogue | iMet Machinery',
  description:
    'Explore industrial machinery and technical specifications. Prices available on request.',
};
const filters = z.object({
  q: z.string().trim().max(100).default(''),
  supplier: z.uuid().optional(),
  category: z
    .string()
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = filters.safeParse({
    q: raw.q,
    category: raw.category || undefined,
    supplier: raw.supplier,
    page: raw.page,
  });
  if (!parsed.success)
    return (
      <EmptyState
        title="Check your catalogue filters"
        description="Use a search of up to 100 characters, a valid category or supplier, and a page number between 1 and 10,000."
      >
        <Link className="secondary-link" href="/machinery">
          Reset filters
        </Link>
      </EmptyState>
    );
  const { q, category, supplier, page } = parsed.data;
  const query = new URLSearchParams({ page: String(page), limit: '12' });
  if (supplier) query.set('supplier', supplier);
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  const [result, categoryResult] = await Promise.all([
    catalogueApi.list(query),
    catalogueApi.categories().then(
      (categories) => ({ categories, unavailable: false }),
      () => ({ categories: [], unavailable: true }),
    ),
  ]);
  const { categories, unavailable: categoriesUnavailable } = categoryResult;
  const outOfRange =
    page > result.pagination.totalPages && result.pagination.total > 0;
  const removeFilter = (key: string) => {
    const params = new URLSearchParams(query);
    params.delete('limit');
    params.delete('page');
    params.delete(key);
    return `/machinery?${params}`;
  };
  const href = (target: number) => {
    const params = new URLSearchParams(query);
    params.delete('limit');
    params.set('page', String(target));
    return `/machinery?${params}`;
  };
  return (
    <section>
      <PageHeader
        eyebrow="Equipment directory"
        title="Machinery catalogue"
        description="Find equipment for your next production line. Explore specifications and request a private quote."
        actions={
          <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-navy">
            Industrial equipment · Price on request
          </span>
        }
      />
      <form
        action="/machinery"
        className="filter-bar my-6 grid gap-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]"
      >
        {supplier && <input type="hidden" name="supplier" value={supplier} />}
        <label className="min-w-0 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Search size={15} aria-hidden="true" /> Search machinery
          </span>
          <input
            name="q"
            type="search"
            maxLength={100}
            defaultValue={q}
            placeholder="Name, manufacturer or model"
            className="mt-2 w-full rounded border border-slate-300 bg-white p-3"
          />
        </label>
        <label className="min-w-0 text-sm font-medium">
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={15} aria-hidden="true" /> Category
          </span>
          <select
            name="category"
            disabled={categoriesUnavailable}
            defaultValue={category || ''}
            className="mt-2 w-full rounded border border-slate-300 bg-white p-3"
          >
            <option value="">All categories</option>
            {category && !categories.some((c) => c.slug === category) && (
              <option value={category}>Unavailable category</option>
            )}
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="action-link self-end">Search</button>
        {categoriesUnavailable && category && (
          <input type="hidden" name="category" value={category} />
        )}
      </form>
      {categoriesUnavailable && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Category filters could not load. You can still search machinery.{' '}
          <Link className="font-semibold underline" href={href(page)}>
            Retry category filters
          </Link>
        </p>
      )}
      {(q || category || supplier) && (
        <div
          className="mb-5 flex flex-wrap gap-2"
          aria-label="Active catalogue filters"
        >
          {[
            q && { key: 'q', label: `Search: ${q}` },
            category && {
              key: 'category',
              label: `Category: ${categories.find((c) => c.slug === category)?.name || category}`,
            },
            supplier && { key: 'supplier', label: 'Selected supplier' },
          ]
            .filter((item) => !!item)
            .map((item) => (
              <Link
                key={item.key}
                href={removeFilter(item.key)}
                aria-label={`Remove ${item.label}`}
                className="flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:border-slate-400"
              >
                <span className="break-words [overflow-wrap:anywhere]">
                  {item.label}
                </span>
                <X size={14} className="shrink-0" aria-hidden="true" />
              </Link>
            ))}
        </div>
      )}
      <div className="mb-5 flex flex-wrap justify-between gap-3 text-xs text-slate-600">
        <p role="status">
          <span className="font-semibold text-navy">
            {result.pagination.total}{' '}
            {result.pagination.total === 1 ? 'machine' : 'machines'}
          </span>
          {result.machines.length > 0 && (
            <>
              {' '}
              · Showing {(page - 1) * 12 + 1}–
              {(page - 1) * 12 + result.machines.length}
            </>
          )}
        </p>
        <Link href="/machinery" className="underline">
          Clear filters
        </Link>
      </div>
      {result.machines.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            outOfRange ? 'This page has no machinery' : 'No machines found'
          }
          description={
            outOfRange
              ? 'The catalogue has changed or this page is beyond the available results. Return to the first page with your filters preserved.'
              : 'Try a different model, manufacturer or category. New machinery appears here when published.'
          }
        >
          <Link
            href={outOfRange ? href(1) : '/machinery'}
            className="secondary-link"
          >
            {outOfRange ? 'Return to first page' : 'Clear filters'}
          </Link>
        </EmptyState>
      )}
      {result.pagination.totalPages > 0 && !outOfRange && (
        <nav
          aria-label="Catalogue pagination"
          className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm"
        >
          {page > 1 && (
            <Link className="secondary-link" rel="prev" href={href(page - 1)}>
              <ArrowLeft size={15} aria-hidden="true" /> Previous
            </Link>
          )}
          <span className="text-xs text-slate-600">
            Page {page} of {result.pagination.totalPages}
          </span>
          {page < result.pagination.totalPages && (
            <Link className="secondary-link" rel="next" href={href(page + 1)}>
              Next <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
