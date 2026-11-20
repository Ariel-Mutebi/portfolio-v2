<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
  import { magneticText } from '../../actions/magneticText.ts';
  import { breathe } from '../../actions/breathe.ts';

  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

  interface Props {
    statement: string;
  }

  const { statement }: Props = $props();

  let textEl: HTMLElement;
  let scrambleEl: HTMLSpanElement;

  // true = show the final text (magnetic layer). Starts true so
  // reduced-motion users just see the text with no scramble.
  let done = $state(true);

  onMount(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      done = false;

      gsap.to(scrambleEl, {
        ease: 'none',
        duration: 20,

        scrollTrigger: {
          trigger: textEl,
          start: 'top bottom',
          end: 'top 20%',
          scrub: 2
        },

        scrambleText: {
          text: statement,
          chars: '01 ',
          speed: 0.4,
          revealDelay: 0.05
        },

        // Fires on every tick, including the scrub catch-up,
        // so this only flips once the tween itself reaches 1.
        onUpdate() {
          done = this.progress() === 1;
        }
      });

      return () => {
        done = true;
      };
    });

    return () => mm.revert();
  });
</script>

<section class="min-h-dvh p-10 pl-20">
  <div
    bind:this={textEl}
    use:magneticText={{
      selector: '.magnetic-text',
      radius: 120,
      strength: 0.35,
      maxDisplacement: 12,
      enabled: done
    }}
    use:breathe={{ enabled: done, minOpacity: 0.85 }}
    class="grid max-w-260 font-mono text-6xl font-extrabold leading-relaxed text-viridian-950"
  >
    <!-- Layer 1: owned by ScrambleText only -->
    <span
      bind:this={scrambleEl}
      aria-hidden="true"
      class="col-start-1 row-start-1"
      class:opacity-0={done}
    >
      {statement}
    </span>

    <!-- Layer 2: owned by SplitText only, real text for screen readers -->
    <span
      class="magnetic-text col-start-1 row-start-1"
      class:opacity-0={!done}
    >
      {statement}
    </span>
  </div>
</section>
