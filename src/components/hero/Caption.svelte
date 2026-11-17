<script lang="ts">
  interface Props {
    text: string;
    el?: HTMLElement;
  }
  let { text, el = $bindable() }: Props = $props();
</script>

<span class="relative inline-block whitespace-nowrap font-mono text-xs uppercase tracking-[0.18em] text-ebony-700 sm:text-sm">
  <!-- sizing twin: reserves layout for the full string -->
  <span class="invisible select-none" aria-hidden="true">{text}</span>

  <!-- the string the timeline scrambles into -->
  <span
    bind:this={el}
    class="absolute inset-0"
    aria-label={text}
  ></span>
</span>
