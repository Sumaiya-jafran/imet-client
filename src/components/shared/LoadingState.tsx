export default function LoadingState({
  label = 'Loading…',
  cards = false,
}: {
  label?: string;
  cards?: boolean;
}) {
  return (
    <div role="status" className="py-5">
      <p className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-500">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-orange motion-safe:animate-pulse"
        />
        {label}
      </p>
      <div
        aria-hidden="true"
        className={
          cards ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'
        }
      >
        {Array.from({ length: cards ? 6 : 3 }, (_, index) => (
          <div key={index} className="surface p-5 motion-safe:animate-pulse">
            {cards && (
              <div className="mb-4 aspect-[4/3] rounded-lg bg-slate-100" />
            )}
            <div className="h-3 w-1/3 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-3/4 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
