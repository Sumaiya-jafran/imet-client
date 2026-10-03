import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { AuthResponse } from '@/types/auth';
import { config } from '@/config/env';
const secret = process.env.NEXTAUTH_SECRET;
if (!secret || secret.length < 32)
  throw new Error('NEXTAUTH_SECRET must contain at least 32 characters');
const refreshes = new Map<string, Promise<AuthResponse>>();
async function refreshToken(token: string): Promise<AuthResponse> {
  const existing = refreshes.get(token);
  if (existing) return existing;
  const promise = (async () => {
    const response = await fetch(
      `${config.NEXT_PUBLIC_BACKEND_API_URL}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
        cache: 'no-store',
      },
    );
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error('Session expired');
    return body.data as AuthResponse;
  })();
  refreshes.set(token, promise);
  setTimeout(() => refreshes.delete(token), 5000).unref();
  return promise;
}
export const authOptions: NextAuthOptions = {
  secret,
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const response = await fetch(
          `${config.NEXT_PUBLIC_BACKEND_API_URL}/auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            cache: 'no-store',
          },
        );
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
    async jwt({ token, user }) {
      if (user)
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          expiresAt: user.expiresAt,
          account: user.account,
        };
      if (token.error) return token;
      if (token.expiresAt && Date.now() < token.expiresAt - 60_000)
        return token;
      try {
        if (!token.refreshToken) throw new Error();
        const auth = await refreshToken(token.refreshToken);
        return {
          ...token,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          expiresAt: auth.expiresAt,
          account: auth.user,
        };
      } catch {
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
      session.error = token.error;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (!token?.accessToken) return;
      await fetch(`${config.NEXT_PUBLIC_BACKEND_API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.accessToken}` },
        cache: 'no-store',
      }).catch(() => undefined);
    },
  },
};
