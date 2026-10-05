'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { analyticsApi } from '@/lib/api/analytics.service';
import type { AnalyticsOverview, AuditList } from '@/types/analytics';
import Button from '@/components/buttons/Button';
import PageHeader from './PageHeader';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
const labels: Record<string, string> = {
  users: 'User accounts',
  userRoles: 'Role assignments',
  machinery: 'Machinery records',
  suppliers: 'Supplier profiles',
  supplierTypes: 'Supplier types',
  subscriptions: 'Current subscription terms',
  rfqs: 'RFQs',
  opportunities: 'Sales opportunities',
  sales: 'Sale records',
  reviews: 'Reviews',
  service: 'Service tickets',
  warranty: 'Warranty assessments',
  rfqEmails: 'RFQ email intents',
  serviceEmails: 'Service email intents',
};
const activityKeys = [
  'users',
  'machinery',
  'suppliers',
  'rfqs',
  'sales',
  'reviews',
  'service',
];
const humanize = (s: string) =>
  s
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (c) => c.toUpperCase());
const time = (s: string) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(s));
export default function AnalyticsWorkspace({
  audit = false,
}: {
  audit?: boolean;
}) {
  const { data: session } = useSession(),
    token = session?.accessToken;
  const [overview, setOverview] = useState<AnalyticsOverview>();
  const [logs, setLogs] = useState<AuditList>();
  const [query, setQuery] = useState(new URLSearchParams());
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token) return;
    const c = new AbortController();
    const run = async () => {
      try {
        if (audit) {
          const r = await analyticsApi.audit(token, query, c.signal);
          if (!c.signal.aborted) setLogs(r.data);
        } else {
          const r = await analyticsApi.overview(token, query, c.signal);
          if (!c.signal.aborted) setOverview(r.data);
        }
        if (!c.signal.aborted) {
          setError('');
          setLoading(false);
        }
      } catch (e) {
        if (!c.signal.aborted) {
          setError(
            e instanceof Error ? e.message : 'Unable to load operational data',
          );
          setLoading(false);
        }
      }
    };
    void run();
    return () => c.abort();
  }, [token, query, revision, audit]);
  const move = (page: number) => {
    const next = new URLSearchParams(query);
    next.set('page', String(page));
    setLoading(true);
    setQuery(next);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title={audit ? 'Audit log' : 'Operational analytics'}
        description={
          audit
            ? 'Read-only history of administrative changes and existing RFQ, sales and service events.'
            : 'A current operational snapshot with daily creation activity. Dates affect activity only.'
        }
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRevision((r) => r + 1);
            }}
          >
            Refresh
          </Button>
        }
      />
      <form
        className="surface grid items-end gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            q = new URLSearchParams();
          for (const [key, value] of f)
            if (typeof value === 'string' && value.trim())
              q.set(key, value.trim());
          const from = q.get('from'),
            to = q.get('to');
          if (
            !!from !== !!to ||
            (from &&
              to &&
              (from > to ||
                (Date.parse(to) - Date.parse(from)) / 86400000 >=
                  (audit ? 366 : 90)))
          ) {
            setError(
              `Choose both dates in order, at most ${audit ? 366 : 90} days apart (inclusive).`,
            );
            return;
          }
          setLoading(true);
          setQuery(q);
        }}
      >
        <label className="text-sm font-medium">
          From date
          <input name="from" type="date" className="mt-1 w-full" />
        </label>
        <label className="text-sm font-medium">
          To date
          <input name="to" type="date" className="mt-1 w-full" />
        </label>
        {audit && (
          <>
            <label className="text-sm font-medium">
              Source
              <select aria-label="Source" name="source" className="mt-1 w-full">
                <option value="">All sources</option>
                {['ADMIN', 'RFQ', 'SALES', 'SERVICE'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Action code
              <input
                name="action"
                placeholder="CATEGORY_CREATED"
                pattern="[A-Z][A-Z0-9_]{0,79}"
                maxLength={80}
                className="mt-1 w-full"
              />
            </label>
            <label className="text-sm font-medium">
              Resource type
              <select
                aria-label="Resource type"
                name="resourceType"
                className="mt-1 w-full"
              >
                <option value="">All resources</option>
                {[
                  'USER',
                  'CATEGORY',
                  'MACHINERY',
                  'SUPPLIER',
                  'SUBSCRIPTION_PLAN',
                  'SUBSCRIPTION',
                  'REVIEW',
                  'RFQ',
                  'SALES_OPPORTUNITY',
                  'SERVICE_TICKET',
                ].map((v) => (
                  <option key={v} value={v}>
                    {humanize(v)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Resource ID
              <input
                name="resourceId"
                placeholder="UUID"
                maxLength={36}
                className="mt-1 w-full"
              />
            </label>
            <label className="text-sm font-medium">
              Actor ID
              <input
                name="actorId"
                placeholder="UUID"
                maxLength={36}
                className="mt-1 w-full"
              />
            </label>
          </>
        )}
        <Button type="submit">Apply filters</Button>
        <p className="text-xs leading-5 text-slate-500 sm:col-span-2 xl:col-span-4">
          Asia/Dhaka calendar days · default last 30 days · maximum{' '}
          {audit ? 366 : 90} days
        </p>
      </form>
      {error && (
        <div
          role="alert"
          className="surface border-red-200 p-4 text-sm text-red-800"
        >
          {error}{' '}
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRevision((r) => r + 1);
            }}
          >
            Retry
          </Button>
        </div>
      )}
      {loading ? (
        <LoadingState />
      ) : (
        !error && (
          <>
            {!audit && overview && (
              <>
                <p className="text-xs text-slate-500">
                  Current snapshot as of {time(overview.asOf)} (Asia/Dhaka).
                  Includes all stored records, including drafts and inactive
                  accounts.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(overview.current).map(([key, group]) => (
                    <section
                      key={key}
                      className="surface p-4"
                      aria-label={labels[key] ?? key}
                    >
                      <h2 className="text-sm font-semibold text-slate-600">
                        {labels[key] ?? key}
                      </h2>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-navy">
                        {group.total.toLocaleString()}
                      </p>
                      <dl className="mt-3 space-y-2 text-xs">
                        {Object.entries(group.counts)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([status, count]) => (
                            <div
                              key={status}
                              className="flex justify-between gap-3"
                            >
                              <dt>{humanize(status)}</dt>
                              <dd className="font-semibold tabular-nums">
                                {count.toLocaleString()}
                              </dd>
                            </div>
                          ))}
                      </dl>
                      {!group.total && (
                        <p className="mt-3 text-xs text-slate-500">
                          No records yet.
                        </p>
                      )}
                      {key === 'userRoles' && (
                        <p className="mt-3 text-xs text-slate-500">
                          Accounts may have multiple roles. This total counts
                          assignments.
                        </p>
                      )}
                      {key.endsWith('Emails') && (
                        <p className="mt-3 text-xs text-slate-500">
                          Sent means accepted by the email provider, not
                          confirmed inbox delivery.
                        </p>
                      )}
                    </section>
                  ))}
                </div>
                <section className="surface min-w-0 p-4">
                  <h2 className="font-semibold">Daily creation activity</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {overview.activity.from} to {overview.activity.to} · new
                    records only; status changes are not counted.
                  </p>
                  <div
                    className="mt-4 overflow-x-auto"
                    tabIndex={0}
                    aria-label="Daily creation activity table"
                  >
                    <table className="w-full min-w-[700px] text-left text-xs">
                      <caption className="sr-only">
                        Daily new record counts in Asia/Dhaka
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col" className="p-2">
                            Date
                          </th>
                          {activityKeys.map((k) => (
                            <th scope="col" key={k} className="p-2 text-right">
                              {labels[k]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {overview.activity.days.map((d) => (
                          <tr
                            key={d.date}
                            className="border-t border-slate-100"
                          >
                            <th
                              scope="row"
                              className="whitespace-nowrap p-2 font-medium"
                            >
                              {d.date}
                            </th>
                            {activityKeys.map((k) => (
                              <td
                                key={k}
                                className="p-2 text-right tabular-nums"
                              >
                                {d.counts[k]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
            {audit && logs && (
              <>
                <p className="text-xs text-slate-500">
                  {logs.pagination.total.toLocaleString()} events ·{' '}
                  {logs.range.from} to {logs.range.to} · Asia/Dhaka. Historical
                  actor names reflect current accounts.
                </p>
                {!logs.entries.length ? (
                  <EmptyState
                    title="No matching audit events"
                    description="Try another date range or clear a filter."
                  />
                ) : (
                  <ol className="space-y-3">
                    {logs.entries.map((entry) => (
                      <li key={entry.id} className="surface min-w-0 p-4">
                        <div className="flex flex-wrap justify-between gap-2">
                          <h2 className="break-all text-sm font-semibold">
                            {humanize(entry.action)}
                          </h2>
                          <time
                            dateTime={entry.createdAt}
                            className="text-xs text-slate-500"
                          >
                            {time(entry.createdAt)}
                          </time>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {entry.source} · {humanize(entry.resourceType)}
                        </p>
                        <dl className="mt-3 grid min-w-0 gap-2 text-xs sm:grid-cols-2">
                          <div>
                            <dt className="font-medium text-slate-500">
                              Resource ID
                            </dt>
                            <dd className="mt-1 break-all font-mono">
                              {entry.resourceId}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-slate-500">
                              Actor
                            </dt>
                            <dd className="mt-1 break-words">
                              {entry.actor.displayName ??
                                'System / unavailable'}
                            </dd>
                            {entry.actor.id && (
                              <dd className="mt-1 break-all font-mono text-slate-500">
                                {entry.actor.id}
                              </dd>
                            )}
                          </div>
                        </dl>
                        {!!entry.context.changedFields.length && (
                          <p className="mt-3 break-words text-xs text-slate-600">
                            Changed fields:{' '}
                            {entry.context.changedFields.join(', ')}
                          </p>
                        )}
                        {(Object.keys(entry.context.before).length > 0 ||
                          Object.keys(entry.context.after).length > 0) && (
                          <details className="mt-3 text-xs">
                            <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-orange">
                              Safe state changes
                            </summary>
                            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                              {(['before', 'after'] as const).map((k) => (
                                <div key={k}>
                                  <h3 className="font-semibold">
                                    {humanize(k)}
                                  </h3>
                                  <dl className="mt-1 space-y-1">
                                    {Object.entries(entry.context[k]).map(
                                      ([field, v]) => (
                                        <div key={field} className="break-all">
                                          <dt className="inline text-slate-500">
                                            {humanize(field)}:{' '}
                                          </dt>
                                          <dd className="inline">
                                            {Array.isArray(v)
                                              ? v.join(', ')
                                              : String(v)}
                                          </dd>
                                        </div>
                                      ),
                                    )}
                                  </dl>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
                <nav
                  className="flex flex-wrap items-center justify-between gap-3"
                  aria-label="Audit pagination"
                >
                  <Button
                    variant="secondary"
                    disabled={logs.pagination.page <= 1}
                    onClick={() => move(logs.pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-slate-500">
                    Page {logs.pagination.page} of{' '}
                    {Math.max(1, logs.pagination.totalPages)}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={
                      logs.pagination.page >= logs.pagination.totalPages
                    }
                    onClick={() => move(logs.pagination.page + 1)}
                  >
                    Next
                  </Button>
                </nav>
              </>
            )}
          </>
        )
      )}
    </div>
  );
}
