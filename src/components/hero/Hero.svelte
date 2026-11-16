<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import Card from './Card.svelte';
  import { createHeroScene } from './scene.ts';
  import type { TerrainMetadata } from './types.ts';

  gsap.registerPlugin(ScrollTrigger);

  interface Props {
    heightmapUrl: string;
    watermaskUrl: string;
    terrain: TerrainMetadata;
  }

  const { heightmapUrl, terrain, watermaskUrl }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let isLoading = $state(true);
  let heroContainer: HTMLElement;
  let setProgress = (progress: number) => {};

  onMount(() => {
    let isCancelled = false;
    let cleanup = () => {};
    let scrollTrigger: ScrollTrigger | undefined;

    createHeroScene({ canvas, terrain, heightmapUrl, watermaskUrl }).then((scene) => {
      if (isCancelled) {
        scene.dispose();
      } else {
        cleanup = scene.dispose;
        setProgress = scene.setProgress;
        isLoading = false;

        scrollTrigger = ScrollTrigger.create({
          trigger: heroContainer,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.15,
          onUpdate: (self) => {
            setProgress(self.progress);
          }
        });
      }
    });

    return () => {
      isCancelled = true;
      scrollTrigger?.kill();
      cleanup();
    };
  });
</script>

<header bind:this={heroContainer}  class="relative min-h-[200vh] bg-ebony-50">
  <div class="sticky top-0 h-dvh w-full overflow-hidden">
    
    <!-- Canvas Background -->
    <canvas 
      bind:this={canvas} 
      class="absolute inset-0 size-full z-0 transition-opacity duration-1000"
      class:opacity-0={isLoading}
      class:opacity-100={!isLoading}
    ></canvas>

    <!-- Content Grid -->
    <div class="relative z-10 w-full h-full grid grid-rows-2 justify-center items-start pointer-events-none">
      <!-- Added transition classes to the Card wrapper here -->
      <div 
        class="row-start-2 relative w-full flex justify-center pointer-events-auto transition-opacity duration-1000"
        class:opacity-0={isLoading}
        class:opacity-100={!isLoading}
      >
        <Card />
      </div>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div 
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ebony-50 transition-opacity duration-1000 pointer-events-none"
    class:opacity-0={!isLoading}
  >
    <div class="size-8 border-2 border-ebony-300 border-t-ebony-800 rounded-full animate-spin mb-4"></div>
    <p class="text-ebony-500 font-medium animate-pulse">Carving the mountains...</p>
  </div>
</header>
