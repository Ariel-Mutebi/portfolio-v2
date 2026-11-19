<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
  import { magneticText } from '../../actions/magneticText.ts';

  gsap.registerPlugin(
    ScrollTrigger,
    ScrambleTextPlugin
  );

  interface Props {
    statement: string;
  }

  const { statement }: Props = $props();

  let textEl: HTMLElement;
  let scrambleEl: HTMLSpanElement;

  let magneticEnabled = $state(false);

  onMount(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      magneticEnabled = false;

      gsap.to(scrambleEl, {
        ease: 'none',
        duration: 20,

        scrollTrigger: {
          trigger: textEl,
          start: 'top bottom',
          end: 'top 20%',
          scrub: 2,

          onLeave: () => {
            magneticEnabled = true;
          },

          onEnterBack: () => {
            magneticEnabled = false;
          }
        },

        scrambleText: {
          text: statement,
          chars: '01 ',
          speed: 0.4,
          revealDelay: 0.05
        }
      });
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
      enabled: magneticEnabled
    }}
    class="max-w-260 font-mono text-6xl font-extrabold leading-relaxed text-viridian-950"
  >
    <span bind:this={scrambleEl} class="magnetic-text">
      {statement}
    </span>
  </div>
</section>
