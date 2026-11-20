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
}

export function revealText(node: HTMLElement, options: RevealTextOptions = {}) {
  let opts = resolve(options);
  let targets: HTMLElement[] = [];
  let tl: gsap.core.Timeline | null = null;
  let observer: IntersectionObserver | null = null;

  function resolve(o: RevealTextOptions) {
    return {
      selector: o.selector ?? '.reveal-text',
      duration: o.duration ?? 1.2,
      ease: o.ease ?? 'power4.out',
      stagger: o.stagger ?? 0.15,
      delay: o.delay ?? 0,
      trigger: o.trigger ?? 'mount',
      threshold: o.threshold ?? 0.15
    };
  }

  function prepare() {
    cleanup();
    targets = gsap.utils.toArray<HTMLElement>(opts.selector, node);
    if (!targets.length) return;

    // Hide below the mask before the first paint to avoid a flash.
    gsap.set(targets, { yPercent: 110 });

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
  }

  function cleanup() {
    tl?.kill();
    tl = null;
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
      gsap.set(targets, { yPercent: 110 });
      play();
    },
    destroy() {
      cleanup();
    }
  };
}
