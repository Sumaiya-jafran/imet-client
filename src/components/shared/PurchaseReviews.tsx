'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { reviewApi } from '@/lib/api/review.service';
import type { ReviewEligibility, ReviewTarget, Review } from '@/types/review';
import ReviewForm from '@/components/forms/ReviewForm';
import Button from '@/components/buttons/Button';
import Badge from './Badge';
import RatingStars from './RatingStars';
import LoadingState from './LoadingState';
export default function PurchaseReviews({ saleId }: { saleId: string }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [data, setData] = useState<ReviewEligibility | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState<ReviewTarget | null>(null),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    reviewApi
      .eligibility(token, saleId)
      .then((r) => {
        if (active) {
          setData(r.data ?? null);
          setError('');
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : 'Unable to load review eligibility',
          );
      });
    return () => {
      active = false;
    };
  }, [token, saleId, revision]);
  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      const r = await reviewApi.eligibility(token!, saleId);
      setData(r.data ?? null);
      setEdit(null);
      setNotice(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save review');
    } finally {
      setBusy(false);
    }
  };
  if (!token) return null;
  return (
    <section className="surface space-y-5 p-5">
      <div>
        <p className="eyebrow">Verified purchase feedback</p>
        <h2 className="mt-2 text-lg font-semibold">
          Review your completed purchase
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Rate the winning supplier and linked machinery. Buyers need no
          subscription.
        </p>
      </div>
      {error && (
        <div role="alert" className="text-sm text-red-700">
          {error}
          <Button variant="secondary" onClick={() => setRevision((n) => n + 1)}>
            Reload reviews
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {!data && !error && <LoadingState label="Loading review eligibility…" />}
      {data && !data.eligible && <p>{data.reason}</p>}
      {data?.eligible && !data.targets.length && (
        <p className="text-sm text-slate-500">
          This sale has no supplier profile or linked machinery available for
          review.
        </p>
      )}
      {data?.eligible &&
        data.targets.map((target) => {
          const existing = data.reviews.find((r) => r.target === target.target);
          const editing = !existing || edit === target.target;
          const save = (value: { rating: number; body: string }) =>
            run(
              () =>
                existing
                  ? reviewApi.update(token, existing, value)
                  : reviewApi.create(token, saleId, target.target, value),
              'Review submitted for administrator approval.',
            );
          return (
            <article
              key={target.target}
              className="min-w-0 rounded-lg border border-slate-200 p-4"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="break-words font-semibold">
                  {target.target === 'SUPPLIER' ? 'Supplier' : 'Machinery'} ·{' '}
                  {target.name}
                </h3>
                {existing && <Badge>{existing.status}</Badge>}
              </div>
              {existing && !editing && (
                <>
                  <RatingStars rating={existing.rating} />
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                    {existing.body}
                  </p>
                  {existing.moderationNote && (
                    <p className="mt-3 text-sm text-amber-900">
                      Moderator feedback: {existing.moderationNote}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setEdit(target.target)}
                    >
                      Edit & resubmit
                    </Button>
                    {existing.status !== 'WITHDRAWN' && (
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => reviewApi.withdraw(token, existing as Review),
                            'Review withdrawn from public display.',
                          )
                        }
                      >
                        Withdraw review
                      </Button>
                    )}
                  </div>
                </>
              )}
              {editing && (
                <ReviewForm
                  key={existing?.updatedAt ?? target.target}
                  id={target.target}
                  rating={existing?.rating}
                  body={existing?.body}
                  busy={busy}
                  onSave={save}
                  onCancel={existing ? () => setEdit(null) : undefined}
                />
              )}
            </article>
          );
        })}
    </section>
  );
}
