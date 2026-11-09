'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { supplierApi } from '@/lib/api/supplier.service';
import { paymentApi } from '@/lib/api/payment.service';
import type { SubscriptionPlan } from '@/types/supplier';
export default function PlansPricing() {
  const { data: session } = useSession();
  const [plans, setPlans] =
    useState<Omit<SubscriptionPlan, 'isActive' | 'updatedAt'>[]>();
  const [current, setCurrent] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    supplierApi
      .publicPlans()
      .then((r) => {
        if (live) setPlans(r.data ?? []);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!session?.accessToken) return;
    let live = true;
    paymentApi
      .onboarding(session.accessToken)
      .then((r) => {
        if (live)
          setCurrent(
            r.data?.supplier.subscriptions.find(
              (t) =>
                t.isCurrent &&
                t.state === 'ACTIVE' &&
                new Date(t.endsAt) > new Date(),
            )?.planId ?? '',
          );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [session?.accessToken]);
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <h1 className="text-page font-bold">Plans &amp; Pricing</h1>
      <p>
        Choose the capacity your business needs. Online payments activate
        automatically after verification. Manual payments require review.
        Supplier approval is separate.
      </p>
      {error && <p role="alert">{error}</p>}
      {!plans && !error && <p role="status">Loading plans…</p>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plans?.map((p) => (
          <article key={p.id} className="surface flex flex-col gap-4 p-6">
            <h2 className="text-card font-semibold">
              {p.name}
              {p.isFree ? ' · Free' : ''}
            </h2>
            <p>{p.description}</p>
            <p className="text-section font-semibold">
              {p.price} {p.currency}
            </p>
            <p>
              {p.billingInterval ?? 'CUSTOM'} · {p.durationDays} days
            </p>
            <ul className="space-y-2 text-nav">
              <li>{p.listingLimit} machinery listings</li>
              <li>{p.imageLimit} images per machine</li>
              {p.features?.map((f) => (
                <li key={f}>{f}</li>
              ))}
              <li>RFQ access: {p.rfqEnabled ? 'Included' : 'Not included'}</li>
            </ul>
            {current === p.id && (
              <p className="font-semibold text-secondary">Current plan</p>
            )}
            <Link
              className="mt-auto font-semibold text-secondary underline"
              href={
                session
                  ? `/subscription?plan=${p.id}`
                  : `/auth/signup?type=supplier&planId=${p.id}`
              }
            >
              {current === p.id ? 'Renew / manage plan' : 'Choose plan'}
            </Link>
          </article>
        ))}
      </div>
      {plans?.length === 0 && (
        <p>No public plans are available. Contact Machinmate.</p>
      )}
    </main>
  );
}
