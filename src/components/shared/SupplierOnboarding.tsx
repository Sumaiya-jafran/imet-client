'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import LoadingState from './LoadingState';
import PageHeader from './PageHeader';
import SupplierProfileForm from '@/components/forms/SupplierProfileForm';
import { paymentApi } from '@/lib/api/payment.service';
import type { Onboarding } from '@/types/payment';
export default function SupplierOnboarding() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const [data, setData] = useState<Onboarding>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    paymentApi
      .onboarding(token)
      .then((r) => {
        if (active) {
          setData(r.data);
          setError('');
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : 'Unable to load subscription',
          );
      });
    return () => {
      active = false;
    };
  }, [token, attempt]);
  if (status === 'loading')
    return <LoadingState label="Loading supplier onboarding" />;
  if (!token || session?.error)
    return (
      <section className="surface p-6">
        <h1 className="text-xl font-semibold">
          Sign in to activate your supplier account
        </h1>
        <Link
          href="/auth/signin?callbackUrl=%2Fsubscription"
          className="mt-4 inline-block text-orange"
        >
          Sign in
        </Link>
      </section>
    );
  const pending = data?.payments.find((p) => p.status === 'PENDING');
  const review = data?.payments.find((p) => p.status === 'REVIEW');
  const active = data?.supplier.subscriptions.find(
    (t) =>
      t.isCurrent &&
      t.state === 'ACTIVE' &&
      new Date(t.startsAt) <= new Date() &&
      new Date(t.endsAt) > new Date(),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Supplier account"
        title="Activate your marketplace presence"
        description="Choose a plan, complete secure checkout and wait for backend payment verification. An administrator can also activate your account with an audited manual term."
      />
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
        >
          {error}{' '}
          <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
            Reload
          </Button>
        </p>
      )}
      {!data && !error && <LoadingState label="Loading company and plans" />}
      {data && (
        <>
          <section className="surface flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <h2 className="font-semibold">{data.supplier.companyName}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {data.supplier.type === 'LOCAL'
                  ? 'Local supplier / dealer'
                  : 'International manufacturer'}{' '}
                · {active ? 'Active subscription' : 'Activation pending'}
              </p>
            </div>
            {data.supplier.status === 'PENDING' && (
              <Button
                variant="secondary"
                onClick={() => setEdit((v) => !v)}
                disabled={!!pending || !!review}
              >
                Edit company / upload files
              </Button>
            )}
            {active && (
              <Link
                href="/dashboard/supplier"
                className="font-semibold text-orange"
              >
                Open dashboard
              </Link>
            )}
          </section>
          {edit && (
            <section className="surface p-5">
              <SupplierProfileForm
                token={token}
                supplier={data.supplier}
                mode="application"
                submitOverride={(body) =>
                  paymentApi.profile(token, body, data.supplier)
                }
                onSave={() => {
                  setEdit(false);
                  setAttempt((n) => n + 1);
                }}
                onCancel={() => setEdit(false)}
              />
            </section>
          )}
          {pending && (
            <section
              role="status"
              className="rounded-xl border border-orange/30 bg-orange/5 p-5"
            >
              <h2 className="font-semibold">
                A payment is awaiting confirmation
              </h2>
              <p className="my-2 text-sm">
                Check its status before starting another payment.
              </p>
              <Link
                className="font-semibold text-orange"
                href={`/payments/${pending.id}`}
              >
                Check payment status
              </Link>
            </section>
          )}
          {review && (
            <section
              role="status"
              className="rounded-xl border border-amber-300 bg-amber-50 p-5"
            >
              <h2 className="font-semibold">
                A payment needs administrator review
              </h2>
              <p className="my-2 text-sm">
                Contact iMet before making another payment.
              </p>
              <Link
                className="font-semibold text-orange"
                href={`/payments/${review.id}`}
              >
                View review status
              </Link>
            </section>
          )}
          {!active && !pending && !review && (
            <>
              {!data.onlineAvailable && (
                <p role="status" className="surface p-4">
                  Online activation is currently unavailable. Contact iMet for
                  manual activation.
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.plans.map((plan) => (
                  <section
                    key={plan.id}
                    className="surface flex flex-col gap-4 p-5"
                  >
                    <h2 className="text-lg font-semibold">{plan.name}</h2>
                    <p className="text-2xl font-semibold">
                      {plan.price}{' '}
                      <span className="text-sm text-slate-500">
                        {plan.currency}
                      </span>
                    </p>
                    <p className="text-sm text-slate-600">
                      {plan.durationDays} days · {plan.listingLimit} listings
                      <br />
                      {plan.rfqEnabled
                        ? 'RFQ access included'
                        : 'RFQ access not included'}{' '}
                      · {plan.visibility.toLowerCase()} visibility
                    </p>
                    <Button
                      disabled={
                        busy ||
                        !data.onlineAvailable ||
                        !data.currencies.includes(plan.currency) ||
                        Number(plan.price) <= 0
                      }
                      onClick={async () => {
                        setBusy(true);
                        setError('');
                        try {
                          const keyName = `imet-checkout-${data.supplier.id}-${plan.id}`;
                          let key = sessionStorage.getItem(keyName);
                          if (!key) {
                            key = crypto.randomUUID();
                            sessionStorage.setItem(keyName, key);
                          }
                          const payment = (
                            await paymentApi.checkout(token, plan.id, key)
                          ).data!;
                          if (payment.status !== 'PENDING')
                            sessionStorage.removeItem(keyName);
                          window.location.assign(
                            payment.gatewayUrl ?? `/payments/${payment.id}`,
                          );
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : 'Checkout unavailable',
                          );
                          setAttempt((n) => n + 1);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy
                        ? 'Preparing checkout…'
                        : 'Activate with SSLCOMMERZ'}
                    </Button>
                    {(!data.currencies.includes(plan.currency) ||
                      Number(plan.price) <= 0) && (
                      <p className="text-xs text-slate-500">
                        Contact iMet for manual activation of this plan.
                      </p>
                    )}
                  </section>
                ))}
              </div>
              {!data.plans.length && (
                <p className="surface p-5">
                  No active plans match your supplier type. Contact iMet.
                </p>
              )}
            </>
          )}
          {!!data.payments.length && (
            <section className="surface p-5">
              <h2 className="mb-3 font-semibold">Your payment history</h2>
              <ul className="divide-y divide-slate-100">
                {data.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                  >
                    <Link
                      href={`/payments/${p.id}`}
                      className="font-semibold text-orange"
                    >
                      {p.planName}
                    </Link>
                    <span>
                      {p.amount} {p.currency} · {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
