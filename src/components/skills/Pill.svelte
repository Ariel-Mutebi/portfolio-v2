<script lang="ts">
  import type { Skill } from './types.ts';

  const { name, level, link }: Skill = $props();

  interface Variant {
    border: string;
    text: string;
    dot: string;
  }

  const variants: Record<number, Variant> = {
    0: {
      border: 'border-steel-600',
      text: 'text-steel-950',
      dot: 'bg-steel-300',
    },
    1: {
      border: 'border-pollen-600',
      text: 'text-pollen-950',
      dot: 'bg-pollen-300',
    },
    2: {
      border: 'border-viridian-500',
      text: 'text-viridian-800',
      dot: 'bg-viridian-300',
    }
  };
</script>

<a
  href={link}
  class={[
    'flex items-center gap-1 py-0.5 pl-1 pr-2 border rounded-md',
    'hover:scale-105 active:scale-95 transition-transform duration-500',
    variants[level]['border']
  ]}
>
  <div class={['size-2 rounded', variants[level]['border'], variants[level]['dot']]}></div>
  <p class={['font-mono text-sm font-medium', variants[level]['text']]}>{name}</p>
</a>
