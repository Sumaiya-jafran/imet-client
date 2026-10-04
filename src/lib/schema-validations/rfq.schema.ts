import { z } from 'zod';
const text = (max: number) => z.string().trim().min(1, 'Required').max(max);
const decimal = (digits: number, scale: number, positive = false) =>
  z
    .string()
    .regex(
      new RegExp(`^(0|[1-9]\\d{0,${digits - 1}})(\\.\\d{1,${scale}})?$`),
      'Use a decimal amount without separators',
    )
    .refine((v) => !positive || Number(v) > 0, 'Must be greater than zero');
export const rfqSchema = z
  .object({
    machineId: z.uuid().nullable(),
    categoryId: z.uuid().nullable(),
    title: text(200),
    description: text(20000),
    quantity: decimal(11, 3, true),
    unit: text(40),
    targetBudget: decimal(14, 2).nullable(),
    budgetCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .nullable(),
    deliveryLocation: text(2000),
    deliveryTimeline: text(500),
    supplierCountry: text(100).nullable(),
    preferredLanguage: z.enum(['en', 'bn', 'zh']),
  })
  .refine((b) => (b.targetBudget === null) === (b.budgetCurrency === null), {
    message: 'Budget amount and currency must be supplied together',
    path: ['budgetCurrency'],
  });
export const quoteSchema = z.object({
  unitPrice: decimal(14, 2),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Use a three-letter currency code'),
  moq: decimal(11, 3, true),
  leadTimeDays: z.number().int().min(0).max(3650),
  validUntil: text(100).refine(
    (v) => Number.isFinite(new Date(v).getTime()) && new Date(v) > new Date(),
    'Choose a future validity date',
  ),
  notes: z.string().trim().max(20000),
});
