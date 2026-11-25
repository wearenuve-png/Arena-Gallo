/* Datos de eventos (de ejemplo) y utilidades de fechas, ventanas de venta y precios. */

export const TZ = 'America/Guatemala';
const T = (s) => Date.parse(s);

export const TYPES = [
  { id: 'conciertos', label: 'Conciertos', single: 'Concierto', color: '#ff4d5e', icon: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6' },
  { id: 'deportes', label: 'Deportes', single: 'Deportes', color: '#6fa2ec', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM3 12h18M12 3v18M5.6 5.6c3.5 3.5 3.5 9.3 0 12.8M18.4 5.6c-3.5 3.5-3.5 9.3 0 12.8' },
  { id: 'culturales', label: 'Culturales', single: 'Cultural', color: '#f08fb0', icon: 'M5 4h14v7a7 7 0 0 1-14 0zM9 9h.01M15 9h.01M9 13.5c1.6 1.4 4.4 1.4 6 0' },
  { id: 'familia', label: 'Familia', single: 'Familia', color: '#ffcf6b', icon: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z' },
  { id: 'comedia', label: 'Comedia', single: 'Comedia', color: '#f5a05a', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8 14c1 1.5 2.4 2.2 4 2.2s3-.7 4-2.2M9 9.5h.01M15 9.5h.01' },
  { id: 'festivales', label: 'Festivales', single: 'Festival', color: '#b98cf0', icon: 'M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0M2 17c2-4 4-4 6 0s4 4 6 0 4-4 6 0M2 7c2-4 4-4 6 0s4 4 6 0 4-4 6 0' },
  { id: 'corporativos', label: 'Corporativos', single: 'Corporativo', color: '#4fd1c5', icon: 'M3 8h18v11H3zM8 8V5h8v3M3 13h18' },
];
export const typeById = (id) => TYPES.find((t) => t.id === id);

/* precios por zona: [fila delantera, fila trasera] */
const P = (suites, lower, club, upper, ga) => ({ suites, lower, club, upper, ga });

export const EVENTS = [
  {
    id: 'apertura', name: 'Noche de Apertura', tipo: 'conciertos', date: T('2026-12-05T20:00:00-06:00'), doors: '6:30 PM', age: 'Todas las edades',
    blurb: 'La inauguración de Arena Gallo: la primera noche en que se encienden las luces, las pantallas y el sonido del recinto, con artistas invitados.',
    prices: P([2400, 2400], [1100, 800], [1350, 1100], [560, 340], [650, 650]),
    windows: [
      { name: 'Preventa Fans', open: T('2026-11-23T10:00:00-06:00'), close: T('2026-11-24T10:00:00-06:00') },
      { name: 'Preventa con tarjeta', open: T('2026-11-24T10:00:00-06:00'), close: T('2026-11-26T10:00:00-06:00') },
      { name: 'Venta general', open: T('2026-11-26T10:00:00-06:00'), close: T('2026-12-05T18:00:00-06:00') },
    ],
  },
  {
    id: 'risas', name: 'Risas en Cayalá', tipo: 'comedia', date: T('2026-12-11T21:00:00-06:00'), doors: '8:00 PM', age: '18+',
    blurb: 'Una noche de stand-up con comediantes de Centroamérica.', soldOut: true,
    prices: P([1500, 1500], [600, 450], [700, 700], [300, 200], [350, 350]),
    windows: [{ name: 'Venta general', open: T('2026-11-02T10:00:00-06:00'), close: T('2026-12-11T19:00:00-06:00') }],
  },
  {
    id: 'clasico', name: 'Clásico de Baloncesto', tipo: 'deportes', date: T('2026-12-12T19:00:00-06:00'), doors: '5:30 PM', age: 'Todas las edades',
    blurb: 'Los dos mejores equipos del país en la final de temporada.',
    prices: P([1800, 1800], [600, 380], [750, 750], [250, 180], [450, 450]),
    windows: [{ name: 'Venta general', open: T('2026-11-05T10:00:00-06:00'), close: T('2026-12-12T17:00:00-06:00') }],
  },
  {
    id: 'circo', name: 'Circo Aurora', tipo: 'familia', date: T('2026-12-19T16:00:00-06:00'), doors: '3:00 PM', age: 'Todas las edades',
    blurb: 'Acróbatas, música en vivo y un show para toda la familia.',
    prices: P([1600, 1600], [450, 300], [520, 520], [220, 150], [350, 350]),
    windows: [{ name: 'Venta general', open: T('2026-11-10T10:00:00-06:00'), close: T('2026-12-19T14:00:00-06:00') }],
  },
  {
    id: 'jhayco', name: 'Jhayco', tipo: 'conciertos', date: T('2027-01-15T20:00:00-06:00'), doors: '6:30 PM', age: 'Todas las edades',
    blurb: 'En vivo en Arena Gallo. Una noche de reguetón con producción completa de luces y pantallas.',
    prices: P([3200, 3200], [1600, 1250], [1800, 1800], [650, 450], [900, 900]),
    windows: [{ name: 'Venta general', open: T('2026-11-15T10:00:00-06:00'), close: T('2027-01-15T18:00:00-06:00') }],
  },
  {
    id: 'sinfonica', name: 'Gala Sinfónica', tipo: 'culturales', date: T('2027-01-23T20:00:00-06:00'), doors: '7:00 PM', age: 'Todas las edades',
    blurb: 'Orquesta y coro en vivo en la acústica de Arena Gallo: un programa de grandes obras clásicas y bandas sonoras.',
    prices: P([2000, 2000], [750, 520], [900, 900], [320, 220], [400, 400]),
    windows: [{ name: 'Venta general', open: T('2026-11-20T10:00:00-06:00'), close: T('2027-01-23T18:00:00-06:00') }],
  },
  {
    id: 'voleibol', name: 'Final de Voleibol', tipo: 'deportes', date: T('2027-01-17T17:00:00-06:00'), doors: '3:30 PM', age: 'Todas las edades',
    blurb: 'La final de la liga nacional de voleibol.',
    prices: P([1200, 1200], [350, 220], [400, 400], [160, 120], [250, 250]),
    windows: [{ name: 'Venta general', open: T('2026-11-18T10:00:00-06:00'), close: T('2027-01-17T15:00:00-06:00') }],
  },
  {
    id: 'volcan', name: 'Festival Volcán', tipo: 'festivales', date: T('2027-01-30T15:00:00-06:00'), doors: '2:00 PM', age: '18+',
    blurb: 'Música electrónica de la tarde a la madrugada.',
    prices: P([3500, 3500], [1200, 900], [1400, 1400], [700, 520], [850, 850]),
    windows: [{ name: 'Venta general', open: T('2026-12-01T10:00:00-06:00'), close: T('2027-01-30T12:00:00-06:00') }],
  },
  {
    id: 'expo', name: 'Expo Innovación GT', tipo: 'corporativos', date: T('2027-02-04T09:00:00-06:00'), doors: '8:00 AM', age: 'Todas las edades',
    blurb: 'Conferencias y exhibición de tecnología e innovación.',
    prices: P([900, 900], [250, 150], [300, 300], [120, 90], [150, 150]),
    windows: [{ name: 'Venta general', open: T('2026-11-01T10:00:00-06:00'), close: T('2027-02-04T08:00:00-06:00') }],
  },
];

export const eventById = (id) => EVENTS.find((e) => e.id === id);
export const minPrice = (ev) => Math.min(...Object.values(ev.prices).flat());

/* Modo demo: ?demo=abierta | bloqueada simula el estado de venta (se guarda en la sesión). */
const t0 = Date.now();
export function demoMode() {
  const q = new URLSearchParams(location.search).get('demo');
  if (q) { try { sessionStorage.setItem('ag_demo', q); } catch (e) { /* sin almacenamiento */ } }
  let v = q;
  if (!v) { try { v = sessionStorage.getItem('ag_demo'); } catch (e) { v = null; } }
  return v === 'abierta' || v === 'bloqueada' ? v : null;
}
export function nowFor(ev) {
  const real = Date.now();
  const demo = demoMode();
  const w0 = ev.windows[0];
  if (demo === 'bloqueada') return w0.open - (36 * 3600000 + 41 * 60000) + (real - t0);
  if (demo === 'abierta') return w0.open + 2 * 3600000 + (real - t0);
  return real;
}

export function upcoming(now = Date.now()) {
  return EVENTS.filter((e) => e.date > now).sort((a, b) => a.date - b.date);
}
export const nextEvent = () => upcoming()[0] || EVENTS[0];

/* Estado de venta del evento: ventanas, cuál está abierta/la próxima, y a qué cuenta la regresiva. */
export function saleState(ev) {
  const now = nowFor(ev);
  const wins = ev.windows.map((w) => ({ ...w, st: now < w.open ? 'bloqueada' : now < w.close ? 'abierta' : 'cerrada' }));
  const active = wins.find((w) => w.st === 'abierta');
  const next = wins.find((w) => w.st === 'bloqueada');
  const open = !!active && !ev.soldOut;
  const locked = !active && !!next;
  const target = active ? active.close : next ? next.open : ev.date;
  return { now, wins, active, next, open, locked, soldOut: !!ev.soldOut, target, left: split(target - now) };
}

export function split(ms) {
  let d = Math.max(0, ms);
  const days = Math.floor(d / 86400000); d -= days * 86400000;
  const h = Math.floor(d / 3600000); d -= h * 3600000;
  const m = Math.floor(d / 60000); d -= m * 60000;
  const s = Math.floor(d / 1000);
  const p = (n) => String(n).padStart(2, '0');
  return { d: p(days), h: p(h), m: p(m), s: p(s), short: (days ? days + 'd ' : '') + p(h) + 'h ' + p(m) + 'm' };
}

/* ── formato ── */
const parts = (ms, o) => {
  const p = {};
  new Intl.DateTimeFormat('es-GT', { timeZone: TZ, ...o }).formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
  return p;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export function fecha(ms) {
  const p = parts(ms, { weekday: 'short', day: 'numeric', month: 'short' });
  return cap(p.weekday.replace('.', '')) + ' ' + p.day + ' ' + p.month.replace('.', '');
}
export function fechaLarga(ms) {
  const p = parts(ms, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return cap(p.weekday) + ' ' + p.day + ' de ' + p.month + ' ' + p.year;
}
export function hora(ms) {
  const p = parts(ms, { hour: 'numeric', minute: '2-digit', hour12: true });
  return p.hour + ':' + p.minute + ' ' + (/p/i.test(p.dayPeriod || '') ? 'PM' : 'AM');
}
export function diaMes(ms) {
  const p = parts(ms, { day: 'numeric', month: 'short' });
  return { day: p.day, mon: p.month.replace('.', '').toUpperCase() };
}
const dayKey = (ms) => Math.floor((ms - 6 * 3600000) / 86400000);
export function dayLabel(ms) {
  const dd = dayKey(ms) - dayKey(Date.now());
  const wd = parts(ms, { weekday: 'long' }).weekday;
  if (dd < 0) return 'Ya pasó';
  if (dd === 0) return 'Hoy';
  if (dd === 1) return 'Mañana';
  if (dd < 7) return 'Este ' + wd;
  if (dd < 14) return 'El próximo ' + wd;
  return 'En ' + dd + ' días';
}
export const fmtQ = (n) => 'Q' + Math.round(n).toLocaleString('en-US');

export const STATE_TEXT = { bloqueada: 'Bloqueada', abierta: 'Abierta ahora', cerrada: 'Cerrada' };

/* Nivel del recinto → precio por fila */
export function levelPrice(ev, levelId, row = 0, rows = 1) {
  const [front, back] = ev.prices[levelId] || [0, 0];
  const t = rows > 1 ? row / (rows - 1) : 0;
  return Math.round((front + (back - front) * t) / 5) * 5;
}
