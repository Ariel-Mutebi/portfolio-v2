// src/lib/actions/revealText.ts
import gsap from 'gsap';

export interface RevealTextOptions {
  /** Selector for elements to animate, scoped to `node`. */
  selector?: string;
  duration?: number;
  ease?: string;
  stagger?: number;
  delay?: number;
  /** Play on mount, or when `node` scrolls into view. */
  trigger?: 'mount' | 'enter';
  /** IntersectionObserver threshold (0–1) for `trigger: 'enter'`. */
  threshold?: number;
  /** Subtle looping opacity "breathing" after the reveal. */
  breathe?: boolean;
  breatheOpacity?: number;
  breatheDuration?: number;
  breatheStagger?: number;
}

export function revealText(node: HTMLElement, options: RevealTextOptions = {}) {
  let opts = resolve(options);
  let targets: HTMLElement[] = [];
  let tl: gsap.core.Timeline | null = null;
  let breathe: gsap.core.Tween | null = null;
  let observer: IntersectionObserver | null = null;

  function resolve(o: RevealTextOptions) {
    return {
      selector: o.selector ?? '.reveal-text',
      duration: o.duration ?? 1.2,
      ease: o.ease ?? 'power4.out',
      stagger: o.stagger ?? 0.15,
      delay: o.delay ?? 0,
      trigger: o.trigger ?? 'mount',
      threshold: o.threshold ?? 0.15,
      breathe: o.breathe ?? true,
      breatheOpacity: o.breatheOpacity ?? 0.85,
      breatheDuration: o.breatheDuration ?? 2.5,
      breatheStagger: o.breatheStagger ?? 0.3
    };
  }

  function prepare() {
    cleanup();
    targets = gsap.utils.toArray<HTMLElement>(opts.selector, node);
    if (!targets.length) return;

    // Hide below the mask before the first paint to avoid a flash.
    gsap.set(targets, { yPercent: 110, opacity: 1 });

    if (opts.trigger === 'enter') {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          observer?.disconnect();
          observer = null;
          play();
        },
        { threshold: opts.threshold }
      );
      observer.observe(node);
    } else {
      play();
    }
  }

  function play() {
    tl = gsap.timeline({
      delay: opts.delay,
      defaults: { duration: opts.duration, ease: opts.ease }
    });
    tl.to(targets, { yPercent: 0, stagger: opts.stagger });

    if (opts.breathe) {
      breathe = gsap.to(targets, {
        opacity: opts.breatheOpacity,
        duration: opts.breatheDuration,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: opts.delay,
        stagger: { each: opts.breatheStagger, from: 'start' }
      });
    }
  }

  function cleanup() {
    tl?.kill();
    tl = null;
    breathe?.kill();
    breathe = null;
    observer?.disconnect();
    observer = null;
  }

  prepare();

  return {
    update(next: RevealTextOptions = {}) {
      const prev = opts;
      opts = resolve(next);
      if (
        opts.selector !== prev.selector ||
        opts.trigger !== prev.trigger ||
        opts.threshold !== prev.threshold
      ) {
        prepare();
      }
    },
    /** Replay the reveal (useful for route changes, hover triggers, etc.). */
    replay() {
      cleanup();
      gsap.set(targets, { yPercent: 110, opacity: 1 });
      play();
    },
    destroy() {
      cleanup();
    }
  };
}
