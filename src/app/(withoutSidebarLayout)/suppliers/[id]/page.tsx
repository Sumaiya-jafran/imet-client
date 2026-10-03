import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supplierApi } from '@/lib/api/supplier.service';
import { ApiError } from '@/lib/api/client';
import MachineImage from '@/components/cards/MachineImage';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  let supplier;
  try {
    supplier = (await supplierApi.publicDetail(id)).data;
  } catch (error) {
    if (error instanceof ApiError && [404, 422].includes(error.status))
      notFound();
    throw error;
  }
  if (!supplier) notFound();
  return (
    <article>
      <Link href="/suppliers" className="underline">
        Back to suppliers
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <MachineImage
          image={
            supplier.logoUrl
              ? { url: supplier.logoUrl, alt: supplier.companyName }
              : undefined
          }
        />
        <section>
          <h1 className="break-words text-4xl font-bold text-navy">
            {supplier.companyName}
          </h1>
          <p className="mt-4">
            {supplier.type === 'LOCAL'
              ? 'Local supplier / dealer'
              : 'International manufacturer'}{' '}
            · {supplier.city}, {supplier.country}
          </p>
          <p className="mt-3 text-orange-dark">
            {supplier.isVerified ? 'Verified supplier' : ''}
            {supplier.visibility === 'FEATURED' ? ' · Featured' : ''}
          </p>
          <p className="mt-6 whitespace-pre-wrap break-words leading-7">
            {supplier.description}
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
            className="mt-6 inline-block rounded bg-navy px-5 py-3 text-white"
          >
            Browse this supplier’s machinery
          </Link>
          <p className="mt-4 text-sm text-slate-600">
            Private contact details are managed through iMet.
          </p>
        </section>
      </div>
    </article>
  );
}
