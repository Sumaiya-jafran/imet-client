import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
export default function NotFound() {
  return (
    <section className="surface mx-auto max-w-xl p-6 text-center sm:p-10">
      <PackageSearch
        className="mx-auto mb-4 text-slate-500"
        size={32}
        aria-hidden="true"
      />
      <h1 className="text-2xl font-semibold text-navy">Machine not found</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This machine is no longer available or has not been published. Explore
        the catalogue for current equipment.
      </p>
      <Link href="/machinery" className="action-link mt-5">
        Browse machinery
      </Link>
    </section>
  );
}
