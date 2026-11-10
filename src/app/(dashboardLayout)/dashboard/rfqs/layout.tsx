import Link from 'next/link';
export default function Layout() {
  return (
    <section className="surface space-y-4 p-6">
      <h1 className="text-page font-bold">RFQ workflow retired</h1>
      <p className="text-muted">
        Contact suppliers directly from their machinery listings. Historical RFQ
        records are preserved in the database and authorized read-only APIs.
      </p>
      <Link
        href="/machinery"
        className="font-semibold text-secondary underline"
      >
        Browse machinery
      </Link>
    </section>
  );
}
