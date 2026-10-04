import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="surface mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="text-3xl font-bold">Supplier not found</h1>
      <p className="mt-4">
        This supplier is not currently available in the marketplace.
      </p>
      <Link href="/suppliers" className="action-link mt-4">
        Browse suppliers
      </Link>
    </section>
  );
}
