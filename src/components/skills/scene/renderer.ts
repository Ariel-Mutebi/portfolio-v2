import {
  WebGLRenderer,
  SRGBColorSpace
} from 'three';

export function createRenderer(
  container: HTMLElement
): WebGLRenderer {
  const renderer = new WebGLRenderer({
    antialias: true
  });

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.outputColorSpace = SRGBColorSpace;

  return renderer;
}
