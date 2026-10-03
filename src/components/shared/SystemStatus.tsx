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
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 id="status-heading" className="text-lg font-semibold text-navy">
        System connection
      </h2>
      <p role="status" className="mt-3 text-slate-600">
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
