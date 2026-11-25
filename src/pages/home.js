import '../styles/base.css';
import '../styles/home.css';
import { mountChrome } from '../lib/chrome.js';
import { mountSaleBox } from '../lib/salebox.js';
import { nextEvent, upcoming, TYPES, typeById, fecha, hora, dayLabel, diaMes } from '../lib/events.js';
import { evImg } from '../lib/media.js';
import { logoStack } from '../lib/brand.js';

mountChrome('');

/* ═══════ Intro: una vez por sesión ═══════ */
(function intro() {
  const el = document.getElementById('intro');
  let seen = false;
  try { seen = sessionStorage.getItem('ag_intro') === '1'; sessionStorage.setItem('ag_intro', '1'); } catch (e) { /* sin almacenamiento */ }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || reduce || location.hash) { el.remove(); return; }
  document.getElementById('introLogo').innerHTML = logoStack({ title: 'Arena Gallo' });
  el.hidden = false;
  document.body.classList.add('intro-run');
  document.documentElement.style.overflow = 'hidden';
  const timers = [];
  const finish = () => {
    timers.forEach(clearTimeout);
    // centro del círculo del logo (124,88 en el viewBox 34 16 182 238)
    const r = el.querySelector('.ag-logo').getBoundingClientRect();
    el.style.setProperty('--cx', `${r.left + r.width * ((124 - 34) / 182)}px`);
    el.style.setProperty('--cy', `${r.top + r.height * ((88 - 16) / 238)}px`);
    el.classList.add('out');
    document.body.classList.remove('intro-run');
    document.documentElement.style.overflow = '';
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => removeEventListener(t, finish));
    setTimeout(() => el.remove(), 1500);
  };
  timers.push(setTimeout(() => el.classList.add('pulse'), 2350));
  timers.push(setTimeout(finish, 3200));
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => addEventListener(t, finish, { once: true, passive: true }));
})();
const ev = nextEvent();
const seatUrl = (nivel) => `/asientos.html?evento=${ev.id}${nivel ? '&nivel=' + nivel : ''}`;

/* ═══════ Recorrido: el scroll controla el video ═══════ */
const rec = document.getElementById('recorrido');
const vid = document.getElementById('vid');
const loader = document.getElementById('loader');
const copy = document.getElementById('copy');
const bar = document.getElementById('bar');
const hint = document.getElementById('hint');
const stage = rec.querySelector('.rec-stage');
const end = document.getElementById('end');
const rail = document.getElementById('rail');

const PHASES = [
  { from: 0, label: 'Llegada', title: 'Aquí, Guatemala<br>vibra más alto.', sub: 'Arena Gallo, en Ciudad Cayalá. Desliza para entrar antes de elegir tu lugar.' },
  { from: 8.6, label: 'Entrada', title: 'Tu entrada<br>empieza aquí.', sub: 'Llega a la plaza y cruza las puertas principales.' },
  { from: 15.2, label: 'Lobby', title: 'Pasa directo<br>con tu QR.', sub: 'Torniquetes rápidos, food halls y todo a la vista.' },
  { from: 22.2, label: 'Túnel', title: 'Ya casi.', sub: 'Escucha cómo suena desde adentro.' },
  { from: 25.6, label: 'Interior', title: '14,500<br>a la vez.', sub: 'Así se ve Arena Gallo en una noche llena.' },
  { from: 28.8, label: 'Vista aérea', title: 'Elige<br>tu lugar.', sub: 'Tres niveles, 50 suites y la pista. Mira cada sección antes de comprar.' },
];
const DUR = 41.6; // duración del recorrido (el video real la confirma al cargar)
rail.innerHTML = PHASES.map((p, i) => `<li style="left:${i === PHASES.length - 1 ? 100 : (p.from / DUR) * 100}%">${p.label}</li>`).join('');

/* al terminar el recorrido: la vista aérea queda limpia y abajo se elige la zona (sin dibujos encima del video) */
const ZONES = [
  { nivel: 'lower', name: 'Platea Baja', color: '#e0182d' },
  { nivel: 'ga', name: 'Pista General', color: '#f4efe6' },
  { nivel: 'suites', name: 'Suites VIP', color: '#ffcf6b' },
  { nivel: 'upper', name: 'Platea Alta', color: '#4f86d6' },
];
const priceFrom = (nivel) => Math.min(...ev.prices[nivel]);
document.getElementById('endTitle').textContent = ev.name;
document.getElementById('endWhen').textContent = `${fecha(ev.date)} · ${hora(ev.date)} · elige dónde vivirla`;
document.getElementById('zlist').innerHTML = ZONES.map((z) => `<a href="${seatUrl(z.nivel)}"><span class="zl-n"><i style="background:${z.color}"></i>${z.name}</span><small>desde Q${priceFrom(z.nivel).toLocaleString('en-US')}</small></a>`).join('')
  + `<a class="zl-all" href="${seatUrl()}">Ver el recinto en 3D <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg></a>`;

/* video completo en memoria para que el avance con el scroll sea fluido */
(async () => {
  const src = '/media/recorrido.mp4';
  try {
    const res = await fetch(src);
    const total = +res.headers.get('content-length') || 0;
    const reader = res.body.getReader();
    const chunks = []; let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); got += value.length;
      if (total) loader.textContent = `Cargando recorrido · ${Math.round((got / total) * 100)} %`;
    }
    vid.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
  } catch (e) {
    vid.src = src;
  }
  vid.addEventListener('loadeddata', () => loader.classList.add('done'), { once: true });
  vid.load();
})();

let target = 0; let cur = 0; let phase = -1; let ended = null;
const dur = () => (vid.duration && isFinite(vid.duration) ? vid.duration : DUR);
// al final, la vista aérea se sostiene: hay que seguir bajando ~1.4 pantallas más para pasar a la página
const HOLD = 1.4;
function onScroll() {
  const max = rec.offsetHeight - window.innerHeight - HOLD * window.innerHeight;
  const p = Math.min(1, Math.max(0, (window.scrollY - rec.offsetTop) / max));
  target = p * (dur() - 0.04);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// en la portada, el logo vuelve al inicio sin recargar (no se vuelve a descargar el video ni parpadea la imagen)
let jump = false;
document.querySelector('.hdr .brand').addEventListener('click', (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  jump = true;
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (location.hash) history.replaceState(null, '', location.pathname);
});

function tick() {
  if (jump) { onScroll(); cur = target; jump = false; }
  cur += (target - cur) * 0.2; // el video alcanza al scroll rápido, sin brincos
  if (Math.abs(target - cur) < 0.001) cur = target;
  if (vid.readyState >= 2 && !vid.seeking && Math.abs(vid.currentTime - cur) > 1 / 60) {
    try { vid.currentTime = cur; } catch (e) { /* aún cargando */ }
  }
  const d = dur();
  bar.style.width = (cur / d) * 100 + '%';
  hint.style.opacity = cur < 0.5 ? 1 : 0;
  let idx = 0;
  PHASES.forEach((p, i) => { if (cur >= p.from) idx = i; });
  if (idx !== phase) {
    phase = idx;
    copy.classList.add('swap');
    setTimeout(() => {
      const p = PHASES[idx];
      document.getElementById('title').innerHTML = p.title;
      document.getElementById('sub').textContent = p.sub;
      copy.classList.remove('swap');
    }, 180);
    [...rail.children].forEach((li, i) => li.classList.toggle('on', i === idx));
  }
  const atEnd = cur > d - 1.0;
  if (atEnd !== ended) {
    ended = atEnd;
    stage.classList.toggle('end', atEnd);
    end.hidden = !atEnd;
    copy.style.opacity = atEnd ? 0 : '';
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ═══════ Próximo evento ═══════ */
const t = typeById(ev.tipo);
const later = upcoming().filter((e) => e.id !== ev.id).slice(0, 3);
const dm = diaMes(ev.date);
const ARROW = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg>';
document.getElementById('proximo').innerHTML = `
  <div class="next">
    <a class="next-poster" href="/evento.html?id=${ev.id}" aria-label="${ev.name}: ver el evento">
      <img src="${evImg(ev.id)}" alt="" width="576" height="720" loading="lazy">
      <div class="when">${fecha(ev.date).split(' ')[0]}<b>${dm.day.padStart(2, '0')}</b><span>${dm.mon} ${new Date(ev.date).getFullYear()}</span></div>
    </a>
    <div>
      <div class="next-meta"><span class="chip chip-red">Próximo evento</span><span class="chip chip-line">${dayLabel(ev.date)}</span></div>
      <h2 class="next-name">${ev.name}</h2>
      <p class="next-when"><b>${t.single}</b> · ${fecha(ev.date)} · ${hora(ev.date)} · puertas ${ev.doors}</p>
      <div id="salebox"></div>
    </div>
  </div>
  <h3 class="later-h">Después en Arena Gallo</h3>
  <div class="later">${later.map((e) => { const d = diaMes(e.date); return `
    <a href="/evento.html?id=${e.id}"><div class="d"><b>${d.day}</b><small>${d.mon}</small></div>
    <div><span class="n">${e.name}</span><small class="t">${typeById(e.tipo).single} · ${hora(e.date)}</small></div></a>`; }).join('')}</div>`;
mountSaleBox(document.getElementById('salebox'), ev, { buyHref: seatUrl(), buyLabel: 'Elegir asientos', previewHref: seatUrl() + '&vista=asiento' });

/* ═══════ Cartelera por tipo ═══════ */
const live = upcoming();
document.getElementById('tipos').innerHTML = `
  <div class="sec-head"><h2 class="h-sec">¿Qué quieres vivir?</h2><a href="/eventos.html">Toda la cartelera ${ARROW}</a></div>
  <ul class="cats">${TYPES.map((ty) => {
    const list = live.filter((e) => e.tipo === ty.id);
    const n = list.length;
    return `<li><a class="cat${n ? '' : ' none'}" href="/eventos.html?tipo=${ty.id}" style="--c:${ty.color}">
      <img src="${n ? evImg(list[0].id) : '/media/arena.jpg'}" alt="" width="576" height="720" loading="lazy">
      <span class="cat-n">${n ? `${n} ${n === 1 ? 'evento' : 'eventos'}` : 'Sin fechas'}</span>
      <span class="cat-b"><span class="cat-name">${ty.label}</span>
        <span class="cat-next">${n ? `${list[0].name} · ${fecha(list[0].date)}` : 'Pronto anunciamos fechas'}</span></span>
    </a></li>`; }).join('')}</ul>`;

/* ═══════ El recinto ═══════ */
document.getElementById('recinto').innerHTML = `
  <div class="venue">
    <figure>
      <img src="/media/arena-foto.jpg" alt="Vista aérea de Arena Gallo al atardecer, con el parqueo y la colina detrás" width="1280" height="720" loading="lazy">
      <figcaption>Arena Gallo desde el norte, Ciudad Cayalá.</figcaption>
    </figure>
    <div>
      <h2 class="h-sec">Una arena de clase mundial en Cayalá.</h2>
      <dl class="specs">
        <div><dt>Capacidad</dt><dd><b>14,500</b>personas</dd></div>
        <div><dt>Suites VIP</dt><dd><b>50</b>con 10 asientos cada una</dd></div>
        <div><dt>Niveles</dt><dd>Platea Baja, Club Gallo, Platea Alta y pista</dd></div>
        <div><dt>Comida y bebida</dt><dd><b>36+</b>puntos de venta en 2 food halls</dd></div>
      </dl>
      <a class="btn btn-red" href="${seatUrl()}">Recorrer el recinto en 3D <span class="arr">${ARROW}</span></a>
    </div>
  </div>`;
