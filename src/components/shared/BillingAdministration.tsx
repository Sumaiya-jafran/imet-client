'use client';
import RecordOfflinePayment from '@/components/forms/RecordOfflinePayment';
import { useEffect, useState } from 'react';
import Button from '@/components/buttons/Button';
import SupplierAssetFile from './SupplierAssetFile';
import { apiClient } from '@/lib/api/client';
import type { ManualPaymentMethod } from '@/types/payment';
type Row = {
  id: string;
  provider: string;
  offlineMethod?: string | null;
  internalNotes?: string | null;
  overrideReason?: string | null;
  recordedBy?: { displayName: string; id: string } | null;
  paidAt?: string | null;
  createdAt?: string;

  amount: string;
  currency: string;
  status: string;
  paymentReference: string | null;
  proofAssetId: string | null;
  decisionReason: string | null;
  subscription: {
    planName: string;
    startsAt?: string;
    endsAt?: string;
    activatedAt?: string | null;
    isScheduled?: boolean;
    supplier: { companyName: string; id: string };
  };
};
type Term = {
  id: string;
  planId: string;
  planName: string;
  state: string;
  price: string;
  currency: string;
  startsAt: string;
  endsAt: string;
  supplier: { id: string; companyName: string };
};
export default function BillingAdministration({
  token,
  onChanged,
}: {
  token: string;
  onChanged?: () => void;
}) {
  const [methods, setMethods] = useState<ManualPaymentMethod[]>([]);
  const [payments, setPayments] = useState<{
    rows: Row[];
    total: number;
    revenue: { currency: string; _sum: { amount: string }; _count: number }[];
  }>();
  const [terms, setTerms] = useState<{ rows: Term[]; total: number }>();
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [provider, setProvider] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [planId, setPlanId] = useState('');
  const [state, setState] = useState('');
  const [proofId, setProofId] = useState('');
  const [decision, setDecision] = useState('');
  const [refund, setRefund] = useState('');
  const [refundReference, setRefundReference] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ManualPaymentMethod>();
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [currencies, setCurrencies] = useState('');
  const [proof, setProof] = useState(true);
  const [active, setActive] = useState(true);
  useEffect(() => {
    let live = true;
    const options = { headers: { Authorization: `Bearer ${token}` } };
    const q = new URLSearchParams({ page: String(page) });
    if (status) q.set('status', status);
    if (provider) q.set('provider', provider);
    if (search) q.set('search', search);
    if (supplierId) q.set('supplierId', supplierId);
    if (planId) q.set('planId', planId);
    const tq = new URLSearchParams(q);
    tq.delete('status');
    tq.delete('provider');
    tq.delete('search');
    if (state) tq.set('state', state);
    Promise.all([
      apiClient.get<ManualPaymentMethod[]>(
        '/admin/billing/manual-methods',
        options,
      ),
      apiClient.get<NonNullable<typeof payments>>(
        `/admin/billing/payments?${q}`,
        options,
      ),
      apiClient.get<NonNullable<typeof terms>>(
        `/admin/billing/subscription-history?${tq}`,
        options,
      ),
    ])
      .then(([m, p, t]) => {
        if (live) {
          setMethods(m.data ?? []);
          setPayments(p.data);
          setTerms(t.data);
          setError('');
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [
    token,
    revision,
    page,
    status,
    supplierId,
    planId,
    state,
    provider,
    search,
  ]);
  const reset = () => {
    setEditing(undefined);
    setName('');
    setInstructions('');
    setCurrencies('');
    setProof(true);
    setActive(true);
  };
  const decide = async (approve: boolean) => {
    setBusy(true);
    try {
      await apiClient.post(
        `/admin/billing/payments/${decision}/decision`,
        { approve, reason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDecision('');
      setReason('');
      setRevision((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decision failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="space-y-5 border-t border-border pt-6">
      <RecordOfflinePayment
        token={token}
        onRecorded={() => {
          setRevision((n) => n + 1);
          onChanged?.();
        }}
      />
      <h2 className="text-section font-semibold">
        Payments &amp; subscription history
      </h2>
      {error && (
        <p role="alert" className="text-danger-foreground">
          {error}
        </p>
      )}
      <details>
        <summary className="cursor-pointer font-semibold">
          Legacy manual-payment method settings
        </summary>
        <form
          className="surface grid gap-4 p-5 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await apiClient.request(
                `/admin/billing/manual-methods${editing ? `/${editing.id}` : ''}`,
                {
                  method: editing ? 'PUT' : 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                  body: JSON.stringify({
                    name,
                    instructions,
                    currencies: currencies
                      .split(',')
                      .map((c) => c.trim().toUpperCase())
                      .filter(Boolean),
                    proofRequired: proof,
                    isActive: active,
                    ...(editing ? { updatedAt: editing.updatedAt } : {}),
                  }),
                },
              );
              reset();
              setRevision((n) => n + 1);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Save failed');
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3 className="font-semibold sm:col-span-2">
            {editing ? 'Edit' : 'Create'} manual payment method
          </h3>
          <label>
            Name
            <input
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full"
            />
          </label>
          <label>
            Currency codes (comma separated)
            <input
              required
              value={currencies}
              onChange={(e) => setCurrencies(e.target.value)}
              className="mt-1 w-full"
            />
          </label>
          <label className="sm:col-span-2">
            Instructions
            <textarea
              required
              minLength={10}
              maxLength={4000}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mt-1 w-full"
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={proof}
              onChange={(e) => setProof(e.target.checked)}
            />{' '}
            Require private proof
          </label>
          <label>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />{' '}
            Available
          </label>
          <Button type="submit" disabled={busy}>
            Save method
          </Button>
          <Button variant="secondary" onClick={reset}>
            Clear editor
          </Button>
        </form>
        <div className="flex flex-wrap gap-3">
          {methods.map((m) => (
            <Button
              key={m.id}
              variant="secondary"
              onClick={() => {
                setEditing(m);
                setName(m.name);
                setInstructions(m.instructions);
                setCurrencies(m.currencies.join(','));
                setProof(m.proofRequired);
                setActive(m.isActive);
              }}
            >
              {m.name} · {m.isActive ? 'Active' : 'Inactive'}
            </Button>
          ))}
        </div>
      </details>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          Payment source
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-full"
          >
            <option value="">All payments</option>
            <option value="OFFLINE">Admin-recorded offline payments</option>
            <option value="SSLCOMMERZ">Online SSLCOMMERZ</option>
            <option value="MANUAL">Legacy manual submissions</option>
          </select>
        </label>
        <label>
          Search payments (business or reference)
          <input
            maxLength={200}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-full"
          />
        </label>
        <label>
          Payment status
          <select
            className="mt-1 w-full"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {[
              'PENDING',
              'PAID',
              'FAILED',
              'CANCELLED',
              'EXPIRED',
              'REVIEW',
              'REFUNDED',
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Subscription state
          <select
            className="mt-1 w-full"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Supplier ID filter
          <input
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-full"
          />
        </label>
        <label>
          Plan ID filter
          <input
            value={planId}
            onChange={(e) => {
              setPlanId(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-full"
          />
        </label>
      </div>
      <p className="text-nav">
        Verified revenue by currency:{' '}
        {payments?.revenue
          .map((r) => `${r._sum.amount} ${r.currency} (${r._count} payments)`)
          .join(' · ') || 'No verified payments'}
      </p>
      <div className="space-y-3">
        {payments?.rows.map((p) => (
          <article key={p.id} className="surface space-y-2 p-4">
            <h3 className="font-semibold">
              {p.subscription.supplier.companyName} · {p.subscription.planName}
            </h3>
            <p>
              {p.amount} {p.currency} · {p.provider} · {p.status}
            </p>
            <p className="break-all text-meta">
              {p.id} · Reference: {p.paymentReference ?? '—'}
            </p>
            <p>{p.decisionReason}</p>
            {p.provider === 'OFFLINE' && (
              <dl className="space-y-1 text-nav">
                <div>Method: {p.offlineMethod}</div>
                <div>
                  Payment received:{' '}
                  {p.paidAt ? new Date(p.paidAt).toLocaleString() : '—'}
                </div>
                <div>
                  Recorded by: {p.recordedBy?.displayName} ·{' '}
                  {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                </div>
                <div>
                  Activated:{' '}
                  {p.subscription.activatedAt
                    ? new Date(p.subscription.activatedAt).toLocaleString()
                    : '—'}{' '}
                  ·{' '}
                  {p.subscription.isScheduled ? 'Scheduled' : 'Current/history'}
                </div>
                <div>
                  Period:{' '}
                  {p.subscription.startsAt
                    ? new Date(p.subscription.startsAt).toLocaleString()
                    : ''}{' '}
                  –{' '}
                  {p.subscription.endsAt
                    ? new Date(p.subscription.endsAt).toLocaleString()
                    : ''}
                </div>
                <div className="whitespace-pre-wrap">
                  Internal notes: {p.internalNotes || 'None'}
                </div>
                <div>Override reason: {p.overrideReason ?? 'None'}</div>
              </dl>
            )}
            {p.proofAssetId && (
              <Button
                variant="secondary"
                onClick={() => setProofId(proofId === p.id ? '' : p.id)}
              >
                View private proof
              </Button>
            )}
            {p.proofAssetId && proofId === p.id && (
              <SupplierAssetFile
                token={token}
                assetId={p.proofAssetId}
                name="Private payment proof"
              />
            )}
            {p.provider === 'MANUAL' && p.status === 'PENDING' && (
              <Button
                onClick={() => {
                  setDecision(p.id);
                  setReason('');
                }}
              >
                Review manual payment
              </Button>
            )}
            {['MANUAL', 'OFFLINE'].includes(p.provider) &&
              p.status === 'PAID' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRefund(p.id);
                    setRefundReference('');
                    setReason('');
                  }}
                >
                  Record completed manual refund
                </Button>
              )}
            {refund === p.id && (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  try {
                    await apiClient.post(
                      `/admin/billing/payments/${p.id}/manual-refund`,
                      { reference: refundReference, reason },
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    setRefund('');
                    setRevision((n) => n + 1);
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : 'Refund recording failed',
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <p>
                  Record only after funds have been returned. This cancels the
                  refunded subscription; it does not send money.
                </p>
                <label>
                  Refund receipt reference
                  <input
                    required
                    minLength={3}
                    maxLength={200}
                    value={refundReference}
                    onChange={(e) => setRefundReference(e.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
                <label>
                  Refund reason
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
                <Button type="submit" disabled={busy}>
                  Record verified refund
                </Button>
              </form>
            )}
            {decision === p.id && (
              <div className="space-y-3">
                <label>
                  Decision reason
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy || reason.trim().length < 10}
                    onClick={() => void decide(true)}
                  >
                    Approve payment
                  </Button>
                  <Button
                    variant="danger"
                    disabled={busy || reason.trim().length < 10}
                    onClick={() => void decide(false)}
                  >
                    Reject payment
                  </Button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
      <h3 className="font-semibold">Subscription periods</h3>
      {terms?.rows.map((t) => (
        <article className="surface p-4" key={t.id}>
          <p>
            {t.supplier.companyName} · {t.planName} · {t.state} · {t.price}{' '}
            {t.currency}
          </p>
          <p className="text-meta">
            {new Date(t.startsAt).toLocaleDateString()} –{' '}
            {new Date(t.endsAt).toLocaleDateString()}
          </p>
          <p className="break-all text-meta">{t.supplier.id}</p>
        </article>
      ))}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          variant="secondary"
          disabled={
            page * 50 >= Math.max(payments?.total ?? 0, terms?.total ?? 0)
          }
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
