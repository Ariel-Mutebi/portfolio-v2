import {
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RedFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  Color,
  UnsignedByteType,
} from 'three';
import type { TerrainMetadata } from './types.ts';
import vertexShader from './shaders/fullscreen.vert?raw';
import fragmentShader from './shaders/terrain.frag?raw';

/**
 * Maps every possible stored value (0 to 65535) to its half-float bit pattern.
 * Built once when the module loads.
 */
const halfFloatLookup = Uint16Array.from({ length: 65536 }, (_, stored) =>
  DataUtils.toHalfFloat(stored / 65535),
);

/**
 * Downloads the baked heightmap and uploads it to the GPU as a single-channel texture.
 * Linear filtering blends neighboring pixels, so heights stay smooth when stretched.
 */
async function loadHeightTexture(url: string, width: number, height: number) {
  const stored = new Uint16Array(await (await fetch(url)).arrayBuffer());
  if (stored.length !== width * height) {
    throw new Error(`Heightmap has ${stored.length} values, expected ${width * height}`);
  }
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

/** How much of the map (as a 0 to 1 fraction of each axis) fits on screen. */
const computeCover = (viewAspect: number, mapAspect: number): [number, number] =>
  viewAspect > mapAspect ? [1, mapAspect / viewAspect] : [viewAspect / mapAspect, 1];

interface SceneOptions {
  canvas: HTMLCanvasElement;
  terrain: TerrainMetadata;
  heightmapUrl: string;
  watermaskUrl: string;
};

/** Reads a color from a CSS variable on an element and converts it for three.js. */
const readCssColor = (element: HTMLElement, name: string) => {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  if (!value) throw new Error(`CSS variable ${name} is not defined`);
  return new Color(value);
};

/**
 * Sets up the hero's WebGL scene on the given canvas and returns a handle to tear it down.
 */
export async function createHeroScene(options: SceneOptions) {
  const { canvas, terrain, heightmapUrl, watermaskUrl } = options;
  const color = (name: string) => readCssColor(canvas, name);

  const [heightTexture, waterTexture] = await Promise.all([
    loadHeightTexture(heightmapUrl, terrain.width, terrain.height),
    loadWaterTexture(watermaskUrl, terrain.width, terrain.height),
  ]);
  
  const renderer = new WebGLRenderer({ canvas });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const uniforms = {
    uHeight: { value: heightTexture },
    uCover: { value: new Vector2(1, 1) },
    uMinElevation: { value: terrain.minElevation },
    uMaxElevation: { value: terrain.maxElevation },
    uFieldColor: { value: color('--color-ebony-100') },
    uMinorColor: { value: color('--color-ebony-300') },
    uIndexColor: { value: color('--color-ebony-600') },
    uTexel: { value: new Vector2(1 / terrain.width, 1 / terrain.height) },
    uMetersPerPixel: { value: terrain.metersPerPixel },
    uExaggeration: { value: 2.0 },
    uReal: { value: 1 },
    uWater: { value: waterTexture },
    uWaterColor: { value: color('--color-steel-500') },
    uWaterMapColor: { value: color('--color-steel-900') },
    uLowColor: { value: color('--color-viridian-800') },
    uMidColor: { value: color('--color-viridian-500') },
    uRockColor: { value: color('--color-ebony-400') },
    uSnowColor: { value: color('--color-ebony-50') },
    uSunColor: { value: color('--color-pollen-100').multiplyScalar(0.9) },
    uAmbientColor: { value: color('--color-steel-700').multiplyScalar(0.4) },
  };

  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const render = () => renderer.render(scene, camera);

  /**
   * Passing false to setSize stops three from overwriting the canvas CSS size,
   * which Tailwind already controls. Observing the canvas also fires once at the start.
   */
  const observer = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = canvas;
    renderer.setSize(clientWidth, clientHeight, false);
    uniforms.uCover.value.set(
      ...computeCover(clientWidth / clientHeight, terrain.width / terrain.height),
    );
    render();
  });
  observer.observe(canvas);

  return {
    dispose: () => {
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      heightTexture.dispose();
      renderer.dispose();
      waterTexture.dispose();
    },
  };
};
