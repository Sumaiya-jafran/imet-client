'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { serviceTicketApi } from '@/lib/api/serviceTicket.service';
import type { TicketList } from '@/types/serviceTicket';
import Button from '@/components/buttons/Button';
import PageHeader from './PageHeader';
import Badge from './Badge';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
export default function ServiceTicketWorkspace({
  admin = false,
  assigned = false,
}: {
  admin?: boolean;
  assigned?: boolean;
}) {
  const { data: session } = useSession(),
    token = session?.accessToken;
  const [data, setData] = useState<TicketList>(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [query, setQuery] = useState(new URLSearchParams()),
    [revision, setRevision] = useState(0);
  const base = admin
    ? '/dashboard/admin/service-tickets'
    : assigned
      ? '/dashboard/service-management'
      : '/dashboard/service-tickets';
  useEffect(() => {
    if (!token) return;
    const c = new AbortController(),
      q = new URLSearchParams(query);
    q.set('view', assigned ? 'assigned' : 'customer');
    serviceTicketApi
      .list(token, q, admin, c.signal)
      .then((r) => {
        if (!c.signal.aborted) {
          setData(r.data);
          setError('');
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Unable to load tickets');
          setLoading(false);
        }
      });
    return () => c.abort();
  }, [token, query, revision, admin, assigned]);
  const move = (page: number) => {
    const q = new URLSearchParams(query);
    q.set('page', String(page));
    setQuery(q);
    setLoading(true);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          admin
            ? 'Administration'
            : assigned
              ? 'Service workspace'
              : 'After-sales support'
        }
        title={
          admin
            ? 'Service ticket management'
            : assigned
              ? 'Assigned service tickets'
              : 'My service tickets'
        }
        description="Track machinery issues, service progress, resolution and manual warranty reviews."
        actions={
          !admin && !assigned ? (
            <Link href="/dashboard/service-tickets/new" className="action-link">
              Request service
            </Link>
          ) : undefined
        }
      />
      <form
        className="surface grid items-end gap-3 p-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            q = new URLSearchParams();
          const search = String(f.get('q') ?? '').trim(),
            status = String(f.get('status') ?? '');
          if (search) q.set('q', search);
          if (status) q.set('status', status);
          setQuery(q);
          setLoading(true);
        }}
      >
        <div>
          <label htmlFor="ticket-search" className="block text-sm font-medium">
            Search issue or machinery
          </label>
          <input
            id="ticket-search"
            name="q"
            maxLength={100}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label
            htmlFor="ticket-filter-status"
            className="block text-sm font-medium"
          >
            Ticket status
          </label>
          <select
            id="ticket-filter-status"
            name="status"
            className="mt-1 w-full"
          >
            <option value="">All statuses</option>
            {[
              'OPEN',
              'UNDER_REVIEW',
              'ASSIGNED',
              'IN_PROGRESS',
              'RESOLVED',
              'CLOSED',
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={loading}>
          Filter tickets
        </Button>
      </form>
      {error && (
        <div role="alert" className="surface p-4 text-red-800">
          {error}
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRevision((v) => v + 1);
            }}
          >
            Reload tickets
          </Button>
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading service tickets…" />
      ) : data?.tickets.length ? (
        <section className="space-y-3" aria-label="Service tickets">
          <p className="text-sm text-slate-600">
            {data.pagination.total} tickets
          </p>
          {data.tickets.map((t) => (
            <article
              key={t.id}
              className="surface flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  {t.reference} · {new Date(t.createdAt).toLocaleDateString()}
                </p>
                <h2 className="break-words font-semibold">
                  <Link href={`${base}/${t.id}`} className="underline">
                    {t.subject}
                  </Link>
                </h2>
                <p className="break-words text-sm text-slate-600">
                  {t.machine.name} · {t.customer.displayName}
                </p>
                <p className="text-xs text-slate-500">
                  Assigned: {t.assignedTo?.displayName ?? 'Awaiting assignment'}
                </p>
              </div>
              <Badge
                tone={
                  t.status === 'CLOSED' || t.status === 'RESOLVED'
                    ? 'success'
                    : 'neutral'
                }
              >
                {t.status.replaceAll('_', ' ')}
              </Badge>
            </article>
          ))}
        </section>
      ) : (
        !error && (
          <EmptyState
            title="No matching service tickets"
            description="Adjust your filters, or submit a service request for an eligible completed purchase."
          />
        )
      )}
      {data && data.pagination.totalPages > 1 && (
        <nav
          aria-label="Service ticket pagination"
          className="flex flex-wrap items-center gap-3"
        >
          <Button
            variant="secondary"
            disabled={loading || data.pagination.page <= 1}
            onClick={() => move(data.pagination.page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={
              loading || data.pagination.page >= data.pagination.totalPages
            }
            onClick={() => move(data.pagination.page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
