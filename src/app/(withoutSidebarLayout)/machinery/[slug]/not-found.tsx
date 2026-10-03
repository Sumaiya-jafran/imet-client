import Link from 'next/link';
export default function NotFound() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Machine not found</h1>
      <p className="mt-4">
        This machine is unavailable or has not been published.
      </p>
      <Link href="/machinery" className="mt-5 inline-block underline">
        Browse machinery
      </Link>
    </section>
  );
}
