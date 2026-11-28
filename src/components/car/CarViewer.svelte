<script lang="ts">
  import { mountWindTunnel, type SceneStatus } from './scene.ts';

  let { modelUrl }: { modelUrl: string } = $props();

  let status = $state<SceneStatus>('loading');

  const messages: Record<SceneStatus, string> = {
    loading: 'Loading model…',
    ready: 'Drag to rotate',
    error: "The 3D model couldn't be displayed.",
  };
</script>

<div class="relative h-dvh w-full">
  <div
    class="h-full w-full cursor-grab overflow-hidden bg-linear-to-b from-white via-steel-50 via-55% to-white active:cursor-grabbing"
    role="img"
    aria-label="3D model of a Porsche 992 GT3 R race car"
    {@attach (element) =>
      mountWindTunnel(element, {
        modelUrl,
        onStatusChange: (next) => (status = next),
      })}
  ></div>

  <p
    class="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-sm text-ebony-900 font-medium"
    aria-live="polite"
  >
    {messages[status]}
  </p>
</div>
