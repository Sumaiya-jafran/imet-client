'use client';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, LoaderCircle } from 'lucide-react';
import { authService } from '@/lib/api/auth.service';
import { ApiError } from '@/lib/api/client';
export default function SignOutButton() {
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const logout = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (session?.accessToken && !session.error) {
        try {
          await authService.logout(session.accessToken);
        } catch (error) {
          // An expired/revoked session still needs its local cookie cleared.
          if (!(error instanceof ApiError && [401, 403].includes(error.status)))
            throw error;
        }
      }
      await signOut({ callbackUrl: '/auth/signin' });
    } catch {
      setError('Unable to sign out. Please try again.');
      setBusy(false);
    }
  };
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={busy}
        onClick={() => void logout()}
        aria-describedby={error ? 'dashboard-signout-error' : undefined}
        className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? (
          <LoaderCircle
            size={16}
            aria-hidden="true"
            className="shrink-0 motion-safe:animate-spin"
          />
        ) : (
          <LogOut size={16} aria-hidden="true" className="shrink-0" />
        )}
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
      {error && (
        <p
          id="dashboard-signout-error"
          role="alert"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-red-200 bg-white p-3 text-xs text-red-700 shadow-lg"
        >
          {error}
        </p>
      )}
    </div>
  );
}
