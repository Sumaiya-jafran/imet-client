import { quoteHref } from '@/config/routes';
import TranslatedText from '@/components/shared/TranslatedText';
import PublicReviews from '@/components/shared/PublicReviews';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { catalogueApi } from '@/lib/api/catalogue.service';
import { ApiError } from '@/lib/api/client';
import MachineryMediaGallery from '@/components/shared/MachineryMediaGallery';
const getMachine = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 220) notFound();
  try {
    return await catalogueApi.detail(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const machine = await getMachine((await params).slug);
  return {
    title: `${machine.name} | Machinmate`,
    description: machine.description.slice(0, 160),
  };
}
export default async function MachinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const machine = await getMachine((await params).slug);
  return (
    <article className="min-w-0">
      <Link href="/machinery" className="secondary-link text-nav">
        Back to catalogue
      </Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <MachineryMediaGallery
          key={machine.id}
          images={machine.images}
          media={machine.media}
          name={machine.name}
        />
        <section className="surface min-w-0 p-5 sm:p-7">
          {machine.supplier && (
            <p className="mb-3">
              Supplier:{' '}
              <Link
                className="underline"
                href={`/suppliers/${machine.supplier.slug ?? machine.supplier.id}`}
              >
                {machine.supplier.companyName}
              </Link>
            </p>
          )}

          <Link
            className="break-words text-nav text-secondary underline"
            href={`/machinery?category=${machine.category.slug}`}
          >
            {machine.category.name}
          </Link>
          <h1 className="mt-3 break-words text-page font-bold sm:text-page text-primary">
            <TranslatedText
              resource={{ type: 'MACHINERY', id: machine.id, field: 'NAME' }}
              original={machine.name}
            />
          </h1>
          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-background p-4">
            <div>
              <dt className="text-meta font-medium uppercase tracking-wide text-muted-foreground">
                Manufacturer
              </dt>
              <dd className="break-words text-secondary">
                {machine.manufacturer}
              </dd>
            </div>
            <div>
              <dt className="text-meta font-medium uppercase tracking-wide text-muted-foreground">
                Model
              </dt>
              <dd className="break-words text-secondary">{machine.model}</dd>
            </div>
          </dl>
          <div className="mt-6 rounded-lg border border-accent/15 bg-accent/5 p-4">
            <h2 className="text-card font-semibold">Price on request</h2>
            <p className="mt-2 text-secondary">
              Send your requirements to receive private supplier quotes.
            </p>
            <Link
              className="action-link mt-4 inline-flex"
              href={quoteHref(machine.slug)}
            >
              Request a quote
            </Link>
          </div>
        </section>
      </div>
      <section className="surface mt-6 p-5 sm:p-7">
        <h2 className="text-card font-semibold text-primary">
          About this machine
        </h2>
        <p className="mt-4 whitespace-pre-wrap break-words leading-7 text-secondary">
          <TranslatedText
            resource={{
              type: 'MACHINERY',
              id: machine.id,
              field: 'DESCRIPTION',
            }}
            original={machine.description}
            showStatus
          />
        </p>
      </section>
      <section className="surface mt-6 p-5 sm:p-7">
        <h2 className="text-card font-semibold text-primary">
          Technical specifications
        </h2>
        {machine.specifications.length ? (
          <dl className="mt-4 divide-y divide-border rounded-xl border border-border">
            {machine.specifications.map((spec) => (
              <div
                key={spec.id}
                className="grid gap-2 bg-surface px-4 py-3 odd:bg-background sm:grid-cols-2"
              >
                <dt className="break-words font-medium">
                  <TranslatedText
                    resource={{
                      type: 'SPECIFICATION',
                      id: spec.id,
                      field: 'LABEL',
                    }}
                    original={spec.label}
                  />
                </dt>
                <dd className="break-words text-secondary">{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-secondary">
            Technical specifications have not been provided.
          </p>
        )}
      </section>
      <section className="surface mt-6 p-5">
        <h2 className="font-semibold">Need after-sales service?</h2>
        <p className="mt-2 text-nav text-secondary">
          Submit a service request for your completed purchase of this
          machinery.
        </p>
        <Link
          className="secondary-link mt-3"
          href={`/dashboard/service-tickets/new?machine=${machine.slug}`}
        >
          Request machinery service
        </Link>
      </section>
      <PublicReviews target="MACHINERY" targetId={machine.id} />
    </article>
  );
}
