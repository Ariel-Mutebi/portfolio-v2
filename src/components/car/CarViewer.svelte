<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
  import { createStudioEnvironment, createTunnel } from './studio.ts';

  let { modelUrl }: { modelUrl: string } = $props();

  let container: HTMLDivElement;
  let status = $state<'loading' | 'ready' | 'error'>('loading');

  /** Frees the memory used by a model */
  function disposeModel(root: THREE.Object3D) {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();

      for (const material of [object.material].flat()) {
        for (const value of Object.values(material)) {
          if (!(value instanceof THREE.Texture)) continue;
          value.dispose();
          if (value.source.data instanceof ImageBitmap) value.source.data.close();
        }
        material.dispose();
      }
    });
  }

  /** Scales the model to 4 units long and centres it on the origin */
  function normaliseModel(model: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 4 / Math.max(size.x, size.y, size.z);

    model.scale.multiplyScalar(scale);
    model.position.sub(center).multiplyScalar(scale);
  }

  /** Turns plain, opaque surfaces silver-grey */
  function paintModel(model: THREE.Object3D) {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      for (const material of [object.material].flat()) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        if (material.map || material.transparent) continue;

        material.color.set(0xbfc3c6);
        material.metalness = 0.25;
        material.roughness = 0.4;
      }
    });
  }

  onMount(() => {
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (error) {
      console.error('WebGL is unavailable', error);
      status = 'error';
      return;
    }

    let disposed = false;
    let model: THREE.Object3D | undefined;
    let tunnel: ReturnType<typeof createTunnel> | undefined;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.domElement.classList.add('block');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(4, 2, 5);

    /** Gives the paint and metal studio lights to reflect */
    const environment = createStudioEnvironment(renderer);
    scene.environment = environment.texture;

    const render = () => renderer.render(scene, camera);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.update();
    controls.addEventListener('change', render);

    /** Lets vertical swipes scroll the page. Must come after OrbitControls */
    renderer.domElement.style.touchAction = 'pan-y';

    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth: width, clientHeight: height } = container;
      if (!width || !height) return;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      /** Zooms out on narrow screens so the car fits */
      camera.zoom = Math.min(1, camera.aspect / 1.4);
      camera.updateProjectionMatrix();
      render();
    });
    resizeObserver.observe(container);

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader
      .loadAsync(modelUrl)
      .then((gltf) => {
        if (disposed) return disposeModel(gltf.scene);

        model = gltf.scene;
        normaliseModel(model);
        paintModel(model);

        const floorY = new THREE.Box3().setFromObject(model).min.y;
        tunnel = createTunnel(floorY);

        scene.add(model, tunnel.group);
        render();
        status = 'ready';
      })
      .catch((error) => {
        console.error('Model failed to load', error);
        if (!disposed) status = 'error';
      });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      controls.dispose();
      if (model) disposeModel(model);
      tunnel?.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  });
</script>

<div class="relative h-dvh w-full">
  <div
    bind:this={container}
    class="h-full w-full cursor-grab overflow-hidden bg-[linear-gradient(to_bottom,#fff,#d5d9dc_55%,#fff)] active:cursor-grabbing"
    role="img"
    aria-label="3D model of a Porsche 992 GT3 R race car"
  ></div>

  <p
    class="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-sm"
    aria-live="polite"
  >
    {#if status === 'loading'}
      Loading model…
    {:else if status === 'error'}
      The 3D model couldn't be displayed.
    {:else}
      Drag to rotate
    {/if}
  </p>
</div>
