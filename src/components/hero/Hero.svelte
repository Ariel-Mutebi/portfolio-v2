<script lang="ts">
  import { onMount } from 'svelte';
  import Card from './Card.svelte';
  import type { TerrainMetadata } from './types.ts';

  interface Props {
    heightmapUrl: string;
    terrain: TerrainMetadata;
  }

  const { heightmapUrl, terrain }: Props = $props();
  
  let canvas: HTMLCanvasElement;

</script>

<header class="min-h-dvh grid grid-rows-2 justify-center items-start">
  <canvas bind:this={canvas} class="absolute inset-0 size-full"></canvas>
  <Card />
</header>
