import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="surface mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="text-3xl font-bold">Machine not found</h1>
      <p className="mt-4">
        This machine is unavailable or has not been published.
      </p>
      <Link href="/machinery" className="action-link mt-5">
        Browse machinery
      </Link>
    </section>
  );
}
