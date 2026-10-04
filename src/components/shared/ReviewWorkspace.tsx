'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { reviewApi } from '@/lib/api/review.service';
import type { Review, ReviewList } from '@/types/review';
import Button from '@/components/buttons/Button';
import PageHeader from './PageHeader';
import Badge from './Badge';
import RatingStars from './RatingStars';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
function Moderation({
  review,
  busy,
  onSave,
}: {
  review: Review;
  busy: boolean;
  onSave: (
    status: 'PUBLISHED' | 'REJECTED' | 'HIDDEN',
    note: string,
  ) => Promise<unknown>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ status: 'PUBLISHED' | 'REJECTED' | 'HIDDEN'; note: string }>({
    defaultValues: { status: 'PUBLISHED', note: '' },
  });
  if (review.status === 'WITHDRAWN')
    return (
      <p className="mt-4 text-xs text-slate-500">
        Withdrawn by the buyer. The buyer must resubmit before moderation.
      </p>
    );
  return (
    <form
      onSubmit={handleSubmit((data) => onSave(data.status, data.note))}
      className="mt-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-2"
    >
      <label className="text-xs font-semibold">
        Moderation decision
        <select className="mt-1 w-full" {...register('status')} disabled={busy}>
          <option value="PUBLISHED">Publish</option>
          <option value="REJECTED">Reject</option>
          <option value="HIDDEN">Hide from public display</option>
        </select>
      </label>
      <label className="text-xs font-semibold">
        Feedback to buyer (optional)
        <textarea
          rows={2}
          className="mt-1 w-full"
          maxLength={2000}
          {...register('note', {
            maxLength: { value: 2000, message: 'Use at most 2,000 characters' },
          })}
          disabled={busy}
        />
        {errors.note && (
          <span className="text-red-700">{errors.note.message}</span>
        )}
      </label>
      <Button type="submit" disabled={busy}>
        Save moderation
      </Button>
    </form>
  );
}
export default function ReviewWorkspace({
  admin = false,
}: {
  admin?: boolean;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [query, setQuery] = useState(new URLSearchParams()),
    [data, setData] = useState<ReviewList | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    reviewApi
      .list(token, query, admin)
      .then((r) => {
        if (active) {
          setData(r.data ?? null);
          setError('');
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Unable to load reviews');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, query, admin, revision]);
  const apply = (q: URLSearchParams) => {
    setQuery(q);
    setLoading(true);
  };
  const moderate = async (
    r: Review,
    status: 'PUBLISHED' | 'REJECTED' | 'HIDDEN',
    note: string,
  ) => {
    if (!token) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await reviewApi.moderate(token, r, status, note);
      const response = await reviewApi.list(token, query, admin);
      setData(response.data ?? null);
      setNotice(
        'Moderation saved. Public ratings reflect published reviews only.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save moderation');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={admin ? 'Administration' : 'Buyer workspace'}
        title={admin ? 'Review moderation' : 'My reviews'}
        description={
          admin
            ? 'Approve completed-purchase feedback and manage public visibility.'
            : 'Manage feedback from your completed purchases. Edits return to approval.'
        }
      />
      <form
        key={query.toString()}
        onSubmit={(e) => {
          e.preventDefault();
          const q = new URLSearchParams();
          for (const [key, value] of new FormData(e.currentTarget)) {
            if (String(value).trim()) q.set(key, String(value).trim());
          }
          apply(q);
        }}
        className="filter-bar grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label>
          Search
          <input
            name="q"
            maxLength={100}
            className="mt-1 w-full"
            placeholder="Review text or target name"
            defaultValue={query.get('q') ?? ''}
          />
        </label>
        <label>
          Status
          <select
            name="status"
            className="mt-1 w-full"
            defaultValue={query.get('status') ?? ''}
          >
            <option value="">All statuses</option>
            {['PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN', 'WITHDRAWN'].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Review target
          <select
            name="target"
            className="mt-1 w-full"
            defaultValue={query.get('target') ?? ''}
          >
            <option value="">All targets</option>
            <option value="MACHINERY">Machinery</option>
            <option value="SUPPLIER">Supplier</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>
            Apply filters
          </Button>
          <Button
            variant="secondary"
            onClick={() => apply(new URLSearchParams())}
          >
            Clear
          </Button>
        </div>
      </form>
      {error && (
        <div role="alert" className="surface p-4">
          <p className="text-sm text-red-700">{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRevision((n) => n + 1);
            }}
          >
            Reload reviews
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {loading ? (
        <LoadingState label="Loading review workspace…" />
      ) : (
        data && (
          <>
            <p className="text-xs text-slate-500">
              {data.pagination.total} reviews
            </p>
            {!data.reviews.length && (
              <EmptyState
                title="No reviews found"
                description={
                  admin
                    ? 'Submitted buyer feedback will appear here for review.'
                    : 'Open a completed purchase to submit supplier or machinery feedback.'
                }
              >
                {!admin && (
                  <Link className="secondary-link" href="/dashboard/purchases">
                    View purchases
                  </Link>
                )}
              </EmptyState>
            )}
            {data.reviews.map((r) => (
              <article key={r.id} className="surface min-w-0 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow">
                      {r.target === 'MACHINERY'
                        ? 'Machinery review'
                        : 'Supplier review'}
                    </p>
                    <h2 className="mt-2 break-words font-semibold">
                      {r.machine?.name ?? r.supplier?.companyName}
                    </h2>
                    <p className="mt-2 break-words text-xs text-slate-500">
                      {r.author.displayName} ·{' '}
                      {r.sale.opportunity.recipient.rfq.rfqNumber} ·{' '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    tone={
                      r.status === 'PUBLISHED'
                        ? 'success'
                        : r.status === 'REJECTED' || r.status === 'HIDDEN'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
                <div className="mt-3">
                  <RatingStars rating={r.rating} />
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                  {r.body}
                </p>
                {r.moderationNote && (
                  <p className="mt-3 break-words text-sm text-amber-900">
                    Moderator feedback: {r.moderationNote}
                  </p>
                )}
                {admin ? (
                  <Moderation
                    key={r.updatedAt}
                    review={r}
                    busy={busy}
                    onSave={(status, note) => moderate(r, status, note)}
                  />
                ) : (
                  <Link
                    className="secondary-link mt-4"
                    href={`/dashboard/purchases/${r.saleId}`}
                  >
                    Manage purchase review
                  </Link>
                )}
              </article>
            ))}
            {data.pagination.totalPages > 1 && (
              <nav
                aria-label="Review workspace pagination"
                className="flex flex-wrap items-center gap-3"
              >
                <Button
                  variant="secondary"
                  disabled={data.pagination.page <= 1}
                  onClick={() => {
                    const q = new URLSearchParams(query);
                    q.set('page', String(data.pagination.page - 1));
                    apply(q);
                  }}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => {
                    const q = new URLSearchParams(query);
                    q.set('page', String(data.pagination.page + 1));
                    apply(q);
                  }}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )
      )}
    </div>
  );
}
