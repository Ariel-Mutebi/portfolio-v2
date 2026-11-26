import { W, createGame, start, step, type Game, type Input } from './game.ts';
import { readTheme, render } from './render.ts';

const STEP = 1 / 120;   // fixed simulation step: identical on 60 and 120 Hz
const MAX_FRAME = 0.1;  // clamp after tab switches

export function mount(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-game]');
  const ctx = canvas?.getContext('2d', { alpha: false });
  if (!canvas || !ctx) return;

  const pathEl = document.querySelector<HTMLElement>('[data-path]');
  const statusEl = document.querySelector<HTMLElement>('[data-status]');
  const countEl = document.querySelector<HTMLElement>('[data-bricks]');

  // The URL is untrusted input — textContent, never innerHTML.
  if (pathEl) pathEl.textContent = location.pathname;

  const theme = readTheme();
  const input: Input = { left: false, right: false, pointerX: null };

  let game: Game = createGame();
  let acc = 0;
  let last = performance.now();
  let shownCount = -1;
  let shownStatus = '';

  const sync = () => {
    if (countEl && game.bricks.length !== shownCount) {
      shownCount = game.bricks.length;
      countEl.textContent = String(shownCount);
    }

    const text =
      game.phase === 'won'
        ? 'demolition complete. [space] or [R] rebuild'
        : game.phase === 'lost'
          ? 'game over. [space] or [R] restart'
          : game.phase === 'playing'
            ? 'move: arrows / A D / mouse / finger'
            : 'press space or tap to start';

    if (statusEl && text !== shownStatus) {
      shownStatus = text;
      statusEl.textContent = text;
    }
  };

  // --- pointer ------------------------------------------------------------
  const toCanvasX = (e: PointerEvent): number => {
    const r = canvas.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * W;
  };

  const active = new Set<number>();

  canvas.addEventListener('pointerdown', (e) => {
    active.add(e.pointerId);
    canvas.setPointerCapture(e.pointerId);
    canvas.focus({ preventScroll: true });
    input.pointerX = toCanvasX(e);
    game = start(game);
  });

  canvas.addEventListener('pointermove', (e) => {
    // Mouse follows on hover; touch and pen only while dragging.
    if (e.pointerType === 'mouse' || active.has(e.pointerId)) {
      input.pointerX = toCanvasX(e);
    }
  });

  const release = (e: PointerEvent) => {
    active.delete(e.pointerId);
    if (e.pointerType !== 'mouse') input.pointerX = null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // --- keyboard (only while the canvas has focus) -------------------------
  const LEFT = ['ArrowLeft', 'a', 'A'];
  const RIGHT = ['ArrowRight', 'd', 'D'];

  canvas.addEventListener('keydown', (e) => {
    if (LEFT.includes(e.key)) {
      input.left = true;
      input.pointerX = null;
      e.preventDefault();
    } else if (RIGHT.includes(e.key)) {
      input.right = true;
      input.pointerX = null;
      e.preventDefault();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      game = start(game);
    } else if ((e.key === 'r' || e.key === 'R') && game.phase === 'won') {
      e.preventDefault();
      game = start(game);
    } else if (
      (e.key === 'r' || e.key === 'R') &&
      (game.phase === 'won' || game.phase === 'lost')
    ) {
      e.preventDefault();
      game = start(game);
    }
  });

  canvas.addEventListener('keyup', (e) => {
    if (LEFT.includes(e.key)) input.left = false;
    if (RIGHT.includes(e.key)) input.right = false;
  });

  window.addEventListener('blur', () => {
    input.left = false;
    input.right = false;
  });

  // --- loop ---------------------------------------------------------------
  const frame = (now: number) => {
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    acc += elapsed;

    while (acc >= STEP) {
      game = step(game, STEP, input);
      acc -= STEP;
    }

    render(ctx, theme, game);
    sync();
    requestAnimationFrame(frame);
  };

  sync();
  requestAnimationFrame(frame);
}
