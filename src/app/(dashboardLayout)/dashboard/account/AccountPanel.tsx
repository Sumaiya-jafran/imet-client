'use client';
import PasswordInput from '@/components/forms/PasswordInput';
import { ApiError } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { signIn, getProviders } from 'next-auth/react';
import PageHeader from '@/components/shared/PageHeader';
import Badge from '@/components/shared/Badge';
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
import { ArrowRight } from 'lucide-react';
import { navGroups } from '@/config/dashboard-nav';
export default function AccountPanel() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  useEffect(() => {
    void getProviders().then((providers) =>
      setGoogleEnabled(Boolean(providers?.google)),
    );
  }, []);
  const [user, setUser] = useState<CurrentUser>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    setError: setFieldError,
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
        if (active) {
          setUser(response.data);
          setError('');
        }
      })
      .catch(() => {
        if (active)
          setError('Unable to load your account. Retry, or sign in again.');
      });
    return () => {
      active = false;
    };
  }, [session, attempt]);
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
      if (
        error instanceof ApiError &&
        error.status === 400 &&
        error.message === 'Current password is incorrect'
      )
        setFieldError('currentPassword', { message: error.message });
      if (error instanceof ApiError)
        for (const issue of error.response.errors || []) {
          const field = issue.path.at(-1);
          if (
            field === 'currentPassword' ||
            field === 'password' ||
            field === 'confirmPassword'
          )
            setFieldError(field, { message: issue.message });
        }
      setError(
        error instanceof Error ? error.message : 'Unable to change password',
      );
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account settings"
        title="Your account"
        description="Manage your profile, password and active sessions."
      />
      {user && (
        <section aria-labelledby="shortcuts-title">
          <h2 id="shortcuts-title" className="sr-only">
            Workspace shortcuts
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {navGroups(user.roles)
              .filter((g) => g.title !== 'Workspace')
              .map((group) => (
                <div key={group.title} className="surface p-5">
                  <p className="eyebrow">{group.title}</p>
                  <ul className="mt-4 grid min-w-0 gap-1">
                    {group.links.slice(0, 5).map(({ href, label, icon: Icon }) => (
                      <li key={href} className="min-w-0">
                        <Link
                          href={href}
                          className="group flex min-w-0 items-center gap-3 rounded px-2 py-2 text-nav font-medium text-primary hover:bg-background"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded bg-surface-muted text-secondary group-hover:bg-accent group-hover:text-foreground">
                            <Icon size={16} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{label}</span>
                          <ArrowRight
                            size={15}
                            aria-hidden="true"
                            className="text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <h2 className="text-card font-semibold">Profile & access</h2>
          {error && (
            <p role="alert" className="mt-4 text-danger-foreground">
              {error}
            </p>
          )}
          {session?.error && (
            <p role="alert">Your session expired. Sign in again.</p>
          )}
          {user ? (
            <dl className="my-5 grid grid-cols-[80px_1fr] items-start gap-x-4 gap-y-3 rounded-lg bg-background p-4 text-nav">
              <dt className="font-semibold">Name</dt>
              <dd>{user.displayName}</dd>
              <dt className="font-semibold">Email</dt>
              <dd>{user.email}</dd>
              <dt className="font-semibold">Roles</dt>
              <dd>{user.roles.join(', ')}</dd>
              <dt className="font-semibold">Account status</dt>
              <dd>
                <Badge tone={user.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {user.status.replaceAll('_', ' ')}
                </Badge>
              </dd>
            </dl>
          ) : error || session?.error || status === 'unauthenticated' ? (
            <div className="my-4 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setError('');
                  setAttempt((value) => value + 1);
                }}
                disabled={!!session?.error}
              >
                Retry account
              </Button>
              <Link href="/auth/signin">Sign in again</Link>
            </div>
          ) : (
            <p role="status" className="my-4">
              Loading account…
            </p>
          )}
          {user && session?.accessToken && (
            <ProfileForm
              token={session.accessToken}
              displayName={user.displayName}
              onSave={(displayName) => {
                setUser({ ...user, displayName });
                void update()
                  .then(() => router.refresh())
                  .catch(() => {
                    router.refresh();
                    setError(
                      'Profile saved. Reload to refresh your account header.',
                    );
                  });
              }}
            />
          )}
          {user?.roles.includes('ADMIN') && (
            <Link
              href="/dashboard/admin/users"
              className="block my-4 text-secondary"
            >
              Manage users
            </Link>
          )}
          {user?.roles.includes('ADMIN') && (
            <Link
              href="/dashboard/admin/catalogue"
              className="block my-4 text-secondary"
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
          <p className="my-3 text-nav text-secondary">
            Use Google and email/password for the same account. Connect Google
            using the same verified email. If you signed up with Google, set a
            password using the secure email link below.
          </p>
          <Button
            variant="secondary"
            disabled={!googleEnabled || busy}
            onClick={() => {
              setBusy(true);
              void signIn('google', {
                callbackUrl: '/dashboard/account',
              }).catch(() => {
                setBusy(false);
                setError('Unable to connect Google. Try again.');
              });
            }}
          >
            Link / sign in with Google
          </Button>
          <Link
            href="/auth/forgot-password"
            className="mt-3 block text-nav font-medium text-secondary underline"
          >
            Set or reset your password by email
          </Link>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void logout(false)}
            >
              Sign out
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => void logout(true)}
            >
              Sign out of all devices
            </Button>
          </div>
        </section>
        <section className="surface p-5 sm:p-6">
          <h2 className="text-section font-bold">Change password</h2>
          <p className="my-3 text-nav text-secondary">
            Changing your password signs you out of all devices.
          </p>
          <form
            onSubmit={handleSubmit(change)}
            className="space-y-4"
            noValidate
          >
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
                  <PasswordInput
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
                    disabled={
                      isSubmitting ||
                      busy ||
                      !!session?.error ||
                      !session?.accessToken
                    }
                  />
                  {errors[field] && (
                    <p id={`${field}-error`} className="text-danger-foreground">
                      {errors[field]?.message}
                    </p>
                  )}
                </div>
              ),
            )}
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                busy ||
                !!session?.error ||
                !session?.accessToken
              }
            >
              {isSubmitting ? 'Changing…' : 'Change password'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
