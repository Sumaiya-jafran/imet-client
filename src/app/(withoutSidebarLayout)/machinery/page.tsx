import Link from 'next/link';
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
      <section>
        <h1 className="text-3xl font-bold">Invalid catalogue filters</h1>
        <p className="mt-4">
          Use a search up to 100 characters and a valid page number.
        </p>
        <Link className="mt-4 inline-block underline" href="/machinery">
          Reset filters
        </Link>
      </section>
    );
  const { q, category, supplier, page } = parsed.data;
  const query = new URLSearchParams({ page: String(page), limit: '12' });
  if (supplier) query.set('supplier', supplier);
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  const [result, categories] = await Promise.all([
    catalogueApi.list(query),
    catalogueApi.categories(),
  ]);
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
        description="Compare machinery and explore technical specifications. Prices are available on request."
      />
      <form
        action="/machinery"
        className="filter-bar my-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      >
        {supplier && <input type="hidden" name="supplier" value={supplier} />}
        <label className="min-w-0 text-sm font-medium">
          Search machinery
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
          Category
          <select
            name="category"
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
      </form>
      <div className="mb-5 flex flex-wrap justify-between gap-3 text-xs text-slate-600">
        <p role="status">
          {result.pagination.total}{' '}
          {result.pagination.total === 1 ? 'machine' : 'machines'} found
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
          title="No machines found"
          description="Try another search or clear your filters. New machinery will appear here when published."
        >
          <Link href="/machinery" className="secondary-link">
            Clear filters
          </Link>
        </EmptyState>
      )}
      {result.pagination.totalPages > 0 && (
        <nav
          aria-label="Catalogue pagination"
          className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs"
        >
          {page > 1 && (
            <Link className="underline" href={href(page - 1)}>
              Previous
            </Link>
          )}
          <span>
            Page {page} of {result.pagination.totalPages}
          </span>
          {page < result.pagination.totalPages && (
            <Link className="underline" href={href(page + 1)}>
              Next
            </Link>
          )}
          {page > result.pagination.totalPages && (
            <Link className="underline" href={href(1)}>
              First page
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
