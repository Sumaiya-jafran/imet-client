import SystemStatus from '@/components/shared/SystemStatus';
export default function HomePage() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-dark">
          Milestone 0
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy">
          iMet Machinery
        </h1>
        <p className="mt-5 max-w-lg leading-7 text-slate-600">
          The technical foundation for an industrial B2B machinery marketplace.
          Product features will be introduced in the following milestones.
        </p>
      </section>
      <SystemStatus />
    </div>
  );
}
