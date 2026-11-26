export const W = 320;
export const H = 200;
export const BALL = 6;
export const PADDLE = { y: 184, w: 48, h: 6 } as const;

export interface Rect { x: number; y: number; w: number; h: number }
export interface Ball { x: number; y: number; vx: number; vy: number }
export type Phase = 'idle' | 'playing' | 'won';

export interface Game {
  readonly phase: Phase;
  readonly ball: Ball;
  readonly paddleX: number;
  readonly bricks: readonly Rect[];
}

export interface Input {
  left: boolean;
  right: boolean;
  /** Paddle centre in canvas units, or null when the keyboard is driving. */
  pointerX: number | null;
}

const PADDLE_SPEED = 240; // px/s for keyboard
const MAX_VX = 150;       // px/s from a paddle edge hit

const GLYPHS = {
  four: ['101', '101', '111', '001', '001'],
  zero: ['111', '101', '101', '101', '111'],
} as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const hits = (b: Ball, r: Rect) =>
  b.x < r.x + r.w && b.x + BALL > r.x && b.y < r.y + r.h && b.y + BALL > r.y;

function makeBricks(): Rect[] {
  const word = [GLYPHS.four, GLYPHS.zero, GLYPHS.four];
  return [0, 1, 2, 3, 4].flatMap((row) => {
    const line = word.map((glyph) => glyph[row]).join('0');
    return [...line].flatMap((cell, col) =>
      cell === '1' ? [{ x: 18 + col * 26, y: 20 + row * 12, w: 24, h: 10 }] : []
    );
  });
}

/** Launches from just above the paddle so the player gets a beat to react. */
const serve = (): Ball => ({
  x: W / 2 - BALL / 2,
  y: PADDLE.y - BALL - 8,
  vx: 70,
  vy: -130,
});

export const createGame = (): Game => ({
  phase: 'idle',
  ball: serve(),
  paddleX: (W - PADDLE.w) / 2,
  bricks: makeBricks(),
});

/** Idle → playing, or won → fresh wall. No-op while playing. */
export const start = (game: Game): Game =>
  game.phase === 'playing'
    ? game
    : { phase: 'playing', ball: serve(), paddleX: game.paddleX, bricks: makeBricks() };

function movePaddle(x: number, dt: number, input: Input): number {
  const max = W - PADDLE.w;
  if (input.pointerX !== null) return clamp(input.pointerX - PADDLE.w / 2, 0, max);
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  return clamp(x + dir * PADDLE_SPEED * dt, 0, max);
}

function simulate(
  ball: Ball,
  bricks: readonly Rect[],
  paddleX: number,
  dt: number
): { ball: Ball; bricks: readonly Rect[] } {
  const b: Ball = { ...ball };
  let list = bricks;

  // Move one axis at a time and undo on contact: cheap AABB, no tunnelling
  // at these speeds (max ~1.7 px per 1/120 s step).
  for (const axis of ['x', 'y'] as const) {
    const v = axis === 'x' ? 'vx' : 'vy';
    b[axis] += b[v] * dt;

    const i = list.findIndex((r) => hits(b, r));
    if (i !== -1) {
      b[axis] -= b[v] * dt;
      b[v] = -b[v];
      list = list.filter((_, j) => j !== i);
    }
  }

  if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); }
  if (b.x + BALL > W) { b.x = W - BALL; b.vx = -Math.abs(b.vx); }
  if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy); }

  const paddle: Rect = { x: paddleX, y: PADDLE.y, w: PADDLE.w, h: PADDLE.h };
  if (b.vy > 0 && hits(b, paddle)) {
    b.y = paddle.y - BALL;
    const offset = ((b.x + BALL / 2 - paddleX) / PADDLE.w) * 2 - 1; // -1 left, +1 right
    b.vx = clamp(offset, -1, 1) * MAX_VX;
    b.vy = -Math.abs(b.vy);
  }

  if (b.y > H) return { ball: serve(), bricks: list };

  return { ball: b, bricks: list };
}

/** Advances the game by exactly `dt` seconds. Returns a new state. */
export function step(game: Game, dt: number, input: Input): Game {
  const paddleX = movePaddle(game.paddleX, dt, input);
  if (game.phase !== 'playing') return { ...game, paddleX };

  const next = simulate(game.ball, game.bricks, paddleX, dt);

  return {
    phase: next.bricks.length === 0 ? 'won' : 'playing',
    ball: next.ball,
    paddleX,
    bricks: next.bricks,
  };
}
