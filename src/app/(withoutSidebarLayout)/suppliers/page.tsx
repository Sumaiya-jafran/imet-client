import Link from 'next/link';
import { z } from 'zod';
import { supplierApi } from '@/lib/api/supplier.service';
import MachineImage from '@/components/cards/MachineImage';
export const metadata = { title: 'Suppliers | iMet Machinery' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = z
    .object({
      q: z.string().trim().max(100).default(''),
      page: z.coerce.number().int().min(1).max(10000).default(1),
    })
    .safeParse({ q: raw.q, page: raw.page });
  if (!parsed.success)
    return (
      <section>
        <h1>Invalid supplier filters</h1>
        <Link href="/suppliers" className="underline">
          Reset filters
        </Link>
      </section>
    );
  const { q, page } = parsed.data;
  const result = (
    await supplierApi.publicList(
      new URLSearchParams({ q, page: String(page), limit: '12' }),
    )
  ).data;
  if (!result) throw new Error('Supplier directory unavailable');
  const href = (target: number) =>
    `/suppliers?${new URLSearchParams({ q, page: String(target) })}`;
  return (
    <section>
      <h1 className="text-4xl font-bold text-navy">Marketplace suppliers</h1>
      <p className="mt-4 text-slate-600">
        Explore approved suppliers and manufacturers with active marketplace
        subscriptions.
      </p>
      <form action="/suppliers" className="my-6 flex flex-wrap gap-3">
        <label className="min-w-0 flex-1">
          Search companies
          <input
            name="q"
            defaultValue={q}
            maxLength={100}
            className="mt-1 w-full rounded border bg-white p-3"
          />
        </label>
        <button className="self-end rounded bg-navy px-5 py-3 text-white">
          Search suppliers
        </button>
      </form>
      <p className="mb-4">{result.pagination.total} suppliers found</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {result.suppliers.map((supplier) => (
          <article
            key={supplier.id}
            className="min-w-0 rounded-xl border bg-white p-4"
          >
            <MachineImage
              image={
                supplier.logoUrl
                  ? { url: supplier.logoUrl, alt: supplier.companyName }
                  : undefined
              }
            />
            <h2 className="mt-4 break-words text-xl font-semibold">
              <Link
                className="hover:underline"
                href={`/suppliers/${supplier.id}`}
              >
                {supplier.companyName}
              </Link>
            </h2>
            <p className="mt-2">
              {supplier.type === 'LOCAL'
                ? 'Local supplier / dealer'
                : 'International manufacturer'}
            </p>
            <p className="break-words">
              {supplier.city}, {supplier.country}
            </p>
            <p className="mt-2 text-sm text-orange-dark">
              {supplier.isVerified ? 'Verified supplier' : ''}
              {supplier.visibility === 'FEATURED' ? ' · Featured' : ''}
            </p>
          </article>
        ))}
      </div>
      {!result.suppliers.length && (
        <p className="rounded-xl border p-8">
          No suppliers found. Try another search.
        </p>
      )}
      {result.pagination.totalPages > 0 && (
        <nav
          aria-label="Supplier directory pagination"
          className="mt-6 flex flex-wrap justify-center gap-4"
        >
          {page > 1 && (
            <Link href={href(page - 1)} className="underline">
              Previous
            </Link>
          )}
          <span>
            Page {page} of {result.pagination.totalPages}
          </span>
          {page < result.pagination.totalPages && (
            <Link href={href(page + 1)} className="underline">
              Next
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
