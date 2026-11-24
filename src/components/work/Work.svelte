<script lang="ts">
  import Background from './Background.svelte';
  import Carousel from './Carousel.svelte';

  const projects = Array.from({ length: 9 }, (_, i) => ({ id: i, title: `Project ${i + 1}` }));
  let selected = $state(Math.floor((projects.length - 1) / 2)); // start in the middle
</script>

<div class="h-dvh relative">
  <Background />
  <Carousel items={projects} bind:selected />
</div>
