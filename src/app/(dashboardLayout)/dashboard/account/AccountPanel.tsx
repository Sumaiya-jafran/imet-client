'use client';
import ProfileForm from '@/components/forms/ProfileForm';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CurrentUser } from '@/types/auth';
import { changeSchema } from '@/lib/schema-validations/auth.schema';
import { authService } from '@/lib/api/auth.service';
import Button from '@/components/buttons/Button';
export default function AccountPanel() {
  const { data: session } = useSession();
  const [user, setUser] = useState<CurrentUser>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof changeSchema>>({
    resolver: zodResolver(changeSchema),
  });
  useEffect(() => {
    if (!session?.accessToken || session.error) return;
    let active = true;
    authService
      .me(session.accessToken)
      .then((response) => {
        if (active) setUser(response.data);
      })
      .catch(() => {
        if (active) setError('Unable to load your account. Sign in again.');
      });
    return () => {
      active = false;
    };
  }, [session]);
  const logout = async (all: boolean) => {
    if (session?.error || !session?.accessToken) {
      await signOut({ callbackUrl: '/auth/signin' });
      return;
    }
    setBusy(true);
    setError('');
    try {
      await authService.logout(session.accessToken, all);
      await signOut({ callbackUrl: '/auth/signin' });
    } catch {
      setError('Unable to revoke your session. Try again.');
      setBusy(false);
    }
  };
  const change = async (values: z.infer<typeof changeSchema>) => {
    if (!session?.accessToken) return;
    setError('');
    try {
      await authService.change(values, session.accessToken);
      await signOut({ callbackUrl: '/auth/signin' });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to change password',
      );
    }
  };
  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-bold">Your account</h1>
        {error && (
          <p role="alert" className="mt-4 text-red-700">
            {error}
          </p>
        )}
        {session?.error && (
          <p role="alert">Your session expired. Sign in again.</p>
        )}
        {user ? (
          <dl className="my-5 space-y-2">
            <dt className="font-semibold">Name</dt>
            <dd>{user.displayName}</dd>
            <dt className="font-semibold">Email</dt>
            <dd>{user.email}</dd>
            <dt className="font-semibold">Roles</dt>
            <dd>{user.roles.join(', ')}</dd>
            <dt className="font-semibold">Account status</dt>
            <dd>{user.status}</dd>
          </dl>
        ) : (
          <p role="status" className="my-4">
            Loading account…
          </p>
        )}
        {user && session?.accessToken && (
          <ProfileForm
            token={session.accessToken}
            displayName={user.displayName}
            onSave={(displayName) => setUser({ ...user, displayName })}
          />
        )}
        {user?.roles.includes('ADMIN') && (
          <Link
            href="/dashboard/admin/users"
            className="block my-4 text-orange-dark"
          >
            Manage users
          </Link>
        )}
        {user?.roles.includes('ADMIN') && (
          <Link
            href="/dashboard/admin/catalogue"
            className="block my-4 text-orange-dark"
          >
            Manage catalogue
          </Link>
        )}
        <Link href="/dashboard/supplier" className="block my-4 underline">
          Supplier application / account
        </Link>
        {user?.roles.includes('ADMIN') && (
          <div className="my-4 flex flex-wrap gap-4">
            <Link href="/dashboard/admin/suppliers" className="underline">
              Manage suppliers
            </Link>
            <Link href="/dashboard/admin/subscriptions" className="underline">
              Manage subscription plans
            </Link>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => void logout(false)}>
            Sign out
          </Button>
          <Button disabled={busy} onClick={() => void logout(true)}>
            Sign out of all devices
          </Button>
        </div>
      </section>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-bold">Change password</h2>
        <p className="my-3 text-sm text-slate-600">
          Changing your password signs you out of all devices.
        </p>
        <form onSubmit={handleSubmit(change)} className="space-y-4" noValidate>
          {(['currentPassword', 'password', 'confirmPassword'] as const).map(
            (field) => (
              <div key={field}>
                <label htmlFor={field} className="block font-medium">
                  {
                    {
                      currentPassword: 'Current password',
                      password: 'New password',
                      confirmPassword: 'Confirm new password',
                    }[field]
                  }
                </label>
                <input
                  id={field}
                  type="password"
                  autoComplete={
                    field === 'currentPassword'
                      ? 'current-password'
                      : 'new-password'
                  }
                  {...register(field)}
                  aria-invalid={!!errors[field]}
                  aria-describedby={
                    errors[field] ? `${field}-error` : undefined
                  }
                  className="mt-1 w-full rounded border p-2"
                  disabled={isSubmitting}
                />
                {errors[field] && (
                  <p id={`${field}-error`} className="text-red-700">
                    {errors[field]?.message}
                  </p>
                )}
              </div>
            ),
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Changing…' : 'Change password'}
          </Button>
        </form>
      </section>
    </div>
  );
}
