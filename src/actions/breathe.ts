import gsap from 'gsap';

export interface BreatheOptions {
  /** Elements to breathe, scoped to `node`. Omit to breathe `node` itself. */
  selector?: string;
  /** Lowest opacity reached each cycle. */
  minOpacity?: number;
  /** Seconds for one fade (half a cycle). */
  duration?: number;
  /** Delay between each target's cycle start. */
  stagger?: number;
  /** Seconds before the first cycle starts. */
  delay?: number;
  /** Turn the effect on or off. */
  enabled?: boolean;
}

export function breathe(node: HTMLElement, options: BreatheOptions = {}) {
  let opts = resolve(options);
  let targets: HTMLElement[] = [];
  let tween: gsap.core.Tween | null = null;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function resolve(o: BreatheOptions) {
    return {
      selector: o.selector,
      minOpacity: o.minOpacity ?? 0.85,
      duration: o.duration ?? 2.5,
      stagger: o.stagger ?? 0.3,
      delay: o.delay ?? 0,
      enabled: o.enabled ?? true
    };
  }

  function stop() {
    tween?.kill();
    tween = null;
    if (targets.length) gsap.set(targets, { clearProps: 'opacity' });
    targets = [];
  }

  function start() {
    stop();
    if (!opts.enabled || mediaQuery.matches) return;

    targets = opts.selector
      ? gsap.utils.toArray<HTMLElement>(opts.selector, node)
      : [node];
    if (!targets.length) return;

    tween = gsap.to(targets, {
      opacity: opts.minOpacity,
      duration: opts.duration,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: opts.delay,
      stagger: { each: opts.stagger, from: 'start' }
    });
  }

  function changed(a: typeof opts, b: typeof opts) {
    return (Object.keys(a) as (keyof typeof opts)[]).some((k) => a[k] !== b[k]);
  }

  start();
  mediaQuery.addEventListener('change', start);

  return {
    update(next: BreatheOptions = {}) {
      const prev = opts;
      opts = resolve(next);
      if (changed(prev, opts)) start();
    },
    destroy() {
      mediaQuery.removeEventListener('change', start);
      stop();
    }
  };
}
