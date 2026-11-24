<script lang="ts">
  import Background from './Background.svelte';
  import Carousel from './Carousel.svelte';
  import WorkHeader from './WorkHeader.svelte';
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
  <div class="absolute inset-0 pointer-events-none flex flex-col justify-between items-center pt-20">
    <WorkHeader {work} {selected} />
    <div class="h-70 w-[min(500px,90dvw)] rounded-t-3xl glass"></div>
  </div>
</div>
