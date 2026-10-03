import type { CurrentUser } from './auth';
import type { DefaultSession } from 'next-auth';
declare module 'next-auth' {
  interface User {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    account: CurrentUser;
  }
  interface Session {
    accessToken?: string;
    error?: string;
    account?: CurrentUser;
    user: DefaultSession['user'];
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    account?: CurrentUser;
  }
}
