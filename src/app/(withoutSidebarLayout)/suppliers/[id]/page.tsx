import { supplierTypeLabels } from '@/types/supplier';
import TranslatedText from '@/components/shared/TranslatedText';
import PublicReviews from '@/components/shared/PublicReviews';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supplierApi } from '@/lib/api/supplier.service';
import { ApiError } from '@/lib/api/client';
import MachineImage from '@/components/cards/MachineImage';
import MachineCard from '@/components/cards/MachineCard';
import EmptyState from '@/components/shared/EmptyState';
import { catalogueApi } from '@/lib/api/catalogue.service';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { id } = await params;
  const filter = await searchParams;
  const page = /^[1-9]\d{0,3}$/.test(filter.page ?? '')
    ? Number(filter.page)
    : 1;
  const q = typeof filter.q === 'string' ? filter.q.slice(0, 100) : '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(id) || id.length > 120) notFound();
  let supplier;
  try {
    supplier = (await supplierApi.publicDetail(id)).data;
  } catch (error) {
    if (error instanceof ApiError && [404, 422].includes(error.status))
      notFound();
    throw error;
  }
  if (!supplier) notFound();
  const catalogue = await catalogueApi.list(
    new URLSearchParams({
      supplier: supplier.id,
      limit: '12',
      page: String(page),
      q,
    }),
  );
  return (
    <article>
      <Link href="/suppliers" className="underline">
        Back to suppliers
      </Link>
      <div className="surface mt-6 grid gap-6 p-5 sm:p-8 md:grid-cols-[.8fr_1.2fr]">
        <MachineImage
          image={
            supplier.logoUrl
              ? { url: supplier.logoUrl, alt: supplier.companyName }
              : undefined
          }
        />
        <section className="min-w-0">
          <h1 className="break-words text-page font-bold sm:text-page text-primary">
            {supplier.companyName}
          </h1>
          <p className="mt-4">
            {supplierTypeLabels[supplier.type]} · {supplier.city},{' '}
            {supplier.country}
          </p>
          <p className="mt-3 text-secondary">
            {supplier.isVerified ? 'Verified supplier' : ''}
            {supplier.visibility === 'FEATURED' ? ' · Featured' : ''}
          </p>
          <p className="mt-6 whitespace-pre-wrap break-words leading-7">
            <TranslatedText
              resource={{
                type: 'SUPPLIER',
                id: supplier.id,
                field: 'DESCRIPTION',
              }}
              original={supplier.description}
              showStatus
            />
          </p>
          {supplier.website && (
            <a
              href={supplier.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block underline"
            >
              Company website
            </a>
          )}
          <Link
            href={`/machinery?supplier=${supplier.id}`}
            className="action-link mt-6"
          >
            Browse this supplier’s machinery
          </Link>
          <p className="mt-4 text-nav text-secondary">
            Private contact details are managed through Machinmate.
          </p>
        </section>
      </div>
      <section className="mt-8" aria-labelledby="supplier-machinery-title">
        <h2
          id="supplier-machinery-title"
          className="mb-5 text-section font-semibold"
        >
          Supplier machinery · {catalogue.pagination.total} public listings
        </h2>
        <form className="mb-4 flex flex-wrap gap-2">
          <label className="flex-1">
            Search this supplier
            <input
              name="q"
              defaultValue={q}
              maxLength={100}
              className="mt-1 w-full"
            />
          </label>
          <button className="self-end rounded bg-accent px-4 py-2 font-semibold text-foreground">
            Search
          </button>
        </form>
        {catalogue.machines.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogue.machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No published machinery"
            description="This supplier has no public listings at the moment."
          />
        )}
      </section>
      <nav
        aria-label="Supplier machinery pagination"
        className="my-5 flex flex-wrap justify-between gap-3"
      >
        {page > 1 && (
          <Link
            className="underline"
            href={`?${new URLSearchParams({ page: String(page - 1), q })}`}
          >
            Previous
          </Link>
        )}
        <span>
          Page {page} of {Math.max(1, catalogue.pagination.totalPages)}
        </span>
        {page < catalogue.pagination.totalPages && (
          <Link
            className="underline"
            href={`?${new URLSearchParams({ page: String(page + 1), q })}`}
          >
            Next
          </Link>
        )}
      </nav>
      <PublicReviews target="SUPPLIER" targetId={supplier.id} />
    </article>
  );
}
