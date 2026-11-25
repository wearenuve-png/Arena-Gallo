import '../styles/base.css';
import '../styles/pages.css';
import { mountChrome } from '../lib/chrome.js';
import { mountSaleBox } from '../lib/salebox.js';
import { eventById, nextEvent, typeById, fechaLarga, hora, dayLabel, minPrice, fmtQ } from '../lib/events.js';
import { evWide, evPov } from '../lib/media.js';
import { planSVG } from '../lib/plan.js';

mountChrome('eventos', { cta: false });
const ev = eventById(new URLSearchParams(location.search).get('id')) || nextEvent();
const t = typeById(ev.tipo);
document.title = `${ev.name} · Arena Gallo`;
const seats = `/asientos.html?evento=${ev.id}`;
const range = (k) => { const [a, b] = ev.prices[k]; return a === b ? fmtQ(a) : `${fmtQ(Math.min(a, b))} – ${fmtQ(Math.max(a, b))}`; };
const ARROW = '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg>';

const ZONES = [
  ['suites', 'Suites VIP', '#ffcf6b', '22 suites privadas de 16 asientos'],
  ['lower', 'Platea Baja', '#e0182d', '14 filas, lo más cerca del escenario'],
  ['club', 'Club Gallo', '#f08a24', '6 filas en el nivel intermedio'],
  ['ga', 'Pista General', '#f4efe6', 'De pie, frente al escenario'],
  ['upper', 'Platea Alta', '#4f86d6', '7 filas con vista de todo el recinto'],
];
const colors = Object.fromEntries(ZONES.map(([k, , c]) => [k, c]));

document.getElementById('app').innerHTML = `
<section class="ev-hero">
  <img src="${evWide(ev.id)}" alt="" width="1280" height="720">
  <div class="container">
    <div>
      <nav class="crumbs" aria-label="Ruta"><a href="/eventos.html">Cartelera</a><span aria-hidden="true">/</span><a href="/eventos.html?tipo=${t.id}">${t.label}</a></nav>
      <h1 class="ev-name">${ev.name}</h1>
      <p class="ev-blurb">${ev.blurb}</p>
      <dl class="facts">
        <div><dt>${dayLabel(ev.date)}</dt><dd>${fechaLarga(ev.date).replace(/ \d{4}$/, '')}</dd></div>
        <div><dt>Inicio</dt><dd>${hora(ev.date)}</dd></div>
        <div><dt>Puertas</dt><dd>${ev.doors}</dd></div>
        <div><dt>Edad</dt><dd>${ev.age}</dd></div>
      </dl>
    </div>
    <div id="salebox"></div>
  </div>
</section>
<section class="container ev-body">
  <div class="ev-grid">
    <div>
      <h2>Zonas y precios</h2>
      <p class="muted" style="margin:0">Desde ${fmtQ(minPrice(ev))}. Elige una zona para ver sus asientos en 3D.</p>
      <div class="plan" id="plan">
        ${planSVG(colors, { label: `Plano de Arena Gallo con las zonas a la venta para ${ev.name}` })}
        <div class="prices">${ZONES.map(([k, n, c, d]) => `
          <a href="${seats}&nivel=${k}" data-zone="${k}"><span class="zdot" style="background:${c}"></span>
            <span><span class="n">${n}</span><br><small class="muted2">${d}</small></span><span class="p">${range(k)}</span>${ARROW}</a>`).join('')}</div>
      </div>
      <p class="note">Los precios no incluyen el 10 % de cargo por servicio. Máximo 8 boletos por compra.</p>
      <a href="${seats}&vista=asiento" class="pov-cta">
        <img src="${evPov(ev.id)}" alt="" width="1600" height="686" loading="lazy">
        <div><b>Mira el escenario desde tu asiento antes de pagar.</b><span class="btn btn-white">Abrir el recinto en 3D <span class="arr">${ARROW}</span></span></div>
      </a>
    </div>
    <div>
      <h2>Antes de ir</h2>
      <ul class="know">
        <li><b>Puertas a las ${ev.doors}</b>Llega con tiempo: en la entrada principal se forman filas.</li>
        <li><b>Boletos digitales</b>Tu código QR aparece en Mis boletos al terminar la compra. Muéstralo en el torniquete.</li>
        <li><b>Parqueo en Ciudad Cayalá</b>Se llena rápido en noches de evento; el transporte compartido es la opción más fácil.</li>
        <li><b>Accesibilidad</b>Rampas y lugares para silla de ruedas en Platea Baja.</li>
        <li><b>Edad</b>${ev.age === '18+' ? 'Solo mayores de 18 años, con documento de identificación.' : 'Para todas las edades. Los menores entran con un adulto.'}</li>
      </ul>
    </div>
  </div>
</section>`;

mountSaleBox(document.getElementById('salebox'), ev, { buyHref: seats, buyLabel: 'Elegir asientos', previewHref: `${seats}&vista=asiento` });

// plano y lista se resaltan juntos
const plan = document.getElementById('plan');
const hl = (z) => {
  plan.classList.toggle('hov', !!z);
  plan.querySelectorAll('[data-z]').forEach((p) => p.classList.toggle('on', p.dataset.z === z));
  plan.querySelectorAll('[data-zone]').forEach((a) => a.classList.toggle('on', a.dataset.zone === z));
};
plan.querySelectorAll('[data-zone]').forEach((a) => {
  a.addEventListener('mouseenter', () => hl(a.dataset.zone)); a.addEventListener('focus', () => hl(a.dataset.zone));
  a.addEventListener('mouseleave', () => hl(null)); a.addEventListener('blur', () => hl(null));
});
plan.querySelectorAll('svg [data-z]').forEach((p) => {
  p.addEventListener('mouseenter', () => hl(p.dataset.z));
  p.addEventListener('mouseleave', () => hl(null));
  p.addEventListener('click', () => { location.href = `${seats}&nivel=${p.dataset.z}`; });
});
