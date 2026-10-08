import TranslatedText from '@/components/shared/TranslatedText';
import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, Settings2, Check } from 'lucide-react';
import { catalogueApi } from '@/lib/api/catalogue.service';
import { supplierApi } from '@/lib/api/supplier.service';
import { reviewApi } from '@/lib/api/review.service';
import MachineCard from '@/components/cards/MachineCard';
import EmptyState from './EmptyState';
import HomeSectionError from './HomeSectionError';
import RatingStars from './RatingStars';
import Badge from './Badge';
function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  label,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-navy">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link className="secondary-link" href={href}>
          {label}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
export async function HomeCategories() {
  let categories;
  try {
    categories = await catalogueApi.categories();
  } catch {
    return <HomeSectionError label="Machinery categories" />;
  }
  return (
    <section aria-label="Machinery categories">
      <SectionHeading
        eyebrow="Find your industry"
        title="Browse machinery categories"
        href="/machinery"
        label="Full catalogue"
      />
      {categories.length ? (
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/machinery?category=${c.slug}`}
              className="surface flex max-w-full items-center gap-3 px-4 py-3 text-sm font-semibold hover:border-orange/40"
            >
              <Settings2
                size={17}
                className="shrink-0 text-orange-dark"
                aria-hidden="true"
              />
              <span className="min-w-0 break-words">{c.name}</span>
              <ArrowUpRight size={15} className="shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Catalogue categories are coming soon"
          description="Categories appear when published machinery is available."
        />
      )}
    </section>
  );
}
export async function HomeMachinery() {
  let catalogue;
  try {
    catalogue = await catalogueApi.list(new URLSearchParams({ limit: '6' }));
  } catch {
    return <HomeSectionError label="Machinery catalogue" />;
  }
  return (
    <section aria-label="Machinery selection">
      <SectionHeading
        eyebrow="Explore the catalogue"
        title="Machinery for your next production line"
        description="Current published machinery with technical specifications and private pricing on request."
        href="/machinery"
        label="Browse machinery"
      />
      {catalogue.machines.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogue.machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No published machinery yet"
          description="Check back as suppliers and administrators publish their catalogue."
        />
      )}
    </section>
  );
}
export async function HomePlans() {
  let plans;
  try {
    const r = await supplierApi.publicPlans();
    if (!r.data) throw new Error();
    plans = r.data;
  } catch {
    return <HomeSectionError label="Supplier subscription plans" />;
  }
  return (
    <section
      id="supplier-plans"
      aria-label="Supplier subscription plans"
      className="scroll-mt-6"
    >
      <SectionHeading
        eyebrow="For suppliers & manufacturers"
        title="Choose your marketplace plan"
        description="Current plans defined by iMet administrators. Buyers browse and request quotations without a subscription. Activate through verified SSLCOMMERZ checkout or an audited administrator action."
      />
      {plans.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => {
            const features = [
              `${p.listingLimit} machinery listings`,
              `${p.imageLimit} images and ${p.specificationLimit} specifications per listing`,
              p.canPublishMachinery
                ? 'Machinery publication included'
                : 'Machinery publication not included',
              p.rfqEnabled
                ? `${p.leadLimitPerMonth === null ? 'Unlimited' : p.leadLimitPerMonth} eligible leads per month`
                : 'RFQ responses not included',
              p.canRevealContacts
                ? 'Contact reveal permission, subject to RFQ rules'
                : 'Private contact reveal not included',
              `${p.visibility === 'HIDDEN' ? 'Hidden' : p.visibility === 'FEATURED' ? 'Featured' : 'Standard'} marketplace visibility`,
            ];
            return (
              <article key={p.id} className="surface flex min-w-0 flex-col p-6">
                <div className="flex flex-wrap gap-2">
                  {p.eligibleTypes.map((t) => (
                    <Badge key={t}>
                      {t === 'LOCAL'
                        ? 'Local suppliers / dealers'
                        : 'International manufacturers'}
                    </Badge>
                  ))}
                </div>
                <h3 className="mt-4 break-words text-lg font-semibold">
                  {p.name}
                </h3>
                <p className="mt-4 break-words text-3xl font-semibold tracking-tight">
                  {p.price}{' '}
                  <span className="text-sm font-normal text-slate-500">
                    {p.currency}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.durationDays} days · Supplier subscription
                </p>
                <ul className="my-5 space-y-3 border-t border-slate-100 pt-5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-orange-dark"
                        aria-hidden="true"
                      />
                      <span className="break-words">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  className="secondary-link mt-auto justify-center"
                  href={`/auth/signup?type=supplier&planId=${p.id}`}
                >
                  Choose this plan
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No active supplier plans"
          description="Administrators will publish available plans here. You can still browse machinery or apply to become a supplier."
        />
      )}
    </section>
  );
}
export async function HomeSuppliers() {
  let suppliers;
  try {
    const r = await supplierApi.publicList(new URLSearchParams({ limit: '3' }));
    if (!r.data) throw new Error();
    suppliers = r.data.suppliers;
  } catch {
    return <HomeSectionError label="Marketplace suppliers" />;
  }
  return (
    <section aria-label="Marketplace suppliers">
      <SectionHeading
        eyebrow="Company network"
        title="Meet active suppliers & manufacturers"
        description="Approved businesses with current marketplace subscriptions. Private contacts remain protected by iMet."
        href="/suppliers"
        label="All suppliers"
      />
      {suppliers.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {suppliers.map((s) => (
            <article key={s.id} className="surface min-w-0 p-5">
              <Badge>
                {s.type === 'LOCAL'
                  ? 'Local supplier'
                  : 'International manufacturer'}
              </Badge>
              <h3 className="mt-4 break-words text-lg font-semibold">
                <Link
                  href={`/suppliers/${s.id}`}
                  className="hover:text-orange-dark"
                >
                  {s.companyName}
                </Link>
              </h3>
              <p className="mt-2 break-words text-xs text-slate-500">
                {s.city}, {s.country}
              </p>
              {s.isVerified && (
                <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <BadgeCheck size={15} aria-hidden="true" />
                  Verified supplier
                </p>
              )}
              <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-600">
                <TranslatedText
                  resource={{
                    type: 'SUPPLIER',
                    id: s.id,
                    field: 'DESCRIPTION',
                  }}
                  original={s.description}
                />
              </p>
              <Link className="secondary-link mt-4" href={`/suppliers/${s.id}`}>
                View company
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Supplier profiles are coming soon"
          description="Approved suppliers with active marketplace subscriptions appear here."
        />
      )}
    </section>
  );
}
export async function HomeReviews() {
  let reviews;
  try {
    const r = await reviewApi.highlights();
    if (!r.data) throw new Error();
    reviews = r.data;
  } catch {
    return <HomeSectionError label="Buyer reviews" />;
  }
  return (
    <section aria-label="Recent buyer reviews">
      <SectionHeading
        eyebrow="Purchase-backed feedback"
        title="What buyers say"
        description="Actual completed-purchase reviews, published after administrator approval."
      />
      {reviews.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <article key={r.id} className="surface min-w-0 p-5">
              <RatingStars rating={r.rating} />
              <p className="mt-4 line-clamp-5 whitespace-pre-wrap break-words text-sm leading-6">
                <TranslatedText
                  resource={{ type: 'REVIEW', id: r.id, field: 'BODY' }}
                  original={r.body}
                />
              </p>
              <p className="mt-5 break-words text-sm font-semibold">
                {r.author.displayName}
              </p>
              <Link
                className="mt-1 block break-words text-xs text-slate-500 underline"
                href={
                  r.machine
                    ? `/machinery/${r.machine.slug}`
                    : `/suppliers/${r.supplier!.id}`
                }
              >
                {r.machine ? (
                  <TranslatedText
                    resource={{
                      type: 'MACHINERY',
                      id: r.machine.id,
                      field: 'NAME',
                    }}
                    original={r.machine.name}
                  />
                ) : (
                  r.supplier?.companyName
                )}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Buyer reviews will appear here"
          description="Feedback from completed purchases is published after administrator approval."
        />
      )}
    </section>
  );
}
