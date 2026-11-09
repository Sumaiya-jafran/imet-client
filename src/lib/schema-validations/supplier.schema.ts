import { z } from 'zod';
export const paymentRegionValues = [
  'BANGLADESH',
  'CHINA',
  'INTERNATIONAL',
] as const;
export type PaymentRegion = (typeof paymentRegionValues)[number];
export const paymentRegionSchema = z.enum(paymentRegionValues, {
  error: 'Select where you will be making your payments from',
});
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
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .refine(
      (value) =>
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value,
        ),
      'Choose a business slug, not a UUID',
    )
    .or(z.literal(''))
    .optional()
    .transform((value) => value || undefined),
  type: z.enum(['LOCAL', 'INTERNATIONAL']),
  description: text(20000),
  contactName: text(100),
  businessEmail: z.email().trim().toLowerCase().max(254),
  businessPhone: text(40),
  address: text(2000),
  city: text(100),
  country: text(100),
  paymentRegion: paymentRegionSchema.nullable().optional(),
  registrationNumber: text(150).nullable(),
  website: url.nullable(),
  logoUrl: z
    .union([
      url,
      z.string().regex(/^\/suppliers\/assets\/[0-9a-f-]{36}\/logo$/),
    ])
    .nullable(),
  logoAssetId: z.uuid().nullable().optional(),
  documents: z
    .array(
      z.object({
        name: text(200),
        url: z.union([
          url,
          z.string().regex(/^\/supplier\/assets\/[0-9a-f-]{36}\/content$/),
        ]),
        assetId: z.uuid().optional(),
      }),
    )
    .max(20),
});
export const supplierRegistrationSchema = supplierSchema.superRefine(
  (profile, ctx) => {
    if (!profile.paymentRegion)
      ctx.addIssue({
        code: 'custom',
        path: ['paymentRegion'],
        message: 'Select where you will be making your payments from',
      });
  },
);
export const planSchema = z.object({
  description: z.string().trim().max(2000).optional(),
  billingInterval: z.enum(['MONTHLY', 'ANNUAL', 'CUSTOM']).optional(),
  sparePartsLimit: z.number().int().min(0).max(100000).optional(),
  serviceLimit: z.number().int().min(0).max(100000).optional(),
  featuredLimit: z.number().int().min(0).max(100000).optional(),
  hiddenPriceAllowed: z.boolean().optional(),
  features: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
  isFree: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
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
