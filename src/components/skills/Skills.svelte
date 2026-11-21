<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { createLegoScene } from './scene/index.ts';

  interface Props {
    modelUrl: string;
  }

  const { modelUrl }: Props = $props();

  let section: HTMLElement;
  let container: HTMLDivElement;

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger);

    const scene = createLegoScene(modelUrl, container);
    scene.setProgress(0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => scene.setProgress(self.progress),
    });

    return () => {
      trigger.kill();
      scene.destroy();
    };
  });
</script>

<section bind:this={section} class="relative h-[300vh]">
  <div class="sticky top-0 h-dvh overflow-hidden">
    <!-- Background: the Lego scene -->
    <div class="absolute inset-0 z-0" bind:this={container}></div>

    <!-- Foreground: windows go here -->
    <div class="absolute inset-0 z-10 pointer-events-none"></div>
  </div>
</section>
