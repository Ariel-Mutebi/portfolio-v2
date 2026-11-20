<script lang="ts">
  import { onMount } from 'svelte';
  import { createLegoScene } from './legoScene.ts';

  let container: HTMLDivElement;

  onMount(() => {
    const scene = createLegoScene(container);

    return () => {
      scene.destroy();
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
