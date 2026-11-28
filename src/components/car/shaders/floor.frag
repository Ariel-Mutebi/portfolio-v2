uniform vec3 uGridColor;
uniform float uTintStrength;
uniform float uLineStrength;
uniform vec3 uShadowColor;
uniform float uShadowStrength;

varying vec2 vPoint;

void main() {
  vec2 cell = vPoint * 2.0;
  vec2 distanceToLine = abs(fract(cell - 0.5) - 0.5) / fwidth(cell);
  float line = 1.0 - min(min(distanceToLine.x, distanceToLine.y), 1.0);

  float fade = 1.0 - smoothstep(2.0, 4.8, length(vPoint));
  float grid = (uTintStrength + uLineStrength * line) * fade;
  float shadow = uShadowStrength * (1.0 - smoothstep(0.5, 1.2, length(vPoint / vec2(1.05, 2.2))));

  /** Layers the shadow over the grid */
  float alpha = shadow + grid * (1.0 - shadow);
  vec3 color = (uShadowColor * shadow + uGridColor * grid * (1.0 - shadow)) / max(alpha, 0.0001);

  gl_FragColor = vec4(color, alpha);

  #include <colorspace_fragment>
}
