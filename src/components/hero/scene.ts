import {
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  RedFormat,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  UnsignedByteType,
  DoubleSide,
  MathUtils,
  RepeatWrapping,
} from 'three';
import type { TerrainMetadata } from './types.ts';
import vertexShader from './shaders/fullscreen.vert?raw';
import fragmentShader from './shaders/terrain.frag?raw';
import { threeColor } from '../../lib/colors.ts';

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
}

async function loadWaterTexture(url: string, width: number, height: number) {
  const mask = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const texture = new DataTexture(mask, width, height, RedFormat, UnsignedByteType);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

async function loadNormalTexture(url: string, width: number, height: number) {
  const data = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const texture = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

async function loadShadowTexture(url: string, width: number, height: number) {
  const data = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const texture = new DataTexture(data, width, height, RedFormat, UnsignedByteType);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

async function loadNoiseTexture(url: string) {
  const data = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const size = Math.sqrt(data.length / 4);
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

interface SceneOptions {
  canvas: HTMLCanvasElement;
  terrain: TerrainMetadata;
  heightmapUrl: string;
  watermaskUrl: string;
  normalmapUrl: string;
  shadowmapUrl: string;
  noisemapUrl: string;
}

export async function createHeroScene(options: SceneOptions) {
  const { canvas, terrain, heightmapUrl, watermaskUrl, normalmapUrl, shadowmapUrl, noisemapUrl } = options;

  const [heightTexture, waterTexture, normalTexture, shadowTexture, noiseTexture] = await Promise.all([
    loadHeightTexture(heightmapUrl, terrain.width, terrain.height),
    loadWaterTexture(watermaskUrl, terrain.width, terrain.height),
    loadNormalTexture(normalmapUrl, terrain.width, terrain.height),
    loadShadowTexture(shadowmapUrl, terrain.width, terrain.height),
    loadNoiseTexture(noisemapUrl),
  ]);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(1);

  const uniforms = {
    uHeight: { value: heightTexture },
    uNormalMap: { value: normalTexture },
    uShadowMap: { value: shadowTexture },
    uNoise: { value: noiseTexture },
    uMinElevation: { value: terrain.minElevation },
    uMaxElevation: { value: terrain.maxElevation },
    uFieldColor: { value: threeColor('--color-pollen-50') },
    uMinorColor: { value: threeColor('--color-ebony-600') },
    uIndexColor: { value: threeColor('--color-ebony-950') },
    uWaterMapColor: { value: threeColor('--color-steel-400') },
    uTexel: { value: new Vector2(1 / terrain.width, 1 / terrain.height) },
    uMetersPerPixel: { value: terrain.metersPerPixel },
    uExaggeration: { value: 2.0 },
    uReal: { value: 1.0 },
    uWater: { value: waterTexture },
    uWaterColor: { value: threeColor('--color-steel-950') },
    uLowColor: { value: threeColor('--color-viridian-800') },
    uMidColor: { value: threeColor('--color-viridian-500') },
    uRockColor: { value: threeColor('--color-ebony-400') },
    uSnowColor: { value: threeColor('--color-ebony-50') },
    uSunColor: { value: threeColor('--color-pollen-100').multiplyScalar(0.9) },
    uAmbientColor: { value: threeColor('--color-steel-700').multiplyScalar(0.4) },
    uSkyColor: { value: threeColor('--color-steel-100') },
  };

  const planeWidth = 6;
  const planeHeight = 6 * (terrain.height / terrain.width);
  const geometry = new PlaneGeometry(planeWidth, planeHeight, 512, 512);

  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: DoubleSide });
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));

  const fov = 45;
  const camera = new PerspectiveCamera(fov, 1, 0.1, 200);

  const focusWidth = 4;
  const focusHeight = 4 * (terrain.height / terrain.width);

  const updateCamera = (progress: number) => {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const tanHalfFov = Math.tan(fov * Math.PI / 360);

    const angleRad = MathUtils.lerp(MathUtils.degToRad(35), 0, progress);
    const projectedHeight = focusHeight * Math.cos(angleRad);

    const distH = (focusWidth * 0.5) / (tanHalfFov * aspect);
    const distV = (projectedHeight * 0.5) / tanHalfFov;
    const dist = Math.min(distH, distV);

    camera.position.set(0, -dist * Math.sin(angleRad), dist * Math.cos(angleRad));
    camera.lookAt(0, 0, 0);
  };

  let isRenderPending = false;
  const requestRender = () => {
    if (!isRenderPending) {
      isRenderPending = true;
      requestAnimationFrame(() => {
        renderer.render(scene, camera);
        isRenderPending = false;
      });
    }
  };

  const observer = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = canvas;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    updateCamera(1.0 - uniforms.uReal.value);
    requestRender();
  });
  observer.observe(canvas);

  updateCamera(0);
  requestRender();

  return {
    setProgress: (progress: number) => {
      uniforms.uReal.value = 1.0 - progress;
      updateCamera(progress);
      requestRender();
    },
    dispose: () => {
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      heightTexture.dispose();
      waterTexture.dispose();
      normalTexture.dispose();
      shadowTexture.dispose();
      renderer.dispose();
    },
  };
}
