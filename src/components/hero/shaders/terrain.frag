uniform sampler2D uHeight;
uniform vec2 uCover;
uniform float uMinElevation;
uniform float uMaxElevation;
uniform vec3 uFieldColor;
uniform vec3 uMinorColor;
uniform vec3 uIndexColor;
varying vec2 vUv;
uniform vec2 uTexel;
uniform float uMetersPerPixel;
uniform float uExaggeration;
uniform float uReal;
uniform vec3 uLowColor;
uniform vec3 uMidColor;
uniform sampler2D uWater;
uniform vec3 uWaterColor;
uniform vec3 uWaterMapColor;
uniform vec3 uRockColor;
uniform vec3 uSnowColor;
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;

/**
 * Converts the stored 0 to 1 value back to meters. This undoes the squeeze
 * the bake script applied, using the min and max from terrain.json.
 */
float elevationAt(vec2 uv) {
  return mix(uMinElevation, uMaxElevation, texture2D(uHeight, uv).r);
}

/**
 * Returns 1.0 on a contour line and 0.0 elsewhere.
 * f counts how many intervals up we are, so whole numbers are the lines.
 * fwidth(f) is how much f changes across one screen pixel, which turns
 * the distance to the nearest line into a distance measured in pixels.
 */
float contour(float elevation, float interval, float halfWidthPx) {
  float f = elevation / interval;
  float distancePx = abs(fract(f - 0.5) - 0.5) / fwidth(f);
  float line = 1.0 - smoothstep(halfWidthPx - 0.5, halfWidthPx + 0.5, distancePx);

  /**
   * fwidth(f) is also how many lines fit in one pixel. Above 0.5 they are
   * closer than 2 pixels apart, so fade them out instead of blurring together.
   */
  float crowded = 1.0 - smoothstep(0.25, 0.5, fwidth(f));
  return line * crowded;
}

/**
 * Computes the direction the ground faces at a point. x points east, y points north,
 * z points up. Texture v increases southward (row 0 of our data is the north edge),
 * so the north-south slope has its sign flipped relative to the v direction.
 */
vec3 terrainNormal(vec2 uv, float exaggeration) {
  vec2 offset = uTexel * 2.0;
  float east = elevationAt(uv + vec2(offset.x, 0.0));
  float west = elevationAt(uv - vec2(offset.x, 0.0));
  float north = elevationAt(uv - vec2(0.0, offset.y));
  float south = elevationAt(uv + vec2(0.0, offset.y));
  float run = 4.0 * uMetersPerPixel;
  return normalize(vec3(-(east - west) / run * exaggeration, -(north - south) / run * exaggeration, 1.0));
}

/**
 * Colors the ground by height: lowland vegetation, then foothills, then bare rock, then
 * snow near the summits. Steep slopes are pushed toward rock separately, in main.
 */
vec3 heightTint(float elevation) {
  vec3 color = mix(uLowColor, uMidColor, smoothstep(1000.0, 2600.0, elevation));
  color = mix(color, uRockColor, smoothstep(2800.0, 3800.0, elevation));
  return mix(color, uSnowColor, smoothstep(4200.0, 4800.0, elevation));
}

/**
 * Marches from this pixel toward the sun across the terrain. At each step the sun ray
 * climbs a little. If the ground there is higher than the ray, the sun is blocked. Heights
 * use the same exaggeration as the lighting, so at an exaggeration of zero nothing casts a
 * shadow. Returns 1.0 in sun and 0.0 in shadow, with a soft edge. Texture v increases
 * southward, so moving toward a northern sun means subtracting from v.
 */
float castShadow(vec2 uv, float startElevation, vec3 lightDir) {
  vec2 stepDir = normalize(vec2(lightDir.x, -lightDir.y));
  float stepPx = 8.0;
  float stepMeters = stepPx * uMetersPerPixel;
  float tanSun = lightDir.z / length(lightDir.xy);
  float shadow = 1.0;
  for (int i = 1; i <= 24; i++) {
    float fi = float(i);
    vec2 sampleUv = uv + stepDir * uTexel * stepPx * fi;
    float ground = (elevationAt(sampleUv) - startElevation) * uExaggeration;
    float ray = fi * stepMeters * tanSun;
    shadow = min(shadow, smoothstep(-40.0, 40.0, ray - ground));
  }
  return shadow;
}

/**
 * Positive on ridges and bumps, negative in valleys and hollows. Compares the height here
 * with the average of four points radiusPx away, expressed as a slope. Darkening hollows
 * and brightening ridges fakes ambient occlusion, which gives valleys their depth.
 */
float cavity(vec2 uv, float radiusPx) {
  vec2 r = uTexel * radiusPx;
  float around = 0.25 * (
    elevationAt(uv + vec2(r.x, 0.0)) + elevationAt(uv - vec2(r.x, 0.0)) +
    elevationAt(uv + vec2(0.0, r.y)) + elevationAt(uv - vec2(0.0, r.y))
  );
  return clamp((elevationAt(uv) - around) / (radiusPx * uMetersPerPixel) * 3.0, -1.0, 1.0);
}

void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;
  uv.y = 1.0 - uv.y;

  float elevation = elevationAt(uv);
  float water = texture2D(uWater, uv).r;
  float edge = max(fwidth(water), 0.001);
  float waterMask = smoothstep(0.5 - edge, 0.5 + edge, water);
  float coast = 1.0 - smoothstep(0.5, 1.5, abs(water - 0.5) / edge);

  /** Map state: no contour lines inside lakes, and the shoreline drawn as one bold line. */
  float minor = contour(elevation, 100.0, 0.6) * (1.0 - waterMask);
  float index = contour(elevation, 500.0, 1.1) * (1.0 - waterMask);
  vec3 mapColor = mix(mix(uFieldColor, uMinorColor, minor), uIndexColor, index);
  mapColor = mix(mapColor, uWaterMapColor, waterMask);
  mapColor = mix(mapColor, uIndexColor, coast * 0.8);

  /**
   * Real state. The surface color (albedo) shifts toward rock on steep slopes and darkens
   * in hollows. The light is a warm direct sun, switched off in cast shadows, plus a cool
   * ambient fill that never goes fully dark.
   */
  vec3 lightDir = normalize(vec3(-0.6, 0.6, 0.8));
  vec3 normal = terrainNormal(uv, uExaggeration);
  float direct = clamp(dot(normal, lightDir) / lightDir.z, 0.0, 1.6);
  float shadow = castShadow(uv, elevation, lightDir);
  float steep = 1.0 - normal.z;
  float hollow = cavity(uv, 10.0) * clamp(uExaggeration, 0.0, 1.0);

  vec3 albedo = heightTint(elevation);
  albedo = mix(albedo, uRockColor, smoothstep(0.2, 0.5, steep));
  albedo *= 1.0 + 0.35 * hollow;

  vec3 light = uAmbientColor + uSunColor * direct * shadow;
  vec3 realColor = mix(albedo * light, uWaterColor, waterMask);

  /** A gentle darkening toward the screen edges pulls the eye to the center. */
  realColor *= mix(0.7, 1.0, smoothstep(1.2, 0.3, length(vUv - 0.5)));

  vec3 color = mix(mapColor, realColor, uReal);

  /** A little noise breaks up color banding and adds grain. */
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  gl_FragColor = vec4(color + grain * 0.02, 1.0);
  #include <colorspace_fragment>
}
