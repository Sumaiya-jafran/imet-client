'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { rfqApi } from '@/lib/api/rfq.service';
import type { RfqList } from '@/types/rfq';
import Button from '@/components/buttons/Button';
import Badge from '@/components/shared/Badge';
import PageHeader from '@/components/shared/PageHeader';
import LoadingState from '@/components/shared/LoadingState';
import EmptyState from '@/components/shared/EmptyState';
export default function RfqListPanel({
  scope = 'buyer',
}: {
  scope?: 'buyer' | 'admin' | 'leads';
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [result, setResult] = useState<RfqList>();
  const [query, setQuery] = useState(new URLSearchParams({ page: '1' }));
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [buyers, setBuyers] = useState<{ id: string; displayName: string }[]>(
    [],
  );
  const [recipients, setRecipients] = useState<
    {
      id: string;
      displayName: string;
      supplier: { companyName: string } | null;
    }[]
  >([]);
  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([
      rfqApi.list(token, query, scope),
      rfqApi.categories(token),
      scope === 'admin'
        ? rfqApi.candidates(token, '', true)
        : Promise.resolve(null),
      scope === 'admin' ? rfqApi.candidates(token) : Promise.resolve(null),
    ])
      .then(([r, c, b, p]) => {
        if (active) {
          setResult(r.data);
          setCategories(c.data ?? []);
          setBuyers(b?.data ?? []);
          setRecipients(p?.data ?? []);
          setError('');
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Unable to load requests');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, query, scope, revision]);
  const filter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const q = new URLSearchParams({ page: '1' });
    for (const [k, v] of f)
      if (String(v).trim()) {
        if (k === 'from' || k === 'to') {
          const d = new Date(`${v}T${k === 'from' ? '00:00:00' : '23:59:59'}`);
          if (!Number.isFinite(d.getTime())) continue;
          q.set(k, d.toISOString());
        } else q.set(k, String(v).trim());
      }
    setLoading(true);
    setQuery(q);
  };
  const page = Number(query.get('page') ?? 1);
  const paginate = (n: number) => {
    const q = new URLSearchParams(query);
    q.set('page', String(n));
    setLoading(true);
    setQuery(q);
  };
  if (session?.error) return <p role="alert">Sign in again to manage RFQs.</p>;
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          scope === 'admin'
            ? 'Administration'
            : scope === 'leads'
              ? 'Sales workspace'
              : 'Buyer workspace'
        }
        title={
          scope === 'admin'
            ? 'All RFQs'
            : scope === 'leads'
              ? 'Leads inbox'
              : 'My RFQs'
        }
        description={
          scope === 'leads'
            ? 'Review assigned requests and respond with private quotes.'
            : 'Track requests, compare private quotes and manage the next step.'
        }
        actions={
          scope === 'buyer' ? (
            <Link href="/dashboard/rfqs/new" className="action-link">
              Create RFQ
            </Link>
          ) : scope === 'admin' ? (
            <Link href="/dashboard/admin/leads" className="secondary-link">
              Lead overview
            </Link>
          ) : (
            <Link href="/dashboard/quotes" className="secondary-link">
              My quotes
            </Link>
          )
        }
      />
      <form
        onSubmit={filter}
        className="filter-bar grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label>
          Search requests
          <input
            name="q"
            maxLength={100}
            defaultValue={query.get('q') ?? ''}
            className="mt-1 w-full"
            placeholder="Title or RFQ number"
          />
        </label>
        <label>
          {scope === 'leads' ? 'Lead status' : 'RFQ status'}
          <select
            name={scope === 'leads' ? 'leadStatus' : 'status'}
            className="mt-1 w-full"
          >
            <option value="">All statuses</option>
            {(scope === 'leads'
              ? ['NEW', 'VIEWED', 'QUOTED', 'DECLINED', 'CLOSED']
              : [
                  'DRAFT',
                  'SUBMITTED',
                  'ROUTED',
                  'QUOTED',
                  'ACCEPTED',
                  'CLOSED',
                  'CANCELLED',
                  'EXPIRED',
                  'DECLINED',
                ]
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select name="categoryId" className="mt-1 w-full">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Created from
          <input type="date" name="from" className="mt-1 w-full" />
        </label>
        <label>
          Created through
          <input type="date" name="to" className="mt-1 w-full" />
        </label>
        {scope === 'admin' && (
          <>
            <label>
              Buyer
              <select name="buyerId" className="mt-1 w-full">
                <option value="">All buyers</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Recipient
              <select name="recipientId" className="mt-1 w-full">
                <option value="">All recipients</option>
                {recipients.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.supplier?.companyName ?? b.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Minimum private budget
              <input
                name="minValue"
                inputMode="decimal"
                className="mt-1 w-full"
              />
            </label>
            <label>
              Maximum private budget
              <input
                name="maxValue"
                inputMode="decimal"
                className="mt-1 w-full"
              />
            </label>
            <label>
              Budget currency
              <input
                name="currency"
                maxLength={3}
                className="mt-1 w-full"
                placeholder="BDT, USD…"
              />
            </label>
          </>
        )}
        <Button type="submit" disabled={loading}>
          Apply filters
        </Button>
      </form>
      {error && (
        <div role="alert">
          <p className="text-red-700">{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRevision((n) => n + 1);
            }}
          >
            Reload requests
          </Button>
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading requests…" />
      ) : result?.rfqs.length ? (
        <>
          <p className="text-xs text-slate-500">
            {result.pagination.total} requests
          </p>
          <div className="space-y-3">
            {result.rfqs.map((r) => (
              <article
                key={r.id}
                className="surface flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <p className="eyebrow">{r.rfqNumber}</p>
                  <h2 className="mt-1 break-words text-base font-semibold">
                    {r.title}
                  </h2>
                  <p className="mt-2 text-xs text-slate-500">
                    {r.category?.name ?? 'General request'} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={r.status === 'ACCEPTED' ? 'success' : 'neutral'}>
                    {scope === 'leads'
                      ? (r.recipients?.[0]?.leadStatus ?? r.status)
                      : r.status}
                  </Badge>
                  <Link
                    prefetch={false}
                    className="secondary-link"
                    href={
                      scope === 'leads'
                        ? `/dashboard/leads/${r.recipients?.[0]?.id}`
                        : scope === 'admin'
                          ? `/dashboard/admin/rfqs/${r.id}`
                          : `/dashboard/rfqs/${r.id}`
                    }
                  >
                    Open request
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <nav
            aria-label="RFQ pagination"
            className="flex flex-wrap items-center gap-3"
          >
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => paginate(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs">
              Page {page} of {Math.max(1, result.pagination.totalPages)}
            </span>
            <Button
              variant="secondary"
              disabled={page >= result.pagination.totalPages}
              onClick={() => paginate(page + 1)}
            >
              Next
            </Button>
          </nav>
        </>
      ) : (
        <EmptyState
          title={scope === 'leads' ? 'No leads found' : 'No requests found'}
          description={
            scope === 'leads'
              ? 'Assigned leads will appear here when you match a request and have available subscription entitlements.'
              : 'Adjust your filters or create a new request.'
          }
        />
      )}
    </div>
  );
}
