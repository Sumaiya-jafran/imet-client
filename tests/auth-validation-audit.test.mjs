import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  signupSchema,
  loginSchema,
  emailSchema,
  resetSchema,
} from '../src/lib/schema-validations/auth.schema.ts';
test('all auth email forms normalize whitespace/case and reject invalid addresses', () => {
  for (const schema of [loginSchema, emailSchema])
    assert.equal(
      schema.parse({
        email: '  Buyer@Example.test  ',
        password: 'FixturePassword123!',
      }).email,
      'buyer@example.test',
    );
  assert.equal(
    signupSchema.parse({
      displayName: 'Buyer',
      email: '  Buyer@Example.test  ',
      password: 'FixturePassword123!',
      confirmPassword: 'FixturePassword123!',
    }).email,
    'buyer@example.test',
  );
  assert.equal(emailSchema.safeParse({ email: 'bad-address' }).success, false);
});
test('signup and reset share the existing strong-password and confirmation policy', () => {
  for (const password of [
    'short',
    'lowercasepassword12',
    'UPPERCASEPASSWORD12',
    'NoNumberPassword',
    'A'.repeat(129),
  ])
    assert.equal(
      resetSchema.safeParse({ password, confirmPassword: password }).success,
      false,
    );
  assert.equal(
    resetSchema.safeParse({
      password: 'FixturePassword123!',
      confirmPassword: 'MismatchPassword123!',
    }).success,
    false,
  );
});
