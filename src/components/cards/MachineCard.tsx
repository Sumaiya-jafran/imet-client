import Link from 'next/link';
import type { MachineSummary } from '@/types/catalogue';
import MachineImage from './MachineImage';
export default function MachineCard({ machine }: { machine: MachineSummary }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <MachineImage image={machine.images[0]} />
      <p className="mt-4 text-sm text-slate-500">{machine.category.name}</p>
      <h2 className="mt-1 break-words text-xl font-semibold text-navy">
        <Link className="hover:underline" href={`/machinery/${machine.slug}`}>
          {machine.name}
        </Link>
      </h2>
      <p className="mt-2 break-words text-sm text-slate-600">
        {machine.manufacturer} · {machine.model}
      </p>
      <p className="mt-4 font-medium text-orange-dark">Price on request</p>
    </article>
  );
}
