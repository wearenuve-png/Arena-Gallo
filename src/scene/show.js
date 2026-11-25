import * as THREE from 'three';

/* Montaje de la Noche de Apertura: lo que tendría una inauguración real.
   - fuegos fríos (máquinas de chispas) a lo largo del frente del escenario, que se encienden por momentos
   - confeti dorado, blanco y rojo cayendo despacio sobre la pista
   - franja LED en el frente del escenario con el nombre y la fecha
   Todo con partículas en la GPU: no cuesta casi nada por cuadro. */

const STAGE_FRONT = -21.08; // borde del escenario (z)
const DECK_Y = 1.6;

const ledGrid = (g, w, h, pitch = 3) => {
  g.fillStyle = 'rgba(0,0,0,0.5)';
  for (let x = 0; x < w; x += pitch) g.fillRect(x, 0, 1, h);
  for (let y = 0; y < h; y += pitch) g.fillRect(0, y, w, 1);
};

function fasciaTexture(text, brand) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 88;
  const g = c.getContext('2d');
  g.fillStyle = '#0a0809'; g.fillRect(0, 0, 2048, 88);
  if ('fontStretch' in g) g.fontStretch = 'extra-condensed';
  g.textBaseline = 'middle';
  let x = 24;
  const lh = 60;
  while (x < 2048) {
    if (brand) {
      const w = (brand.width / brand.height) * lh;
      g.drawImage(brand, x, (88 - lh) / 2, w, lh);
      x += w + 34;
    }
    g.fillStyle = '#f6efe2'; g.font = '800 58px Archivo, sans-serif';
    g.fillText(text, x, 47);
    x += g.measureText(text).width + 34;
    g.fillStyle = '#e0182d'; g.fillRect(x - 6, 38, 12, 12);
    x += 40;
  }
  ledGrid(g, 2048, 88);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function openingShow({ brand = null, fascia = 'NOCHE DE APERTURA' } = {}) {
  const group = new THREE.Group();
  const uniforms = { uTime: { value: 0 }, uOn: { value: 1 }, uVH: { value: 900 } };

  /* ── franja LED en el frente del escenario ── */
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(26.6, 1.05),
    new THREE.MeshBasicMaterial({ map: fasciaTexture(fascia, brand), toneMapped: false }),
  );
  strip.material.color.setScalar(0.85);
  strip.position.set(0, 0.8, STAGE_FRONT - 0.01);
  group.add(strip);

  /* ── fuegos fríos: 8 máquinas al borde del escenario ── */
  const MACHINES = 8;
  const PER = 460;
  const boxMat = new THREE.MeshStandardMaterial({ color: '#121214', roughness: 0.6, metalness: 0.3 });
  const boxGeo = new THREE.BoxGeometry(0.42, 0.3, 0.42);
  const base = new Float32Array(MACHINES * PER * 3);
  const rnd = new Float32Array(MACHINES * PER * 4);
  let r = 1234567;
  const rand = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (let m = 0; m < MACHINES; m++) {
    const x = -11.6 + (23.2 * m) / (MACHINES - 1);
    const z = STAGE_FRONT - 0.55;
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(x, DECK_Y + 0.15, z);
    group.add(box);
    for (let k = 0; k < PER; k++) {
      const i = m * PER + k;
      base[i * 3] = x; base[i * 3 + 1] = DECK_Y + 0.32; base[i * 3 + 2] = z;
      rnd[i * 4] = rand(); rnd[i * 4 + 1] = rand() * Math.PI * 2; rnd[i * 4 + 2] = Math.pow(rand(), 1.6); rnd[i * 4 + 3] = rand();
    }
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(base, 3));
  sparkGeo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
  const sparks = new THREE.Points(sparkGeo, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `
      uniform float uTime; uniform float uOn; uniform float uVH;
      attribute vec4 aRnd; varying float vU; varying float vA;
      void main(){
        float sp = (6.4 + aRnd.w * 3.0) * (0.6 + 0.4 * uOn);       // velocidad de salida: 2 a 4.5 m de alto
        float life = 2.0 * sp / 9.8;
        float t = mod(uTime * (0.9 + aRnd.w * 0.2) + aRnd.x * 9.0, life);
        vec3 v = vec3(cos(aRnd.y), 0.0, sin(aRnd.y)) * aRnd.z * 0.85;
        vec3 p = position + v * t + vec3(0.0, sp * t - 4.9 * t * t, 0.0);
        vU = t / life;
        vA = step(fract(aRnd.x * 13.7), uOn);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.6, 0.075 * uVH * 0.5 * projectionMatrix[1][1] / -mv.z);
      }`,
    fragmentShader: `
      varying float vU; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5 || vA < 0.5) discard;
        vec3 hot = vec3(1.0, 0.93, 0.78) * 3.4;
        vec3 cool = vec3(1.0, 0.56, 0.2) * 1.3;
        vec3 c = mix(hot, cool, smoothstep(0.15, 0.95, vU));
        gl_FragColor = vec4(c, smoothstep(0.5, 0.05, d) * (1.0 - vU * 0.8));
      }`,
  }));
  sparks.frustumCulled = false;
  group.add(sparks);
  // las chispas iluminan el frente del escenario
  const glow = new THREE.PointLight('#ffc27a', 0, 24, 1.8);
  glow.position.set(0, DECK_Y + 2, STAGE_FRONT + 1);
  group.add(glow);

  /* ── confeti sobre la pista ── */
  const N = 1700;
  const cp = new Float32Array(N * 3);
  const ca = new Float32Array(N * 4);
  const cc = new Float32Array(N * 3);
  const PAL = ['#e9b44c', '#e9b44c', '#f4ede0', '#f4ede0', '#d4142a', '#c9ccd4'].map((h) => new THREE.Color(h));
  for (let i = 0; i < N; i++) {
    ca[i * 4] = (rand() - 0.5) * 30;            // x
    ca[i * 4 + 1] = -19 + rand() * 36;          // z: de la valla al fondo de la pista
    ca[i * 4 + 2] = rand();                     // fase
    ca[i * 4 + 3] = 0.45 + rand() * 0.45;       // velocidad de caída
    const col = PAL[(rand() * PAL.length) | 0];
    cc[i * 3] = col.r; cc[i * 3 + 1] = col.g; cc[i * 3 + 2] = col.b;
  }
  const confGeo = new THREE.BufferGeometry();
  confGeo.setAttribute('position', new THREE.BufferAttribute(cp, 3));
  confGeo.setAttribute('aP', new THREE.BufferAttribute(ca, 4));
  confGeo.setAttribute('aCol', new THREE.BufferAttribute(cc, 3));
  const confetti = new THREE.Points(confGeo, new THREE.ShaderMaterial({
    uniforms, fog: false,
    vertexShader: `
      uniform float uTime; uniform float uVH;
      attribute vec4 aP; attribute vec3 aCol;
      varying vec3 vC; varying float vR; varying float vF;
      void main(){
        float H = 24.0;
        float y = 0.3 + H - mod(uTime * aP.w + aP.z * H * 7.0, H);
        vec3 p = vec3(aP.x + sin(uTime * 1.1 + aP.z * 40.0) * 0.6, y, aP.y + cos(uTime * 0.9 + aP.z * 30.0) * 0.4);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.2, 0.12 * uVH * 0.5 * projectionMatrix[1][1] / -mv.z);
        vR = uTime * (1.5 + aP.z * 3.0) + aP.z * 50.0;
        vF = abs(sin(uTime * (2.5 + aP.z * 4.0) + aP.z * 70.0));   // el papel gira: a ratos de canto, a ratos refleja
        vC = aCol;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vR; varying float vF;
      void main(){
        vec2 q = gl_PointCoord - 0.5;
        float c = cos(vR); float s = sin(vR);
        q = mat2(c, -s, s, c) * q;
        if (abs(q.x) > 0.42 || abs(q.y) > 0.06 + 0.16 * vF) discard;
        gl_FragColor = vec4(vC * (0.3 + 1.25 * vF * vF), 1.0);
      }`,
  }));
  confetti.frustumCulled = false;
  group.add(confetti);

  return {
    group,
    // fuegos fríos por momentos (8 s encendidos de cada 13); `still` los deja encendidos (renders)
    update(t, vh, still = false) {
      uniforms.uTime.value = t;
      if (vh) uniforms.uVH.value = vh;
      const ph = t % 13;
      const on = still ? 1 : THREE.MathUtils.smoothstep(ph, 0, 0.8) * (1 - THREE.MathUtils.smoothstep(ph, 7.4, 8.6));
      uniforms.uOn.value = on;
      glow.intensity = on * 140;
    },
  };
}
