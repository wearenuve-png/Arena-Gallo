import * as THREE from 'three';

/* Público realista: personajes CC0 (Quaternius) horneados en /assets/people/crowd.bin.
   Tres niveles de detalle: LOD0 (~16k triángulos, cerca), LOD1 (~1.4k, distancia media)
   y siluetas simples para lo lejano. La ropa se pinta por regiones en el shader. */

const BASE = '/assets/';

function parseBin(buf) {
  const dv = new DataView(buf);
  const hlen = dv.getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hlen)));
  const data = 4 + hlen;
  const out = {};
  for (const [name, e] of Object.entries(header.geoms)) {
    const g = new THREE.BufferGeometry();
    for (const [k, a] of Object.entries(e.attrs)) {
      const arr = a.t === 'u8' ? new Uint8Array(buf, data + a.o, a.n) : new Float32Array(buf, data + a.o, a.n);
      g.setAttribute(k, new THREE.BufferAttribute(arr, a.size));
    }
    const I = e.index.t === 'u32' ? Uint32Array : Uint16Array;
    g.setIndex(new THREE.BufferAttribute(new I(buf, data + e.index.o, e.index.n), 1));
    for (const gr of e.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
    g.computeBoundingSphere();
    out[name] = g;
  }
  return out;
}

const INST = `
attribute float region; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 iD;
varying float vRegion; varying vec4 vA; varying vec4 vB; varying vec4 vC; varying vec4 vD;
`;
function patchVertex(sh) {
  sh.vertexShader = INST + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    vRegion = region; vA = iA; vB = iB; vC = iC; vD = iD;`);
}
const FRAG_HEAD = 'varying float vRegion; varying vec4 vA; varying vec4 vB; varying vec4 vC; varying vec4 vD;\nuniform sampler2D fabricN;\n';

/* cuerpo: piel con textura · camisa · pantalón · zapatos · cabello plano en LOD1 */
function bodyMaterial(tex, fabricN, aniso) {
  const m = new THREE.MeshStandardMaterial({ map: tex.map, normalMap: tex.normal, roughness: 0.62, metalness: 0 });
  m.normalScale.set(0.8, 0.8);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.fabricN = { value: fabricN };
    patchVertex(sh);
    sh.fragmentShader = FRAG_HEAD + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
        float rg = floor(vRegion + 0.5);
        float cloth = 0.0;
        vec3 skinC = diffuseColor.rgb * vC.rgb;
        vec3 col = skinC;
        if (rg == 1.0 || (rg == 4.0 && vA.w > 0.5)) { col = vA.rgb; cloth = 1.0; }
        else if (rg == 2.0 || (rg == 5.0 && vB.w < 0.5)) { col = vB.rgb; cloth = 1.0; }
        else if (rg == 3.0) { col = vec3(vC.w) * vec3(1.0, 0.97, 0.93); cloth = 0.7; }
        else if (rg == 6.0) { col = vD.rgb * 0.7; cloth = 0.4; }
        // la sombra pintada de la textura sigue dando volumen a la ropa
        float shade = clamp(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)) / 0.62, 0.55, 1.15);
        if (cloth > 0.0) col *= mix(1.0, shade, 0.45);
        diffuseColor.rgb = col;`)
      .replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
        `vec3 mapN = cloth > 0.5
          ? mix(vec3(0.0, 0.0, 1.0), texture2D( fabricN, vNormalMapUv * 18.0 ).xyz * 2.0 - 1.0, 0.55)
          : texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, rg == 3.0 ? 0.45 : 0.93, cloth);`);
  };
  m.customProgramCacheKey = () => 'crowd-body';
  if (tex.map) tex.map.anisotropy = aniso;
  return m;
}
function hairMaterial(map, normal) {
  const m = new THREE.MeshStandardMaterial({ map, normalMap: normal, roughness: 0.55, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    patchVertex(sh);
    sh.fragmentShader = FRAG_HEAD + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float l = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
      diffuseColor.rgb = vD.rgb * clamp(l * 2.2, 0.35, 1.6);`);
  };
  m.customProgramCacheKey = () => 'crowd-hair';
  return m;
}
function eyeMaterial(map) {
  const m = new THREE.MeshStandardMaterial({ map, roughness: 0.15 });
  m.onBeforeCompile = (sh) => { patchVertex(sh); sh.fragmentShader = FRAG_HEAD + sh.fragmentShader; };
  m.customProgramCacheKey = () => 'crowd-eye';
  return m;
}

export async function loadPeople(renderer) {
  const tl = new THREE.TextureLoader();
  const tx = (f, srgb = true) => new Promise((ok, ko) => tl.load(BASE + f, (t) => {
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false; // UV de glTF
    ok(t);
  }, undefined, ko));
  const txr = (f) => new Promise((ok, ko) => tl.load(BASE + f, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; ok(t); }, undefined, ko));
  const [buf, skinM, skinF, nM, nF, hair, hairN, eye, fabricN] = await Promise.all([
    fetch(BASE + 'people/crowd.bin').then((r) => { if (!r.ok) throw new Error('crowd.bin'); return r.arrayBuffer(); }),
    tx('people/skin_m.jpg'), tx('people/skin_f.jpg'), tx('people/skin_m_n.jpg', false), tx('people/skin_f_n.jpg', false),
    tx('people/hair1.jpg'), tx('people/hair1_n.jpg', false), tx('people/eye.jpg'), txr('tex/Fabric030_NormalGL.jpg'),
  ]);
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const geoms = parseBin(buf);
  const hairM = hairMaterial(hair, hairN);
  const eyeM = eyeMaterial(eye);
  const bodyM = bodyMaterial({ map: skinM, normal: nM }, fabricN, aniso);
  const bodyF = bodyMaterial({ map: skinF, normal: nF }, fabricN, aniso);
  return {
    geoms,
    mats: { m: [bodyM, hairM, eyeM], f: [bodyF, hairM, eyeM] },
  };
}

/* ── paletas ── */
/* como en un concierto real: mucha ropa oscura y neutra, algo de color apagado y pocas prendas claras */
const SHIRTS = [
  '#141414', '#18181a', '#1b1c1f', '#121315', '#202124', '#26272a', '#1d2430', '#22252b', '#2b2a28', '#191a1d', // negros y grises
  '#2a3446', '#33302b', '#3a3f45', '#4b4f55', '#2e3a33', '#40362c', '#3d2b2b', '#2f2a38', // apagados
  '#6e1f24', '#7d2a2a', '#5a6a7c', '#8a7b63', '#4f5a46', // color tenue
  '#c9c4bb', '#d6d1c8', '#b8b2a7', // claros
];
const PANTS = ['#1b2333', '#1f2636', '#22242a', '#18191c', '#141418', '#2b3445', '#3b3a36', '#2a2d33', '#4a4f57', '#3c3428', '#26324a'];
const SKIN = [[1.0, 0.94, 0.88], [0.92, 0.8, 0.7], [0.82, 0.66, 0.54], [0.68, 0.52, 0.4], [0.52, 0.38, 0.28], [0.4, 0.29, 0.22]];
const HAIR = ['#1a120c', '#2a1b10', '#3b2414', '#4a3020', '#0e0c0b', '#6b4a2c', '#8a6a44', '#5a5048', '#2a1f1a'];

const SIT_M = ['sit_m0', 'sit_m1', 'sit_m2', 'sit_m3'];
const SIT_F = ['sit_f0', 'sit_f1', 'sit_f2'];
const STD_M = ['std_m0', 'std_m1'];
const STD_F = ['std_f0', 'std_f1'];

/* Administrador del público: decide el nivel de detalle de cada persona según la cámara */
export function createCrowd(assets, { rand = Math.random } = {}) {
  const group = new THREE.Group();
  const people = [];
  const meshes = {}; // variante → [lod0, lod1]
  const c = new THREE.Color();

  function makeMesh(geo, mats, cap) {
    const mesh = new THREE.InstancedMesh(geo, mats, cap);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.raycast = () => {};
    for (const k of ['iA', 'iB', 'iC', 'iD']) {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
      a.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute(k, a);
    }
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(mesh);
    return mesh;
  }
  function ensure(variant, need) {
    let entry = meshes[variant];
    if (entry && entry.cap >= need) return entry;
    const cap = Math.max(64, Math.ceil(need * 1.3));
    if (entry) { for (const m of entry.lod) { group.remove(m); m.dispose(); } }
    const g = variant.includes('_f') ? assets.mats.f : assets.mats.m;
    const g0 = assets.geoms[`${variant}_0`].clone();
    const g1 = assets.geoms[`${variant}_1`].clone();
    const g2 = assets.geoms[`${variant}_2`].clone();
    entry = { cap, lod: [makeMesh(g0, g, cap), makeMesh(g1, g[0], cap), makeMesh(g2, g[0], cap)] };
    entry.lod[1].userData.noAO = true; // la oclusión solo importa de cerca
    entry.lod[2].userData.noAO = true;
    entry.lod[2].castShadow = false;
    meshes[variant] = entry;
    return entry;
  }

  function pick(arr) { return arr[(rand() * arr.length) | 0]; }
  function add({ pos, rotY, kind = 'sit', scale = 1, shirt, sec = null }) {
    const female = rand() < 0.46;
    const variant = kind === 'sit' ? pick(female ? SIT_F : SIT_M) : pick(female ? STD_F : STD_M);
    const m = new THREE.Matrix4().compose(
      pos.clone(),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY + (rand() - 0.5) * 0.25, 0)),
      new THREE.Vector3(scale * (0.95 + rand() * 0.08), scale * (0.94 + rand() * 0.1), scale * (0.95 + rand() * 0.08))
    );
    const a = new Float32Array(16);
    c.set(shirt || pick(SHIRTS)); a.set([c.r, c.g, c.b, rand() < 0.3 ? 1 : 0], 0);
    c.set(pick(PANTS)); a.set([c.r, c.g, c.b, rand() < 0.12 ? 1 : 0], 4);
    const s = pick(SKIN); a.set([s[0], s[1], s[2], rand() < 0.4 ? 0.85 : 0.06 + rand() * 0.12], 8);
    c.set(pick(HAIR)); a.set([c.r, c.g, c.b, 0], 12);
    const p = { variant, m, pos: pos.clone(), attrs: a, kind, sec };
    people.push(p);
    dirty = true;
    return p;
  }

  let dirty = true;
  const lastPos = new THREE.Vector3(1e9, 0, 0);
  const lastDir = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  // detalle completo solo para quien está cerca de la cámara (cada persona en detalle completo pesa ~17 mil triángulos)
  const LOD0_MAX = 110; const LOD1_MAX = 2000;
  const R0 = 13; const R1 = 50;
  let order = [];

  function rebuild(camera) {
    camera.getWorldDirection(fwd);
    const cp = camera.position;
    // distancia ponderada: lo que está detrás de la cámara cuenta como lejos
    for (const p of people) {
      tmp.subVectors(p.pos, cp);
      const d = tmp.length();
      const facing = d > 0.001 ? tmp.dot(fwd) / d : 1;
      p.d = facing < -0.15 && d > 3 ? 1e6 : d;
    }
    order = people.slice().sort((x, y) => x.d - y.d);
    const counts = {};
    const fill = {};
    for (const p of people) counts[p.variant] = (counts[p.variant] || 0) + 1;
    for (const [v, n] of Object.entries(counts)) { const e = ensure(v, n); for (const m of e.lod) m.count = 0; fill[v] = e; }
    let n0 = 0; let n1 = 0;
    for (const p of order) {
      let lod = 2;
      if (p.d < R0 && n0 < LOD0_MAX) { lod = 0; n0++; } else if (p.d < R1 && n1 < LOD1_MAX) { lod = 1; n1++; }
      {
        const mesh = fill[p.variant].lod[lod];
        const k = mesh.count++;
        mesh.setMatrixAt(k, p.m);
        const g = mesh.geometry.attributes;
        g.iA.array.set(p.attrs.subarray(0, 4), k * 4);
        g.iB.array.set(p.attrs.subarray(4, 8), k * 4);
        g.iC.array.set(p.attrs.subarray(8, 12), k * 4);
        g.iD.array.set(p.attrs.subarray(12, 16), k * 4);
      }
    }
    for (const e of Object.values(meshes)) {
      for (const mesh of e.lod) {
        mesh.instanceMatrix.needsUpdate = true;
        for (const k of ['iA', 'iB', 'iC', 'iD']) mesh.geometry.attributes[k].needsUpdate = true;
      }
    }
    lastPos.copy(cp); lastDir.copy(fwd);
    dirty = false;
    return true;
  }

  return {
    group,
    add,
    get size() { return people.length; },
    /* devuelve true si reconstruyó (para refrescar sombras) */
    update(camera, force = false) {
      camera.getWorldDirection(fwd);
      if (!force && !dirty && camera.position.distanceTo(lastPos) < 1.2 && fwd.dot(lastDir) > 0.985) return false;
      return rebuild(camera);
    },
  };
}
