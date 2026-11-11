'use client';
import { mediaApi } from '@/lib/api/media.service';
import { formatMachinePrice } from '@/lib/money';
import { supplierApi, supplierCatalogueApi } from '@/lib/api/supplier.service';
import type { SupplierProfile } from '@/types/supplier';
import { catalogueImagesApi } from '@/lib/api/catalogue-images.service';
import CatalogueImagePreview from '@/components/shared/CatalogueImagePreview';
import { ApiError } from '@/lib/api/client';
import type { FieldPath } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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
  const [savedMachine, setSavedMachine] = useState<AdminMachine>();
  const [videos, setVideos] = useState<File[]>([]);
  const [videoNotice, setVideoNotice] = useState('');
  const [hiddenAllowed, setHiddenAllowed] = useState(!supplierMode);
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
            ['APPROVED', 'PENDING'].includes(response.data?.status ?? '') &&
            t.supplierType === response.data?.type,
        );
        if (active) {
          setHiddenAllowed(
            !!term?.hiddenPriceAllowed && Number(term.price) > 0,
          );
          setLimits({
            images: term?.imageLimit ?? 0,
            specifications: term?.specificationLimit ?? 0,
          });
        }
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
    setValue,
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
          condition: machine.condition ?? 'NEW',
          manufacturingYear: machine.manufacturingYear ?? null,
          countryOfOrigin: machine.countryOfOrigin ?? null,
          pricingMode: machine.pricingMode ?? 'FIXED_PRICE',
          price: machine.price ?? null,
          currency: machine.currency ?? null,
          minimumOrderQuantity: machine.minimumOrderQuantity ?? 1,
          warranty: machine.warranty ?? null,
          availability: machine.availability ?? 'IN_STOCK',
          negotiable: machine.negotiable ?? false,
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
          condition: 'NEW',
          manufacturingYear: null,
          countryOfOrigin: null,
          pricingMode: 'FIXED_PRICE',
          price: null,
          currency: null,
          minimumOrderQuantity: 1,
          warranty: null,
          availability: 'IN_STOCK',
          negotiable: false,
          images: [],
          specifications: [],
        },
  });
  const preview = useWatch({ control });
  const pricingMode = useWatch({ control, name: 'pricingMode' });
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
    if (!supplierMode && !supplierId) {
      setError(
        'Select a supplier owner before saving. Legacy unassigned records remain private.',
      );
      return;
    }
    try {
      const current = savedMachine ?? machine;
      const response = supplierMode
        ? await supplierCatalogueApi.save(token, data, current)
        : await catalogueAdminApi.save(
            token,
            data,
            current,
            supplierId || null,
          );
      if (!response.data) throw new Error('Save response unavailable');
      setSavedMachine(response.data);
      setPendingUploads(new Set());
      // Save first to establish ownership. Never retry an uncertain YouTube upload:
      // it may already exist on the channel even if the response was lost.
      const queued = [...videos];
      for (let index = 0; index < queued.length; index++) {
        setVideos(queued.slice(index + 1));
        const body = new FormData();
        body.set('type', 'VIDEO');
        body.set('title', `${data.name} — ${queued[index].name}`.slice(0, 100));
        body.set('file', queued[index]);
        try {
          await mediaApi.upload(token, response.data.id, body);
        } catch (error) {
          setVideoNotice(
            'The machine was saved. Check Manage media and the YouTube channel before selecting the failed video again. Uploaded videos will not be retried.',
          );
          setError(
            error instanceof Error ? error.message : 'Video upload failed',
          );
          return;
        }
      }
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
    if (getValues('images').length >= limits.images) {
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
  const input =
    'mt-1 w-full rounded border border-border-strong bg-surface p-2';
  return (
    <section className="surface p-5">
      <h2 className="text-section font-semibold">
        {machine || savedMachine ? 'Edit machine' : 'Create machine'}
      </h2>
      <p className="my-3 text-nav text-secondary">
        Drafts and archived listings are private. Archived listings release
        active listing capacity. Published listings appear publicly only when
        their owner and subscription are eligible. Image and specification rows
        appear in the order shown.
      </p>
      {supplierMode && (
        <p className="mb-3 text-nav text-secondary">
          Current plan: up to {limits.images} images and {limits.specifications}{' '}
          specifications per listing. Subscription eligibility is checked again
          when saving.
        </p>
      )}
      {(
        [
          'condition',
          'manufacturingYear',
          'countryOfOrigin',
          'pricingMode',
          'price',
          'currency',
          'minimumOrderQuantity',
          'availability',
          'warranty',
        ] as const
      ).some((key) => errors[key]) && (
        <ul role="alert" className="mb-4 list-disc pl-5 text-danger-foreground">
          {(
            [
              'condition',
              'manufacturingYear',
              'countryOfOrigin',
              'pricingMode',
              'price',
              'currency',
              'minimumOrderQuantity',
              'availability',
              'warranty',
            ] as const
          ).map((key) =>
            errors[key]?.message ? (
              <li key={key}>
                {key}: {errors[key]?.message}
              </li>
            ) : null,
          )}
        </ul>
      )}
      {videoNotice && (
        <p role="status" className="mb-4">
          {videoNotice}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 text-danger-foreground">
          {error}{' '}
          {(machine || savedMachine) &&
            'Cancel and reopen the machine to reload its latest version.'}
        </p>
      )}
      <form onSubmit={handleSubmit(save)} noValidate className="space-y-4">
        <fieldset
          disabled={isSubmitting || uploading}
          className="grid gap-4 md:grid-cols-2"
        >
          {!supplierMode && (
            <section className="rounded-lg border border-border bg-background p-4 md:col-span-2">
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
                    Select the supplier who owns this listing
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
              <p className="mt-2 text-nav text-secondary">
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
                readOnly={field === 'slug' && supplierMode && !!machine}
                onBlur={
                  field === 'name' && !machine
                    ? () => {
                        if (!getValues('slug'))
                          setValue(
                            'slug',
                            getValues('name')
                              .toLowerCase()
                              .normalize('NFKD')
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-|-$/g, '')
                              .slice(0, 220),
                          );
                      }
                    : undefined
                }
                className={input}
                aria-invalid={!!errors[field]}
                aria-describedby={
                  errors[field] ? `machine-${field}-error` : undefined
                }
              />
              {errors[field] && (
                <p
                  id={`machine-${field}-error`}
                  className="text-nav text-danger-foreground"
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
                className="text-nav text-danger-foreground"
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
                className="text-nav text-danger-foreground"
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
              <option value="DRAFT">Draft (private)</option>
              <option value="ARCHIVED">Archived (private)</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          <label>
            Condition
            <select {...register('condition')} className={input}>
              <option value="NEW">New</option>
              <option value="USED">Used</option>
              <option value="REFURBISHED">Refurbished</option>
            </select>
          </label>
          <label>
            Manufacturing year
            <input
              type="number"
              {...register('manufacturingYear', {
                setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
              })}
              className={input}
            />
            {errors.manufacturingYear && (
              <span role="alert">{errors.manufacturingYear.message}</span>
            )}
          </label>
          <label>
            Country of origin
            <input
              {...register('countryOfOrigin', {
                setValueAs: (v) => (v === '' ? null : v),
              })}
              className={input}
            />
          </label>
          <label>
            Pricing mode
            <select
              {...register('pricingMode')}
              onChange={(e) => {
                setValue(
                  'pricingMode',
                  e.target.value as 'FIXED_PRICE' | 'CONTACT_FOR_PRICE',
                );
                if (supplierMode && e.target.value === 'CONTACT_FOR_PRICE') {
                  setValue('price', null);
                  setValue('currency', null);
                }
              }}
              className={input}
            >
              <option value="FIXED_PRICE">Fixed price</option>
              <option value="CONTACT_FOR_PRICE" disabled={!hiddenAllowed}>
                Contact for Price
              </option>
            </select>
            {!hiddenAllowed && (
              <p className="text-meta text-muted">
                A paid plan with hidden-price permission is required for Contact
                for Price.
              </p>
            )}
          </label>
          {(pricingMode !== 'CONTACT_FOR_PRICE' || !supplierMode) && (
            <>
              <label>
                {pricingMode === 'CONTACT_FOR_PRICE'
                  ? 'Internal price (admin only)'
                  : 'Price'}
                <input
                  inputMode="decimal"
                  {...register('price', {
                    setValueAs: (v) => (v === '' ? null : v),
                  })}
                  className={input}
                />
                {errors.price && (
                  <span role="alert">{errors.price.message}</span>
                )}
              </label>
              <label>
                Currency (ISO code)
                <input
                  maxLength={3}
                  {...register('currency', {
                    setValueAs: (v) =>
                      v == null || v === '' ? null : String(v).toUpperCase(),
                  })}
                  className={input}
                />
                {errors.currency && (
                  <span role="alert">{errors.currency.message}</span>
                )}
              </label>
            </>
          )}
          <label>
            Minimum order quantity
            <input
              type="number"
              {...register('minimumOrderQuantity', { valueAsNumber: true })}
              className={input}
            />
          </label>
          <label>
            Availability
            <select {...register('availability')} className={input}>
              <option value="IN_STOCK">In stock</option>
              <option value="MADE_TO_ORDER">Made to order</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
            </select>
          </label>
          <label>
            Warranty information
            <textarea
              {...register('warranty', {
                setValueAs: (v) => (v === '' ? null : v),
              })}
              className={input}
            />
          </label>
          <label>
            <input type="checkbox" {...register('negotiable')} /> Price
            negotiable
          </label>
          <details className="rounded border border-border p-4 md:col-span-2">
            <summary className="cursor-pointer font-semibold">
              Preview listing before publishing
            </summary>
            <h3 className="mt-3 text-card font-semibold">
              {preview.name || 'Untitled machine'}
            </h3>
            <p>
              {preview.manufacturer} · {preview.model} · {preview.condition}
            </p>
            <p className="my-3 font-semibold">
              {pricingMode === 'CONTACT_FOR_PRICE'
                ? 'Contact for Price'
                : formatMachinePrice(preview.price, preview.currency)}
            </p>
            <p className="whitespace-pre-wrap break-words">
              {preview.description}
            </p>
            <p className="mt-2 text-meta">
              This is a private form preview, not a published page. The first
              image below is the cover image.
            </p>
          </details>
          <section
            className="border-t border-border pt-5 md:col-span-2"
            aria-label="Machine videos"
          >
            <label htmlFor="machine-video-files" className="font-semibold">
              Upload machinery videos
            </label>
            <p className="mt-1 text-meta text-secondary">
              Select MP4 or WebM files, up to 25 MB each. Videos upload to the
              marketplace YouTube channel after the machine is saved. Up to 5
              videos, 3D models and panoramas combined per machine. The
              administrator must authorize YouTube uploads; private videos
              require viewer invitations.
            </p>
            <input
              id="machine-video-files"
              type="file"
              multiple
              accept="video/mp4,video/webm"
              className="mt-3 block w-full text-nav"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                if (
                  files.some(
                    (file) =>
                      !['video/mp4', 'video/webm'].includes(file.type) ||
                      !file.size ||
                      file.size > 25 * 1024 * 1024,
                  )
                ) {
                  setError('Choose MP4 or WebM videos up to 25 MB each.');
                  return;
                }
                if (videos.length + files.length > 5) {
                  setError(
                    'Select at most 5 videos. Existing advanced media also count toward this limit.',
                  );
                  return;
                }
                setVideos((current) => [...current, ...files]);
                setError('');
              }}
            />
            {videos.map((file, index) => (
              <div key={`${file.name}-${index}`} className="mt-2 flex gap-3">
                <span>{file.name}</span>
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    setVideos((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove video
                </button>
              </div>
            ))}
          </section>
          <section
            aria-label="Machine images"
            className="border-t border-border pt-5 md:col-span-2"
          >
            <h3 className="font-semibold">Images</h3>
            {
              <div className="my-3 rounded-xl border border-dashed border-border-strong bg-background p-4">
                <label
                  htmlFor="machine-image-file"
                  className="block text-nav font-semibold"
                >
                  Upload machinery image
                </label>
                <p className="mt-1 text-meta text-secondary">
                  JPEG or PNG, up to 10 MB. Add a meaningful description and
                  arrange images below. Images are stored in Cloudinary. Select
                  videos below to upload them to YouTube after saving.
                </p>
                <input
                  id="machine-image-file"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  disabled={
                    uploading ||
                    storage !== 'ready' ||
                    images.fields.length >= limits.images
                  }
                  className="mt-3 block w-full text-nav"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = '';
                    void (async () => {
                      for (const file of files) await uploadImage(file);
                    })();
                  }}
                />
                {uploading && (
                  <p role="status" className="mt-2 text-nav">
                    Uploading image…
                  </p>
                )}
                {storage === 'loading' && (
                  <p role="status" className="mt-2 text-nav">
                    Checking image storage…
                  </p>
                )}
                {storage === 'missing' && (
                  <p
                    role="status"
                    className="mt-2 text-nav text-warning-foreground"
                  >
                    Uploads are unavailable until Cloudinary storage is
                    configured on the server. Existing images and URL editing
                    remain available.
                  </p>
                )}
                {storage === 'error' && (
                  <p
                    role="alert"
                    className="mt-2 text-nav text-danger-foreground"
                  >
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
                className="my-3 rounded-lg border border-border bg-background/60 p-4"
              >
                <p className="mb-2 text-meta font-semibold">
                  {index === 0 ? 'Cover image' : `Image ${index + 1}`}
                </p>
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
                  <p className="text-nav text-danger-foreground">
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
                    className="text-nav text-danger-foreground"
                  >
                    {errors.images[index]?.alt?.message}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    disabled={index === 0}
                    onClick={() => images.move(index, 0)}
                  >
                    Set as cover
                  </Button>
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
            className="border-t border-border pt-5 md:col-span-2"
          >
            <h3 className="font-semibold">Technical specifications</h3>
            {specs.fields.map((field, index) => (
              <div
                key={field.id}
                className="my-3 rounded-lg border border-border bg-background/60 p-4"
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
                    className="text-nav text-danger-foreground"
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
                    className="text-nav text-danger-foreground"
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
