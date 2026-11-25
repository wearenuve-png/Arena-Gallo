import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createCrowd } from './scene/people.js';
import { beamMaterial, beamUniforms, trussGeometry } from './scene/fx.js';
import { openingShow } from './scene/show.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {
  FLOOR, A_MAX, WALL_D, SEAT_W, sup, LEVELS, seatPrice, mulberry32, SHIRTS, SKINS,
} from './config.js';

const SOLD_COLOR = new THREE.Color('#2a2a31');
const SELECT_COLOR = new THREE.Color(2.4, 1.72, 0.32); // dorado que brilla (HDR): tu asiento resalta entre todos
const WHITE = new THREE.Color('#ffffff');
const FOCUS = new THREE.Vector3(0, 0, -16);

/* ───────── utilidades de curva ───────── */
function arcTable(d, a0, a1, N = 480) {
  const al = [a0];
  const len = [0];
  let prev = sup(a0, d).clone();
  for (let i = 1; i <= N; i++) {
    const a = a0 + ((a1 - a0) * i) / N;
    const p = sup(a, d);
    len.push(len[i - 1] + p.distanceTo(prev));
    prev.copy(p);
    al.push(a);
  }
  return { al, len, total: len[N] };
}
function alphaAt(tab, s) {
  let lo = 0;
  let hi = tab.len.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (tab.len[m] <= s) lo = m; else hi = m;
  }
  const t = (s - tab.len[lo]) / (tab.len[hi] - tab.len[lo] || 1);
  return tab.al[lo] + (tab.al[hi] - tab.al[lo]) * t;
}
function P(alpha, d, y) {
  const p = sup(alpha, d);
  return new THREE.Vector3(p.x, y, p.y);
}
const _e1 = new THREE.Vector3(); const _e2 = new THREE.Vector3(); const _n = new THREE.Vector3(); const _t = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
function quadBuilder() {
  const pos = [];
  const uv = [];
  return {
    quad(a, b, c, d) {
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
      // UV en metros: proyección horizontal para pisos, vertical para contrahuellas
      _n.crossVectors(_e1.subVectors(b, a), _e2.subVectors(d, a)).normalize();
      const flat = Math.abs(_n.y) > 0.7;
      if (!flat) _t.crossVectors(UP, _n).normalize();
      for (const p of [a, b, c, a, c, d]) {
        if (flat) uv.push(p.x, p.z); else uv.push(p.dot(_t), p.y);
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      return g;
    },
  };
}

/* ───────── geometrías de silla y persona ───────── */
/* butaca de estadio: concha de plástico moldeada + pedestal y descansabrazos metálicos.
   El color de vértice separa plástico (1) de metal (oscuro); el color por instancia da la zona. */
function makeSeatGeometry() {
  const tint = (g, v) => {
    const n = g.attributes.position.count;
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(v), 3));
    return g;
  };
  const pan = new RoundedBoxGeometry(0.46, 0.06, 0.42, 1, 0.024);
  pan.rotateX(-0.06); pan.translate(0, 0.42, 0.01);
  const back = new RoundedBoxGeometry(0.46, 0.5, 0.05, 1, 0.022);
  back.rotateX(-0.14); back.translate(0, 0.71, -0.215);
  const lip = new THREE.BoxGeometry(0.42, 0.05, 0.07);
  lip.rotateX(-0.14); lip.translate(0, 0.94, -0.245);
  const post = new THREE.BoxGeometry(0.045, 0.4, 0.045); post.translate(0, 0.2, -0.13);
  const foot = new THREE.BoxGeometry(0.16, 0.02, 0.16); foot.translate(0, 0.01, -0.13);
  const armPost = new THREE.BoxGeometry(0.03, 0.26, 0.03); armPost.translate(0.265, 0.5, -0.14);
  const arm = new THREE.BoxGeometry(0.045, 0.035, 0.32); arm.translate(0.265, 0.635, -0.03);
  const plastic = [pan, back, lip].map((g) => tint(g, 1));
  const metal = [post, foot, armPost, arm].map((g) => tint(g.index ? g : g, 0.14));
  return mergeGeometries([...plastic, ...metal].map((g) => (g.index ? g.toNonIndexed() : g)));
}

/* texturas PBR (CC0, ambientCG) */
const texLoader = new THREE.TextureLoader();
function pbr(name, { repeat = 1, srgb = true } = {}) {
  const t = texLoader.load(`/assets/tex/${name}.jpg`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function makeBodyGeometry() {
  const torso = new THREE.CapsuleGeometry(0.17, 0.26, 2, 7); torso.scale(1.05, 1, 0.68); torso.translate(0, 0.8, -0.06);
  const thighs = new THREE.CapsuleGeometry(0.08, 0.3, 1, 5); thighs.rotateX(Math.PI / 2);
  const thighL = thighs.clone().translate(-0.09, 0.52, 0.12);
  const thighR = thighs.clone().translate(0.09, 0.52, 0.12);
  const shin = new THREE.CapsuleGeometry(0.065, 0.3, 1, 5);
  const shinL = shin.clone().translate(-0.09, 0.27, 0.32);
  const shinR = shin.clone().translate(0.09, 0.27, 0.32);
  const arm = new THREE.CapsuleGeometry(0.055, 0.32, 1, 5); arm.rotateX(0.5);
  const armL = arm.clone().translate(-0.23, 0.74, 0.02);
  const armR = arm.clone().translate(0.23, 0.74, 0.02);
  return mergeGeometries([torso, thighL, thighR, shinL, shinR, armL, armR]);
}
function makeHeadGeometry() {
  const h = new THREE.SphereGeometry(0.115, 8, 6);
  h.scale(0.92, 1.08, 1);
  h.translate(0, 1.24, -0.04);
  return h;
}

/* ───────── textura del telón LED ───────── */
function screenTexture(lines = ['NOCHE DE', 'APERTURA'], brand = null, sponsor = null) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 480;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 480);
  grad.addColorStop(0, '#12060a'); grad.addColorStop(1, '#3a0610');
  g.fillStyle = grad; g.fillRect(0, 0, 1024, 480);
  // ondas
  g.strokeStyle = 'rgba(223,0,28,0.55)'; g.lineWidth = 3;
  for (let k = 0; k < 9; k++) {
    g.beginPath();
    for (let x = 0; x <= 1024; x += 8) {
      const y = 330 + k * 14 + Math.sin(x / 90 + k * 0.6) * (16 + k * 3);
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.fillStyle = '#fff'; g.textAlign = 'center';
  if ('fontStretch' in g) g.fontStretch = 'extra-condensed';
  if (brand && sponsor) {
    // arriba, los dos logos juntos: Arena Gallo | Johnson Castillo Network
    const h = 70; const w = (brand.width / brand.height) * h;
    const h2 = 58; const w2 = (sponsor.width / sponsor.height) * h2;
    const gap = 34; const x0 = 512 - (w + gap * 2 + 2 + w2) / 2;
    g.drawImage(brand, x0, 62, w, h);
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x0 + w + gap, 66, 2, 62);
    g.drawImage(sponsor, x0 + w + gap * 2 + 2, 62 + (h - h2) / 2, w2, h2);
    g.fillStyle = '#fff';
  } else if (brand) {
    const h = 70; const w = (brand.width / brand.height) * h;
    g.drawImage(brand, 512 - w / 2, 62, w, h);
  } else {
    g.font = '700 30px Archivo, sans-serif'; g.fillText('ARENA GALLO  ·  CAYALÁ', 512, 120);
  }
  // el texto nunca se sale de la pantalla: se mide y se reduce si hace falta
  const fit = (txt, size, maxW = 900) => {
    g.font = `800 ${size}px Archivo, sans-serif`;
    const w = g.measureText(txt).width;
    if (w > maxW) { size = Math.floor((size * maxW) / w); g.font = `800 ${size}px Archivo, sans-serif`; }
    return size;
  };
  if (lines.length === 1) {
    const size = fit(lines[0], Math.min(200, Math.floor((900 / Math.max(4, lines[0].length)) * 2.1)));
    g.fillText(lines[0], 512, 250 + size * 0.3);
  } else {
    fit(lines[0], 120); g.fillText(lines[0], 512, 220);
    fit(lines[1], 120); g.fillText(lines[1], 512, 330);
  }
  // rejilla de píxeles del LED
  g.fillStyle = 'rgba(0,0,0,0.35)';
  for (let x = 0; x < 1024; x += 3) g.fillRect(x, 0, 1, 480);
  for (let y = 0; y < 480; y += 3) g.fillRect(0, y, 1024, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* pantallas laterales (verticales): el nombre en palabras apiladas, sin estirar la imagen de la central */
function sideTexture(lines = ['NOCHE DE', 'APERTURA'], brand = null) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 810;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 810);
  grad.addColorStop(0, '#12060a'); grad.addColorStop(1, '#3a0610');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 810);
  g.strokeStyle = 'rgba(223,0,28,0.5)'; g.lineWidth = 3;
  for (let k = 0; k < 7; k++) {
    g.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y = 660 + k * 16 + Math.sin(x / 70 + k * 0.7) * (12 + k * 3);
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  if ('fontStretch' in g) g.fontStretch = 'extra-condensed';
  if (brand) { const h = 54; const w = (brand.width / brand.height) * h; g.drawImage(brand, 256 - w / 2, 70, w, h); }
  const words = lines.join(' ').split(/\s+/).filter(Boolean).slice(0, 4);
  const sizes = words.map((w) => { let s = 150; g.font = `800 ${s}px Archivo, sans-serif`; const mw = g.measureText(w).width; if (mw > 440) s = Math.floor((s * 440) / mw); return s; });
  const total = sizes.reduce((a, s) => a + s * 0.92, 0);
  let y = 400 - total / 2;
  words.forEach((w, i) => { y += sizes[i] * 0.92; g.font = `800 ${sizes[i]}px Archivo, sans-serif`; g.fillText(w, 256, y); });
  g.fillStyle = 'rgba(0,0,0,0.35)';
  for (let x = 0; x < 512; x += 3) g.fillRect(x, 0, 1, 810);
  for (let yy = 0; yy < 810; yy += 3) g.fillRect(0, yy, 512, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const RUNS = [1, 2, 2, 2, 3, 3, 4, 4, 5, 6]; // tamaño de los grupos que compran juntos

/* ═════════════════ CONSTRUCCIÓN DEL INTERIOR ═════════════════ */
export function buildInterior(opts = {}) {
  const soldSet = new Set(opts.soldIds || []);
  const priceFn = opts.price || null;
  const group = new THREE.Group();
  const rand = mulberry32(opts.seed ?? 2027);
  const sections = [];
  const byId = new Map();
  const proxies = [];

  const seatGeo = makeSeatGeometry();
  const bodyGeo = makeBodyGeometry();
  const headGeo = makeHeadGeometry();
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.42, metalness: 0.08,
    normalMap: pbr('Plastic006_NormalGL', { repeat: 3, srgb: false }), roughnessMap: pbr('Plastic006_Roughness', { repeat: 3, srgb: false }),
  });
  seatMat.normalScale.set(0.35, 0.35);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const proxyMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  // público realista (si se cargaron los personajes); si no, siluetas simples
  const crowd = opts.people ? createCrowd(opts.people, { rand }) : null;
  if (crowd) group.add(crowd.group);
  const shirtCols = SHIRTS.map((c) => new THREE.Color(c));
  const skinCols = SKINS.map((c) => new THREE.Color(c));

  /* ── sección genérica ── */
  function makeSection({ id, level, kind, name, count }) {
    const sec = {
      id, level, kind, name, seats: [], hover: false, dim: false,
      avail: 0, total: 0, minPrice: Infinity, maxPrice: 0, mesh: null,
    };
    sections.push(sec);
    byId.set(String(id), sec);
    return sec;
  }

  function finalizeSection(sec) {
    const n = sec.seats.length;
    const mesh = new THREE.InstancedMesh(seatGeo, seatMat, n);
    const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, crowd ? 1 : n);
    const heads = new THREE.InstancedMesh(headGeo, headMat, crowd ? 1 : n);
    bodies.frustumCulled = false; heads.frustumCulled = false;
    bodies.raycast = () => {}; heads.raycast = () => {};
    sec.seats.forEach((s, i) => {
      s.idx = i;
      dummy.position.copy(s.pos);
      dummy.rotation.set(0, s.rotY, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, WHITE);
    });
    bodies.count = 0; heads.count = 0;
    bodies.setColorAt(0, WHITE); heads.setColorAt(0, WHITE);
    mesh.userData.section = sec;
    sec.mesh = mesh; sec.bodies = bodies; sec.heads = heads;
    group.add(mesh, bodies, heads);
    sec.seats.forEach((s) => {
      if (s.sold) addPerson(sec, s);
      sec.total++;
      if (!s.sold) sec.avail++;
      sec.minPrice = Math.min(sec.minPrice, s.price);
      sec.maxPrice = Math.max(sec.maxPrice, s.price);
    });
    paint(sec);
  }

  function addPerson(sec, seat) {
    if (crowd) { crowd.add({ pos: seat.pos, rotY: seat.rotY, kind: 'sit', sec }); return; }
    const k = sec.bodies.count;
    dummy.position.copy(seat.pos);
    dummy.rotation.set(0, seat.rotY, 0);
    dummy.scale.set(0.95 + rand() * 0.15, 0.94 + rand() * 0.14, 0.95 + rand() * 0.1);
    dummy.updateMatrix();
    sec.bodies.setMatrixAt(k, dummy.matrix);
    sec.heads.setMatrixAt(k, dummy.matrix);
    sec.bodies.setColorAt(k, shirtCols[(rand() * shirtCols.length) | 0]);
    sec.heads.setColorAt(k, skinCols[(rand() * skinCols.length) | 0]);
    sec.bodies.count = k + 1; sec.heads.count = k + 1;
    sec.bodies.instanceMatrix.needsUpdate = true; sec.heads.instanceMatrix.needsUpdate = true;
    sec.bodies.instanceColor.needsUpdate = true; sec.heads.instanceColor.needsUpdate = true;
  }

  function paint(sec) {
    if (!sec.mesh) return;
    const base = new THREE.Color(sec.level.color);
    for (const s of sec.seats) {
      if (s.selected) col.copy(SELECT_COLOR);
      else if (s.sold) { col.copy(SOLD_COLOR); if (sec.dim) col.multiplyScalar(0.6); }
      else {
        col.copy(base);
        if (sec.hover) col.lerp(WHITE, 0.42);
        if (sec.dim) col.multiplyScalar(0.3);
      }
      sec.mesh.setColorAt(s.idx, col);
    }
    sec.mesh.instanceColor.needsUpdate = true;
  }

  /* ── niveles de asientos ── */
  function buildSeatLevel(L) {
    const dMid = L.d0 + (L.rows * L.rowD) / 2;
    const tab = arcTable(dMid, -A_MAX, A_MAX);
    const per = tab.total / L.sections;
    const aisle = 0.55;
    for (let i = 0; i < L.sections; i++) {
      const id = L.first + i;
      const sec = makeSection({ id, level: L, kind: 'seat', name: `Sección ${id}` });
      const a0 = alphaAt(tab, i * per + aisle);
      const a1 = alphaAt(tab, (i + 1) * per - aisle);
      const pSec = THREE.MathUtils.clamp(L.sold + (rand() - 0.5) * 0.34, 0.12, 0.99);
      sec.alpha0 = a0; sec.alpha1 = a1; sec.alphaMid = (a0 + a1) / 2;
      for (let r = 0; r < L.rows; r++) {
        const d = L.d0 + r * L.rowD + L.rowD * 0.55;
        const y = L.h0 + r * L.rise;
        const K = 14;
        const pts = [];
        const cum = [0];
        for (let k = 0; k <= K; k++) {
          const p = sup(a0 + ((a1 - a0) * k) / K, d).clone();
          pts.push(p);
          if (k) cum.push(cum[k - 1] + p.distanceTo(pts[k - 1]));
        }
        const total = cum[K];
        const n = Math.max(3, Math.floor(total / SEAT_W));
        const rowFactor = 1.1 - 0.28 * (r / Math.max(1, L.rows - 1));
        // la gente compra en grupos (parejas, familias, amigos): lo vendido y lo libre viene en tramos, no salteado
        const soldRow = [];
        while (soldRow.length < n) {
          const len = RUNS[(rand() * RUNS.length) | 0];
          const v = rand() < pSec * rowFactor;
          for (let q = 0; q < len; q++) soldRow.push(v);
        }
        for (let i2 = 0; i2 < n; i2++) {
          const s = ((i2 + 0.5) * total) / n;
          let k = 0;
          while (k < K - 1 && cum[k + 1] < s) k++;
          const t = (s - cum[k]) / (cum[k + 1] - cum[k] || 1);
          const x = pts[k].x + (pts[k + 1].x - pts[k].x) * t;
          const z = pts[k].y + (pts[k + 1].y - pts[k].y) * t;
          const seat = {
            id: `${id}-${r + 1}-${i2 + 1}`,
            sec, row: r + 1, num: i2 + 1,
            pos: new THREE.Vector3(x, y, z),
            rotY: Math.atan2(FOCUS.x - x, FOCUS.z - z),
            price: priceFn ? priceFn(L.id, r, L.rows) : seatPrice(L, r),
            sold: soldRow[i2] || soldSet.has(`${id}-${r + 1}-${i2 + 1}`),
            selected: false,
          };
          sec.seats.push(seat);
        }
      }
      finalizeSection(sec);
      // centro y proxy
      const am = (a0 + a1) / 2;
      const dm = L.d0 + (L.rows * L.rowD) / 2;
      const ym = L.h0 + (L.rows * L.rise) / 2;
      const c2 = sup(am, dm);
      sec.center = new THREE.Vector3(c2.x, ym, c2.y);
      sec.inward = new THREE.Vector3(-c2.x, 0, -c2.y).normalize();
      // proxy sobre el terreno inclinado
      const qb = quadBuilder();
      const dEnd = L.d0 + L.rows * L.rowD;
      const yEnd = L.h0 + (L.rows - 1) * L.rise + 0.5;
      const KP = 8;
      for (let k = 0; k < KP; k++) {
        const b0 = a0 + ((a1 - a0) * k) / KP;
        const b1 = a0 + ((a1 - a0) * (k + 1)) / KP;
        qb.quad(P(b0, L.d0, L.h0 + 0.4), P(b1, L.d0, L.h0 + 0.4), P(b1, dEnd, yEnd), P(b0, dEnd, yEnd));
      }
      const proxy = new THREE.Mesh(qb.build(), proxyMat);
      proxy.userData.section = sec; sec.proxy = proxy;
      proxies.push(proxy);
      group.add(proxy);
    }
  }

  buildSeatLevel(LEVELS.lower);
  buildSeatLevel(LEVELS.club);
  buildSeatLevel(LEVELS.upper);

  /* ── pasillos: luz en cada escalón y pasamanos al centro ── */
  (function aisles() {
    const stepGeo = new THREE.BoxGeometry(0.16, 0.025, 0.02);
    const railMat = new THREE.MeshStandardMaterial({ color: '#8d8a84', roughness: 0.35, metalness: 0.9 });
    const steps = []; const rails = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (const key of ['lower', 'club', 'upper']) {
      const L = LEVELS[key];
      const secs = sections.filter((x) => x.level === L && x.alphaMid != null).sort((x, y) => x.alpha0 - y.alpha0);
      for (let i = 1; i < secs.length; i++) {
        const a = (secs[i - 1].alpha1 + secs[i].alpha0) / 2;
        for (let r = 0; r < L.rows; r++) {
          const dIn = L.d0 + r * L.rowD;
          const y = L.h0 + r * L.rise;
          for (const off of [-0.32, 0.32]) {
            // dos luces por escalón, a los lados del pasamanos
            const p0 = P(a, dIn + 0.012, y - 0.06);
            const t = P(a + 0.004, dIn, y).sub(P(a - 0.004, dIn, y)).normalize();
            const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), new THREE.Vector3(-p0.x, 0, -p0.z).normalize(), up);
            m.setPosition(p0.clone().addScaledVector(t, off));
            steps.push(m);
          }
        }
        // pasamanos inclinado del primer al último escalón
        const dEnd = L.d0 + L.rows * L.rowD;
        const yTop = L.h0 + (L.rows - 1) * L.rise;
        const A = P(a, L.d0 + 0.35, L.h0 + 0.92);
        const B = P(a, dEnd - 0.35, yTop + 0.92);
        const len = A.distanceTo(B);
        const mid = A.clone().add(B).multiplyScalar(0.5);
        const q = new THREE.Quaternion().setFromUnitVectors(up, B.clone().sub(A).normalize());
        rails.push(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, len, 1)));
        for (const E of [A, B]) rails.push(new THREE.Matrix4().compose(E.clone().add(new THREE.Vector3(0, -0.46, 0)), new THREE.Quaternion(), new THREE.Vector3(1, 0.92, 1)));
      }
    }
    const stepMesh = new THREE.InstancedMesh(stepGeo, new THREE.MeshBasicMaterial({ color: '#ffd9a8', toneMapped: false }), steps.length);
    steps.forEach((m, i) => stepMesh.setMatrixAt(i, m));
    const railMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.024, 0.024, 1, 8), railMat, rails.length);
    rails.forEach((m, i) => railMesh.setMatrixAt(i, m));
    stepMesh.raycast = () => {}; railMesh.raycast = () => {};
    group.add(stepMesh, railMesh);
  })();

  /* ── suites ── */
  const suiteWalls = [];
  const suiteRoofs = [];
  const suiteGold = [];
  const suiteGlass = [];
  (function buildSuites() {
    const L = LEVELS.suites;
    const dMid = L.d0 + L.depth / 2;
    const tab = arcTable(dMid, -A_MAX, A_MAX);
    const per = tab.total / L.count;
    for (let i = 0; i < L.count; i++) {
      const id = 'S' + String(i + 1).padStart(2, '0');
      const sec = makeSection({ id, level: L, kind: 'suite', name: `Suite ${i + 1}` });
      const am = alphaAt(tab, (i + 0.5) * per);
      sec.alphaMid = am;
      const p = sup(am, dMid);
      const pa = sup(am - 0.004, dMid);
      const pb = sup(am + 0.004, dMid);
      const tan = new THREE.Vector2(pb.x - pa.x, pb.y - pa.y).normalize();
      let nx = -tan.y; let nz = tan.x;
      if (nx * -p.x + nz * -p.y < 0) { nx = -nx; nz = -nz; }
      const rotY = Math.atan2(nx, nz);
      const w = per - 0.5;
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(p.x, L.floorY, p.y),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
        new THREE.Vector3(1, 1, 1)
      );
      const part = (geo, list) => { geo.applyMatrix4(m); list.push(geo); };
      const dp = L.depth; const h = L.height;
      const back = new THREE.BoxGeometry(w, h, 0.18); back.translate(0, h / 2, -dp / 2); part(back, suiteWalls);
      const sideL = new THREE.BoxGeometry(0.12, h, dp); sideL.translate(-w / 2, h / 2, 0); part(sideL, suiteWalls);
      const sideR = new THREE.BoxGeometry(0.12, h, dp); sideR.translate(w / 2, h / 2, 0); part(sideR, suiteWalls);
      const roof = new THREE.BoxGeometry(w + 0.2, 0.22, dp + 0.2); roof.translate(0, h + 0.11, 0); part(roof, suiteRoofs);
      const trim = new THREE.BoxGeometry(w + 0.2, 0.1, 0.1); trim.translate(0, h - 0.02, dp / 2 + 0.1); part(trim, suiteGold);
      const rail = new THREE.BoxGeometry(w, 1.0, 0.05); rail.translate(0, 0.5, dp / 2 - 0.05); part(rail, suiteGlass);

      // asientos: 2 filas, tantas columnas como quepan a lo ancho de la suite
      const cols = Math.max(5, Math.round(L.perSuite / 2));
      const pSuite = rand();
      const fully = pSuite < L.sold * 0.9;
      const partial = !fully && pSuite < L.sold;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < cols; c++) {
          const lx = -w / 2 + (w * (c + 0.5)) / cols;
          const lz = r === 0 ? dp / 2 - 1.15 : dp / 2 - 2.55;
          const ly = r === 0 ? 0.0 : 0.38;
          const wp = new THREE.Vector3(lx, ly, lz).applyMatrix4(m);
          sec.seats.push({
            id: `${id}-${r + 1}-${c + 1}`, sec, row: r + 1, num: c + 1, pos: wp, rotY,
            price: priceFn ? priceFn('suites', r, 2) : L.price + (r === 0 ? 100 : 0),
            sold: fully || (partial && rand() < 0.4) || soldSet.has(`${id}-${r + 1}-${c + 1}`), selected: false,
          });
        }
      }
      finalizeSection(sec);
      sec.center = new THREE.Vector3(p.x, L.floorY + 1.2, p.y);
      sec.inward = new THREE.Vector3(nx, 0, nz).normalize();
      const pg = new THREE.BoxGeometry(w, h, dp); pg.translate(0, h / 2, 0);
      const proxy = new THREE.Mesh(pg, proxyMat);
      proxy.position.set(p.x, L.floorY, p.y); proxy.rotation.y = rotY;
      proxy.userData.section = sec; sec.proxy = proxy;
      proxies.push(proxy); group.add(proxy);
    }
  })();

  const wallsMat = new THREE.MeshStandardMaterial({
    color: '#b0643a', roughness: 0.7, metalness: 0.02, emissive: '#5a2410', emissiveIntensity: 0.22,
    normalMap: pbr('Fabric030_NormalGL', { repeat: 2, srgb: false }),
  });
  wallsMat.normalScale.set(0.4, 0.4);
  group.add(new THREE.Mesh(mergeGeometries(suiteWalls), wallsMat));
  // techos de los palcos: losa de concreto oscuro (desde Club se ven desde arriba)
  group.add(new THREE.Mesh(mergeGeometries(suiteRoofs), new THREE.MeshStandardMaterial({
    color: '#26241f', roughness: 0.92,
    map: pbr('Concrete034_Color', { repeat: 0.35 }), normalMap: pbr('Concrete034_NormalGL', { repeat: 0.35, srgb: false }),
    normalScale: new THREE.Vector2(0.25, 0.25),
  })));
  group.add(new THREE.Mesh(mergeGeometries(suiteGold), new THREE.MeshBasicMaterial({ color: '#ffcf6b' })));
  group.add(new THREE.Mesh(
    mergeGeometries(suiteGlass),
    new THREE.MeshBasicMaterial({ color: '#dfe9ee', transparent: true, opacity: 0.06, depthWrite: false })
  ));

  /* ── estructura: gradas, cubiertas, pared ── */
  const concrete = new THREE.MeshStandardMaterial({
    color: '#5a5a62', roughness: 1, metalness: 0.02, side: THREE.DoubleSide,
    map: pbr('Concrete034_Color', { repeat: 0.45 }),
    normalMap: pbr('Concrete034_NormalGL', { repeat: 0.45, srgb: false }),
    roughnessMap: pbr('Concrete034_Roughness', { repeat: 0.45, srgb: false }),
    normalScale: new THREE.Vector2(0.45, 0.45),
  });
  function stepsGeometry(L) {
    const qb = quadBuilder();
    const S = 200;
    for (let k = 0; k < S; k++) {
      const a0 = -A_MAX + (2 * A_MAX * k) / S;
      const a1 = -A_MAX + (2 * A_MAX * (k + 1)) / S;
      for (let r = 0; r < L.rows; r++) {
        const dIn = L.d0 + r * L.rowD;
        const dOut = dIn + L.rowD;
        const y = L.h0 + r * L.rise;
        const yPrev = r === 0 ? 0 : L.h0 + (r - 1) * L.rise;
        qb.quad(P(a0, dIn, y), P(a1, dIn, y), P(a1, dOut, y), P(a0, dOut, y));
        qb.quad(P(a0, dIn, yPrev), P(a1, dIn, yPrev), P(a1, dIn, y), P(a0, dIn, y));
      }
      const dEnd = L.d0 + L.rows * L.rowD;
      const yTop = L.h0 + (L.rows - 1) * L.rise;
      qb.quad(P(a0, dEnd, yTop), P(a1, dEnd, yTop), P(a1, dEnd, yTop + 1.1), P(a0, dEnd, yTop + 1.1));
    }
    for (const aEnd of [-A_MAX, A_MAX]) {
      for (let r = 0; r < L.rows; r++) {
        const dIn = L.d0 + r * L.rowD;
        const dOut = dIn + L.rowD;
        const y = L.h0 + r * L.rise;
        qb.quad(P(aEnd, dIn, 0), P(aEnd, dOut, 0), P(aEnd, dOut, y), P(aEnd, dIn, y));
      }
    }
    return qb.build();
  }
  for (const key of ['lower', 'club', 'upper']) group.add(new THREE.Mesh(stepsGeometry(LEVELS[key]), concrete));

  function deck(dIn, dOut, y) {
    const qb = quadBuilder();
    const S = 120;
    for (let k = 0; k < S; k++) {
      const a0 = -A_MAX + (2 * A_MAX * k) / S;
      const a1 = -A_MAX + (2 * A_MAX * (k + 1)) / S;
      qb.quad(P(a0, dIn, y), P(a1, dIn, y), P(a1, dOut, y), P(a0, dOut, y));
    }
    return new THREE.Mesh(qb.build(), concrete);
  }
  group.add(deck(14.4, 22.7, 7.55));
  group.add(deck(28.0, 30.7, 14.7));
  group.add(deck(36.7, WALL_D + 0.2, 23.2));

  // franjas luminosas en el borde de cada nivel (como la maqueta)
  function glowStrip(d, y, color, h = 0.12) {
    const qb = quadBuilder();
    const S = 200;
    for (let k = 0; k < S; k++) {
      const a0 = -A_MAX + (2 * A_MAX * k) / S;
      const a1 = -A_MAX + (2 * A_MAX * (k + 1)) / S;
      qb.quad(P(a0, d, y), P(a1, d, y), P(a1, d, y + h), P(a0, d, y + h));
    }
    const m = new THREE.Mesh(qb.build(), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    return m;
  }
  group.add(glowStrip(LEVELS.lower.d0 - 0.02, 0.62, '#ffffff', 0.1));
  group.add(glowStrip(LEVELS.lower.d0 - 0.02, 0.0, '#e0182d', 0.55));
  group.add(glowStrip(LEVELS.club.d0 - 0.02, 10.4, '#ffd9a0', 0.1));
  group.add(glowStrip(LEVELS.upper.d0 - 0.02, 17.9, '#bcd3ff', 0.1));
  group.add(glowStrip(14.4, 7.2, '#ffffff', 0.09));
  group.add(glowStrip(28.0, 14.6, '#ffd9a0', 0.09));

  // pared perimetral completa
  (function wall() {
    const qb = quadBuilder();
    const S = 260;
    for (let k = 0; k < S; k++) {
      const a0 = (Math.PI * 2 * k) / S;
      const a1 = (Math.PI * 2 * (k + 1)) / S;
      qb.quad(P(a0, WALL_D, 0), P(a1, WALL_D, 0), P(a1, WALL_D, 36), P(a0, WALL_D, 36));
    }
    // solo la cara interior: desde adentro es la pared del recinto; desde arriba no tapa las gradas
    group.add(new THREE.Mesh(qb.build(), new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.8, side: THREE.BackSide })));
    const ring = new THREE.Mesh(
      (() => { const q = quadBuilder(); for (let k = 0; k < S; k++) { const a0 = (Math.PI * 2 * k) / S; const a1 = (Math.PI * 2 * (k + 1)) / S; q.quad(P(a0, WALL_D - 0.05, 33), P(a1, WALL_D - 0.05, 33), P(a1, WALL_D - 0.05, 33.4), P(a0, WALL_D - 0.05, 33.4)); } return q.build(); })(),
      new THREE.MeshBasicMaterial({ color: '#df001c', side: THREE.BackSide })
    );
    group.add(ring);
  })();

  /* ── piso ── */
  (function floors() {
    const shape = new THREE.Shape();
    for (let k = 0; k <= 220; k++) {
      const p = sup((Math.PI * 2 * k) / 220, WALL_D);
      if (k === 0) shape.moveTo(p.x, p.y); else shape.lineTo(p.x, p.y);
    }
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2); // y del shape → -z
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      color: '#2a2a2f', roughness: 0.95, metalness: 0.0,
      map: pbr('Concrete034_Color', { repeat: 0.12 }),
      normalMap: pbr('Concrete034_NormalGL', { repeat: 0.12, srgb: false }),
      normalScale: new THREE.Vector2(0.35, 0.35),
    }));
    m.position.y = -0.02;
    group.add(m);

    const s2 = new THREE.Shape();
    for (let k = 0; k <= 160; k++) {
      const p = sup((Math.PI * 2 * k) / 160, 0.6);
      if (k === 0) s2.moveTo(p.x, p.y); else s2.lineTo(p.x, p.y);
    }
    const g2 = new THREE.ShapeGeometry(s2); g2.rotateX(-Math.PI / 2);
    const m2 = new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ color: '#1a1a20', roughness: 0.5, metalness: 0.2 }));
    m2.position.y = 0.01;
    group.add(m2);
  })();

  /* ── pista general (zona seleccionable) ── */
  const gaLevel = LEVELS.ga;
  const ga = {
    id: 'GA', level: gaLevel, kind: 'ga', name: 'Pista General', seats: [],
    total: gaLevel.capacity,
    avail: gaLevel.capacity - Math.round(gaLevel.capacity * gaLevel.sold),
    minPrice: priceFn ? priceFn('ga', 0, 1) : gaLevel.price, maxPrice: priceFn ? priceFn('ga', 0, 1) : gaLevel.price, hover: false, dim: false,
    center: new THREE.Vector3(0, 0.6, 0), inward: new THREE.Vector3(0, 0, 1),
  };
  sections.push(ga); byId.set('GA', ga);
  const gaMat = new THREE.MeshBasicMaterial({ color: '#df001c', transparent: true, opacity: 0.16, depthWrite: false });
  const gaMesh = new THREE.Mesh(new THREE.PlaneGeometry(24, 38.4).rotateX(-Math.PI / 2), gaMat);
  gaMesh.position.set(0, 0.04, -0.4);
  gaMesh.userData.section = ga; ga.proxy = gaMesh;
  group.add(gaMesh); proxies.push(gaMesh);
  ga.paint = () => {
    gaMat.opacity = ga.dim ? 0.0 : ga.hover ? 0.3 : 0.06;
  };

  // público de pie
  const crowdMax = 2000;
  const crowdBody = new THREE.InstancedMesh(
    mergeGeometries([new THREE.CylinderGeometry(0.2, 0.17, 0.9, 7).translate(0, 0.75, 0)]),
    bodyMat, crowdMax
  );
  const crowdHead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6).translate(0, 1.38, 0), headMat, crowdMax);
  crowdBody.frustumCulled = false; crowdHead.frustumCulled = false;
  crowdBody.raycast = () => {}; crowdHead.raycast = () => {};
  crowdBody.count = 0; crowdHead.count = 0;
  crowdBody.setColorAt(0, WHITE); crowdHead.setColorAt(0, WHITE);
  function addCrowd(n) {
    for (let i = 0; i < n && (crowd ? crowd.size < 14000 : crowdBody.count < crowdMax); i++) {
      let x; let z;
      do {
        x = (rand() * 2 - 1) * 11.6;
        z = -19 + rand() * 37.5;
      } while (Math.pow(Math.abs(x / 12.4), 2.6) + Math.pow(Math.abs(z / 19.6), 2.6) > 1);
      if (crowd) {
        crowd.add({ pos: new THREE.Vector3(x, 0, z), rotY: Math.PI + (rand() - 0.5) * 0.8, kind: 'std', scale: 0.98 });
        continue;
      }
      const k = crowdBody.count;
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, Math.PI + (rand() - 0.5) * 0.8, 0);
      const sc = 0.9 + rand() * 0.2;
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      crowdBody.setMatrixAt(k, dummy.matrix); crowdHead.setMatrixAt(k, dummy.matrix);
      crowdBody.setColorAt(k, shirtCols[(rand() * shirtCols.length) | 0]);
      crowdHead.setColorAt(k, skinCols[(rand() * skinCols.length) | 0]);
      crowdBody.count = k + 1; crowdHead.count = k + 1;
    }
    crowdBody.instanceMatrix.needsUpdate = true; crowdHead.instanceMatrix.needsUpdate = true;
    crowdBody.instanceColor.needsUpdate = true; crowdHead.instanceColor.needsUpdate = true;
  }
  addCrowd(Math.round((gaLevel.capacity - ga.avail) * 0.62));
  group.add(crowdBody, crowdHead);

  /* ── escenario de concierto ── */
  const stage = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({
    color: '#16161a', roughness: 0.55, metalness: 0.45,
    normalMap: pbr('Metal032_NormalGL', { repeat: 2, srgb: false }), roughnessMap: pbr('Metal032_Roughness', { repeat: 2, srgb: false }),
  });
  const cloth = new THREE.MeshStandardMaterial({ color: '#08080a', roughness: 1, metalness: 0, envMapIntensity: 0.2, normalMap: pbr('Fabric030_NormalGL', { repeat: 6, srgb: false }) });
  const stageDeck = new THREE.Mesh(new THREE.BoxGeometry(27, 0.12, 13), new THREE.MeshStandardMaterial({ color: '#111114', roughness: 0.35, metalness: 0.2 }));
  stageDeck.position.set(0, 1.54, -27.6);
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(27, 1.5, 13), cloth); // faldón negro de tela
  skirt.position.set(0, 0.75, -27.6);
  stage.add(stageDeck, skirt);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(27, 0.04, 0.05), new THREE.MeshBasicMaterial({ color: '#ffe9cf', toneMapped: false }));
  lip.position.set(0, 1.6, -21.08);
  stage.add(lip);
  // pantalla LED del fondo con marco y módulos
  const screenTex = screenTexture(opts.screen, opts.brand, opts.sponsor);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(25, 11.7), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.set(0, 8.4, -34.2);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(25.6, 12.3, 0.4), dark);
  frame.position.set(0, 8.4, -34.45);
  stage.add(screen, frame);
  const sideTex = sideTexture(opts.screen, opts.brand);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(6, 9.5), new THREE.MeshBasicMaterial({ map: sideTex, color: '#d8d8d8', toneMapped: false }));
    side.position.set(sx * 17.5, 7.2, -30.5);
    side.rotation.y = -sx * 0.5;
    const sf = new THREE.Mesh(new THREE.BoxGeometry(6.4, 9.9, 0.3), dark);
    sf.position.copy(side.position).add(new THREE.Vector3(Math.sin(-sx * 0.5) * -0.2, 0, Math.cos(sx * 0.5) * -0.2));
    sf.rotation.y = side.rotation.y;
    stage.add(side, sf);
  }
  // estructura de truss de celosía
  const trussMat = new THREE.MeshStandardMaterial({ color: '#9a9aa0', roughness: 0.35, metalness: 0.9 });
  const tH = trussGeometry(31);
  const top = new THREE.Mesh(tH, trussMat); top.position.set(0, 15.5, -24.5); stage.add(top);
  const top2 = new THREE.Mesh(tH, trussMat); top2.position.set(0, 15.5, -31); stage.add(top2);
  const tV = trussGeometry(15.5).rotateZ(Math.PI / 2);
  for (const sx of [-1, 1]) for (const z of [-24.5, -31]) {
    const post = new THREE.Mesh(tV, trussMat); post.position.set(sx * 15.25, 7.75, z); stage.add(post);
  }
  // cabezas móviles colgadas del truss (carcasa negra + lente encendida)
  const headGeoF = new THREE.CylinderGeometry(0.26, 0.3, 0.55, 14);
  const lensGeo = new THREE.CircleGeometry(0.2, 18).rotateX(Math.PI / 2);
  const lensMat = new THREE.MeshBasicMaterial({ color: '#fff4e0', toneMapped: false });
  const beams = [];
  for (let i = 0; i < 9; i++) {
    const x = -13 + i * 3.25;
    const fix = new THREE.Group();
    fix.position.set(x, 15.05, -24.5);
    const head = new THREE.Mesh(headGeoF, dark); head.position.y = -0.2;
    const lens = new THREE.Mesh(lensGeo, lensMat); lens.position.y = -0.48;
    fix.add(head, lens);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 30, 32, 1, true).translate(0, -15, 0), beamMaterial(i % 2 ? '#ff3048' : '#ffe2bd', 0.22));
    cone.position.y = -0.4;
    fix.add(cone);
    fix.userData = { phase: i * 0.7 };
    beams.push(fix); stage.add(fix);
  }
  // columnas de bocinas (line array) colgadas a los lados, con curva en J
  const boxGeo = new THREE.BoxGeometry(1.25, 0.36, 0.75);
  const grill = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.8, metalness: 0.2, normalMap: pbr('Fabric030_NormalGL', { repeat: 2, srgb: false }) });
  for (const sx of [-1, 1]) {
    const arr = new THREE.Group();
    arr.position.set(sx * 17.2, 15.2, -21.8);
    let y = 0; let ang = 0;
    for (let k = 0; k < 12; k++) {
      ang += k < 6 ? 0.012 : 0.05;
      const b = new THREE.Mesh(boxGeo, grill);
      b.position.set(0, y - 0.18, Math.sin(ang) * 0.5 * k * 0.36);
      b.rotation.x = ang;
      arr.add(b);
      y -= 0.37;
    }
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.9), dark); bumper.position.y = 0.06; arr.add(bumper);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 28, 4), trussMat); chain.position.y = 14; arr.add(chain);
    arr.rotation.y = sx * -0.35;
    stage.add(arr);
  }
  // valla frente al escenario
  const fence = new THREE.Group();
  const rail = new THREE.Mesh(new THREE.BoxGeometry(24, 0.06, 0.06), trussMat);
  rail.position.set(0, 1.15, -20.4);
  const rail2 = rail.clone(); rail2.position.y = 0.12;
  fence.add(rail, rail2);
  const barGeo = new THREE.BoxGeometry(0.025, 1.05, 0.025);
  const fenceBars = new THREE.InstancedMesh(barGeo, trussMat, 160);
  for (let i = 0; i < 160; i++) fenceBars.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-12 + (i + 0.5) * (24 / 160), 0.63, -20.4));
  fence.add(fenceBars);
  stage.add(fence);
  // (sin consola de sonido en la pista: en este recinto la mezcla va detrás del escenario, fuera de la vista)
  group.add(stage);
  // montaje especial de la inauguración
  const show = opts.show === 'apertura' ? openingShow({ brand: opts.brand, fascia: opts.fascia }) : null;
  if (show) group.add(show.group);

  /* ── luces: casa a media luz y producción del escenario ── */
  const lights = new THREE.Group();
  lights.add(new THREE.AmbientLight('#8d8da8', 0.32));
  lights.add(new THREE.HemisphereLight('#c9d4ff', '#2a1015', 0.6));
  const dir = new THREE.DirectionalLight('#fff2e2', 1.7); // luces de sala, desde arriba
  dir.position.set(10, 80, 30);
  lights.add(dir);
  const red = new THREE.PointLight('#ff2a44', 700, 120, 1.7);
  red.position.set(0, 14, -26);
  lights.add(red);
  // la pantalla LED ilumina el escenario y las primeras filas
  RectAreaLightUniformsLib.init();
  const ledLight = new THREE.RectAreaLight('#ff5a6a', 3.2, 25, 11.7);
  ledLight.position.set(0, 8.4, -34.0);
  ledLight.lookAt(0, 6, 0);
  lights.add(ledLight);
  // contraluz del escenario hacia el público (siluetas y sombras largas)
  const back = new THREE.SpotLight('#ffd7b0', 1900, 90, 0.75, 0.6, 1.6);
  back.position.set(0, 16, -30);
  back.target.position.set(0, 0, 8);
  back.castShadow = true;
  back.shadow.mapSize.set(2048, 2048);
  back.shadow.bias = -0.0002;
  back.shadow.camera.near = 4; back.shadow.camera.far = 80;
  lights.add(back, back.target);
  // frente: luz cálida desde la consola hacia el escenario
  const frontL = new THREE.SpotLight('#ffe8cc', 1800, 70, 0.32, 0.5, 1.4);
  frontL.position.set(0, 18, 12);
  frontL.target.position.set(0, 2, -27);
  lights.add(frontL, frontL.target);

  /* ── API ── */
  const api = {
    group, lights, sections, byId, proxies, ga, paint,
    levelTotals() {
      const out = {};
      for (const id of Object.keys(LEVELS)) out[id] = { total: 0, avail: 0, min: Infinity, max: 0 };
      for (const s of sections) {
        const t = out[s.level.id];
        t.total += s.total; t.avail += s.avail;
        t.min = Math.min(t.min, s.minPrice); t.max = Math.max(t.max, s.maxPrice);
      }
      return out;
    },
    setSelected(seat, v) { seat.selected = v; paint(seat.sec); },
    markSold(seat) {
      seat.sold = true; seat.selected = false; seat.sec.avail--;
      addPerson(seat.sec, seat); paint(seat.sec);
    },
    buyGA(n) { ga.avail = Math.max(0, ga.avail - n); addCrowd(Math.round(n * 0.7)); },
    setHover(sec, v) {
      if (!sec || sec.hover === v) return;
      sec.hover = v;
      if (sec.kind === 'ga') ga.paint(); else paint(sec);
    },
    setDim(fn) {
      for (const s of sections) {
        const d = fn ? !fn(s) : false;
        if (s.dim !== d) { s.dim = d; if (s.kind === 'ga') ga.paint(); else paint(s); }
      }
    },
    showStill: false,
    lodHold: false,
    update(t, camera, vh) {
      beamUniforms.time.value = t;
      if (show) show.update(t, vh, api.showStill);
      for (const b of beams) {
        const ph = b.userData.phase;
        b.rotation.z = Math.sin(t * 0.6 + ph) * 0.42;
        b.rotation.x = Math.cos(t * 0.45 + ph * 1.3) * 0.26 + 0.28;
      }
      // durante un vuelo de cámara no se reordena el público (evita tirones); al llegar se actualiza una vez
      return crowd && camera && !api.lodHold ? crowd.update(camera) : false;
    },
  };
  ga.paint();
  return api;
}
