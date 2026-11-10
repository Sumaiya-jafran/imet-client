'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { salesApi } from '@/lib/api/sales.service';
import type { SalesHistory } from '@/types/sales';
import Button from '@/components/buttons/Button';
import PageHeader from './PageHeader';
import Badge from './Badge';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
const localDate = (value: string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export default function SalesWorkspace({
  admin = false,

  buyer = false,
}: {
  admin?: boolean;
  records?: boolean;
  buyer?: boolean;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [query, setQuery] = useState(new URLSearchParams());
  const [history, setHistory] = useState<SalesHistory | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    const q = new URLSearchParams(query);
    if (buyer) q.set('view', 'buyer');
    const request = salesApi.history(token, q, admin);
    request
      .then((r) => {
        if (!active) return;
        setHistory(r.data as SalesHistory);
        setError('');
        setLoading(false);
      })
      .catch((e) => {
        if (active) {
          setError(
            e instanceof Error ? e.message : 'Unable to load sales workspace',
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, query, buyer, admin, revision]);
  const base = admin ? '/dashboard/admin/sales' : '/dashboard/sales';
  const pagination = history?.pagination;
  const apply = (q: URLSearchParams) => {
    setQuery(q);
    setLoading(true);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          admin
            ? 'Administration'
            : buyer
              ? 'Buyer workspace'
              : 'Sales workspace'
        }
        title={buyer ? 'My purchases' : 'Sales history'}
        description="View historical recorded, completed and cancelled purchases."
      />
      <form
        key={query.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          const q = new URLSearchParams();
          for (const [key, value] of new FormData(e.currentTarget)) {
            const text = String(value).trim();
            if (text)
              q.set(
                key,
                key === 'from'
                  ? new Date(`${text}T00:00:00`).toISOString()
                  : key === 'to'
                    ? new Date(`${text}T23:59:59.999`).toISOString()
                    : text,
              );
          }
          apply(q);
        }}
        className="filter-bar grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label>
          Search historical purchases
          <input
            name="q"
            maxLength={100}
            className="mt-1 w-full"
            placeholder="Historical title or reference"
            defaultValue={query.get('q') ?? ''}
          />
        </label>
        <label>
          Sale status
          <select
            name="status"
            className="mt-1 w-full"
            defaultValue={query.get('status') ?? ''}
          >
            <option value="">All statuses</option>
            {['RECORDED', 'COMPLETED', 'CANCELLED'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Created from
          <input
            name="from"
            type="date"
            className="mt-1 w-full"
            defaultValue={
              query.get('from') ? localDate(query.get('from')!) : ''
            }
          />
        </label>
        <label>
          Created through
          <input
            name="to"
            type="date"
            className="mt-1 w-full"
            defaultValue={query.get('to') ? localDate(query.get('to')!) : ''}
          />
        </label>
        <label>
          Sort by
          <select
            name="sort"
            className="mt-1 w-full"
            defaultValue={query.get('sort') ?? 'updatedAt'}
          >
            <option value="updatedAt">Last activity</option>
            <option value="createdAt">Creation date</option>
          </select>
        </label>
        <label>
          Order
          <select
            name="direction"
            className="mt-1 w-full"
            defaultValue={query.get('direction') ?? 'desc'}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
        <Button type="submit" disabled={loading}>
          Apply filters
        </Button>
        <Button
          variant="secondary"
          onClick={() => apply(new URLSearchParams())}
        >
          Clear filters
        </Button>
      </form>
      {error && (
        <div role="alert" className="surface p-4">
          <p className="text-danger-foreground">{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRevision((n) => n + 1);
            }}
          >
            Retry
          </Button>
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading sales workspace…" />
      ) : (
        !error && (
          <>
            <p className="text-meta text-muted-foreground">
              {pagination?.total ?? 0} sale records
            </p>
            <div className="space-y-3">
              {history?.records.map((s) => (
                <article
                  key={s.id}
                  className="surface flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div className="min-w-0">
                    <p className="eyebrow">{s.rfq.rfqNumber}</p>
                    <h2 className="mt-1 break-words font-semibold">
                      {s.rfq.title}
                    </h2>
                    <p className="mt-2 break-words text-meta text-muted-foreground">
                      {s.sellerName} · {s.rfq.quantity} {s.rfq.unit}
                    </p>
                    <p className="mt-2 break-words font-semibold">
                      {s.totalAmount} {s.quote.currency}
                      <span className="ml-2 text-meta font-normal text-muted-foreground">
                        Quoted total
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      tone={
                        s.status === 'COMPLETED'
                          ? 'success'
                          : s.status === 'CANCELLED'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {s.status}
                    </Badge>
                    <Link
                      prefetch={false}
                      className="secondary-link"
                      href={
                        buyer
                          ? `/dashboard/purchases/${s.id}`
                          : `${base}/history/${s.id}`
                      }
                    >
                      View sale
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {pagination?.total === 0 && (
              <EmptyState
                title="No historical sale records found"
                description="Existing purchase records appear here."
              />
            )}{' '}
            {pagination && pagination.total > 0 && (
              <nav
                className="flex flex-wrap items-center gap-3"
                aria-label="Sales pagination"
              >
                <Button
                  variant="secondary"
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    const q = new URLSearchParams(query);
                    q.set('page', String(pagination.page - 1));
                    apply(q);
                  }}
                >
                  Previous
                </Button>
                <span className="text-nav">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => {
                    const q = new URLSearchParams(query);
                    q.set('page', String(pagination.page + 1));
                    apply(q);
                  }}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )
      )}
    </div>
  );
}
