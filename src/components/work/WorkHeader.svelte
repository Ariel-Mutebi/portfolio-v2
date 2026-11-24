<script lang="ts">
  import gsap from 'gsap';
  import { revealText } from '../../actions/revealText.ts';
  import type { Work } from './types.ts';

  interface Props {
    work: Work[];
    selected: number;
  }

  const { work, selected }: Props = $props();

  // What's on screen. It lags `selected` while the exit animation runs.
  // svelte-ignore state_referenced_locally
  let shownIndex = $state(selected);
  const shown = $derived(work[shownIndex]);

  // Bumping this remounts the hgroup, which re-runs revealText as the enter animation.
  let version = $state(0);

  let root: HTMLElement;
  let exit: gsap.core.Tween | undefined;

  $effect(() => {
    if (selected === shownIndex) return;

    exit?.kill(); // rapid clicking: restart the exit from the current position
    const targets = gsap.utils.toArray<HTMLElement>('.reveal-text', root);

    exit = gsap.to(targets, {
      yPercent: -110, // mirrors the action's 110 so descenders fully clear the mask
      duration: 0.35,
      ease: 'power2.in',
      stagger: 0.05,
      overwrite: 'auto', // also cancels an enter animation still in progress
      onComplete: () => {
        shownIndex = selected; // read at completion, so the latest selection wins
        version++;
      }
    });
  });

  $effect(() => () => exit?.kill());
</script>

<div bind:this={root} class="w-[min(500px,90dvw)] text-left mix-blend-difference">
  {#key version}
    <hgroup use:revealText={{ duration: 0.8, stagger: 0.1 }}>
      <h4 class="reveal-mask text-4xl font-bold text-ebony-400">
        <span class="reveal-text block">{shown.time}</span>
      </h4>
      <h3 class="reveal-mask text-6xl font-bold text-ebony-50">
        <span class="reveal-text block">{shown.project}</span>
      </h3>
    </hgroup>
  {/key}
</div>
