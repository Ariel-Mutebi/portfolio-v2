<script lang="ts">
  import { onMount } from 'svelte';

  import {
    Scene,
    Color,
    PerspectiveCamera,
    WebGLRenderer,
    HemisphereLight,
    DirectionalLight,
    Box3,
    Vector3,
    SRGBColorSpace
  } from 'three';

  import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
  import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';

  let container: HTMLDivElement;

  onMount(() => {
    // Scene
    const scene = new Scene();
    scene.background = new Color('#e9e9e9');

    // Camera
    const camera = new PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0, 0);

    // Renderer
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

    container.appendChild(renderer.domElement);

    // Lighting
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

    // Load LEGO brick
    const loader = new LDrawLoader();
    loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
    let destroyed = false;

    async function loadBrick() {
      const brick = await loader.loadAsync('/assets/3031.mpd');

      if (destroyed) return;

      // Get brick dimensions
      const box = new Box3().setFromObject(brick);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());

      // Scale brick
      const scale = 1.2 / Math.max(
        size.x,
        size.y,
        size.z
      );

      brick.scale.setScalar(scale);

      // Center brick
      brick.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale
      );

      scene.add(brick);
    }

    loadBrick().catch((error) => {
      console.error('LEGO loading error:', error);
    });

    // Resize
    function handleResize() {
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);

    // Render loop
    let animationFrameId: number;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      renderer.render(scene, camera);
    }

    animate();

    // Cleanup
    return () => {
      destroyed = true;

      window.removeEventListener('resize', handleResize);

      cancelAnimationFrame(animationFrameId);

      scene.traverse((object) => {
        if ('geometry' in object && object.geometry) {
          object.geometry.dispose();
        }

        if ('material' in object && object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => material.dispose());
        }
      });

      renderer.dispose();
      renderer.domElement.remove();
    };
  });
</script>

<div class="lego-scene" bind:this={container}></div>

<style>
  .lego-scene {
    width: 100%;
    height: 600px;
    overflow: hidden;
  }

  .lego-scene :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
