'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userService } from '@/lib/api/user.service';
import Button from '@/components/buttons/Button';
const schema = z.object({ displayName: z.string().trim().min(2).max(100) });
export default function ProfileForm({
  token,
  displayName,
  onSave,
}: {
  token: string;
  displayName: string;
  onSave: (name: string) => void;
}) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { displayName },
  });
  const submit = async (values: z.infer<typeof schema>) => {
    setError('');
    setMessage('');
    try {
      const response = await userService.profile(token, values.displayName);
      onSave(response.data!.displayName);
      setMessage('Profile updated.');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to save profile',
      );
    }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="my-5 space-y-3" noValidate>
      <label htmlFor="profile-name" className="block font-medium">
        Display name
      </label>
      <input
        id="profile-name"
        {...register('displayName')}
        disabled={isSubmitting}
        aria-invalid={!!errors.displayName}
        aria-describedby={errors.displayName ? 'profile-name-error' : undefined}
        className="w-full rounded border p-2"
      />
      {errors.displayName && (
        <p id="profile-name-error" className="text-red-700">
          {errors.displayName.message}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}
