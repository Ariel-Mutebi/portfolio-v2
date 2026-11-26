import { BALL, H, PADDLE, W, type Game } from './game.ts';
import { getCSSColorValue } from '../../lib/colors.ts';

export interface Theme {
  bg: string;
  brick: string;
  paddle: string;
  ball: string;
}

export function readTheme(): Theme {
  return {
    bg: getCSSColorValue('--color-ebony-950'),
    brick: getCSSColorValue('--color-ebony-300'),
    paddle: getCSSColorValue('--color-ebony-200'),
    ball: getCSSColorValue('--color-ebony-50'),
  };
}

export function render(ctx: CanvasRenderingContext2D, theme: Theme, game: Game): void {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = theme.brick;
  for (const b of game.bricks) {
    ctx.fillRect(Math.round(b.x), Math.round(b.y), b.w, b.h);
  }

  ctx.fillStyle = theme.paddle;
  ctx.fillRect(Math.round(game.paddleX), PADDLE.y, PADDLE.w, PADDLE.h);

  ctx.fillStyle = theme.ball;
  ctx.fillRect(Math.round(game.ball.x), Math.round(game.ball.y), BALL, BALL);
}
