import { z } from 'zod';
const text = (max: number) => z.string().trim().min(1, 'Required').max(max);
const url = z
  .url()
  .max(2000)
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return (
        parsed.protocol === 'https:' && !parsed.username && !parsed.password
      );
    } catch {
      return false;
    }
  }, 'Use an HTTPS URL without embedded credentials');
export const supplierSchema = z.object({
  companyName: text(200),
  type: z.enum(['LOCAL', 'INTERNATIONAL']),
  description: text(20000),
  contactName: text(100),
  businessEmail: z.email().trim().toLowerCase().max(254),
  businessPhone: text(40),
  address: text(2000),
  city: text(100),
  country: text(100),
  registrationNumber: text(150).nullable(),
  website: url.nullable(),
  logoUrl: url.nullable(),
  documents: z.array(z.object({ name: text(200), url })).max(20),
});
export const planSchema = z.object({
  name: text(100),
  eligibleTypes: z
    .array(z.enum(['LOCAL', 'INTERNATIONAL']))
    .min(1, 'Select at least one supplier type')
    .max(2),
  durationDays: z.number().int().min(1).max(36500),
  price: z
    .string()
    .regex(
      /^(0|[1-9]\d{0,9})(\.\d{1,2})?$/,
      'Use a nonnegative amount with up to two decimal places',
    ),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Use a three-letter currency code'),
  listingLimit: z.number().int().min(1).max(100000),
  imageLimit: z.number().int().min(0).max(20),
  specificationLimit: z.number().int().min(0).max(100),
  canPublishMachinery: z.boolean(),
  rfqEnabled: z.boolean(),
  leadLimitPerMonth: z.number().int().min(0).max(1000000).nullable(),
  canRevealContacts: z.boolean(),
  visibility: z.enum(['HIDDEN', 'STANDARD', 'FEATURED']),
  isActive: z.boolean(),
});
