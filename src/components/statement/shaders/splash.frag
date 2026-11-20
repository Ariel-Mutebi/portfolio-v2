precision highp float;

uniform sampler2D tFlow;
uniform float uTime;
uniform float uAspect;
uniform float uGrain;
uniform vec3 uBase;
uniform vec3 uYellow;
uniform vec3 uBlue;
varying vec2 vUv;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float blob(vec2 p, vec2 c, float r) {
  return 1.0 - smoothstep(0.0, r, length(p - c));
}

// Soft threshold against noise: the printed / stippled look
float dither(float t, float g) {
  return smoothstep(g - 0.1, g + 0.1, t) * smoothstep(0.0, 0.04, t);
}

void main() {
  // 1. Fluid distortion from cursor trail
  vec2 flow = texture2D(tFlow, vUv).rg;
  vec2 uv = vUv - flow * 0.25;
  vec2 p = vec2(uv.x * uAspect, uv.y);

  // 2. Slow organic wobble so the splashes aren't perfect circles
  float n = vnoise(p * 2.5 + uTime * 0.05);
  p += (n - 0.5) * 0.12;

  // 3. Two splashes, both on the right
  float y = pow(blob(p, vec2(0.74 * uAspect, 0.68), 0.55), 1.5);
  float b = pow(blob(p, vec2(0.90 * uAspect, 0.30), 0.50), 1.5);

  // 4. Grain: coarse stipple that re-seeds a few times a second
  vec2 cell = floor(gl_FragCoord.xy / uGrain);
  float g = hash(cell + floor(uTime * 8.0) * 7.31);
  float yd = mix(y, dither(y * 1.1, g), 0.65);
  float bd = mix(b, dither(b * 1.1, g), 0.65);

  vec3 col = uBase;
  col = mix(col, uBlue, bd);
  col = mix(col, uYellow, yd);

  // Fine paper tooth over everything
  col += (hash(gl_FragCoord.xy + 17.0) - 0.5) * 0.03;

  gl_FragColor = vec4(col, 1.0);
}
