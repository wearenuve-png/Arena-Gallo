/* Caja de "ventanas de venta" con cuenta regresiva en vivo. Se reutiliza en inicio y en la página del evento. */
import { saleState, fecha, hora, STATE_TEXT } from './events.js';

const LOCK = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7 V5 a3 3 0 0 1 6 0 V7"/></svg>';
const LIVE = '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4" fill="#df001c"/></svg>';

export function mountSaleBox(root, ev, { buyHref, buyLabel = 'Comprar boletos', previewHref } = {}) {
  let key = '';
  const draw = () => {
    const s = saleState(ev);
    const k = [s.open, s.locked, s.soldOut, s.wins.map((w) => w.st).join()].join('|');
    if (k !== key) {
      key = k;
      const status = s.soldOut ? 'Agotado'
        : s.open ? `${s.active.name}: la venta cierra en`
        : s.locked ? `${s.next.name} abre en` : 'Falta para el evento';
      const sub = s.soldOut ? 'Ya no quedan boletos para este evento.'
        : s.open ? 'Al elegir tus asientos se apartan por 10 minutos.'
        : s.locked ? `Abre el ${fecha(s.next.open).toLowerCase()} a las ${hora(s.next.open)}. Ten tu cuenta lista.`
        : 'Las ventanas de venta ya terminaron.';
      const preview = previewHref ? `<a class="btn btn-ghost" href="${previewHref}">Ver el recinto en 3D</a>` : '';
      const acts = s.open
        ? `<a class="btn btn-red" href="${buyHref}">${buyLabel}</a>${preview}`
        : s.locked ? `<button class="btn btn-white" type="button" data-notify>Avísame cuando abra</button>${preview}` : preview;
      root.className = 'salebox' + (s.open ? ' open' : '');
      root.innerHTML = `
        <div class="in">
          <div class="status">${s.open ? LIVE : s.locked ? LOCK : ''}${status}</div>
          ${s.soldOut ? '' : `<div class="cd" style="margin-top:12px" role="timer" aria-live="off">
            <div><b data-d>00</b><small>d</small></div><div><b data-h>00</b><small>h</small></div>
            <div><b data-m>00</b><small>min</small></div><div><b data-s>00</b><small>s</small></div>
          </div>`}
          <p class="sub" style="margin:12px 0 0">${sub}</p>
          ${acts ? `<div class="sale-row" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">${acts}</div>` : ''}
          <div class="wins" aria-label="Ventanas de venta">${s.wins.map((w) => `
            <div><div><b>${w.name}</b><small>${fecha(w.open)} · ${hora(w.open)}</small></div>
            <span class="pill ${w.st}">${STATE_TEXT[w.st]}</span></div>`).join('')}</div>
        </div>`;
      const nb = root.querySelector('[data-notify]');
      if (nb) nb.addEventListener('click', () => { nb.textContent = 'Listo, te avisaremos'; nb.disabled = true; });
    }
    if (s.soldOut) return;
    const l = s.left;
    root.querySelector('[data-d]').textContent = l.d;
    root.querySelector('[data-h]').textContent = l.h;
    root.querySelector('[data-m]').textContent = l.m;
    root.querySelector('[data-s]').textContent = l.s;
  };
  draw();
  return setInterval(draw, 1000);
}
