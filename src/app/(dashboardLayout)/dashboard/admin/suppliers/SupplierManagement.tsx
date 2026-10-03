'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Button from '@/components/buttons/Button';
import SupplierProfileForm from '@/components/forms/SupplierProfileForm';
import SupplierSubscriptionForm from '@/components/forms/SupplierSubscriptionForm';
import { supplierApi } from '@/lib/api/supplier.service';
import type {
  SupplierProfile,
  SupplierList,
  SubscriptionPlan,
} from '@/types/supplier';
import Link from 'next/link';
function ReviewForm({
  token,
  supplier,
  onSave,
}: {
  token: string;
  supplier: SupplierProfile;
  onSave: () => void;
}) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{
    status: SupplierProfile['status'];
    isVerified: boolean;
    marketplaceVisible: boolean;
    reviewNote: string;
  }>({
    defaultValues: {
      status: supplier.status,
      isVerified: supplier.isVerified,
      marketplaceVisible: supplier.marketplaceVisible,
      reviewNote: supplier.reviewNote ?? '',
    },
  });
  return (
    <form
      onSubmit={handleSubmit(async (body) => {
        setError('');
        try {
          await supplierApi.review(token, supplier, {
            ...body,
            reviewNote: body.reviewNote.trim() || null,
          });
          onSave();
        } catch (e) {
          setError(
            e instanceof Error ? e.message : 'Unable to review supplier',
          );
        }
      })}
      className="space-y-4 rounded-xl border bg-white p-5"
    >
      <h2 className="text-2xl font-semibold">Application review</h2>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <fieldset disabled={isSubmitting} className="space-y-4">
        <label className="block">
          Supplier status
          <select
            {...register('status')}
            className="mt-1 w-full rounded border p-2"
          >
            {['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INACTIVE'].map(
              (status) => (
                <option key={status}>{status}</option>
              ),
            )}
          </select>
        </label>
        <label className="block">
          <input type="checkbox" {...register('isVerified')} /> Verified
          supplier information
        </label>
        <label className="block">
          <input type="checkbox" {...register('marketplaceVisible')} /> Enable
          marketplace visibility (active subscription also required)
        </label>
        <label className="block">
          Review note / rejection reason
          <textarea
            {...register('reviewNote')}
            maxLength={2000}
            rows={3}
            className="mt-1 w-full rounded border p-2"
          />
        </label>
        <Button type="submit">
          {isSubmitting ? 'Saving…' : 'Save supplier review'}
        </Button>
      </fieldset>
    </form>
  );
}
export default function SupplierManagement() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [result, setResult] = useState<SupplierList>();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selected, setSelected] = useState<SupplierProfile>();
  const [profileEdit, setProfileEdit] = useState(false);
  const [filters, setFilters] = useState({ q: '', status: '', page: 1 });
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!token || session?.error) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      page: String(filters.page),
      limit: '20',
    });
    if (filters.q) query.set('q', filters.q);
    if (filters.status) query.set('status', filters.status);
    Promise.all([
      supplierApi.adminList(token, query, controller.signal),
      supplierApi.adminPlans(token),
    ])
      .then(([s, p]) => {
        if (!controller.signal.aborted) {
          setResult(s.data);
          setPlans(p.data ?? []);
          setError('');
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Unable to load suppliers');
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [token, session?.error, filters, revision]);
  const open = async (id: string) => {
    if (!token) return;
    setBusy(true);
    try {
      const response = await supplierApi.adminDetail(token, id);
      setSelected(response.data);
      setProfileEdit(false);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load supplier');
    } finally {
      setBusy(false);
    }
  };
  const reload = () => {
    setLoading(true);
    setRevision((n) => n + 1);
  };
  const saved = () => {
    if (selected) void open(selected.id);
    reload();
  };
  if (!token || session?.error) return <p role="alert">Sign in again.</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Supplier management</h1>
      <Link href="/dashboard/admin/subscriptions" className="underline">
        Manage subscription plans
      </Link>
      {error && (
        <div role="alert">
          <p className="text-red-700">{error}</p>
          <Button onClick={reload}>Reload suppliers</Button>
        </div>
      )}
      {selected ? (
        <>
          <Button
            onClick={() => {
              setSelected(undefined);
              setProfileEdit(false);
            }}
          >
            Back to suppliers
          </Button>
          <section className="rounded-xl border bg-white p-5">
            <h2 className="break-words text-2xl font-semibold">
              {selected.companyName}
            </h2>
            <dl className="my-4 space-y-2">
              <div>
                <dt className="font-semibold">Supplier type</dt>
                <dd>{selected.type}</dd>
              </div>
              <div>
                <dt className="font-semibold">Private contact</dt>
                <dd className="break-words">
                  {selected.contactName} · {selected.businessEmail} ·{' '}
                  {selected.businessPhone}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Private address</dt>
                <dd className="break-words">
                  {selected.address}, {selected.city}, {selected.country}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Registration number</dt>
                <dd>{selected.registrationNumber ?? 'Not provided'}</dd>
              </div>
            </dl>
            <p className="whitespace-pre-wrap break-words">
              {selected.description}
            </p>
            <h3 className="mt-4 font-semibold">
              Verification documents (private)
            </h3>
            {selected.documents.map((document, index) => (
              <a
                key={index}
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="my-2 block break-words underline"
              >
                {document.name}
              </a>
            ))}
            {!selected.documents.length && <p>None provided.</p>}
            <Button
              className="mt-4"
              onClick={() => setProfileEdit(!profileEdit)}
            >
              Edit supplier profile
            </Button>
          </section>
          {profileEdit && (
            <section className="rounded-xl border bg-white p-5">
              <p className="mb-3 text-sm text-slate-600">
                Administrative profile edits reset verification. Review and
                verify the updated information afterwards.
              </p>
              <SupplierProfileForm
                key={selected.updatedAt}
                token={token}
                supplier={selected}
                mode="admin"
                onSave={saved}
                onCancel={() => setProfileEdit(false)}
              />
            </section>
          )}
          <ReviewForm
            key={selected.updatedAt}
            token={token}
            supplier={selected}
            onSave={saved}
          />
          <SupplierSubscriptionForm
            key={`${selected.updatedAt}-${selected.subscriptions.map((term) => term.updatedAt).join('-')}`}
            token={token}
            supplier={selected}
            plans={plans}
            onSave={saved}
          />
        </>
      ) : (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const body = new FormData(event.currentTarget);
              setLoading(true);
              setFilters({
                q: String(body.get('q') ?? ''),
                status: String(body.get('status') ?? ''),
                page: 1,
              });
            }}
            className="grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2"
          >
            <label className="block">
              Search suppliers
              <input
                name="q"
                maxLength={100}
                defaultValue={filters.q}
                className="mt-1 w-full rounded border p-2"
              />
            </label>
            <label className="block">
              Filter supplier status
              <select
                name="status"
                defaultValue={filters.status}
                className="mt-1 w-full rounded border p-2"
              >
                <option value="">All statuses</option>
                {[
                  'PENDING',
                  'APPROVED',
                  'REJECTED',
                  'SUSPENDED',
                  'INACTIVE',
                ].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={loading}>
              Filter suppliers
            </Button>
          </form>
          {loading ? (
            <p role="status">Loading suppliers…</p>
          ) : (
            result && (
              <>
                <p>{result.pagination.total} suppliers</p>
                {result.suppliers.map((supplier) => (
                  <article
                    key={supplier.id}
                    className="rounded-xl border bg-white p-5"
                  >
                    <h2 className="break-words text-xl font-semibold">
                      {supplier.companyName}
                    </h2>
                    <p>
                      {supplier.type} · {supplier.status} · Subscription{' '}
                      {supplier.subscriptions.find((term) => term.isCurrent)
                        ?.effectiveStatus ?? 'None'}
                    </p>
                    <Button
                      disabled={busy}
                      className="mt-3"
                      onClick={() => void open(supplier.id)}
                    >
                      Review supplier
                    </Button>
                  </article>
                ))}
                {!result.suppliers.length && <p>No matching suppliers.</p>}
                <nav
                  aria-label="Supplier management pagination"
                  className="flex flex-wrap gap-3"
                >
                  <Button
                    disabled={filters.page <= 1}
                    onClick={() => {
                      setLoading(true);
                      setFilters({ ...filters, page: filters.page - 1 });
                    }}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {filters.page} of{' '}
                    {Math.max(1, result.pagination.totalPages)}
                  </span>
                  <Button
                    disabled={filters.page >= result.pagination.totalPages}
                    onClick={() => {
                      setLoading(true);
                      setFilters({ ...filters, page: filters.page + 1 });
                    }}
                  >
                    Next
                  </Button>
                </nav>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
