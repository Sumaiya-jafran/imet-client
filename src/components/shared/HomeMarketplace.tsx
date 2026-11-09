import { supplierTypeLabels, supplierTypePluralLabels } from '@/types/supplier';
import TranslatedText from '@/components/shared/TranslatedText';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  BadgeCheck,
  Check,
  MapPin,
  Quote,
} from 'lucide-react';
import { catalogueApi } from '@/lib/api/catalogue.service';
import { supplierApi } from '@/lib/api/supplier.service';
import { reviewApi } from '@/lib/api/review.service';
import MachineCard from '@/components/cards/MachineCard';
import EmptyState from './EmptyState';
import HomeSectionError from './HomeSectionError';
import RatingStars from './RatingStars';
import Badge from './Badge';
import Reveal from './Reveal';
import { cn } from '@/lib/utils';

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 text-meta font-bold uppercase tracking-[0.2em]',
        dark ? 'text-accent' : 'text-secondary',
      )}
    >
      <span
        className={cn('h-px w-8', dark ? 'bg-accent' : 'bg-accent')}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  label,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  label?: string;
  dark?: boolean;
}) {
  return (
    <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6 lg:mb-14">
      <div className="max-w-2xl">
        <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
        <h2
          className={cn(
            'mt-4 font-sans text-section font-semibold leading-tight tracking-tight',
            dark ? 'text-inverse' : 'text-primary',
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-4 text-body leading-7',
              dark ? 'text-border-strong' : 'text-secondary',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            'group inline-flex min-h-11 items-center gap-2 border-b-2 border-accent pb-1 text-nav font-semibold',
            dark ? 'text-inverse' : 'text-primary',
          )}
        >
          {label}
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      )}
    </Reveal>
  );
}

function SectionError({ label }: { label: string }) {
  return (
    <Container className="py-10">
      <HomeSectionError label={label} />
    </Container>
  );
}

export async function HomeCategories() {
  let categories;
  try {
    categories = await catalogueApi.categories();
  } catch {
    return <SectionError label="Machinery categories" />;
  }
  return (
    <section aria-label="Machinery categories" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Find your industry"
          title="Browse machinery by category"
          href="/machinery"
          label="Full catalogue"
        />
        {categories.length ? (
          <ul className="grid grid-cols-2 border-l border-t border-border lg:grid-cols-4">
            {categories.slice(0, 8).map((c, i) => (
              <li key={c.slug} className="border-b border-r border-border">
                <Reveal delay={(i % 4) * 80} className="h-full">
                  <Link
                    href={`/machinery?category=${c.slug}`}
                    className="group flex h-full min-h-32 flex-col justify-between gap-6 bg-surface p-4 transition-colors hover:bg-primary sm:min-h-40 sm:p-6"
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-sans text-nav font-bold text-secondary group-hover:text-accent">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <ArrowUpRight
                        size={20}
                        aria-hidden="true"
                        className="text-subtle transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-inverse"
                      />
                    </span>
                    <span className="break-words font-sans text-body font-bold leading-tight text-primary group-hover:text-inverse sm:text-section">
                      {c.name}
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Catalogue categories are coming soon"
            description="Categories appear when published machinery is available."
          />
        )}
      </Container>
    </section>
  );
}

export async function HomeMachinery() {
  let catalogue;
  try {
    catalogue = await catalogueApi.list(new URLSearchParams({ limit: '6' }));
  } catch {
    return <SectionError label="Machinery catalogue" />;
  }
  return (
    <section
      aria-label="Latest machinery"
      className="border-y border-border bg-surface py-20 lg:py-28"
    >
      <Container>
        <SectionHeading
          eyebrow="Latest in the catalogue"
          title="Machinery for your next production line"
          description="Published machinery with technical specifications. Pricing is shared privately on request."
          href="/machinery"
          label="Browse all machinery"
        />
        {catalogue.machines.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalogue.machines.map((machine, i) => (
              <Reveal key={machine.id} delay={(i % 3) * 100} className="flex">
                <div className="flex w-full [&>article]:w-full">
                  <MachineCard machine={machine} />
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No published machinery yet"
            description="Check back as suppliers and administrators publish their catalogue."
          />
        )}
      </Container>
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
    return <SectionError label="Marketplace suppliers" />;
  }
  return (
    <section aria-label="Marketplace suppliers" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Supplier network"
          title="Meet active suppliers & manufacturers"
          description="Approved businesses with current marketplace subscriptions. Private contact details stay protected by Machinmate."
          href="/suppliers"
          label="All suppliers"
        />
        {suppliers.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {suppliers.map((s, i) => (
              <Reveal key={s.id} delay={i * 100} className="flex">
                <article className="group relative flex w-full min-w-0 flex-col border border-border bg-surface p-7 transition-shadow hover:shadow-surface hover:shadow-primary/5">
                  <span
                    className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden="true"
                  />
                  <div>
                    <Badge>{supplierTypeLabels[s.type]}</Badge>
                  </div>
                  <h3 className="mt-5 break-words font-sans text-section font-bold">
                    <Link
                      href={`/suppliers/${s.slug ?? s.id}`}
                      className="hover:text-secondary"
                    >
                      {s.companyName}
                    </Link>
                  </h3>
                  <p className="mt-2 flex items-center gap-1.5 break-words text-meta text-muted-foreground">
                    <MapPin size={14} aria-hidden="true" />
                    {s.city}, {s.country}
                  </p>
                  {s.isVerified && (
                    <p className="mt-3 flex items-center gap-2 text-meta font-semibold text-success-foreground">
                      <BadgeCheck size={15} aria-hidden="true" />
                      Verified supplier
                    </p>
                  )}
                  <p className="mt-4 line-clamp-3 break-words text-nav leading-6 text-secondary">
                    <TranslatedText
                      resource={{
                        type: 'SUPPLIER',
                        id: s.id,
                        field: 'DESCRIPTION',
                      }}
                      original={s.description}
                    />
                  </p>
                  <Link
                    href={`/suppliers/${s.slug ?? s.id}`}
                    className="mt-auto inline-flex items-center gap-2 pt-6 text-nav font-semibold text-primary"
                  >
                    View company
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Supplier profiles are coming soon"
            description="Approved suppliers with active marketplace subscriptions appear here."
          />
        )}
      </Container>
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
    return <SectionError label="Buyer reviews" />;
  }
  return (
    <section
      aria-label="Recent buyer reviews"
      className="border-t border-border bg-surface py-20 lg:py-28"
    >
      <Container>
        <SectionHeading
          eyebrow="Purchase-backed feedback"
          title="What buyers say"
          description="Reviews come from completed purchases and are published after administrator approval."
        />
        {reviews.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 100} className="flex">
                <figure className="relative flex w-full min-w-0 flex-col border-l-4 border-accent bg-background p-7">
                  <Quote
                    size={36}
                    aria-hidden="true"
                    className="absolute right-6 top-6 text-border"
                  />
                  <RatingStars rating={r.rating} />
                  <blockquote className="mt-5 line-clamp-6 whitespace-pre-wrap break-words text-body leading-7 text-primary">
                    <TranslatedText
                      resource={{ type: 'REVIEW', id: r.id, field: 'BODY' }}
                      original={r.body}
                    />
                  </blockquote>
                  <figcaption className="mt-auto border-t border-border pt-5">
                    <p className="break-words font-sans font-bold text-primary">
                      {r.author.displayName}
                    </p>
                    <Link
                      className="mt-1 block break-words text-meta text-secondary underline underline-offset-2 hover:text-secondary"
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
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Buyer reviews will appear here"
            description="Feedback from completed purchases is published after administrator approval."
          />
        )}
      </Container>
    </section>
  );
}

export async function HomePlans() {
  let plans;
  try {
    const r = await supplierApi.publicPlans(true);
    if (!r.data) throw new Error();
    plans = r.data;
  } catch {
    return <SectionError label="Supplier subscription plans" />;
  }
  return (
    <section
      id="supplier-plans"
      aria-label="Supplier subscription plans"
      className="scroll-mt-24 py-20 lg:py-28"
    >
      <Container>
        <SectionHeading
          eyebrow="For suppliers & manufacturers"
          title="List your machinery on Machinmate"
          description="Plans are set by Machinmate administrators. Free plans need no payment. Online payments activate after verification; offline payments are recorded and confirmed by Machinmate administrators. Buyers never need a subscription."
          href="/dashboard/supplier"
          label="Become a supplier"
        />
        {plans.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((p, i) => {
              const featured = p.visibility === 'FEATURED';
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
                `${p.visibility === 'HIDDEN' ? 'Hidden' : featured ? 'Featured' : 'Standard'} marketplace visibility`,
              ];
              return (
                <Reveal key={p.id} delay={(i % 3) * 100} className="flex">
                  <article
                    className={cn(
                      'flex w-full min-w-0 flex-col border p-7',
                      featured
                        ? 'border-primary bg-primary text-inverse'
                        : 'border-border bg-surface',
                    )}
                  >
                    <div className="flex flex-wrap gap-2">
                      {p.eligibleTypes.map((t) => (
                        <Badge key={t}>{supplierTypePluralLabels[t]}</Badge>
                      ))}
                    </div>
                    <h3
                      className={cn(
                        'mt-5 break-words font-sans text-section font-bold',
                        featured && 'text-inverse',
                      )}
                    >
                      {p.name}
                    </h3>
                    <p className="mt-4 break-words font-sans text-page font-bold tracking-tight">
                      {p.price}{' '}
                      <span
                        className={cn(
                          'text-nav font-medium',
                          featured
                            ? 'text-border-strong'
                            : 'text-muted-foreground',
                        )}
                      >
                        {p.currency}
                      </span>
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-meta',
                        featured
                          ? 'text-border-strong'
                          : 'text-muted-foreground',
                      )}
                    >
                      {p.durationDays} days · Supplier subscription
                    </p>
                    <ul
                      className={cn(
                        'my-6 space-y-3 border-t pt-6',
                        featured ? 'border-surface/15' : 'border-surface-muted',
                      )}
                    >
                      {features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-nav"
                        >
                          <Check
                            size={16}
                            aria-hidden="true"
                            className={cn(
                              'mt-0.5 shrink-0',
                              featured ? 'text-accent' : 'text-secondary',
                            )}
                          />
                          <span className="break-words">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/auth/signup?type=supplier&planId=${p.id}`}
                      className={cn(
                        'mt-auto inline-flex min-h-11 items-center justify-center gap-2 border text-nav font-semibold',
                        featured
                          ? 'border-accent bg-accent text-foreground hover:bg-accent-hover'
                          : 'border-primary text-primary hover:bg-primary hover:text-inverse',
                      )}
                    >
                      Choose this plan
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </article>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No active supplier plans"
            description="Administrators will publish available plans here. You can still browse machinery or apply to become a supplier."
          />
        )}
      </Container>
    </section>
  );
}
