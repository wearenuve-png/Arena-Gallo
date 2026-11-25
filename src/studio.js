import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildInterior } from './seating.js';
import { sup, A_MAX } from './config.js';

/* Estudio de render: arma el recinto y saca capturas desde cámaras fijas. */
const W = 1440;
const H = 810;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1.5);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#07070a');
scene.fog = new THREE.FogExp2('#07070a', 0.0032);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1500);

await document.fonts.load('800 80px Archivo');
await document.fonts.load('600 40px Archivo');

const arena = buildInterior();
scene.add(arena.group, arena.lights);

/* ── sombras ── */
const sun = arena.lights.children.find((l) => l.isDirectionalLight);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 10, far: 220 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
arena.group.traverse((o) => {
  if (!o.isMesh) return;
  const m = o.material;
  const basic = m.isMeshBasicMaterial || m.isShaderMaterial || m.transparent;
  o.castShadow = !basic;
  o.receiveShadow = !basic;
});

/* ── techo con estructura y luces colgantes (como en el video) ── */
const ceiling = new THREE.Group();
{
  const roof = new THREE.Mesh(
    new THREE.PlaneGeometry(170, 180),
    new THREE.MeshStandardMaterial({ color: '#0e0e13', roughness: 0.95, side: THREE.DoubleSide })
  );
  roof.rotation.x = Math.PI / 2;
  roof.position.y = 47;
  ceiling.add(roof);
  const trussMat = new THREE.MeshStandardMaterial({ color: '#2a2a31', roughness: 0.6, metalness: 0.6 });
  const step = 9;
  const xs = []; for (let x = -72; x <= 72; x += step) xs.push(x);
  const zs = []; for (let z = -76; z <= 76; z += step) zs.push(z);
  const beamsX = new THREE.InstancedMesh(new THREE.BoxGeometry(150, 0.9, 0.45), trussMat, zs.length);
  zs.forEach((z, i) => { beamsX.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, 44.5, z)); });
  const beamsZ = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.9, 160), trussMat, xs.length);
  xs.forEach((x, i) => { beamsZ.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 44.2, 0)); });
  ceiling.add(beamsX, beamsZ);
  // focos en cada cruce
  const pts = [];
  for (const x of xs) for (const z of zs) {
    const p = new THREE.Vector2(x, z);
    if (Math.pow(Math.abs(x / 62), 2.6) + Math.pow(Math.abs(z / 70), 2.6) < 1) pts.push(p);
  }
  const lamps = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.25, 16),
    new THREE.MeshBasicMaterial({ color: '#fff1dc', toneMapped: false }),
    pts.length
  );
  pts.forEach((p, i) => lamps.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, 43.6, p.y)));
  ceiling.add(lamps);
  // marcador central colgante con anillo LED rojo
  const hung = new THREE.Mesh(new THREE.BoxGeometry(11, 4.5, 9), new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.4, metalness: 0.5 }));
  hung.position.set(0, 36, 2);
  const ring = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.35, 9.2), new THREE.MeshBasicMaterial({ color: '#ff2a44', toneMapped: false }));
  ring.position.set(0, 33.9, 2);
  const cables = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 8, 6), trussMat);
  cables.position.set(0, 40.2, 2);
  ceiling.add(hung, ring, cables);
  // luces de concierto: haces largos desde la estructura hacia la pista
  const beamMat = (c) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { c: { value: new THREE.Color(c) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec2 vUv; uniform vec3 c; void main(){ float a=pow(vUv.y,2.2)*0.16; gl_FragColor=vec4(c,a); }',
  });
  const cols = ['#ff2a44', '#7aa7ff', '#ffe0b0', '#ff2a44', '#ffd06b', '#7aa7ff'];
  cols.forEach((c, i) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 48, 24, 1, true).translate(0, -24, 0), beamMat(c));
    cone.position.set(-20 + i * 8, 43, -22);
    cone.rotation.set(0.55 + (i % 2) * 0.1, 0, (i - 2.5) * 0.18);
    ceiling.add(cone);
  });
}
scene.add(ceiling);

/* ── letreros en las fachadas de cada nivel (como en el video) ── */
function bandTexture(text, { bg = '#111114', fg = '#f4f1ea', accent = '#df001c' } = {}) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 2048, 128);
  g.font = '800 64px Archivo, sans-serif';
  g.textBaseline = 'middle';
  g.fillStyle = fg;
  const parts = text.split('|');
  let x = 60;
  for (const p of parts) {
    g.fillText(p.trim(), x, 68);
    x += g.measureText(p.trim()).width + 50;
    g.fillStyle = accent; g.beginPath(); g.arc(x, 66, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = fg; x += 50;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return { tex: t, repeatW: x };
}
function band(d, y0, y1, text, opts) {
  const { tex, repeatW } = bandTexture(text, opts);
  const metersPerRepeat = (repeatW / 128) * (y1 - y0);
  const S = 240;
  const pts = [];
  const cum = [0];
  for (let k = 0; k <= S; k++) {
    const p = sup(-A_MAX + (2 * A_MAX * k) / S, d).clone();
    if (k) cum.push(cum[k - 1] + p.distanceTo(pts[k - 1]));
    pts.push(p);
  }
  const total = cum[S];
  const pos = [];
  const uv = [];
  for (let k = 0; k < S; k++) {
    const a = pts[k]; const b = pts[k + 1];
    const ua = (total - cum[k]) / metersPerRepeat;
    const ub = (total - cum[k + 1]) / metersPerRepeat;
    pos.push(a.x, y0, a.y, b.x, y0, b.y, b.x, y1, b.y, a.x, y0, a.y, b.x, y1, b.y, a.x, y1, a.y);
    uv.push(ua, 0, ub, 0, ub, 1, ua, 0, ub, 1, ua, 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false }));
  mesh.material.color.setScalar(0.85);
  scene.add(mesh);
}
band(14.37, 7.18, 8.12, 'PLATEA BAJA|DESDE Q800|ARENA GALLO');
band(16.62, 10.86, 11.5, 'ARENA GALLO|SUITES VIP|DESDE Q2,400', { bg: '#17130b', fg: '#ffd98a', accent: '#df001c' });
band(27.97, 14.05, 14.98, 'CLUB GALLO|DESDE Q1,100', { bg: '#141011' });
band(30.57, 17.35, 18.4, 'PLATEA ALTA|DESDE Q340|ARENA GALLO');

/* ── posproceso ── */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(1.5);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 30, aperture: 0.0006, maxblur: 0.008 });
composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.6, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());
// gradación de color + viñeta + grano de película (en espacio de pantalla)
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, seed: { value: 1.0 }, vig: { value: 0.55 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float seed; uniform float vig; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      float ca = 0.0015 * length(d) * 2.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + d * ca).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - d * ca).b;
      float l = dot(col, vec3(0.299,0.587,0.114));
      col = mix(vec3(l), col, 0.86);                                   // menos saturación
      col = mix(col * vec3(0.92,0.97,1.06), col * vec3(1.06,0.98,0.9), smoothstep(0.15,0.75,l)); // sombras frías, luces cálidas
      col = pow(col, vec3(1.08));                                      // más contraste
      col *= 1.0 - vig * smoothstep(0.35, 0.95, length(d * vec2(1.15, 1.0)));
      col += (rnd(vUv * 1000.0) - 0.5) * 0.045;                        // grano
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(grade);

/* ── asientos elegidos: dos libres juntos en la sección 118 ── */
const sec118 = arena.byId.get('118');
let picked = [];
for (const row of [6, 5, 7, 4, 8, 3, 9]) {
  const seats = sec118.seats.filter((s) => s.row === row);
  const mid = Math.floor(seats.length / 2);
  const order = seats.map((s, i) => i).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  for (const i of order) {
    if (i + 1 < seats.length && !seats[i].sold && !seats[i + 1].sold) { picked = [seats[i], seats[i + 1]]; break; }
  }
  if (picked.length) break;
}
picked.forEach((s) => arena.setSelected(s, true));
// marcador rojo flotante sobre cada asiento elegido
for (const s of picked) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.06, 12, 40),
    new THREE.MeshBasicMaterial({ color: '#ff1f3d', toneMapped: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(s.pos).add(new THREE.Vector3(0, 1.75, 0));
  const pin = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.42, 20),
    new THREE.MeshBasicMaterial({ color: '#ff1f3d', toneMapped: false })
  );
  pin.rotation.x = Math.PI;
  pin.position.copy(s.pos).add(new THREE.Vector3(0, 2.25, 0));
  const glow = new THREE.PointLight('#ff1f3d', 6, 4, 2);
  glow.position.copy(s.pos).add(new THREE.Vector3(0, 1.4, 0));
  ring.scale.setScalar(1.7);
  pin.scale.setScalar(1.8);
  pin.position.y += 0.5;
  scene.add(ring, pin, glow);
  window.__markers = (window.__markers || []).concat([ring, pin]);
}

/* ── cámaras ── */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function presets() {
  const c = sec118.center;
  const inw = sec118.inward;
  const suite = arena.byId.get('S25');
  const seat = picked[0];
  return {
    cenital: { pos: V(0, 178, 52), look: V(0, 0, -4), fov: 38 },
    mapa: { pos: V(0, 232, 70), look: V(0, 0, -3), fov: 38 },
    interior: { pos: V(0, 29, 53), look: V(0, 3, -24), fov: 58 },
    seccion: { pos: c.clone().addScaledVector(inw, 19).add(V(0, 10, 0)), look: c.clone().add(V(0, -1.5, 0)), fov: 46 },
    suites: { pos: suite.center.clone().addScaledVector(suite.inward, 12).add(V(0, 0.8, 0)), look: suite.center.clone().add(V(0, -0.6, 0)), fov: 52 },
    asiento: { pos: seat.pos.clone().add(V(0, 1.5, 0)), look: V(0, 4, -30), fov: 60 },
  };
}
function apply(name) {
  const p = presets()[name];
  // en la vista desde el asiento no se ven los marcadores
  for (const m of window.__markers || []) m.visible = name !== 'asiento';
  camera.position.copy(p.pos);
  camera.fov = p.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(p.look);
  // vista cenital: sin techo ni desenfoque; vistas internas: techo, bruma y profundidad de campo
  const top = name === 'mapa' || name === 'cenital';
  ceiling.visible = !top;
  scene.fog.color.set(top ? '#07070a' : '#140e13');
  scene.fog.density = top ? 0.0032 : 0.0055;
  const focusOn = { interior: V(0, 3, -24), seccion: picked[0].pos, suites: arena.byId.get('S25').center, asiento: V(0, 6, -30) }[name];
  bokeh.uniforms.focus.value = focusOn ? camera.position.distanceTo(focusOn) : 50;
  bokeh.uniforms.aperture.value = { seccion: 0.00025, suites: 0.0004, asiento: 0.00022 }[name] || 0;
  bokeh.uniforms.maxblur.value = top || name === 'interior' ? 0 : 0.0035;
  grade.uniforms.seed.value = Math.random() * 10;
  arena.update(1.3);
  composer.render();
}

window.shot = async (name) => {
  apply(name);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  const res = await fetch(`/__save?name=${name}`, { method: 'POST', body: blob });
  return res.ok;
};
window.view = apply;
// proyecta un punto 3D a píxeles CSS (1440×810) para una cámara dada
window.proj = (name, what) => {
  apply(name);
  let p;
  if (what === 'sel') p = picked[0].pos.clone().add(new THREE.Vector3(0, 0.6, 0));
  else p = arena.byId.get(what).center.clone();
  p.project(camera);
  return { x: Math.round((p.x + 1) / 2 * W), y: Math.round((1 - p.y) / 2 * H) };
};
window.picked = picked.map((s) => ({ id: s.id, row: s.row, num: s.num, price: s.price }));
window.totals = arena.levelTotals();
window.ready = true;

apply(location.hash.slice(1) || 'cenital');
