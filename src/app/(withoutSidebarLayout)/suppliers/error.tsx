'use client';
export default function Error() {
  return (
    <section role="alert">
      <h1 className="text-2xl font-bold">
        Supplier directory temporarily unavailable
      </h1>
      <button
        className="mt-4 rounded bg-navy px-4 py-2 text-white"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </section>
  );
}
