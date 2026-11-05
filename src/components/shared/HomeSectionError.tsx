'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/buttons/Button';
export default function HomeSectionError({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div role="alert" className="surface p-5">
      <p className="text-nav text-secondary">
        {label} is temporarily unavailable. You can still explore the rest of
        Machinmate.
      </p>
      <Button
        className="mt-3"
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? 'Refreshing…' : 'Retry section'}
      </Button>
    </div>
  );
}
