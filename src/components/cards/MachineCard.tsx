import TranslatedText from '@/components/shared/TranslatedText';
import Link from 'next/link';
import { ArrowUpRight, BadgeCheck } from 'lucide-react';
import type { MachineSummary } from '@/types/catalogue';
import MachineImage from './MachineImage';
import Badge from '@/components/shared/Badge';
export default function MachineCard({ machine }: { machine: MachineSummary }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden border border-border bg-surface p-3 transition hover:border-border-strong hover:shadow-surface hover:shadow-primary/5 [&_img]:transition-transform [&_img]:duration-500 motion-safe:hover:[&_img]:scale-105">
      <Link
        href={`/machinery/${machine.slug}`}
        aria-label={`View ${machine.name}`}
        className="block rounded-lg"
      >
        <MachineImage image={machine.images[0]} alt={machine.name} />
      </Link>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <Badge>{machine.category.name}</Badge>
        <h2 className="mt-3 break-words text-card font-semibold leading-6">
          <Link
            className="hover:text-secondary"
            href={`/machinery/${machine.slug}`}
          >
            <TranslatedText
              resource={{ type: 'MACHINERY', id: machine.id, field: 'NAME' }}
              original={machine.name}
            />
          </Link>
        </h2>
        <p className="mb-4 mt-2 break-words text-meta text-muted-foreground">
          {machine.manufacturer} · {machine.model}
        </p>
        {machine.supplier && (
          <p className="mb-4 flex items-start gap-1.5 text-meta text-secondary">
            {machine.supplier.isVerified && (
              <BadgeCheck
                size={15}
                className="shrink-0 text-success-foreground"
                aria-label="Verified supplier"
              />
            )}
            <Link
              className="break-words hover:underline"
              href={`/suppliers/${machine.supplier.slug ?? machine.supplier.id}`}
            >
              {machine.supplier.companyName}
            </Link>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-surface-muted pt-3">
          <span className="text-meta font-semibold text-primary">
            Price on request
          </span>
          <Link
            href={`/machinery/${machine.slug}`}
            aria-label={`View details for ${machine.name}`}
            className="flex size-11 items-center justify-center rounded-md bg-surface-muted text-secondary group-hover:bg-primary group-hover:text-inverse"
          >
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
