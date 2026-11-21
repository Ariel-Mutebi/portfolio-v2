<script lang="ts">
  import { gsap } from 'gsap';
  import Window from './Window.svelte';

  const windows = $state([
    { id: 'frontend', title: 'Front-end', top: 40, left: 40, closed: false },
    { id: 'backend', title: 'Back-end', top: 100, left: 100, closed: false },
    { id: 'data', title: 'Data', top: 160, left: 160, closed: false },
    { id: 'devops', title: 'DevOps', top: 220, left: 220, closed: false },
  ]);

  let refs: ReturnType<typeof Window>[] = [];
  const closedCount = $derived(windows.filter((w) => w.closed).length);

  export function setProgress(p: number) {
    refs.forEach((w, i) => {
      if (i === 0) return; // first window is always visible
      const start = i / windows.length;
      w.setReveal(gsap.utils.clamp(0, 1, (p - start) / 0.1));
    });
  }
</script>

{#each windows as w, i (w.id)}
  <Window
    bind:this={refs[i]}
    title={w.title}
    top={w.top}
    left={w.left}
    closed={w.closed}
    onclose={() => (w.closed = true)}
  />
{/each}

{#if closedCount > 0}
  <button
    type="button"
    class="pointer-events-auto absolute bottom-4 right-4 bg-white px-3 py-1 text-black"
    onclick={() => windows.forEach((w) => (w.closed = false))}
  >
    Restore ({closedCount})
  </button>
{/if}
