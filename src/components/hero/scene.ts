import {
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  RedFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  Color,
  UnsignedByteType,
  Vector4,
  DoubleSide,
  MathUtils,
} from 'three';
import type { TerrainMetadata } from './types.ts';
import vertexShader from './shaders/fullscreen.vert?raw';
import fragmentShader from './shaders/terrain.frag?raw';

const halfFloatLookup = Uint16Array.from({ length: 65536 }, (_, stored) =>
  DataUtils.toHalfFloat(stored / 65535),
);

async function loadHeightTexture(url: string, width: number, height: number) {
  const stored = new Uint16Array(await (await fetch(url)).arrayBuffer());
  const texture = new DataTexture(
    Uint16Array.from(stored, (value) => halfFloatLookup[value]),
    width,
    height,
    RedFormat,
    HalfFloatType,
  );
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
};

async function loadWaterTexture(url: string, width: number, height: number) {
  const mask = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const texture = new DataTexture(mask, width, height, RedFormat, UnsignedByteType);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
};

const readCssColor = (element: HTMLElement, name: string) => {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  if (!value) throw new Error(`CSS variable ${name} is not defined`);
  return new Color(value);
};

export async function createHeroScene(options: { canvas: HTMLCanvasElement; terrain: TerrainMetadata; heightmapUrl: string; watermaskUrl: string; }) {
  const { canvas, terrain, heightmapUrl, watermaskUrl } = options;
  const color = (name: string) => readCssColor(canvas, name);

  const [heightTexture, waterTexture] = await Promise.all([
    loadHeightTexture(heightmapUrl, terrain.width, terrain.height),
    loadWaterTexture(watermaskUrl, terrain.width, terrain.height),
  ]);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const uniforms = {
    uHeight: { value: heightTexture },
    uMinElevation: { value: terrain.minElevation },
    uMaxElevation: { value: terrain.maxElevation },
    uFieldColor: { value: color('--color-ebony-100') },
    uMinorColor: { value: color('--color-ebony-300') },
    uIndexColor: { value: color('--color-ebony-600') },
    uTexel: { value: new Vector2(1 / terrain.width, 1 / terrain.height) },
    uMetersPerPixel: { value: terrain.metersPerPixel },
    uExaggeration: { value: 1.5 },
    uReal: { value: 1.0 },
    uWater: { value: waterTexture },
    uWaterColor: { value: color('--color-steel-500') },
    uWaterMapColor: { value: color('--color-steel-900') },
    uLowColor: { value: color('--color-viridian-800') },
    uMidColor: { value: color('--color-viridian-500') },
    uRockColor: { value: color('--color-ebony-400') },
    uSnowColor: { value: color('--color-ebony-50') },
    uSunColor: { value: color('--color-pollen-100').multiplyScalar(0.9) },
    uAmbientColor: { value: color('--color-steel-700').multiplyScalar(0.4) },
    uSkyColor: { value: color('--color-steel-100') },
    uGridColor: { value: color('--color-ebony-200') },
    uBounds: { value: new Vector4(terrain.bounds.west, terrain.bounds.east, terrain.bounds.south, terrain.bounds.north) },
    uTime: { value: 0.0 },
  };

  // Scale up the plane significantly to prevent edges showing when angled
  const planeWidth = 4;
  const planeHeight = 4 * (terrain.height / terrain.width);
  const geometry = new PlaneGeometry(planeWidth, planeHeight, 512, 512);

  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: DoubleSide });
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));

  const fov = 45;
  const camera = new PerspectiveCamera(fov, 1, 0.1, 100);

  /**
   * Dynamically calculates camera position to ensure the plane always covers the screen.
   * @param progress 0.0 = angled 3D view, 1.0 = top-down map view
   */
  const updateCamera = (progress: number) => {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const tanHalfFov = Math.tan(fov * Math.PI / 360);

    // Progress goes from 0 (angled) to 1 (flat)
    const angleRad = MathUtils.lerp(MathUtils.degToRad(35), 0, progress);

    // Calculate required distance to cover screen vertically (foreshortened) and horizontally
    const dV = (planeHeight * Math.cos(angleRad)) / (2 * tanHalfFov);
    const dH = planeWidth / (2 * tanHalfFov * aspect);

    // Use the minimum distance to ensure coverage, *0.85 gives a bit of margin
    const dist = Math.min(dV, dH) * 0.85;

    camera.position.set(0, -dist * Math.sin(angleRad), dist * Math.cos(angleRad));
    camera.lookAt(0, 0, 0);
  };

  const observer = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = canvas;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();

    // Re-run camera calculation on resize
    updateCamera(1.0 - uniforms.uReal.value);
    renderer.render(scene, camera);
  });
  observer.observe(canvas);

  // Initial render setup
  updateCamera(0); // Start angled
  renderer.render(scene, camera);

  return {
    // Expose this so you can hook it up to a scroll event!
    setProgress: (progress: number) => {
      uniforms.uReal.value = 1.0 - progress;
      updateCamera(progress);
      renderer.render(scene, camera);
    },
    dispose: () => {
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      heightTexture.dispose();
      waterTexture.dispose();
      renderer.dispose();
    },
  };
};
