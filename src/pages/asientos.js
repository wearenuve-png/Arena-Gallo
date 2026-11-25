import '../styles/base.css';
import '../styles/asientos.css';
import QRCode from 'qrcode';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mountChrome } from '../lib/chrome.js';
import { createVenue } from '../scene/venue.js';
import { eventById, nextEvent, saleState, fecha, hora, fmtQ, levelPrice, TZ } from '../lib/events.js';
import { getCart, setCart, totals, MAX_TICKETS, getSoldIds, addSoldIds, addTickets, orderCode } from '../lib/store.js';
import { ticketHTML } from '../lib/ticket.js';
import { logoMark } from '../lib/brand.js';
import { sup, WALL_D } from '../config.js';

document.getElementById('loadMark').innerHTML = logoMark({ title: '' }).replace('role="img" aria-label=""', 'aria-hidden="true"');

mountChrome('', { cta: false });
const qs = new URLSearchParams(location.search);
const ev = eventById(qs.get('evento')) || nextEvent();
document.title = `Asientos · ${ev.name} · Arena Gallo`;
const backLink = document.getElementById('back');
backLink.href = `/evento.html?id=${ev.id}`;
backLink.textContent = '← ' + ev.name;
backLink.setAttribute('aria-label', `Volver a ${ev.name}`);

const LEVELS = [
  { id: 'all', name: 'Todas', color: '#f4f1ea' },
  { id: 'suites', name: 'Suites VIP', color: '#ffcf6b' },
  { id: 'lower', name: 'Platea Baja', color: '#e0182d' },
  { id: 'club', name: 'Club Gallo', color: '#f08a24' },
  { id: 'upper', name: 'Platea Alta', color: '#4f86d6' },
  { id: 'ga', name: 'Pista General', color: '#f4efe6' },
];
const LNAME = Object.fromEntries(LEVELS.map((l) => [l.id, l.name]));
const hash = (s) => Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ═══════ escena ═══════ */
const canvas = document.getElementById('c');
const EVN = ev.name.toUpperCase();
const V = await createVenue(canvas, {
  arena: { screen: ev.name.length > 12 ? ev.name.toUpperCase().split(' ').reduce((a, w) => { const l = a[a.length - 1]; if (l && (l + ' ' + w).length <= 14) a[a.length - 1] = l + ' ' + w; else a.push(w); return a; }, []).slice(0, 2) : [ev.name.toUpperCase()], seed: hash(ev.id) % 100000, show: ev.id, fascia: `${ev.name.toUpperCase()}  ·  ${new Intl.DateTimeFormat('es-GT', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(ev.date).replace(/\//g, '.')}`, price: (lvl, row, rows) => levelPrice(ev, lvl, row, rows), soldIds: getSoldIds(ev.id) },
  // cintas LED: logo de Arena Gallo · logo de Johnson Castillo · nombre del evento
  bandsText: { lower: EVN, suites: EVN, club: EVN, upper: EVN },
});
const { THREE, camera, arena } = V;
const gaBought = lsGet('ag_ga_' + ev.id, 0);
if (gaBought) arena.buyGA(gaBought);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;

/* ═══════ estado ═══════ */
let mode = 'overview';
let focus = null;
let filter = 'all';
let hoverSec = null;
let cart = [];
let lastSeat = null;
let povSeat = null;
let qty = 2; // cuántos boletos: un toque elige ese número de asientos juntos
const markers = new Map();

/* ═══════ cámara ═══════ */
const vec = (x, y, z) => new THREE.Vector3(x, y, z);
const STAGE = vec(0, 4, -30);
const selEl = document.querySelector('.sel');
const sideEl = document.getElementById('side');
const desktop = matchMedia('(min-width: 901px)');
// vista general: el recinto completo desde arriba, con el escenario arriba. La distancia se calcula para que
// todo el contorno (muros incluidos) quepa en la parte libre de la pantalla, sin importar su tamaño.
const OUTLINE = [];
for (let k = 0; k < 48; k++) {
  const p = sup((Math.PI * 2 * k) / 48, WALL_D);
  OUTLINE.push(vec(p.x, 0, p.y), vec(p.x, 34, p.y));
}
const fitCam = new THREE.PerspectiveCamera();
const _p = new THREE.Vector3();
function overviewPose() {
  const { W, H, right, bottom } = V.viewRect();
  const a = V.viewAspect();
  const target = vec(0, 6, -2);
  const el = THREE.MathUtils.degToRad(a < 1 ? 72 : 58); // en pantallas verticales, más cenital: el largo del recinto cabe a lo alto
  const dir = vec(0, Math.sin(el), Math.cos(el));
  fitCam.copy(camera); fitCam.fov = 40; fitCam.updateProjectionMatrix();
  // zona libre en coordenadas de pantalla: sin el encabezado, los filtros, los botones de abajo ni el panel
  const x0 = -1 + 40 / W; const x1 = 1 - (2 * (right + 20)) / W;
  const y0 = -1 + (2 * (bottom + 70)) / H; const y1 = 1 - (2 * 128) / H;
  let lo = 40; let hi = 1200;
  for (let i = 0; i < 26; i++) {
    const d = (lo + hi) / 2;
    fitCam.position.copy(target).addScaledVector(dir, d); fitCam.lookAt(target); fitCam.updateMatrixWorld();
    const fits = OUTLINE.every((q) => { _p.copy(q).project(fitCam); return _p.x > x0 && _p.x < x1 && _p.y > y0 && _p.y < y1; });
    if (fits) hi = d; else lo = d;
  }
  return { pos: target.clone().addScaledVector(dir, hi), target, fov: 40 };
}
function sectionPose(sec) {
  const { H, bottom } = V.viewRect();
  // pantallas verticales: más lejos (y en celular, compensa la hoja inferior que recorta la vista)
  const k = Math.min(2.4, Math.max(1, 1.25 / V.viewAspect())) * ((H + bottom) / H);
  if (sec.kind === 'ga') return { pos: vec(0, 34 * k, 46 * k), target: vec(0, 0, -6) };
  const c = sec.center;
  const far = (sec.kind === 'suite' ? 12 : sec.level.id === 'upper' ? 26 : sec.level.id === 'club' ? 22 : 19) * k;
  const up = sec.kind === 'suite' ? 1.2 : sec.level.id === 'upper' ? 9 : 10;
  return { pos: c.clone().addScaledVector(sec.inward, far).add(vec(0, up, 0)), target: c.clone().add(vec(0, sec.kind === 'suite' ? 0 : -1.5, 0)) };
}
function seatPose(seat) {
  const pos = seat.pos.clone().add(vec(0, 1.5, 0));
  const dir = STAGE.clone().sub(pos).normalize();
  return { pos, target: pos.clone().addScaledVector(dir, 0.1), fov: 46 }; // a la altura de los ojos, lente natural
}
function configControls() {
  if (mode === 'overview') {
    const op = overviewPose(); const d = op.pos.distanceTo(op.target);
    Object.assign(controls, { enableZoom: true, minDistance: d * 0.5, maxDistance: d * 1.25, minPolarAngle: 0.05, maxPolarAngle: 1.05, minAzimuthAngle: -1.0, maxAzimuthAngle: 1.0, rotateSpeed: 0.5 });
  } else if (mode === 'section') {
    Object.assign(controls, { enableZoom: true, minDistance: 5, maxDistance: 70, minPolarAngle: 0.15, maxPolarAngle: 1.5, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity, rotateSpeed: 0.6 });
  } else {
    Object.assign(controls, { enableZoom: false, minDistance: 0.1, maxDistance: 0.1, minPolarAngle: 0.6, maxPolarAngle: 2.3, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity, rotateSpeed: -0.35 });
  }
}
let tween = null;
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
// vuelo en curva: la cámara entra a la pose final desde atrás y desde arriba, como una toma de dron
function flyTo({ pos, target, fov = 40 }, dur = 1.3, after) {
  const p0 = camera.position.clone();
  const d = p0.distanceTo(pos);
  const back = pos.clone().sub(target).setY(0);
  if (back.lengthSq() < 1e-6) back.set(0, 0, 1);
  back.normalize();
  const c = p0.clone().lerp(pos, 0.5).addScaledVector(back, d * 0.24).add(vec(0, d * 0.1, 0));
  tween = { p0, c, t0: controls.target.clone(), p1: pos, t1: target, f0: camera.fov, f1: fov, start: performance.now(), dur: dur * 1000, after };
  controls.enabled = false;
}
const bez = (a, c, b, u, out) => out.copy(a).multiplyScalar((1 - u) * (1 - u)).addScaledVector(c, 2 * (1 - u) * u).addScaledVector(b, u * u);

/* ═══════ marcadores de asientos elegidos ═══════ */
const markMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 0.35), toneMapped: false, fog: false });
const ringGeo = new THREE.TorusGeometry(0.58, 0.1, 12, 40);
const pinGeo = new THREE.ConeGeometry(0.28, 0.75, 20);
function addMarker(seat) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(ringGeo, markMat); ring.rotation.x = Math.PI / 2; ring.position.y = 1.75;
  const pin = new THREE.Mesh(pinGeo, markMat); pin.rotation.x = Math.PI; pin.position.y = 2.75;
  g.add(ring, pin);
  g.position.copy(seat.pos);
  V.scene.add(g);
  markers.set(seat.id, g);
}
function removeMarker(id) { const g = markers.get(id); if (g) { V.scene.remove(g); markers.delete(id); } }

/* ═══════ carrito ═══════ */
const findSeat = (id) => {
  const [secId] = id.split('-');
  const sec = arena.byId.get(secId);
  return sec && sec.seats ? sec.seats.find((s) => s.id === id) : null;
};
function saveCart() { setCart(ev.id, cart); }
function restoreCart() {
  for (const it of getCart(ev.id)) {
    if (it.kind === 'ga') { cart.push(it); continue; }
    const s = findSeat(it.key);
    if (s && !s.sold) { arena.setSelected(s, true); addMarker(s); cart.push(it); lastSeat = s; }
  }
  saveCart();
}
function seatLabel(s) {
  return s.sec.kind === 'suite' ? `${s.sec.name} · Fila ${s.row} · Asiento ${s.num}` : `Sec ${s.sec.id} · Fila ${s.row} · Asiento ${s.num}`;
}
const seatItems = () => cart.filter((i) => i.kind === 'seat');
const gaCount = () => cart.filter((i) => i.kind === 'ga').length;
const itemFor = (s) => ({ key: s.id, kind: 'seat', sec: s.sec.id, level: s.sec.level.id, row: s.row, num: s.num, price: s.price, label: seatLabel(s) });
const syncQty = () => { const n = seatItems().length; if (n) qty = n; };
function toggleSeat(s, opts = {}) {
  if (s.sold) { toast('Ese asiento ya está ocupado'); return; }
  if (s.selected) {
    arena.setSelected(s, false); removeMarker(s.id);
    cart = cart.filter((i) => i.key !== s.id);
    if (lastSeat === s) lastSeat = null;
    syncQty();
  } else {
    if (cart.length >= MAX_TICKETS) { toast(`Máximo ${MAX_TICKETS} boletos por compra`); return; }
    arena.setSelected(s, true); addMarker(s);
    cart.push(itemFor(s));
    lastSeat = s;
    if (opts.pov !== false) { saveCart(); renderPanel(); setTimeout(() => seatView(s), 60); return; }
  }
  saveCart(); renderPanel();
}
/* n asientos libres juntos alrededor de `s`: en su fila y lo más centrados posible; si no caben, los libres más cercanos */
function blockAround(s, n) {
  const row = s.sec.seats.filter((x) => x.row === s.row).sort((a, b) => a.num - b.num);
  const i = row.indexOf(s);
  let best = null; let bestD = Infinity;
  for (let a = Math.max(0, i - n + 1); a <= i && a + n <= row.length; a++) {
    const w = row.slice(a, a + n);
    if (w.some((x) => x.sold)) continue;
    const d = Math.abs(a + (n - 1) / 2 - i);
    if (d < bestD) { bestD = d; best = w; }
  }
  if (best) return best;
  const cost = (x) => Math.abs(x.row - s.row) * 3 + Math.abs(x.num - s.num);
  return [s, ...s.sec.seats.filter((x) => !x.sold && x !== s).sort((a, b) => cost(a) - cost(b)).slice(0, n - 1)];
}
/* los mejores n juntos de una sección: filas de en medio hacia adelante, al centro */
function bestBlock(sec, n) {
  const rows = Math.max(...sec.seats.map((x) => x.row));
  let best = null; let bestScore = -Infinity;
  for (let r = 1; r <= rows; r++) {
    const row = sec.seats.filter((x) => x.row === r).sort((a, b) => a.num - b.num);
    const mid = (row.length - 1) / 2;
    for (let a = 0; a + n <= row.length; a++) {
      const w = row.slice(a, a + n);
      if (w.some((x) => x.sold)) continue;
      const score = -Math.abs((r - 1) / Math.max(1, rows - 1) - 0.35) * 4 - Math.abs(a + (n - 1) / 2 - mid) * 0.12;
      if (score > bestScore) { bestScore = score; best = w; }
    }
  }
  return best;
}
const together = (g) => g.length < 2 || (g.every((x) => x.sec === g[0].sec && x.row === g[0].row)
  && g.map((x) => x.num).sort((a, b) => a - b).every((v, k, arr) => !k || v === arr[k - 1] + 1));
/* tu selección de asientos pasa a ser `pick` (la pista general no se toca) */
function setGroup(pick, anchor) {
  for (const it of seatItems()) { const x = findSeat(it.key); if (x) arena.setSelected(x, false); removeMarker(it.key); }
  cart = cart.filter((i) => i.kind !== 'seat');
  for (const x of pick) { arena.setSelected(x, true); addMarker(x); cart.push(itemFor(x)); }
  lastSeat = anchor;
  saveCart(); renderPanel();
}
function placeGroup(s, n = qty) {
  if (s.sold) { toast('Ese asiento ya está ocupado'); return false; }
  const room = MAX_TICKETS - gaCount();
  if (room <= 0) { toast(`Máximo ${MAX_TICKETS} boletos por compra`); return false; }
  n = Math.min(n, room);
  const pick = blockAround(s, n);
  setGroup(pick, s);
  if (pick.length < n) toast(`Solo quedaban ${pick.length} libres en esta sección`);
  else if (!together(pick)) toast('No había asientos juntos aquí: te dejamos los más cercanos');
  return true;
}
function addGA(n) {
  const have = cart.filter((i) => i.kind === 'ga').length;
  const can = Math.min(n, MAX_TICKETS - cart.length, arena.ga.avail - have);
  if (can <= 0) { toast(`Máximo ${MAX_TICKETS} boletos por compra`); return; }
  for (let i = 0; i < can; i++) cart.push({ key: 'GA-' + Date.now() + '-' + i, kind: 'ga', level: 'ga', price: arena.ga.minPrice, label: 'Pista General · de pie' });
  saveCart(); renderPanel();
}
function removeItem(key) {
  const it = cart.find((i) => i.key === key);
  if (it && it.kind === 'seat') { const s = findSeat(key); if (s) { arena.setSelected(s, false); if (lastSeat === s) lastSeat = null; } removeMarker(key); }
  cart = cart.filter((i) => i.key !== key);
  syncQty();
  saveCart(); renderPanel();
}

/* ═══════ modos ═══════ */
function goOverview() {
  pov.classList.remove('on'); selEl.classList.remove('immersive');
  mode = 'overview'; focus = null; configControls();
  for (const g of markers.values()) g.visible = true;
  flyTo(overviewPose(), 1.0);
  hint('Arrastra para girar · rueda para acercar · toca una sección');
  renderPanel();
}
function focusSection(sec) {
  pov.classList.remove('on'); selEl.classList.remove('immersive');
  mode = 'section'; focus = sec; configControls();
  for (const g of markers.values()) g.visible = true;
  flyTo(sectionPose(sec), 1.0);
  hint(sec.kind === 'ga' ? 'Pista de pie: elige cuántos boletos en el panel' : 'Toca un asiento libre para elegirlo · arrastra para girar');
  renderPanel();
}
const pov = document.getElementById('pov');
function povLabel(s) {
  const mine = s.selected;
  let title = seatLabel(s);
  let sub = `<em>${fmtQ(s.price)}</em> c/u · ${LNAME[s.sec.level.id]} · arrastra para mirar`;
  if (mine) {
    const g = seatItems().map((i) => findSeat(i.key)).filter(Boolean);
    if (g.length > 1 && g.every((x) => x.sec === s.sec && x.row === s.row)) {
      const nums = g.map((x) => x.num).sort((a, b) => a - b);
      title = `${s.sec.kind === 'suite' ? s.sec.name : 'Sec ' + s.sec.id} · Fila ${s.row} · Asientos ${together(g) ? nums[0] + '–' + nums[nums.length - 1] : nums.join(', ')}`;
    } else if (g.length > 1) title = `${seatLabel(s)} y ${g.length - 1} más`;
    sub = `<em>${g.length} ${g.length === 1 ? 'boleto' : 'boletos'}</em> · ${LNAME[s.sec.level.id]} · arrastra para mirar`;
  }
  const open = saleState(ev).open;
  const btn = s.sold && !mine ? ''
    : !mine ? `<button class="pv-go" type="button" data-take>${qty === 1 ? 'Elegir este asiento' : `Elegir ${qty} asientos aquí`}</button>`
    : open ? `<button class="pv-go" type="button" data-paynow>Continuar · ${fmtQ(totals(cart).total)}</button>`
    : '<button class="pv-go mine" type="button" data-cart>✓ En tu selección</button>';
  pov.innerHTML = `<div class="pv-t"><b>${title}</b><span>${sub}</span></div>${btn}`;
  const take = pov.querySelector('[data-take]');
  if (take) take.addEventListener('click', () => { if (placeGroup(s, qty)) { for (const g of markers.values()) g.visible = false; povLabel(s); } });
  // ya es tuyo: directo a pagar (o, si la venta no ha abierto, de vuelta a la sección)
  const payNow = pov.querySelector('[data-paynow]');
  if (payNow) payNow.addEventListener('click', openCheckout);
  const cartBtn = pov.querySelector('[data-cart]');
  if (cartBtn) cartBtn.addEventListener('click', () => focusSection(s.sec));
}
function seatView(s) {
  if (!s) return;
  povSeat = s;
  mode = 'seat'; configControls();
  tip.classList.remove('on');
  povLabel(s);
  pov.classList.add('on'); selEl.classList.add('immersive'); sideEl.classList.remove('open');
  for (const g of markers.values()) g.visible = false;
  flyTo(seatPose(s), 1.15);
  hint('Así se ve desde tu asiento · arrastra para mirar alrededor');
  renderPanel();
}
function applyFilter(id) {
  filter = id;
  arena.setDim(id === 'all' ? null : (s) => s.level.id === id);
  document.querySelectorAll('#filters button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === id)));
}
/* asiento con buena vista para entrar directo "a tu asiento": de frente al escenario, filas medias, al centro de la sección */
function showcaseSeat(levelId) {
  const lv = levelId && levelId !== 'ga' && levelId !== 'all' && LNAME[levelId] ? levelId : 'lower';
  let best = null; let bestScore = -Infinity;
  for (const sec of arena.sections) {
    if (sec.level.id !== lv || sec.kind === 'ga' || !sec.seats || !sec.seats.length) continue;
    const c = sec.center;
    const ang = Math.atan2(Math.abs(c.x), c.z - STAGE.z);           // 0 = de frente al escenario
    const rows = Math.max(...sec.seats.map((x) => x.row));
    const nums = sec.seats.map((x) => x.num);
    const mid = (Math.min(...nums) + Math.max(...nums)) / 2;
    for (const seat of sec.seats) {
      if (seat.sold || seat.selected) continue;
      const score = -Math.abs(ang - 0.5) * 3 - Math.abs(seat.row / rows - 0.4) * 2 - Math.abs(seat.num - mid) * 0.08;
      if (score > bestScore) { bestScore = score; best = seat; }
    }
  }
  return best;
}
function bestSection(levelId) {
  if (levelId === 'ga') return arena.ga;
  const list = arena.sections.filter((s) => s.level.id === levelId && s.kind !== 'ga');
  return list.sort((a, b) => b.avail - a.avail)[0];
}

/* ═══════ interacción 3D ═══════ */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tip = document.getElementById('tip');
function pick(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (mode === 'seat') return null;
  if (mode === 'section' && focus && focus.kind !== 'ga') {
    const hit = ray.intersectObject(focus.mesh, false)[0];
    if (hit) return { seat: focus.seats[hit.instanceId] };
  }
  const hits = ray.intersectObjects(arena.proxies, false);
  for (const h of hits) {
    const sec = h.object.userData.section;
    if (filter !== 'all' && sec.level.id !== filter) continue;
    return { sec };
  }
  return null;
}
function setHover(sec) {
  if (hoverSec === sec) return;
  if (hoverSec) arena.setHover(hoverSec, false);
  hoverSec = sec;
  if (sec) arena.setHover(sec, true);
  canvas.style.cursor = sec ? 'pointer' : '';
}
function secTip(sec) {
  if (sec.kind === 'ga') return `<b>Pista General</b><br><span class="muted">De pie · ${arena.ga.avail.toLocaleString('en-US')} disponibles</span><br>${fmtQ(arena.ga.minPrice)}`;
  const range = sec.minPrice === sec.maxPrice ? fmtQ(sec.minPrice) : `${fmtQ(sec.minPrice)} – ${fmtQ(sec.maxPrice)}`;
  return `<b>${sec.kind === 'suite' ? sec.name : 'Sección ' + sec.id}</b><br><span class="muted">${LNAME[sec.level.id]} · ${sec.avail} ${sec.avail === 1 ? 'libre' : 'libres'}</span><br>${range}`;
}
function seatTip(s) {
  const st = s.selected ? '<span style="color:#fff">En tu selección</span>' : s.sold ? '<span class="muted2">Ocupado</span>' : '<span style="color:var(--red-ink);font-weight:600">Libre</span>';
  return `<b>Fila ${s.row} · Asiento ${s.num}</b><br>${fmtQ(s.price)} · ${st}`;
}
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointermove', (e) => {
  if (tween || (down && e.buttons)) { tip.classList.remove('on'); return; }
  const p = pick(e);
  setHover(p && p.sec && p.sec !== focus ? p.sec : null);
  if (p) {
    tip.innerHTML = p.seat ? seatTip(p.seat) : secTip(p.sec);
    const r = canvas.getBoundingClientRect();
    tip.style.left = e.clientX - r.left + 'px';
    tip.style.top = e.clientY - r.top + 'px';
    tip.classList.add('on');
    canvas.style.cursor = 'pointer';
  } else { tip.classList.remove('on'); canvas.style.cursor = ''; }
});
canvas.addEventListener('pointerleave', () => { tip.classList.remove('on'); setHover(null); });
canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || tween) { down = null; return; }
  down = null;
  const p = pick(e);
  if (!p) return;
  if (p.seat) {
    if (p.seat.selected) toggleSeat(p.seat);
    else if (placeGroup(p.seat)) setTimeout(() => seatView(p.seat), 60);
    tip.innerHTML = seatTip(p.seat); return;
  }
  if (p.sec && p.sec !== focus) { setHover(null); tip.classList.remove('on'); focusSection(p.sec); }
});

/* ═══════ barra de filtros y vistas ═══════ */
document.getElementById('filters').innerHTML = LEVELS.map((l) => `<button type="button" data-l="${l.id}" aria-pressed="${l.id === 'all'}"><span class="zdot" style="background:${l.color}"></span>${l.name}</button>`).join('');
document.querySelectorAll('#filters button').forEach((b) => b.addEventListener('click', () => {
  applyFilter(b.dataset.l);
  if (b.dataset.l === 'all') goOverview(); else focusSection(bestSection(b.dataset.l));
}));
document.getElementById('btnOverview').addEventListener('click', () => { applyFilter('all'); goOverview(); });
const btnSeat = document.getElementById('btnSeatView');
btnSeat.addEventListener('click', () => { if (mode === 'seat') focusSection(povSeat ? povSeat.sec : focus); else seatView(lastSeat); });
const hintEl = document.getElementById('hint');
function hint(t) { hintEl.textContent = t; }

let toastT;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div'); el.id = 'toast'; el.className = 'off'; el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = msg; el.classList.remove('off');
  clearTimeout(toastT); toastT = setTimeout(() => { el.classList.add('off'); }, 2400);
}

/* ═══════ panel lateral ═══════ */
const side = document.getElementById('side');
const sideIn = document.getElementById('sideIn');
document.getElementById('grab').addEventListener('click', () => side.classList.toggle('open'));
let holdUntil = null;

const qtyRow = () => `<div class="qty-row"><span class="qty-l" id="qtyL">¿Cuántos boletos?</span><div class="qty" role="group" aria-labelledby="qtyL">
  <button type="button" data-q="-1" aria-label="Uno menos" ${qty <= 1 ? 'disabled' : ''}>−</button><b aria-live="polite">${qty}</b>
  <button type="button" data-q="1" aria-label="Uno más" ${qty >= MAX_TICKETS - gaCount() ? 'disabled' : ''}>+</button></div></div>`;

function renderPanel() {
  const s = saleState(ev);
  const t = totals(cart);
  const lt = arena.levelTotals();
  btnSeat.disabled = mode !== 'seat' && !lastSeat;
  btnSeat.textContent = mode === 'seat' ? '← Elegir otro asiento' : 'Ver desde mi asiento';
  btnSeat.classList.toggle('btn-red', mode === 'seat');
  btnSeat.classList.toggle('btn-ghost', mode !== 'seat');
  if (cart.length && !holdUntil) holdUntil = Date.now() + 10 * 60000;
  if (!cart.length) holdUntil = null;

  const BACK = '<button class="btn btn-ghost btn-sm" type="button" data-back>← Todas las zonas</button>';
  const lvl = (id) => LEVELS.find((l) => l.id === id);
  let ctx = '';
  if (mode === 'overview' || !focus) {
    ctx = `${qtyRow()}
      <h2 class="sp-h">Elige una zona</h2>
      <div>${LEVELS.filter((l) => l.id !== 'all').map((l) => {
        const a = lt[l.id] || { avail: 0, min: 0, max: 0 };
        const range = a.min === a.max ? fmtQ(a.min) : `${fmtQ(a.min)} – ${fmtQ(a.max)}`;
        return `<button class="zrow" type="button" data-zone="${l.id}"><span class="zdot" style="background:${l.color}"></span>
          <span><span class="zname">${l.name}</span><br><small class="muted2">${a.avail.toLocaleString('en-US')} libres</small></span>
          <span class="p">${range}</span></button>`;
      }).join('')}</div>`;
  } else if (focus.kind === 'ga') {
    ctx = `<div style="margin-top:22px">${BACK}</div>
      <h2 class="sp-sec">Pista General</h2>
      <p class="sp-sub"><span class="zdot" style="background:${lvl('ga').color}"></span>De pie · ${arena.ga.avail.toLocaleString('en-US')} disponibles</p>
      <p class="sp-price">${fmtQ(arena.ga.minPrice)}<small>por persona</small></p>
      <p class="notice" style="margin:6px 0 0">Entrada por orden de llegada, frente al escenario.</p>
      <div class="stepper"><button type="button" data-ga="-1" aria-label="Uno menos">−</button><b id="gaQty" aria-live="polite">${qty}</b><button type="button" data-ga="1" aria-label="Uno más">+</button>
      <button class="btn btn-red" type="button" data-gaadd style="flex:1">Agregar</button></div>`;
  } else {
    const range = focus.minPrice === focus.maxPrice ? fmtQ(focus.minPrice) : `${fmtQ(focus.minPrice)} – ${fmtQ(focus.maxPrice)}`;
    const free = focus.seats.filter((x) => !x.sold && !x.selected).length;
    const col = lvl(focus.level.id).color;
    ctx = `<div style="margin-top:22px">${BACK}</div>
      <h2 class="sp-sec">${focus.kind === 'suite' ? focus.name : 'Sección ' + focus.id}</h2>
      <p class="sp-sub"><span class="zdot" style="background:${col}"></span>${LNAME[focus.level.id]} · ${focus.avail} de ${focus.total} libres</p>
      <p class="sp-price">${range}<small>${focus.kind === 'suite' ? 'por asiento' : 'según la fila'}</small></p>
      ${focus.kind === 'suite' && free ? `<button class="btn btn-ghost" type="button" data-suite style="margin-top:14px;width:100%">Reservar la suite completa (${free} asientos)</button>` : ''}
      ${qtyRow()}
      ${free ? `<button class="btn btn-ghost" type="button" data-best style="margin-top:10px;width:100%">${qty === 1 ? 'Elegir el mejor de esta sección' : `Elegir los ${qty} mejores de esta sección`}</button>` : ''}
      <div class="legend" aria-label="Leyenda"><span><i style="background:${col}"></i>Libre</span><span><i style="background:#2a2a31;box-shadow:inset 0 0 0 1px #4a453f"></i>Ocupado</span><span><i style="background:#ffc53d;box-shadow:0 0 8px rgba(255,197,61,.6)"></i>Tu selección</span></div>
      <p class="notice" style="margin:10px 0 0">${qty === 1 ? 'Toca un asiento libre para elegirlo y ver el escenario desde ahí.' : `Toca un asiento libre: te damos ${qty} juntos y verás el escenario desde ahí.`}</p>`;
  }

  const sale = s.soldOut ? '<span class="pill agotado">Agotado</span>'
    : s.open ? `<span class="pill abierta">${s.active.name} abierta</span>`
    : s.locked ? `<span class="pill bloqueada">${s.next.name} abre en&nbsp;<span data-cd>${s.left.short}</span></span>` : '<span class="pill cerrada">Venta cerrada</span>';
  const canBuy = s.open && cart.length;
  const cta = !cart.length ? 'Elige al menos un asiento' : s.open ? `Continuar · ${fmtQ(t.total)}` : s.locked ? 'Podrás pagar cuando abra la venta' : 'Venta no disponible';

  sideIn.innerHTML = `
    <h1 class="sp-title">${ev.name}</h1>
    <p class="sp-when">${fecha(ev.date)} · ${hora(ev.date)} · puertas ${ev.doors}</p>
    <div>${sale}</div>
    ${ctx}
    <h2 class="sp-h">Tu selección <span>${cart.length} de ${Math.max(MAX_TICKETS, cart.length)}</span></h2>
    <div>${cart.length ? cart.map((i) => `
      <div class="cartrow"><div style="min-width:0"><div style="font-size:14px;font-weight:650">${i.label}</div><small class="muted2">${LNAME[i.level]}</small></div>
      <b>${fmtQ(i.price)}</b>
      ${i.kind === 'seat' ? `<button class="eye" type="button" data-eye="${i.key}" aria-label="Ver desde ${i.label}" title="Ver desde este asiento"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1.5 9 C4 4.5 14 4.5 16.5 9 C14 13.5 4 13.5 1.5 9Z"/><circle cx="9" cy="9" r="2.4"/></svg></button>` : '<span></span>'}
      <button class="x" type="button" data-rm="${i.key}" aria-label="Quitar ${i.label}" title="Quitar">×</button></div>`).join('') : '<p class="empty-cart">Todavía no eliges asientos.</p>'}</div>
    ${cart.length ? `
      <div class="tot" style="margin-top:14px"><span>Subtotal</span><span>${fmtQ(t.sub)}</span></div>
      <div class="tot"><span>Cargo por servicio (10 %)</span><span>${fmtQ(t.fee)}</span></div>
      <div class="tot big"><span>Total</span><span>${fmtQ(t.total)}</span></div>
      <div class="hold"><span>Tus asientos quedan apartados</span><b data-hold>10:00</b></div>` : ''}
    <div style="margin-top:auto;padding-top:20px">
      <button class="btn ${canBuy ? 'btn-red' : 'off'}" type="button" data-pay style="width:100%" ${canBuy ? '' : 'disabled'}>${cta}</button>
    </div>`;

  sideIn.querySelectorAll('[data-zone]').forEach((b) => b.addEventListener('click', () => { applyFilter(b.dataset.zone); focusSection(bestSection(b.dataset.zone)); }));
  sideIn.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { applyFilter('all'); goOverview(); }));
  sideIn.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => removeItem(b.dataset.rm)));
  sideIn.querySelectorAll('[data-eye]').forEach((b) => b.addEventListener('click', () => { const s2 = findSeat(b.dataset.eye); lastSeat = s2; seatView(s2); }));
  const suiteBtn = sideIn.querySelector('[data-suite]');
  if (suiteBtn) suiteBtn.addEventListener('click', () => {
    const pick = focus.seats.filter((x) => !x.sold); // una suite se reserva completa (puede pasar el máximo normal)
    if (!pick.length) return;
    qty = pick.length; setGroup(pick, pick[0]); seatView(pick[0]);
  });
  const bestBtn = sideIn.querySelector('[data-best]');
  if (bestBtn) bestBtn.addEventListener('click', () => {
    const n = Math.min(qty, MAX_TICKETS - gaCount());
    if (n <= 0) { toast(`Máximo ${MAX_TICKETS} boletos por compra`); return; }
    const pick = bestBlock(focus, n);
    if (!pick) { toast(`No quedan ${n} asientos juntos en esta sección: toca los que prefieras`); return; }
    const anchor = pick[Math.floor((pick.length - 1) / 2)];
    setGroup(pick, anchor); setTimeout(() => seatView(anchor), 60);
  });
  // cantidad: si ya elegiste asientos, el grupo crece o se achica ahí mismo
  sideIn.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
    const room = Math.max(1, MAX_TICKETS - gaCount());
    qty = Math.max(1, Math.min(room, qty + +b.dataset.q));
    if (lastSeat && lastSeat.selected && seatItems().length !== qty) setGroup(blockAround(lastSeat, qty), lastSeat);
    else renderPanel();
    if (mode === 'seat' && povSeat) { for (const g of markers.values()) g.visible = false; povLabel(povSeat); }
    const again = sideIn.querySelector(`[data-q="${b.dataset.q}"]`);
    if (again && !again.disabled) again.focus(); else { const other = sideIn.querySelector('[data-q]:not([disabled])'); if (other) other.focus(); }
  }));
  sideIn.querySelectorAll('[data-ga]').forEach((b) => b.addEventListener('click', () => {
    qty = Math.max(1, Math.min(MAX_TICKETS, qty + +b.dataset.ga));
    sideIn.querySelector('#gaQty').textContent = qty;
  }));
  const gaAdd = sideIn.querySelector('[data-gaadd]');
  if (gaAdd) gaAdd.addEventListener('click', () => addGA(qty));
  sideIn.querySelector('[data-pay]').addEventListener('click', openCheckout);
}
setInterval(() => {
  const s = saleState(ev);
  const cd = sideIn.querySelector('[data-cd]');
  if (cd) cd.textContent = s.left.short;
  const h = sideIn.querySelector('[data-hold]');
  if (h && holdUntil) {
    const left = Math.max(0, holdUntil - Date.now());
    h.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`;
  }
}, 1000);

/* ═══════ compra simulada ═══════ */
const modal = document.getElementById('checkout');
const coBox = document.getElementById('coBox');
function closeModal() { modal.classList.remove('show'); }
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function openCheckout() {
  if (!cart.length || !saleState(ev).open) return;
  const t = totals(cart);
  let method = 'tarjeta';
  coBox.innerHTML = `
    <button class="close" type="button" aria-label="Cerrar">×</button>
    <ol class="steps" aria-label="Pasos de la compra"><li class="done">Asientos</li><li class="on" aria-current="step">Tus datos y pago</li><li>Boletos</li></ol>
    <h2 id="coTitle" class="co-title">Tus datos</h2>
    <div class="co-grid">
      <form id="coForm" novalidate>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">
          <div class="field"><label for="f1">Nombre completo</label><input id="f1" name="nombre" autocomplete="name" required></div>
          <div class="field"><label for="f2">Correo</label><input id="f2" name="correo" type="email" autocomplete="email" inputmode="email" required></div>
          <div class="field"><label for="f3">Teléfono <span class="muted2" style="font-weight:400">(opcional)</span></label><input id="f3" name="tel" type="tel" autocomplete="tel" placeholder="+502 5555 0000"></div>
        </div>
        <h3 style="margin:24px 0 0;font-size:15px;font-weight:700">Método de pago</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:10px">
          <button type="button" class="paymethod" data-m="tarjeta" aria-pressed="true"><span class="rad"></span><span><b>Tarjeta</b><br><small class="muted2">Débito o crédito</small></span></button>
          <button type="button" class="paymethod" data-m="transferencia" aria-pressed="false"><span class="rad"></span><span><b>Transferencia</b><br><small class="muted2">Confirmación manual</small></span></button>
        </div>
        <p class="notice" style="margin:14px 0 0">Sitio de demostración: el pago es simulado y no pedimos datos de tarjeta.</p>
        <p id="coErr" role="alert" style="color:var(--red-ink);font-size:14px;min-height:20px;margin:12px 0 0"></p>
        <button class="btn btn-red" type="submit" style="width:100%;margin-top:6px">Pagar ${fmtQ(t.total)} (simulado)</button>
      </form>
      <div class="co-sum">
        <h3 style="margin:0;font-size:15px;font-weight:700;color:var(--muted)">Resumen</h3>
        <div style="font-size:30px;font-weight:800;font-stretch:66%;text-transform:uppercase;line-height:.9;margin-top:10px">${ev.name}</div>
        <div class="muted" style="font-size:13px;margin-top:4px">${fecha(ev.date)} · ${hora(ev.date)} · Arena Gallo</div>
        <div style="margin-top:12px">${cart.map((i) => `<div class="tot" style="margin-top:6px"><span>${i.label}</span><span>${fmtQ(i.price)}</span></div>`).join('')}</div>
        <div class="tot" style="border-top:1px solid var(--line);padding-top:10px;margin-top:12px"><span>Cargo por servicio</span><span>${fmtQ(t.fee)}</span></div>
        <div class="tot big"><span>Total</span><span>${fmtQ(t.total)}</span></div>
      </div>
    </div>`;
  modal.classList.add('show');
  coBox.querySelector('.close').addEventListener('click', closeModal);
  coBox.querySelectorAll('.paymethod').forEach((b) => b.addEventListener('click', () => {
    method = b.dataset.m;
    coBox.querySelectorAll('.paymethod').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  setTimeout(() => coBox.querySelector('#f1').focus(), 50);
  coBox.querySelector('#coForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const nombre = f.nombre.value.trim();
    const correo = f.correo.value.trim();
    const err = coBox.querySelector('#coErr');
    if (nombre.length < 3) { err.textContent = 'Escribe tu nombre completo.'; f.nombre.focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(correo)) { err.textContent = 'Revisa tu correo: lo necesitamos para enviarte los boletos.'; f.correo.focus(); return; }
    const btn = f.querySelector('[type=submit]');
    btn.disabled = true; btn.textContent = 'Procesando pago…';
    await new Promise((r) => setTimeout(r, 1200));
    await confirmPurchase(nombre, method);
  });
}

async function confirmPurchase(nombre, method) {
  const code = orderCode();
  const items = cart.slice();
  const tickets = await Promise.all(items.map(async (i, n) => {
    const qr = `${code}|${ev.id}|${i.kind === 'ga' ? 'GA' : i.key}|${n + 1}`;
    return {
      code, n: n + 1, eventId: ev.id, eventName: ev.name, date: ev.date, label: i.label, level: LNAME[i.level],
      sec: i.kind === 'ga' ? 'PISTA' : i.sec, row: i.kind === 'ga' ? '—' : i.row, num: i.kind === 'ga' ? '—' : i.num,
      price: i.price, holder: nombre, method, qr: await QRCode.toDataURL(qr, { margin: 1, width: 240, color: { dark: '#1a1714', light: '#f4efe4' } }),
    };
  }));
  // los asientos comprados quedan ocupados (aparece la persona sentada)
  const seatIds = [];
  for (const i of items) {
    if (i.kind === 'seat') { const s = findSeat(i.key); if (s) { removeMarker(s.id); arena.markSold(s); seatIds.push(s.id); } }
  }
  const ga = items.filter((i) => i.kind === 'ga').length;
  if (ga) { arena.buyGA(ga); lsSet('ag_ga_' + ev.id, gaBought + ga); }
  addSoldIds(ev.id, seatIds);
  addTickets(tickets);
  cart = []; lastSeat = null; saveCart(); renderPanel();
  V.renderer.shadowMap.needsUpdate = true;

  coBox.innerHTML = `
    <button class="close" type="button" aria-label="Cerrar">×</button>
    <ol class="steps" aria-label="Pasos de la compra"><li class="done">Asientos</li><li class="done">Tus datos y pago</li><li class="on" aria-current="step">Boletos</li></ol>
    <h2 class="co-title">Listo, ${esc(nombre.split(' ')[0])}.</h2>
    <p class="muted" style="margin:10px 0 0">Compra ${code}. Tus boletos ya están en Mis boletos: muestra el QR en el torniquete.</p>
    <div style="display:grid;gap:14px;margin-top:22px">${tickets.map(ticketHTML).join('')}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:22px">
      <a class="btn btn-red" href="/boletos.html">Ir a Mis boletos</a>
      <button class="btn btn-ghost" type="button" data-more>Seguir explorando</button>
    </div>`;
  coBox.querySelector('.close').addEventListener('click', closeModal);
  coBox.querySelector('[data-more]').addEventListener('click', closeModal);
}

/* ═══════ arranque ═══════ */
const sheetH = () => (desktop.matches ? 0 : selEl.classList.contains('immersive') ? 64 : 220);
V.setInset(desktop.matches ? sideEl.offsetWidth : 0, sheetH()); // encuadres iniciales ya cuentan con el panel
restoreCart();
syncQty();
{
  const n = qs.get('nivel');
  const lvl = n && LNAME[n] && n !== 'all' ? n : null;
  const place = (p) => { camera.position.copy(p.pos); controls.target.copy(p.target); camera.lookAt(controls.target); };
  const back = (p, d, up) => ({ pos: p.pos.clone().add(p.pos.clone().sub(p.target).setY(0).normalize().multiplyScalar(d)).add(vec(0, up, 0)), target: p.target });
  const seat = qs.get('vista') === 'asiento' && lvl !== 'ga' ? showcaseSeat(lvl) : null;
  if (seat) {
    // directo a un asiento: arranca un poco por encima y "se sienta" mirando al escenario
    focus = seat.sec;
    const sp = seatPose(seat);
    place({ pos: sp.pos.clone().add(seat.pos.clone().sub(STAGE).setY(0).normalize().multiplyScalar(0.6)).add(vec(0, 2.6, 0)), target: STAGE.clone() });
    seatView(seat);
  } else if (lvl) {
    // directo a la zona pedida
    applyFilter(lvl);
    const sec = bestSection(lvl);
    place(back(sectionPose(sec), 22, 14));
    focusSection(sec);
  } else {
    configControls();
    const start = overviewPose();
    // entra como un dron: desde encima del recinto baja hasta quedar bajo el techo
    camera.position.copy(start.target).add(start.pos.clone().sub(start.target).multiplyScalar(1.45)).add(vec(0, 30, 0));
    controls.target.copy(start.target);
    camera.lookAt(controls.target);
    renderPanel();
    flyTo(start, 1.6);
  }
}

window.addEventListener('resize', () => { V.resize(); });
if (import.meta.env.DEV) {
  window.__ag = { V, arena, focusSection, seatView, camera, controls, toggleSeat, placeGroup, openCheckout, showcaseSeat, seatPose, get qty() { return qty; } };
  // captura del lienzo a ./renders (middleware de desarrollo)
  window.__shot = async (name) => { V.render(1); const b = await new Promise((r) => canvas.toBlob(r, 'image/png')); return (await fetch('/__save?name=' + name, { method: 'POST', body: b })).text(); };
}
const clock = new THREE.Clock();
let lastTop = null;
let lastT = 0; let mblur = 0;
let insetCur = desktop.matches ? sideEl.offsetWidth : 0;
let insetBCur = sheetH();
const prevCam = new THREE.Vector3();
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function loop() {
  const t = clock.getElapsedTime();
  if (tween) {
    const u = Math.min(1, (performance.now() - tween.start) / tween.dur);
    const e = ease(u);
    bez(tween.p0, tween.c, tween.p1, e, camera.position);
    if (tween.f0 !== tween.f1) { camera.fov = tween.f0 + (tween.f1 - tween.f0) * e; camera.updateProjectionMatrix(); }
    controls.target.lerpVectors(tween.t0, tween.t1, ease(Math.min(1, u * 1.12)));
    camera.lookAt(controls.target);
    if (u >= 1) { const a = tween.after; tween = null; controls.enabled = true; controls.update(); if (a) a(); }
  } else {
    controls.update();
  }
  // en vuelo: el público no se reordena y la oclusión ambiental descansa (más cuadros por segundo)
  arena.lodHold = !!tween;
  if (V.gtao) V.gtao.enabled = !tween && !lastTop;
  // techo y bruma solo cuando la cámara está dentro del recinto
  const top = camera.position.y > 44;
  if (top !== lastTop) { lastTop = top; V.setLook(top); }
  if (!top) V.renderer.toneMappingExposure = 1.05 + 0.22 * THREE.MathUtils.smoothstep(camera.position.distanceTo(controls.target), 30, 70);
  for (const g of markers.values()) g.children[1].position.y = 2.75 + Math.sin(t * 3) * 0.15;
  // el centro de la vista sigue al panel (abierto en escritorio, retirado en la vista desde tu asiento)
  const insetTarget = desktop.matches && !selEl.classList.contains('immersive') ? sideEl.offsetWidth : 0;
  insetCur += (insetTarget - insetCur) * 0.14;
  if (Math.abs(insetTarget - insetCur) < 0.5) insetCur = insetTarget;
  insetBCur += (sheetH() - insetBCur) * 0.14;
  if (Math.abs(sheetH() - insetBCur) < 0.5) insetBCur = sheetH();
  V.setInset(insetCur, insetBCur);
  // desenfoque según la velocidad relativa de la cámara (rápido y cerca = más desenfoque)
  const dt = Math.max(1 / 240, t - lastT); lastT = t;
  const rel = camera.position.distanceTo(prevCam) / dt / Math.max(4, camera.position.distanceTo(controls.target));
  prevCam.copy(camera.position);
  mblur += (THREE.MathUtils.clamp((rel - 0.35) * 0.005, 0, 0.011) - mblur) * 0.35;
  V.setMotion(reduceMotion ? 0 : mblur);
  V.render(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(() => {
  document.getElementById('loading').classList.add('done');
  loop();
});
