<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    text: string;
    el?: HTMLElement;
  }
  let { text, el = $bindable() }: Props = $props();

  let viewport: HTMLElement;
  let measure: HTMLElement;
  let overflowing = $state(false);
  let paused = $state(false);

  onMount(() => {
    const check = () => {
      overflowing = measure.offsetWidth > viewport.clientWidth;
    };
    const ro = new ResizeObserver(check);
    ro.observe(viewport);
    ro.observe(measure); // re-check when the font finishes loading
    check();
    return () => ro.disconnect();
  });
</script>

<div
  bind:this={el}
  class="w-[min(100%,60rem)] opacity-0 font-mono text-xs uppercase tracking-[0.18em] text-ebony-700 sm:text-sm"
>
  <div bind:this={viewport} class="relative overflow-hidden touch-pan-y">
    <!-- invisible twin: measures the natural width of the string -->
    <span
      bind:this={measure}
      class="invisible absolute left-0 top-0 whitespace-nowrap"
      aria-hidden="true"
    >{text}</span>

    {#if overflowing}
      <div
        class="marquee"
        style:animation-duration="{text.length * 0.3}s"
        style:animation-play-state={paused ? 'paused' : 'running'}
        onpointerdown={() => (paused = true)}
        onpointerup={() => (paused = false)}
        onpointercancel={() => (paused = false)}
        onpointerleave={() => (paused = false)}
        role="marquee"
        aria-label={text}
      >
        <span class="pr-12 whitespace-nowrap">{text}</span>
        <span class="pr-12 whitespace-nowrap" aria-hidden="true">{text}</span>
      </div>
    {:else}
      <span class="block whitespace-nowrap text-center">{text}</span>
    {/if}
  </div>
</div>

<style>
  .marquee {
    display: flex;
    width: max-content;
    animation: marquee linear infinite;
  }
  @keyframes marquee {
    to { transform: translateX(-50%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .marquee { animation: none; }
  }
</style>
