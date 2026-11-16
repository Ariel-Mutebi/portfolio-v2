uniform sampler2D uHeight;
uniform sampler2D uNormalMap;
uniform sampler2D uShadowMap;
uniform sampler2D uNoise;
uniform float uMinElevation;
uniform float uMaxElevation;
uniform vec3 uFieldColor;
uniform vec3 uMinorColor;
uniform vec3 uIndexColor;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vElevation;
uniform vec2 uTexel;
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
uniform vec3 uSkyColor;

float elevationAt(vec2 uv) {
  return mix(uMinElevation, uMaxElevation, texture2D(uHeight, uv).r);
}

// Single mip-biased lookup replaces the 5-tap box blur
float mapElevationAt(vec2 uv) {
  return mix(uMinElevation, uMaxElevation, texture2D(uHeight, uv, 3.0).r);
}

float contour(float elevation, float interval, float thicknessPx) {
  float f = elevation / interval;
  float dist = abs(fract(f) - 0.5);
  float fw = max(fwidth(f), 0.002);
  float w = fw * thicknessPx;
  float line = smoothstep(0.5 - w, 0.5 + w, dist);
  float crowded = 1.0 - smoothstep(0.15, 0.35, fw);
  return line * crowded;
}

vec3 heightTint(float elevation, float noise) {
  vec3 color = mix(uLowColor, uMidColor, smoothstep(800.0, 2400.0, elevation));
  color = mix(color, uRockColor, smoothstep(2600.0, 3600.0, elevation));
  color = mix(color, uSnowColor, smoothstep(4000.0 + noise * 1000.0, 4600.0 + noise * 1000.0, elevation));
  return color * (1.0 + noise * 0.15);
}

void main() {
  vec2 uv = vUv;
  uv.y = 1.0 - uv.y;

  float elevation = vElevation;

  vec3 rawNormal = texture2D(uNormalMap, uv).xyz * 2.0 - 1.0;
  rawNormal = normalize(rawNormal);
  vec3 realNormal = normalize(vec3(rawNormal.xy * uExaggeration, rawNormal.z));
  vec3 mapNormal  = normalize(vec3(rawNormal.xy * 0.1, rawNormal.z));

  float shadow = texture2D(uShadowMap, uv).r;

  float water = texture2D(uWater, uv).r;
  float edge = max(fwidth(water), 0.001);
  float waterMask = smoothstep(0.5 - edge, 0.5 + edge, water);
  float coast = 1.0 - smoothstep(0.5, 1.5, abs(water - 0.5) / edge);

  vec3 mapColor = vec3(0.0);
  vec3 realColor = vec3(0.0);

  /* --- MAP STATE --- */
  if (uReal < 0.99) {
    float smoothElevation = mapElevationAt(uv);
    float minor = contour(smoothElevation, 100.0, 1.0) * (1.0 - waterMask);
    float index = contour(smoothElevation, 500.0, 1.5) * (1.0 - waterMask);

    mapColor = mix(mix(uFieldColor, uMinorColor, minor), uIndexColor, index);
    mapColor = mix(mapColor, uWaterMapColor, waterMask);
    mapColor = mix(mapColor, uIndexColor, coast * 0.8);

    vec3 mapLightDir = normalize(vec3(-1.0, 1.0, 1.0));
    float mapHillshade = clamp(dot(mapNormal, mapLightDir), 0.4, 1.0);
    mapColor *= mix(1.0, mapHillshade, 0.15);
  }

  /* --- REAL STATE --- */
  if (uReal > 0.01) {
    vec3 lightDir = normalize(vec3(-0.6, 0.6, 0.8));
    float direct = clamp(dot(realNormal, lightDir) / lightDir.z, 0.0, 1.6);
    float steep = 1.0 - realNormal.z;

    // Tint noise is still used to break up the flat terrain colors
    float tintNoise = texture2D(uNoise, uv * 40.0).b;
    vec3 albedo = heightTint(elevation, tintNoise);
    albedo = mix(albedo, uRockColor, smoothstep(0.2, 0.5, steep));

    vec3 groundAmbient = uLowColor * 0.1;
    vec3 skyAmbient = uSkyColor * 0.4;
    vec3 ambient = mix(groundAmbient, skyAmbient, realNormal.y * 0.5 + 0.5);

    vec3 light = ambient + uSunColor * direct * shadow;
    realColor = albedo * light;

    // FLAT WATER (no waves) — still looks good thanks to Fresnel
    if (waterMask > 0.0) {
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(vec3(0.0, 0.0, 1.0), viewDir), 0.0), 4.0);
      vec3 waterAlbedo = mix(uWaterColor, uSkyColor, 0.4 + fresnel * 0.6);
      vec3 waterRealColor = waterAlbedo * mix(0.5, 1.0, shadow);
      realColor = mix(realColor, waterRealColor, waterMask);
    }

    realColor *= mix(0.7, 1.0, smoothstep(1.5, 0.3, length(vUv - 0.5)));
  }

  /* --- BLEND & FINISH --- */
  vec3 color = mix(mapColor, realColor, uReal);

  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  gl_FragColor = vec4(color + grain * 0.02, 1.0);
  #include <colorspace_fragment>
}
