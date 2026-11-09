'use client';
import { useRef, useState } from 'react';
import Button from '@/components/buttons/Button';
import { supplierApi } from '@/lib/api/supplier.service';
import { supplierAssetsApi } from '@/lib/api/supplier-assets.service';
import { apiClient } from '@/lib/api/client';
import type { SupplierProfile, SubscriptionPlan } from '@/types/supplier';
const localNow = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export default function RecordOfflinePayment({
  token,
  onRecorded,
}: {
  token: string;
  onRecorded: () => void;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [results, setResults] = useState<SupplierProfile[]>([]),
    [supplier, setSupplier] = useState<SupplierProfile>(),
    [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [planId, setPlanId] = useState(''),
    [amount, setAmount] = useState(''),
    [method, setMethod] = useState('BANK_TRANSFER'),
    [reference, setReference] = useState(''),
    [paidAt, setPaidAt] = useState(localNow),
    [notes, setNotes] = useState(''),
    [transition, setTransition] = useState('POLICY'),
    [start, setStart] = useState(localNow),
    [end, setEnd] = useState(''),
    [reason, setReason] = useState('');
  const [file, setFile] = useState<File>(),
    [proofId, setProofId] = useState<string>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState('');
  type Submission = {
    supplierId: string;
    planId: string;
    planUpdatedAt: string;
    expectedCurrentId: string | null;
    expectedCurrentUpdatedAt: string | null;
    amount: string;
    currency: string;
    offlineMethod: string;
    reference: string | null;
    paidAt: string;
    proofAssetId?: string;
    internalNotes: string;
    transition: string;
    startsAt?: string;
    endsAt?: string;
    overrideReason?: string;
    idempotencyKey: string;
    confirmed: true;
  };
  const key = useRef(crypto.randomUUID());
  const [review, setReview] = useState<Submission>();
  const plan = plans.find((p) => p.id === planId),
    current = supplier?.subscriptions.find((t) => t.isCurrent);
  const deferred =
    transition === 'POLICY' &&
    current?.effectiveStatus === 'ACTIVE' &&
    Number(current.price) > 0;
  const chooseSupplier = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      const [s, p] = await Promise.all([
        supplierApi.adminDetail(token, id),
        supplierApi.adminPlans(token),
      ]);
      setSupplier(s.data);
      setPlans(p.data ?? []);
      setPlanId('');
      setAmount('');
      setDone('');
      key.current = crypto.randomUUID();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load supplier');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="surface min-w-0 space-y-4 break-words p-5">
      <Button
        onClick={() => setOpen(!open)}
        variant="secondary"
        aria-expanded={open}
      >
        Record Offline Payment
      </Button>
      {open && (
        <>
          <p className="text-nav">
            Record funds already received. Your confirmation records a verified
            payment and activates the plan according to the selected transition.
            Supplier approval remains separate.
          </p>
          {error && (
            <p role="alert" className="text-danger-foreground">
              {error}
            </p>
          )}
          {done && (
            <p role="status" className="text-success-foreground">
              {done}
            </p>
          )}
          {!review && (
            <>
              <form
                className="flex flex-wrap items-end gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError('');
                  try {
                    const r = await supplierApi.adminList(
                      token,
                      new URLSearchParams({ q: query, page: '1', limit: '20' }),
                    );
                    setResults(r.data?.suppliers ?? []);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Search failed');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="min-w-0 flex-1">
                  Search supplier/business
                  <input
                    required
                    maxLength={200}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
                <Button type="submit" disabled={busy}>
                  Search suppliers
                </Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {results.map((s) => (
                  <Button
                    key={s.id}
                    disabled={busy}
                    variant="secondary"
                    onClick={() => void chooseSupplier(s.id)}
                  >
                    {s.companyName}
                  </Button>
                ))}
              </div>
              {supplier && (
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!plan) return;
                    setBusy(true);
                    setError('');
                    try {
                      if (transition === 'IMMEDIATE_OVERRIDE' && !end)
                        throw new Error('Set the override expiry.');
                      const assetId =
                        proofId ??
                        (file
                          ? (
                              await supplierAssetsApi.upload(
                                token,
                                'PAYMENT_PROOF',
                                file,
                              )
                            ).data?.assetId
                          : undefined);
                      if (assetId) setProofId(assetId);
                      setReview({
                        supplierId: supplier.id,
                        planId: plan.id,
                        planUpdatedAt: plan.updatedAt,
                        expectedCurrentId: current?.id ?? null,
                        expectedCurrentUpdatedAt: current?.updatedAt ?? null,
                        amount,
                        currency: plan.currency,
                        offlineMethod: method,
                        reference: reference.trim() || null,
                        paidAt: new Date(paidAt).toISOString(),
                        proofAssetId: assetId,
                        internalNotes: notes,
                        transition,
                        ...(transition === 'IMMEDIATE_OVERRIDE'
                          ? {
                              startsAt: new Date(start).toISOString(),
                              endsAt: new Date(end).toISOString(),
                            }
                          : {}),
                        ...(reason.trim()
                          ? { overrideReason: reason.trim() }
                          : {}),
                        idempotencyKey: key.current,
                        confirmed: true,
                      });
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : 'Unable to prepare confirmation',
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <div className="rounded border border-border bg-background p-4">
                    <h3 className="font-semibold">{supplier.companyName}</h3>
                    <p>
                      Supplier: {supplier.status} · Account:{' '}
                      {supplier.user?.status ?? 'Unknown'} · Email:{' '}
                      {supplier.user?.isEmailVerified
                        ? 'Verified'
                        : 'Not verified'}
                    </p>
                    <p>
                      Current plan: {current?.planName ?? 'None'} ·{' '}
                      {current?.effectiveStatus ?? 'No subscription'}
                    </p>
                    {current && (
                      <p className="text-meta">
                        {new Date(current.startsAt).toLocaleString()} –{' '}
                        {new Date(current.endsAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <fieldset
                    disabled={busy}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    <label>
                      Subscription plan
                      <select
                        required
                        value={planId}
                        onChange={(e) => {
                          setPlanId(e.target.value);
                          setAmount(
                            plans.find((p) => p.id === e.target.value)?.price ??
                              '',
                          );
                        }}
                        className="mt-1 w-full"
                      >
                        <option value="">Select a paid plan</option>
                        {plans
                          .filter(
                            (p) =>
                              p.isActive &&
                              !p.archivedAt &&
                              p.eligibleTypes.includes(supplier.type) &&
                              Number(p.price) > 0,
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} · {p.price} {p.currency} ·{' '}
                              {p.durationDays} days
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Amount received
                      <input
                        required
                        inputMode="decimal"
                        pattern="(0|[1-9][0-9]*)(\.[0-9]{1,2})?"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 w-full"
                      />
                      <span className="text-meta">
                        Currency: {plan?.currency ?? 'Select a plan'} · Plan
                        price: {plan?.price ?? '—'}
                      </span>
                    </label>
                    <label>
                      Offline payment method
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="mt-1 w-full"
                      >
                        <option value="BANK_TRANSFER">Bank transfer</option>
                        <option value="MOBILE_FINANCIAL_SERVICE">
                          Mobile financial service
                        </option>
                        <option value="CASH">Cash</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </label>
                    <label>
                      Transaction/reference ID (optional)
                      <input
                        maxLength={200}
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="mt-1 w-full"
                      />
                    </label>
                    <label>
                      Payment received date and time
                      <input
                        required
                        type="datetime-local"
                        value={paidAt}
                        onChange={(e) => setPaidAt(e.target.value)}
                        className="mt-1 w-full"
                      />
                    </label>
                    <label>
                      Private payment proof (optional)
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={(e) => {
                          setFile(e.target.files?.[0]);
                          setProofId(undefined);
                        }}
                        className="mt-1 w-full"
                      />
                      <span className="text-meta">
                        PDF/JPEG/PNG, up to 10 MB. Only administrators and this
                        supplier can access the saved proof.
                      </span>
                    </label>
                    <label className="sm:col-span-2">
                      Internal admin notes
                      <textarea
                        maxLength={4000}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 w-full"
                      />
                    </label>
                    <label className="sm:col-span-2">
                      Subscription transition
                      <select
                        value={transition}
                        onChange={(e) => setTransition(e.target.value)}
                        className="mt-1 w-full"
                      >
                        <option value="POLICY">
                          Follow existing subscription policy
                        </option>
                        <option value="IMMEDIATE_OVERRIDE">
                          Immediate activation with an explicit override
                        </option>
                      </select>
                      <span className="text-meta">
                        {deferred
                          ? `New term starts after the current paid term ends: ${new Date(current!.endsAt).toLocaleString()}.`
                          : 'The new plan will be current immediately after confirmation.'}
                      </span>
                    </label>
                    {transition === 'IMMEDIATE_OVERRIDE' && (
                      <>
                        <label>
                          Override start
                          <input
                            required
                            type="datetime-local"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            className="mt-1 w-full"
                          />
                        </label>
                        <label>
                          Override expiry
                          <input
                            required
                            type="datetime-local"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            className="mt-1 w-full"
                          />
                        </label>
                        <p className="text-meta sm:col-span-2">
                          Immediate replacement ends current entitlement access
                          now. Remaining paid time is not automatically
                          credited. History is preserved. Use the standard
                          policy to retain the existing paid period.
                        </p>
                      </>
                    )}
                    <label className="sm:col-span-2">
                      Override reason (required for custom dates or a different
                      amount)
                      <textarea
                        required={
                          transition === 'IMMEDIATE_OVERRIDE' ||
                          (!!plan && Number(amount) !== Number(plan.price))
                        }
                        minLength={10}
                        maxLength={2000}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 w-full"
                      />
                    </label>
                    <Button
                      type="submit"
                      disabled={!plan || !supplier.user?.isEmailVerified}
                    >
                      Review offline payment
                    </Button>
                  </fieldset>
                </form>
              )}
            </>
          )}
          {review && (
            <section
              aria-label="Review offline payment"
              className="space-y-4 rounded border border-border p-5"
            >
              <h3 className="text-card font-semibold">
                Review before confirmation
              </h3>
              <dl className="space-y-2 break-words text-nav [overflow-wrap:anywhere]">
                <div>Supplier: {supplier?.companyName}</div>
                <div>
                  Plan: {plan?.name} · {plan?.durationDays} days
                </div>
                <div>
                  Received: {review.amount} {review.currency} ·{' '}
                  {review.offlineMethod}
                </div>
                <div>Reference: {review.reference ?? 'Not provided'}</div>
                <div>
                  Payment date: {new Date(review.paidAt).toLocaleString()}
                </div>
                <div>Proof: {file?.name ?? 'Not provided'}</div>
                <div>
                  Start:{' '}
                  {review.startsAt
                    ? new Date(review.startsAt).toLocaleString()
                    : deferred
                      ? new Date(current!.endsAt).toLocaleString()
                      : 'Immediately on confirmation'}
                </div>
                <div>
                  Expiry:{' '}
                  {review.endsAt
                    ? new Date(review.endsAt).toLocaleString()
                    : `${plan?.durationDays} days after start`}
                </div>
                <div className="whitespace-pre-wrap">
                  Internal notes: {review.internalNotes || 'None'}
                </div>
                <div>Override reason: {review.overrideReason ?? 'None'}</div>
              </dl>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setReview(undefined);
                    key.current = crypto.randomUUID();
                  }}
                >
                  Back to edit
                </Button>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      const r = await apiClient.post<{
                        id: string;
                        isScheduled: boolean;
                      }>('/admin/billing/offline-payments', review, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      setDone(
                        `Offline payment ${r.data!.id} recorded. ${r.data!.isScheduled ? 'The new period is scheduled after the current paid term.' : 'The subscription is active now.'}`,
                      );
                      setReview(undefined);
                      setSupplier(undefined);
                      setResults([]);
                      setFile(undefined);
                      setProofId(undefined);
                      setNotes('');
                      key.current = crypto.randomUUID();
                      onRecorded();
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : 'Unable to confirm. Retry the same confirmation safely.',
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy
                    ? 'Recording…'
                    : 'Confirm received payment and activate'}
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
