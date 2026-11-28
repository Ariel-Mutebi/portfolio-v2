import * as THREE from 'three';

/** Builds the reflections: a grey room with long light panels */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x55595d);

  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  material.color.setScalar(4);

  function addPanel(x: number, y: number, z: number, width: number, height: number) {
    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(x, y, z);
    panel.scale.set(width, height, 1);
    panel.lookAt(0, 0, 0);
    room.add(panel);
  }

  addPanel(0, 5, 0, 1.2, 8);
  addPanel(-5, 2, 0, 8, 0.6);
  addPanel(5, 2, 0, 8, 0.6);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(room, 0.04);

  pmrem.dispose();
  geometry.dispose();
  material.dispose();

  return target;
}
