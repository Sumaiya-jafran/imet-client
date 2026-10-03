import Link from 'next/link';
export default function NotFound() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Supplier not found</h1>
      <p className="mt-4">
        This supplier is not currently available in the marketplace.
      </p>
      <Link href="/suppliers" className="mt-4 inline-block underline">
        Browse suppliers
      </Link>
    </section>
  );
}
