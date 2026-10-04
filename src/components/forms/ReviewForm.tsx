'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react';
import { reviewSchema } from '@/lib/schema-validations/review.schema';
import Button from '@/components/buttons/Button';
export default function ReviewForm({
  id,
  rating = 5,
  body = '',
  busy,
  onSave,
  onCancel,
}: {
  id: string;
  rating?: number;
  body?: string;
  busy: boolean;
  onSave: (data: { rating: number; body: string }) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ rating: number; body: string }>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating, body },
  });
  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSave)}>
      <fieldset disabled={busy || isSubmitting}>
        <legend className="text-sm font-semibold">Your rating</legend>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${field.value === value ? 'border-orange-dark bg-orange/5' : 'border-slate-200'}`}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={value}
                    checked={field.value === value}
                    onChange={() => field.onChange(value)}
                    onBlur={field.onBlur}
                    ref={value === 1 ? field.ref : undefined}
                    aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                  />
                  <span>{value}</span>
                  <Star
                    size={14}
                    aria-hidden="true"
                    className="text-orange-dark"
                  />
                </label>
              ))}
            </div>
          )}
        />
        {errors.rating && (
          <p role="alert" className="text-xs text-red-700">
            {errors.rating.message}
          </p>
        )}
      </fieldset>
      <div>
        <label
          className="block text-sm font-semibold"
          htmlFor={`review-body-${id}`}
        >
          Your experience
        </label>
        <textarea
          id={`review-body-${id}`}
          rows={4}
          maxLength={5000}
          className="mt-2 w-full"
          {...register('body')}
          disabled={busy || isSubmitting}
          aria-invalid={!!errors.body}
          aria-describedby={`review-help-${id} review-error-${id}`}
        />
        <p id={`review-help-${id}`} className="mt-1 text-xs text-slate-500">
          Describe the machinery or supplier experience. Keep contact details
          and private commercial information out of your review.
        </p>
        <p id={`review-error-${id}`} className="text-xs text-red-700">
          {errors.body?.message}
        </p>
      </div>
      <p className="text-xs text-slate-500">
        New and edited reviews require administrator approval before
        publication.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit for approval'}
        </Button>
        {onCancel && (
          <Button
            variant="secondary"
            disabled={busy || isSubmitting}
            onClick={onCancel}
          >
            Cancel editing
          </Button>
        )}
      </div>
    </form>
  );
}
