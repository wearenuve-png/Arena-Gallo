import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* Haz de luz volumétrico: brillante al centro, bordes que se desvanecen según el ángulo de vista,
   caída a lo largo del haz y un poco de "humo" que se mueve. */
export const beamUniforms = { time: { value: 0 } };
export function beamMaterial(color, strength = 0.2) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { c: { value: new THREE.Color(color) }, k: { value: strength }, time: beamUniforms.time },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = -mv.xyz; vW = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 c; uniform float k; uniform float time; varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float n3(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){
        float facing = clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
        float edge = pow(facing, 2.2);                       // bordes suaves
        float along = pow(clamp(vUv.y, 0.0, 1.0), 1.35);     // más intenso cerca del foco (clamp: evita NaN en el borde)
        float haze = 0.55 + 0.45 * n3(vW * 0.22 + vec3(0.0, time * 0.25, time * 0.1)); // humo
        gl_FragColor = vec4(c, clamp(edge * along * haze * k, 0.0, 1.0));
      }`,
  });
}

/* tramo de truss cuadrado de celosía (a lo largo de X), como las estructuras de escenario reales */
export function trussGeometry(L, s = 0.48, r = 0.028) {
  const parts = [];
  const tube = (a, b, rad) => {
    const A = new THREE.Vector3(...a); const B = new THREE.Vector3(...b);
    const g = new THREE.CylinderGeometry(rad, rad, A.distanceTo(B), 6, 1, true);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    parts.push(g);
  };
  const h = s / 2;
  const corners = [[-h, -h], [h, -h], [h, h], [-h, h]];
  for (const [y, z] of corners) tube([-L / 2, y, z], [L / 2, y, z], r);
  const n = Math.max(1, Math.round(L / s));
  const step = L / n;
  for (let i = 0; i < n; i++) {
    const x0 = -L / 2 + i * step; const x1 = x0 + step; const z = i % 2 ? 1 : -1;
    for (let f = 0; f < 4; f++) {
      const [ya, za] = corners[f]; const [yb, zb] = corners[(f + 1) % 4];
      tube(z > 0 ? [x0, ya, za] : [x0, yb, zb], z > 0 ? [x1, yb, zb] : [x1, ya, za], r * 0.6);
    }
  }
  return mergeGeometries(parts);
}
