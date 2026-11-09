import assert from 'node:assert/strict';
import { test } from 'node:test';
import { paymentRegionOptions } from '../src/config/payment-regions.ts';
import {
  paymentRegionValues,
  supplierSchema,
  supplierRegistrationSchema,
} from '../src/lib/schema-validations/supplier.schema.ts';
const profile = {
  companyName: 'Supplier',
  type: 'LOCAL',
  description: 'Industrial machinery',
  contactName: 'Owner',
  businessEmail: 'owner@example.test',
  businessPhone: '123',
  address: 'Street',
  city: 'Dhaka',
  country: 'Bangladesh',
  registrationNumber: null,
  website: null,
  logoUrl: null,
  documents: [],
};
test('payment-region choices are exactly the three requested enum values and labels', () => {
  assert.deepEqual(paymentRegionValues, [
    'BANGLADESH',
    'CHINA',
    'INTERNATIONAL',
  ]);
  assert.deepEqual(
    paymentRegionOptions.map((option) => option.value),
    [...paymentRegionValues],
  );
  assert.deepEqual(
    paymentRegionOptions.map((option) => option.label),
    ['Bangladesh', 'China', 'Other Countries'],
  );
});
test('new registrations require an explicit valid payment region independent of business country', () => {
  for (const value of [
    undefined,
    null,
    '',
    'OTHER',
    'EPS',
    'bangladesh',
    123,
  ]) {
    const result = supplierRegistrationSchema.safeParse({
      ...profile,
      paymentRegion: value,
    });
    assert.equal(result.success, false);
    assert.ok(
      result.error.issues.some((issue) => issue.path[0] === 'paymentRegion'),
    );
  }
  for (const paymentRegion of paymentRegionValues) {
    const result = supplierRegistrationSchema.parse({
      ...profile,
      paymentRegion,
    });
    assert.equal(result.paymentRegion, paymentRegion);
    assert.equal(result.country, 'Bangladesh');
  }
});
test('legacy supplier forms allow unspecified payment origin without creating a default', () => {
  assert.equal(supplierSchema.parse(profile).paymentRegion, undefined);
  assert.equal(
    supplierSchema.parse({ ...profile, paymentRegion: null }).paymentRegion,
    null,
  );
});
