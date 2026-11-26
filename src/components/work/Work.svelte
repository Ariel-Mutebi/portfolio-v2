<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  let section = $state<HTMLDivElement>();

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section!,
        start: 'top top',
        end: '+=200%',
        pin: true
      });
    }, section!);

    return () => ctx.revert();
  });
</script>

<div bind:this={section} class="h-dvh relative">
  <Background />
  <Carousel items={work} bind:selected />
  <div class="absolute inset-0 pointer-events-none flex flex-col justify-between items-center pt-20">
    <Header {work} {selected} />
    <Description {work} {selected} />
  </div>
</div>
