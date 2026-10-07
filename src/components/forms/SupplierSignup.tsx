'use client';
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
  const [account, setAccount] = useState<z.infer<typeof signupSchema>>();
  const [plans, setPlans] =
    useState<Omit<SubscriptionPlan, 'isActive' | 'updatedAt'>[]>();
  const [planId, setPlanId] = useState(initialPlan ?? '');
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
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <p className="text-sm text-slate-600">
        Already registered?{' '}
        <Link
          className="font-semibold text-orange"
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
          <h1 className="text-2xl font-semibold">Verify your email</h1>
          <p>
            If your address is eligible, a verification link has been sent. Your
            supplier account stays pending until subscription activation.
          </p>
          <p>
            After verification, sign in to upload files and complete secure
            checkout.
          </p>
          <Link
            className="font-semibold text-orange"
            href="/auth/signin?callbackUrl=%2Fsubscription"
          >
            Continue to sign in
          </Link>
        </section>
      ) : (
        <section className="surface space-y-5 p-5 sm:p-8">
          <header>
            <p className="eyebrow">Supplier onboarding</p>
            <h1 className="text-2xl font-semibold">
              Build your marketplace presence
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Company details → email verification → subscription activation.
              Buyers never need a plan.
            </p>
          </header>
          {error && (
            <div role="alert" className="text-red-700">
              {error}{' '}
              <Button
                variant="secondary"
                onClick={() => setAttempt((n) => n + 1)}
              >
                Reload plans
              </Button>
            </div>
          )}
          {!account ? (
            <form
              onSubmit={form.handleSubmit(setAccount)}
              className="space-y-4"
            >
              {(['displayName', 'email'] as const).map((k) => (
                <label key={k} className="block text-sm font-medium">
                  {k === 'email' ? 'Email address' : 'Your name'}
                  <input
                    className="mt-1 w-full rounded-lg border p-3"
                    type={k === 'email' ? 'email' : 'text'}
                    autoComplete={k === 'email' ? 'email' : 'name'}
                    {...form.register(k)}
                    aria-invalid={!!form.formState.errors[k]}
                  />
                  {form.formState.errors[k] && (
                    <span role="alert" className="text-red-700">
                      {form.formState.errors[k]?.message}
                    </span>
                  )}
                </label>
              ))}
              {(['password', 'confirmPassword'] as const).map((k) => (
                <div key={k}>
                  <label
                    htmlFor={`supplier-signup-${k}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    {k === 'password' ? 'Password' : 'Confirm password'}
                  </label>
                  <PasswordInput
                    id={`supplier-signup-${k}`}
                    autoComplete="new-password"
                    {...form.register(k)}
                  />
                  {form.formState.errors[k] && (
                    <p role="alert" className="text-red-700">
                      {form.formState.errors[k]?.message}
                    </p>
                  )}
                </div>
              ))}
              <Button type="submit">Continue to company details</Button>
            </form>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setAccount(undefined)}>
                Edit account details
              </Button>
              <label className="block text-sm font-medium">
                Choose an administrator-defined plan
                <select
                  required
                  className="mt-1 w-full rounded-lg border p-3"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                >
                  <option value="">
                    {plans ? 'Select a plan' : 'Loading plans…'}
                  </option>
                  {plans
                    ?.filter((p) => p.eligibleTypes.includes(supplierType))
                    .map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name} · {p.price} {p.currency} · {p.durationDays}{' '}
                        days
                      </option>
                    ))}
                </select>
              </label>
              {plans?.length === 0 && (
                <p role="status">
                  No active plans are available. Contact iMet to arrange
                  supplier onboarding.
                </p>
              )}
              <SupplierProfileForm
                onTypeChange={(type) => {
                  setSupplierType(type);
                  setPlanId('');
                }}
                token=""
                mode="application"
                onSave={() => {
                  setAccount(undefined);
                  setDone(true);
                }}
                submitOverride={async (profile) => {
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
                    profile,
                    planId,
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
