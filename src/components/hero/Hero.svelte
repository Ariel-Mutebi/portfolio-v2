<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
  import Card from './Card.svelte';
  import { createHeroScene } from './scene.ts';
  import type { TerrainMetadata } from './types.ts';
  import MapFrame from './MapFrame.svelte';
  import Caption from './Caption.svelte';

  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

  interface Props {
    heightmapUrl: string;
    watermaskUrl: string;
    normalmapUrl: string;
    shadowmapUrl: string;
    noisemapUrl: string;
    terrain: TerrainMetadata;
  }
  const props: Props = $props();

  const CAPTION = 'Ridgeline — Topographic Study No. 01';

  let heroContainer: HTMLElement;
  let stageEl: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  // svelte-ignore non_reactive_update
  let captionEl: HTMLElement;

  let isLoading = $state(true);
  let frameProgress = $state(0);

  onMount(() => {
    let cancelled = false;
    let tl: gsap.core.Timeline | undefined;
    let sceneDispose: (() => void) | undefined;

    createHeroScene({ canvas, ...props }).then((scene) => {
      if (cancelled) { scene.dispose(); return; }
      sceneDispose = scene.dispose;
      isLoading = false;

      const sceneProxy = { p: 0 };
      const frameProxy = { p: 0 };

      tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroContainer,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 3,
        },
      });

      // ── 1 · 3D → 2D (0 → 200vh)
      tl.to(sceneProxy, {
        p: 1,
        duration: 200,
        ease: 'none',
        onUpdate: () => scene.setProgress(sceneProxy.p),
      }, 0);

      // ── 2 · background + card shrink #1 (200 → 214vh)
      tl.to(stageEl, { scale: 0.90, duration: 14, ease: 'none' }, 200);

      // ── 3 · caption scrambles in (216 → 234vh)
      tl.to(captionEl, {
        scrambleText: {
          text: CAPTION,
          chars: 'upperCase',
          speed: 0.4,
          revealDelay: 0.05,
        },
        duration: 18,
        ease: 'none',
      }, 216);

      // ── 4 · background + card shrink #2 (236 → 250vh)
      tl.to(stageEl, { scale: 0.828, duration: 14, ease: 'none' }, 236);

      // ── 4b · frame draws in (240 → 250vh)
      tl.to(frameProxy, {
        p: 1,
        duration: 10,
        ease: 'none',
        onUpdate: () => { frameProgress = frameProxy.p; },
      }, 240);
    });

    return () => {
      cancelled = true;
      tl?.scrollTrigger?.kill();
      tl?.kill();
      sceneDispose?.();
    };
  });
</script>

<header bind:this={heroContainer} class="relative min-h-[250vh] bg-ebony-100">
  <div class="sticky top-0 h-dvh w-full overflow-hidden">
    
    <!-- Stage: everything inside here scales together -->
    <div
      bind:this={stageEl}
      class="absolute inset-0 origin-center will-change-transform"
    >
      <!-- Canvas (The Map) -->
      <canvas
        bind:this={canvas}
        class="absolute inset-0 z-0 size-full transition-opacity duration-1000"
        class:opacity-0={isLoading}
        class:opacity-100={!isLoading}
      ></canvas>

      <!-- Frame: -inset-[4%] creates the padding around the map -->
      <div class="pointer-events-none absolute inset-[-6%] z-10">
        <MapFrame progress={frameProgress} />
      </div>

      <!-- Caption: Pushed into the bottom 4% padding gap, inside the frame -->
      <div class="absolute inset-x-0 bottom-[-5%] z-20 flex justify-center">
        <Caption text={CAPTION} bind:el={captionEl} />
      </div>

      <!-- Card -->
      <div class="relative z-30 grid h-full w-full grid-rows-2 items-start justify-center p-5">
        <div
          class="pointer-events-auto relative row-start-2 flex w-full justify-center transition-opacity duration-1000"
          class:opacity-0={isLoading}
          class:opacity-100={!isLoading}
        >
          <Card />
        </div>
      </div>
    </div>
  </div>

  <!-- Loading overlay -->
  <div
    class="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-ebony-50 transition-opacity duration-1000"
    class:opacity-0={!isLoading}
  >
    <div class="mb-4 size-8 animate-spin rounded-full border-2 border-ebony-300 border-t-ebony-800"></div>
    <p class="animate-pulse font-medium text-ebony-500">Carving the mountains...</p>
  </div>
</header>
