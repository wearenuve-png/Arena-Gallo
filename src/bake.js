/* Horneador (solo desarrollo): toma los personajes CC0 de Quaternius, los sienta (o los deja de pie),
   les marca regiones de ropa y guarda la geometría lista en /public/assets/people/crowd.bin.
   Abrir /bake.html con `npm run dev`. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const log = (m) => { document.getElementById('log').textContent += m + '\n'; console.log(m); };
const loader = new GLTFLoader();
const load = (f) => new Promise((ok, ko) => loader.load(`/media/people-src/${f}.gltf`, ok, undefined, ko));

/* regiones: 0 piel · 1 camisa · 2 pantalón · 3 zapatos · 4 antebrazo (manga larga o piel)
   5 pantorrilla (pantalón o short) · 6 cabello/cejas · 7 ojos */
function regionFor(bone, p, ref) {
  const n = bone.name;
  if (/head|neck/i.test(n)) return 0;
  if (/hand|thumb|index|middle|ring|pinky/i.test(n)) return 0;
  if (/lowerarm/i.test(n)) return 4;
  if (/upperarm/i.test(n)) return Math.abs(p.x) < ref.shoulderX + 0.14 ? 1 : 4;
  if (/clavicle|spine/i.test(n)) return 1;
  if (/pelvis|root/i.test(n)) return p.y > ref.hipY + 0.06 ? 1 : 2;
  if (/thigh/i.test(n)) return 2;
  if (/calf/i.test(n)) return p.y > ref.kneeY - 0.04 ? 2 : 5;
  if (/foot|ball/i.test(n)) return 3;
  return 1;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
function aim(bone, child, dir) {
  bone.updateWorldMatrix(true, false);
  child.updateWorldMatrix(false, false);
  const a = bone.getWorldPosition(new THREE.Vector3());
  const b = child.getWorldPosition(new THREE.Vector3());
  const cur = b.sub(a).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(cur, dir);
  const wq = bone.getWorldQuaternion(new THREE.Quaternion());
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(pq.invert().multiply(q.multiply(wq)));
  bone.updateMatrixWorld(true);
}

function pose(root, kind) {
  const B = {};
  root.traverse((o) => { if (o.isBone) B[o.name] = o; });
  for (const [s, sx] of [['l', 1], ['r', -1]]) {
    // brazos abajo, pegados al cuerpo
    if (kind === 'sit') {
      aim(B[`upperarm_${s}`], B[`lowerarm_${s}`], V(sx * 0.2, -1, 0.32));
      aim(B[`lowerarm_${s}`], B[`hand_${s}`], V(-sx * 0.22, -0.32, 1));
      aim(B[`hand_${s}`], B[`middle_01_${s}`], V(-sx * 0.1, -0.5, 1));
      aim(B[`thigh_${s}`], B[`calf_${s}`], V(sx * 0.1, -0.07, 1));
      aim(B[`calf_${s}`], B[`foot_${s}`], V(sx * 0.03, -1, 0.14));
      aim(B[`foot_${s}`], B[`ball_${s}`], V(sx * 0.05, -0.3, 1));
    } else {
      aim(B[`upperarm_${s}`], B[`lowerarm_${s}`], V(sx * 0.16, -1, 0.02));
      aim(B[`lowerarm_${s}`], B[`hand_${s}`], V(sx * 0.06, -1, 0.22));
      aim(B[`hand_${s}`], B[`middle_01_${s}`], V(sx * 0.02, -1, 0.1));
    }
    // dedos ligeramente doblados
    for (const f of ['index', 'middle', 'ring', 'pinky']) {
      for (const k of [1, 2, 3]) {
        const bn = B[`${f}_0${k}_${s}`];
        if (bn) { bn.rotateZ(sx * 0.25); bn.updateMatrixWorld(true); }
      }
    }
  }
  if (kind === 'sit') { B.spine_01.rotateX(0.0); }
  return B;
}

/* hornea una SkinnedMesh en su pose actual → geometría estática en espacio del mundo */
function bakeSkinned(mesh, regionOf) {
  mesh.updateMatrixWorld(true);
  mesh.skeleton.update();
  const g = mesh.geometry;
  const pos = g.attributes.position; const nor = g.attributes.normal;
  const si = g.attributes.skinIndex; const sw = g.attributes.skinWeight;
  const bones = mesh.skeleton.bones; const inv = mesh.skeleton.boneInverses;
  const boneMats = bones.map((b, i) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, inv[i]));
  const outP = new Float32Array(pos.count * 3); const outN = new Float32Array(pos.count * 3);
  const region = new Uint8Array(pos.count);
  const M = new THREE.Matrix4(); const T = new THREE.Matrix4(); const N3 = new THREE.Matrix3();
  const p = new THREE.Vector3(); const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    M.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    let best = -1; let bw = -1;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k); if (!w) continue;
      const j = si.getComponent(i, k);
      if (w > bw) { bw = w; best = j; }
      const e = boneMats[j].elements; const m = M.elements;
      for (let q = 0; q < 16; q++) m[q] += e[q] * w;
    }
    // espacio: bindMatrixInverse · Σ · bindMatrix (igual que three), luego al mundo
    T.multiplyMatrices(mesh.bindMatrixInverse, M).multiply(mesh.bindMatrix).premultiply(mesh.matrixWorld);
    region[i] = regionOf(bones[best], i);
    p.fromBufferAttribute(pos, i).applyMatrix4(T);
    N3.getNormalMatrix(T);
    n.fromBufferAttribute(nor, i).applyMatrix3(N3).normalize();
    outP.set([p.x, p.y, p.z], i * 3); outN.set([n.x, n.y, n.z], i * 3);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(outP, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(outN, 3));
  out.setAttribute('uv', g.attributes.uv.clone());
  out.setAttribute('region', new THREE.BufferAttribute(region, 1));
  out.setIndex(g.index.clone());
  return out;
}

/* ropa: infla un poco camisa/pantalón/zapatos sobre la piel */
function inflate(geo) {
  const P = geo.attributes.position; const N = geo.attributes.normal; const R = geo.attributes.region;
  const amt = { 1: 0.014, 2: 0.012, 3: 0.02, 4: 0.004, 5: 0.006 };
  for (let i = 0; i < P.count; i++) {
    const a = amt[R.getX(i)] || 0;
    if (a) P.setXYZ(i, P.getX(i) + N.getX(i) * a, P.getY(i) + N.getY(i) * a, P.getZ(i) + N.getZ(i) * a);
  }
}

/* objeto estático unido a la cabeza (cabello) → aplica el delta de la cabeza */
function bakeRigid(src, headBind, headNow, region) {
  const parts = [];
  src.scene.updateMatrixWorld(true);
  src.scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(o.matrixWorld);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(headNow, new THREE.Matrix4().copy(headBind).invert()));
    g.setAttribute('region', new THREE.BufferAttribute(new Uint8Array(g.attributes.position.count).fill(region), 1));
    parts.push(g);
  });
  return parts;
}

async function bakeCharacter(file, kind, hairs, hairSrc) {
  const gl = await load(file);
  const root = gl.scene;
  root.updateMatrixWorld(true);
  const B = {};
  root.traverse((o) => { if (o.isBone) B[o.name] = o; });
  const wp = (b) => b.getWorldPosition(new THREE.Vector3());
  const ref = {
    shoulderX: Math.abs(wp(B.upperarm_l).x),
    hipY: wp(B.thigh_l).y,
    kneeY: wp(B.calf_l).y,
  };
  // regiones según la pose de referencia (T)
  const skinned = [];
  root.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
  const bindPos = new Map();
  for (const m of skinned) {
    m.updateMatrixWorld(true); m.skeleton.update();
    const arr = []; const v = new THREE.Vector3();
    for (let i = 0; i < m.geometry.attributes.position.count; i++) { m.getVertexPosition(i, v); arr.push(v.clone().applyMatrix4(m.matrixWorld)); }
    bindPos.set(m, arr);
  }
  const headBind = B.Head.matrixWorld.clone();
  pose(root, kind);
  root.updateMatrixWorld(true);
  const headNow = B.Head.matrixWorld.clone();

  const bodyParts = []; const hairParts = []; const eyeParts = [];
  for (const m of skinned) {
    const name = m.name.toLowerCase();
    const bp = bindPos.get(m);
    if (name.includes('eyebrow')) hairParts.push(bakeSkinned(m, () => 6));
    else if (name.includes('eye')) eyeParts.push(bakeSkinned(m, () => 7));
    else bodyParts.push(bakeSkinned(m, (bone, i) => regionFor(bone, bp[i], ref)));
  }
  for (const h of hairs) hairParts.push(...bakeRigid(hairSrc[h], headBind, headNow, 6));
  const body = mergeGeometries(bodyParts); inflate(body);
  const hair = mergeGeometries(hairParts.map((g) => g.index ? g : g));
  const eyes = mergeGeometries(eyeParts);

  // colocar: cadera sobre el cojín (y 0.44), espalda contra el respaldo; escala humana ~1.70 m
  const S = 0.93;
  const hip = wp(B.thigh_l).add(wp(B.thigh_r)).multiplyScalar(0.5);
  const M = new THREE.Matrix4();
  if (kind === 'sit') M.makeTranslation(-hip.x * S, 0.53 - hip.y * S, -0.07 - hip.z * S);
  else M.makeTranslation(0, 0, 0);
  M.multiply(new THREE.Matrix4().makeScale(S, S, S));
  for (const g of [body, hair, eyes]) g.applyMatrix4(M);
  return { body, hair, eyes };
}

/* LOD 1: simplifica cuerpo+cabello (la región viaja en el color) */
function simplify(geo, ratio) {
  const g = geo.clone();
  const R = g.attributes.region;
  const col = new Float32Array(R.count * 3);
  for (let i = 0; i < R.count; i++) col[i * 3] = R.getX(i) / 10;
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.deleteAttribute('region');
  const merged = mergeVertices(g, 1e-4);
  const n = merged.attributes.position.count;
  const out = new SimplifyModifier().modify(merged, Math.floor(n * (1 - ratio)));
  const C = out.attributes.color;
  const reg = new Uint8Array(C.count);
  for (let i = 0; i < C.count; i++) reg[i] = Math.round(C.getX(i) * 10);
  out.deleteAttribute('color');
  out.setAttribute('region', new THREE.BufferAttribute(reg, 1));
  return out;
}

/* ── contenedor binario ── */
function pack(geoms) {
  const header = { geoms: {} };
  const chunks = []; let off = 0;
  const push = (arr) => {
    const pad = (4 - (off % 4)) % 4; if (pad) { chunks.push(new Uint8Array(pad)); off += pad; }
    const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    chunks.push(u8.slice()); const o = off; off += u8.byteLength; return o;
  };
  for (const [name, g] of Object.entries(geoms)) {
    const e = { attrs: {}, groups: g.groups || [] };
    for (const [k, a] of Object.entries(g.attributes)) {
      const arr = k === 'region' ? Uint8Array.from(a.array) : Float32Array.from(a.array);
      e.attrs[k] = { o: push(arr), n: arr.length, size: a.itemSize, t: k === 'region' ? 'u8' : 'f32' };
    }
    const idx = g.index.array; const big = g.attributes.position.count > 65535;
    const ia = big ? Uint32Array.from(idx) : Uint16Array.from(idx);
    e.index = { o: push(ia), n: ia.length, t: big ? 'u32' : 'u16' };
    header.geoms[name] = e;
  }
  const hj = new TextEncoder().encode(JSON.stringify(header));
  const hpad = (4 - ((4 + hj.length) % 4)) % 4;
  const total = 4 + hj.length + hpad + off;
  const buf = new Uint8Array(total);
  new DataView(buf.buffer).setUint32(0, hj.length + hpad, true);
  buf.set(hj, 4); buf.fill(32, 4 + hj.length, 4 + hj.length + hpad);
  let p = 4 + hj.length + hpad;
  for (const c of chunks) { buf.set(c, p); p += c.byteLength; }
  return buf;
}

function withGroups(body, hair, eyes) {
  const g = mergeGeometries([body, hair, eyes].filter(Boolean), true);
  return g;
}

async function run() {
  const hairNames = ['Hair_Buzzed', 'Hair_SimpleParted', 'Hair_Beard', 'Hair_Long', 'Hair_Buns', 'Hair_BuzzedFemale'];
  const hairSrc = {};
  for (const h of hairNames) hairSrc[h] = await load(h);
  const variants = [
    ['sit_m0', 'Superhero_Male_FullBody', 'sit', ['Hair_SimpleParted']],
    ['sit_m1', 'Superhero_Male_FullBody', 'sit', ['Hair_Buzzed']],
    ['sit_m2', 'Superhero_Male_FullBody', 'sit', ['Hair_SimpleParted', 'Hair_Beard']],
    ['sit_m3', 'Superhero_Male_FullBody', 'sit', ['Hair_Buzzed', 'Hair_Beard']],
    ['sit_f0', 'Superhero_Female_FullBody', 'sit', ['Hair_Long']],
    ['sit_f1', 'Superhero_Female_FullBody', 'sit', ['Hair_Buns']],
    ['sit_f2', 'Superhero_Female_FullBody', 'sit', ['Hair_BuzzedFemale']],
    ['std_m0', 'Superhero_Male_FullBody', 'stand', ['Hair_SimpleParted']],
    ['std_m1', 'Superhero_Male_FullBody', 'stand', ['Hair_Buzzed', 'Hair_Beard']],
    ['std_f0', 'Superhero_Female_FullBody', 'stand', ['Hair_Long']],
    ['std_f1', 'Superhero_Female_FullBody', 'stand', ['Hair_Buns']],
  ];
  const out = {};
  for (const [name, file, kind, hairs] of variants) {
    const t0 = performance.now();
    const { body, hair, eyes } = await bakeCharacter(file, kind, hairs, hairSrc);
    out[`${name}_0`] = withGroups(body, hair, eyes);
    const lod1 = simplify(mergeGeometries([body, hair]), 0.14);
    out[`${name}_1`] = lod1;
    // LOD 2: silueta lejana con la misma forma (~300 triángulos)
    out[`${name}_2`] = simplify(lod1, 0.22);
    log(`${name}: LOD0 ${out[`${name}_0`].index.count / 3 | 0} tris · LOD1 ${lod1.index.count / 3 | 0} tris · LOD2 ${out[`${name}_2`].index.count / 3 | 0} (${(performance.now() - t0) | 0} ms)`);
  }
  const bin = pack(out);
  const r = await fetch('/__save?name=crowd&ext=bin&dir=people', { method: 'POST', body: bin });
  log(`guardado crowd.bin ${(bin.byteLength / 1048576).toFixed(2)} MB → ${await r.text()}`);
  window.done = true;
}
run().catch((e) => { log('ERROR ' + e.stack); window.done = 'error'; });
