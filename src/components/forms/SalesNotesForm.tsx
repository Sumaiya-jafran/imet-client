'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salesNotesSchema } from '@/lib/schema-validations/sales.schema';
import Button from '@/components/buttons/Button';
export default function SalesNotesForm({
  notes,
  onSave,
  busy,
  readOnly,
}: {
  notes: string;
  onSave: (notes: string) => Promise<unknown>;
  busy: boolean;
  readOnly: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ internalNotes: string }>({
    resolver: zodResolver(salesNotesSchema),
    defaultValues: { internalNotes: notes },
  });
  return (
    <form
      onSubmit={handleSubmit((data) => onSave(data.internalNotes))}
      className="surface space-y-3 p-5"
    >
      <label htmlFor="sales-internal-notes" className="block font-semibold">
        Internal sales notes
      </label>
      <p id="sales-notes-help" className="text-xs text-slate-500">
        Private to the assigned recipient and administrators. Buyers cannot see
        these notes.
      </p>
      <textarea
        id="sales-internal-notes"
        rows={4}
        readOnly={readOnly}
        maxLength={5000}
        {...register('internalNotes')}
        className="w-full"
        aria-invalid={!!errors.internalNotes}
        aria-describedby="sales-notes-help sales-notes-error"
      />
      <p id="sales-notes-error" className="text-xs text-red-700">
        {errors.internalNotes?.message}
      </p>
      <Button type="submit" disabled={busy || isSubmitting || readOnly}>
        {isSubmitting ? 'Saving…' : 'Save internal notes'}
      </Button>
    </form>
  );
}
