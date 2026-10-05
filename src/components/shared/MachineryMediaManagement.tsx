'use client';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Button from '@/components/buttons/Button';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { mediaApi } from '@/lib/api/media.service';
import type { MachineryMedia } from '@/types/media';
const Viewer = dynamic(() => import('./AdvancedMediaViewer'), {
  ssr: false,
  loading: () => <LoadingState label="Preparing preview…" />,
});
export default function MachineryMediaManagement({
  token,
  machineId,
  name,
  onClose,
}: {
  token: string;
  machineId: string;
  name: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
      configured: boolean;
      media: MachineryMedia[];
    }>(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(''),
    [revision, setRevision] = useState(0),
    [preview, setPreview] = useState<{ item: MachineryMedia; url: string }>();
  useEffect(() => {
    const c = new AbortController();
    mediaApi
      .list(token, machineId, c.signal)
      .then((r) => {
        if (!c.signal.aborted) {
          setData(r.data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Unable to load media');
          setLoading(false);
        }
      });
    return () => c.abort();
  }, [token, machineId, revision]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  const previewFailed = useCallback(() => {
    setError(
      'Interactive preview is unavailable on this device or could not load.',
    );
    setPreview(undefined);
  }, []);
  const reload = () => {
    setLoading(true);
    setRevision((v) => v + 1);
  };
  const upload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget,
      body = new FormData(form),
      file = body.get('file'),
      type = body.get('type');
    if (!(file instanceof File) || !file.size) {
      setError('Choose a media file.');
      return;
    }
    if (file.size > (type === 'MODEL_3D' ? 25 : 10) * 1024 * 1024) {
      setError('GLB files must be at most 25 MB; panoramas at most 10 MB.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await mediaApi.upload(token, machineId, body);
      form.reset();
      setNotice(
        'Media uploaded. It appears publicly only while this machine is visible in the catalogue.',
      );
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Media upload failed');
    } finally {
      setBusy(false);
    }
  };
  const remove = async (item: MachineryMedia) => {
    if (!window.confirm(`Remove “${item.title}” and its stored file?`)) return;
    setBusy(true);
    setError('');
    try {
      await mediaApi.remove(token, item.id);
      if (preview?.item.id === item.id) setPreview(undefined);
      setNotice('Media removed.');
      reload();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Removal failed. Retry to complete storage cleanup.',
      );
      reload();
    } finally {
      setBusy(false);
    }
  };
  const view = async (item: MachineryMedia) => {
    setBusy(true);
    setError('');
    try {
      const blob = await mediaApi.preview(token, item.id);
      setPreview({ item, url: URL.createObjectURL(blob) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview unavailable');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      className="surface min-w-0 space-y-5 p-5"
      aria-label="Manage machinery media"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">3D & 360° media</h2>
          <p className="break-words text-sm text-slate-600">{name}</p>
        </div>
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Back to machines
        </Button>
      </div>
      <p className="text-sm text-slate-600">
        Up to 5 advanced assets. Upload self-contained static GLB 2.0 models (25
        MB) or 2:1 JPEG/PNG panoramas (10 MB, up to 8192×4096). Models must
        embed all textures and use no compression extensions. Existing machinery
        images remain the fallback. Remove these files before deleting the
        machine.
      </p>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
          <Button
            variant="secondary"
            onClick={() => {
              setError('');
              reload();
            }}
          >
            Reload media
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {loading ? (
        <LoadingState label="Loading machinery media…" />
      ) : (
        data && (
          <>
            {!data.configured && (
              <p
                role="status"
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
              >
                Bunny Storage is not configured on the backend. Add the storage
                zone and access key securely in environment settings to enable
                uploads.
              </p>
            )}
            <form
              onSubmit={upload}
              className="grid items-end gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="media-type"
                  className="block text-sm font-medium"
                >
                  Media type
                </label>
                <select
                  id="media-type"
                  name="type"
                  className="mt-1 w-full rounded-lg border p-2"
                >
                  <option value="MODEL_3D">3D model — GLB</option>
                  <option value="VIEW_360">360° panorama — JPEG/PNG</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="media-title"
                  className="block text-sm font-medium"
                >
                  Media title
                </label>
                <input
                  id="media-title"
                  name="title"
                  required
                  maxLength={150}
                  className="mt-1 w-full rounded-lg border p-2"
                />
              </div>
              <div>
                <label
                  htmlFor="media-file"
                  className="block text-sm font-medium"
                >
                  Media file
                </label>
                <input
                  id="media-file"
                  name="file"
                  type="file"
                  accept=".glb,.jpg,.jpeg,.png"
                  required
                  className="mt-1 w-full text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={busy || !data.configured || data.media.length >= 5}
              >
                {busy ? 'Working…' : 'Upload media'}
              </Button>
            </form>
            <ul className="divide-y">
              {data.media.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold">{item.title}</h3>
                    <p className="text-sm text-slate-600">
                      {item.type === 'MODEL_3D' ? '3D model' : '360° panorama'}{' '}
                      · {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                      {item.state === 'DELETING'
                        ? ' · Removal pending — retry'
                        : item.state === 'UPLOADING'
                          ? ' · Upload pending — remove after one minute if interrupted'
                          : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={busy || item.state !== 'ACTIVE'}
                      onClick={() => void view(item)}
                    >
                      Preview media
                    </Button>
                    <Button
                      variant="danger"
                      disabled={busy}
                      onClick={() => void remove(item)}
                    >
                      {item.state === 'DELETING'
                        ? 'Retry removal'
                        : 'Remove media'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {!data.media.length && (
              <EmptyState
                title="No advanced media"
                description="Standard machinery images remain available. Add a compatible model or panorama when you have one."
              />
            )}
          </>
        )
      )}
      {preview && (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="font-semibold">Preview: {preview.item.title}</h3>
            <Button variant="secondary" onClick={() => setPreview(undefined)}>
              Close preview
            </Button>
          </div>
          <Viewer
            key={preview.url}
            source={preview.url}
            type={preview.item.type}
            title={preview.item.title}
            onError={previewFailed}
          />
        </div>
      )}
    </section>
  );
}
