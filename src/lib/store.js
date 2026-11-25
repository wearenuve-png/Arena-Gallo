/* Carrito y boletos guardados en el navegador (simulado, sin servidor). */
const safeGet = (k, fb) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; }
};
const safeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };

export const MAX_TICKETS = 8;
export const SERVICE = 0.1;

export function getCart(eventId) { return safeGet('ag_cart_' + eventId, []); }
export function setCart(eventId, items) { safeSet('ag_cart_' + eventId, items); }

export function getTickets() { return safeGet('ag_tickets', []); }
export function addTickets(list) { safeSet('ag_tickets', getTickets().concat(list)); }

/* asientos vendidos en compras simuladas (para que aparezcan ocupados al volver) */
export function getSoldIds(eventId) { return safeGet('ag_sold_' + eventId, []); }
export function addSoldIds(eventId, ids) { safeSet('ag_sold_' + eventId, getSoldIds(eventId).concat(ids)); }

export function totals(items) {
  const sub = items.reduce((a, i) => a + i.price, 0);
  const fee = Math.round(sub * SERVICE);
  return { sub, fee, total: sub + fee };
}

export function orderCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'AG-';
  for (let i = 0; i < 6; i++) s += a[(Math.random() * a.length) | 0];
  return s;
}
