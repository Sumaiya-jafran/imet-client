'use client';
import LoadingState from '@/components/shared/LoadingState';
import Badge from '@/components/shared/Badge';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/buttons/Button';
import SubscriptionPlanForm from '@/components/forms/SubscriptionPlanForm';
import { supplierApi } from '@/lib/api/supplier.service';
import type { SubscriptionPlan } from '@/types/supplier';
import Link from 'next/link';
export default function PlanManagement() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editor, setEditor] = useState<{ plan?: SubscriptionPlan }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token || session?.error) return;
    let active = true;
    supplierApi
      .adminPlans(token)
      .then((response) => {
        if (active) {
          setPlans(response.data ?? []);
          setLoading(false);
          setError('');
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Unable to load plans');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, session?.error, revision]);
  const reload = () => {
    setLoading(true);
    setRevision((n) => n + 1);
  };
  if (!token || session?.error) return <p role="alert">Sign in again.</p>;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription plans"
        eyebrow="Administration"
        description="Define supplier eligibility, terms and marketplace entitlements."
      />
      <Link href="/dashboard/admin/suppliers" className="underline">
        Manage suppliers and subscriptions
      </Link>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button variant="secondary" onClick={reload}>
            Reload plans
          </Button>
        </div>
      )}
      {editor ? (
        <section className="surface p-5">
          <SubscriptionPlanForm
            key={editor.plan?.updatedAt ?? 'new'}
            token={token}
            plan={editor.plan}
            onSave={() => {
              setEditor(undefined);
              reload();
            }}
            onCancel={() => setEditor(undefined)}
          />
        </section>
      ) : (
        <>
          <Button onClick={() => setEditor({})}>Create plan</Button>
          {loading ? (
            <LoadingState label="Loading plans…" />
          ) : (
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.id} className="surface min-w-0 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="eyebrow">Supplier plan</span>
                    <Badge tone={plan.isActive ? 'success' : 'neutral'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h2 className="break-words text-lg font-semibold">
                    {plan.name}
                  </h2>
                  <p className="mt-4 break-words text-2xl font-bold tracking-tight text-navy">
                    {plan.price}{' '}
                    <span className="text-xs font-medium tracking-normal text-slate-500">
                      {plan.currency} / {plan.durationDays} days
                    </span>
                  </p>
                  <dl className="my-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
                    <div>
                      <dt>Listing capacity</dt>
                      <dd className="mt-1 font-semibold">
                        {plan.listingLimit} machines
                      </dd>
                    </div>
                    <div>
                      <dt>Visibility</dt>
                      <dd className="mt-1 text-xs font-semibold">
                        {plan.visibility}
                      </dd>
                    </div>
                  </dl>
                  <p className="mb-3 text-xs text-slate-500">
                    RFQ leads: {plan.rfqEnabled ? 'Enabled' : 'Disabled'} ·
                    Monthly cap: {plan.leadLimitPerMonth ?? 'Unlimited'} ·
                    Contact reveal:{' '}
                    {plan.canRevealContacts
                      ? 'Allowed after acceptance'
                      : 'Disabled'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Eligibility:{' '}
                    {plan.eligibleTypes
                      .map((type) =>
                        type === 'LOCAL'
                          ? 'Local suppliers'
                          : 'International manufacturers',
                      )
                      .join(', ')}
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-4 w-full"
                    onClick={() => setEditor({ plan })}
                  >
                    Edit plan
                  </Button>
                </article>
              ))}
            </div>
          )}
          {!loading && !plans.length && (
            <EmptyState
              title="No plans defined yet"
              description="Create a plan to define supplier subscription terms and listing limits."
            />
          )}
        </>
      )}
    </div>
  );
}
