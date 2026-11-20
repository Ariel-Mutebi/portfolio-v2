<script lang="ts">
  import { onMount } from 'svelte';
  import { Renderer, Program, Mesh, Triangle, Flowmap, Vec2 } from 'ogl';
  import vertex from './shaders/fullscreen.vert?raw';
  import fragment from './shaders/splash.frag?raw';
  import { oglColor } from '../../lib/colors.ts';

  let container: HTMLDivElement;

  onMount(() => {
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const renderer = new Renderer({ dpr, alpha: false });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    let aspect = 1;
    const mouse = new Vec2(-1);
    const velocity = new Vec2();
    const lastMouse = new Vec2();
    let lastTime = 0;
    let hasMoved = false;

    const flowmap = new Flowmap(gl, { falloff: 0.3, dissipation: 0.96 });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        tFlow: flowmap.uniform,
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uGrain: { value: 1.5 * dpr },
        uBase: { value: oglColor('--color-ebony-50') },
        uYellow: { value: oglColor('--color-pollen-200') },
        uBlue: { value: oglColor('--color-steel-300') }
      }
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let lastW = 0;
    let lastH = 0;

    function resize() {
      const { width, height } = container.getBoundingClientRect();
      const w = Math.round(width);
      const h = Math.round(height);
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;

      renderer.setSize(w, h);
      aspect = w / h;
      program.uniforms.uAspect.value = aspect;

      renderer.render({ scene: mesh }); // repaint before the browser paints
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function onPointerMove(e: PointerEvent) {
      const rect = container.getBoundingClientRect();
      mouse.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );

      const now = performance.now();
      if (!lastTime) {
        lastTime = now;
        lastMouse.set(e.clientX, e.clientY);
      }
      const dt = Math.max(10.4, now - lastTime);
      velocity.x = (e.clientX - lastMouse.x) / dt;
      velocity.y = (e.clientY - lastMouse.y) / dt;
      lastMouse.set(e.clientX, e.clientY);
      lastTime = now;
      hasMoved = true;
    }

    let raf = 0;
    function update(t: number) {
      raf = requestAnimationFrame(update);

      // No movement this frame: stop splatting, let the trail decay
      if (!hasMoved) {
        mouse.set(-1);
        velocity.set(0);
      }
      hasMoved = false;

      flowmap.aspect = aspect;
      flowmap.mouse.copy(mouse);
      flowmap.velocity.lerp(velocity, velocity.len() ? 0.15 : 0.1);
      flowmap.update();

      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }

    resize();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      renderer.render({ scene: mesh }); // static frame, no pointer, no loop
    } else {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      raf = requestAnimationFrame(update);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      gl.canvas.remove();
      ro.disconnect();
    };
  });
</script>

<div bind:this={container} class="pointer-events-none absolute inset-0"></div>
