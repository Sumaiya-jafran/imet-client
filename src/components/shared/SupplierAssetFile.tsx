'use client';
import { useEffect, useState } from 'react';
import { supplierAssetsApi } from '@/lib/api/supplier-assets.service';
export default function SupplierAssetFile({
  token,
  assetId,
  name,
  preview = false,
}: {
  token: string;
  assetId: string;
  name: string;
  preview?: boolean;
}) {
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let source: string | undefined;
    supplierAssetsApi
      .content(
        token,
        assetId,
        AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      )
      .then((blob) => {
        if (controller.signal.aborted) return;
        source = URL.createObjectURL(blob);
        setUrl(source);
        setError('');
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'File unavailable');
      });
    return () => {
      controller.abort();
      if (source) URL.revokeObjectURL(source);
    };
  }, [token, assetId, attempt]);
  return (
    <div className="my-2 text-sm">
      {error ? (
        <p role="status">
          {error}{' '}
          <button
            type="button"
            className="underline"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Retry file
          </button>
        </p>
      ) : url ? (
        <>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={name}
              className="mb-2 max-h-32 max-w-full rounded-lg object-contain"
            />
          )}
          <a
            href={url}
            download={name}
            className="font-medium text-blue-700 underline"
          >
            Download {name}
          </a>
        </>
      ) : (
        <span role="status">Loading private file…</span>
      )}
    </div>
  );
}
