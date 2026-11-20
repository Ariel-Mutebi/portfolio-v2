import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  Box3,
  Vector3,
  SRGBColorSpace,
  GridHelper,
} from 'three';
import type { Object3D, Material, BufferGeometry } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import type { LegoSceneConfig, LegoSceneInstance } from './types.ts';
import { threeColor } from '../../lib/colors.ts';

function getDefaultConfig(): Required<LegoSceneConfig> {
  return {
    backgroundColor: threeColor('--color-ebony-100'),
    gridColor: threeColor('--color-ebony-300'),
    gridCenterColor: threeColor('--color-ebony-400'),
    modelPath: '/assets/3031.mpd',
    modelScale: 1.2,
    cameraPosition: {
      x: 3,
      y: 2,
      z: 3
    }
  };
}

export function createLegoScene(
  container: HTMLElement,
  config: LegoSceneConfig = {}
): LegoSceneInstance {
  const settings = {
    ...getDefaultConfig(),
    ...config
  };

  let destroyed = false;
  let animationFrameId: number | null = null;

  const scene = createScene(settings);
  const camera = createCamera(container, settings);
  const renderer = createRenderer(container);
  const controls = createControls(renderer, camera);

  setupLighting(scene);
  setupGroundGrid(scene, settings);

  const loader = createModelLoader();
  container.appendChild(renderer.domElement);

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

    controls.update();

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

      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}

function createScene(config: Required<LegoSceneConfig>): Scene {
  const scene = new Scene();
  scene.background = config.backgroundColor;
  return scene;
}

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

function createControls(renderer: WebGLRenderer, camera: PerspectiveCamera) {
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Restrict vertical rotation
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI / 2.1;

  // Disable zoom (scroll to zoom was trapping user)
  controls.enableZoom = false;

  // Keep the camera focused on the model
  controls.target.set(0, 0, 0);

  controls.update();
  return controls;
}

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

function setupGroundGrid(scene: Scene, config: Required<LegoSceneConfig>): void {
  const grid = new GridHelper(10, 40, config.gridCenterColor, config.gridColor);

  grid.position.y = -0.65;

  const material = grid.material as Material;

  material.transparent = true;
  material.opacity = 0.35;

  scene.add(grid);
}

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
