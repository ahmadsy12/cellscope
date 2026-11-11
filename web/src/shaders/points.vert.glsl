attribute float aCluster;
uniform float uWorldSize;
uniform float uPxPerUnit;
uniform float uHighlight;
uniform vec3 uPalette[12];

varying vec3 vColor;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = uWorldSize;
  int code = min(int(aCluster + 0.5), 11);
  vColor = uPalette[code];

  if (uHighlight >= 0.0 && abs(aCluster - uHighlight) < 0.5) {
    size *= 1.6;
    vColor = mix(vColor, vec3(1.0), 0.3);
  }

  gl_PointSize = size * uPxPerUnit / -mv.z;
}