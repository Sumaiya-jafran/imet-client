'use client';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/buttons/Button';
import { supplierSchema } from '@/lib/schema-validations/supplier.schema';
import { supplierApi } from '@/lib/api/supplier.service';
import type { SupplierProfile, SupplierProfileInput } from '@/types/supplier';
const labels = {
  companyName: 'Company name',
  description: 'Company description',
  contactName: 'Contact name',
  businessEmail: 'Business email',
  businessPhone: 'Business phone',
  address: 'Business address',
  city: 'City',
  country: 'Country',
  registrationNumber: 'Registration number',
  website: 'Website URL',
  logoUrl: 'Logo URL',
};
export default function SupplierProfileForm({
  token,
  supplier,
  mode,
  onSave,
  onCancel,
}: {
  token: string;
  supplier?: SupplierProfile;
  mode: 'application' | 'owner' | 'admin';
  onSave: () => void;
  onCancel?: () => void;
}) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SupplierProfileInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          companyName: supplier.companyName,
          type: supplier.type,
          description: supplier.description,
          contactName: supplier.contactName,
          businessEmail: supplier.businessEmail,
          businessPhone: supplier.businessPhone,
          address: supplier.address,
          city: supplier.city,
          country: supplier.country,
          registrationNumber: supplier.registrationNumber,
          website: supplier.website,
          logoUrl: supplier.logoUrl,
          documents: supplier.documents,
        }
      : {
          companyName: '',
          type: 'LOCAL',
          description: '',
          contactName: '',
          businessEmail: '',
          businessPhone: '',
          address: '',
          city: '',
          country: '',
          registrationNumber: null,
          website: null,
          logoUrl: null,
          documents: [],
        },
  });
  const documents = useFieldArray({ control, name: 'documents' });
  const save = async (body: SupplierProfileInput) => {
    setError('');
    try {
      if (mode === 'admin' && supplier)
        await supplierApi.adminUpdate(token, body, supplier);
      else if (mode === 'owner' && supplier)
        await supplierApi.updateOwn(token, body, supplier);
      else await supplierApi.apply(token, body);
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save profile');
    }
  };
  const readonly = (field: string) =>
    mode === 'owner' &&
    ![
      'description',
      'contactName',
      'businessEmail',
      'businessPhone',
      'website',
      'logoUrl',
    ].includes(field);
  return (
    <form onSubmit={handleSubmit(save)} noValidate className="space-y-4">
      <h2 className="text-2xl font-semibold">
        {mode === 'application' ? 'Supplier application' : 'Company profile'}
      </h2>
      <p className="text-sm text-slate-600">
        Private business contacts, street address and verification documents are
        visible only to you and administrators. Keep public descriptions free of
        private contact details.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error} Reload the profile if it changed.
        </p>
      )}
      <fieldset disabled={isSubmitting} className="grid gap-4 md:grid-cols-2">
        {Object.entries(labels).map(([field, label]) => {
          const key = field as keyof typeof labels;
          return (
            <div
              key={key}
              className={key === 'description' ? 'md:col-span-2' : 'min-w-0'}
            >
              <label htmlFor={`supplier-${key}`} className="block font-medium">
                {label}
                {['registrationNumber', 'website', 'logoUrl'].includes(key)
                  ? ' (optional)'
                  : ''}
              </label>
              {key === 'description' ? (
                <textarea
                  id={`supplier-${key}`}
                  aria-invalid={!!errors[key]}
                  aria-describedby={
                    errors[key] ? `supplier-${key}-error` : undefined
                  }
                  rows={5}
                  {...register(key)}
                  className="mt-1 w-full rounded border bg-white p-2"
                />
              ) : (
                <input
                  id={`supplier-${key}`}
                  aria-invalid={!!errors[key]}
                  aria-describedby={
                    errors[key] ? `supplier-${key}-error` : undefined
                  }
                  readOnly={readonly(key)}
                  {...register(key, {
                    ...(['registrationNumber', 'website', 'logoUrl'].includes(
                      key,
                    )
                      ? { setValueAs: (value: string) => value?.trim() || null }
                      : {}),
                  })}
                  className="mt-1 w-full rounded border bg-white p-2 read-only:bg-slate-100"
                />
              )}
              {errors[key] && (
                <p
                  id={`supplier-${key}-error`}
                  className="text-sm text-red-700"
                >
                  {errors[key]?.message}
                </p>
              )}
            </div>
          );
        })}
        <div>
          <label htmlFor="supplier-type" className="block font-medium">
            Supplier type
          </label>
          {mode === 'owner' ? (
            <>
              <input
                id="supplier-type"
                readOnly
                value={
                  supplier?.type === 'LOCAL'
                    ? 'Local supplier / dealer'
                    : 'International manufacturer'
                }
                className="mt-1 w-full rounded border bg-slate-100 p-2"
              />
              <input type="hidden" {...register('type')} />
            </>
          ) : (
            <select
              id="supplier-type"
              {...register('type')}
              className="mt-1 w-full rounded border bg-white p-2"
            >
              <option value="LOCAL">Local supplier / dealer</option>
              <option value="INTERNATIONAL">International manufacturer</option>
            </select>
          )}
        </div>
        <section className="mt-2 border-t border-slate-200 pt-5 md:col-span-2">
          <h3 className="font-semibold">Verification documents</h3>
          <p className="my-2 text-sm text-slate-600">
            Use HTTPS document links. These links are private to your account
            and administrators; protect access at your document host as well.
          </p>
          {documents.fields.map((field, index) => (
            <div
              key={field.id}
              className="my-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4"
            >
              <label className="block">
                Document name {index + 1}
                <input
                  readOnly={mode === 'owner'}
                  {...register(`documents.${index}.name`)}
                  className="mt-1 w-full rounded border p-2"
                />
              </label>
              {errors.documents?.[index]?.name && (
                <p className="text-red-700">
                  {errors.documents[index]?.name?.message}
                </p>
              )}
              <label className="mt-2 block">
                Document URL {index + 1}
                <input
                  readOnly={mode === 'owner'}
                  {...register(`documents.${index}.url`)}
                  className="mt-1 w-full rounded border p-2"
                />
              </label>
              {errors.documents?.[index]?.url && (
                <p className="text-red-700">
                  {errors.documents[index]?.url?.message}
                </p>
              )}
              {mode !== 'owner' && (
                <Button
                  variant="danger"
                  className="mt-3"
                  onClick={() => documents.remove(index)}
                >
                  Remove document
                </Button>
              )}
            </div>
          ))}
          {mode !== 'owner' && (
            <Button
              variant="secondary"
              disabled={documents.fields.length >= 20}
              onClick={() => documents.append({ name: '', url: '' })}
            >
              Add document
            </Button>
          )}
        </section>
        {mode === 'owner' && (
          <p className="text-sm text-slate-600 md:col-span-2">
            Company identity, location, type and documents require administrator
            changes. Approval and verification are controlled by administrators.
          </p>
        )}
        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4 md:col-span-2">
          <Button type="submit">
            {isSubmitting
              ? 'Saving…'
              : mode === 'application'
                ? 'Submit application'
                : 'Save supplier profile'}
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Cancel profile edit
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
