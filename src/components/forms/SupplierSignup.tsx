'use client';
import { apiClient } from '@/lib/api/client';
import type { PaymentRegion } from '@/config/payment-regions';
import { paymentRegionSchema } from '@/lib/schema-validations/supplier.schema';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import AuthForm from './AuthForm';
import PasswordInput from './PasswordInput';
import SupplierProfileForm from './SupplierProfileForm';
import Button from '@/components/buttons/Button';
import { signupSchema } from '@/lib/schema-validations/auth.schema';
import { supplierApi } from '@/lib/api/supplier.service';
import { paymentApi } from '@/lib/api/payment.service';
import type { SubscriptionPlan, SupplierType } from '@/types/supplier';
export default function SupplierSignup({
  initialSupplier,
  initialPlan,
  ...auth
}: {
  initialSupplier: boolean;
  initialPlan?: string;
  callbackUrl?: string;
  oauthError?: string;
  googleEnabled: boolean;
}) {
  const [supplier, setSupplier] = useState(initialSupplier);
  const [paymentRegion, setPaymentRegion] = useState<PaymentRegion>();
  const [account, setAccount] = useState<z.infer<typeof signupSchema>>();
  const [plans, setPlans] =
    useState<Omit<SubscriptionPlan, 'isActive' | 'updatedAt'>[]>();
  const [planId, setPlanId] = useState(initialPlan ?? '');
  const [planConfirmed, setPlanConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentOptions, setPaymentOptions] = useState<{
    onlineAvailable: boolean;
    currencies: string[];
    manualMethods: { id: string; name: string; currencies: string[] }[];
  }>();
  useEffect(() => {
    if (!supplier) return;
    let live = true;
    apiClient
      .get<NonNullable<typeof paymentOptions>>('/subscriptions/payment-options')
      .then((r) => {
        if (live) setPaymentOptions(r.data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [supplier]);
  const selectedPlan = plans?.find((p) => p.id === planId);
  const [supplierType, setSupplierType] = useState<SupplierType>('LOCAL');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [done, setDone] = useState(false);
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
  });
  useEffect(() => {
    if (!supplier) return;
    let active = true;
    supplierApi
      .publicPlans()
      .then((r) => {
        if (active) {
          setPlans(r.data ?? []);
          setError('');
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : 'Plans unavailable');
      });
    return () => {
      active = false;
    };
  }, [supplier, attempt]);
  return (
    <div className="signup-form mx-auto w-full space-y-6">
      <p className="text-nav text-secondary">
        Already registered?{' '}
        <Link
          className="font-semibold text-secondary"
          href="/auth/signin?callbackUrl=%2Fsubscription"
        >
          Sign in to continue
        </Link>
      </p>
      <div className="flex gap-2" aria-label="Account type">
        <Button
          variant={!supplier ? 'primary' : 'secondary'}
          onClick={() => setSupplier(false)}
          aria-pressed={!supplier}
        >
          Buyer
        </Button>
        <Button
          variant={supplier ? 'primary' : 'secondary'}
          onClick={() => setSupplier(true)}
          aria-pressed={supplier}
        >
          Supplier / manufacturer
        </Button>
      </div>
      {!supplier ? (
        <AuthForm mode="signup" {...auth} />
      ) : done ? (
        <section className="surface space-y-4 p-6">
          <h1 className="text-section font-semibold">Verify your email</h1>
          <p>
            If this address is eligible, you will receive an email shortly.
            Free-plan accounts activate after email verification with no payment
            method. Paid-plan accounts activate after verification and
            successful payment.
          </p>
          <p>
            After verification, sign in to continue. Only paid plans require
            secure checkout.
          </p>
          <Link
            className="font-semibold text-secondary"
            href="/auth/signin?callbackUrl=%2Fsubscription"
          >
            Continue to sign in
          </Link>
        </section>
      ) : (
        <section className="surface space-y-5 p-5 sm:p-8">
          <header>
            <p className="eyebrow">Supplier onboarding</p>
            <h1 className="text-section font-semibold">
              Build your marketplace presence
            </h1>
            <p className="mt-2 text-nav text-secondary">
              Company details → verify email → account active on a free plan, or
              complete payment on a paid plan. Buyers never need a plan.
            </p>
          </header>
          {error && (
            <div role="alert" className="text-danger-foreground">
              {error}{' '}
              <Button
                variant="secondary"
                onClick={() => setAttempt((n) => n + 1)}
              >
                Reload plans
              </Button>
            </div>
          )}
          {!planConfirmed ? (
            <div className="space-y-4">
              <h2 className="text-card font-semibold">
                Step 1 · Choose your plan
              </h2>
              <label className="block">
                Business type
                <select
                  className="mt-1 w-full"
                  value={supplierType}
                  onChange={(e) => {
                    setSupplierType(e.target.value as SupplierType);
                    setPlanId('');
                    setPaymentMethod('');
                  }}
                >
                  <option value="LOCAL">Local supplier / dealer</option>
                  <option value="INTERNATIONAL">
                    International manufacturer
                  </option>
                </select>
              </label>{' '}
              <label className="block text-nav font-medium">
                Choose an administrator-defined plan
                <select
                  required
                  className="mt-1 w-full rounded-lg border p-3"
                  value={planId}
                  onChange={(e) => {
                    setPlanId(e.target.value);
                    setPaymentMethod('');
                  }}
                >
                  <option value="">
                    {plans ? 'Select a plan' : 'Loading plans…'}
                  </option>
                  {plans
                    ?.filter((p) => p.eligibleTypes.includes(supplierType))
                    .map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name} ·{' '}
                        {Number(p.price) === 0
                          ? 'Free — no payment method'
                          : `${p.price} ${p.currency}`}{' '}
                        · {p.durationDays} days
                      </option>
                    ))}
                </select>
              </label>
              {plans?.length === 0 && (
                <p role="status">
                  No active plans are available. Contact Machinmate to arrange
                  supplier onboarding.
                </p>
              )}
              {selectedPlan && (
                <p>
                  {selectedPlan.price} {selectedPlan.currency} ·{' '}
                  {selectedPlan.billingInterval ?? 'CUSTOM'} ·{' '}
                  {selectedPlan.durationDays} days
                </p>
              )}
              {selectedPlan && Number(selectedPlan.price) > 0 && (
                <label className="block">
                  Payment method
                  <select
                    required
                    className="mt-1 w-full"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="">Choose a payment method</option>
                    {paymentOptions?.onlineAvailable &&
                      paymentOptions.currencies.includes(
                        selectedPlan.currency,
                      ) && (
                        <option value="SSLCOMMERZ">
                          SSLCOMMERZ secure checkout
                        </option>
                      )}
                    {paymentOptions?.manualMethods
                      .filter((m) =>
                        m.currencies.includes(selectedPlan.currency),
                      )
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (manual verification)
                        </option>
                      ))}
                  </select>
                  <p className="mt-2 text-meta">
                    Payment is completed after email verification. Manual
                    payments require a reference and proof according to the
                    selected method.
                  </p>
                </label>
              )}
              {selectedPlan &&
                Number(selectedPlan.price) > 0 &&
                paymentOptions &&
                !(
                  paymentOptions.onlineAvailable &&
                  paymentOptions.currencies.includes(selectedPlan.currency)
                ) &&
                !paymentOptions.manualMethods.some((m) =>
                  m.currencies.includes(selectedPlan.currency),
                ) && (
                  <p role="status" className="text-nav text-muted">
                    No payment method is currently available for this currency.
                    Choose the Free plan or contact Machinmate.
                  </p>
                )}
              <Button
                disabled={
                  !selectedPlan ||
                  (Number(selectedPlan.price) > 0 && !paymentMethod)
                }
                onClick={() => setPlanConfirmed(true)}
              >
                Continue to account details
              </Button>
            </div>
          ) : !account ? (
            <form
              onSubmit={form.handleSubmit(setAccount)}
              className="space-y-4"
            >
              {(['displayName', 'email'] as const).map((k) => (
                <label key={k} className="block text-nav font-medium">
                  {k === 'email' ? 'Email address' : 'Your name'}
                  <input
                    className="mt-1 w-full rounded-lg border p-3"
                    type={k === 'email' ? 'email' : 'text'}
                    autoComplete={k === 'email' ? 'email' : 'name'}
                    {...form.register(k)}
                    aria-invalid={!!form.formState.errors[k]}
                  />
                  {form.formState.errors[k] && (
                    <span role="alert" className="text-danger-foreground">
                      {form.formState.errors[k]?.message}
                    </span>
                  )}
                </label>
              ))}
              {(['password', 'confirmPassword'] as const).map((k) => (
                <div key={k}>
                  <label
                    htmlFor={`supplier-signup-${k}`}
                    className="mb-1 block text-nav font-medium"
                  >
                    {k === 'password' ? 'Password' : 'Confirm password'}
                  </label>
                  <PasswordInput
                    id={`supplier-signup-${k}`}
                    autoComplete="new-password"
                    {...form.register(k)}
                  />
                  {form.formState.errors[k] && (
                    <p role="alert" className="text-danger-foreground">
                      {form.formState.errors[k]?.message}
                    </p>
                  )}
                </div>
              ))}
              <Button type="submit">Continue to company details</Button>
            </form>
          ) : (
            <>
              <p className="font-semibold">
                Selected plan: {selectedPlan?.name} · {selectedPlan?.price}{' '}
                {selectedPlan?.currency}
              </p>
              <Button
                variant="secondary"
                onClick={() => setPlanConfirmed(false)}
              >
                Change plan
              </Button>
              <Button variant="ghost" onClick={() => setAccount(undefined)}>
                Edit account details
              </Button>
              <SupplierProfileForm
                initialSupplierType={supplierType}
                initialPaymentRegion={paymentRegion}
                onPaymentRegionChange={setPaymentRegion}
                onTypeChange={(type) => {
                  setSupplierType(type);
                  if (!selectedPlan?.eligibleTypes.includes(type)) {
                    setPlanId('');
                    setPlanConfirmed(false);
                  }
                }}
                token=""
                mode="application"
                onSave={() => {
                  setAccount(undefined);
                  setDone(true);
                }}
                submitOverride={async (profile, files) => {
                  if (
                    !planId ||
                    !plans?.some(
                      (p) =>
                        p.id === planId &&
                        p.eligibleTypes.includes(profile.type),
                    )
                  )
                    throw new Error(
                      'Choose a plan matching your company supplier type',
                    );
                  await paymentApi.register(
                    {
                      displayName: account.displayName,
                      email: account.email,
                      password: account.password,
                    },
                    {
                      ...profile,
                      paymentRegion: paymentRegionSchema.parse(
                        profile.paymentRegion,
                      ),
                    },
                    planId,
                    files,
                    Number(selectedPlan?.price) > 0 ? paymentMethod : undefined,
                  );
                }}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
