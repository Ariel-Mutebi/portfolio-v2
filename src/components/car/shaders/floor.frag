varying vec2 vPoint;

void main() {
  vec2 cell = vPoint * 2.0;
  vec2 distanceToLine = abs(fract(cell - 0.5) - 0.5) / fwidth(cell);
  float line = 1.0 - min(min(distanceToLine.x, distanceToLine.y), 1.0);

  float fade = 1.0 - smoothstep(2.0, 4.8, length(vPoint));
  float shadow = 0.55 * (1.0 - smoothstep(0.5, 1.2, length(vPoint / vec2(1.05, 2.2))));
  float grid = (0.08 + 0.2 * line) * fade;

  gl_FragColor = vec4(vec3(0.12, 0.13, 0.14), max(grid, shadow));
}
