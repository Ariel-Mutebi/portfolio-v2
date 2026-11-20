import type { LegoSceneConfig, LegoSceneInstance } from './types.ts';

import { getDefaultConfig } from './config.ts';

import { createScene } from './scene.ts';
import { createCamera } from './camera.ts';
import { createRenderer } from './renderer.ts';
import { createControls } from './controls.ts';

import { setupLighting } from './lighting.ts';
import { setupGroundGrid } from './grid.ts';

import { loadModel } from './model.ts';
import { disposeObject } from './disposal.ts';

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

  // Create Three.js components
  const scene = createScene(settings);
  const camera = createCamera(container, settings);
  const renderer = createRenderer(container);
  const controls = createControls(renderer, camera);

  // Setup scene
  setupLighting(scene);
  setupGroundGrid(scene, settings);

  container.appendChild(renderer.domElement);

  // Handle resizing
  const handleResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  };

  window.addEventListener('resize', handleResize);

  // Load LEGO model
  loadModel(settings)
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

      disposeObject(scene);

      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
