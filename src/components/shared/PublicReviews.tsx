'use client';
import TranslatedText from '@/components/shared/TranslatedText';
import { useEffect, useState } from 'react';
import { reviewApi } from '@/lib/api/review.service';
import type { ReviewTarget, PublicReviewsResult } from '@/types/review';
import Button from '@/components/buttons/Button';
import RatingStars from './RatingStars';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
export default function PublicReviews({
  target,
  targetId,
}: {
  target: ReviewTarget;
  targetId: string;
}) {
  const [data, setData] = useState<PublicReviewsResult | null>(null),
    [page, setPage] = useState(1),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    reviewApi
      .public(target, targetId, page)
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
  }, [target, targetId, page, revision]);
  return (
    <section aria-labelledby={`reviews-${targetId}`} className="mt-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Completed-purchase reviews</p>
          <h2 id={`reviews-${targetId}`} className="mt-2 text-xl font-semibold">
            Buyer ratings & reviews
          </h2>
        </div>
        {data && (
          <p className="text-sm">
            {data.summary.average === null
              ? 'Not rated yet'
              : `${data.summary.average.toFixed(1)} / 5`}{' '}
            · {data.summary.count}{' '}
            {data.summary.count === 1 ? 'review' : 'reviews'}
          </p>
        )}
      </div>
      {loading ? (
        <LoadingState label="Loading buyer reviews…" />
      ) : error ? (
        <div role="alert" className="surface p-4">
          <p>{error}</p>
          <Button
            onClick={() => {
              setLoading(true);
              setRevision((n) => n + 1);
            }}
          >
            Retry reviews
          </Button>
        </div>
      ) : (
        data && (
          <>
            {!!data.summary.count && (
              <div className="surface grid grid-cols-1 gap-5 p-5 sm:grid-cols-[auto_1fr]">
                <div>
                  <p className="text-3xl font-semibold">
                    {data.summary.average?.toFixed(1)}
                  </p>
                  <RatingStars rating={data.summary.average ?? 0} />
                  <p className="mt-2 text-xs text-slate-500">
                    Approved buyer feedback
                  </p>
                </div>
                <dl className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div
                      key={rating}
                      className="flex items-center gap-3 text-xs"
                    >
                      <dt className="w-10 shrink-0">{rating} stars</dt>
                      <dd className="flex flex-1 items-center gap-3">
                        <span className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
                          <span
                            className="block h-full bg-orange-dark"
                            style={{
                              width: `${(100 * (data.summary.distribution[String(rating)] ?? 0)) / data.summary.count}%`,
                            }}
                          />
                        </span>
                        <span className="w-5 text-right">
                          {data.summary.distribution[String(rating)] ?? 0}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {!data.reviews.length && (
              <EmptyState
                title="No published reviews yet"
                description="Reviews from completed purchases appear here after administrator approval."
              />
            )}
            {data.reviews.map((r) => (
              <article key={r.id} className="surface min-w-0 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="break-words font-semibold">
                    {r.author.displayName}
                  </p>
                  <span className="text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2">
                  <RatingStars rating={r.rating} />
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                  <TranslatedText
                    resource={{ type: 'REVIEW', id: r.id, field: 'BODY' }}
                    original={r.body}
                    showStatus
                  />
                </p>
              </article>
            ))}
            {data.pagination.totalPages > 1 && (
              <nav
                className="flex flex-wrap items-center gap-3"
                aria-label="Review pagination"
              >
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => {
                    setLoading(true);
                    setPage((n) => n - 1);
                  }}
                >
                  Previous reviews
                </Button>
                <span className="text-sm">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => {
                    setLoading(true);
                    setPage((n) => n + 1);
                  }}
                >
                  Next reviews
                </Button>
              </nav>
            )}
          </>
        )
      )}
    </section>
  );
}
