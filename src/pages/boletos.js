import '../styles/base.css';
import '../styles/pages.css';
import { mountChrome } from '../lib/chrome.js';
import { getTickets } from '../lib/store.js';
import { fecha, nextEvent } from '../lib/events.js';
import { ticketHTML } from '../lib/ticket.js';

mountChrome('boletos');
const list = document.getElementById('list');
const tickets = getTickets().sort((a, b) => a.date - b.date || a.n - b.n);

if (!tickets.length) {
  const ev = nextEvent();
  list.style.marginTop = '0';
  list.innerHTML = `<div class="empty">
    <div><h2>Todavía no tienes boletos.</h2><p>El próximo evento es ${ev.name}, el ${fecha(ev.date).toLowerCase()}. Cuando compres, tus boletos aparecen aquí.</p></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-red" href="/evento.html?id=${ev.id}">Ver ${ev.name}</a><a class="btn btn-ghost" href="/eventos.html">Toda la cartelera</a></div></div>`;
} else {
  list.innerHTML = tickets.map(ticketHTML).join('');
}
