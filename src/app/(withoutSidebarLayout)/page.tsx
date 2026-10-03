import Link from 'next/link';
export default function HomePage() {
  return (
    <section className="py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-dark">
        Industrial machinery marketplace
      </p>
      <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight text-navy">
        Find machinery for your next production line
      </h1>
      <p className="mt-6 max-w-2xl leading-7 text-slate-600">
        Explore machinery by category, compare manufacturers and review
        technical specifications. Pricing is available on request.
      </p>
      <Link
        href="/machinery"
        className="mt-8 inline-block rounded-lg bg-navy px-6 py-3 font-semibold text-white"
      >
        Browse machinery
      </Link>
    </section>
  );
}
