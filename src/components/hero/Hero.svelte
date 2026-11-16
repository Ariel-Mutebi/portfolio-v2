<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Card from './Card.svelte';
  import { createHeroScene } from './scene.ts';
  import type { TerrainMetadata } from './types.ts';

  interface Props {
    heightmapUrl: string;
    watermaskUrl: string;
    terrain: TerrainMetadata;
  }

  const { heightmapUrl, terrain, watermaskUrl }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let isLoading = $state(true);

  onMount(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;

    createHeroScene({ canvas, terrain, heightmapUrl, watermaskUrl }).then((scene) => {
      if (cancelled) {
        scene.dispose();
      } else {
        dispose = scene.dispose;
        isLoading = false; // Fade in the canvas when ready
      }
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  });
</script>

<header class="min-h-dvh grid grid-rows-2 justify-center items-start relative overflow-hidden bg-ebony-50">
  <!-- Loading State -->
  {#if isLoading}
    <div 
      class="absolute inset-0 flex flex-col items-center justify-center z-10"
      out:fade={{ duration: 800 }}
    >
      <div class="size-8 border-2 border-ebony-300 border-t-ebony-800 rounded-full animate-spin mb-4"></div>
      <p class="text-ebony-500 font-medium animate-pulse">Carving the mountains...</p>
    </div>
  {/if}

  <!-- Canvas (fades in when loaded) -->
  <canvas 
    bind:this={canvas} 
    class="absolute inset-0 size-full transition-opacity duration-1000"
    class:opacity-0={isLoading}
    class:opacity-100={!isLoading}
  ></canvas>
  
  <!-- <Card /> -->
</header>
