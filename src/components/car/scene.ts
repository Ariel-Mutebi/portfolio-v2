import * as THREE from 'three';
import { createCameraRig } from './camera.ts';
import { createStudioEnvironment } from './environment.ts';
import { disposeModel, loadCarModel } from './model';
import { createRenderer } from './renderer.ts';
import { createTunnel } from './tunnel';

export type SceneStatus = 'loading' | 'ready' | 'error';

interface WindTunnelOptions {
  modelUrl: string;
  onStatusChange?: (status: SceneStatus) => void;
}

/** Mounts the scene in a container and returns its cleanup function */
export function mountWindTunnel(
  container: HTMLElement,
  { modelUrl, onStatusChange }: WindTunnelOptions,
) {
  onStatusChange?.('loading');

  let renderer: THREE.WebGLRenderer;

  try {
    renderer = createRenderer(container);
  } catch (error) {
    console.error('WebGL is unavailable', error);
    onStatusChange?.('error');
    return () => {};
  }

  let disposed = false;
  let model: THREE.Object3D | undefined;
  let tunnel: ReturnType<typeof createTunnel> | undefined;

  const scene = new THREE.Scene();
  const environment = createStudioEnvironment(renderer);
  scene.environment = environment.texture;

  const render = () => renderer.render(scene, cameraRig.camera);
  const cameraRig = createCameraRig(renderer.domElement, render);

  const resizeObserver = new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;

    renderer.setSize(width, height);
    cameraRig.resize(width, height);
    render();
  });
  resizeObserver.observe(container);

  loadCarModel(modelUrl)
    .then((car) => {
      /** The visitor may have left while the model was loading */
      if (disposed) return disposeModel(car);

      model = car;
      const floorY = new THREE.Box3().setFromObject(car).min.y;
      tunnel = createTunnel(floorY);

      scene.add(car, tunnel.group);
      render();
      onStatusChange?.('ready');
    })
    .catch((error) => {
      console.error('Model failed to load', error);
      if (!disposed) onStatusChange?.('error');
    });

  return () => {
    disposed = true;
    resizeObserver.disconnect();
    cameraRig.dispose();
    if (model) disposeModel(model);
    tunnel?.dispose();
    environment.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
