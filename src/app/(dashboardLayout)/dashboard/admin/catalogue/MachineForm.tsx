'use client';
import { supplierApi, supplierCatalogueApi } from '@/lib/api/supplier.service';
import type { SupplierProfile } from '@/types/supplier';
import { catalogueImagesApi } from '@/lib/api/catalogue-images.service';
import CatalogueImagePreview from '@/components/shared/CatalogueImagePreview';
import { ApiError } from '@/lib/api/client';
import type { FieldPath } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/buttons/Button';
import {
  machineSchema,
  type MachineInput,
} from '@/lib/schema-validations/catalogue.schema';
import {
  catalogueAdminApi,
  type AdminCategory,
  type AdminMachine,
} from '@/lib/api/catalogue-admin.service';
export default function MachineForm({
  token,
  machine,
  categories,
  onSave,
  onCancel,
  supplierMode = false,
}: {
  token: string;
  machine?: AdminMachine;
  categories: AdminCategory[];
  onSave: () => void;
  onCancel: () => void;
  supplierMode?: boolean;
}) {
  const [error, setError] = useState('');
  const [limits, setLimits] = useState({
    images: supplierMode ? 0 : 20,
    specifications: supplierMode ? 0 : 100,
  });
  useEffect(() => {
    if (!supplierMode) return;
    let active = true;
    supplierApi
      .own(token)
      .then((response) => {
        const term = response.data?.subscriptions.find(
          (t) =>
            t.isCurrent &&
            t.effectiveStatus === 'ACTIVE' &&
            response.data?.status === 'APPROVED' &&
            t.supplierType === response.data.type,
        );
        if (active)
          setLimits({
            images: term?.imageLimit ?? 0,
            specifications: term?.specificationLimit ?? 0,
          });
      })
      .catch(() => {
        if (active)
          setError('Unable to load plan limits. Reload before saving.');
      });
    return () => {
      active = false;
    };
  }, [token, supplierMode]);
  const [uploading, setUploading] = useState(false);
  const [storage, setStorage] = useState<
    'loading' | 'ready' | 'missing' | 'error'
  >('loading');
  const [storageAttempt, setStorageAttempt] = useState(0);
  const [pendingUploads, setPendingUploads] = useState(new Set<string>());
  useEffect(() => {
    let active = true;
    catalogueImagesApi
      .status(token, supplierMode)
      .then((response) => {
        if (active) setStorage(response.data?.configured ? 'ready' : 'missing');
      })
      .catch(() => {
        if (active) setStorage('error');
      });
    return () => {
      active = false;
    };
  }, [token, supplierMode, storageAttempt]);
  const [supplierId, setSupplierId] = useState(machine?.supplierId ?? '');
  const [supplierQuery, setSupplierQuery] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [supplierError, setSupplierError] = useState('');
  useEffect(() => {
    if (supplierMode) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      supplierApi
        .adminList(
          token,
          new URLSearchParams({
            status: 'APPROVED',
            q: supplierQuery,
            limit: '100',
          }),
          controller.signal,
        )
        .then((response) => {
          if (!controller.signal.aborted) {
            setSuppliers(response.data?.suppliers ?? []);
            setSupplierError('');
          }
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setSupplierError('Unable to load suppliers. Try another search.');
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [token, supplierQuery, supplierMode]);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<MachineInput>({
    resolver: zodResolver(machineSchema),
    defaultValues: machine
      ? {
          name: machine.name,
          slug: machine.slug,
          description: machine.description,
          manufacturer: machine.manufacturer,
          model: machine.model,
          categoryId: machine.categoryId,
          status: machine.status,
          images: machine.images,
          specifications: machine.specifications,
        }
      : {
          name: '',
          slug: '',
          description: '',
          manufacturer: '',
          model: '',
          categoryId: '',
          status: 'DRAFT',
          images: [],
          specifications: [],
        },
  });
  const images = useFieldArray({ control, name: 'images' });
  const specs = useFieldArray({ control, name: 'specifications' });
  const save = async (data: MachineInput) => {
    setError('');
    if (
      data.images.length > limits.images ||
      data.specifications.length > limits.specifications
    ) {
      setError(
        'Reduce image or specification rows to your current plan limits.',
      );
      return;
    }
    try {
      if (supplierMode) await supplierCatalogueApi.save(token, data, machine);
      else
        await catalogueAdminApi.save(token, data, machine, supplierId || null);
      setPendingUploads(new Set());
      onSave();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        error.message.toLowerCase().includes('slug')
      )
        setFieldError(
          'slug',
          { message: error.message },
          { shouldFocus: true },
        );
      if (error instanceof ApiError && error.response.errors) {
        for (const issue of error.response.errors) {
          const path = issue.path.filter((part) => part !== 'body').join('.');
          if (
            [
              'name',
              'slug',
              'description',
              'manufacturer',
              'model',
              'categoryId',
              'status',
              'images',
              'specifications',
            ].includes(path.split('.')[0])
          )
            setFieldError(
              path as FieldPath<MachineInput>,
              { message: issue.message },
              { shouldFocus: true },
            );
        }
        setError(
          error.response.errors.map((issue) => issue.message).join('. '),
        );
      } else
        setError(
          error instanceof Error ? error.message : 'Unable to save machine',
        );
    }
  };
  const uploadImage = async (file: File | undefined) => {
    if (!file) return;
    if (
      !['image/png', 'image/jpeg'].includes(file.type) ||
      file.size > 10 * 1024 * 1024 ||
      !file.size
    ) {
      setError('Choose a JPEG or PNG image up to 10 MB.');
      return;
    }
    if (images.fields.length >= limits.images) {
      setError(`Your current image limit is ${limits.images}.`);
      return;
    }
    setUploading(true);
    setError('');
    try {
      const response = await catalogueImagesApi.upload(
        token,
        file,
        supplierMode,
      );
      if (!response.data) throw new Error('Upload response unavailable');
      setPendingUploads(
        (current) => new Set([...current, response.data!.assetId]),
      );
      images.append({
        assetId: response.data.assetId,
        url: response.data.url,
        alt:
          getValues('name') || file.name.replace(/\.[^.]+$/, '').slice(0, 250),
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to upload image',
      );
    } finally {
      setUploading(false);
    }
  };
  const removeImage = async (index: number) => {
    const assetId = getValues(`images.${index}.assetId`);
    if (assetId && pendingUploads.has(assetId)) {
      setUploading(true);
      setError('');
      try {
        await catalogueImagesApi.remove(token, assetId, supplierMode);
        setPendingUploads((current) => {
          const next = new Set(current);
          next.delete(assetId);
          return next;
        });
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Storage cleanup will be retried',
        );
      } finally {
        setUploading(false);
      }
    }
    images.remove(index);
  };
  const cancel = () => {
    for (const id of pendingUploads)
      void catalogueImagesApi
        .remove(token, id, supplierMode)
        .catch(() => undefined);
    onCancel();
  };
  const input = 'mt-1 w-full rounded border border-slate-300 bg-white p-2';
  return (
    <section className="surface p-5">
      <h2 className="text-2xl font-semibold">
        {machine ? 'Edit machine' : 'Create machine'}
      </h2>
      <p className="my-3 text-sm text-slate-600">
        Drafts are private and can be used to archive a listing. Published
        listings appear publicly only when their owner and subscription are
        eligible. Image and specification rows appear in the order shown.
      </p>
      {supplierMode && (
        <p className="mb-3 text-sm text-slate-600">
          Current plan: up to {limits.images} images and {limits.specifications}{' '}
          specifications per listing. Subscription eligibility is checked again
          when saving.
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 text-red-700">
          {error}{' '}
          {machine &&
            'Cancel and reopen the machine to reload its latest version.'}
        </p>
      )}
      <form onSubmit={handleSubmit(save)} noValidate className="space-y-4">
        <fieldset
          disabled={isSubmitting || uploading}
          className="grid gap-4 md:grid-cols-2"
        >
          {!supplierMode && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <label className="block">
                Find supplier company
                <input
                  value={supplierQuery}
                  onChange={(event) => setSupplierQuery(event.target.value)}
                  maxLength={100}
                  className="mt-1 w-full rounded border p-2"
                />
              </label>
              <label className="mt-3 block">
                Listing owner
                <select
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                  className="mt-1 w-full rounded border p-2"
                >
                  <option value="">
                    iMet curated catalogue (no supplier owner)
                  </option>
                  {machine?.supplier &&
                    !suppliers.some((s) => s.id === machine.supplierId) && (
                      <option value={machine.supplier.id}>
                        {machine.supplier.companyName}
                      </option>
                    )}
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-sm text-slate-600">
                Supplier-owned listings require applicable active subscription
                entitlements. Search by company name to select a supplier.
              </p>
              {supplierError && <p role="alert">{supplierError}</p>}
            </section>
          )}

          {(['name', 'slug', 'manufacturer', 'model'] as const).map((field) => (
            <div key={field}>
              <label htmlFor={`machine-${field}`} className="block font-medium">
                {
                  {
                    name: 'Machine name',
                    slug: 'Machine slug',
                    manufacturer: 'Manufacturer',
                    model: 'Model',
                  }[field]
                }
              </label>
              <input
                id={`machine-${field}`}
                {...register(field)}
                className={input}
                aria-invalid={!!errors[field]}
                aria-describedby={
                  errors[field] ? `machine-${field}-error` : undefined
                }
              />
              {errors[field] && (
                <p
                  id={`machine-${field}-error`}
                  className="text-sm text-red-700"
                >
                  {errors[field]?.message}
                </p>
              )}
            </div>
          ))}
          <div className="md:col-span-2">
            <label htmlFor="machine-description" className="block font-medium">
              Description
            </label>
            <textarea
              id="machine-description"
              rows={5}
              {...register('description')}
              className={input}
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? 'machine-description-error' : undefined
              }
            />
            {errors.description && (
              <p
                id="machine-description-error"
                role="alert"
                className="text-sm text-red-700"
              >
                {errors.description.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="machine-category" className="block font-medium">
              Machine category
            </label>
            <select
              id="machine-category"
              {...register('categoryId')}
              aria-invalid={!!errors.categoryId}
              aria-describedby={
                errors.categoryId ? 'machine-category-error' : undefined
              }
              className={input}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p
                id="machine-category-error"
                role="alert"
                className="text-sm text-red-700"
              >
                {errors.categoryId.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="machine-status" className="block font-medium">
              Publication status
            </label>
            <select
              id="machine-status"
              {...register('status')}
              className={input}
            >
              <option value="DRAFT">Draft / archived (private)</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          <section
            aria-label="Machine images"
            className="border-t border-slate-200 pt-5 md:col-span-2"
          >
            <h3 className="font-semibold">Images</h3>
            {
              <div className="my-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <label
                  htmlFor="machine-image-file"
                  className="block text-sm font-semibold"
                >
                  Upload machinery image
                </label>
                <p className="mt-1 text-xs text-slate-600">
                  JPEG or PNG, up to 10 MB. Add a meaningful description and
                  arrange images below.
                </p>
                <input
                  id="machine-image-file"
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={
                    storage !== 'ready' || images.fields.length >= limits.images
                  }
                  className="mt-3 block w-full text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    void uploadImage(file);
                  }}
                />
                {uploading && (
                  <p role="status" className="mt-2 text-sm">
                    Uploading image…
                  </p>
                )}
                {storage === 'loading' && (
                  <p role="status" className="mt-2 text-sm">
                    Checking image storage…
                  </p>
                )}
                {storage === 'missing' && (
                  <p role="status" className="mt-2 text-sm text-amber-900">
                    Uploads are unavailable until Bunny storage is configured on
                    the server. Existing images and URL editing remain
                    available.
                  </p>
                )}
                {storage === 'error' && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    Unable to check image storage.
                  </p>
                )}
                {(storage === 'error' || storage === 'missing') && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStorage('loading');
                      setStorageAttempt((value) => value + 1);
                    }}
                  >
                    Retry image storage
                  </Button>
                )}
              </div>
            }
            {images.fields.map((field, index) => (
              <div
                key={field.id}
                className="my-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4"
              >
                {field.assetId && (
                  <CatalogueImagePreview
                    supplierMode={supplierMode}
                    key={field.assetId}
                    token={token}
                    assetId={field.assetId}
                    alt={getValues(`images.${index}.alt`)}
                  />
                )}
                <label className="block">
                  {field.assetId
                    ? `Stored image ${index + 1}`
                    : `Image URL ${index + 1}`}
                  <input
                    {...register(`images.${index}.url`)}
                    type={field.assetId ? 'hidden' : 'url'}
                    readOnly={!!field.assetId}
                    aria-invalid={!!errors.images?.[index]?.url}
                    className={input}
                    placeholder="https://…"
                  />
                </label>
                {errors.images?.[index]?.url && (
                  <p className="text-sm text-red-700">
                    {errors.images[index]?.url?.message}
                  </p>
                )}
                <label className="mt-2 block">
                  Image description {index + 1}
                  <input
                    {...register(`images.${index}.alt`)}
                    aria-invalid={!!errors.images?.[index]?.alt}
                    aria-describedby={
                      errors.images?.[index]?.alt
                        ? `image-${index}-alt-error`
                        : undefined
                    }
                    className={input}
                  />
                </label>
                {errors.images?.[index]?.alt && (
                  <p
                    id={`image-${index}-alt-error`}
                    role="alert"
                    className="text-sm text-red-700"
                  >
                    {errors.images[index]?.alt?.message}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    disabled={index === 0}
                    onClick={() => images.move(index, index - 1)}
                  >
                    Move image up
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={index === images.fields.length - 1}
                    onClick={() => images.move(index, index + 1)}
                  >
                    Move image down
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void removeImage(index)}
                  >
                    Remove image
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="secondary"
              disabled={images.fields.length >= limits.images}
              onClick={() => images.append({ url: '', alt: '' })}
            >
              Add image URL
            </Button>
          </section>
          <section
            aria-label="Technical specifications"
            className="border-t border-slate-200 pt-5 md:col-span-2"
          >
            <h3 className="font-semibold">Technical specifications</h3>
            {specs.fields.map((field, index) => (
              <div
                key={field.id}
                className="my-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4"
              >
                <label className="block">
                  Specification label {index + 1}
                  <input
                    {...register(`specifications.${index}.label`)}
                    aria-invalid={!!errors.specifications?.[index]?.label}
                    aria-describedby={
                      errors.specifications?.[index]?.label
                        ? `specification-${index}-label-error`
                        : undefined
                    }
                    className={input}
                  />
                </label>
                {errors.specifications?.[index]?.label && (
                  <p
                    id={`specification-${index}-label-error`}
                    role="alert"
                    className="text-sm text-red-700"
                  >
                    {errors.specifications[index]?.label?.message}
                  </p>
                )}
                <label className="mt-2 block">
                  Specification value {index + 1}
                  <input
                    {...register(`specifications.${index}.value`)}
                    aria-invalid={!!errors.specifications?.[index]?.value}
                    aria-describedby={
                      errors.specifications?.[index]?.value
                        ? `specification-${index}-value-error`
                        : undefined
                    }
                    className={input}
                  />
                </label>
                {errors.specifications?.[index]?.value && (
                  <p
                    id={`specification-${index}-value-error`}
                    role="alert"
                    className="text-sm text-red-700"
                  >
                    {errors.specifications[index]?.value?.message}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    disabled={index === 0}
                    onClick={() => specs.move(index, index - 1)}
                  >
                    Move specification up
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={index === specs.fields.length - 1}
                    onClick={() => specs.move(index, index + 1)}
                  >
                    Move specification down
                  </Button>
                  <Button variant="danger" onClick={() => specs.remove(index)}>
                    Remove specification
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="secondary"
              disabled={specs.fields.length >= limits.specifications}
              onClick={() => specs.append({ label: '', value: '' })}
            >
              Add specification
            </Button>
          </section>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="submit" disabled={isSubmitting || !categories.length}>
              {isSubmitting ? 'Saving…' : 'Save machine'}
            </Button>
            <Button variant="secondary" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
