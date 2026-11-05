'use client';
import { useEffect, useState } from 'react';
import { healthService } from '@/lib/api/health.service';
import Button from '@/components/buttons/Button';
export default function SystemStatus() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    healthService
      .check(controller.signal)
      .then(() => setState('ready'))
      .catch(() => {
        if (!controller.signal.aborted) setState('error');
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <section
      aria-labelledby="status-heading"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h2 id="status-heading" className="text-card font-semibold text-primary">
        System connection
      </h2>
      <p role="status" className="mt-3 text-secondary">
        {state === 'loading'
          ? 'Checking the API and database…'
          : state === 'ready'
            ? 'API and database are connected.'
            : 'The API or database is unavailable. Check that the development services are running.'}
      </p>
      {state === 'error' && (
        <Button
          className="mt-4"
          onClick={() => {
            setState('loading');
            setAttempt((value) => value + 1);
          }}
        >
          Retry connection
        </Button>
      )}
    </section>
  );
}
