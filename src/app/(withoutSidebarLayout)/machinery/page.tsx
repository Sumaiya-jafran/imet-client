import Link from 'next/link';
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
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-dark">
        Industrial machinery
      </p>
      <h1 className="mt-2 text-4xl font-bold text-navy">Machinery catalogue</h1>
      <p className="mt-4 text-slate-600">
        Compare machinery and explore technical specifications. Prices are
        available on request.
      </p>
      <form
        action="/machinery"
        className="my-8 grid gap-4 rounded-xl bg-slate-100 p-5 sm:grid-cols-[1fr_1fr_auto]"
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
        <button className="self-end rounded bg-navy px-5 py-3 font-semibold text-white">
          Search
        </button>
      </form>
      <div className="mb-5 flex flex-wrap justify-between gap-3">
        <p role="status">
          {result.pagination.total}{' '}
          {result.pagination.total === 1 ? 'machine' : 'machines'} found
        </p>
        <Link href="/machinery" className="underline">
          Clear filters
        </Link>
      </div>
      {result.machines.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 p-8">
          <h2 className="text-xl font-semibold">No machines found</h2>
          <p className="mt-3 text-slate-600">
            Try another search or clear your filters. New machinery will appear
            here when published.
          </p>
        </div>
      )}
      {result.pagination.totalPages > 0 && (
        <nav
          aria-label="Catalogue pagination"
          className="mt-8 flex flex-wrap items-center justify-center gap-5"
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
