'use client';
export default function CatalogueError() {
  return (
    <section role="alert" className="surface mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Machinery temporarily unavailable</h1>
      <p className="mt-4">
        We could not load the requested machinery. Retry to keep your current
        filters.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="action-link mt-5"
      >
        Try again
      </button>
    </section>
  );
}
