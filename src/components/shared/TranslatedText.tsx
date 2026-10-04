'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { translationApi } from '@/lib/api/translation.service';
import type {
  Language,
  TranslationReference,
  TranslationResult,
} from '@/types/translation';
const referenceKey = (r: TranslationReference) =>
  `${r.type}:${r.id}:${r.field}`;
type Pending = {
  resource: TranslationReference;
  resolve: (value: TranslationResult) => void;
  reject: (reason: Error) => void;
};
const queue = new Map<Language, Map<string, Pending[]>>();
const requests = new Map<
  string,
  { at: number; promise: Promise<TranslationResult> }
>();
function read(
  resource: TranslationReference,
  language: Language,
  original: string,
) {
  const cacheKey = `${referenceKey(resource)}:${language}:${original}`;
  const previous = requests.get(cacheKey);
  if (previous && Date.now() - previous.at < 30000) return previous.promise;
  const promise = new Promise<TranslationResult>((resolve, reject) => {
    let group = queue.get(language);
    if (!group) {
      group = new Map();
      queue.set(language, group);
      setTimeout(() => {
        const pending = queue.get(language);
        queue.delete(language);
        const entries = [...(pending?.entries() ?? [])];
        for (let i = 0; i < entries.length; i += 40) {
          const batch = entries.slice(i, i + 40);
          translationApi
            .read(
              batch.map(([, values]) => values[0].resource),
              language,
            )
            .then((r) => {
              for (const [key, values] of batch) {
                const result = r.data?.find(
                  (v) => referenceKey(v.resource) === key,
                );
                for (const waiter of values) {
                  if (result) waiter.resolve(result);
                  else waiter.reject(new Error('Translation unavailable'));
                }
              }
            })
            .catch((e: unknown) => {
              for (const [, values] of batch)
                for (const waiter of values)
                  waiter.reject(
                    e instanceof Error
                      ? e
                      : new Error('Translation unavailable'),
                  );
            });
        }
      }, 0);
    }
    const key = referenceKey(resource);
    group.set(key, [...(group.get(key) ?? []), { resource, resolve, reject }]);
  });
  // Keep a small bounded read cache; no generation ever occurs in a render/effect.
  if (requests.size >= 400) requests.delete(requests.keys().next().value!);
  requests.set(cacheKey, { at: Date.now(), promise });
  void promise.catch(() => requests.delete(cacheKey));
  return promise;
}
export default function TranslatedText({
  resource,
  original,
  showStatus = false,
}: {
  resource: TranslationReference;
  original: string;
  showStatus?: boolean;
}) {
  const { language, originals } = useLanguage();
  const key = `${referenceKey(resource)}:${language}:${original}`;
  const [result, setResult] = useState<{
    key: string;
    data?: TranslationResult;
    failed?: boolean;
  } | null>(null);
  const { type, id, field } = resource;
  useEffect(() => {
    if (originals) return;
    let active = true;
    read({ type, id, field }, language, original)
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch(() => {
        if (active) setResult({ key, failed: true });
      });
    return () => {
      active = false;
    };
  }, [type, id, field, language, original, originals, key]);
  const current = result?.key === key ? result : null;
  const translated =
    !originals &&
    current?.data?.sourceText === original &&
    current.data.status === 'COMPLETED' &&
    current.data.text !== null;
  const text = translated ? current!.data!.text! : original;
  return (
    <span aria-busy={!originals && !current}>
      <span
        lang={translated ? language : (current?.data?.sourceLanguage ?? '')}
      >
        {text}
      </span>
      {showStatus &&
        !originals &&
        (current?.failed ||
          ['STALE', 'FAILED', 'PROCESSING'].includes(
            current?.data?.status ?? '',
          )) && (
          <small
            className="mt-2 block text-xs font-normal text-slate-500"
            role="status"
          >
            Translation unavailable. Showing original text.
          </small>
        )}
    </span>
  );
}
