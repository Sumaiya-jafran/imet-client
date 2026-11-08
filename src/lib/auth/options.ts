import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { AuthResponse } from '@/types/auth';
import { config } from '@/config/env';
const secret = process.env.NEXTAUTH_SECRET;
if (!secret || secret.length < 32)
  throw new Error('NEXTAUTH_SECRET must contain at least 32 characters');
const backendApiUrl =
  process.env.INTERNAL_BACKEND_API_URL || config.NEXT_PUBLIC_BACKEND_API_URL;
class InvalidSessionError extends Error {}
const refreshes = new Map<string, Promise<AuthResponse>>();
async function refreshToken(token: string): Promise<AuthResponse> {
  const existing = refreshes.get(token);
  if (existing) return existing;
  const promise = (async () => {
    const response = await fetch(`${backendApiUrl}/auth/refresh-coordinated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if ([401, 403].includes(response.status))
      throw new InvalidSessionError('Session expired');
    if (!response.ok) throw new Error('Refresh unavailable');
    const body = await response.json();
    if (!body.success || !body.data?.refreshToken || !body.data?.accessToken)
      throw new Error('Refresh unavailable');
    return body.data as AuthResponse;
  })();
  refreshes.set(token, promise);
  setTimeout(() => refreshes.delete(token), 5000).unref();
  return promise;
}
// Exchanges only the provider's signed ID token; frontend profile fields are never trusted.
export async function googleSession(
  idToken: string,
  accessToken?: string,
): Promise<AuthResponse | string> {
  let stage = 'sign-in';
  try {
    if (accessToken) {
      stage = 'link';
      const linked = await fetch(`${backendApiUrl}/auth/google/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(15000),
      });
      if (!linked.ok) {
        console.warn('[auth] Google exchange rejected', {
          stage,
          status: linked.status,
        });
        return linked.status === 429
          ? 'GoogleRateLimit'
          : linked.status >= 500
            ? 'GoogleUnavailable'
            : 'GoogleLink';
      }
    }
    stage = 'sign-in';
    const response = await fetch(`${backendApiUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.warn('[auth] Google exchange rejected', {
        stage,
        status: response.status,
      });
      return response.status === 409
        ? 'AccountLinkRequired'
        : response.status === 403
          ? 'GoogleAccountUnavailable'
          : response.status === 429
            ? 'GoogleRateLimit'
            : response.status >= 500
              ? 'GoogleUnavailable'
              : 'GoogleCredential';
    }
    const body = await response.json();
    if (
      !body.success ||
      !body.data?.user?.id ||
      !body.data.accessToken ||
      !body.data.refreshToken
    )
      throw new Error('Invalid authentication response');
    return body.data as AuthResponse;
  } catch {
    // Never log provider credentials, profile data, response bodies or session tokens.
    console.warn('[auth] Google exchange unavailable', { stage });
    return 'GoogleUnavailable';
  }
}
export const authOptions: NextAuthOptions = {
  secret,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            checks: ['pkce', 'state', 'nonce'],
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const response = await fetch(`${backendApiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        });
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || 'Sign in failed');
        const auth = result.data as AuthResponse;
        return {
          id: auth.user.id,
          name: auth.user.displayName,
          email: auth.user.email,
          account: auth.user,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          expiresAt: auth.expiresAt,
        };
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;
      if (!account.id_token) return '/auth/signin?error=GoogleCredential';
      try {
        const current = await getServerSession(authOptions);
        const auth = await googleSession(
          account.id_token,
          current?.error ? undefined : current?.accessToken,
        );
        if (typeof auth === 'string') return `/auth/signin?error=${auth}`;
        Object.assign(user, {
          id: auth.user.id,
          name: auth.user.displayName,
          email: auth.user.email,
          account: auth.user,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          expiresAt: auth.expiresAt,
        });
        return true;
      } catch {
        console.warn('[auth] Google session lookup failed');
        return '/auth/signin?error=GoogleUnavailable';
      }
    },
    async jwt({ token, user, trigger }) {
      if (user)
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          expiresAt: user.expiresAt,
          account: user.account,
          error: undefined,
        };
      if (token.error && token.error !== 'RefreshUnavailable') return token;
      if (trigger === 'update' && token.accessToken) {
        const response = await fetch(`${backendApiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token.accessToken}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        });
        if (response.ok) {
          const body = await response.json();
          token.account = body.data as AuthResponse['user'];
          token.name = token.account.displayName;
        }
      }
      if (token.expiresAt && Date.now() < token.expiresAt - 60_000)
        return token;
      try {
        if (!token.refreshToken)
          throw new InvalidSessionError('Session expired');
        const auth = await refreshToken(token.refreshToken);
        return {
          ...token,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          expiresAt: auth.expiresAt,
          account: auth.user,
          error: undefined,
        };
      } catch (error) {
        if (!(error instanceof InvalidSessionError))
          return {
            ...token,
            accessToken: undefined,
            error: 'RefreshUnavailable',
          };
        return {
          ...token,
          error: 'SessionExpired',
          accessToken: undefined,
          refreshToken: undefined,
        };
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.account = token.account;
      if (session.user && token.account)
        session.user.name = token.account.displayName;
      session.error = token.error;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (!token?.refreshToken && !token?.accessToken) return;
      // The encrypted cookie retains the refresh credential, including when access expired.
      // Logout must revoke that session without requiring an otherwise active account.
      await fetch(
        `${backendApiUrl}/auth/${token.refreshToken ? 'logout-refresh' : 'logout'}`,
        {
          method: 'POST',
          headers: token.refreshToken
            ? { 'Content-Type': 'application/json' }
            : { Authorization: `Bearer ${token.accessToken}` },
          ...(token.refreshToken
            ? { body: JSON.stringify({ refreshToken: token.refreshToken }) }
            : {}),
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        },
      ).catch(() => undefined);
    },
  },
};
