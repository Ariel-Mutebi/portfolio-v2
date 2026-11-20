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

<div class="min-h-dvh" bind:this={container}></div>
