/* Boleto impreso: se usa en la confirmación de compra y en Mis boletos. */
import { fecha, hora } from './events.js';
import { logoRow } from './brand.js';

const LIGHT = { hi: '#159a8a', mid: '#58b5a9', dim: '#cddfda' };

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function ticketHTML(tk) {
  const ga = tk.sec === 'PISTA';
  const qr = String(tk.qr).startsWith('data:image/png') ? tk.qr : '';
  return `<article class="ticket" aria-label="Boleto ${esc(tk.code)}-${tk.n} para ${esc(tk.eventName)}">
    <div class="main">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div style="height:30px">${logoRow({ title: 'Arena Gallo', arena: '#1a1714', colors: LIGHT }).replace('<svg ', '<svg style="height:30px;width:auto;display:block" ')}</div>
        <span class="lbl" style="font-variant-numeric:tabular-nums">Compra ${esc(tk.code)}</span>
      </div>
      <div style="font-size:clamp(34px,4.4vw,52px);font-weight:800;font-stretch:64%;line-height:.86;text-transform:uppercase;margin-top:16px">${esc(tk.eventName)}</div>
      <div style="font-size:14px;color:#5c554c;margin-top:8px;font-variant-numeric:tabular-nums">${fecha(tk.date)} · ${hora(tk.date)} · ${esc(tk.level)}</div>
      <div style="display:flex;gap:clamp(18px,3vw,34px);margin-top:18px;padding-top:14px;border-top:1px solid #d9d1c2">
        ${ga ? `<div><div class="lbl">Acceso</div><div class="val">PISTA</div></div><div><div class="lbl">Ubicación</div><div class="val">DE PIE</div></div>`
          : `<div><div class="lbl">Sección</div><div class="val">${esc(tk.sec)}</div></div><div><div class="lbl">Fila</div><div class="val">${esc(tk.row)}</div></div><div><div class="lbl">Asiento</div><div class="val">${esc(tk.num)}</div></div>`}
        <div style="margin-left:auto;text-align:right;min-width:0"><div class="lbl">A nombre de</div><div style="font-weight:650;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(tk.holder)}</div></div>
      </div>
    </div>
    <div class="stub">${qr ? `<img src="${qr}" alt="Código QR del boleto ${tk.n}" width="128" height="128">` : ''}<span class="lbl" style="font-variant-numeric:tabular-nums">${esc(tk.code)}-${tk.n}</span></div>
  </article>`;
}
