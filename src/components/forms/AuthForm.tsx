'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PasswordInput from './PasswordInput';
import { safeReturnUrl } from '@/lib/auth/returnUrl';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/auth.service';
import { ApiError } from '@/lib/api/client';
import {
  signupSchema,
  loginSchema,
  emailSchema,
  resetSchema,
} from '@/lib/schema-validations/auth.schema';
import Button from '@/components/buttons/Button';
import Link from 'next/link';
type Mode =
  | 'signup'
  | 'signin'
  | 'forgot-password'
  | 'resend-verification'
  | 'reset-password';
const schemas = {
  signup: signupSchema,
  signin: loginSchema,
  'forgot-password': emailSchema,
  'resend-verification': emailSchema,
  'reset-password': resetSchema,
};
const titles = {
  signup: 'Create your account',
  signin: 'Sign in',
  'forgot-password': 'Forgot password',
  'resend-verification': 'Resend verification email',
  'reset-password': 'Reset password',
};
export default function AuthForm({
  mode,
  token,
  callbackUrl,
  googleEnabled = false,
  oauthError,
}: {
  mode: Mode;
  token?: string;
  callbackUrl?: string;
  googleEnabled?: boolean;
  oauthError?: string;
}) {
  const schema = schemas[mode];
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<Values>({ resolver: zodResolver(schema) });
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState(
    oauthError
      ? oauthError === 'AccountLinkRequired'
        ? 'Sign in with your password, then link Google in account settings.'
        : 'Google sign-in failed. Try again or use email and password.'
      : '',
  );
  const [googleBusy, setGoogleBusy] = useState(false);
  const router = useRouter();
  const fields =
    mode === 'signup'
      ? ['displayName', 'email', 'password', 'confirmPassword']
      : mode === 'signin'
        ? ['email', 'password']
        : mode === 'reset-password'
          ? ['password', 'confirmPassword']
          : ['email'];
  const labels: Record<string, string> = {
    displayName: 'Full name',
    email: 'Email address',
    password: mode === 'reset-password' ? 'New password' : 'Password',
    confirmPassword: 'Confirm password',
  };
  const onSubmit = async (data: Values) => {
    setFailure('');
    setMessage('');
    try {
      const values = data as {
        displayName: string;
        email: string;
        password: string;
        confirmPassword: string;
      };
      if (mode === 'signin') {
        const result = await signIn('credentials', {
          redirect: false,
          callbackUrl: safeReturnUrl(callbackUrl),
          email: values.email,
          password: values.password,
        });
        if (!result?.ok || result.error) {
          setFailure(result?.error || 'Unable to sign in');
          return;
        }
        const currentSession = await getSession();
        router.push(
          currentSession?.account?.status === 'PENDING'
            ? /^\/payments\/[0-9a-f-]{36}$/.test(safeReturnUrl(callbackUrl))
              ? safeReturnUrl(callbackUrl)
              : '/subscription'
            : safeReturnUrl(callbackUrl),
        );
        router.refresh();
        return;
      }
      const response =
        mode === 'signup'
          ? await authService.register({
              displayName: values.displayName,
              email: values.email,
              password: values.password,
            })
          : mode === 'forgot-password'
            ? await authService.forgot(values.email)
            : mode === 'resend-verification'
              ? await authService.resend(values.email)
              : await authService.reset({
                  token: token || '',
                  password: values.password,
                  confirmPassword: values.confirmPassword,
                });
      setMessage(response.message);
      reset();
    } catch (error) {
      if (error instanceof ApiError && error.response.errors) {
        for (const issue of error.response.errors) {
          const field = issue.path.at(-1);
          if (field && fields.includes(field))
            setError(field as keyof Values, { message: issue.message });
        }
      }
      setFailure(
        error instanceof Error
          ? error.message
          : 'Unable to complete the request. Try again.',
      );
    }
  };
  const invalidLink =
    mode === 'reset-password' && !/^[a-f0-9]{64}$/.test(token || '');
  return (
    <section className="surface mx-auto max-w-md p-6 sm:p-8">
      <p className="eyebrow mb-3">iMet account</p>
      <h1 className="text-2xl font-bold text-navy">{titles[mode]}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {mode === 'signin'
          ? 'Welcome back. Sign in to your workspace.'
          : mode === 'signup'
            ? 'Start exploring machinery and building your company profile.'
            : mode === 'reset-password'
              ? 'Choose a secure password for your account.'
              : 'Enter your account email and we’ll help you get back on track.'}
      </p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        {fields.map((field) => {
          const Input = field.toLowerCase().includes('password')
            ? PasswordInput
            : 'input';
          const error = (errors as Record<string, { message?: string }>)[field];
          return (
            <div key={field}>
              <label htmlFor={field} className="mb-1 block text-sm font-medium">
                {labels[field]}
              </label>
              <Input
                id={field}
                type={
                  field.toLowerCase().includes('password')
                    ? 'password'
                    : field === 'email'
                      ? 'email'
                      : 'text'
                }
                autoComplete={
                  field === 'email'
                    ? 'email'
                    : field === 'displayName'
                      ? 'name'
                      : mode === 'signin'
                        ? 'current-password'
                        : 'new-password'
                }
                {...register(field as keyof Values)}
                aria-invalid={!!error}
                aria-describedby={error ? `${field}-error` : undefined}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-orange"
                disabled={isSubmitting}
              />
              {error && (
                <p id={`${field}-error`} className="mt-1 text-sm text-red-700">
                  {error.message}
                </p>
              )}
            </div>
          );
        })}
        {mode !== 'signin' && fields.includes('password') && (
          <p className="text-sm text-slate-600">
            Use at least 12 characters with uppercase and lowercase letters and
            a number.
          </p>
        )}
        {invalidLink && (
          <p role="alert">
            This reset link is missing or invalid. Request a new link.
          </p>
        )}
        {failure && (
          <p role="alert" className="text-red-700">
            {failure}
          </p>
        )}
        {message && (
          <p role="status" className="text-green-800">
            {message}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || invalidLink}
        >
          {isSubmitting ? 'Please wait…' : titles[mode]}
        </Button>
      </form>
      {(mode === 'signin' || mode === 'signup') && (
        <div className="mt-4 space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={!googleEnabled || googleBusy || isSubmitting}
            onClick={async () => {
              setGoogleBusy(true);
              setFailure('');
              try {
                await signIn('google', {
                  callbackUrl: safeReturnUrl(callbackUrl),
                });
              } catch {
                setFailure('Unable to start Google sign-in. Try again.');
                setGoogleBusy(false);
              }
            }}
          >
            {googleBusy ? 'Connecting…' : 'Continue with Google'}
          </Button>
          {!googleEnabled && (
            <p className="text-xs text-slate-500">
              Google Sign-In is temporarily unavailable. You can use email and
              password.
            </p>
          )}
        </div>
      )}
      <nav
        className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-5 text-xs font-medium text-orange-dark"
        aria-label="Authentication"
      >
        <Link href="/auth/signin">Sign in</Link>
        <Link href="/auth/signup">Create account</Link>
        <Link href="/auth/forgot-password">Forgot password?</Link>
        <Link href="/auth/resend-verification">Resend verification</Link>
      </nav>
    </section>
  );
}
