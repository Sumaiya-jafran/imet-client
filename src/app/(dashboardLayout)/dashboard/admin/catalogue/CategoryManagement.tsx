'use client';
import { ApiError } from '@/lib/api/client';
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
  const [editingCategory, setEditingCategory] = useState<AdminCategory>();
  const [editing, setEditing] = useState<string>();
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string; slug: string; parentId?: string | null }>({
    resolver: zodResolver(categorySchema),
    defaultValues: { parentId: null, name: '', slug: '' },
  });
  const cancel = () => {
    setEditing(undefined);
    setEditingCategory(undefined);
    reset({ name: '', slug: '' });
    setError('');
  };
  const save = async (data: {
    name: string;
    slug: string;
    parentId?: string | null;
  }) => {
    setError('');
    try {
      await catalogueAdminApi.saveCategory(token, data, editingCategory);
      cancel();
      onSave();
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.status === 409 &&
        e.message.toLowerCase().includes('slug')
      )
        setFieldError('slug', { message: e.message }, { shouldFocus: true });
      if (e instanceof ApiError && e.response.errors) {
        for (const issue of e.response.errors) {
          const key = issue.path.at(-1);
          if (key === 'name' || key === 'slug')
            setFieldError(
              key,
              { message: issue.message },
              { shouldFocus: true },
            );
        }
        setError(e.response.errors.map((issue) => issue.message).join('. '));
      } else
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
      <h2 className="text-section font-semibold">Categories</h2>
      <p className="my-3 text-nav text-secondary">
        Use a top-level category and one subcategory level. Referenced
        categories cannot be deleted.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-danger-foreground">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit(save)} noValidate className="space-y-3">
        <fieldset disabled={isSubmitting || deleting} className="space-y-3">
          <label className="block">
            Parent category (optional)
            <select
              {...register('parentId', { setValueAs: (v) => v || null })}
              className="mt-1 w-full"
            >
              <option value="">Top-level category</option>
              {categories
                .filter((c) => !c.parentId && c.id !== editingCategory?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block font-medium" htmlFor="category-name">
            Category name
          </label>
          <input
            id="category-name"
            {...register('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'category-name-error' : undefined}
            className="w-full rounded border p-2"
          />
          {errors.name && (
            <p
              id="category-name-error"
              role="alert"
              className="text-nav text-danger-foreground"
            >
              {errors.name.message}
            </p>
          )}
          <label className="block font-medium" htmlFor="category-slug">
            Category slug
          </label>
          <input
            id="category-slug"
            {...register('slug')}
            aria-invalid={!!errors.slug}
            aria-describedby={errors.slug ? 'category-slug-error' : undefined}
            className="w-full rounded border p-2"
          />
          {errors.slug && (
            <p
              id="category-slug-error"
              role="alert"
              className="text-nav text-danger-foreground"
            >
              {errors.slug.message}
            </p>
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
              <p className="break-all text-nav text-muted-foreground">
                {category.slug} · {category._count?.machines ?? 0} machines
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={isSubmitting || deleting}
                onClick={() => {
                  setEditing(category.id);
                  setEditingCategory(category);
                  reset({
                    name: category.name,
                    slug: category.slug,
                    parentId: category.parentId ?? null,
                  });
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
        <p className="mt-4 text-secondary">
          No categories yet. Create a category before adding machinery.
        </p>
      )}
    </section>
  );
}
