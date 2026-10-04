'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { salesApi } from '@/lib/api/sales.service';
import type { SalesDetail } from '@/types/sales';
import Button from '@/components/buttons/Button';
import SalesNotesForm from '@/components/forms/SalesNotesForm';
import PageHeader from './PageHeader';
import Badge from './Badge';
import LoadingState from './LoadingState';
export default function SalesOpportunityPanel({
  id,
  admin = false,
}: {
  id: string;
  admin?: boolean;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [o, setOpportunity] = useState<SalesDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    salesApi
      .detail(token, id)
      .then((r) => {
        if (active) {
          setOpportunity(r.data ?? null);
          setError('');
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : 'Unable to load opportunity',
          );
      });
    return () => {
      active = false;
    };
  }, [token, id, revision]);
  const run = async (action: () => Promise<unknown>, message: string) => {
    if (!token) return;
    setBusy(true);
    setNotice('');
    setError('');
    try {
      await action();
      const r = await salesApi.detail(token, id);
      setOpportunity(r.data ?? null);
      setNotice(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  };
  if (!o)
    return error ? (
      <div role="alert" className="surface p-5">
        <p>{error}</p>
        <Button onClick={() => setRevision((n) => n + 1)}>Retry</Button>
      </div>
    ) : (
      <LoadingState label="Loading opportunity…" />
    );
  if (!token) return null;
  const base = admin ? '/dashboard/admin/sales' : '/dashboard/sales';
  const rfqPath = admin
    ? `/dashboard/admin/rfqs/${o.rfq.id}`
    : `/dashboard/leads/${o.leadId}`;
  const open =
    ['ROUTED', 'QUOTED'].includes(o.rfq.status) &&
    !o.assignmentRemoved &&
    !o.rfq.isFlagged &&
    !!o.rfq.expiresAt &&
    new Date(o.rfq.expiresAt) > new Date();
  return (
    <div className="space-y-5 [&_dd]:break-words">
      <PageHeader
        eyebrow={o.rfq.rfqNumber}
        title={o.rfq.title}
        description={`Assigned to ${o.ownerName} · Buyer ${o.rfq.buyer.displayName}`}
        actions={
          <Badge
            tone={
              o.stage === 'WON'
                ? 'success'
                : o.stage === 'LOST'
                  ? 'warning'
                  : 'neutral'
            }
          >
            {o.stage}
          </Badge>
        }
      />
      <div className="flex flex-wrap gap-3">
        <Link className="secondary-link" href={base}>
          Back to pipeline
        </Link>
        {(admin || !o.assignmentRemoved) && (
          <Link className="secondary-link" href={rfqPath}>
            {admin ? 'Open RFQ' : 'Open lead, quotes & conversation'}
          </Link>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setRevision((n) => n + 1)}
          >
            Reload current record
          </button>
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-emerald-900"
        >
          {notice}
        </p>
      )}
      {o.readOnlyReason && (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {o.readOnlyReason}
        </p>
      )}
      <section className="surface space-y-4 p-5">
        <h2 className="font-semibold">Opportunity progress</h2>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {['NEW', 'QUALIFIED', 'QUOTED', 'NEGOTIATION', 'WON', 'LOST'].map(
            (stage) => (
              <li
                key={stage}
                className={`rounded-lg border p-3 text-xs font-semibold ${o.stage === stage ? 'border-orange/40 bg-orange/5 text-orange-dark' : 'border-slate-200 text-slate-500'}`}
              >
                {stage}
              </li>
            ),
          )}
        </ol>
        <p className="text-sm text-slate-500">
          Quote submission sets Quoted. Buyer acceptance sets Won; competing and
          closed unsuccessful opportunities become Lost. Qualification and
          negotiation are private sales stages.
        </p>
        <div className="flex flex-wrap gap-2">
          {open && o.stage === 'NEW' && (
            <Button
              disabled={busy || !o.canEdit}
              onClick={() =>
                void run(
                  () =>
                    salesApi.update(token, id, {
                      updatedAt: o.updatedAt,
                      stage: 'QUALIFIED',
                    }),
                  'Opportunity qualified.',
                )
              }
            >
              Mark qualified
            </Button>
          )}
          {open && o.stage === 'QUOTED' && (
            <Button
              disabled={busy || !o.canEdit}
              onClick={() =>
                void run(
                  () =>
                    salesApi.update(token, id, {
                      updatedAt: o.updatedAt,
                      stage: 'NEGOTIATION',
                    }),
                  'Negotiation started.',
                )
              }
            >
              Start negotiation
            </Button>
          )}
          {o.stage === 'WON' &&
            !o.sale &&
            !o.rfq.isFlagged &&
            !o.assignmentRemoved && (
              <Button
                disabled={busy || !o.canEdit}
                onClick={() =>
                  void run(
                    () => salesApi.record(token, id, o.updatedAt),
                    'Sale recorded from the accepted quote.',
                  )
                }
              >
                Record sale
              </Button>
            )}
          {o.sale && (
            <Link className="action-link" href={`${base}/history/${o.sale.id}`}>
              View sale · {o.sale.status}
            </Link>
          )}
        </div>
        {o.assignmentRemoved && (
          <p className="text-sm text-amber-800">
            This assignment was removed. History remains available; changes are
            restricted.
          </p>
        )}
        {o.rfq.isFlagged && (
          <p className="text-sm text-amber-800">
            RFQ is flagged for review. Sales changes are paused.
          </p>
        )}
        <p className="text-xs text-slate-500">
          Suppliers need an approved profile and active RFQ subscription for
          changes. Expired subscriptions retain read-only history.
        </p>
      </section>
      <section className="surface p-5">
        <h2 className="mb-4 font-semibold">Buyer requirements</h2>
        <p className="whitespace-pre-wrap break-words text-sm">
          {o.rfq.description}
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Machinery</dt>
            <dd>{o.rfq.machine?.name ?? o.rfq.title}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Quantity</dt>
            <dd>
              {o.rfq.quantity} {o.rfq.unit}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Delivery</dt>
            <dd>
              {o.rfq.deliveryLocation} · {o.rfq.deliveryTimeline}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">RFQ status / expiry</dt>
            <dd>
              {o.rfq.status} ·{' '}
              {o.rfq.expiresAt
                ? new Date(o.rfq.expiresAt).toLocaleDateString()
                : 'Not submitted'}
            </dd>
          </div>
        </dl>
      </section>
      <section className="surface p-5">
        <h2 className="mb-4 font-semibold">Recipient quotations</h2>
        {!o.quotes.length && (
          <p className="text-sm text-slate-500">
            No quote yet. Open the lead to prepare a quotation.
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {o.quotes.map((q) => (
            <article
              key={q.id}
              className="min-w-0 rounded-lg border border-slate-200 p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <p className="break-words font-semibold">
                  {q.unitPrice} {q.currency} / {o.rfq.unit}
                </p>
                <Badge>{q.status}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                MOQ {q.moq} · {q.leadTimeDays} days lead time · Valid until{' '}
                {new Date(q.validUntil).toLocaleDateString()}
              </p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                {q.notes}
              </p>
            </article>
          ))}
        </div>
      </section>
      <SalesNotesForm
        key={o.updatedAt}
        notes={o.internalNotes}
        busy={busy}
        readOnly={!o.canEdit}
        onSave={(notes) =>
          run(
            () =>
              salesApi.update(token, id, {
                updatedAt: o.updatedAt,
                internalNotes: notes,
              }),
            'Internal notes saved.',
          )
        }
      />
      <section className="surface p-5">
        <h2 className="mb-4 font-semibold">Sales activity</h2>
        <ol className="space-y-3 text-sm">
          {o.events.map((e) => (
            <li key={e.id}>
              <p className="font-medium">
                {e.eventType.replaceAll('_', ' ').toLowerCase()}
              </p>
              <p className="text-xs text-slate-500">
                {e.actor?.displayName ?? 'System'} ·{' '}
                {new Date(e.createdAt).toLocaleString()}
              </p>
              {typeof e.metadata === 'object' &&
                e.metadata !== null &&
                'from' in e.metadata &&
                'to' in e.metadata && (
                  <p className="mt-1 text-xs text-slate-500">
                    {String(e.metadata.from)} → {String(e.metadata.to)}
                  </p>
                )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
