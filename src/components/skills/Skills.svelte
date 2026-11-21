<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { createLegoScene } from './scene/index.ts';
  import Windows from './Windows.svelte';
  import type { File } from './types.ts';

  interface Props {
    legoUrl: string;
    files: File[];
  }

  const { legoUrl, files }: Props = $props();

  let section: HTMLElement;
  let container: HTMLDivElement;
  let windows: Windows;

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger);

    const scene = createLegoScene(legoUrl, container);
    scene.setProgress(0);
    windows.setProgress(0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scene.setProgress(self.progress);
        windows.setProgress(self.progress);
      },
    });

    return () => {
      trigger.kill();
      scene.destroy();
    };
  });
</script>

<section bind:this={section} class="relative h-[300vh]">
  <div class="sticky top-0 h-dvh overflow-hidden">
    <div class="absolute inset-0 z-0" bind:this={container}></div>

    <div class="absolute inset-0 z-10 pointer-events-none">
      <Windows {files} bind:this={windows} />
    </div>
  </div>
</section>
