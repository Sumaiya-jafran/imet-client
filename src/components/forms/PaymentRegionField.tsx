'use client';
import { useId, type Ref } from 'react';
import {
  paymentRegionOptions,
  type PaymentRegion,
} from '@/config/payment-regions';
export default function PaymentRegionField({
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  inputRef,
}: {
  value?: PaymentRegion | null;
  onChange: (value: PaymentRegion) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  return (
    <fieldset
      disabled={disabled}
      aria-describedby={`${id}-description${error ? ` ${id}-error` : ''}`}
      aria-invalid={!!error}
      className="min-w-0 space-y-3 md:col-span-2"
    >
      <legend className="text-card font-semibold">
        Where will you be making your payments from?
        {required && (
          <span className="ml-1 text-danger-foreground" aria-hidden="true">
            *
          </span>
        )}
      </legend>
      <p id={`${id}-description`} className="text-nav text-secondary">
        Select the country or region from which you intend to make payments for
        your supplier subscription.
      </p>
      <div className="grid gap-3 lg:grid-cols-3">
        {paymentRegionOptions.map((option) => (
          <label
            key={option.value}
            className={`block min-w-0 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <input
              ref={inputRef}
              type="radio"
              aria-labelledby={`${id}-${option.value}-label`}
              name="paymentRegion"
              value={option.value}
              checked={value === option.value}
              required={required}
              onChange={() => onChange(option.value)}
              aria-describedby={`${id}-${option.value}-description${error ? ` ${id}-error` : ''}`}
              className="peer sr-only"
            />
            <span
              className={`flex h-full gap-3 rounded-xl border p-4 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-secondary ${value === option.value ? 'border-secondary bg-secondary/5' : 'border-border bg-surface'} ${disabled ? '' : 'hover:border-secondary'}`}
            >
              <span
                aria-hidden="true"
                className={`mt-1 size-4 shrink-0 rounded-full border ${value === option.value ? 'border-secondary bg-secondary ring-2 ring-inset ring-surface' : 'border-muted'}`}
              />
              <span className="min-w-0">
                <span
                  id={`${id}-${option.value}-label`}
                  className="block text-nav font-semibold text-foreground"
                >
                  {option.label}
                </span>
                <span
                  id={`${id}-${option.value}-description`}
                  className="mt-1 block text-meta leading-5 text-secondary"
                >
                  {option.description}
                </span>
              </span>
            </span>
          </label>
        ))}
      </div>
      {!required && !value && (
        <p className="text-meta text-muted-foreground">
          Not specified for this existing account. No payment region has been
          assumed.
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-nav text-danger-foreground"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
