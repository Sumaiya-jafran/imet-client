import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeReturnUrl } from '../src/lib/auth/returnUrl.ts';
test('auth return path preserves local destinations and rejects remote, malformed and auth-loop targets', () => {
  for (const value of [
    undefined,
    null,
    '',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/%5c%5cevil.example',
    '/%2f%2fevil.example',
    '/dashboard/../auth/signin',
    '/dashboard/../api/auth/signout',
    '/auth/signin',
    '/api/auth/session',
    '/dashboard%ZZ',
    '/dashboard\n',
  ])
    assert.equal(safeReturnUrl(value), '/dashboard/account', String(value));
  assert.equal(
    safeReturnUrl('/dashboard/account?tab=security#password'),
    '/dashboard/account?tab=security#password',
  );
  assert.equal(
    safeReturnUrl('/dashboard/rfqs/new?machineId=123'),
    '/dashboard/rfqs/new?machineId=123',
  );
});
