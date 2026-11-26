<script lang="ts">
  import { mountDither } from './dither.ts';
  import type { DitherOptions } from './types.ts';

  let { base, ink, cell = 10, fps = 10 }: DitherOptions = $props();
</script>

<div
  aria-hidden="true"
  class="pointer-events-none absolute inset-0 overflow-hidden"
  {@attach (node) => mountDither(node, { base, ink, cell, fps })}
></div>
