import TranslatedText from '@/components/shared/TranslatedText';
import Link from 'next/link';
import { ArrowUpRight, BadgeCheck } from 'lucide-react';
import type { MachineSummary } from '@/types/catalogue';
import MachineImage from './MachineImage';
import Badge from '@/components/shared/Badge';
export default function MachineCard({ machine }: { machine: MachineSummary }) {
  return (
    <article className="surface group min-w-0 overflow-hidden p-3 transition hover:border-slate-300 hover:shadow-md">
      <Link
        href={`/machinery/${machine.slug}`}
        aria-label={`View $<TranslatedText resource={{ type: 'MACHINERY', id: machine.id, field: 'NAME' }} original={machine.name} />`}
        className="block rounded-lg"
      >
        <MachineImage image={machine.images[0]} />
      </Link>
      <div className="px-2 pb-2 pt-4">
        <Badge>{machine.category.name}</Badge>
        <h2 className="mt-3 break-words text-lg font-semibold leading-6">
          <Link
            className="hover:text-orange-dark"
            href={`/machinery/${machine.slug}`}
          >
            <TranslatedText
              resource={{ type: 'MACHINERY', id: machine.id, field: 'NAME' }}
              original={machine.name}
            />
          </Link>
        </h2>
        <p className="mt-2 break-words text-xs text-slate-500">
          {machine.manufacturer} · {machine.model}
        </p>
        {machine.supplier && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-600">
            {machine.supplier.isVerified && (
              <BadgeCheck
                size={15}
                className="shrink-0 text-emerald-700"
                aria-label="Verified supplier"
              />
            )}
            <Link
              className="break-words hover:underline"
              href={`/suppliers/${machine.supplier.id}`}
            >
              {machine.supplier.companyName}
            </Link>
          </p>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-navy">
            Price on request
          </span>
          <Link
            href={`/machinery/${machine.slug}`}
            aria-label={`View details for $<TranslatedText resource={{ type: 'MACHINERY', id: machine.id, field: 'NAME' }} original={machine.name} />`}
            className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-navy group-hover:text-white"
          >
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
