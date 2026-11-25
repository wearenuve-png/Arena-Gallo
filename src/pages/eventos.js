import '../styles/base.css';
import '../styles/pages.css';
import { mountChrome } from '../lib/chrome.js';
import { TYPES, typeById, upcoming, saleState, fecha, hora, diaMes, minPrice, fmtQ } from '../lib/events.js';
import { evImg } from '../lib/media.js';

mountChrome('eventos');
const params = new URLSearchParams(location.search);
let sel = params.get('tipo') || 'todos';
if (sel !== 'todos' && !typeById(sel)) sel = 'todos';
const live = upcoming();
const ALL = { id: 'todos', label: 'Todo', color: '#f3eee6' };

const tiposEl = document.getElementById('tipos');
const grid = document.getElementById('grid');

function drawTypes() {
  tiposEl.innerHTML = [ALL, ...TYPES].map((t) => {
    const n = live.filter((e) => t.id === 'todos' || e.tipo === t.id).length;
    const on = sel === t.id;
    return `<button type="button" data-t="${t.id}" aria-pressed="${on}" style="--c:${t.color}" ${n ? '' : 'disabled'}>${t.label}<sup>${n}</sup></button>`;
  }).join('');
  tiposEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    sel = b.dataset.t;
    const u = new URL(location.href);
    if (sel === 'todos') u.searchParams.delete('tipo'); else u.searchParams.set('tipo', sel);
    history.replaceState(null, '', u);
    drawTypes(); drawGrid();
  }));
}

function badge(ev) {
  const s = saleState(ev);
  if (s.soldOut) return { cls: 'agotado', txt: 'Agotado' };
  if (s.open) return { cls: 'abierta', txt: 'A la venta' };
  if (s.locked) return { cls: 'bloqueada', txt: `Abre en ${s.left.short}` };
  return { cls: 'cerrada', txt: 'Venta cerrada' };
}

function drawGrid() {
  const list = live.filter((e) => sel === 'todos' || e.tipo === sel);
  const t = typeById(sel);
  document.getElementById('count').textContent = sel === 'todos'
    ? `${list.length} fechas en Arena Gallo, de la más cercana a la más lejana.`
    : `${list.length} ${list.length === 1 ? 'fecha' : 'fechas'} de ${t.label.toLowerCase()}.`;
  grid.innerHTML = list.map((e) => {
    const ty = typeById(e.tipo);
    const b = badge(e);
    const dm = diaMes(e.date);
    return `<a class="evcard${e.soldOut ? ' out' : ''}" href="/evento.html?id=${e.id}">
      <div class="poster">
        <img src="${evImg(e.id)}" alt="" width="576" height="720" loading="lazy">
        <div class="tint"></div>
        <div class="when"><span>${fecha(e.date).split(' ')[0]}</span><b>${dm.day.padStart(2, '0')}</b><span>${dm.mon}</span></div>
        <span class="tag" style="background:${ty.color};color:#12100e">${ty.single}</span>
        <h3>${e.name}</h3>
      </div>
      <div class="info">
        <div class="row"><span>${hora(e.date)} · puertas ${e.doors}</span><span>desde <b>${fmtQ(minPrice(e))}</b></span></div>
        <span class="pill ${b.cls}" data-badge="${e.id}">${b.txt}</span>
      </div></a>`;
  }).join('') || '<p class="muted">No hay fechas de este tipo por ahora.</p>';
}

drawTypes();
drawGrid();
// las insignias con cuenta regresiva se actualizan solas
setInterval(() => {
  grid.querySelectorAll('[data-badge]').forEach((el) => {
    const b = badge(live.find((e) => e.id === el.dataset.badge));
    if (el.textContent !== b.txt) { el.className = 'pill ' + b.cls; el.textContent = b.txt; }
  });
}, 1000);
