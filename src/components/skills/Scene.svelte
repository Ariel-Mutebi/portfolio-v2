<script lang="ts">
  import { onMount } from 'svelte';
  import { createLegoScene } from './scene/index.ts';

  interface Props {
    modelUrl: string;
  }

  const { modelUrl }: Props = $props();

  let container: HTMLDivElement;

  onMount(() => {
    const scene = createLegoScene(modelUrl, container);
    scene.setProgress(1);

    return () => {
      scene.destroy();
    };
  });
</script>

<div class="min-h-dvh" bind:this={container}></div>
