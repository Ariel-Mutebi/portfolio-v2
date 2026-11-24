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

    gsap.set(hint, { xPercent: -100, yPercent: -50 });
    const moveX = gsap.quickTo(hint, 'x', { duration: 0.35, ease: 'power3' });
    const moveY = gsap.quickTo(hint, 'y', { duration: 0.35, ease: 'power3' });

    let lastX = 0;
    let lastY = 0;
    let isMouse = false;

    // True when the 3D background (not a window, not outside the section) is under the point
    function isOverBackground(x: number, y: number) {
      const el = document.elementFromPoint(x, y);
      return !!el && area.contains(el) && !el.closest('[data-no-hint]');
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      isMouse = true;
      lastX = e.clientX;
      lastY = e.clientY;

      if (!isOverBackground(lastX, lastY)) {
        visible = false;
        return;
      }

      const x = lastX - offset;
      if (!visible) gsap.set(hint, { x, y: lastY });
      visible = true;
      moveX(x);
      moveY(lastY);
    };

    // The pointer doesn't move while scrolling, so re-check what's under it
    const onScroll = () => {
      if (isMouse && visible && !isOverBackground(lastX, lastY)) visible = false;
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
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerdown', onDown);
      area.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll);
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
