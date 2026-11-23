export interface CarouselLayout {
  cardW: number;
  cardH: number;
  gap: number;
  radius: number;
  centerY: number;
}

export const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
export const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Degrees between neighbouring cards, so their centres are (cardW + gap) apart along the arc. */
export function stepAngle({ cardW, gap, radius }: CarouselLayout): number {
  return toDegrees((cardW + gap) / radius);
}

/** Where card `index` sits on the ring, in the ring's own (unrotated) frame. */
export function cardPlacement(index: number, step: number, radius: number) {
  const angle = index * step;
  const rad = toRadians(angle);
  return { angle, x: radius * Math.sin(rad), y: -radius * Math.cos(rad) };
}

/** Ring rotation in degrees for a position measured in card units (0 = first card centred). */
export function ringRotation(position: number, step: number): number {
  return -position * step;
}

/** Dragging right (dx > 0) brings earlier cards to the centre. Clamped to the first and last card. */
export function positionFromDrag(
  startPosition: number,
  dx: number,
  pxPerCard: number,
  lastIndex: number
): number {
  return clamp(startPosition - dx / pxPerCard, 0, lastIndex);
}

/** Smoothed drag velocity in cards per ms. `dx` and `dt` are the change since the previous sample. */
export function smoothVelocity(
  previous: number,
  dx: number,
  dt: number,
  pxPerCard: number,
  smoothing = 0.8
): number {
  if (dt <= 0) return previous;
  const instant = -dx / pxPerCard / dt;
  return smoothing * previous + (1 - smoothing) * instant;
}

/** Card to snap to on release: project some momentum forward, round, clamp. */
export function snapIndex(
  position: number,
  velocity: number,
  lastIndex: number,
  projectionMs = 200
): number {
  return clamp(Math.round(position + velocity * projectionMs), 0, lastIndex);
}

/** How far past the target (in cards) a settle swings, based on release speed. Never zero, so it always feels weighted. */
export function overshootCards(
  velocity: number,
  min = 0.05,
  max = 0.2,
  perVelocity = 50
): number {
  return clamp(Math.abs(velocity) * perVelocity, min, max);
}

/** Maps a key press to the card it should select, or null if the key isn't ours. */
export function keyToIndex(key: string, current: number, lastIndex: number): number | null {
  switch (key) {
    case 'ArrowLeft':
      return clamp(current - 1, 0, lastIndex);
    case 'ArrowRight':
      return clamp(current + 1, 0, lastIndex);
    case 'Home':
      return 0;
    case 'End':
      return lastIndex;
    default:
      return null;
  }
}

/** Wheel deltas arrive in pixels, lines or pages depending on the device. */
export function normalizeWheelDelta(delta: number, deltaMode: number): number {
  return delta * (deltaMode === 1 ? 16 : deltaMode === 2 ? 400 : 1);
}

/** Swiping left (deltaX > 0) brings later cards to the centre, matching a leftward drag. */
export function positionFromWheel(
  position: number,
  deltaX: number,
  pxPerCard: number,
  lastIndex: number
): number {
  return clamp(position + deltaX / pxPerCard, 0, lastIndex);
}
