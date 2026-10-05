'use client';
import { catalogueImageUrl } from '@/lib/api/catalogue-images.service';
import { useState } from 'react';
import { Factory, LoaderCircle } from 'lucide-react';
import type { MachineImage as ImageData } from '@/types/catalogue';
export default function MachineImage({
  image,
  alt = 'Machinery',
  compact = false,
}: {
  image?: ImageData;
  alt?: string;
  compact?: boolean;
}) {
  const [loadedUrl, setLoadedUrl] = useState<string>();
  const [failedUrl, setFailedUrl] = useState<string>();
  let safe = false;
  try {
    safe = !!image && new URL(image.url).protocol === 'https:';
  } catch {}
  if (
    image &&
    /^\/(?:catalogue\/images\/[0-9a-f-]{36}\/content|suppliers\/assets\/[0-9a-f-]{36}\/logo)$/.test(
      image.url,
    )
  )
    safe = true;
  return (
    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-slate-200/70 bg-slate-100">
      {image && safe && failedUrl !== image.url ? (
        <>
          {loadedUrl !== image.url && (
            <LoaderCircle
              className="absolute text-slate-400 motion-safe:animate-spin"
              size={22}
              aria-hidden="true"
            />
          )}
          {/* Catalogue images use arbitrary HTTPS hosts; avoid proxying untrusted URLs through the server. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={catalogueImageUrl(image.url)}
            alt={image.alt || alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain"
            onLoad={() => setLoadedUrl(image.url)}
            onError={() => setFailedUrl(image.url)}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 text-xs text-slate-500">
          <Factory
            aria-hidden="true"
            size={compact ? 20 : 36}
            strokeWidth={1.25}
          />
          {!compact && <span>Image unavailable</span>}
        </div>
      )}
    </div>
  );
}
