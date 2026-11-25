/* Cabecera y pie compartidos por todas las páginas. */
import { getTickets } from './store.js';
import { nextEvent, demoMode } from './events.js';
import { logoRow } from './brand.js';
import { SOCIAL, PAGINAS } from './oficial.js';


/* ── tema claro / oscuro (se recuerda en este navegador) ── */
const THEME_KEY = 'ag_theme';
const MOON = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16.5 12.3A7 7 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8z"/></svg>';
const SUN = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.6"/><path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></svg>';
export const currentTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
function applyTheme(t) {
  if (t === 'light') document.documentElement.dataset.theme = 'light'; else delete document.documentElement.dataset.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t === 'light' ? '#f4f1ec' : '#0d0c0b';
  try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* sin almacenamiento */ }
}
let running = null;
function themeButton() {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'theme-btn';
  const paint = (anim = false) => {
    const light = currentTheme() === 'light';
    b.innerHTML = light ? MOON : SUN;
    if (anim) b.firstElementChild.classList.add('turn');
    b.setAttribute('aria-label', light ? 'Usar tema oscuro' : 'Usar tema claro');
    b.title = light ? 'Tema oscuro' : 'Tema claro';
  };
  // el tema nuevo se expande en círculo desde el sol (o la luna) hasta cubrir toda la pantalla
  b.addEventListener('click', () => {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    const swap = () => { applyTheme(next); paint(true); };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) { swap(); return; }
    const r = b.getBoundingClientRect();
    const x = r.left + r.width / 2; const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    if (running) running.skipTransition(); // dos toques seguidos: termina el anterior al instante
    const t = document.startViewTransition(swap);
    running = t; t.finished.finally(() => { if (running === t) running = null; });
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 720, easing: 'cubic-bezier(.65, 0, .25, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
  });
  paint();
  return b;
}

/* menú con todas las páginas (en pantallas medianas y celular, donde no caben en la barra) */
function menuButton(active) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'menu-btn'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'menuPanel');
  b.setAttribute('aria-label', 'Abrir menú');
  b.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 6h14M3 10h14M3 14h14"/></svg>';
  const panel = document.createElement('div');
  panel.className = 'menu-panel'; panel.id = 'menuPanel'; panel.hidden = true;
  const items = [['eventos', 'Eventos', '/eventos.html'], ...PAGINAS, ['boletos', 'Mis boletos', '/boletos.html']];
  panel.innerHTML = `<nav aria-label="Todas las páginas">${items.map(([id, t, u]) => `<a href="${u}" class="${active === id ? 'on' : ''}">${t}</a>`).join('')}</nav>`;
  const set = (open) => { panel.hidden = !open; b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); };
  b.addEventListener('click', (e) => { e.stopPropagation(); set(panel.hidden); });
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { set(false); b.focus(); } });
  queueMicrotask(() => b.closest('.hdr').append(panel));
  return b;
}

export function mountChrome(active = '', { cta = true } = {}) {
  const ev = nextEvent();
  const n = getTickets().length;
  const hdr = document.createElement('header');
  hdr.className = 'hdr';
  hdr.innerHTML = `
    <a class="brand" href="/index.html" aria-label="Arena Gallo, inicio">${logoRow({ title: '' }).replace('role="img" aria-label=""', 'aria-hidden="true"')}</a>
    <nav class="nav" aria-label="Principal">
      <a href="/eventos.html" class="${active === 'eventos' ? 'on' : ''}" ${active === 'eventos' ? 'aria-current="page"' : ''}>Eventos</a>
      ${PAGINAS.map(([id, t, u]) => `<a href="${u}" class="hide-md ${active === id ? 'on' : ''}" ${active === id ? 'aria-current="page"' : ''}>${t}</a>`).join('')}
      <a href="/boletos.html" class="${active === 'boletos' ? 'on' : ''}" ${active === 'boletos' ? 'aria-current="page"' : ''}>Mis boletos${n ? `<span class="badge" aria-label="${n} boletos">${n}</span>` : ''}</a>
      ${cta ? `<a class="btn btn-red btn-sm hide-sm" href="/evento.html?id=${ev.id}" aria-label="Boletos para ${ev.name}">Boletos<span class="cta-long">&nbsp;para ${ev.name}</span></a>` : ''}
    </nav>`;
  hdr.querySelector('.nav').append(themeButton(), menuButton(active));
  document.body.prepend(hdr);
  // marca de agua de la demostración (sobre toda la página, no estorba al tacto)
  if (!document.querySelector('.wm')) { const wm = document.createElement('div'); wm.className = 'wm'; wm.setAttribute('aria-hidden', 'true'); document.body.append(wm); }
  const solid = () => hdr.classList.toggle('solid', window.scrollY > 40 || document.body.dataset.solidHeader === '1');
  solid();
  window.addEventListener('scroll', solid, { passive: true });

  const demo = demoMode();
  const url = (v) => { const u = new URL(location.href); u.searchParams.set('demo', v); return u.pathname + u.search + u.hash; };
  const foot = document.createElement('footer');
  foot.className = 'foot';
  foot.innerHTML = `
    <div>
      <div class="brand-l">${logoRow({ title: 'Arena Gallo' })}</div>
      <p>Ciudad Cayalá, zona 16, Ciudad de Guatemala.<br>Sitio de demostración: los eventos, fechas y precios son de ejemplo y ningún pago es real. Imágenes con fines ilustrativos.</p>
      <nav class="foot-links" aria-label="Arena Gallo"><a href="/eventos.html">Eventos</a>${PAGINAS.map(([, t, u]) => `<a href="${u}">${t}</a>`).join('')}<a href="/boletos.html">Mis boletos</a></nav>
      <div class="social">
        <a href="${SOCIAL.facebook}" target="_blank" rel="noopener" aria-label="Arena Gallo en Facebook"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4A21 21 0 0 0 14.3 4c-2.3 0-3.9 1.4-3.9 4v2.5H7.8v3h2.6V21z"/></svg></a>
        <a href="${SOCIAL.instagram}" target="_blank" rel="noopener" aria-label="Arena Gallo en Instagram"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none"/></svg></a>
        <a href="${SOCIAL.youtube}" target="_blank" rel="noopener" aria-label="Arena Gallo en YouTube"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z"/></svg></a>
        <a href="${SOCIAL.linkedin}" target="_blank" rel="noopener" aria-label="Arena Gallo en LinkedIn"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6.9 8.8H3.8V20h3.1zM5.3 3.9a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM20.2 13.6c0-3-1.6-4.9-4.3-4.9-1.4 0-2.4.8-2.8 1.5V8.8H10V20h3.1v-5.6c0-1.5.6-2.7 2.1-2.7s1.9 1.3 1.9 2.8V20h3.1z"/></svg></a>
      </div>
    </div>
    <div class="demo-switch" role="group" aria-label="Simular estado de venta">
      <span>Simular venta</span>
      <a href="${url('real')}" class="${!demo ? 'on' : ''}" ${!demo ? 'aria-current="true"' : ''}>Fecha real</a>
      <a href="${url('abierta')}" class="${demo === 'abierta' ? 'on' : ''}" ${demo === 'abierta' ? 'aria-current="true"' : ''}>Abierta</a>
      <a href="${url('bloqueada')}" class="${demo === 'bloqueada' ? 'on' : ''}" ${demo === 'bloqueada' ? 'aria-current="true"' : ''}>Bloqueada</a>
    </div>`;
  if (!document.body.dataset.noFooter) document.body.append(foot);
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* tic de 1 s para las cuentas regresivas */
export function every(ms, fn) { fn(); return setInterval(fn, ms); }
