'use client';
import Button from '@/components/buttons/Button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="surface mx-auto my-8 max-w-xl p-6 sm:p-8">
      <h1 className="text-xl font-bold">Unable to load this page</h1>
      <p className="my-4">Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
