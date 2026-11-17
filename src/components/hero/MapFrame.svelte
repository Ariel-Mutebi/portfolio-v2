<script lang="ts">
  interface Props { progress: number; }
  let { progress }: Props = $props();
</script>

<svg class="absolute inset-0 size-full overflow-visible" aria-hidden="true">
  <rect
    x="0" y="0" width="100%" height="100%"
    fill="none"
    pathLength="1"
    stroke-dasharray="1"
    stroke-dashoffset={1 - progress}
    stroke-width="1.5"
    vector-effect="non-scaling-stroke"
    class="stroke-ebony-800"
  />
</svg>