import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import Badge from '@/components/shared/Badge';
import EmptyState from '@/components/shared/EmptyState';
import { BadgeCheck, MapPin } from 'lucide-react';
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
      <PageHeader
        eyebrow="Company directory"
        title="Marketplace suppliers"
        description="Explore approved local suppliers and international manufacturers with active marketplace subscriptions."
      />
      <form
        action="/suppliers"
        className="filter-bar my-6 flex flex-wrap gap-3"
      >
        <label className="min-w-0 flex-1">
          Search companies
          <input
            name="q"
            defaultValue={q}
            maxLength={100}
            className="mt-1 w-full rounded border bg-white p-3"
          />
        </label>
        <button className="action-link self-end">Search suppliers</button>
      </form>
      <p className="mb-4 text-xs text-slate-600">
        {result.pagination.total} suppliers found
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {result.suppliers.map((supplier) => (
          <article key={supplier.id} className="surface min-w-0 p-4">
            <MachineImage
              image={
                supplier.logoUrl
                  ? { url: supplier.logoUrl, alt: supplier.companyName }
                  : undefined
              }
            />
            <h2 className="mt-4 break-words text-lg font-semibold">
              <Link
                className="hover:underline"
                href={`/suppliers/${supplier.id}`}
              >
                {supplier.companyName}
              </Link>
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              {supplier.type === 'LOCAL'
                ? 'Local supplier / dealer'
                : 'International manufacturer'}
            </p>
            <p className="mt-2 flex items-center gap-1.5 break-words text-xs text-slate-500">
              <MapPin size={13} aria-hidden="true" />
              {supplier.city}, {supplier.country}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {supplier.isVerified && (
                <Badge tone="success">
                  <BadgeCheck size={12} aria-hidden="true" />
                  Verified supplier
                </Badge>
              )}
              {supplier.visibility === 'FEATURED' && (
                <Badge tone="warning">Featured</Badge>
              )}
            </div>
          </article>
        ))}
      </div>
      {!result.suppliers.length && (
        <EmptyState
          title="No suppliers found"
          description="Try another company name or clear your search."
        >
          <Link href="/suppliers" className="secondary-link">
            Clear search
          </Link>
        </EmptyState>
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
