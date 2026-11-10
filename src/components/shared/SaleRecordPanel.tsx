'use client';
import PurchaseReviews from './PurchaseReviews';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { salesApi } from '@/lib/api/sales.service';
import type { SaleRecord } from '@/types/sales';
import Button from '@/components/buttons/Button';
import PageHeader from './PageHeader';
import Badge from './Badge';
import LoadingState from './LoadingState';
export default function SaleRecordPanel({
  id,
  buyer = false,
  admin = false,
}: {
  id: string;
  buyer?: boolean;
  admin?: boolean;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [sale, setSale] = useState<SaleRecord | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    salesApi
      .sale(token, id)
      .then((r) => {
        if (active) {
          setSale(r.data ?? null);
          setError('');
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : 'Unable to load sale');
      });
    return () => {
      active = false;
    };
  }, [token, id, revision]);
  if (!sale)
    return error ? (
      <div role="alert" className="surface p-5">
        {error}
        <Button onClick={() => setRevision((n) => n + 1)}>Retry</Button>
      </div>
    ) : (
      <LoadingState label="Loading sale record…" />
    );
  const base = buyer
    ? '/dashboard/purchases'
    : admin
      ? '/dashboard/admin/sales/history'
      : '/dashboard/sales/history';
  return (
    <div className="space-y-5 [&_dd]:break-words">
      {buyer && sale.status === 'COMPLETED' && (
        <Link
          className="action-link"
          href={`/dashboard/service-tickets/new?saleId=${sale.id}`}
        >
          Request machinery service
        </Link>
      )}
      <PageHeader
        eyebrow={sale.rfq.rfqNumber}
        title={sale.rfq.title}
        description={`Seller ${sale.sellerName} · Buyer ${sale.rfq.buyer.displayName}`}
        actions={
          <Badge
            tone={
              sale.status === 'COMPLETED'
                ? 'success'
                : sale.status === 'CANCELLED'
                  ? 'warning'
                  : 'neutral'
            }
          >
            {sale.status}
          </Badge>
        }
      />
      <div className="flex flex-wrap gap-3">
        <Link className="secondary-link" href={base}>
          Back to {buyer ? 'purchases' : 'sales history'}
        </Link>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-danger/5 p-3 text-danger-foreground"
        >
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
      {!buyer && sale.readOnlyReason && (
        <p
          role="status"
          className="rounded-lg border border-warning/25 bg-warning/5 p-3 text-nav text-warning-foreground"
        >
          {sale.readOnlyReason}
        </p>
      )}
      <section className="surface p-5">
        <p className="eyebrow">Accepted quotation</p>
        <p className="mt-3 break-words text-page font-semibold tracking-tight">
          {sale.totalAmount}{' '}
          <span className="text-body font-normal text-muted-foreground">
            {sale.quote.currency}
          </span>
        </p>
        <p className="mt-2 text-meta text-muted-foreground">
          {sale.rfq.quantity} {sale.rfq.unit} × {sale.quote.unitPrice}{' '}
          {sale.quote.currency}. Quoted value only; no payment is processed.
        </p>
        <dl className="mt-5 grid grid-cols-1 gap-4 text-nav sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Delivery</dt>
            <dd>
              {sale.rfq.deliveryLocation} · {sale.rfq.deliveryTimeline}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Commercial terms</dt>
            <dd>
              MOQ {sale.quote.moq} · Lead time {sale.quote.leadTimeDays} days
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Recorded</dt>
            <dd>{new Date(sale.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completion / cancellation</dt>
            <dd>
              {sale.completedAt
                ? new Date(sale.completedAt).toLocaleString()
                : sale.cancelledAt
                  ? new Date(sale.cancelledAt).toLocaleString()
                  : 'In progress'}
            </dd>
          </div>
        </dl>
        <p className="mt-5 whitespace-pre-wrap break-words text-nav">
          {sale.quote.notes}
        </p>
        {sale.cancellationReason && (
          <p className="mt-4 break-words rounded-lg bg-warning/5 p-3 text-nav text-warning-foreground">
            Cancellation reason: {sale.cancellationReason}
          </p>
        )}
      </section>
      {buyer && sale.status === 'COMPLETED' && <PurchaseReviews saleId={id} />}
      <p className="text-meta text-muted">
        Historical purchase record. The quotation workflow has been retired.
      </p>
    </div>
  );
}
