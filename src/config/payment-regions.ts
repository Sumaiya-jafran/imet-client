import type { PaymentRegion } from '../lib/schema-validations/supplier.schema';
export type { PaymentRegion } from '../lib/schema-validations/supplier.schema';
export const paymentRegionOptions: {
  value: PaymentRegion;
  label: string;
  description: string;
}[] = [
  {
    value: 'BANGLADESH',
    label: 'Bangladesh',
    description: 'For suppliers making payments from Bangladesh.',
  },
  {
    value: 'CHINA',
    label: 'China',
    description: 'For suppliers making payments from China.',
  },
  {
    value: 'INTERNATIONAL',
    label: 'Other Countries',
    description:
      'For suppliers making payments from outside Bangladesh and China.',
  },
];
