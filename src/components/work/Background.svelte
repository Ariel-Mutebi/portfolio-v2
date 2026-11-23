<script>
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  let textTrack;

  onMount(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    if (prefersReducedMotion.matches) return;

    const tween = gsap.to(textTrack, {
      yPercent: -50,
      duration: 60,
      ease: 'none',
      repeat: -1
    });

    return () => tween.kill();
  });
</script>

<div class="absolute inset-0 overflow-hidden pointer-events-none">
  <div bind:this={textTrack} class="will-change-transform">
    {#each Array(20) as _, i}
      <div class="flex h-[16dvw] items-center overflow-hidden">
        <span class="whitespace-nowrap text-[17dvw] font-bold uppercase leading-none text-ebony-200">
          Past Work
        </span>
      </div>
    {/each}
  </div>
</div>
