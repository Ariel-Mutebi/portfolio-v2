<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import {
    cardPlacement,
    clamp,
    positionFromDrag,
    ringRotation,
    smoothVelocity,
    snapIndex,
    stepAngle,
    type CarouselLayout
  } from './carousel.ts';

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
    centerY: 200, // where the top card's center sits
  };
  const { cardW, cardH, gap, radius, centerY } = layout;

  const step = stepAngle(layout);
  const pxPerCard = cardW + gap;
  const lastIndex = $derived(items.length - 1);
  const placements = $derived(items.map((_, i) => cardPlacement(i, step, radius)));

  // --- Motion ---
  let ring = $state<HTMLDivElement>();
  let setRotation: (degrees: number) => void;
  let tween: gsap.core.Tween | undefined;
  let targetIndex = 0;
  const pos = { value: 0 }; // continuous position in card units; a plain object so GSAP can tween it

  const render = () => setRotation(ringRotation(pos.value, step));

  function goTo(index: number) {
    targetIndex = clamp(Math.round(index), 0, lastIndex);
    selected = targetIndex;
    tween?.kill();
    tween = gsap.to(pos, {
      value: targetIndex,
      duration: 0.7,
      ease: 'power3.out',
      onUpdate: render
    });
  }

  onMount(() => {
    setRotation = gsap.quickSetter(ring!, 'rotation', 'deg') as (degrees: number) => void;
    pos.value = targetIndex = selected;
    render();
    return () => tween?.kill();
  });

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
    goTo(snapIndex(pos.value, drag.velocity, lastIndex));
  }
</script>

<section
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
>
  <div bind:this={ring} class="absolute left-1/2" style:top="{radius + centerY}px">
    {#each items as item, i}
      {@const p = placements[i]}
      <button
        type="button"
        aria-label={item.title}
        aria-current={i === selected}
        onclick={() => !drag.moved && goTo(i)}
        class="absolute -mt-[calc(var(--card-h)/2)] -ml-[calc(var(--card-w)/2)] h-(--card-h) w-(--card-w) bg-ebony-500"
        style:transform="translate({p.x}px, {p.y}px) rotate({p.angle}deg)"
      ></button>
    {/each}
  </div>
</section>
