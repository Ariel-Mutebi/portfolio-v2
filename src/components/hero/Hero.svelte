<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
  import { createHeroScene } from './scene.ts';
  import type { TerrainMetadata } from './types.ts';

  import Card from './Card.svelte';
  import Caption from './Caption.svelte';
  import MapFrame from './MapFrame.svelte';

  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

  interface Props {
    name: string;
    titles: string;
    caption: string;
    heightmapUrl: string;
    watermaskUrl: string;
    normalmapUrl: string;
    shadowmapUrl: string;
    noisemapUrl: string;
    terrain: TerrainMetadata;
  }

  const { name, titles, caption, ...sceneProps }: Props = $props();

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

    createHeroScene({ canvas, ...sceneProps }).then((scene) => {
      if (cancelled) {
        return scene.dispose();
      }

      sceneDispose = scene.dispose;
      isLoading = false;

      const sceneProxy = { p: 0 };
      const frameProxy = { p: 0 };

      tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroContainer,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2,
        },
      });

      // ── 1 · 3D → 2D (0 → 200vh)
      tl.to(sceneProxy, {
        p: 1,
        duration: 200,
        ease: 'none',
        onUpdate: () => scene.setProgress(sceneProxy.p),
      }, 0);

      // ── 2 · background + card shrink #1 (200 → 210vh)
      tl.to(stageEl, { scale: 0.90, duration: 10, ease: 'none' }, 200);

      // ── 3 · caption scrambles in (220 → 240vh)
      tl.to(captionEl, {
        scrambleText: {
          text: caption,
          chars: '01',
          speed: 0.4,
          revealDelay: 0.05,
        },
        duration: 20,
        ease: 'none',
      }, 220);

      // ── 4 · background + card shrink #2 (230 → 250vh)
      tl.to(stageEl, { scale: 0.80, duration: 20, ease: 'none' }, 230);

      // ── 4b · frame draws in (240 → 250vh)
      tl.to(frameProxy, {
        p: 1,
        duration: 10,
        ease: 'none',
        onUpdate: () => { frameProgress = frameProxy.p; },
      }, 240);

      // ── 5 · Final buffer (250 → 300vh)
      // Holds the fully completed composition.
      tl.to({}, {
        duration: 50,
        ease: 'none',
      });
    });

    return () => {
      cancelled = true;
      tl?.scrollTrigger?.kill();
      tl?.kill();
      sceneDispose?.();
    };
  });
</script>

<header bind:this={heroContainer} class="relative h-[300vh] bg-ebony-50">
  <div class="sticky top-0 h-dvh w-full overflow-hidden">
    
    <!-- Stage: everything inside here scales together -->
    <div
      bind:this={stageEl}
      class="absolute inset-0 origin-center will-change-transform"
    >
      <!-- Canvas (The Map) -->
      <canvas
        bind:this={canvas}
        class="absolute inset-0 size-full transition-opacity duration-1000"
        class:opacity-0={isLoading}
        class:opacity-100={!isLoading}
      ></canvas>

      <!-- Frame: negative inset creates the padding around the map -->
      <div class="pointer-events-none absolute inset-[-7%] z-10">
        <MapFrame progress={frameProgress} />
      </div>

      <!-- Caption: Pushed into the bottom 5% padding gap, inside the frame -->
      <div class="absolute inset-x-0 bottom-[-5%] z-20 flex justify-center">
        <Caption text={caption} bind:el={captionEl} />
      </div>

      <!-- Card -->
      <div
        class="absolute bottom-10 p-10 inset-x-0 flex justify-center transition-opacity duration-1000"
        class:opacity-0={isLoading}
        class:opacity-100={!isLoading}
      >
        <Card {name} {titles} />
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
