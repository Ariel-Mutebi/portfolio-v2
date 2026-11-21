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

<!-- Outer: positioned and revealed by scroll -->
<div
  bind:this={root}
  class={['pointer-events-auto absolute', {
    hidden: state.closed,
    invisible: state.id !== 0,
  }]}
  style:top="{state.top}px"
  style:left="{state.left}px"
>
  <!-- Inner: moved by Draggable -->
  <article bind:this={win} class="bg-ebony-50 w-150 border-4 border-ebony-200 rounded-lg font-mono">
    <header bind:this={handle} class="flex cursor-grab items-center justify-between py-2 px-3 border-b border-b-ebony-200">
      <hgroup class="flex items-center gap-1">
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
