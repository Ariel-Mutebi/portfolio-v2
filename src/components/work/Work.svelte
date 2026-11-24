<script lang="ts">
  import Background from './Background.svelte';
  import Carousel from './Carousel.svelte';
  import Header from './Header.svelte';
  import Description from './Description.svelte';
  import type { Work } from './types.ts';

  interface Props {
    work: Work[];
  }

  const { work }: Props = $props();
  // svelte-ignore state_referenced_locally
  let selected = $state(Math.floor((work.length - 1) / 2));
</script>

<div class="min-h-175 h-dvh relative">
  <Background />
  <Carousel items={work} bind:selected />
  <div class="absolute inset-0 pointer-events-none flex flex-col justify-between items-center pt-20">
    <Header {work} {selected} />
    <Description {work} {selected} />
  </div>
</div>
