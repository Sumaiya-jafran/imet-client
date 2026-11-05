import { PackageSearch } from 'lucide-react';
import type { ReactNode } from 'react';
export default function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
      <span className="mb-5 flex size-12 items-center justify-center bg-navy text-white">
        <PackageSearch size={23} aria-hidden="true" />
      </span>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
