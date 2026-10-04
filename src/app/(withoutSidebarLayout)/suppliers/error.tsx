'use client';
export default function Error() {
  return (
    <section role="alert" className="surface mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="text-2xl font-bold">
        Supplier directory temporarily unavailable
      </h1>
      <button
        className="action-link mt-4"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </section>
  );
}
