'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { rfqApi } from '@/lib/api/rfq.service';
import type { LeadOverview } from '@/types/rfq';
import PageHeader from '@/components/shared/PageHeader';
import LoadingState from '@/components/shared/LoadingState';
import Button from '@/components/buttons/Button';
export default function Page() {
  const { data: session } = useSession();
  const [rows, setRows] = useState<LeadOverview[] | null>(null);
  const [query, setQuery] = useState(new URLSearchParams());
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
  });
  const paginate = (page: number) => {
    const q = new URLSearchParams(query);
    q.set('page', String(page));
    setQuery(q);
    setRows(null);
  };
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!session?.accessToken) return;
    let active = true;
    rfqApi
      .overview(session.accessToken, query)
      .then((r) => {
        if (active) {
          setRows(r.data?.suppliers ?? []);
          setPagination(
            r.data?.pagination ?? { page: 1, totalPages: 0, total: 0 },
          );
          setError('');
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : 'Unable to load lead overview',
          );
      });
    return () => {
      active = false;
    };
  }, [session, revision, query]);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Lead overview"
        description="Supplier allocation, response rate and current monthly usage."
      />
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new URLSearchParams();
          const search = String(
            new FormData(e.currentTarget).get('q') ?? '',
          ).trim();
          if (search) q.set('q', search);
          setQuery(q);
          setRows(null);
        }}
      >
        <label className="flex-1 text-sm">
          Search suppliers
          <input name="q" maxLength={100} className="mt-1 w-full" />
        </label>
        <Button type="submit">Apply filter</Button>
      </form>
      {error && (
        <div role="alert">
          {error}
          <Button onClick={() => setRevision((n) => n + 1)}>Retry</Button>
        </div>
      )}
      {!rows && !error && <LoadingState />}
      <div className="grid gap-3 sm:grid-cols-2">
        {rows?.map((r) => (
          <article key={r.id} className="surface p-5">
            <h2 className="font-semibold">{r.companyName}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Allocated leads</dt>
                <dd>{r.totalLeads}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Responses</dt>
                <dd>
                  {r.responses} ({r.responseRate}%)
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Monthly usage / cap</dt>
                <dd>
                  {r.monthlyUsage} / {r.leadLimitPerMonth ?? 'Unlimited'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">RFQ entitlement</dt>
                <dd>{r.rfqEnabled ? 'Enabled' : 'Disabled'}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      {rows && (
        <nav
          aria-label="Supplier lead pagination"
          className="flex flex-wrap items-center gap-3"
        >
          <Button
            variant="secondary"
            disabled={pagination.page <= 1}
            onClick={() => paginate(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} ·{' '}
            {pagination.total} suppliers
          </span>
          <Button
            variant="secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => paginate(pagination.page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
      {rows?.length === 0 && <p className="surface p-5">No suppliers yet.</p>}
    </div>
  );
}
