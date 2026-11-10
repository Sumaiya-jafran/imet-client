import MachineContact from '@/components/shared/MachineContact';
import MachineCard from '@/components/cards/MachineCard';
import { formatMachinePrice } from '@/lib/money';
import { siteUrl } from '@/lib/site-url';
import { catalogueImageUrl } from '@/lib/api/catalogue-images.service';
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
    alternates: { canonical: siteUrl(`/machinery/${machine.slug}`) },
    openGraph: {
      title: machine.name,
      description: machine.description.slice(0, 160),
      url: siteUrl(`/machinery/${machine.slug}`),
      images: machine.images[0]
        ? [catalogueImageUrl(machine.images[0].url)]
        : [],
    },
  };
}
export default async function MachinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const machine = await getMachine((await params).slug);
  const related = await catalogueApi.list(
    new URLSearchParams({ supplier: machine.supplier!.id, limit: '4' }),
  );
  const product =
    machine.pricingMode === 'FIXED_PRICE' && machine.price && machine.currency
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: machine.name,
          description: machine.description.slice(0, 2000),
          model: machine.model,
          brand: { '@type': 'Brand', name: machine.manufacturer },
          image: machine.images.map((i) => catalogueImageUrl(i.url)),
          offers: {
            '@type': 'Offer',
            url: siteUrl(`/machinery/${machine.slug}`),
            price: machine.price,
            priceCurrency: machine.currency,
            availability: `https://schema.org/${machine.availability === 'OUT_OF_STOCK' ? 'OutOfStock' : machine.availability === 'MADE_TO_ORDER' ? 'PreOrder' : 'InStock'}`,
          },
        }
      : null;
  return (
    <article className="min-w-0">
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(product).replace(/</g, '\\u003c'),
          }}
        />
      )}
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
          <div className="mt-6 rounded-lg border border-border bg-background p-4">
            <h2 className="text-section font-semibold">
              {machine.pricingMode === 'CONTACT_FOR_PRICE'
                ? 'Contact for Price'
                : formatMachinePrice(machine.price, machine.currency)}
            </h2>
            <p className="mt-2 text-nav">
              {machine.negotiable ? 'Price negotiable · ' : ''}
              {machine.availability?.replaceAll('_', ' ')}
            </p>
            <a
              href="#contact-supplier"
              className="mt-3 inline-block font-semibold text-secondary underline"
            >
              Contact Supplier
            </a>
          </div>
          <dl className="mt-5 grid gap-3 text-nav sm:grid-cols-2">
            {[
              ['Condition', machine.condition],
              ['Manufacturing year', machine.manufacturingYear],
              ['Country of origin', machine.countryOfOrigin],
              ['Minimum order quantity', machine.minimumOrderQuantity],
              ['Warranty', machine.warranty],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-muted">{label}</dt>
                <dd className="break-words font-medium">
                  {value ?? 'Not specified'}
                </dd>
              </div>
            ))}
          </dl>
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
      <MachineContact
        id={machine.id}
        slug={machine.slug}
        supplierId={machine.supplier!.id}
      />
      <section className="mt-6">
        <h2 className="mb-4 text-section font-semibold">
          More machinery from this supplier
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.machines
            .filter((m) => m.id !== machine.id)
            .slice(0, 3)
            .map((m) => (
              <MachineCard key={m.id} machine={m} />
            ))}
        </div>
      </section>
      <PublicReviews target="MACHINERY" targetId={machine.id} />
    </article>
  );
}
