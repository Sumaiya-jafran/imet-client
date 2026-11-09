'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/buttons/Button';
import { paymentApi } from '@/lib/api/payment.service';
import { supplierAssetsApi } from '@/lib/api/supplier-assets.service';
import { apiClient } from '@/lib/api/client';
import type { Onboarding } from '@/types/payment';
import type { SubscriptionPlan } from '@/types/supplier';
export default function PlanCheckout({
  token,
  plan,
  data,
  onDone,
}: {
  token: string;
  plan: SubscriptionPlan;
  data: Onboarding;
  onDone: () => void;
}) {
  const router = useRouter();
  const [proofAssetId, setProofAssetId] = useState<string>();
  const [method, setMethod] = useState(
    data.supplier.subscriptions.find(
      (t) => t.isCurrent && t.state === 'PENDING' && t.planId === plan.id,
    )?.selectedPaymentMethod ?? '',
  );
  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const free = Number(plan.price) === 0;
  const manual = data.manualMethods.find((m) => m.id === method);
  const current = data.supplier.subscriptions.find(
    (t) =>
      t.isCurrent && t.state === 'ACTIVE' && new Date(t.endsAt) > new Date(),
  );
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (free) {
        await paymentApi.activateFree(token, plan.id);
        onDone();
        return;
      }
      if (!method) throw new Error('Choose a payment method');
      const keyName = `imet-checkout-${data.supplier.id}-${plan.id}-${method}`;
      let key = sessionStorage.getItem(keyName);
      if (!key) {
        key = crypto.randomUUID();
        sessionStorage.setItem(keyName, key);
      }
      if (manual) {
        const proof =
          proofAssetId ??
          (file
            ? (await supplierAssetsApi.upload(token, 'PAYMENT_PROOF', file))
                .data?.assetId
            : undefined);
        if (proof) setProofAssetId(proof);
        const result = await apiClient.post<{ id: string }>(
          '/payments/manual',
          {
            planId: plan.id,
            methodId: manual.id,
            reference,
            proofAssetId: proof,
            idempotencyKey: key,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        router.push(`/payments/${result.data!.id}`);
        return;
      }
      const result = (await paymentApi.checkout(token, plan.id, key)).data!;
      if (result.status !== 'PENDING') sessionStorage.removeItem(keyName);
      window.location.assign(result.gatewayUrl ?? `/payments/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start checkout');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="text-nav">
        {free
          ? 'No payment method required'
          : `Total: ${plan.price} ${plan.currency} · ${plan.billingInterval ?? 'CUSTOM'} · ${plan.durationDays} days`}
      </p>
      {current && Number(current.price) > 0 && (
        <p className="text-meta">
          Your new plan starts after the current term ends on{' '}
          {new Date(current.endsAt).toLocaleDateString()}. No proration or
          automatic recurring charge.
        </p>
      )}
      {!free && (
        <>
          <label className="block text-nav">
            Payment method
            <select
              required
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 w-full"
            >
              <option value="">Choose a method</option>
              {data.onlineAvailable &&
                data.currencies.includes(plan.currency) && (
                  <option value="SSLCOMMERZ">SSLCOMMERZ secure checkout</option>
                )}
              {data.manualMethods
                .filter((m) => m.currencies.includes(plan.currency))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (manual verification)
                  </option>
                ))}
            </select>
          </label>
          {!data.onlineAvailable && (
            <p className="text-meta text-muted">
              Online gateway unavailable. Use an available manual method or
              contact support.
            </p>
          )}
          {manual && (
            <>
              <p className="whitespace-pre-wrap rounded border border-border bg-background p-3 text-nav">
                {manual.instructions}
              </p>
              <label className="block">
                Payment reference
                <input
                  required
                  minLength={3}
                  maxLength={200}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-1 w-full"
                />
              </label>
              <label className="block">
                Private proof (PDF, JPEG or PNG, up to 10 MB)
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  required={manual.proofRequired}
                  onChange={(e) => {
                    setFile(e.target.files?.[0]);
                    setProofAssetId(undefined);
                  }}
                  className="mt-1 w-full"
                />
              </label>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-danger-foreground">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy
          ? 'Please wait…'
          : free
            ? 'Choose Free plan'
            : manual
              ? 'Submit for verification'
              : 'Continue to secure payment'}
      </Button>
    </form>
  );
}
