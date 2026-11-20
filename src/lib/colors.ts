import { Color as ThreeColor } from 'three';
import { Color as OGLColor } from 'ogl';

/**
 * Resolves a CSS custom property from the document root.
 */
function getCSSColorValue(name: string): string {
  if (typeof document === 'undefined') {
    throw new Error(`Cannot resolve CSS variable "${name}" outside the browser`);
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  if (!value) {
    throw new Error(`CSS variable "${name}" not found`);
  }

  return value;
}

export function threeColor(name: string): ThreeColor {
  return new ThreeColor(getCSSColorValue(name));
}

export function oglColor(name: string): OGLColor {
  return new OGLColor(getCSSColorValue(name));
}
