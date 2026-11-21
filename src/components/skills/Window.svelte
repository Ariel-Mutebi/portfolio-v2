<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { Draggable } from 'gsap/Draggable';

  interface Props {
    title: string;
    top: number;
    left: number;
    closed: boolean;
    onclose: () => void;
  }

  const { title, top, left, closed, onclose }: Props = $props();

  let root: HTMLDivElement;
  let win: HTMLDivElement;
  let handle: HTMLDivElement;

  export function setReveal(t: number) {
    const eased = 1 - (1 - t) ** 2;
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
  class={['pointer-events-auto absolute w-72', { hidden: closed }]}
  style:top="{top}px"
  style:left="{left}px"
>
  <!-- Inner: moved by Draggable -->
  <div bind:this={win} class="bg-ebony-50 text-black">
    <div bind:this={handle} class="flex cursor-grab items-center justify-between p-2">
      <span>{title}</span>
      <button type="button" onclick={onclose}>×</button>
    </div>
    <div class="p-2">Window content</div>
  </div>
</div>
