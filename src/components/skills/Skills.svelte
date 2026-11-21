<script lang="ts">
  import Scene from './Scene.svelte';

  interface Props {
    modelUrl: string;
  }

  const { modelUrl }: Props = $props();
</script>

<Scene {modelUrl} />
