<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { magneticText } from '../../actions/magneticText.ts';
  import { revealText } from '../../actions/revealText.ts';

  interface Props {
    name: string;
    titles: string;
  }

  const { name, titles }: Props = $props();
  let card: HTMLElement;

  onMount(() => {
    const ctx = gsap.context(() => {
      // Card tilt
      const maxTilt = 3;
      gsap.set(card, { transformPerspective: 1000, transformOrigin: 'center' });

      const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });

      const tilt = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const r = card.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        rotateX(-ny * maxTilt);
        rotateY(nx * maxTilt);
      };
      const untilt = () => {
        rotateX(0);
        rotateY(0);
      };

      card.addEventListener('pointermove', tilt);
      card.addEventListener('pointerleave', untilt);
      return () => {
        card.removeEventListener('pointermove', tilt);
        card.removeEventListener('pointerleave', untilt);
      };
    }, card);

    return () => ctx.revert();
  });
</script>

<hgroup
  bind:this={card}
  use:revealText
  use:magneticText
  class="grid p-5 gap-5 pb-8 max-w-2xl border border-ebony-400 rounded-xl bg-linear-to-br
    from-ebony-50 via-ebony-100 to-ebony-200 bg-size-[200%_200%] animate-ambient will-change-transform"
>
  <h1 class="text-6xl sm:text-8xl text-ebony-950 font-extrabold reveal-mask">
    <span class="reveal-text magnetic-text">{name}</span>
  </h1>

  <h3 class="text-xl sm:text-2xl text-ebony-900 reveal-mask">
    <span class="reveal-text magnetic-text">{titles}</span>
  </h3>
</hgroup>
