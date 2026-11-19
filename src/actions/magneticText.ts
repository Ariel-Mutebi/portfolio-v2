import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export interface MagneticTextOptions {
  /** CSS selector (scoped to node) for elements to magnetize. */
  selector?: string;

  /** Radius (px) around each character where pull applies. */
  radius?: number;

  /** Pull strength multiplier. */
  strength?: number;

  /** Maximum displacement per axis (px). */
  maxDisplacement?: number;

  /** Whether the magnetic effect is enabled. */
  enabled?: boolean;
}

type CharTween = {
  el: HTMLElement;
  x: gsap.QuickToFunc;
  y: gsap.QuickToFunc;
};

export function magneticText(
  node: HTMLElement,
  options: MagneticTextOptions = {}
) {
  let opts = resolve(options);

  let splits: SplitText[] = [];
  let chars: CharTween[] = [];

  const mediaQuery = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  function resolve(o: MagneticTextOptions) {
    return {
      selector: o.selector ?? '.magnetic-text',
      radius: o.radius ?? 100,
      strength: o.strength ?? 0.35,
      maxDisplacement: o.maxDisplacement ?? 12,
      enabled: o.enabled ?? true
    };
  }

  function teardown() {
    // Stop any ongoing character tweens.
    gsap.killTweensOf(chars.map(({ el }) => el), 'x,y');

    // Restore the original DOM structure.
    splits.forEach((split) => split.revert());

    splits = [];
    chars = [];
  }

  function setup() {
    teardown();

    // Don't initialize if disabled or reduced motion is preferred.
    if (!opts.enabled || mediaQuery.matches) return;

    const targets = gsap.utils.toArray<HTMLElement>(
      opts.selector,
      node
    );

    splits = targets.map((el) =>
      SplitText.create(el, {
        type: 'words,chars',
        charsClass: 'magnetic-char'
      })
    );

    chars = splits
      .flatMap((split) => split.chars as HTMLElement[])
      .map((el) => ({
        el,
        x: gsap.quickTo(el, 'x', {
          duration: 0.45,
          ease: 'power3.out'
        }),
        y: gsap.quickTo(el, 'y', {
          duration: 0.45,
          ease: 'power3.out'
        })
      }));
  }

  function reset() {
    chars.forEach(({ x, y }) => {
      x(0);
      y(0);
    });
  }

  function handleMove(event: PointerEvent) {
    if (mediaQuery.matches || !opts.enabled) return;
    if (event.pointerType !== 'mouse') return;

    const { radius, strength, maxDisplacement } = opts;

    for (const { el, x, y } of chars) {
      const rect = el.getBoundingClientRect();

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = event.clientX - cx;
      const dy = event.clientY - cy;

      const dist = Math.hypot(dx, dy);

      if (dist < radius) {
        const force = (1 - dist / radius) ** 2;

        x(
          gsap.utils.clamp(
            -maxDisplacement,
            maxDisplacement,
            dx * strength * force
          )
        );

        y(
          gsap.utils.clamp(
            -maxDisplacement,
            maxDisplacement,
            dy * strength * force
          )
        );
      } else {
        x(0);
        y(0);
      }
    }
  }

  function handleMotionChange() {
    reset();
    setup();
  }

  // Initialize the effect.
  setup();

  // Listen for pointer interactions.
  node.addEventListener('pointermove', handleMove);
  node.addEventListener('pointerleave', reset);

  // Listen for reduced-motion preference changes.
  mediaQuery.addEventListener('change', handleMotionChange);

  return {
    update(next: MagneticTextOptions = {}) {
      const previous = opts;

      opts = resolve(next);

      if (
        opts.selector !== previous.selector ||
        opts.enabled !== previous.enabled
      ) {
        reset();
        setup();
      }
    },

    destroy() {
      node.removeEventListener('pointermove', handleMove);
      node.removeEventListener('pointerleave', reset);

      mediaQuery.removeEventListener(
        'change',
        handleMotionChange
      );

      teardown();
    }
  };
}
