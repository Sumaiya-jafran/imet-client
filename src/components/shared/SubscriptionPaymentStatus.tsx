'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import LoadingState from './LoadingState';
import { paymentApi } from '@/lib/api/payment.service';
import type { Payment } from '@/types/payment';
const labels = {
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
    'The payment is on hold. Contact iMet; do not make another payment.',
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
    if (payment && ['FAILED', 'CANCELLED', 'EXPIRED'].includes(payment.status))
      sessionStorage.removeItem(
        `imet-checkout-${payment.supplierId}-${payment.planId}`,
      );
  }, [id, payment]);
  if (status === 'loading') return <LoadingState label="Loading payment" />;
  if (!token || session?.error)
    return (
      <section className="surface p-6">
        <h1 className="text-xl font-semibold">Sign in to view your payment</h1>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(`/payments/${id}`)}`}
          className="text-orange"
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
      <h1 className="text-2xl font-semibold">
        {payment ? labels[payment.status][0] : 'Checking payment…'}
      </h1>
      {error && (
        <p role="alert" className="text-red-800">
          {error}
        </p>
      )}
      {payment && (
        <>
          <p className="text-sm text-slate-600">{labels[payment.status][1]}</p>
          <dl className="grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Company / plan</dt>
              <dd className="mt-1 font-semibold">
                {payment.companyName} · {payment.planName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Amount</dt>
              <dd className="mt-1 font-semibold">
                {payment.amount} {payment.currency}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Transaction reference</dt>
              <dd className="mt-1 break-all font-mono text-sm">
                {payment.transactionId}
              </dd>
            </div>
          </dl>
          {payment.status === 'REVIEW' && (
            <p className="text-sm">{payment.reviewReason}</p>
          )}
          {payment.status === 'PAID' && (
            <p className="text-sm">
              Current subscription: {payment.subscriptionStatus}. Payment
              history remains available after expiry.
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-3">
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
            className="inline-flex items-center rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white"
          >
            Continue checkout
          </a>
        )}
        <Link
          href={
            payment?.status === 'PAID' ? '/dashboard/supplier' : '/subscription'
          }
          className="inline-flex items-center px-3 text-sm font-semibold text-orange"
        >
          {payment?.status === 'PAID'
            ? 'Open supplier dashboard'
            : 'Return to subscriptions'}
        </Link>
      </div>
    </section>
  );
}
