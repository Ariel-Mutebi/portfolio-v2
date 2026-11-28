import * as THREE from 'three';
import floorVertexShader from './shaders/floor.vert?raw';
import floorFragmentShader from './shaders/floor.frag?raw';

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

/** Builds the visible set: floor grid, soft shadow and tunnel outlines */
export function createTunnel(floorY: number) {
  const group = new THREE.Group();

  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: floorVertexShader,
    fragmentShader: floorFragmentShader,
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY - 0.01;
  group.add(floor);

  /** An eight-sided outline, 3.2 wide and 2 high */
  const outline = [
    [-1.2, 0], [1.2, 0], [1.6, 0.4], [1.6, 1.6],
    [1.2, 2], [-1.2, 2], [-1.6, 1.6], [-1.6, 0.4],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0));

  const frameGeometry = new THREE.BufferGeometry().setFromPoints(outline);
  const frameMaterial = new THREE.LineBasicMaterial({
    color: 0x62686d,
    transparent: true,
    opacity: 0.45,
  });

  for (const z of [-3, 3]) {
    const frame = new THREE.LineLoop(frameGeometry, frameMaterial);
    frame.position.set(0, floorY, z);
    group.add(frame);
  }

  function dispose() {
    floorGeometry.dispose();
    floorMaterial.dispose();
    frameGeometry.dispose();
    frameMaterial.dispose();
  }

  return { group, dispose };
}
