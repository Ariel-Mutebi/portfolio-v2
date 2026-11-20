import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  Box3,
  Vector3,
  SRGBColorSpace
} from 'three';
import type { Object3D, Material, BufferGeometry } from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';

import type {
  LegoSceneConfig,
  LegoSceneInstance
} from './types';

const DEFAULT_CONFIG: Required<LegoSceneConfig> = {
  backgroundColor: '#e9e9e9',
  modelPath: '/assets/3031.mpd',
  modelScale: 1.2,
  cameraPosition: {
    x: 3,
    y: 2,
    z: 3
  }
};

export function createLegoScene(
  container: HTMLElement,
  config: LegoSceneConfig = {}
): LegoSceneInstance {
  const settings = {
    ...DEFAULT_CONFIG,
    ...config
  };

  let destroyed = false;
  let animationFrameId: number | null = null;

  // Scene
  const scene = createScene(settings);

  // Camera
  const camera = createCamera(container, settings);

  // Renderer
  const renderer = createRenderer(container);

  // Lighting
  setupLighting(scene);

  // Model loader
  const loader = createModelLoader();

  // Attach renderer
  container.appendChild(renderer.domElement);

  // Resize handling
  const handleResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  };

  window.addEventListener('resize', handleResize);

  // Load model
  loadModel(loader, settings)
    .then((model) => {
      if (destroyed) {
        disposeObject(model);
        return;
      }

      scene.add(model);
    })
    .catch((error) => {
      if (!destroyed) {
        console.error('LEGO loading error:', error);
      }
    });

  // Animation loop
  function animate() {
    if (destroyed) return;

    animationFrameId = requestAnimationFrame(animate);

    renderer.render(scene, camera);
  }

  animate();

  // Public lifecycle API
  return {
    destroy() {
      if (destroyed) return;

      destroyed = true;

      window.removeEventListener('resize', handleResize);

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      disposeScene(scene);

      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}

/* ----------------------------------
   Scene setup
---------------------------------- */

function createScene(config: Required<LegoSceneConfig>): Scene {
  const scene = new Scene();

  scene.background = new Color(config.backgroundColor);

  return scene;
}

/* ----------------------------------
   Camera setup
---------------------------------- */

function createCamera(
  container: HTMLElement,
  config: Required<LegoSceneConfig>
): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  const { x, y, z } = config.cameraPosition;

  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);

  return camera;
}

/* ----------------------------------
   Renderer setup
---------------------------------- */

function createRenderer(container: HTMLElement): WebGLRenderer {
  const renderer = new WebGLRenderer({
    antialias: true
  });

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.outputColorSpace = SRGBColorSpace;

  return renderer;
}

/* ----------------------------------
   Lighting setup
---------------------------------- */

function setupLighting(scene: Scene): void {
  const ambientLight = new HemisphereLight(
    0xffffff,
    0x888888,
    2
  );

  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(
    0xffffff,
    3
  );

  directionalLight.position.set(4, 6, 4);

  scene.add(directionalLight);
}

/* ----------------------------------
   Model loading
---------------------------------- */

function createModelLoader(): LDrawLoader {
  const loader = new LDrawLoader();

  loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);

  return loader;
}

async function loadModel(
  loader: LDrawLoader,
  config: Required<LegoSceneConfig>
): Promise<Object3D> {
  const model = await loader.loadAsync(config.modelPath);

  centerAndScaleModel(model, config.modelScale);

  return model;
}

/* ----------------------------------
   Model transformations
---------------------------------- */

function centerAndScaleModel(
  model: Object3D,
  targetScale: number
): void {
  const box = new Box3().setFromObject(model);

  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());

  const scale = targetScale / Math.max(
    size.x,
    size.y,
    size.z
  );

  model.scale.setScalar(scale);

  model.position.set(
    -center.x * scale,
    -center.y * scale,
    -center.z * scale
  );
}

/* ----------------------------------
   Resource disposal
---------------------------------- */

function disposeObject(object: Object3D): void {
  object.traverse((child) => {
    const mesh = child as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };

    // Dispose geometry
    mesh.geometry?.dispose();

    // Dispose material(s)
    if (mesh.material) {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      for (const material of materials) {
        material.dispose();
      }
    }
  });
}

function disposeScene(scene: Scene): void {
  disposeObject(scene);
}
