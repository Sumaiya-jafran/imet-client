import { z } from 'zod';
export const salesNotesSchema = z.object({
  internalNotes: z.string().trim().max(5000, 'Use at most 5,000 characters'),
});
export const saleCancellationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Provide a cancellation reason')
    .max(2000, 'Use at most 2,000 characters'),
});
