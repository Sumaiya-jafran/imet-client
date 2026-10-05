'use client';
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import MachineImage from '@/components/cards/MachineImage';
import Button from '@/components/buttons/Button';
import LoadingState from './LoadingState';
import type { MachineImage as ImageData } from '@/types/catalogue';
import type { MachineryMedia } from '@/types/media';
import { mediaUrl } from '@/lib/api/media.service';
const AdvancedMediaViewer = dynamic(() => import('./AdvancedMediaViewer'), {
  ssr: false,
  loading: () => <LoadingState label="Preparing interactive viewer…" />,
});
export default function MachineryMediaGallery({
  images,
  media = [],
  name = 'Machinery',
}: {
  images: ImageData[];
  media?: MachineryMedia[];
  name?: string;
}) {
  const [selected, setSelected] = useState<MachineryMedia>();
  const [photo, setPhoto] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);
  return (
    <section aria-label="Machinery media" className="min-w-0 space-y-3">
      {selected && !failed ? (
        <AdvancedMediaViewer
          key={`${selected.id}-${attempt}`}
          source={mediaUrl(selected.id)}
          type={selected.type}
          title={selected.title}
          onError={handleError}
        />
      ) : (
        <MachineImage image={images[photo]} alt={name} />
      )}
      {failed && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <p>
            Interactive media is unavailable on this device or could not load.
            Standard images remain available.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setAttempt((x) => x + 1);
              setFailed(false);
            }}
          >
            Retry interactive media
          </Button>
        </div>
      )}
      {!!media.length && (
        <div className="flex flex-wrap gap-2" aria-label="Media selection">
          <Button
            variant="secondary"
            aria-pressed={!selected}
            onClick={() => {
              setSelected(undefined);
              setFailed(false);
            }}
          >
            Standard images
          </Button>
          {media.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              aria-pressed={selected?.id === item.id}
              onClick={() => {
                setSelected(item);
                setFailed(false);
              }}
            >
              {item.type === 'MODEL_3D' ? '3D model' : '360° view'} ·{' '}
              {item.title}
            </Button>
          ))}
        </div>
      )}
      {(!selected || failed) && images.length > 1 && (
        <div>
          <p className="mb-3 text-xs text-slate-600" role="status">
            Image {photo + 1} of {images.length}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {images.map((image, i) => (
              <button
                type="button"
                key={`${image.url}-${i}`}
                aria-label={`View image ${i + 1} of ${name}`}
                aria-pressed={photo === i}
                className={`rounded-lg p-1 transition ${photo === i ? 'bg-navy ring-2 ring-navy ring-offset-2' : 'bg-white hover:bg-slate-200'}`}
                onClick={() => setPhoto(i)}
              >
                <MachineImage
                  compact
                  image={image}
                  alt={`${name}, image ${i + 1}`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
