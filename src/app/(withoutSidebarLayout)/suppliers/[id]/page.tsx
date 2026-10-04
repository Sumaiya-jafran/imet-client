import TranslatedText from '@/components/shared/TranslatedText';
import PublicReviews from '@/components/shared/PublicReviews';
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
      <div className="surface mt-6 grid gap-6 p-5 sm:p-8 md:grid-cols-[.8fr_1.2fr]">
        <MachineImage
          image={
            supplier.logoUrl
              ? { url: supplier.logoUrl, alt: supplier.companyName }
              : undefined
          }
        />
        <section className="min-w-0">
          <h1 className="break-words text-3xl font-bold sm:text-4xl text-navy">
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
          <p className="mt-4 text-sm text-slate-600">
            Private contact details are managed through iMet.
          </p>
        </section>
      </div>
      <PublicReviews target="SUPPLIER" targetId={supplier.id} />
    </article>
  );
}
