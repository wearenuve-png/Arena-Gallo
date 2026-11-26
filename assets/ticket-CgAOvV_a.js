import{q as s,d,h as t}from"./chrome-T4cV4kVc.js";const v={hi:"#159a8a",mid:"#58b5a9",dim:"#cddfda"},a=i=>String(i??"").replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l]);function c(i){const l=i.sec==="PISTA",e=String(i.qr).startsWith("data:image/png")?i.qr:"";return`<article class="ticket" aria-label="Boleto ${a(i.code)}-${i.n} para ${a(i.eventName)}">
    <div class="main">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div style="height:30px">${s({title:"Arena Gallo",arena:"#1a1714",colors:v}).replace("<svg ",'<svg style="height:30px;width:auto;display:block" ')}</div>
        <span class="lbl" style="font-variant-numeric:tabular-nums">Compra ${a(i.code)}</span>
      </div>
      <div style="font-size:clamp(34px,4.4vw,52px);font-weight:800;font-stretch:64%;line-height:.86;text-transform:uppercase;margin-top:16px">${a(i.eventName)}</div>
      <div style="font-size:14px;color:#5c554c;margin-top:8px;font-variant-numeric:tabular-nums">${d(i.date)} · ${t(i.date)} · ${a(i.level)}</div>
      <div style="display:flex;gap:clamp(18px,3vw,34px);margin-top:18px;padding-top:14px;border-top:1px solid #d9d1c2">
        ${l?'<div><div class="lbl">Acceso</div><div class="val">PISTA</div></div><div><div class="lbl">Ubicación</div><div class="val">DE PIE</div></div>':`<div><div class="lbl">Sección</div><div class="val">${a(i.sec)}</div></div><div><div class="lbl">Fila</div><div class="val">${a(i.row)}</div></div><div><div class="lbl">Asiento</div><div class="val">${a(i.num)}</div></div>`}
        <div style="margin-left:auto;text-align:right;min-width:0"><div class="lbl">A nombre de</div><div style="font-weight:650;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a(i.holder)}</div></div>
      </div>
    </div>
    <div class="stub">${e?`<img src="${e}" alt="Código QR del boleto ${i.n}" width="128" height="128">`:""}<span class="lbl" style="font-variant-numeric:tabular-nums">${a(i.code)}-${i.n}</span></div>
  </article>`}export{c as t};
