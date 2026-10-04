'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quoteSchema } from '@/lib/schema-validations/rfq.schema';
import { rfqApi } from '@/lib/api/rfq.service';
import type { QuoteInput, RfqQuote } from '@/types/rfq';
import Button from '@/components/buttons/Button';
const localDate = (v: string) => {
  const date = new Date(v);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export default function RfqQuoteForm({
  token,
  rfqId,
  quote,
  onSave,
  onCancel,
}: {
  token: string;
  rfqId: string;
  quote?: RfqQuote;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: quote
      ? {
          unitPrice: quote.unitPrice,
          currency: quote.currency,
          moq: quote.moq,
          leadTimeDays: quote.leadTimeDays,
          validUntil: localDate(quote.validUntil),
          notes: quote.notes,
        }
      : {
          unitPrice: '',
          currency: '',
          moq: '1',
          leadTimeDays: 0,
          validUntil: '',
          notes: '',
        },
  });
  const submit = async (data: QuoteInput) => {
    setError('');
    try {
      await rfqApi.quote(
        token,
        rfqId,
        { ...data, validUntil: new Date(data.validUntil).toISOString() },
        quote,
      );
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send quote');
    }
  };
  const fields: { key: keyof QuoteInput; label: string }[] = [
    { key: 'unitPrice', label: 'Unit price' },
    { key: 'currency', label: 'Currency (three-letter code)' },
    { key: 'moq', label: 'Minimum order quantity' },
    { key: 'leadTimeDays', label: 'Lead time (days)' },
    { key: 'validUntil', label: 'Quote valid until' },
    { key: 'notes', label: 'Notes and commercial terms' },
  ];
  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="surface space-y-4 p-5"
    >
      <h2 className="text-lg font-semibold">
        {quote ? 'Edit your quote' : 'Submit a quote'}
      </h2>
      <p className="text-xs text-slate-500">
        Your quote is private to you, the buyer and administrators. No online
        payment is collected.
      </p>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={isSubmitting} className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <div key={key} className={key === 'notes' ? 'sm:col-span-2' : ''}>
            <label htmlFor={`quote-${key}`} className="block font-medium">
              {label}
            </label>
            {key === 'notes' ? (
              <textarea
                id={`quote-${key}`}
                {...register(key)}
                className="mt-1 w-full"
              />
            ) : (
              <input
                id={`quote-${key}`}
                type={
                  key === 'validUntil'
                    ? 'datetime-local'
                    : key === 'leadTimeDays'
                      ? 'number'
                      : 'text'
                }
                {...register(
                  key,
                  key === 'leadTimeDays' ? { valueAsNumber: true } : {},
                )}
                className="mt-1 w-full"
                aria-invalid={!!errors[key]}
                aria-describedby={
                  errors[key] ? `quote-${key}-error` : undefined
                }
              />
            )}{' '}
            {errors[key] && (
              <p id={`quote-${key}-error`} className="text-xs text-red-700">
                {errors[key]?.message}
              </p>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit">
            {isSubmitting ? 'Sending…' : quote ? 'Save quote' : 'Send quote'}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel quote edit
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
