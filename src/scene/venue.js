import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { buildInterior } from '../seating.js';
import { loadPeople } from './people.js';
import { logoImage } from '../lib/brand.js';
import { beamMaterial } from './fx.js';
import { sup, A_MAX, WALL_D, LEVELS } from '../config.js';

/* Escena del recinto con el mismo look cinematográfico de los renders (techo, letreros, bruma, color).
   Se usa en el selector de asientos en vivo. */
export async function createVenue(canvas, { arena: arenaOpts = {}, bandsText = {}, pixelRatio } = {}) {
  let W = canvas.clientWidth || innerWidth;
  let H = canvas.clientHeight || innerHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  const coarse = matchMedia('(pointer: coarse)').matches;
  // resolución nativa en pantallas retina (se ajusta sola si el equipo no da abasto)
  const prMax = pixelRatio || Math.min(devicePixelRatio, coarse ? 1.25 : 1.5);
  let pr = prMax;
  renderer.setPixelRatio(pr);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NeutralToneMapping; // tonos fieles (el rojo de las butacas sigue siendo rojo) y luces altas suaves
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#07070a');
  scene.fog = new THREE.FogExp2('#07070a', 0.0032);
  const pmrem = new THREE.PMREMGenerator(renderer);
  // iluminación ambiental real (HDRI CC0 de Poly Haven); si falla, la de estudio
  try {
    const hdr = await new RGBELoader().loadAsync('/assets/hdri/empty_warehouse_01_1k.hdr');
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
    scene.environmentIntensity = 0.45;
  } catch (e) {
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.35;
  }
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1500);

  try { await Promise.all([document.fonts.load('800 80px Archivo'), document.fonts.load('600 30px Archivo')]); } catch (e) { /* fuente opcional */ }

  // logo de Arena Gallo para las pantallas
  const brand = await logoImage('row').catch(() => null);
  // logo de Johnson Castillo Network (blanco con fondo transparente) para cintas LED y pantalla principal
  const sponsor = await new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = '/media/brand/johnson-castillo.png'; });
  let people = null;
  try { people = await loadPeople(renderer); } catch (e) { console.warn('público realista no disponible', e); }
  const arena = buildInterior({ ...arenaOpts, people, brand, sponsor });
  scene.add(arena.group, arena.lights);
  const sun = arena.lights.children.find((l) => l.isDirectionalLight);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
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
    const beamMat = (c) => beamMaterial(c, 0.12);
    const cols = ['#ff2a44', '#7aa7ff', '#ffe0b0', '#ff2a44', '#ffd06b', '#7aa7ff'];
    cols.forEach((c, i) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 48, 32, 1, true).translate(0, -24, 0), beamMat(c));
      cone.position.set(-20 + i * 8, 43, -22);
      cone.rotation.set(0.55 + (i % 2) * 0.1, 0, (i - 2.5) * 0.18);
      ceiling.add(cone);
    });
  }
  scene.add(ceiling);
  /* ── pantallas de cinta (LED) entre niveles: muestran el evento, como en una arena real ── */
  const FONT = (w, px) => `${w} ${px}px Archivo, sans-serif`;
  const condensed = (g) => { if ('fontStretch' in g) g.fontStretch = 'extra-condensed'; };
  function ledize(g, w, h, pitch = 4) {
    // rejilla de píxeles LED: líneas oscuras finas sobre el contenido
    g.fillStyle = 'rgba(0,0,0,0.55)';
    for (let x = 0; x < w; x += pitch) g.fillRect(x, 0, 1, h);
    for (let y = 0; y < h; y += pitch) g.fillRect(0, y, w, 1);
  }
  function bandTexture(text, { bg = '#0b0a09', fg = '#f3eee6', accent = '#df001c' } = {}) {
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const parts = text.split('|');
    // una vuelta de la cinta: logo de Arena Gallo · logo de Johnson Castillo · textos.
    // Primero se mide y luego se dibuja en un lienzo del ancho exacto (las letras no se estiran).
    const layout = (draw) => {
      condensed(g);
      g.textBaseline = 'middle';
      let x = 50;
      const logo = (im, h) => { const w = (im.width / im.height) * h; if (draw) g.drawImage(im, x, (128 - h) / 2, w, h); x += w; };
      const dot = () => { x += 44; if (draw) { g.fillStyle = accent; g.fillRect(x - 8, 58, 16, 16); } x += 52; };
      if (brand) { logo(brand, 96); dot(); }
      if (sponsor) { logo(sponsor, 86); dot(); }
      for (const p of parts) {
        // "ZONA ^DESDE Q450": la zona en negrita y el precio más tenue, como la rotulación de una arena
        const [strong, soft] = p.split('^').map((t) => t && t.trim());
        g.fillStyle = fg; g.font = FONT(800, 84);
        if (draw) g.fillText(strong, x, 70);
        x += g.measureText(strong).width;
        if (soft) {
          x += 30;
          g.globalAlpha = 0.62; g.font = FONT(600, 76);
          if (draw) g.fillText(soft, x, 70);
          x += g.measureText(soft).width;
          g.globalAlpha = 1;
        }
        dot();
      }
      return Math.ceil(x);
    };
    c.width = 64; c.height = 128;
    const W = Math.min(4096, layout(false));
    c.width = W; // reinicia el lienzo
    g.fillStyle = bg; g.fillRect(0, 0, W, 128);
    layout(true);
    ledize(g, W, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return { tex: t, repeatW: W };
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
    // un número entero de vueltas: la cinta empieza y termina con el contenido completo (nada cortado en las puntas)
    const mpr = total / Math.max(1, Math.round(total / metersPerRepeat));
    const pos = [];
    const uv = [];
    for (let k = 0; k < S; k++) {
      const a = pts[k]; const b = pts[k + 1];
      const ua = (total - cum[k]) / mpr;
      const ub = (total - cum[k + 1]) / mpr;
      pos.push(a.x, y0, a.y, b.x, y0, b.y, b.x, y1, b.y, a.x, y0, a.y, b.x, y1, b.y, a.x, y1, a.y);
      uv.push(ua, 0, ub, 0, ub, 1, ua, 0, ub, 1, ua, 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    // cara interior (hacia el escenario)
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, toneMapped: false }));
    mesh.material.color.setScalar(0.8);
    scene.add(mesh);
    // cara exterior: desde atrás o desde arriba también se lee al derecho (no en espejo)
    const back = geo.clone();
    const uvB = back.attributes.uv.array;
    for (let k = 0; k < S; k++) {
      const ua = cum[k] / mpr; const ub = cum[k + 1] / mpr;
      uvB.set([ua, 0, ub, 0, ub, 1, ua, 0, ub, 1, ua, 1], k * 12);
    }
    const meshB = new THREE.Mesh(back, new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, toneMapped: false }));
    meshB.material.color.setScalar(0.8);
    scene.add(meshB);
  }
  const BT = Object.assign({
    lower: 'ARENA GALLO|CAYALÁ', suites: 'SUITES VIP|ARENA GALLO', club: 'CLUB GALLO|ARENA GALLO', upper: 'ARENA GALLO|CAYALÁ',
  }, bandsText);
  band(14.37, 7.18, 8.12, BT.lower);
  band(16.62, 10.86, 11.5, BT.suites, { bg: '#0d0b07', fg: '#ffd98a', accent: '#df001c' });
  // Club Gallo: en la pared bajo Platea Alta, por encima de las cabezas de la última fila (no queda tapada)
  band(30.55, 15.75, 16.7, BT.club);
  band(30.57, 17.35, 18.4, BT.upper);

  /* ── tablero LED alrededor de la pista (frente de Platea Baja) ──
     un tramo por sección: su número a la izquierda y, alternando, los logos o el nombre del evento.
     Cada tramo se dibuja a su largo real: nada se estira ni queda tapado por el número. */
  function floorBoard(text) {
    const L = LEVELS.lower;
    const d = L.d0 - 0.035; const y0 = 0.03; const y1 = 0.57; const hM = y1 - y0;
    const secs = arena.sections.filter((x) => x.level.id === 'lower' && x.alpha0 != null).sort((a, b) => a.alpha0 - b.alpha0);
    const n = secs.length;
    const bounds = [-A_MAX];
    for (let i = 1; i < n; i++) bounds.push((secs[i - 1].alpha1 + secs[i].alpha0) / 2);
    bounds.push(A_MAX);
    const CELL = 1536; const COLS = 2; const K = 24; const NUMW = 150;
    const segs = secs.map((sec, i) => {
      const pts = []; const cum = [0];
      for (let k = 0; k <= K; k++) {
        const p = sup(bounds[i] + ((bounds[i + 1] - bounds[i]) * k) / K, d).clone();
        if (k) cum.push(cum[k - 1] + p.distanceTo(pts[k - 1]));
        pts.push(p);
      }
      return { sec, pts, cum, len: cum[K], w: Math.min(CELL, Math.round((cum[K] / hM) * 128)) };
    });
    // logo de Arena Gallo en blanco (sobre rojo, el "Gallo" rojo se perdería)
    const white = (im) => {
      if (!im) return null;
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      return c;
    };
    const ag = white(brand);
    const rows = Math.ceil(n / COLS);
    const c = document.createElement('canvas');
    c.width = CELL * COLS; c.height = 128 * rows;
    const g = c.getContext('2d');
    g.fillStyle = '#a90e20'; g.fillRect(0, 0, c.width, c.height);
    condensed(g); g.textBaseline = 'middle';
    const logosW = (ag ? (ag.width / ag.height) * 84 : 0) + (ag && sponsor ? 64 : 0) + (sponsor ? (sponsor.width / sponsor.height) * 72 : 0);
    g.font = FONT(800, 80); const nameW = g.measureText(text).width;
    const drawLogos = (x, cy) => {
      if (ag) { const w = (ag.width / ag.height) * 84; g.drawImage(ag, x, cy - 42, w, 84); x += w + 64; }
      if (sponsor) { const w = (sponsor.width / sponsor.height) * 72; g.drawImage(sponsor, x, cy - 36, w, 72); }
    };
    const drawName = (x, cy) => { g.fillStyle = '#fff'; g.font = FONT(800, 80); g.textAlign = 'left'; g.fillText(text, x, cy + 4); };
    segs.forEach((sg, i) => {
      const x0 = (i % COLS) * CELL; const yy = Math.floor(i / COLS) * 128;
      sg.x0 = x0; sg.yy = yy;
      g.fillStyle = '#5c0711'; g.fillRect(x0, yy, NUMW, 128);
      g.fillStyle = '#fff'; g.font = FONT(800, 80); g.textAlign = 'center';
      g.fillText(String(sg.sec.id), x0 + NUMW / 2, yy + 68);
      const avail = sg.w - NUMW - 48;
      const both = logosW + 90 + nameW;
      const pieceW = both <= avail ? both : i % 2 ? nameW : logosW;
      const k = Math.min(1, avail / pieceW);
      g.save();
      g.translate(x0 + NUMW + 24 + (avail - pieceW * k) / 2, yy + 64);
      g.scale(k, k);
      if (both <= avail) { drawLogos(0, 0); drawName(logosW + 90, 0); } else if (i % 2) drawName(0, 0); else drawLogos(0, 0);
      g.restore();
    });
    ledize(g, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const pos = []; const uv = [];
    for (const sg of segs) {
      const v0 = 1 - (sg.yy + 128) / c.height; const v1 = 1 - sg.yy / c.height;
      const U = (k) => (sg.x0 + ((sg.len - sg.cum[k]) / sg.len) * sg.w) / c.width;
      for (let k = 0; k < K; k++) {
        const a = sg.pts[k]; const b = sg.pts[k + 1]; const ua = U(k); const ub = U(k + 1);
        pos.push(a.x, y0, a.y, b.x, y0, b.y, b.x, y1, b.y, a.x, y0, a.y, b.x, y1, b.y, a.x, y1, a.y);
        uv.push(ua, v0, ub, v0, ub, v1, ua, v0, ub, v1, ua, v1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, toneMapped: false }));
    m.material.color.setScalar(0.85);
    scene.add(m);
  }
  floorBoard(BT.lower);

  /* ── número de cada sección en su frente (rotulación de estadio) ── */
  function sectionNumbers() {
    const items = [];
    for (const sec of arena.sections) {
      if (sec.alphaMid == null) continue;
      const L = sec.level;
      // (los números de Platea Baja van dentro del tablero LED de la pista)
      if (L.id === 'club') items.push({ sec, d: L.d0 - 0.04, y0: L.h0 - 0.62, y1: L.h0 - 0.12, txt: String(sec.id), fg: '#ffe2b8' });
      // platea alta: el número va pintado en la pared del fondo, arriba de la sección (así la cinta LED no queda tapada)
      else if (L.id === 'upper') items.push({ sec, d: WALL_D - 0.06, y0: 24.9, y1: 26.3, txt: String(sec.id), fg: '#e9e4da' });
    }
    // atlas: una celda por rótulo
    const CW = 160; const CH = 80; const COLS = 12;
    const rows = Math.ceil(items.length / COLS);
    const c = document.createElement('canvas');
    c.width = CW * COLS; c.height = CH * rows;
    const g = c.getContext('2d');
    condensed(g);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    items.forEach((it, i) => {
      const x = (i % COLS) * CW; const y = Math.floor(i / COLS) * CH;
      if (it.plate) { g.fillStyle = '#0b0a09'; g.fillRect(x, y, CW, CH); }
      g.font = FONT(800, 66);
      g.fillStyle = it.fg;
      g.fillText(it.txt, x + CW / 2, y + CH / 2 + 4);
      if (it.plate) { ledize(g, CW, CH); }
      it.u0 = x / c.width; it.u1 = (x + CW) / c.width; it.v0 = 1 - (y + CH) / c.height; it.v1 = 1 - y / c.height;
    });
    const pos = []; const uv = [];
    for (const it of items) {
      const a = it.sec.alphaMid;
      const p = sup(a, it.d); const pa = sup(a - 0.01, it.d); const pb = sup(a + 0.01, it.d);
      const tx = pb.x - pa.x; const tz = pb.y - pa.y; const tl = Math.hypot(tx, tz);
      const h = it.y1 - it.y0; const w = h * (CW / CH) * (it.plate ? 1 : 0.9);
      const ux = (tx / tl) * w / 2; const uz = (tz / tl) * w / 2;
      // de derecha a izquierda vista desde dentro (el alfa crece en sentido contrario a la lectura)
      const A = [p.x + ux, it.y0, p.y + uz]; const B = [p.x - ux, it.y0, p.y - uz];
      const C = [p.x - ux, it.y1, p.y - uz]; const D = [p.x + ux, it.y1, p.y + uz];
      pos.push(...A, ...B, ...C, ...A, ...C, ...D);
      uv.push(it.u0, it.v0, it.u1, it.v0, it.u1, it.v1, it.u0, it.v0, it.u1, it.v1, it.u0, it.v1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.FrontSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.renderOrder = 2;
    scene.add(m);
  }
  sectionNumbers();

  /* ── posproceso ── */
  // antialiasing real (MSAA ×4) en todo el posproceso: sin esto los bordes salen dentados
  const msaa = renderer.capabilities.isWebGL2 ? 4 : 0;
  const rt = new THREE.WebGLRenderTarget(W * pr, H * pr, { type: THREE.HalfFloatType, samples: msaa });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  // oclusión ambiental (sombras de contacto entre butacas, personas y gradas); solo en equipos de escritorio
  const lowEnd = matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  let gtao = null;
  if (!lowEnd) {
    gtao = new GTAOPass(scene, camera, W, H);
    gtao.output = GTAOPass.OUTPUT.Default;
    gtao.blendIntensity = 1.0;
    gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12, distanceFallOff: 1.0 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    // fuera de la oclusión: haces de luz, vidrios, zonas invisibles de selección y letreros
    gtao.overrideVisibility = function () {
      const cache = this._visibilityCache;
      this.scene.traverse((o) => {
        cache.set(o, o.visible);
        if (o.isPoints || o.isLine) { o.visible = false; return; }
        if (o.userData.noAO) { o.visible = false; return; }
        if (o.isMesh) {
          const m = Array.isArray(o.material) ? o.material[0] : o.material;
          if (m.transparent || m.isShaderMaterial || m.isMeshBasicMaterial) o.visible = false;
        }
      });
    };
    composer.addPass(gtao);
  }
  const bokeh = new BokehPass(scene, camera, { focus: 30, aperture: 0.0006, maxblur: 0.008 });
  composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.5, 0.55, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  // gradación de color + enfoque de cámara + viñeta (en espacio de pantalla)
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, seed: { value: 1.0 }, mblur: { value: 0 }, vig: { value: 0.42 }, texel: { value: new THREE.Vector2(1 / (W * pr), 1 / (H * pr)) }, sharp: { value: 0.35 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float seed; uniform float mblur; uniform float vig; uniform vec2 texel; uniform float sharp; varying vec2 vUv;
      float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
      void main(){
        vec2 d = vUv - 0.5;
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        // desenfoque de movimiento cuando la cámara vuela rápido (radial, como un dolly hacia adelante)
        float sh = sharp;
        if (mblur > 0.0004) {
          vec2 dir = (vUv - 0.5) * mblur;
          vec3 acc = c;
          for (int i = 1; i < 8; i++) acc += texture2D(tDiffuse, vUv - dir * float(i)).rgb;
          c = acc / 8.0;
          sh *= 1.0 - clamp(mblur * 90.0, 0.0, 1.0);
        }
        // enfoque (unsharp mask) con los 4 vecinos: bordes nítidos como una foto
        vec3 n = texture2D(tDiffuse, vUv + vec2(texel.x, 0.)).rgb + texture2D(tDiffuse, vUv - vec2(texel.x, 0.)).rgb
               + texture2D(tDiffuse, vUv + vec2(0., texel.y)).rgb + texture2D(tDiffuse, vUv - vec2(0., texel.y)).rgb;
        vec3 col = c + (c - n * 0.25) * sh;
        col = max(col, 0.0);
        float l = dot(col, vec3(0.2126,0.7152,0.0722));
        col = mix(vec3(l), col, 0.92);                                      // un poco menos de saturación
        col = mix(col * vec3(0.96,0.98,1.03), col * vec3(1.03,0.99,0.95), smoothstep(0.1,0.7,l)); // sombras frías, luces cálidas
        col *= 1.0 - vig * smoothstep(0.4, 1.0, length(d * vec2(1.1, 1.0)));
        col += (rnd(vUv * 1000.0) - 0.5) * 0.012;                           // grano casi imperceptible (evita bandas)
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  composer.addPass(grade);
  bokeh.uniforms.maxblur.value = 0;
  bokeh.enabled = false; // en vivo sin desenfoque: evita renderizar la escena dos veces
  function setLook(top) {
    ceiling.visible = !top;
    scene.fog.color.set(top ? '#07070a' : '#140e13');
    scene.fog.density = top ? 0.0016 : 0.0055;
    renderer.toneMappingExposure = top ? 1.45 : 1.05; // el mapa desde arriba necesita más luz para leer las zonas
    if (gtao) gtao.enabled = !top; // desde 230 m la oclusión no aporta y cuesta
  }
  // el panel lateral flota sobre el 3D: el centro de la vista se corre a la zona libre (sin redimensionar nada)
  // (en celular, la hoja inferior hace lo mismo hacia arriba)
  let inset = 0; let insetB = 0;
  function applyView() {
    if (inset > 0.5 || insetB > 0.5) {
      const fw = W + inset; const fh = H + insetB;
      camera.aspect = fw / fh; camera.setViewOffset(fw, fh, inset, insetB, W, H);
    } else { camera.aspect = W / H; camera.clearViewOffset(); }
    camera.updateProjectionMatrix();
  }
  function setInset(px, pb = 0) { if (Math.abs(px - inset) < 0.25 && Math.abs(pb - insetB) < 0.25) return; inset = px; insetB = pb; applyView(); }
  const viewAspect = () => (W - inset) / (H - insetB);
  const viewRect = () => ({ W, H, right: inset, bottom: insetB });
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false);
    composer.setSize(W, H);
    if (gtao) gtao.setSize(W, H);
    grade.uniforms.texel.value.set(1 / (W * pr), 1 / (H * pr));
    applyView();
  }
  // resolución adaptable: si el equipo no sostiene ~30 fps, baja la resolución por pasos
  let last = 0; let ema = 16; let slow = 0;
  function adapt() {
    const now = performance.now();
    const dt = now - last; last = now;
    if (dt <= 0 || dt > 120) return; // pestaña en segundo plano o pausa: no cuenta
    ema += (dt - ema) * 0.05;
    slow = ema > 34 ? slow + 1 : 0;
    if (slow > 45 && pr > 1) {
      pr = Math.max(1, pr - 0.25); slow = 0; ema = 20;
      renderer.setPixelRatio(pr); composer.setPixelRatio(pr); resize();
    }
  }
  function render(t = 0) {
    adapt();
    if (arena.update(t, camera, H * pr)) renderer.shadowMap.needsUpdate = true;
    grade.uniforms.seed.value = (t * 7.3) % 10;
    composer.render();
  }
  renderer.shadowMap.needsUpdate = true;
  const setMotion = (v) => { grade.uniforms.mblur.value = v; };
  return { THREE, renderer, scene, camera, arena, ceiling, composer, bokeh, gtao, grade, setLook, setMotion, setInset, viewAspect, viewRect, resize, render };
}
