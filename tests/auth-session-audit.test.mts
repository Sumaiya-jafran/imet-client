import assert from 'node:assert/strict';
import { test } from 'node:test';
process.env.NEXTAUTH_SECRET =
  'test-only-auth-secret-that-is-at-least-32-characters';
process.env.GOOGLE_CLIENT_ID = 'fixture.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'fixture-not-a-real-oauth-secret';
process.env.INTERNAL_BACKEND_API_URL = 'http://internal-api.test/api/v1';
const { authOptions } = await import('../src/lib/auth/options');
const callbacks = authOptions.callbacks!;
const account = {
  id: 'test-user',
  email: 'test@example.test',
  displayName: 'Test',
  roles: ['BUYER'],
  status: 'ACTIVE',
  isEmailVerified: true,
};
const auth = {
  user: account,
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
  expiresAt: Date.now() + 900000,
};

test('server authentication uses the internal API URL', async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input) => {
    calls.push(String(input));
    return Response.json({ success: true, data: auth });
  });
  const provider = authOptions.providers.find((p) => p.id === 'credentials')!;
  await (
    provider as unknown as {
      options: { authorize(c: unknown, r: unknown): Promise<unknown> };
    }
  ).options.authorize(
    { email: 'test@example.test', password: 'PasswordFixture123!' },
    {},
  );
  assert.equal(calls[0], 'http://internal-api.test/api/v1/auth/login');
});

test('logout revokes the stored refresh session even when its access token expired', async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input) => {
    const path = new URL(String(input)).pathname;
    calls.push(path);
    if (path.endsWith('/refresh-coordinated'))
      return Response.json({ success: true, data: auth });
    return new Response(null, { status: 200 });
  });
  await authOptions.events!.signOut!({
    token: { accessToken: 'expired-access', refreshToken: 'stored-refresh' },
  } as never);
  assert.deepEqual(calls, ['/api/v1/auth/logout-refresh']);
});

test('a transient refresh failure does not discard the refresh credential', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response(null, { status: 503 }),
  );
  const result = await callbacks.jwt!({
    token: {
      accessToken: 'old',
      refreshToken: 'retry-after-outage',
      expiresAt: 0,
    },
  } as never);
  assert.equal(result.refreshToken, 'retry-after-outage');
  assert.equal(result.error, 'RefreshUnavailable');
});

test('invalid refresh credentials are cleared and session responses never expose refresh credentials', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response(null, { status: 401 }),
  );
  const result = await callbacks.jwt!({
    token: {
      accessToken: 'expired',
      refreshToken: 'invalid-refresh',
      expiresAt: 0,
    },
  } as never);
  assert.equal(result.error, 'SessionExpired');
  assert.equal(result.refreshToken, undefined);
  assert.equal(result.accessToken, undefined);
  const session = await callbacks.session!({
    session: { user: {} },
    token: { accessToken: 'access', refreshToken: 'private-refresh', account },
  } as never);
  assert.equal(
    (session as unknown as Record<string, unknown>).refreshToken,
    undefined,
  );
});

test('concurrent JWT refreshes share one request and return the same rotation', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return Response.json({ success: true, data: auth });
  });
  const results = await Promise.all(
    [1, 2, 3].map(() =>
      callbacks.jwt!({
        token: {
          accessToken: 'expired',
          refreshToken: 'concurrent-refresh',
          expiresAt: 0,
        },
      } as never),
    ),
  );
  assert.equal(calls, 1);
  assert.ok(
    results.every(
      (result) =>
        result.refreshToken === 'new-refresh' && result.error === undefined,
    ),
  );
});

test('a temporary refresh failure recovers after retry instead of permanently expiring the session', async (t) => {
  let available = false;
  t.mock.method(globalThis, 'fetch', async () =>
    available
      ? Response.json({ success: true, data: auth })
      : new Response(null, { status: 503 }),
  );
  const failed = await callbacks.jwt!({
    token: {
      accessToken: 'expired',
      refreshToken: 'recovery-refresh',
      expiresAt: 0,
    },
  } as never);
  assert.equal(failed.error, 'RefreshUnavailable');
  available = true;
  await new Promise((resolve) => setTimeout(resolve, 5100));
  const recovered = await callbacks.jwt!({ token: failed } as never);
  assert.equal(recovered.error, undefined);
  assert.equal(recovered.accessToken, 'new-access');
  assert.equal(recovered.refreshToken, 'new-refresh');
});

test('Google OAuth keeps state, PKCE and nonce checks; profile data alone cannot sign in', async () => {
  const provider = authOptions.providers.find((p) => p.id === 'google')!;
  assert.deepEqual(
    (provider as unknown as { options: { checks: string[] } }).options.checks,
    ['pkce', 'state', 'nonce'],
  );
  const result = await callbacks.signIn!({
    user: { email: 'untrusted@example.test' },
    account: { provider: 'google' },
  } as never);
  assert.equal(result, '/auth/signin?error=GoogleCredential');
});
