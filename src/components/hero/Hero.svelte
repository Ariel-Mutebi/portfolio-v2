<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import Card from './Card.svelte';
  import { createHeroScene } from './scene.ts';
  import type { TerrainMetadata } from './types.ts';

  // Register the plugin (do this once)
  gsap.registerPlugin(ScrollTrigger);

  interface Props {
    heightmapUrl: string;
    watermaskUrl: string;
    terrain: TerrainMetadata;
  }

  const { heightmapUrl, terrain, watermaskUrl }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let isLoading = $state(true);
  let heroContainer: HTMLElement; // Reference to the header

  // Start with a no-op function to avoid undefined checks
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

        // Setup GSAP ScrollTrigger AFTER the scene is ready
        scrollTrigger = ScrollTrigger.create({
          trigger: heroContainer,
          start: "top top", // Start when the top of the hero hits the top of the viewport
          end: "bottom bottom", // End when the bottom of the hero hits the bottom of the viewport
          scrub: 0.1, // Smoothly interpolate over 0.2 second (prevents jitter)
          onUpdate: (self) => {
            // Linearly from 0 - 1
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

<header 
  bind:this={heroContainer} 
  class="min-h-[200vh] relative bg-ebony-50" 
>
  <!-- Sticky container to keep canvas in view while scrolling -->
  <div class="sticky top-0 h-dvh w-full overflow-hidden">
    
    <!-- Loading State -->
    <div 
      class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-ebony-50 transition-opacity duration-1000"
      class:opacity-0={!isLoading}
      class:pointer-events-none={!isLoading}
    >
      <div class="size-8 border-2 border-ebony-300 border-t-ebony-800 rounded-full animate-spin mb-4"></div>
      <p class="text-ebony-500 font-medium animate-pulse">Carving the mountains...</p>
    </div>

    <!-- Canvas -->
    <canvas 
      bind:this={canvas} 
      class="absolute inset-0 size-full transition-opacity duration-1000"
      class:opacity-0={isLoading}
      class:opacity-100={!isLoading}
    ></canvas>
    
    <!-- <Card /> -->
  </div>
</header>
