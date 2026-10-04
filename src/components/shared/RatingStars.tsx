import { Star } from 'lucide-react';
export default function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className="inline-flex gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={15}
          aria-hidden="true"
          className={
            star <= Math.round(rating)
              ? 'fill-orange-dark text-orange-dark'
              : 'text-slate-300'
          }
        />
      ))}
    </span>
  );
}
