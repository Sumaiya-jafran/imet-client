'use client';
export default function CatalogueError() {
  return (
    <section role="alert">
      <h1 className="text-2xl font-bold">Catalogue temporarily unavailable</h1>
      <p className="mt-4">
        We could not load the machinery catalogue. Please try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-5 rounded bg-navy px-5 py-3 text-white"
      >
        Try again
      </button>
    </section>
  );
}
