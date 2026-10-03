'use client';
import { useState } from 'react';
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
}: {
  token: string;
  machine?: AdminMachine;
  categories: AdminCategory[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');
  const {
    register,
    control,
    handleSubmit,
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
    try {
      await catalogueAdminApi.save(token, data, machine);
      onSave();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to save machine',
      );
    }
  };
  const input = 'mt-1 w-full rounded border border-slate-300 bg-white p-2';
  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-2xl font-semibold">
        {machine ? 'Edit machine' : 'Create machine'}
      </h2>
      <p className="my-3 text-sm text-slate-600">
        Drafts are private. Saving as Published makes this machine visible in
        the public catalogue. Image and specification rows appear in the order
        shown.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-red-700">
          {error}{' '}
          {machine &&
            'Cancel and reopen the machine to reload its latest version.'}
        </p>
      )}
      <form onSubmit={handleSubmit(save)} noValidate className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
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
          <div>
            <label htmlFor="machine-description" className="block font-medium">
              Description
            </label>
            <textarea
              id="machine-description"
              rows={5}
              {...register('description')}
              className={input}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-red-700">
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
              <p className="text-sm text-red-700">
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
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          <section aria-label="Machine images">
            <h3 className="font-semibold">Images</h3>
            {images.fields.map((field, index) => (
              <div key={field.id} className="my-3 rounded border p-3">
                <label className="block">
                  Image URL {index + 1}
                  <input
                    {...register(`images.${index}.url`)}
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
                    className={input}
                  />
                </label>
                {errors.images?.[index]?.alt && (
                  <p className="text-sm text-red-700">
                    {errors.images[index]?.alt?.message}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    disabled={index === 0}
                    onClick={() => images.move(index, index - 1)}
                  >
                    Move image up
                  </Button>
                  <Button
                    disabled={index === images.fields.length - 1}
                    onClick={() => images.move(index, index + 1)}
                  >
                    Move image down
                  </Button>
                  <Button onClick={() => images.remove(index)}>
                    Remove image
                  </Button>
                </div>
              </div>
            ))}
            <Button
              disabled={images.fields.length >= 20}
              onClick={() => images.append({ url: '', alt: '' })}
            >
              Add image
            </Button>
          </section>
          <section aria-label="Technical specifications">
            <h3 className="font-semibold">Technical specifications</h3>
            {specs.fields.map((field, index) => (
              <div key={field.id} className="my-3 rounded border p-3">
                <label className="block">
                  Specification label {index + 1}
                  <input
                    {...register(`specifications.${index}.label`)}
                    className={input}
                  />
                </label>
                {errors.specifications?.[index]?.label && (
                  <p className="text-sm text-red-700">
                    {errors.specifications[index]?.label?.message}
                  </p>
                )}
                <label className="mt-2 block">
                  Specification value {index + 1}
                  <input
                    {...register(`specifications.${index}.value`)}
                    className={input}
                  />
                </label>
                {errors.specifications?.[index]?.value && (
                  <p className="text-sm text-red-700">
                    {errors.specifications[index]?.value?.message}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    disabled={index === 0}
                    onClick={() => specs.move(index, index - 1)}
                  >
                    Move specification up
                  </Button>
                  <Button
                    disabled={index === specs.fields.length - 1}
                    onClick={() => specs.move(index, index + 1)}
                  >
                    Move specification down
                  </Button>
                  <Button onClick={() => specs.remove(index)}>
                    Remove specification
                  </Button>
                </div>
              </div>
            ))}
            <Button
              disabled={specs.fields.length >= 100}
              onClick={() => specs.append({ label: '', value: '' })}
            >
              Add specification
            </Button>
          </section>
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || !categories.length}>
              {isSubmitting ? 'Saving…' : 'Save machine'}
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
