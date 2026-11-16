<script lang="ts">
  import { onMount } from 'svelte';
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
  onMount(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;

    createHeroScene({ canvas, terrain, heightmapUrl, watermaskUrl }).then((scene) => {
      if (cancelled) scene.dispose();
      else dispose = scene.dispose;
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  });
</script>

<header class="min-h-dvh grid grid-rows-2 justify-center items-start">
  <canvas bind:this={canvas} class="absolute inset-0 size-full"></canvas>
  <!-- <Card /> -->
</header>
