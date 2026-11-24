<script lang="ts">
  import Background from './Background.svelte';
  import Carousel from './Carousel.svelte';
  import type { Work } from './types.ts';

  interface Props {
    work: Work[];
  }

  const { work }: Props = $props();
  // svelte-ignore state_referenced_locally
  let selected = $state(Math.floor((work.length - 1) / 2));
</script>

<div class="h-dvh relative">
  <Background />
  <Carousel items={work} bind:selected />
  <div class="absolute inset-0 pointer-events-none grid justify-center items-end">
    <div class="h-70 w-120 rounded-t-3xl glass"></div>
  </div>
</div>
