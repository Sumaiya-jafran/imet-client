import { z } from 'zod';
const optionalText = (max: number) =>
  z.string().trim().min(1).max(max).optional();
const slug = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .optional();
const money = z
  .string()
  .regex(/^(0|[1-9]\d{0,13})(\.\d{1,2})?$/)
  .optional();
export const catalogueSearchSchema = z
  .object({
    q: z.string().trim().max(100).default(''),
    category: slug,
    subcategory: slug,
    supplier: z.uuid().optional(),
    supplierName: optionalText(200),
    brand: optionalText(200),
    country: optionalText(100),
    condition: z.enum(['NEW', 'USED', 'REFURBISHED']).optional(),
    pricingMode: z.enum(['FIXED_PRICE', 'CONTACT_FOR_PRICE']).optional(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    minPrice: money,
    maxPrice: money,
    specLabel: optionalText(100),
    specValue: optionalText(500),
    sort: z
      .enum(['newest', 'oldest', 'price_asc', 'price_desc'])
      .default('newest'),
    page: z.coerce.number().int().min(1).max(10000).default(1),
  })
  .superRefine((q, ctx) => {
    if (
      (q.minPrice || q.maxPrice || q.sort.startsWith('price')) &&
      (!q.currency || q.pricingMode === 'CONTACT_FOR_PRICE')
    )
      ctx.addIssue({
        code: 'custom',
        path: ['currency'],
        message: 'Choose a currency for fixed-price sorting or ranges.',
      });
    if (!!q.specLabel !== !!q.specValue)
      ctx.addIssue({
        code: 'custom',
        path: ['specValue'],
        message: 'Supply both specification fields.',
      });
  });
