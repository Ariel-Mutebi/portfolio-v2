<script lang="ts">
  import { gsap } from 'gsap';
  import Window from './Window.svelte';
  import type { File, WindowState } from './types.ts';

  interface Props {
    files: File[];
  }

  const { files }: Props = $props();
  const initialTop = 40;
  const initialLeft = 500;
  const distance = 60;

  // svelte-ignore state_referenced_locally
  const windows = $state<WindowState[]>(files.map((file, index) => ({
    ...file,
    id: index,
    closed: false,
    top: initialTop + index * distance,
    left: initialLeft + index * distance,
  })));

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
    state={w}
    onclose={() => (w.closed = true)}
  />
{/each}

{#if closedCount > 0}
  <button
    data-no-hint
    type="button"
    class="pointer-events-auto absolute bottom-6 right-6 px-3 py-1 font-mono
      bg-viridian-200 text-viridian-950 border border-viridian-400
      hover:bg-viridian-300 active:text-viridian-200 active:bg-viridian-950"
    onclick={() => windows.forEach((w) => (w.closed = false))}
  >
    Restore ({closedCount})
  </button>
{/if}
