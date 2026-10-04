import { Suspense } from 'react';
import {
  HomeCategories,
  HomeMachinery,
  HomePlans,
  HomeSuppliers,
  HomeReviews,
} from '@/components/shared/HomeMarketplace';
import LoadingState from '@/components/shared/LoadingState';
import Link from 'next/link';
import {
  ArrowUpRight,
  Factory,
  Settings2,
  Building2,
  FileText,
  ArrowRight,
} from 'lucide-react';
export default function HomePage() {
  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="relative grid overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[1.25fr_1fr]">
        <div className="px-6 py-10 sm:px-10 sm:py-14 lg:py-18">
          <p className="eyebrow">Built for industry</p>
          <h1 className="mt-5 max-w-xl text-[clamp(2.3rem,5vw,4rem)] font-bold leading-[1.08] tracking-[-.055em] text-navy">
            The right machinery.
            <br />
            <span className="text-slate-500">Your next production line.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
            Explore industrial machinery, compare manufacturers and review the
            technical details that matter to your business.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/machinery" className="action-link">
              Explore machinery
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link href="#supplier-plans" className="secondary-link">
              View supplier plans
            </Link>
            <Link href="/suppliers" className="secondary-link">
              Find suppliers
            </Link>
          </div>
          <p className="mt-7 text-xs text-slate-500">
            Technical specifications · Supplier profiles · Pricing on request
          </p>
        </div>
        <div
          className="relative flex min-h-64 items-center justify-center overflow-hidden bg-navy p-8 text-white"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(#8b9ba7 1px, transparent 1px), linear-gradient(90deg,#8b9ba7 1px,transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative w-full max-w-sm">
            <div className="mb-4 flex justify-between text-[10px] uppercase tracking-[.2em] text-slate-400">
              <span>Industrial systems</span>
              <span>iMet / 01</span>
            </div>
            <div className="relative rounded-xl border border-white/20 bg-white/5 p-8">
              <Factory
                className="mx-auto size-28 text-slate-300"
                strokeWidth={0.8}
              />
              <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4">
                <span className="text-xs text-slate-300">
                  Machinery & manufacturing
                </span>
                <Settings2 size={18} className="text-orange" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-xs text-slate-400">
              <span>Explore. Evaluate. Connect.</span>
              <ArrowUpRight size={17} />
            </div>
          </div>
        </div>
      </section>
      <Suspense
        fallback={<LoadingState label="Loading machinery categories…" />}
      >
        <HomeCategories />
      </Suspense>
      <Suspense
        fallback={<LoadingState label="Loading current machinery…" cards />}
      >
        <HomeMachinery />
      </Suspense>
      <section
        aria-label="Explore the marketplace"
        className="grid gap-4 md:grid-cols-3"
      >
        {[
          {
            icon: Settings2,
            title: 'Explore machinery',
            description:
              'Search by category, manufacturer or model and review detailed specifications.',
            href: '/machinery',
            label: 'Browse catalogue',
          },
          {
            icon: Building2,
            title: 'Discover suppliers',
            description:
              'Explore local dealers and international manufacturers with active marketplace profiles.',
            href: '/suppliers',
            label: 'Find a company',
          },
          {
            icon: FileText,
            title: 'Become a supplier',
            description:
              'Create an account, submit your company information and apply for administrator review.',
            href: '/dashboard/supplier',
            label: 'Start your application',
          },
        ].map(({ icon: Icon, title, description, href, label }) => (
          <article key={title} className="surface p-6">
            <Icon
              size={22}
              className="mb-5 text-orange-dark"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
            <Link
              href={href}
              className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-navy"
            >
              {label}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>
      <Suspense
        fallback={<LoadingState label="Loading supplier plans…" cards />}
      >
        <HomePlans />
      </Suspense>
      <Suspense
        fallback={<LoadingState label="Loading active suppliers…" cards />}
      >
        <HomeSuppliers />
      </Suspense>
      <Suspense
        fallback={
          <LoadingState label="Loading published buyer feedback…" cards />
        }
      >
        <HomeReviews />
      </Suspense>
    </div>
  );
}
