'use client';
import SupplierAssetFile from '@/components/shared/SupplierAssetFile';
import LoadingState from '@/components/shared/LoadingState';
import Badge from '@/components/shared/Badge';
import PageHeader from '@/components/shared/PageHeader';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import SupplierProfileForm from '@/components/forms/SupplierProfileForm';
import { supplierApi } from '@/lib/api/supplier.service';
import type { SupplierProfile, SubscriptionPlan } from '@/types/supplier';
export default function SupplierDashboard() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [supplier, setSupplier] = useState<SupplierProfile | null>();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const refresh = () => setRevision((n) => n + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  useEffect(() => {
    if (!token || session?.error) return;
    let active = true;
    Promise.all([supplierApi.own(token), supplierApi.plans(token)])
      .then(([s, p]) => {
        if (active) {
          setSupplier(s.data ?? null);
          setPlans(p.data ?? []);
          setLoading(false);
          setError('');
        }
      })
      .catch((e) => {
        if (active) {
          setError(
            e instanceof Error ? e.message : 'Unable to load supplier account',
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, session?.error, revision]);
  const reload = () => {
    setLoading(true);
    setEditing(false);
    setRevision((n) => n + 1);
  };
  if (!token || session?.error)
    return <p role="alert">Sign in again to manage your supplier account.</p>;
  return (
    <div className="space-y-6">
      <Link
        href="/subscription"
        className="mb-4 inline-block font-semibold text-secondary"
      >
        Manage subscription / secure activation
      </Link>
      <Link
        href="/plans"
        className="inline-block font-semibold text-secondary underline"
      >
        Upgrade / Plans &amp; Pricing
      </Link>
      <PageHeader
        title="Supplier account"
        eyebrow="Company workspace"
        description="Manage your company profile, application and subscription terms."
      />
      {error && (
        <div role="alert">
          <p className="text-danger-foreground">{error}</p>
          <Button variant="secondary" onClick={reload}>
            Reload supplier account
          </Button>
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading supplier account…" />
      ) : !supplier || supplier.status === 'REJECTED' ? (
        <section className="surface p-5">
          {supplier?.reviewNote && (
            <p role="status" className="mb-4">
              Application rejected: {supplier.reviewNote}. Update your
              application and resubmit.
            </p>
          )}
          <SupplierProfileForm
            key={supplier?.updatedAt ?? 'new'}
            token={token}
            supplier={supplier ?? undefined}
            mode="application"
            onSave={reload}
          />
        </section>
      ) : (
        <>
          <section className="surface p-5">
            <h2 className="text-card font-semibold">{supplier.companyName}</h2>
            <p className="mt-3">
              Application status:{' '}
              <Badge
                tone={supplier.status === 'APPROVED' ? 'success' : 'neutral'}
              >
                {supplier.status}
              </Badge>
            </p>
            <p>
              Verification: {supplier.isVerified ? 'Verified' : 'Not verified'}
            </p>
            <p>
              Marketplace visibility:{' '}
              {supplier.marketplaceVisible
                ? 'Enabled by admin'
                : 'Disabled by admin'}
            </p>
            {supplier.reviewNote && (
              <p className="my-3">Administrator note: {supplier.reviewNote}</p>
            )}
            {supplier.status === 'PENDING' && (
              <p className="mt-3 text-secondary">
                Your application is awaiting administrator review. Your buyer
                account remains available.
              </p>
            )}
            {['SUSPENDED', 'INACTIVE'].includes(supplier.status) && (
              <p className="mt-3 text-warning-foreground">
                Your storefront is unavailable and machinery management is
                restricted. Contact the administrator about the review note.
              </p>
            )}
            {supplier.status === 'APPROVED' && (
              <div className="mt-4 flex flex-wrap gap-4">
                {supplier.marketplaceVisible &&
                  supplier.subscriptions.some(
                    (term) =>
                      term.isCurrent &&
                      term.effectiveStatus === 'ACTIVE' &&
                      term.supplierType === supplier.type &&
                      term.visibility !== 'HIDDEN',
                  ) && (
                    <Link
                      className="secondary-link"
                      href={`/suppliers/${supplier.slug ?? supplier.id}`}
                    >
                      View public storefront
                    </Link>
                  )}
                <Button
                  variant="secondary"
                  onClick={() => setEditing(!editing)}
                >
                  Edit company profile
                </Button>
                <Link
                  className="self-center underline"
                  href="/dashboard/supplier/machinery"
                >
                  Manage your machinery
                </Link>
              </div>
            )}
          </section>
          {!!supplier.documents.length && (
            <section className="surface p-5">
              <h2 className="text-card font-semibold">
                Your private verification documents
              </h2>
              {supplier.documents.map((document, index) =>
                document.assetId ? (
                  <SupplierAssetFile
                    key={document.assetId}
                    token={token}
                    assetId={document.assetId}
                    name={document.name}
                  />
                ) : (
                  <a
                    key={index}
                    href={document.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block underline"
                  >
                    {document.name} (external)
                  </a>
                ),
              )}
            </section>
          )}
          {editing && (
            <section className="surface p-5">
              <SupplierProfileForm
                key={supplier.updatedAt}
                token={token}
                supplier={supplier}
                mode="owner"
                onSave={reload}
                onCancel={() => setEditing(false)}
              />
            </section>
          )}
          <section className="surface p-5">
            <h2 className="text-card font-semibold">Subscriptions</h2>
            <p className="my-3 text-nav text-secondary">
              An approved account and applicable active subscription are
              required for supplier listings. Activate through verified
              SSLCOMMERZ checkout or contact an administrator for a manual term.
            </p>
            {supplier.subscriptions.length ? (
              supplier.subscriptions.map((term) => (
                <div
                  key={term.id}
                  className="my-3 rounded-lg border border-border bg-background/60 p-4 text-nav"
                >
                  <p className="text-meta text-muted-foreground">
                    RFQ leads: {term.rfqEnabled ? 'Enabled' : 'Disabled'} ·
                    Monthly cap: {term.leadLimitPerMonth ?? 'Unlimited'} ·
                    Contact reveal:{' '}
                    {term.canRevealContacts
                      ? 'Allowed after acceptance'
                      : 'Disabled'}
                  </p>
                  <h3 className="font-semibold">
                    {term.planName} ·{' '}
                    {term.isCurrent ? 'Current term' : 'Previous term'}
                  </h3>
                  <p>
                    {term.effectiveStatus} ·{' '}
                    {new Date(term.startsAt).toLocaleDateString()} –{' '}
                    {new Date(term.endsAt).toLocaleDateString()}
                  </p>
                  <p>
                    {term.price} {term.currency} · Up to {term.listingLimit}{' '}
                    machinery listings
                  </p>
                  <p>
                    Publication{' '}
                    {term.canPublishMachinery ? 'allowed' : 'disabled'} ·{' '}
                    {term.visibility}
                  </p>
                </div>
              ))
            ) : (
              <p>No subscription assigned yet.</p>
            )}
          </section>
        </>
      )}
      <section className="surface p-5">
        <h2 className="text-card font-semibold">Available plans</h2>
        <p className="my-3 text-nav text-secondary">
          Plan prices are supplier subscription fees. No online payments are
          collected.
        </p>
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="my-3 rounded-lg border border-border bg-background/60 p-4 text-nav"
          >
            <h3 className="font-semibold">{plan.name}</h3>
            <p>
              {plan.price} {plan.currency} · {plan.durationDays} days ·{' '}
              {plan.listingLimit} listings
            </p>
            <p>
              {plan.visibility} · Publication{' '}
              {plan.canPublishMachinery ? 'allowed' : 'disabled'}
            </p>
          </article>
        ))}
        {!plans.length && <p>No eligible plans are currently available.</p>}
      </section>
    </div>
  );
}
