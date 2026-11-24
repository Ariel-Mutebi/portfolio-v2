<script lang="ts">
  import { magneticText } from '../../actions/magneticText.ts';
  import { revealText } from '../../actions/revealText.ts';
  import { breathe } from '../../actions/breathe.ts';
  import { tilt } from '../../actions/tiltingCard.ts';

  interface Props {
    name: string;
    titles: string;
  }

  const { name, titles }: Props = $props();
</script>

<hgroup
  use:tilt
  use:revealText
  use:magneticText
  use:breathe={{ selector: '.reveal-text' }}
  class="grid p-5 gap-5 pb-8 max-w-2xl border border-ebony-400 rounded-xl bg-linear-to-br
    from-ebony-50 via-ebony-100 to-ebony-200 bg-size-[200%_200%] animate-ambient will-change-transform"
>
  <h1 class="text-6xl sm:text-8xl text-ebony-950 font-extrabold reveal-mask">
    <span class="reveal-text magnetic-text">{name}</span>
  </h1>

  <h3 class="text-xl sm:text-2xl text-ebony-900 reveal-mask">
    <span class="reveal-text magnetic-text">{titles}</span>
  </h3>
</hgroup>
