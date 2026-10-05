import { z } from 'zod';
export const serviceTicketSchema = z.object({
  saleId: z.uuid('Choose your completed purchase'),
  subject: z.string().trim().min(1, 'Describe the issue briefly').max(200),
  description: z
    .string()
    .trim()
    .min(1, 'Describe the issue and relevant service details')
    .max(10000),
  warrantyRequested: z.boolean(),
});
export type ServiceTicketFormValues = z.infer<typeof serviceTicketSchema>;
export const ticketNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, 'Enter a progress update or comment')
    .max(5000),
  visibility: z.enum(['PUBLIC', 'INTERNAL']),
});
export const ticketActionSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, 'Enter a diagnosis, resolution or assessment')
    .max(5000),
});
