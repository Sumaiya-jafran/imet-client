'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema } from '@/lib/schema-validations/catalogue.schema';
import {
  catalogueAdminApi,
  type AdminCategory,
} from '@/lib/api/catalogue-admin.service';
import Button from '@/components/buttons/Button';
export default function CategoryManagement({
  token,
  categories,
  onSave,
}: {
  token: string;
  categories: AdminCategory[];
  onSave: () => void;
}) {
  const [editing, setEditing] = useState<string>();
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string; slug: string }>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '' },
  });
  const cancel = () => {
    setEditing(undefined);
    reset({ name: '', slug: '' });
    setError('');
  };
  const save = async (data: { name: string; slug: string }) => {
    setError('');
    try {
      await catalogueAdminApi.saveCategory(token, data, editing);
      cancel();
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save category');
    }
  };
  const remove = async (category: AdminCategory) => {
    if (
      !window.confirm(
        `Delete category “${category.name}”? This cannot be undone. Categories containing machines cannot be deleted.`,
      )
    )
      return;
    setDeleting(true);
    setError('');
    try {
      await catalogueAdminApi.removeCategory(token, category.id);
      if (editing === category.id) cancel();
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete category');
    } finally {
      setDeleting(false);
    }
  };
  return (
    <section className="surface p-5">
      <h2 className="text-2xl font-semibold">Categories</h2>
      <p className="my-3 text-sm text-slate-600">
        Categories have one level. Categories containing machines cannot be
        deleted.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-red-700">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit(save)} noValidate className="space-y-3">
        <fieldset disabled={isSubmitting || deleting} className="space-y-3">
          <label className="block font-medium" htmlFor="category-name">
            Category name
          </label>
          <input
            id="category-name"
            {...register('name')}
            className="w-full rounded border p-2"
          />
          {errors.name && (
            <p className="text-sm text-red-700">{errors.name.message}</p>
          )}
          <label className="block font-medium" htmlFor="category-slug">
            Category slug
          </label>
          <input
            id="category-slug"
            {...register('slug')}
            className="w-full rounded border p-2"
          />
          {errors.slug && (
            <p className="text-sm text-red-700">{errors.slug.message}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit">
              {isSubmitting
                ? 'Saving…'
                : editing
                  ? 'Save category'
                  : 'Create category'}
            </Button>
            {editing && (
              <Button variant="secondary" onClick={cancel}>
                Cancel category edit
              </Button>
            )}
          </div>
        </fieldset>
      </form>
      <ul className="mt-5 divide-y">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="break-words font-medium">{category.name}</p>
              <p className="break-all text-sm text-slate-500">
                {category.slug} · {category._count?.machines ?? 0} machines
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={isSubmitting || deleting}
                onClick={() => {
                  setEditing(category.id);
                  reset({ name: category.name, slug: category.slug });
                  setError('');
                }}
              >
                Edit category
              </Button>
              <Button
                variant="danger"
                disabled={
                  isSubmitting || deleting || !!category._count?.machines
                }
                onClick={() => void remove(category)}
              >
                Delete category
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {!categories.length && (
        <p className="mt-4 text-slate-600">
          No categories yet. Create a category before adding machinery.
        </p>
      )}
    </section>
  );
}
