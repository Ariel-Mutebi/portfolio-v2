precision highp float;

uniform vec2 uResolution;
uniform float uCell;
uniform float uDpr;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uInk;

const float PATCH_SIZE = 240.0;
const float MORPH_SPEED = 0.12;
const float DRIFT_SPEED = 0.04;
const float MAX_DENSITY = 0.9;
const float BREAKPOINT = 768.0;

/* Bayer dithering */

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

/** Returns a rank from 0/16 to 15/16, offset to sit mid-step */
float bayer4(vec2 cell) {
  return bayer2(0.5 * cell) * 0.25 + bayer2(cell) + 1.0 / 32.0;
}

/* Noise */

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
        mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
        mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z
  );
}

/* Composition */

float clouds(vec2 px, float time) {
  vec3 p = vec3(px / PATCH_SIZE, time * MORPH_SPEED);
  p.x -= time * DRIFT_SPEED;

  float n = valueNoise(p) * 0.75 + valueNoise(p * 2.0) * 0.25;
  return smoothstep(0.3, 0.72, n);
}

/** Low on mobile; on wider screens, higher on the left */
float verticalFade(vec2 uv, float widthCss) {
  float isWide = step(BREAKPOINT, widthCss);
  float reach = mix(0.4, mix(0.85, 0.4, uv.x), isWide);
  return 1.0 - smoothstep(0.0, reach, uv.y);
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy / uCell);
  /** Sample once per cell, at its centre */
  vec2 centre = (cell + 0.5) * uCell;

  float density = clouds(centre / uDpr, uTime)
    * verticalFade(centre / uResolution, uResolution.x / uDpr)
    * MAX_DENSITY;

  float on = step(bayer4(cell), density);

  gl_FragColor = vec4(mix(uBase, uInk, on), 1.0);
}
