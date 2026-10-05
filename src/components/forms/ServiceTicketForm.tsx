'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  serviceTicketSchema,
  type ServiceTicketFormValues,
} from '@/lib/schema-validations/serviceTicket.schema';
import { serviceTicketApi } from '@/lib/api/serviceTicket.service';
import type { EligiblePurchases } from '@/types/serviceTicket';
import Button from '@/components/buttons/Button';
import PageHeader from '@/components/shared/PageHeader';
import LoadingState from '@/components/shared/LoadingState';
import EmptyState from '@/components/shared/EmptyState';
export default function ServiceTicketForm({
  saleId,
  machine,
}: {
  saleId?: string;
  machine?: string;
}) {
  const { data: session } = useSession(),
    token = session?.accessToken,
    router = useRouter(),
    requestId = useRef<string>(undefined);
  const [purchases, setPurchases] = useState<EligiblePurchases>(),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState(1),
    [revision, setRevision] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceTicketFormValues>({
    resolver: zodResolver(serviceTicketSchema),
    defaultValues: {
      saleId: saleId ?? '',
      subject: '',
      description: '',
      warrantyRequested: false,
    },
  });
  useEffect(() => {
    if (!token) return;
    const c = new AbortController(),
      q = new URLSearchParams({ page: String(page), limit: '20' });
    if (saleId) q.set('saleId', saleId);
    if (machine) q.set('machine', machine);
    serviceTicketApi
      .eligible(token, q, c.signal)
      .then((r) => {
        if (!c.signal.aborted) {
          setPurchases(r.data);
          setError('');
          setLoading(false);
          if (saleId && r.data?.purchases.some((p) => p.saleId === saleId))
            setValue('saleId', saleId);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) {
          setError(
            e instanceof Error
              ? e.message
              : 'Unable to load eligible purchases',
          );
          setLoading(false);
        }
      });
    return () => c.abort();
  }, [token, page, saleId, machine, revision, setValue]);
  const submit = async (input: ServiceTicketFormValues) => {
    if (!token) return;
    requestId.current ??= crypto.randomUUID();
    setError('');
    try {
      const result = await serviceTicketApi.create(token, {
        ...input,
        customerRequestId: requestId.current,
      });
      if (!result.data)
        throw new Error(
          'Ticket response is unavailable. Retry with the same request.',
        );
      router.push('/dashboard/service-tickets/' + result.data.id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to submit service ticket',
      );
    }
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="After-sales support"
        title="Request machinery service"
        description="Choose your completed purchase. Describe the issue; your account and machinery references are linked securely."
      />
      <Link href="/dashboard/service-tickets" className="secondary-link">
        My service tickets
      </Link>
      {error && (
        <div role="alert" className="surface p-4 text-red-800">
          {error}
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRevision((v) => v + 1);
            }}
          >
            Reload eligible purchases
          </Button>
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading completed purchases…" />
      ) : purchases?.purchases.length ? (
        <form
          className="surface space-y-4 p-5"
          onSubmit={(event) => void handleSubmit(submit)(event)}
        >
          <div>
            <label htmlFor="ticket-sale" className="block font-medium">
              Completed purchase
            </label>
            <select
              id="ticket-sale"
              {...register('saleId')}
              aria-invalid={!!errors.saleId}
              aria-describedby="ticket-sale-error"
              className="mt-1 w-full"
            >
              <option value="">Choose a purchase</option>
              {purchases.purchases.map((p) => (
                <option key={p.saleId} value={p.saleId}>
                  {p.machine?.name} · {p.machine?.model} ·{' '}
                  {p.completedAt
                    ? new Date(p.completedAt).toLocaleDateString()
                    : p.saleId.slice(0, 8)}
                </option>
              ))}
            </select>
            <p id="ticket-sale-error" className="text-sm text-red-700">
              {errors.saleId?.message}
            </p>
          </div>
          <div>
            <label htmlFor="ticket-subject" className="block font-medium">
              Issue summary
            </label>
            <input
              id="ticket-subject"
              maxLength={200}
              {...register('subject')}
              aria-invalid={!!errors.subject}
              aria-describedby="ticket-subject-error"
              className="mt-1 w-full"
            />
            <p id="ticket-subject-error" className="text-sm text-red-700">
              {errors.subject?.message}
            </p>
          </div>
          <div>
            <label htmlFor="ticket-description" className="block font-medium">
              Problem and service details
            </label>
            <textarea
              id="ticket-description"
              rows={6}
              maxLength={10000}
              {...register('description')}
              aria-invalid={!!errors.description}
              aria-describedby="ticket-description-error"
              className="mt-1 w-full"
            />
            <p id="ticket-description-error" className="text-sm text-red-700">
              {errors.description?.message}
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" {...register('warrantyRequested')} />
            Request manual warranty review
          </label>
          <p className="text-xs text-slate-500">
            Warranty requests are reviewed by an administrator. No automatic
            coverage or service pricing is implied. Do not include passwords or
            unnecessary personal information.
          </p>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit service ticket'}
          </Button>
        </form>
      ) : (
        <EmptyState
          title="No eligible completed purchases"
          description="Service requests require your own completed purchase linked to an existing machinery record."
        />
      )}
      {purchases && purchases.pagination.totalPages > 1 && (
        <nav
          aria-label="Eligible purchase pagination"
          className="flex items-center gap-3"
        >
          <Button
            variant="secondary"
            disabled={page <= 1 || loading || isSubmitting}
            onClick={() => {
              setPage((v) => v - 1);
              setLoading(true);
            }}
          >
            Previous purchases
          </Button>
          <span>
            Page {page} of {purchases.pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={
              page >= purchases.pagination.totalPages || loading || isSubmitting
            }
            onClick={() => {
              setPage((v) => v + 1);
              setLoading(true);
            }}
          >
            Next purchases
          </Button>
        </nav>
      )}
    </div>
  );
}
