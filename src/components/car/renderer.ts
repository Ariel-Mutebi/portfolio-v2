import * as THREE from 'three';

/** Creates the renderer and adds its canvas to the container */
export function createRenderer(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.domElement.classList.add('block');
  container.appendChild(renderer.domElement);

  return renderer;
}
