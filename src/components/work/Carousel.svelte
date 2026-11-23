<script>
  const count = 9;
  const cards = Array.from({ length: count }, (_, i) => i);

  const cardW = 300;
  const cardH = 300;
  const gap = 180;

  // Radius of circle, centre of the top card
  const radius = 1400;
  const centerY = 200;

  // Angular step derived from card width, so cards never overlap
  const step = ((cardW + gap) / radius) * (180 / Math.PI);
</script>

<section
  class="relative h-dvh overflow-hidden"
  style:--card-w="{cardW}px"
  style:--card-h="{cardH}px"
>
  <div
    class="absolute left-1/2"
    style:top="{radius + centerY}px"
  >
    {#each cards as i}
      {@const angle = (i - (count - 1) / 2) * step}
      {@const rad = (angle * Math.PI) / 180}
      {@const x = radius * Math.sin(rad)}
      {@const y = -radius * Math.cos(rad)}
      <div
        class="absolute -mt-[calc(var(--card-h)/2)] -ml-[calc(var(--card-w)/2)] h-(--card-h) w-(--card-w) bg-ebony-500"
        style:transform="translate({x}px, {y}px) rotate({angle}deg)"
      ></div>
    {/each}
  </div>
</section>
