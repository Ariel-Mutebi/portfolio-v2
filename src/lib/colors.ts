import { Color as ThreeColor } from 'three';
import { Color as OGLColor } from 'ogl';

export function threeColor(name: string): ThreeColor {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  if (!value) {
    throw new Error(`CSS variable ${name} not found`);
  }

  return new ThreeColor(value);
}

export function oglColor(name: string): OGLColor {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  if (!value) {
    throw new Error(`CSS variable ${name} not found`);
  }

  return new OGLColor(value);
}
