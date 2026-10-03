import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { catalogueApi } from '@/lib/api/catalogue.service';
import { ApiError } from '@/lib/api/client';
import MachineImage from '@/components/cards/MachineImage';
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
    title: `${machine.name} | iMet Machinery`,
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
      <Link href="/machinery" className="text-sm underline">
        Back to catalogue
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <section aria-label="Machine images">
          <MachineImage image={machine.images[0]} />
          {machine.images.length > 1 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {machine.images.slice(1).map((image, index) => (
                <MachineImage key={`${image.url}-${index}`} image={image} />
              ))}
            </div>
          )}
        </section>
        <section className="min-w-0">
          <Link
            className="text-sm text-orange-dark underline"
            href={`/machinery?category=${machine.category.slug}`}
          >
            {machine.category.name}
          </Link>
          <h1 className="mt-3 break-words text-4xl font-bold text-navy">
            {machine.name}
          </h1>
          <dl className="mt-6 space-y-3">
            <div>
              <dt className="font-semibold">Manufacturer</dt>
              <dd className="break-words text-slate-600">
                {machine.manufacturer}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Model</dt>
              <dd className="break-words text-slate-600">{machine.model}</dd>
            </div>
          </dl>
          <div className="mt-8 rounded-xl bg-slate-100 p-5">
            <h2 className="text-xl font-semibold">Price on request</h2>
            <p className="mt-2 text-slate-600">
              Request a quote for pricing. Online quote requests will be
              available in a future update.
            </p>
          </div>
        </section>
      </div>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-navy">About this machine</h2>
        <p className="mt-4 whitespace-pre-wrap break-words leading-7 text-slate-600">
          {machine.description}
        </p>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-navy">
          Technical specifications
        </h2>
        {machine.specifications.length ? (
          <dl className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {machine.specifications.map((spec, index) => (
              <div key={index} className="grid gap-2 p-4 sm:grid-cols-2">
                <dt className="break-words font-medium">{spec.label}</dt>
                <dd className="break-words text-slate-600">{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-slate-600">
            Technical specifications have not been provided.
          </p>
        )}
      </section>
    </article>
  );
}
