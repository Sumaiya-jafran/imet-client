'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { saleCancellationSchema } from '@/lib/schema-validations/sales.schema';
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cancel, setCancel] = useState(false);
  const [revision, setRevision] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ reason: string }>({
    resolver: zodResolver(saleCancellationSchema),
    defaultValues: { reason: '' },
  });
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
  const update = async (status: 'COMPLETED' | 'CANCELLED', reason?: string) => {
    if (!token || !sale) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await salesApi.saleUpdate(token, sale, status, reason);
      const r = await salesApi.sale(token, id);
      setSale(r.data ?? null);
      setCancel(false);
      setNotice(
        status === 'COMPLETED' ? 'Sale marked completed.' : 'Sale cancelled.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update sale');
    } finally {
      setBusy(false);
    }
  };
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
        {!buyer && (
          <Link
            className="secondary-link"
            href={`${admin ? '/dashboard/admin/sales' : '/dashboard/sales'}/${sale.opportunityId}`}
          >
            Open opportunity
          </Link>
        )}
        {(buyer || admin) && (
          <Link
            className="secondary-link"
            href={`${admin ? '/dashboard/admin/rfqs' : '/dashboard/rfqs'}/${sale.rfq.id}`}
          >
            Open RFQ
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
      {!buyer && sale.readOnlyReason && (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {sale.readOnlyReason}
        </p>
      )}
      <section className="surface p-5">
        <p className="eyebrow">Accepted quotation</p>
        <p className="mt-3 break-words text-3xl font-semibold tracking-tight">
          {sale.totalAmount}{' '}
          <span className="text-base font-normal text-slate-500">
            {sale.quote.currency}
          </span>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {sale.rfq.quantity} {sale.rfq.unit} × {sale.quote.unitPrice}{' '}
          {sale.quote.currency}. Quoted value only; no payment is processed.
        </p>
        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Delivery</dt>
            <dd>
              {sale.rfq.deliveryLocation} · {sale.rfq.deliveryTimeline}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Commercial terms</dt>
            <dd>
              MOQ {sale.quote.moq} · Lead time {sale.quote.leadTimeDays} days
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Recorded</dt>
            <dd>{new Date(sale.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Completion / cancellation</dt>
            <dd>
              {sale.completedAt
                ? new Date(sale.completedAt).toLocaleString()
                : sale.cancelledAt
                  ? new Date(sale.cancelledAt).toLocaleString()
                  : 'In progress'}
            </dd>
          </div>
        </dl>
        <p className="mt-5 whitespace-pre-wrap break-words text-sm">
          {sale.quote.notes}
        </p>
        {sale.cancellationReason && (
          <p className="mt-4 break-words rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Cancellation reason: {sale.cancellationReason}
          </p>
        )}
      </section>
      {!buyer && sale.status === 'RECORDED' && (
        <section className="surface space-y-4 p-5">
          <h2 className="font-semibold">Manage sale record</h2>
          <p className="text-xs text-slate-500">
            Completion and cancellation are final record states. These actions
            do not change the accepted quotation or process a payment. Supplier
            changes require an active RFQ subscription.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !sale.canEdit}
              onClick={() => void update('COMPLETED')}
            >
              Mark sale completed
            </Button>
            <Button
              variant="danger"
              disabled={busy || !sale.canEdit}
              onClick={() => setCancel(!cancel)}
            >
              Cancel sale
            </Button>
          </div>
          {cancel && (
            <form
              className="space-y-3"
              onSubmit={handleSubmit((data) =>
                update('CANCELLED', data.reason),
              )}
            >
              <label htmlFor="sale-cancellation" className="block font-medium">
                Cancellation reason (visible to the buyer)
              </label>
              <textarea
                id="sale-cancellation"
                maxLength={2000}
                rows={3}
                {...register('reason')}
                className="w-full"
                aria-invalid={!!errors.reason}
                aria-describedby="sale-cancellation-error"
              />
              <p id="sale-cancellation-error" className="text-xs text-red-700">
                {errors.reason?.message}
              </p>
              <Button
                type="submit"
                variant="danger"
                disabled={busy || !sale.canEdit}
              >
                Confirm cancellation
              </Button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
