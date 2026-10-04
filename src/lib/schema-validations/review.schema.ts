import { z } from 'zod';
export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Choose a rating').max(5),
  body: z
    .string()
    .trim()
    .min(1, 'Describe your experience')
    .max(5000, 'Use at most 5,000 characters'),
});
