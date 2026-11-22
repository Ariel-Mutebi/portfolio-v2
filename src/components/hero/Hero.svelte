<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { createHeroScene } from './scene/index.ts';
  import type { TerrainMetadata } from './scene/types.ts';

  import Card from './Card.svelte';
  import Caption from './Caption.svelte';
  import MapFrame from './MapFrame.svelte';

  gsap.registerPlugin(ScrollTrigger);

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

      const sceneProxy = { p: 0 };
      const frameProxy = { p: 0 };

      tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroContainer,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2,
          onLeave: (self) => self.animation?.progress(1),
          onLeaveBack: (self) => self.animation?.progress(0),
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

      // ── 3 · caption fades in (220 → 240vh)
      tl.fromTo(captionEl,
        { opacity: 0 },
        { opacity: 1, duration: 20, ease: 'none' },
        220
      );

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

      // remove the loader once the scene and timeline are set up
      heroContainer.removeAttribute('data-await-ready');
      window.dispatchEvent(new Event('page-ready'));
    });

    return () => {
      cancelled = true;
      tl?.scrollTrigger?.kill();
      tl?.kill();
      sceneDispose?.();
    };
  });
</script>

<header bind:this={heroContainer} data-await-ready class="relative h-[300vh] bg-ebony-50">
  <div class="sticky top-0 h-dvh w-full overflow-hidden">
    
    <!-- Stage: everything inside here scales together -->
    <div
      bind:this={stageEl}
      class="absolute inset-0 origin-center will-change-transform"
    >
      <!-- Canvas (The Map) -->
      <canvas bind:this={canvas} class="absolute inset-0 size-full"></canvas>

      <!-- Frame: negative inset creates the padding around the map -->
      <div class="pointer-events-none absolute inset-[-7%] z-10">
        <MapFrame progress={frameProgress} />
      </div>

      <!-- Caption: Pushed into the bottom 5% padding gap, inside the frame -->
      <div class="absolute inset-x-0 bottom-[-5%] z-20 flex justify-center">
        <Caption text={caption} bind:el={captionEl} />
      </div>

      <!-- Card -->
      <div class="absolute bottom-10 p-10 inset-x-0 flex justify-center">
        <Card {name} {titles} />
      </div>
    </div>
  </div>
</header>
