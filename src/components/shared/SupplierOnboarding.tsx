'use client';
import PlanCheckout from './PlanCheckout';
import { supplierTypeLabels } from '@/types/supplier';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import LoadingState from './LoadingState';
import PageHeader from './PageHeader';
import SupplierProfileForm from '@/components/forms/SupplierProfileForm';
import { paymentApi } from '@/lib/api/payment.service';
import type { Onboarding } from '@/types/payment';
export default function SupplierOnboarding({
  initialPlan,
}: {
  initialPlan?: string;
}) {
  const { data: session, status, update } = useSession();
  const token = session?.accessToken;
  const [data, setData] = useState<Onboarding>();
  const [error, setError] = useState('');
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
        <h1 className="text-section font-semibold">
          Sign in to activate your supplier account
        </h1>
        <Link
          href="/auth/signin?callbackUrl=%2Fsubscription"
          className="mt-4 inline-block text-secondary"
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
  const selectedTerm = data?.supplier.subscriptions.find(
    (term) => term.isCurrent && term.state === 'PENDING',
  );
  const selectedPlan = data?.plans.find(
    (plan) => plan.id === selectedTerm?.planId,
  );
  const availablePlans = initialPlan
    ? (data?.plans ?? []).filter((p) => p.id === initialPlan)
    : selectedPlan
      ? [selectedPlan]
      : (data?.plans ?? []);
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <Link href="/plans" className="font-semibold text-secondary underline">
        Plans &amp; Pricing
      </Link>
      <PageHeader
        eyebrow="Supplier account"
        title="Activate your marketplace presence"
        description="Verify your email to activate a free plan without a payment method. Paid plans activate only after a successful, verified payment through secure checkout."
      />
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/25 bg-danger/5 p-4 text-danger-foreground"
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
              <p className="mt-1 text-nav text-secondary">
                {supplierTypeLabels[data.supplier.type]} ·{' '}
                {active ? 'Active subscription' : 'Activation pending'}
              </p>
            </div>
            {data.supplier.status === 'PENDING' && (
              <p className="mt-3 text-nav">
                Your account activation and storefront review are separate. An
                administrator reviews your supplier profile before public
                listings can be published.
              </p>
            )}
            {data.supplier.status === 'PENDING' && (
              <Button
                variant="secondary"
                onClick={() => setEdit((v) => !v)}
                disabled={!!pending || !!review}
              >
                Edit company / upload files
              </Button>
            )}
            {initialPlan && !availablePlans.length && (
              <p role="status" className="surface p-5">
                This plan is unavailable or does not match your supplier type.{' '}
                <Link href="/plans" className="underline">
                  Choose an available plan
                </Link>
                .
              </p>
            )}
            {active && (
              <Link
                href="/dashboard/supplier"
                className="font-semibold text-secondary"
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
              className="rounded-xl border border-accent/30 bg-accent/5 p-5"
            >
              <h2 className="font-semibold">
                A payment is awaiting confirmation
              </h2>
              <p className="my-2 text-nav">
                Check its status before starting another payment.
              </p>
              <Link
                className="font-semibold text-secondary"
                href={`/payments/${pending.id}`}
              >
                Check payment status
              </Link>
            </section>
          )}
          {review && (
            <section
              role="status"
              className="rounded-xl border border-warning/45 bg-warning/5 p-5"
            >
              <h2 className="font-semibold">
                A payment needs administrator review
              </h2>
              <p className="my-2 text-nav">
                Contact Machinmate before making another payment.
              </p>
              <Link
                className="font-semibold text-secondary"
                href={`/payments/${review.id}`}
              >
                View review status
              </Link>
            </section>
          )}
          {active && (
            <section className="surface space-y-3 p-5">
              <h2 className="text-card font-semibold">{active.planName}</h2>
              <p>
                {active.state} ·{' '}
                {new Date(active.startsAt).toLocaleDateString()} –{' '}
                {new Date(active.endsAt).toLocaleDateString()}
              </p>
              <p>
                Machinery usage: {data.usage.machinery} / {active.listingLimit}.
                RFQ access: {active.rfqEnabled ? 'Included' : 'Not included'}
              </p>
              <Link
                href="/plans"
                className="font-semibold text-secondary underline"
              >
                {Number(active.price) === 0 ? 'Upgrade' : 'Change plan / renew'}
              </Link>
            </section>
          )}
          <section className="surface space-y-2 p-5">
            <h2 className="font-semibold">Subscription history</h2>
            {data.supplier.subscriptions.map((t) => (
              <p key={t.id} className="text-nav">
                {t.planName} ·{' '}
                {t.isCurrent
                  ? 'Current'
                  : t.isScheduled
                    ? 'Scheduled'
                    : 'History'}{' '}
                · {t.state} · {new Date(t.startsAt).toLocaleDateString()} –{' '}
                {new Date(t.endsAt).toLocaleDateString()}
                {!t.isCurrent &&
                t.state === 'ACTIVE' &&
                new Date(t.startsAt) > new Date()
                  ? ' · Scheduled'
                  : ''}
              </p>
            ))}
          </section>
          {!pending && !review && (!active || initialPlan) && (
            <>
              {!data.onlineAvailable && (
                <p role="status" className="surface p-4">
                  Online payment is currently unavailable for paid plans. Free
                  plans do not require payment and remain available.
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {availablePlans.map((plan) => (
                  <section
                    key={plan.id}
                    className="surface flex flex-col gap-4 p-5"
                  >
                    <h2 className="text-card font-semibold">{plan.name}</h2>
                    <p className="text-section font-semibold">
                      {Number(plan.price) === 0 ? 'Free' : plan.price}{' '}
                      <span className="text-nav text-muted-foreground">
                        {Number(plan.price) === 0
                          ? 'No payment method required'
                          : plan.currency}
                      </span>
                    </p>
                    <p className="text-nav text-secondary">
                      {plan.durationDays} days · {plan.listingLimit} listings
                      <br />
                      {plan.rfqEnabled
                        ? 'RFQ access included'
                        : 'RFQ access not included'}{' '}
                      · {plan.visibility.toLowerCase()} visibility
                    </p>
                    <PlanCheckout
                      token={token}
                      plan={plan}
                      data={data}
                      onDone={() => {
                        void update();
                        setAttempt((n) => n + 1);
                      }}
                    />
                    {Number(plan.price) > 0 &&
                      !data.currencies.includes(plan.currency) && (
                        <p className="text-meta text-muted-foreground">
                          Contact Machinmate about payment support for this
                          currency.
                        </p>
                      )}
                  </section>
                ))}
              </div>
              {!data.plans.length && (
                <p className="surface p-5">
                  No active plans match your supplier type. Contact Machinmate.
                </p>
              )}
            </>
          )}
          {!!data.payments.length && (
            <section className="surface p-5">
              <h2 className="mb-3 font-semibold">Your payment history</h2>
              <ul className="divide-y divide-surface-muted">
                {data.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap justify-between gap-2 py-3 text-nav"
                  >
                    <Link
                      href={`/payments/${p.id}`}
                      className="font-semibold text-secondary"
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
