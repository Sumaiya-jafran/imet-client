'use client';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supplierAssetsApi } from '@/lib/api/supplier-assets.service';
import SupplierAssetFile from '@/components/shared/SupplierAssetFile';
import { ApiError } from '@/lib/api/client';
import type { FieldPath } from 'react-hook-form';
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
  const [uploading, setUploading] = useState(false);
  const [storage, setStorage] = useState<
    'loading' | 'ready' | 'missing' | 'error'
  >('loading');
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(new Set<string>());
  useEffect(() => {
    let active = true;
    supplierAssetsApi
      .status(token)
      .then((r) => {
        if (active) setStorage(r.data?.configured ? 'ready' : 'missing');
      })
      .catch(() => {
        if (active) setStorage('error');
      });
    return () => {
      active = false;
    };
  }, [token, attempt]);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError: setFieldError,
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
          logoAssetId: supplier.logoAssetId ?? null,
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
          logoAssetId: null,
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
      setPending(new Set());
      onSave();
    } catch (e) {
      if (e instanceof ApiError && e.response.errors)
        for (const issue of e.response.errors) {
          const path = issue.path.filter((p) => p !== 'body').join('.');
          if (
            [
              'companyName',
              'type',
              'description',
              'contactName',
              'businessEmail',
              'businessPhone',
              'address',
              'city',
              'country',
              'registrationNumber',
              'website',
              'logoUrl',
              'documents',
            ].includes(path.split('.')[0])
          )
            setFieldError(path as FieldPath<SupplierProfileInput>, {
              message: issue.message,
            });
        }
      setError(e instanceof Error ? e.message : 'Unable to save profile');
    }
  };
  const logoId = useWatch({ control, name: 'logoAssetId' });
  const uploadFile = async (
    purpose: 'LOGO' | 'DOCUMENT',
    file: File | undefined,
  ) => {
    if (!file) return;
    if (
      file.size > 10 * 1024 * 1024 ||
      !file.size ||
      !(
        purpose === 'LOGO'
          ? ['image/jpeg', 'image/png']
          : ['image/jpeg', 'image/png', 'application/pdf']
      ).includes(file.type)
    ) {
      setError('Choose a supported file up to 10 MB.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const r = await supplierAssetsApi.upload(token, purpose, file);
      if (!r.data) throw new Error('Upload response unavailable');
      setPending((p) => new Set([...p, r.data!.assetId]));
      if (purpose === 'LOGO') {
        setValue('logoUrl', r.data.url, { shouldValidate: true });
        setValue('logoAssetId', r.data.assetId);
      } else
        documents.append({
          name: r.data.fileName,
          url: r.data.url,
          assetId: r.data.assetId,
        });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  const cancel = () => {
    for (const id of pending)
      void supplierAssetsApi.remove(token, id).catch(() => undefined);
    onCancel?.();
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
      <fieldset
        disabled={isSubmitting || uploading}
        className="grid gap-4 md:grid-cols-2"
      >
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
                  readOnly={readonly(key) || (key === 'logoUrl' && !!logoId)}
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
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 md:col-span-2">
          <label htmlFor="supplier-logo-file" className="font-semibold">
            Upload company logo
          </label>
          <p className="my-2 text-xs text-slate-600">
            JPEG or PNG, up to 10 MB. Managed logos become public only for
            eligible marketplace suppliers.
          </p>
          <input
            id="supplier-logo-file"
            type="file"
            accept="image/jpeg,image/png"
            disabled={storage !== 'ready'}
            onChange={(e) => {
              void uploadFile('LOGO', e.target.files?.[0]);
              e.target.value = '';
            }}
            className="block w-full text-sm"
          />
          {logoId && (
            <>
              <SupplierAssetFile
                token={token}
                assetId={logoId}
                name="Company logo"
                preview
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setValue('logoAssetId', null);
                  setValue('logoUrl', null);
                }}
              >
                Remove logo
              </Button>
            </>
          )}
          {storage !== 'ready' && (
            <p role="status" className="mt-2 text-sm">
              {storage === 'missing'
                ? 'Uploads require Bunny Storage configuration on the server.'
                : storage === 'loading'
                  ? 'Checking upload availability…'
                  : 'Unable to check upload storage.'}{' '}
              {storage === 'error' && (
                <button
                  type="button"
                  className="underline"
                  onClick={() => setAttempt((n) => n + 1)}
                >
                  Retry storage
                </button>
              )}
            </p>
          )}
          {uploading && (
            <p role="status" className="mt-2 text-sm">
              Uploading file…
            </p>
          )}
        </section>
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
            Upload private PDF, JPEG or PNG verification files up to 10 MB. Only
            your account and administrators can download managed files. Existing
            external links remain supported and require protection at their
            host.
          </p>
          {mode !== 'owner' && (
            <label className="my-3 block text-sm font-medium">
              Upload verification document
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                disabled={storage !== 'ready' || documents.fields.length >= 20}
                className="mt-2 block w-full"
                onChange={(e) => {
                  void uploadFile('DOCUMENT', e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
          )}
          {documents.fields.map((field, index) => (
            <div
              key={field.id}
              className="my-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4"
            >
              <label className="block">
                Document name {index + 1}
                <input
                  aria-invalid={!!errors.documents?.[index]?.name}
                  aria-describedby={
                    errors.documents?.[index]?.name
                      ? `document-${index}-name-error`
                      : undefined
                  }
                  readOnly={mode === 'owner'}
                  {...register(`documents.${index}.name`)}
                  className="mt-1 w-full rounded border p-2"
                />
              </label>
              {errors.documents?.[index]?.name && (
                <p id={`document-${index}-name-error`} className="text-red-700">
                  {errors.documents[index]?.name?.message}
                </p>
              )}
              <label className="mt-2 block">
                Document URL {index + 1}
                <input
                  aria-invalid={!!errors.documents?.[index]?.url}
                  aria-describedby={
                    errors.documents?.[index]?.url
                      ? `document-${index}-url-error`
                      : undefined
                  }
                  readOnly={mode === 'owner' || !!field.assetId}
                  {...register(`documents.${index}.url`)}
                  className="mt-1 w-full rounded border p-2"
                />
              </label>
              {errors.documents?.[index]?.url && (
                <p id={`document-${index}-url-error`} className="text-red-700">
                  {errors.documents[index]?.url?.message}
                </p>
              )}
              {field.assetId && (
                <SupplierAssetFile
                  token={token}
                  assetId={field.assetId}
                  name={field.name}
                />
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
            <Button variant="secondary" onClick={cancel}>
              Cancel profile edit
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
