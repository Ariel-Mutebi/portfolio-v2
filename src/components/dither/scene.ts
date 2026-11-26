import { Renderer, Program, Mesh, Triangle } from 'ogl';
import vertex from './shaders/dither.vert?raw';
import fragment from './shaders/dither.frag?raw';
import { createUniforms, measure } from './uniforms.ts';
import type { DitherConfig } from './types.ts';

export const createScene = (node: HTMLElement, config: DitherConfig) => {
  const renderer = new Renderer({ dpr: 1, alpha: false, antialias: false, depth: false });
  const { gl } = renderer;
  const canvas = gl.canvas as HTMLCanvasElement;
  const uniforms = createUniforms(config);
  const geometry = new Triangle(gl);
  const program = new Program(gl, { vertex, fragment, uniforms });
  const mesh = new Mesh(gl, { geometry, program });

  node.appendChild(canvas);

  const render = (time: number) => {
    uniforms.uTime.value = time;
    renderer.render({ scene: mesh });
  };

  const resize = () => {
    const size = measure(node, window.devicePixelRatio || 1, config.cell);

    renderer.setSize(size.width, size.height);
    Object.assign(canvas.style, { width: '100%', height: '100%' });

    uniforms.uResolution.value = [size.width, size.height];
    uniforms.uCell.value = size.cell;
    uniforms.uDpr.value = size.dpr;
  };

  const destroy = () => {
    geometry.remove();
    program.remove();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.remove();
  };

  return { render, resize, destroy };
};
