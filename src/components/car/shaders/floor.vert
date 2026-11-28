varying vec2 vPoint;

void main() {
  vPoint = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
