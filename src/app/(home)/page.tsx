import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import {
  Container,
  Eyebrow,
  SectionHeading,
  HomeCategories,
  HomeMachinery,
  HomePlans,
  HomeSuppliers,
  HomeReviews,
} from '@/components/shared/HomeMarketplace';
import LoadingState from '@/components/shared/LoadingState';
import Reveal from '@/components/shared/Reveal';
import { QUOTE_HREF } from '@/config/routes';

// All copy below is drawn from features that exist in the product.
const highlights = ['Technical specifications', 'Supplier profiles', 'Pricing on request'];

const rfqFields = [
  'Machine or category',
  'Quantity & unit',
  'Target budget (optional)',
  'Delivery location',
  'Delivery timeline',
  'Preferred supplier country',
];

const marqueeItems = [
  'Technical specifications',
  'Local dealers',
  'International manufacturers',
  'Request for quotation',
  'Private pricing on request',
  'Purchase-backed reviews',
  'English · বাংলা · 中文',
];

const reasons = [
  {
    title: 'Specifications before conversations',
    text: 'Every listing shows category, manufacturer, model and technical specifications, so you shortlist before you reach out.',
  },
  {
    title: 'Approved suppliers only',
    text: 'Suppliers submit company information for administrator review. Only approved businesses with an active subscription appear.',
  },
  {
    title: 'Private by default',
    text: 'Prices are shared on request and contact details stay protected by Machinmate until RFQ rules allow them to be revealed.',
  },
  {
    title: 'Reviews from real purchases',
    text: 'Buyer feedback is tied to a completed purchase and published only after administrator approval.',
  },
];

const steps = [
  { title: 'Explore', text: 'Browse machinery by category, manufacturer or model.' },
  { title: 'Evaluate', text: 'Review specifications and the supplier behind each listing.' },
  { title: 'Request', text: 'Send an RFQ with quantity, budget, delivery location and timeline.' },
  { title: 'Receive quotes', text: 'Eligible suppliers respond with quotations in your workspace.' },
  { title: 'Buy & support', text: 'Track purchases, open service tickets and leave a review.' },
];

function PrimaryButton({ className = '' }: { className?: string }) {
  return (
    <Link
      href={QUOTE_HREF}
      className={`group inline-flex min-h-12 items-center gap-3 bg-orange px-6 text-sm font-semibold text-white hover:bg-orange-dark ${className}`}
    >
      Request a quote
      <ArrowUpRight size={18} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

function RotatingBadge({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex size-32 items-center justify-center rounded-full bg-navy ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute size-32 motion-safe:animate-[spin_18s_linear_infinite]">
        <defs>
          <path id="badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-white font-display text-[9.5px] font-bold uppercase tracking-[0.2em]">
          <textPath href="#badge-circle">Request a quote • Machinmate •</textPath>
        </text>
      </svg>
      <span className="flex size-12 items-center justify-center rounded-full bg-orange text-white">
        <ArrowUpRight size={22} />
      </span>
    </span>
  );
}

function Loading({ label, cards }: { label: string; cards?: boolean }) {
  return (
    <Container className="py-20">
      <LoadingState label={label} cards={cards} />
    </Container>
  );
}

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-navy text-white">
        {/* PLACEHOLDER: add an Machinmate factory or machinery photo at /public/images/home/hero.jpg.
            The section is designed to look complete without it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[url('/images/home/hero.jpg')] bg-cover bg-center opacity-20 mix-blend-luminosity"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:72px_72px]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[0.18em] -right-[0.04em] -z-10 select-none font-display text-[clamp(9rem,30vw,26rem)] font-black leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.1)]"
        >
          Machinmate
        </span>

        <Container className="grid items-center gap-14 pb-16 pt-16 sm:pt-20 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16 lg:pb-24 lg:pt-28">
          <div>
            <div className="motion-safe:animate-fade-up">
              <Eyebrow dark>Industrial machinery marketplace</Eyebrow>
            </div>
            <h1 className="mt-6 font-display text-[clamp(2.6rem,6.4vw,5.25rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-white motion-safe:animate-fade-up motion-safe:[animation-delay:100ms]">
              Source industrial machinery from{' '}
              <span className="text-orange-light">approved suppliers.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300 motion-safe:animate-fade-up motion-safe:[animation-delay:200ms]">
              Compare technical specifications from local dealers and international
              manufacturers, then send one request for quotation. Free for buyers,
              with pricing shared privately on request.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4 motion-safe:animate-fade-up motion-safe:[animation-delay:300ms]">
              <PrimaryButton />
              <Link
                href="/machinery"
                className="inline-flex min-h-12 items-center gap-2 border border-white/30 px-6 text-sm font-semibold text-white hover:border-white hover:bg-white hover:text-navy"
              >
                Explore machinery
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400 motion-safe:animate-fade-up motion-safe:[animation-delay:400ms]">
              Supplier or manufacturer?{' '}
              <Link href="#supplier-plans" className="font-semibold text-white underline decoration-orange-light underline-offset-4 hover:text-orange-light">
                See marketplace plans
              </Link>
            </p>
          </div>

          {/* RFQ sheet: shows exactly what a buyer fills in. */}
          <div className="relative motion-safe:animate-fade-up motion-safe:[animation-delay:350ms]">
            <RotatingBadge className="absolute -right-10 -top-20 hidden ring-8 ring-navy xl:flex" />
            <div className="border-t-4 border-orange bg-white p-7 text-navy shadow-2xl shadow-black/30 sm:p-9">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-xl font-bold">Request for quotation</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 xl:hidden">RFQ</span>
              </div>
              <dl className="mt-6 space-y-4">
                {rfqFields.map((field, i) => (
                  <div key={field} className="flex items-end gap-3 text-sm">
                    <dt className="shrink-0 text-xs font-bold text-orange-dark">{String(i + 1).padStart(2, '0')}</dt>
                    <dd className="flex-1 border-b border-dashed border-slate-300 pb-1 text-slate-600">{field}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm leading-6 text-slate-600">
                Eligible suppliers respond with quotations you can review in your workspace.
              </p>
              <Link
                href={QUOTE_HREF}
                className="group mt-6 flex min-h-12 items-center justify-between bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-deep"
              >
                Start your request
                <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Container>

        <div className="border-t border-white/10">
          <Container>
            <ul className="grid divide-white/10 sm:grid-cols-3 sm:divide-x">
              {highlights.map((h, i) => (
                <li key={h} className="flex items-center gap-4 py-5 sm:px-6 sm:first:pl-0">
                  <span className="font-display text-sm font-bold text-orange-light">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-medium text-slate-200">{h}</span>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden bg-orange py-5 text-white">
        <div className="flex w-max motion-safe:animate-marquee">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
              {marqueeItems.map((item) => (
                <li key={item} className="flex items-center gap-8 pr-8 font-display text-xl font-bold uppercase tracking-wide sm:text-2xl">
                  {item}
                  <span className="size-2 rotate-45 bg-white/60" aria-hidden="true" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <Suspense fallback={<Loading label="Loading machinery categories…" />}>
        <HomeCategories />
      </Suspense>

      <Suspense fallback={<Loading label="Loading current machinery…" cards />}>
        <HomeMachinery />
      </Suspense>

      {/* WHY IMET */}
      <section aria-labelledby="why-title" className="py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <Eyebrow>Why Machinmate</Eyebrow>
            <h2 id="why-title" className="mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-4xl lg:text-5xl">
              Built for the way industrial equipment is bought.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
              Machinery purchases are large, technical and rarely off the shelf. Machinmate
              keeps the details visible and the negotiation private.
            </p>
            <PrimaryButton className="mt-8" />
          </Reveal>
          <ol className="border-t border-slate-200">
            {reasons.map((r, i) => (
              <li key={r.title} className="border-b border-slate-200">
                <Reveal delay={i * 80} className="group flex gap-6 py-8">
                  <span className="flex size-14 shrink-0 items-center justify-center border border-slate-300 font-display text-lg font-bold text-navy transition-colors group-hover:border-orange group-hover:bg-orange group-hover:text-white">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-navy">{r.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{r.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" aria-label="How it works" className="scroll-mt-24 bg-navy py-20 text-white lg:py-28">
        <Container>
          <SectionHeading
            dark
            eyebrow="How it works"
            title="From first search to after-sales service"
            description="One workspace for buyers, from shortlisting machinery to receiving quotations and getting support."
          />
          <ol className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s, i) => (
              <li key={s.title} className="bg-navy">
                <Reveal delay={i * 90} className="group h-full p-6 transition-colors hover:bg-white/5 lg:p-7">
                  <span className="block font-display text-5xl font-black text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.45)] group-hover:[-webkit-text-stroke:1px_#f0a47f]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-8 font-display text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* MID CTA */}
      <section aria-label="Request a quote" className="bg-orange text-white">
        <Container className="flex flex-col items-start justify-between gap-8 py-14 md:flex-row md:items-center">
          <Reveal>
            <h2 className="max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Tell suppliers exactly what your production line needs.
            </h2>
            <p className="mt-3 text-white/90">One request. No buyer subscription.</p>
          </Reveal>
          <Link
            href={QUOTE_HREF}
            className="group inline-flex min-h-12 shrink-0 items-center gap-3 bg-white px-6 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
          >
            Request a quote
            <ArrowUpRight size={18} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </Container>
      </section>

      <Suspense fallback={<Loading label="Loading active suppliers…" cards />}>
        <HomeSuppliers />
      </Suspense>

      <Suspense fallback={<Loading label="Loading published buyer feedback…" cards />}>
        <HomeReviews />
      </Suspense>

      <Suspense fallback={<Loading label="Loading supplier plans…" cards />}>
        <HomePlans />
      </Suspense>

      {/* CLOSING CTA */}
      <section aria-labelledby="closing-title" className="relative isolate overflow-hidden border-b border-white/10 bg-navy text-white">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-[0.05em] top-1/2 -z-10 -translate-y-1/2 select-none font-display text-[clamp(7rem,22vw,20rem)] font-black leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.07)]"
        >
          RFQ
        </span>
        <Container className="grid items-center gap-10 py-20 lg:grid-cols-[1fr_auto] lg:py-28">
          <Reveal>
            <Eyebrow dark>Ready when you are</Eyebrow>
            <h2 id="closing-title" className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find your next machine on Machinmate.
            </h2>
            <div className="mt-9 flex flex-wrap gap-4">
              <PrimaryButton />
              <Link
                href="/suppliers"
                className="inline-flex min-h-12 items-center gap-2 border border-white/30 px-6 text-sm font-semibold text-white hover:border-white hover:bg-white hover:text-navy"
              >
                Find suppliers
              </Link>
            </div>
          </Reveal>
          <RotatingBadge className="relative hidden lg:flex" />
        </Container>
      </section>
    </>
  );
}
