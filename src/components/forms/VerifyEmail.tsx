'use client';
import { useState } from 'react';
import { authService } from '@/lib/api/auth.service';
import Button from '@/components/buttons/Button';
import Link from 'next/link';
export default function VerifyEmail({ token }: { token?: string }) {
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const invalidLink = !/^[a-f0-9]{64}$/.test(token || '');
  const verify = async () => {
    setBusy(true);
    setFailure('');
    try {
      const result = await authService.verify(token!);
      setMessage(result.message);
    } catch (error) {
      setFailure(
        error instanceof Error ? error.message : 'Verification failed',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="surface mx-auto max-w-md space-y-4 p-6 sm:p-8">
      <p className="eyebrow">Account verification</p>
      <h1 className="text-2xl font-bold">Verify your email</h1>
      <p className="text-sm text-slate-600">
        Confirm your email address to access your iMet account.
      </p>
      {invalidLink && (
        <p role="alert">
          This verification link is missing or invalid. Request a new link.
        </p>
      )}
      {failure && (
        <p role="alert" className="text-red-700">
          {failure}
        </p>
      )}
      {message ? (
        <p role="status">{message}</p>
      ) : (
        <Button disabled={invalidLink || busy} onClick={verify}>
          {busy ? 'Verifying…' : 'Verify email'}
        </Button>
      )}
      <nav className="flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-orange-dark">
        <Link href="/auth/signin">Sign in</Link>
        <Link href="/auth/resend-verification">Request a new link</Link>
      </nav>
    </section>
  );
}
