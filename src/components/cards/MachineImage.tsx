'use client';
import { useState } from 'react';
import { Factory } from 'lucide-react';
import type { MachineImage as ImageData } from '@/types/catalogue';
export default function MachineImage({ image }: { image?: ImageData }) {
  const [failed, setFailed] = useState(false);
  let safe = false;
  try {
    safe = !!image && new URL(image.url).protocol === 'https:';
  } catch {}
  return (
    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-slate-100">
      {image && safe && !failed ? (
        // Catalogue images use arbitrary HTTPS hosts; avoid proxying untrusted URLs through the server.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt={image.alt || 'Machinery'}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Factory aria-hidden="true" size={40} />
          <span>Image unavailable</span>
        </div>
      )}
    </div>
  );
}
