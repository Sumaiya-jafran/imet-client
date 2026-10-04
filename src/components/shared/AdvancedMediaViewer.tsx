'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Button from '@/components/buttons/Button';
import LoadingState from './LoadingState';
interface Actions {
  reset: () => void;
  zoom: (amount: number) => void;
  turn: (x: number, y: number) => void;
  vr: () => Promise<void>;
  exit: () => Promise<void>;
}
export default function AdvancedMediaViewer({
  source,
  type,
  title,
  onError,
}: {
  source: string;
  type: 'MODEL_3D' | 'VIEW_360';
  title: string;
  onError: () => void;
}) {
  const mount = useRef<HTMLDivElement>(null),
    actions = useRef<Actions>(undefined);
  const [ready, setReady] = useState(false),
    [vrSupported, setVrSupported] = useState(false),
    [immersive, setImmersive] = useState(false),
    [vrError, setVrError] = useState('');
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let disposed = false,
      renderer: THREE.WebGLRenderer | undefined,
      controls: OrbitControls | undefined,
      texture: THREE.Texture | undefined,
      object: THREE.Object3D | undefined,
      session: XRSession | undefined;
    const controller = new AbortController();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef2f5');
    const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
    const group = new THREE.Group();
    scene.add(group);
    const initial =
      type === 'MODEL_3D'
        ? new THREE.Vector3(3, 2, 3)
        : new THREE.Vector3(0, 0, 0.01);
    const reset = () => {
      camera.position.copy(initial);
      camera.fov = 50;
      camera.updateProjectionMatrix();
      controls?.target.set(0, 0, 0);
      controls?.update();
    };
    const fail = () => {
      if (!disposed) {
        controller.abort();
        onError();
      }
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    const resize = () => {
      if (!renderer || disposed) return;
      const width = Math.max(1, host.clientWidth),
        height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    const load = async () => {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          powerPreference: 'low-power',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType('local-floor');
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.setAttribute(
          'aria-label',
          `${title}: interactive ${type === 'MODEL_3D' ? '3D model' : '360 degree panorama'}`,
        );
        renderer.domElement.setAttribute('role', 'img');
        renderer.domElement.addEventListener('webglcontextlost', contextLost);
        host.appendChild(renderer.domElement);
        observer.observe(host);
        resize();
        reset();
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minDistance = type === 'MODEL_3D' ? 1 : 0.01;
        controls.maxDistance = type === 'MODEL_3D' ? 12 : 0.01;
        controls.enableZoom = type === 'MODEL_3D';
        controls.rotateSpeed = type === 'MODEL_3D' ? 0.7 : -0.35;
        controls.target.set(0, 0, 0);
        controls.update();
        const response = await fetch(source, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(30000),
          ]),
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Media unavailable');
        const maximum =
          type === 'MODEL_3D' ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
        if (
          Number(response.headers.get('content-length') ?? 0) > maximum ||
          !response.body
        )
          throw new Error('Media too large');
        const reader = response.body.getReader(),
          parts: Uint8Array<ArrayBuffer>[] = [];
        let size = 0;
        try {
          while (true) {
            const p = await reader.read();
            if (p.done) break;
            size += p.value.byteLength;
            if (size > maximum) {
              await reader.cancel();
              throw new Error('Media too large');
            }
            parts.push(new Uint8Array(p.value));
          }
        } finally {
          reader.releaseLock();
        }
        if (disposed) return;
        const blob = new Blob(parts, {
          type:
            type === 'MODEL_3D'
              ? 'model/gltf-binary'
              : (response.headers.get('content-type') ?? 'image/jpeg'),
        });
        if (type === 'MODEL_3D') {
          const model = await new GLTFLoader().parseAsync(
            await blob.arrayBuffer(),
            '',
          );
          object = model.scene;
          if (disposed) {
            disposeObject(object);
            return;
          }
          const box = new THREE.Box3().setFromObject(object),
            size = box.getSize(new THREE.Vector3()),
            extent = Math.max(size.x, size.y, size.z);
          if (!Number.isFinite(extent) || extent <= 0)
            throw new Error('Invalid model bounds');
          object.position.sub(box.getCenter(new THREE.Vector3()));
          const normalized = new THREE.Group();
          normalized.add(object);
          normalized.scale.setScalar(2 / extent);
          group.add(normalized);
          scene.add(new THREE.HemisphereLight(0xffffff, 0x708090, 2.5));
          const key = new THREE.DirectionalLight(0xffffff, 3);
          key.position.set(3, 5, 4);
          scene.add(key);
        } else {
          const bitmap = await createImageBitmap(blob);
          if (disposed) {
            bitmap.close();
            return;
          }
          if (
            bitmap.width !== 2 * bitmap.height ||
            bitmap.width > 8192 ||
            bitmap.height > 4096 ||
            bitmap.width > renderer.capabilities.maxTextureSize
          ) {
            bitmap.close();
            throw new Error('Panorama is unsupported');
          }
          texture = new THREE.Texture(bitmap);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          const geometry = new THREE.SphereGeometry(10, 64, 32);
          geometry.scale(-1, 1, 1);
          object = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ map: texture }),
          );
          group.add(object);
        }
        if (disposed) return;
        actions.current = {
          reset,
          zoom: (amount) => {
            if (session) return;
            if (type === 'MODEL_3D') {
              camera.position.multiplyScalar(amount > 0 ? 0.85 : 1.18);
              controls?.update();
            } else {
              camera.fov = THREE.MathUtils.clamp(
                camera.fov - amount * 5,
                30,
                90,
              );
              camera.updateProjectionMatrix();
            }
          },
          turn: (x, y) => {
            if (session) return;
            const offset = camera.position.clone().sub(controls!.target),
              spherical = new THREE.Spherical().setFromVector3(offset);
            spherical.theta += x;
            spherical.phi = THREE.MathUtils.clamp(
              spherical.phi + y,
              0.05,
              Math.PI - 0.05,
            );
            camera.position
              .copy(controls!.target)
              .add(new THREE.Vector3().setFromSpherical(spherical));
            controls!.update();
          },
          vr: async () => {
            if (!navigator.xr || !renderer || disposed) return;
            try {
              session = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor'],
              });
              if (disposed) {
                await session.end();
                return;
              }
              controls!.enabled = false;
              group.position.set(
                0,
                type === 'MODEL_3D' ? 1.4 : 0,
                type === 'MODEL_3D' ? -3 : 0,
              );
              camera.position.set(0, 0, 0);
              session.addEventListener(
                'end',
                () => {
                  session = undefined;
                  group.position.set(0, 0, 0);
                  controls!.enabled = true;
                  reset();
                  if (!disposed) setImmersive(false);
                },
                { once: true },
              );
              await renderer.xr.setSession(session);
              setImmersive(true);
              setVrError('');
            } catch {
              if (session) await session.end().catch(() => {});
              session = undefined;
              group.position.set(0, 0, 0);
              controls!.enabled = true;
              reset();
              if (!disposed)
                setVrError(
                  'VR could not start. Continue using the normal interactive view.',
                );
            }
          },
          exit: async () => {
            await session?.end();
          },
        };
        renderer.setAnimationLoop(() => {
          if (disposed || !renderer) return;
          if (!session) controls?.update();
          renderer.render(scene, camera);
        });
        setReady(true);
        if (window.isSecureContext && navigator.xr) {
          const supported = await navigator.xr
            .isSessionSupported('immersive-vr')
            .catch(() => false);
          if (!disposed) setVrSupported(supported);
        }
      } catch {
        fail();
      }
    };
    void load();
    return () => {
      disposed = true;
      controller.abort();
      observer.disconnect();
      actions.current = undefined;
      void session?.end().catch(() => {});
      renderer?.setAnimationLoop(null);
      controls?.dispose();
      disposeObject(group);
      if (object && !object.parent) disposeObject(object);
      if (texture?.image instanceof ImageBitmap) texture.image.close();
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, [source, type, title, onError]);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="relative">
        <div
          ref={mount}
          className="h-[300px] w-full sm:h-[420px] [&_canvas]:h-full [&_canvas]:w-full"
          onKeyDown={(event) => {
            const delta: Record<string, [number, number]> = {
              ArrowLeft: [-0.15, 0],
              ArrowRight: [0.15, 0],
              ArrowUp: [0, -0.15],
              ArrowDown: [0, 0.15],
            };
            if (delta[event.key]) {
              event.preventDefault();
              actions.current?.turn(...delta[event.key]);
            }
          }}
          tabIndex={0}
          role="group"
          aria-label={`${title} viewer. Arrow keys rotate. Use zoom and reset controls below.`}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <LoadingState label="Loading interactive media…" />
          </div>
        )}
      </div>
      <div className="space-y-3 border-t border-slate-200 p-3">
        <p className="text-sm text-slate-600">
          {type === 'MODEL_3D'
            ? 'Drag to rotate. Pinch or scroll to zoom.'
            : 'Drag to look around the 360° panorama.'}{' '}
          Arrow keys also rotate the view.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={!ready || immersive}
            onClick={() => actions.current?.zoom(1)}
            aria-label="Zoom in"
          >
            Zoom in
          </Button>
          <Button
            variant="secondary"
            disabled={!ready || immersive}
            onClick={() => actions.current?.zoom(-1)}
            aria-label="Zoom out"
          >
            Zoom out
          </Button>
          <Button
            variant="secondary"
            disabled={!ready || immersive}
            onClick={() => actions.current?.reset()}
          >
            Reset view
          </Button>
          {ready && vrSupported && (
            <Button
              onClick={() =>
                void (immersive
                  ? actions.current?.exit()
                  : actions.current?.vr())
              }
            >
              {immersive ? 'Exit VR' : 'Enter VR'}
            </Button>
          )}
        </div>
        {vrError && (
          <p role="alert" className="text-sm text-amber-900">
            {vrError}
          </p>
        )}
      </div>
    </div>
  );
}
function disposeObject(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      for (const material of Array.isArray(child.material)
        ? child.material
        : [child.material]) {
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
        material.dispose();
      }
    }
  });
  for (const t of textures) {
    if (t.image instanceof ImageBitmap) t.image.close();
    t.dispose();
  }
}
