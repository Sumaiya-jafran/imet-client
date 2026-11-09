'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import LoadingState from './LoadingState';
import { apiClient } from '@/lib/api/client';
import { paymentApi } from '@/lib/api/payment.service';
import type { Payment } from '@/types/payment';
const labels = {
  REFUNDED: [
    'Payment refunded',
    'This transaction was refunded. Review your subscription history.',
  ],
  PENDING: [
    'Payment processing',
    'Confirmation may take a moment. Your account activates only after backend verification.',
  ],
  PAID: [
    'Payment verified',
    'Your payment was verified and the subscription was activated.',
  ],
  REVIEW: [
    'Payment requires review',
    'The payment is on hold. Contact Machinmate; do not make another payment.',
  ],
  FAILED: [
    'Payment failed',
    'No subscription was activated by this attempt. You can retry checkout.',
  ],
  CANCELLED: [
    'Payment cancelled',
    'No subscription was activated by this attempt. You can retry checkout.',
  ],
  EXPIRED: [
    'Payment expired',
    'This checkout attempt expired. You can start another attempt.',
  ],
} as const;
export default function SubscriptionPaymentStatus({ id }: { id: string }) {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const [payment, setPayment] = useState<Payment>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    async (reconcile = false) => {
      if (!token) return;
      try {
        const stored = await paymentApi.get(token, id);
        setPayment(stored.data);
        setError('');
        if (reconcile && stored.data?.status === 'PENDING') {
          const checked = await paymentApi.reconcile(token, id);
          setPayment(checked.data);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to check payment');
      }
    },
    [token, id],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      void load(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (payment?.status !== 'PENDING') return;
    const timer = setInterval(() => {
      void load(true);
    }, 16000);
    return () => clearInterval(timer);
  }, [load, payment?.status]);
  useEffect(() => {
    if (
      payment &&
      ['FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED'].includes(payment.status)
    ) {
      const prefix = `imet-checkout-${payment.supplierId}-${payment.planId}`;
      for (const key of Object.keys(sessionStorage))
        if (key === prefix || key.startsWith(`${prefix}-`))
          sessionStorage.removeItem(key);
    }
  }, [id, payment]);
  if (status === 'loading') return <LoadingState label="Loading payment" />;
  if (!token || session?.error)
    return (
      <section className="surface p-6">
        <h1 className="text-section font-semibold">
          Sign in to view your payment
        </h1>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(`/payments/${id}`)}`}
          className="text-secondary"
        >
          Sign in
        </Link>
      </section>
    );
  return (
    <section
      className="surface mx-auto my-10 max-w-2xl space-y-5 p-6 sm:p-8"
      aria-live="polite"
    >
      <p className="eyebrow">Secure subscription activation</p>
      <h1 className="text-section font-semibold">
        {payment ? labels[payment.status][0] : 'Checking payment…'}
      </h1>
      {error && (
        <p role="alert" className="text-danger-foreground">
          {error}
        </p>
      )}
      {payment && (
        <>
          <p className="text-nav text-secondary">{labels[payment.status][1]}</p>
          <dl className="grid gap-4 border-y border-border py-5 sm:grid-cols-2">
            <div>
              <dt className="text-meta text-muted-foreground">
                Company / plan
              </dt>
              <dd className="mt-1 font-semibold">
                {payment.companyName} · {payment.planName}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-muted-foreground">Amount</dt>
              <dd className="mt-1 font-semibold">
                {payment.amount} {payment.currency}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-meta text-muted-foreground">
                Transaction reference
              </dt>
              <dd className="mt-1 break-all font-sans text-nav">
                {payment.transactionId}
              </dd>
            </div>
          </dl>
          {payment.provider === 'MANUAL' && (
            <div className="space-y-2">
              <p>Manual payment: administrator verification required.</p>
              <p className="whitespace-pre-wrap">
                {payment.manualInstructions}
              </p>
              <p>Reference: {payment.paymentReference}</p>
              <p>{payment.decisionReason}</p>
            </div>
          )}
          {payment.status === 'REVIEW' && (
            <p className="text-nav">{payment.reviewReason}</p>
          )}
          {payment.status === 'PAID' && (
            <p className="text-nav">
              Current subscription: {payment.subscriptionStatus}. Payment
              history remains available after expiry.
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-3">
        {payment?.provider === 'MANUAL' && payment.status === 'PENDING' && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await apiClient.post(
                  `/payments/${id}/cancel-manual`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                await load();
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : 'Unable to withdraw request',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Withdraw pending manual request
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await load(true);
            setBusy(false);
          }}
        >
          {busy ? 'Checking…' : 'Check again'}
        </Button>
        {payment?.status === 'PENDING' && payment.gatewayUrl && (
          <a
            href={payment.gatewayUrl}
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-nav font-semibold text-foreground"
          >
            Continue checkout
          </a>
        )}
        <Link
          href={
            payment?.status === 'PAID' ? '/dashboard/supplier' : '/subscription'
          }
          className="inline-flex items-center px-3 text-nav font-semibold text-secondary"
        >
          {payment?.status === 'PAID'
            ? 'Open supplier dashboard'
            : 'Return to subscriptions'}
        </Link>
      </div>
    </section>
  );
}
