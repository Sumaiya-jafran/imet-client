'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
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
}: {
  mode: Mode;
  token?: string;
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
  const [failure, setFailure] = useState('');
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
          email: values.email,
          password: values.password,
        });
        if (!result?.ok || result.error) {
          setFailure(result?.error || 'Unable to sign in');
          return;
        }
        router.push('/dashboard/account');
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
  const invalidLink = mode === 'reset-password' && !token;
  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-navy">{titles[mode]}</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        {fields.map((field) => {
          const error = (errors as Record<string, { message?: string }>)[field];
          return (
            <div key={field}>
              <label htmlFor={field} className="mb-1 block text-sm font-medium">
                {labels[field]}
              </label>
              <input
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
            This reset link is missing its token. Request a new link.
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
      <nav
        className="mt-6 flex flex-wrap gap-4 text-sm text-orange-dark"
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
