'use client';
import { useState } from 'react';
import { authService } from '@/lib/api/auth.service';
import Button from '@/components/buttons/Button';
import Link from 'next/link';
export default function VerifyEmail({ token }: { token?: string }) {
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
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
    <section className="mx-auto max-w-md space-y-4 rounded-xl border bg-white p-6">
      <h1 className="text-2xl font-bold">Verify your email</h1>
      {!token && (
        <p role="alert">This verification link is missing its token.</p>
      )}
      {failure && (
        <p role="alert" className="text-red-700">
          {failure}
        </p>
      )}
      {message ? (
        <p role="status">{message}</p>
      ) : (
        <Button disabled={!token || busy} onClick={verify}>
          {busy ? 'Verifying…' : 'Verify email'}
        </Button>
      )}
      <nav className="flex gap-4 text-orange-dark">
        <Link href="/auth/signin">Sign in</Link>
        <Link href="/auth/resend-verification">Request a new link</Link>
      </nav>
    </section>
  );
}
