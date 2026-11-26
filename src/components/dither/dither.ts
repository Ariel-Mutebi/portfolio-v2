import { createScene } from './scene.ts';
import { createTicker } from './ticker.ts';
import { watchMedia, watchSize, watchVisibility } from './watchers.ts';
import type { Cleanup, DitherConfig } from './types.ts';

export const mountDither = (node: HTMLElement, config: DitherConfig): Cleanup => {
  const scene = createScene(node, config);
  const ticker = createTicker(config.fps, scene.render);
  let visible = false;
  let reducedMotion = false;

  const sync = () => (visible && !reducedMotion ? ticker.start() : ticker.stop());

  const cleanups: Cleanup[] = [
    watchSize(node, () => {
      scene.resize();
      /** Resizing clears the canvas, so redraw straight away */
      scene.render(ticker.time());
    }),
    watchVisibility(node, (value) => {
      visible = value;
      sync();
    }),
    watchMedia('(prefers-reduced-motion: reduce)', (value) => {
      reducedMotion = value;
      sync();
    }),
  ];

  return () => {
    ticker.stop();
    cleanups.forEach((cleanup) => cleanup());
    scene.destroy();
  };
};
