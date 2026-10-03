'use client';
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
      <h1 className="text-3xl font-bold">Subscription plans</h1>
      <Link href="/dashboard/admin/suppliers" className="underline">
        Manage suppliers and subscriptions
      </Link>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={reload}>Reload plans</Button>
        </div>
      )}
      {editor ? (
        <section className="rounded-xl border bg-white p-5">
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
            <p role="status">Loading plans…</p>
          ) : (
            plans.map((plan) => (
              <article key={plan.id} className="rounded-xl border bg-white p-5">
                <h2 className="text-xl font-semibold">
                  {plan.name} · {plan.isActive ? 'Active' : 'Inactive'}
                </h2>
                <p>
                  {plan.price} {plan.currency} · {plan.durationDays} days ·{' '}
                  {plan.listingLimit} listings
                </p>
                <p>
                  Eligibility: {plan.eligibleTypes.join(', ')} ·{' '}
                  {plan.visibility}
                </p>
                <Button className="mt-4" onClick={() => setEditor({ plan })}>
                  Edit plan
                </Button>
              </article>
            ))
          )}
          {!loading && !plans.length && <p>No plans defined yet.</p>}
        </>
      )}
    </div>
  );
}
