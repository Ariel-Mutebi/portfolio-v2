uniform sampler2D uHeight;
uniform float uMinElevation;
uniform float uMaxElevation;
uniform float uExaggeration;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying float vElevation;

void main() {
  vUv = uv;
  
  vec2 flippedUv = vec2(uv.x, 1.0 - uv.y);
  
  float stored = texture2D(uHeight, flippedUv).r;
  float elevation = mix(uMinElevation, uMaxElevation, stored);
  vElevation = elevation;
  
  float normalizedHeight = (elevation - uMinElevation) / max(1.0, uMaxElevation - uMinElevation);
  
  // Adjust this to make mountains taller/shorter. 
  float heightScale = 0.1;
  
  // Fade out displacement at the edges to avoid vertical cliffs at the plane boundary
  float edgeFade = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x) * smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
  
  vec3 displaced = position;
  displaced.z += normalizedHeight * heightScale * uExaggeration * edgeFade;

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
