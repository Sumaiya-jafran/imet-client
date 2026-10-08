'use client';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/buttons/Button';
import { paymentApi } from '@/lib/api/payment.service';
import type { SupplierProfile, SubscriptionPlan } from '@/types/supplier';
import type { AdminPayment } from '@/types/payment';
function suggestedEnd(days: number) {
  return new Date(
    Date.now() + days * 86400000 - new Date().getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
}
export default function SupplierActivationPanel({
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
  const dialog = useRef<HTMLDialogElement>(null);
  const [payments, setPayments] = useState<AdminPayment[]>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const eligible = plans.filter(
    (p) => p.isActive && p.eligibleTypes.includes(supplier.type),
  );
  useEffect(() => {
    let active = true;
    paymentApi
      .history(token, supplier.id)
      .then((r) => {
        if (active) setPayments(r.data ?? []);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : 'Payment history unavailable',
          );
      });
    return () => {
      active = false;
    };
  }, [token, supplier.id, supplier.updatedAt, attempt]);
  const current = supplier.subscriptions.find((t) => t.isCurrent);
  return (
    <section className="surface space-y-4 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Account activation & payments
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Account: {supplier.user?.status ?? 'Unknown'} · Email{' '}
            {supplier.user?.isEmailVerified ? 'verified' : 'unverified'}
          </p>
        </div>
        <Button
          disabled={
            !supplier.user?.isEmailVerified ||
            !['PENDING', 'APPROVED'].includes(supplier.status) ||
            !eligible.length
          }
          onClick={() => {
            setError('');
            const input = dialog.current?.querySelector<HTMLInputElement>(
              'input[name=startsAt]',
            );
            if (input)
              input.value = new Date(
                Date.now() - new Date().getTimezoneOffset() * 60000,
              )
                .toISOString()
                .slice(0, 16);
            dialog.current?.showModal();
          }}
        >
          Activate account manually
        </Button>
      </header>
      {current?.activationMethod && (
        <p className="text-sm">
          Activated via{' '}
          {current.activationMethod === 'PAYMENT'
            ? 'verified payment'
            : 'administrator'}
          {current.activatedAt &&
            ` on ${new Date(current.activatedAt).toLocaleString()}`}
          . {current.activationReason && `Reason: ${current.activationReason}`}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}{' '}
          <Button variant="ghost" onClick={() => setAttempt((n) => n + 1)}>
            Reload
          </Button>
        </p>
      )}
      {!payments && !error && <p role="status">Loading payment history…</p>}
      {payments?.length === 0 && (
        <p className="text-sm text-slate-500">
          No gateway payment attempts. Manual activation does not create a
          payment record.
        </p>
      )}
      {!!payments?.length && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Read-only SSLCOMMERZ payment records
            </caption>
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                {[
                  'Transaction / plan',
                  'Amount',
                  'Status',
                  'Validation / risk',
                  'Created',
                ].map((h) => (
                  <th key={h} className="p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">
                    <span className="font-mono text-xs">{p.transactionId}</span>
                    <br />
                    {p.subscription.planName}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {p.amount} {p.currency}
                  </td>
                  <td className="p-3">
                    {p.status}
                    <br />
                    <span className="text-xs">{p.reviewReason}</span>
                  </td>
                  <td className="p-3">
                    {p.validationId ?? 'Not validated'}
                    <br />
                    Risk: {p.riskLevel ?? '—'}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="manual-activation-title"
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl p-6 backdrop:bg-slate-950/50"
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fields = new FormData(e.currentTarget);
            setBusy(true);
            setError('');
            try {
              await paymentApi.manual(token, supplier, {
                planId: String(fields.get('planId')),
                startsAt: new Date(
                  String(fields.get('startsAt')),
                ).toISOString(),
                endsAt: new Date(String(fields.get('endsAt'))).toISOString(),
                reason: String(fields.get('reason')),
                confirmed: true,
              });
              dialog.current?.close();
              onSave();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : 'Manual activation failed',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2 id="manual-activation-title" className="text-xl font-semibold">
            Confirm manual account activation
          </h2>
          <p className="text-sm text-slate-600">
            This activates {supplier.companyName} and replaces its current
            subscription. It records your identity and reason in the audit log.
            No gateway payment will be created.
          </p>
          <fieldset disabled={busy} className="space-y-4">
            <label className="block text-sm font-medium">
              Plan
              <select
                required
                name="planId"
                className="mt-1 w-full rounded-lg border p-2"
                onChange={(e) => {
                  const plan = eligible.find((p) => p.id === e.target.value);
                  const end =
                    e.currentTarget.form?.elements.namedItem('endsAt');
                  if (plan && end instanceof HTMLInputElement)
                    end.value = suggestedEnd(plan.durationDays);
                }}
              >
                <option value="">Select a plan</option>
                {eligible.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.price} {p.currency}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Start date
              <input
                required
                name="startsAt"
                type="datetime-local"
                className="mt-1 w-full rounded-lg border p-2"
              />
            </label>
            <label className="block text-sm font-medium">
              End date
              <input
                required
                name="endsAt"
                type="datetime-local"
                className="mt-1 w-full rounded-lg border p-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Activation reason
              <textarea
                required
                name="reason"
                minLength={10}
                maxLength={2000}
                rows={3}
                className="mt-1 w-full rounded-lg border p-2"
              />
            </label>
            <label className="flex gap-2 text-sm">
              <input type="checkbox" required />I confirm this plan, term and
              manual activation reason.
            </label>
            {error && (
              <p role="alert" className="text-red-800">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="submit">
                {busy ? 'Activating…' : 'Confirm activation'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => dialog.current?.close()}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        </form>
      </dialog>
    </section>
  );
}
