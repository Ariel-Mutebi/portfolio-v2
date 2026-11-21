<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { Draggable } from 'gsap/Draggable';
  import type { WindowState } from './types.ts';
  import fileIcon from '../../assets/file-icon.svg';
  import closeIcon from '../../assets/close-icon.svg';

  interface Props {
    state: WindowState;
    onclose: () => void;
  }
  
  const { state, onclose }: Props = $props();

  let root: HTMLDivElement;
  let win: HTMLElement;
  let handle: HTMLElement;
  const ease = gsap.parseEase('power2.out');

  export function setReveal(t: number) {
    const eased = ease(t);
    gsap.set(root, { autoAlpha: eased, y: (1 - eased) * 40 });
  }

  onMount(() => {
    gsap.registerPlugin(Draggable);

    const [draggable] = Draggable.create(win, {
      trigger: handle,
      bounds: root.parentElement,
      zIndexBoost: false,
      onPress() {
        gsap.set(root, { zIndex: ++Draggable.zIndex });
      },
    });

    return () => draggable.kill();
  });
</script>

<div
  bind:this={root}
  class={['window-root pointer-events-auto absolute', {
    hidden: state.closed,
    invisible: state.id !== 0,
  }]}
  style:--index={state.id}
>
  <article bind:this={win} class="window bg-ebony-50 border-4 border-ebony-200 rounded-lg font-mono">
    <header bind:this={handle} class="handle flex items-center justify-between py-2 px-3 border-b border-b-ebony-200">      <hgroup class="flex items-center gap-1">
        <img src={fileIcon.src} alt="file icon">
        <h4 class="text-sm text-ebony-500 font-bold">{state.filename}</h4>
      </hgroup>
      <button
        type="button"
        title="close"
        onclick={onclose}
        class="p-1 bg-ebony-200 text-ebony-900 hover:bg-chilli-200 active:bg-chilli-300"
      >
        <img src={closeIcon.src} alt="" />
      </button>
    </header>
    <div class="p-4 pb-8">
      <div class="grid gap-3 text-ebony-900">
        <h3 class="text-4xl font-bold">{state.title}</h3>
        <p class="font-sans">{state.description}</p>
      </div>
    </div>
  </article>
</div>

<style>
  .window-root {
    /* mobile defaults */
    --start-top: 1rem;
    --start-left: 0.75rem;
    --step: 2.5rem;
    --width: clamp(18rem, 90%, 37.5rem);

    --wanted-left: calc(var(--start-left) + var(--index) * var(--step));

    top: calc(var(--start-top) + var(--index) * var(--step));
    left: clamp(0px, var(--wanted-left), 100% - var(--width));
  }

  .window {
    width: var(--width);
  }

  .handle {
    cursor: default;
  }

  @media (min-width: 48rem) {
    .window-root {
      --start-top: 2.5rem;
      --start-left: 32rem;
      --step: 3rem;
    }

    .handle {
      cursor: grab;
    }
  }
</style>
