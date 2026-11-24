<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { Work } from './types.ts';

  interface Props {
    work: Work[];
    selected: number;
  }

  const { work, selected }: Props = $props();
  const item = $derived(work[selected]);
</script>

<div class="h-80 w-[min(500px,90dvw)] rounded-t-3xl glass p-10 pointer-events-auto">
  {#key selected}
    <div class="grid gap-4" in:fade={{ duration: 400 }}>
      <div class="grid gap-2">
        <p class="text-ebony-900 text-xl leading-relaxed">{item.description}</p>
        <ul class="text-ebony-600 list-disc marker:text-ebony-600 pl-4 space-y-3">
          {#each item.bullets as bullet}
            <li>{bullet}</li>
          {/each}
        </ul>
      </div>

      <a
        href={item.link}
        class="px-5 py-2 bg-steel-100 border border-steel-200 text-ebony-950 font-black w-max
          rounded-2xl hover:bg-steel-200 active:bg-steel-900 active:text-steel-100"
      >
        {item.cta}
      </a>
    </div>
  {/key}
</div>
