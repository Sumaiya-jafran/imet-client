'use client';
import { useState } from 'react';
import Button from '@/components/buttons/Button';
import { supplierApi } from '@/lib/api/supplier.service';
import type {
  SupplierProfile,
  SubscriptionPlan,
  SupplierSubscription,
} from '@/types/supplier';
function localDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export default function SupplierSubscriptionForm({
  token,
  supplier,
  plans,
  onSave,
}: {
  token: string;
  supplier: SupplierProfile;
  plans: SubscriptionPlan[];
  onSave: () => void;
}) {
  const current = supplier.subscriptions.find((term) => term.isCurrent);
  const [mode, setMode] = useState<'assign' | 'edit'>('assign');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [planId, setPlanId] = useState('');
  const [startsAt, setStartsAt] = useState(localDate(new Date().toISOString()));
  const [endsAt, setEndsAt] = useState('');
  const [state, setState] = useState<SupplierSubscription['state']>('PENDING');
  const eligible = plans.filter(
    (plan) => plan.isActive && plan.eligibleTypes.includes(supplier.type),
  );
  const choose = (id: string) => {
    setPlanId(id);
    const plan = eligible.find((plan) => plan.id === id);
    if (plan && startsAt) {
      const end = new Date(startsAt);
      end.setDate(end.getDate() + plan.durationDays);
      setEndsAt(localDate(end.toISOString()));
    }
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (
      !startsAt ||
      !endsAt ||
      !Number.isFinite(new Date(startsAt).getTime()) ||
      !Number.isFinite(new Date(endsAt).getTime()) ||
      new Date(endsAt) <= new Date(startsAt)
    ) {
      setError('Set a valid start and end date; end must be after start.');
      return;
    }
    if (mode === 'assign' && !planId) {
      setError('Select an eligible active plan.');
      return;
    }
    if (
      mode === 'assign' &&
      current &&
      !window.confirm(
        'Replace the current subscription with a new term? The previous term will be cancelled and retained in history.',
      )
    )
      return;
    setBusy(true);
    try {
      const body = {
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        state,
      };
      if (mode === 'edit' && current)
        await supplierApi.updateTerm(token, current, body);
      else
        await supplierApi.assign(
          token,
          supplier.id,
          { ...body, planId },
          current,
        );
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save subscription');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="surface p-5">
      <h2 className="text-2xl font-semibold">Manual subscription management</h2>
      <p className="my-3 text-sm text-slate-600">
        No payment is processed. Assign or renew using current plan terms, or
        extend/suspend/cancel the current term while keeping its assigned
        limits. Dates use your local timezone; the backend stores UTC.
      </p>
      {supplier.subscriptions.map((term) => (
        <div
          key={term.id}
          className="my-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4"
        >
          <p className="font-semibold">
            {term.planName} · {term.isCurrent ? 'Current' : 'Previous'} ·{' '}
            {term.effectiveStatus}
          </p>
          <p>
            {new Date(term.startsAt).toLocaleString()} –{' '}
            {new Date(term.endsAt).toLocaleString()}
          </p>
          <p>
            {term.price} {term.currency} · {term.listingLimit} listings ·{' '}
            {term.visibility}
          </p>
        </div>
      ))}
      <div className="my-4 flex flex-wrap gap-3">
        <Button
          disabled={busy}
          onClick={() => {
            setMode('assign');
            setPlanId('');
            setStartsAt(localDate(new Date().toISOString()));
            setEndsAt('');
            setState('PENDING');
            setError('');
          }}
        >
          Assign / renew term
        </Button>
        {current && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setMode('edit');
              setStartsAt(localDate(current.startsAt));
              setEndsAt(localDate(current.endsAt));
              setState(current.state);
              setError('');
            }}
          >
            Edit current term
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="mb-3 text-red-700">
          {error}
        </p>
      )}
      <form onSubmit={save} className="space-y-4">
        <fieldset
          disabled={
            busy || (mode === 'assign' && supplier.status !== 'APPROVED')
          }
          className="grid gap-4 sm:grid-cols-2"
        >
          {mode === 'assign' && (
            <div className="sm:col-span-2">
              <label htmlFor="term-plan" className="block font-medium">
                Assign plan
              </label>
              <select
                id="term-plan"
                value={planId}
                onChange={(event) => choose(event.target.value)}
                className="mt-1 w-full rounded border p-2"
              >
                <option value="">Select a plan</option>
                {eligible.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · {plan.price} {plan.currency} ·{' '}
                    {plan.durationDays} days
                  </option>
                ))}
              </select>
            </div>
          )}
          <label className="block">
            Subscription start
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <label className="block">
            Subscription end
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <label className="block">
            Subscription state
            <select
              value={state}
              onChange={(event) =>
                setState(event.target.value as SupplierSubscription['state'])
              }
              className="mt-1 w-full rounded border p-2"
            >
              <option value="PENDING">Pending manual activation</option>
              <option value="ACTIVE">Active (when within dates)</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <Button type="submit">
            {busy
              ? 'Saving…'
              : mode === 'edit'
                ? 'Save current term'
                : 'Assign subscription'}
          </Button>
        </fieldset>
      </form>
      {supplier.status !== 'APPROVED' && (
        <p className="mt-3">
          Approve this supplier before assigning or changing a subscription.
        </p>
      )}
    </section>
  );
}
