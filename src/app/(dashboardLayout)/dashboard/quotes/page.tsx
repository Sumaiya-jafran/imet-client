'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { rfqApi } from '@/lib/api/rfq.service';
import type { RfqQuote } from '@/types/rfq';
import PageHeader from '@/components/shared/PageHeader';
import LoadingState from '@/components/shared/LoadingState';
import Button from '@/components/buttons/Button';
export default function Page() {
  const { data: session } = useSession();
  const [result, setResult] = useState<{
    quotes: RfqQuote[];
    pagination: { page: number; totalPages: number; total: number };
  } | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState(new URLSearchParams());
  useEffect(() => {
    if (!session?.accessToken) return;
    let active = true;
    rfqApi
      .quotes(session.accessToken, query)
      .then((r) => {
        if (active) {
          setResult(r.data ?? null);
          setError('');
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : 'Unable to load quotes');
      });
    return () => {
      active = false;
    };
  }, [session, revision, query]);
  const paginate = (page: number) => {
    const q = new URLSearchParams(query);
    q.set('page', String(page));
    setQuery(q);
    setResult(null);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="My quotes"
        description="Your private offers and their status."
      />
      {error && (
        <div role="alert">
          {error}
          <Button onClick={() => setRevision((n) => n + 1)}>Retry</Button>
        </div>
      )}
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const q = new URLSearchParams();
          for (const [key, value] of data)
            if (String(value).trim()) q.set(key, String(value).trim());
          setQuery(q);
          setResult(null);
        }}
      >
        <label className="flex-1">
          Search RFQ
          <input name="q" maxLength={100} className="mt-1 w-full" />
        </label>
        <label>
          Status
          <select name="status" className="mt-1 w-full">
            <option value="">All statuses</option>
            {['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Button type="submit">Apply filters</Button>
      </form>
      {!result && !error && <LoadingState />}
      {result?.quotes.map((q) => (
        <article className="surface p-5" key={q.id}>
          <Link
            href={`/dashboard/leads/${q.recipientId}`}
            className="font-semibold underline"
          >
            {q.rfq?.rfqNumber} · {q.rfq?.title}
          </Link>
          <p className="mt-2 text-sm">
            {q.unitPrice} {q.currency} · {q.status} · Valid until{' '}
            {new Date(q.validUntil).toLocaleString()}
          </p>
        </article>
      ))}
      {result?.quotes.length === 0 && (
        <p className="surface p-5 text-slate-500">No matching quotes.</p>
      )}
      {result && (
        <nav
          aria-label="Quotes pagination"
          className="flex flex-wrap items-center gap-3"
        >
          <Button
            variant="secondary"
            disabled={result.pagination.page <= 1}
            onClick={() => paginate(result.pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {result.pagination.page} of{' '}
            {Math.max(1, result.pagination.totalPages)} ·{' '}
            {result.pagination.total} quotes
          </span>
          <Button
            variant="secondary"
            disabled={result.pagination.page >= result.pagination.totalPages}
            onClick={() => paginate(result.pagination.page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
