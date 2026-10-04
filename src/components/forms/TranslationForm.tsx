'use client';
import { useForm, useWatch } from 'react-hook-form';
import {
  languages,
  type Language,
  type TranslationField,
} from '@/types/translation';
import Button from '@/components/buttons/Button';
import Badge from '@/components/shared/Badge';
export default function TranslationForm({
  field,
  configured,
  maxCharacters,
  busy,
  onGenerate,
}: {
  field: TranslationField;
  configured: boolean;
  maxCharacters: number;
  busy: boolean;
  onGenerate: (
    field: TranslationField,
    source: Language,
    target: Language,
    regenerate: boolean,
  ) => Promise<unknown>;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ source: '' | Language; target: Language }>({
    defaultValues: { source: '', target: 'bn' },
  });
  const controlId = `${field.resource.type}-${field.resource.id}-${field.resource.field}`;
  const source = useWatch({ control, name: 'source' }),
    target = useWatch({ control, name: 'target' });
  const unavailable =
    field.original.length > maxCharacters ||
    !field.original.trim() ||
    (!configured && source !== target);
  return (
    <article className="surface min-w-0 space-y-4 p-5">
      <div>
        <p className="eyebrow">
          {field.resource.type === 'SPECIFICATION'
            ? 'Specification label'
            : field.resource.field.toLowerCase()}
        </p>
        <h2 className="mt-2 text-sm font-semibold">Original content</h2>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
          {field.original}
        </p>
      </div>
      <div className="space-y-3">
        {field.translations.map((t) => (
          <div
            key={t.targetLanguage}
            className="min-w-0 rounded-lg border border-slate-200 p-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span lang={t.targetLanguage}>
                {languages.find((l) => l.code === t.targetLanguage)?.label}
              </span>
              <Badge tone={t.status === 'COMPLETED' ? 'success' : 'neutral'}>
                {t.status}
              </Badge>
              {t.sourceLanguage && (
                <span className="text-slate-500">
                  Source: {t.sourceLanguage}
                </span>
              )}
            </div>
            {t.text && (
              <p
                lang={t.targetLanguage}
                className="mt-2 whitespace-pre-wrap break-words text-sm leading-6"
              >
                {t.text}
              </p>
            )}
            {t.status === 'STALE' && (
              <p className="mt-2 text-xs text-slate-500">
                Original content changed. Generate a current translation.
              </p>
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit((v) =>
          onGenerate(field, v.source as Language, v.target, false),
        )}
        className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2"
      >
        <div className="text-xs font-semibold">
          <label htmlFor={`source-${controlId}`}>Original language</label>
          <select
            id={`source-${controlId}`}
            className="mt-1 w-full"
            disabled={busy}
            {...register('source', {
              required: 'Select the original language first.',
            })}
          >
            <option value="">Select original language</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code} lang={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          {errors.source && (
            <span role="alert" className="text-red-700">
              {errors.source.message}
            </span>
          )}
        </div>
        <div className="text-xs font-semibold">
          <label htmlFor={`target-${controlId}`}>Translate to</label>
          <select
            id={`target-${controlId}`}
            className="mt-1 w-full"
            disabled={busy}
            {...register('target')}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code} lang={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy || unavailable}>
            {busy ? 'Working…' : 'Generate / use cache'}
          </Button>
          <Button
            variant="secondary"
            disabled={busy || unavailable}
            onClick={handleSubmit((v) =>
              onGenerate(field, v.source as Language, v.target, true),
            )}
          >
            Regenerate / retry
          </Button>
        </div>
        <p className="text-xs text-slate-500 sm:col-span-2">
          Select the actual source language; existing content is not assumed to
          be English. Regeneration uses the daily AI allowance. Same-language
          requests return the original without AI.
        </p>
        {field.original.length > maxCharacters && (
          <p role="status" className="text-xs text-amber-900 sm:col-span-2">
            This field exceeds the {maxCharacters}-character translation limit.
            Its original remains available.
          </p>
        )}
      </form>
    </article>
  );
}
