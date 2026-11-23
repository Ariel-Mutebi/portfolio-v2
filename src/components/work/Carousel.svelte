<script>
  const count = 9;
  const cards = Array.from({ length: count }, (_, i) => i);

  const radius = 1400; // distance from circle center to each card, in px
  const step = 22; // degrees between neighboring cards
  const centerY = 200; // where the top card's center sits, measured from the section's top
</script>

<section class="relative h-160 overflow-hidden">
  <!-- The ring: a zero-size anchor sitting at the CIRCLE'S center, far below the section -->
  <div
    class="absolute left-1/2"
    style="top: {radius + centerY}px;"
  >
    {#each cards as i}
      {@const angle = (i - (count - 1) / 2) * step}
      {@const rad = (angle * Math.PI) / 180}
      {@const x = radius * Math.sin(rad)}
      {@const y = -radius * Math.cos(rad)}

      <div
        class="absolute -ml-32 -mt-40 h-75 w-75 bg-ebony-500"
        style="transform: translate({x}px, {y}px) rotate({angle}deg);"
      ></div>
    {/each}
  </div>
</section>
