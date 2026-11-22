import { Mesh, PlaneGeometry, Scene, WebGLRenderer } from 'three';
import type { TerrainMetadata } from './types.ts';
import { loadTerrainTextures, type TextureUrls } from './textures.ts';
import { createTerrainMaterial } from './material.ts';
import { createCameraRig } from './camera.ts';

interface SceneOptions extends TextureUrls {
  canvas: HTMLCanvasElement;
  terrain: TerrainMetadata;
}

export async function createHeroScene({ canvas, terrain, ...urls }: SceneOptions) {
  const textures = await loadTerrainTextures(urls, terrain);
  const { material, uniforms } = createTerrainMaterial(textures, terrain);

  const terrainAspect = terrain.height / terrain.width;
  const geometry = new PlaneGeometry(6, 6 * terrainAspect, 512, 512);
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(1);
  const rig = createCameraRig(canvas, terrainAspect);

  // The single place that draws.
  const draw = () => renderer.render(scene, rig.camera);

  // For scrolling: coalesces many setProgress calls into one draw per frame.
  let isRenderPending = false;
  const requestRender = () => {
    if (isRenderPending) return;
    isRenderPending = true;
    requestAnimationFrame(() => {
      isRenderPending = false;
      draw();
    });
  };

  // Resizing clears the canvas, so it redraws immediately, never "later".
  const resize = () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    rig.resize();
    rig.update(1 - uniforms.uReal.value);
    draw();
  };

  // First frame: compile shaders without blocking, draw, then let the browser paint it.
  await renderer.compileAsync(scene, rig.camera);
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  await new Promise(requestAnimationFrame);

  return {
    setProgress: (progress: number) => {
      uniforms.uReal.value = 1 - progress;
      rig.update(progress);
      requestRender();
    },
    dispose: () => {
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      Object.values(textures).forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}
