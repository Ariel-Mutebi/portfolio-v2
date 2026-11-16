uniform sampler2D uHeight;
uniform float uMinElevation;
uniform float uMaxElevation;
uniform vec3 uFieldColor;
uniform vec3 uMinorColor;
uniform vec3 uIndexColor;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vElevation;
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
uniform vec3 uSkyColor;
uniform float uTime;

float elevationAt(vec2 uv) {
  return mix(uMinElevation, uMaxElevation, texture2D(uHeight, uv).r);
}

// OPTIMIZATION: Simplified from 9-tap to 5-tap cross
float mapElevationAt(vec2 uv) {
  vec2 offset = uTexel * 3.0; 
  float center = elevationAt(uv);
  float n = elevationAt(uv - vec2(0.0, offset.y));
  float s = elevationAt(uv + vec2(0.0, offset.y));
  float e = elevationAt(uv + vec2(offset.x, 0.0));
  float w = elevationAt(uv - vec2(offset.x, 0.0));
  return (center * 2.0 + n + s + e + w) / 6.0;
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

vec3 terrainNormal(vec2 uv, float exaggeration) {
  vec2 offset = uTexel * 2.0;
  float east = elevationAt(uv + vec2(offset.x, 0.0));
  float west = elevationAt(uv - vec2(offset.x, 0.0));
  float north = elevationAt(uv - vec2(0.0, offset.y));
  float south = elevationAt(uv + vec2(0.0, offset.y));
  float run = 4.0 * uMetersPerPixel;
  return normalize(vec3(-(east - west) / run * exaggeration, -(north - south) / run * exaggeration, 1.0));
}

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

// OPTIMIZATION: Reduced from 4 octaves to 3 for clouds/water
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) { 
        value += amplitude * noise2(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

vec3 heightTint(float elevation, vec2 uv) {
  float n = fbm(uv * 40.0) * 0.15;
  vec3 color = mix(uLowColor, uMidColor, smoothstep(800.0, 2400.0, elevation));
  color = mix(color, uRockColor, smoothstep(2600.0, 3600.0, elevation));
  color = mix(color, uSnowColor, smoothstep(4000.0 + n * 1000.0, 4600.0 + n * 1000.0, elevation));
  return color * (1.0 + n);
}

// OPTIMIZATION: Halved loop iterations (32 -> 16) and doubled step size
float castShadow(vec2 uv, float startElevation, vec3 lightDir) {
  vec2 stepDir = normalize(vec2(lightDir.x, -lightDir.y));
  float stepPx = 8.0; 
  float stepMeters = stepPx * uMetersPerPixel;
  float tanSun = lightDir.z / length(lightDir.xy);
  float shadow = 1.0;
  for (int i = 1; i <= 16; i++) {
    float fi = float(i);
    vec2 sampleUv = uv + stepDir * uTexel * stepPx * fi;
    float ground = (elevationAt(sampleUv) - startElevation) * uExaggeration;
    float ray = fi * stepMeters * tanSun;
    shadow = min(shadow, smoothstep(-40.0, 40.0, ray - ground));
  }
  return shadow;
}

void main() {
  vec2 uv = vUv;
  uv.y = 1.0 - uv.y;

  float elevation = vElevation;
  float smoothElevation = mapElevationAt(uv); 
  
  float water = texture2D(uWater, uv).r;
  float edge = max(fwidth(water), 0.001);
  float waterMask = smoothstep(0.5 - edge, 0.5 + edge, water);
  float coast = 1.0 - smoothstep(0.5, 1.5, abs(water - 0.5) / edge);
  
  // OPTIMIZATION: Calculate normal once, reuse for both states
  vec3 normal = terrainNormal(uv, uExaggeration); 

  /* --- MAP STATE --- */
  float minor = contour(smoothElevation, 100.0, 1.0) * (1.0 - waterMask);
  float index = contour(smoothElevation, 500.0, 1.5) * (1.0 - waterMask);
  
  vec3 mapColor = mix(mix(uFieldColor, uMinorColor, minor), uIndexColor, index);
  mapColor = mix(mapColor, uWaterMapColor, waterMask);
  mapColor = mix(mapColor, uIndexColor, coast * 0.8);

  // Dampen the normal for map hillshade
  vec3 mapLightDir = normalize(vec3(-1.0, 1.0, 1.0));
  float mapHillshade = clamp(dot(normal, mapLightDir), 0.4, 1.0);
  mapColor *= mix(1.0, mapHillshade, 0.15);

  /* --- REAL STATE --- */
  vec3 lightDir = normalize(vec3(-0.6, 0.6, 0.8));
  float direct = clamp(dot(normal, lightDir) / lightDir.z, 0.0, 1.6);
  float shadow = castShadow(uv, elevation, lightDir);
  float steep = 1.0 - normal.z;

  vec3 albedo = heightTint(elevation, uv);
  albedo = mix(albedo, uRockColor, smoothstep(0.2, 0.5, steep));

  vec3 groundAmbient = uLowColor * 0.1;
  vec3 skyAmbient = uSkyColor * 0.4;
  vec3 ambient = mix(groundAmbient, skyAmbient, normal.y * 0.5 + 0.5);
  
  vec3 light = ambient + uSunColor * direct * shadow;
  vec3 realColor = albedo * light;

  // REALISTIC WATER
  if (waterMask > 0.0) {
      vec2 waveUv = vWorldPosition.xy * 40.0; 
      float wave = fbm(waveUv) * 0.5; 
      
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(vec3(0.0, 0.0, 1.0), viewDir), 0.0), 4.0);
      vec3 waterAlbedo = mix(uWaterColor, uSkyColor, 0.4 + fresnel * 0.6);
      
      vec3 halfVec = normalize(lightDir + viewDir);
      float spec = pow(max(dot(vec3(0.0, 0.0, 1.0), halfVec), 0.0), 40.0) * wave;
      
      vec3 waterRealColor = waterAlbedo + (uSunColor * spec * 0.5);
      waterRealColor *= mix(0.5, 1.0, shadow); 
      
      realColor = mix(realColor, waterRealColor, waterMask);
  }

  // CLOUDS
  vec2 cloudUv = uv * 6.0 + vec2(uTime * 0.05, uTime * 0.02); 
  float cloudNoise = fbm(cloudUv);
  
  float cloudMask = smoothstep(0.1, 0.4, cloudNoise);
  cloudMask *= uReal; 
  
  float cloudShadow = smoothstep(0.0, 0.3, fbm(cloudUv + vec2(0.05, 0.05)));
  realColor *= mix(0.7, 1.0, cloudShadow);

  vec3 cloudColor = uSunColor * 1.2 + uSkyColor * 0.5;
  realColor = mix(realColor, cloudColor, cloudMask * 0.65);

  realColor *= mix(0.7, 1.0, smoothstep(1.5, 0.3, length(vUv - 0.5)));

  /* --- BLEND & FINISH --- */
  vec3 color = mix(mapColor, realColor, uReal);

  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  gl_FragColor = vec4(color + grain * 0.02, 1.0);
  #include <colorspace_fragment>
}
