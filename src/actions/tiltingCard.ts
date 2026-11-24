// src/lib/actions/tilt.ts
import gsap from 'gsap';

export interface TiltOptions {
  /** Max rotation in degrees on each axis. */
  maxTilt?: number;
  /** CSS perspective (px). Higher = flatter, subtler tilt. */
  perspective?: number;
  /** Tween duration for each quickTo (seconds). */
  duration?: number;
  /** GSAP ease for the follow/reset tweens. */
  ease?: string;
}

export function tilt(node: HTMLElement, options: TiltOptions = {}) {
  let opts = resolve(options);

  function resolve(o: TiltOptions) {
    return {
      maxTilt: o.maxTilt ?? 3,
      perspective: o.perspective ?? 1000,
      duration: o.duration ?? 0.6,
      ease: o.ease ?? 'power3.out'
    };
  }

  gsap.set(node, {
    transformPerspective: opts.perspective,
    transformOrigin: 'center'
  });

  let rotateX = gsap.quickTo(node, 'rotationX', { duration: opts.duration, ease: opts.ease });
  let rotateY = gsap.quickTo(node, 'rotationY', { duration: opts.duration, ease: opts.ease });

  function handleMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const r = node.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    rotateX(-ny * opts.maxTilt);
    rotateY(nx * opts.maxTilt);
  }

  function reset() {
    rotateX(0);
    rotateY(0);
  }

  node.addEventListener('pointermove', handleMove);
  node.addEventListener('pointerleave', reset);

  return {
    update(next: TiltOptions = {}) {
      opts = resolve(next);
      gsap.set(node, { transformPerspective: opts.perspective });
      rotateX = gsap.quickTo(node, 'rotationX', { duration: opts.duration, ease: opts.ease });
      rotateY = gsap.quickTo(node, 'rotationY', { duration: opts.duration, ease: opts.ease });
    },
    destroy() {
      node.removeEventListener('pointermove', handleMove);
      node.removeEventListener('pointerleave', reset);
      gsap.killTweensOf(node, 'rotationX,rotationY');
    }
  };
}
