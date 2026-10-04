'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { translationApi } from '@/lib/api/translation.service';
import type {
  Language,
  TranslationResources,
  TranslationDetail,
  TranslationField,
} from '@/types/translation';
import TranslationForm from '@/components/forms/TranslationForm';
import Button from '@/components/buttons/Button';
import PageHeader from './PageHeader';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
export default function TranslationWorkspace() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [query, setQuery] = useState(new URLSearchParams()),
    [data, setData] = useState<TranslationResources | null>(null),
    [detail, setDetail] = useState<TranslationDetail | null>(null),
    [selected, setSelected] = useState<{
      type: string;
      id: string;
      title: string;
    } | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token) return;
    let active = true;
    translationApi
      .resources(token, query)
      .then((r) => {
        if (active) {
          setData(r.data ?? null);
          setError('');
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Unable to load content');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, query, revision]);
  const open = async (r: { type: string; id: string; title: string }) => {
    if (!token) return;
    setSelected(r);
    setDetail(null);
    setError('');
    setNotice('');
    setBusy(true);
    try {
      setDetail(
        (await translationApi.detail(token, r.type, r.id)).data ?? null,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to load translation status',
      );
    } finally {
      setBusy(false);
    }
  };
  const generate = async (
    field: TranslationField,
    source: Language,
    target: Language,
    regenerate: boolean,
  ) => {
    if (!token || !selected) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await translationApi.generate(token, {
        resource: field.resource,
        sourceHash: field.sourceHash,
        sourceLanguage: source,
        targetLanguage: target,
        regenerate,
      });
      setDetail(
        (await translationApi.detail(token, selected.type, selected.id)).data ??
          null,
      );
      setNotice(
        r.data?.status === 'PROCESSING'
          ? 'Another request is processing. Reload status shortly.'
          : 'Translation available. The original content is unchanged. Refresh public pages to see the current result.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to translate content');
      // Preserve the original/management screen even when the provider fails.
      try {
        setDetail(
          (await translationApi.detail(token, selected.type, selected.id))
            .data ?? null,
        );
      } catch {
        /* Existing original remains visible. */
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="AI translations"
        description="Prepare English, Bangla and Chinese versions of public marketplace content. Originals and technical values stay unchanged."
      />
      {data && !data.providerConfigured && (
        <div className="surface border-amber-200 p-4 text-sm text-amber-900">
          OpenAI is not configured on the server. Add AI_TRANSLATION_API_KEY
          securely in environment settings. Existing cached translations and
          original content remain readable.
        </div>
      )}
      <form
        className="filter-bar grid grid-cols-1 items-end gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new URLSearchParams();
          for (const [k, v] of new FormData(e.currentTarget))
            if (String(v).trim()) q.set(k, String(v).trim());
          setQuery(q);
          setLoading(true);
          setSelected(null);
          setDetail(null);
        }}
      >
        <div>
          <label htmlFor="translation-content-type">Content type</label>
          <select
            id="translation-content-type"
            name="type"
            defaultValue={query.get('type') ?? 'MACHINERY'}
            className="mt-1 w-full"
          >
            <option value="MACHINERY">Machinery & specification labels</option>
            <option value="SUPPLIER">Supplier descriptions</option>
            <option value="REVIEW">Published buyer reviews</option>
          </select>
        </div>
        <div>
          <label htmlFor="translation-content-search">Search</label>
          <input
            id="translation-content-search"
            name="q"
            maxLength={100}
            defaultValue={query.get('q') ?? ''}
            className="mt-1 w-full"
          />
        </div>
        <Button type="submit" disabled={loading || busy}>
          Find content
        </Button>
      </form>
      {error && (
        <div role="alert" className="surface space-y-3 p-4">
          <p className="break-words text-sm text-red-700">{error}</p>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              selected
                ? void open(selected)
                : (setLoading(true), setRevision((n) => n + 1))
            }
          >
            Reload status
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {loading ? (
        <LoadingState label="Loading translatable content…" />
      ) : (
        data && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.resources.map((r) => (
                <article className="surface min-w-0 p-4" key={r.id}>
                  <p className="break-words text-sm font-semibold">{r.title}</p>
                  <Button
                    className="mt-3"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void open(r)}
                  >
                    Manage translations
                  </Button>
                </article>
              ))}
            </div>
            {!data.resources.length && (
              <EmptyState
                title="No public content found"
                description="Publish machinery or reviews, or activate an approved supplier's marketplace subscription before translating their public content."
              />
            )}
            {data.pagination.totalPages > 1 && (
              <nav
                className="flex flex-wrap items-center gap-3"
                aria-label="Translation resources pagination"
              >
                <Button
                  variant="secondary"
                  disabled={busy || data.pagination.page <= 1}
                  onClick={() => {
                    const q = new URLSearchParams(query);
                    q.set('page', String(data.pagination.page - 1));
                    setQuery(q);
                    setLoading(true);
                  }}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={
                    busy || data.pagination.page >= data.pagination.totalPages
                  }
                  onClick={() => {
                    const q = new URLSearchParams(query);
                    q.set('page', String(data.pagination.page + 1));
                    setQuery(q);
                    setLoading(true);
                  }}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )
      )}
      {selected && (
        <section
          className="space-y-4"
          aria-label="Selected content translations"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="break-words text-lg font-semibold">
              {selected.title}
            </h2>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void open(selected)}
            >
              Reload selected content
            </Button>
          </div>
          {!detail && !error && (
            <LoadingState label="Loading translation fields…" />
          )}
          {detail?.fields.map((field) => (
            <TranslationForm
              key={`${field.resource.type}:${field.resource.id}:${field.resource.field}`}
              field={field}
              busy={busy}
              configured={detail.providerConfigured}
              maxCharacters={detail.maxCharacters}
              onGenerate={generate}
            />
          ))}
        </section>
      )}
    </div>
  );
}
