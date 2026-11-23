<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import {
    cardPlacement,
    clamp,
    keyToIndex,
    normalizeWheelDelta,
    overshootCards,
    positionFromDrag,
    positionFromWheel,
    ringRotation,
    smoothVelocity,
    snapIndex,
    stepAngle,
    type CarouselLayout
  } from './carousel';

  interface Props {
    items: readonly { title: string }[];
    selected: number;
  }

  let { items, selected = $bindable() }: Props = $props();

  // --- Layout ---
  const layout: CarouselLayout = {
    cardW: 300,
    cardH: 300,
    gap: 180,
    radius: 1400, // radius of the circle
    centerY: 200 // where the top card's center sits
  };
  const { cardW, cardH, gap, radius, centerY } = layout;

  const step = stepAngle(layout);
  const pxPerCard = cardW + gap;
  const lastIndex = $derived(items.length - 1);
  const placements = $derived(items.map((_, i) => cardPlacement(i, step, radius)));

  // --- Motion ---
  let section = $state<HTMLElement>();
  let ring = $state<HTMLDivElement>();
  let buttons: HTMLButtonElement[] = $state([]);
  let setRotation: (degrees: number) => void;
  let tween: gsap.core.Timeline | undefined;
  let wheelTimer: ReturnType<typeof setTimeout>;
  let targetIndex = 0;
  const pos = { value: 0 }; // continuous position in card units; a plain object so GSAP can tween it

  const render = () => setRotation(ringRotation(pos.value, step));

  function goTo(index: number, releaseVelocity = 0) {
    targetIndex = clamp(Math.round(index), 0, lastIndex);
    selected = targetIndex;
    tween?.kill();

    const distance = targetIndex - pos.value;
    if (Math.abs(distance) < 0.001) {
      pos.value = targetIndex;
      render();
      return;
    }

    // Swing past the target in the direction of travel, then ease back
    const peak = targetIndex + Math.sign(distance) * overshootCards(releaseVelocity);
    tween = gsap
      .timeline({ onUpdate: render })
      .to(pos, { value: peak, duration: 0.28, ease: 'power2.out' })
      .to(pos, { value: targetIndex, duration: 0.5, ease: 'sine.inOut' });
  }

  onMount(() => {
    const el = section!;
    setRotation = gsap.quickSetter(ring!, 'rotation', 'deg') as (degrees: number) => void;
    pos.value = targetIndex = selected;
    render();

    // Not passive, so we can stop horizontal swipes from scrolling or navigating the page
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      clearTimeout(wheelTimer);
      tween?.kill();
    };
  });

  // --- Keyboard ---
  function onKeyDown(e: KeyboardEvent) {
    const next = keyToIndex(e.key, targetIndex, lastIndex);
    if (next === null) return;
    e.preventDefault();
    goTo(next);
    buttons[next]?.focus({ preventScroll: true });
  }

  // --- Horizontal wheel / trackpad ---
  const WHEEL_SETTLE_MS = 120; // snap once the wheel has been quiet this long

  function onWheel(e: WheelEvent) {
    if (drag.active) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical intent: let the page scroll
    e.preventDefault();

    tween?.kill();
    const dx = normalizeWheelDelta(e.deltaX, e.deltaMode);
    pos.value = positionFromWheel(pos.value, dx, pxPerCard, lastIndex);
    render();

    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => goTo(Math.round(pos.value)), WHEEL_SETTLE_MS);
  }

  // --- Drag ---
  const DRAG_THRESHOLD = 6; // px of movement before a press becomes a drag
  const drag = {
    pressed: false,
    active: false,
    moved: false,
    startX: 0,
    startPosition: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0
  };

  function onDown(e: PointerEvent) {
    Object.assign(drag, {
      pressed: true,
      active: false,
      moved: false,
      startX: e.clientX,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0
    });
  }

  function onMove(e: PointerEvent) {
    if (!drag.pressed) return;
    const dx = e.clientX - drag.startX;

    if (!drag.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      drag.active = drag.moved = true;
      drag.startPosition = pos.value;
      clearTimeout(wheelTimer);
      tween?.kill();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    drag.velocity = smoothVelocity(
      drag.velocity,
      e.clientX - drag.lastX,
      e.timeStamp - drag.lastT,
      pxPerCard
    );
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;

    pos.value = positionFromDrag(drag.startPosition, dx, pxPerCard, lastIndex);
    render();
  }

  function onUp() {
    if (!drag.pressed) return;
    drag.pressed = false;
    if (!drag.active) return;
    drag.active = false;
    goTo(snapIndex(pos.value, drag.velocity, lastIndex), drag.velocity);
  }
</script>

<!-- Drag and wheel are pointer-only enhancements; the card buttons and arrow keys are the keyboard equivalent. -->
<!-- svelte-ignore a11y_no_static_element_interactions, a11y_no_noninteractive_element_interactions -->
<section
  bind:this={section}
  role="group"
  aria-roledescription="carousel"
  aria-label="Past work"
  class="relative h-dvh cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing"
  style:--card-w="{cardW}px"
  style:--card-h="{cardH}px"
  onpointerdown={onDown}
  onpointermove={onMove}
  onpointerup={onUp}
  onpointercancel={onUp}
  onkeydown={onKeyDown}
>
  <div bind:this={ring} class="absolute left-1/2" style:top="{radius + centerY}px">
    {#each items as item, i}
      {@const p = placements[i]}
      <button
        bind:this={buttons[i]}
        type="button"
        tabindex={i === selected ? 0 : -1}
        aria-label={item.title}
        aria-current={i === selected}
        onclick={() => !drag.moved && goTo(i)}
        class="absolute -mt-[calc(var(--card-h)/2)] -ml-[calc(var(--card-w)/2)] h-(--card-h) w-(--card-w)
          bg-ebony-500 text-ebony-50 flex items-center justify-center text-3xl font-bold"
        style:transform="translate({p.x}px, {p.y}px) rotate({p.angle}deg)"
      >{i}</button>
    {/each}
  </div>
</section>
