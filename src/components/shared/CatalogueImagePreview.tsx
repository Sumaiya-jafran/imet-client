'use client';
import { useEffect, useState } from 'react';
import { catalogueImagesApi } from '@/lib/api/catalogue-images.service';
export default function CatalogueImagePreview({
  token,
  assetId,
  alt,
  supplierMode = false,
}: {
  token: string;
  assetId: string;
  alt: string;
  supplierMode?: boolean;
}) {
  const [source, setSource] = useState<string>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let url: string | undefined;
    catalogueImagesApi
      .preview(
        token,
        assetId,
        AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        supplierMode,
      )
      .then((blob) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setSource(url);
        setError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [token, assetId, attempt, supplierMode]);
  return (
    <div className="mb-3 flex min-h-28 items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
      {error ? (
        <div role="status" className="text-sm text-slate-600">
          Preview unavailable.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry preview
          </button>
        </div>
      ) : source ? (
        // The preview is an authenticated blob URL, never a public image proxy.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={source}
          alt={alt || 'Uploaded machinery image'}
          className="max-h-44 max-w-full object-contain"
        />
      ) : (
        <span role="status" className="text-xs text-slate-500">
          Loading image preview…
        </span>
      )}
    </div>
  );
}
