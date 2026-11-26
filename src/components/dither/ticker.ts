/** A throttled clock that only advances while running */
export const createTicker = (fps: number, onTick: (time: number) => void) => {
  const interval = 1000 / fps;
  let frame = 0;
  let last: number | null = null;
  let elapsed = 0;

  const loop = (now: number) => {
    frame = requestAnimationFrame(loop);
    last ??= now;

    const delta = now - last;
    if (delta < interval) return;

    last = now;
    /** Clamped so returning to the tab doesn't cause a jump */
    elapsed += Math.min(delta, 200) / 1000;
    onTick(elapsed);
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    last = null;
  };

  const start = () => {
    stop();
    frame = requestAnimationFrame(loop);
  };

  return { start, stop, time: () => elapsed };
};
