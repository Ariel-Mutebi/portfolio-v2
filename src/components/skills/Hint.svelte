<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  // gap between the cursor and the circle's right edge, in px
  const offset = 32;

  let hint: HTMLDivElement;
  let visible = $state(false);
  let dragging = $state(false);

  onMount(() => {
    const area = hint.parentElement!;

    // Anchor the circle's right-middle point to the target position
    gsap.set(hint, { xPercent: -100, yPercent: -50 });
    const moveX = gsap.quickTo(hint, 'x', { duration: 0.35, ease: 'power3' });
    const moveY = gsap.quickTo(hint, 'y', { duration: 0.35, ease: 'power3' });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;

      if ((e.target as Element).closest('[data-no-hint]')) {
        visible = false;
        return;
      }

      const x = e.clientX - offset;
      if (!visible) gsap.set(hint, { x, y: e.clientY });
      visible = true;
      moveX(x);
      moveY(e.clientY);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if ((e.target as Element).closest('[data-no-hint]')) return;
      dragging = true;
    };

    const onLeave = () => (visible = false);
    const onUp = () => (dragging = false);

    area.addEventListener('pointermove', onMove);
    area.addEventListener('pointerdown', onDown);
    area.addEventListener('pointerleave', onLeave);
    // On window so releasing the button outside the section still ends the drag
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerdown', onDown);
      area.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  });
</script>

<div bind:this={hint} class="hint" class:visible={visible && !dragging} aria-hidden="true">
  <svg viewBox="0 0 24 24" class="arrow" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M15 5l-7 7 7 7" />
  </svg>
  <span>Drag</span>
  <svg viewBox="0 0 24 24" class="arrow" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M9 5l7 7-7 7" />
  </svg>
</div>

<style>
  .hint {
    --size: 5rem;

    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.125rem;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    font: 600 0.75rem var(--font-mono, monospace);
    color: var(--color-viridian-950);
    background: color-mix(in srgb, var(--color-viridian-200) 85%, transparent);
    border: 1px solid var(--color-viridian-400);
    backdrop-filter: blur(4px);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .hint.visible {
    opacity: 1;
  }

  .arrow {
    width: 0.875rem;
    height: 0.875rem;
  }

  /* Touch devices have no cursor to follow */
  @media (hover: none) {
    .hint {
      display: none;
    }
  }
</style>
