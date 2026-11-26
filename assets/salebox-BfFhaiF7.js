import{s as $,d as p,h as m,S as f}from"./chrome-T4cV4kVc.js";const y='<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7 V5 a3 3 0 0 1 6 0 V7"/></svg>',g='<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4" fill="#df001c"/></svg>';function w(t,u,{buyHref:b,buyLabel:h="Comprar boletos",previewHref:i}={}){let d="";const r=()=>{const e=$(u),c=[e.open,e.locked,e.soldOut,e.wins.map(l=>l.st).join()].join("|");if(c!==d){d=c;const l=e.soldOut?"Agotado":e.open?`${e.active.name}: la venta cierra en`:e.locked?`${e.next.name} abre en`:"Falta para el evento",x=e.soldOut?"Ya no quedan boletos para este evento.":e.open?"Al elegir tus asientos se apartan por 10 minutos.":e.locked?`Abre el ${p(e.next.open).toLowerCase()} a las ${m(e.next.open)}. Ten tu cuenta lista.`:"Las ventanas de venta ya terminaron.",o=i?`<a class="btn btn-ghost" href="${i}">Ver el recinto en 3D</a>`:"",v=e.open?`<a class="btn btn-red" href="${b}">${h}</a>${o}`:e.locked?`<button class="btn btn-white" type="button" data-notify>Avísame cuando abra</button>${o}`:o;t.className="salebox"+(e.open?" open":""),t.innerHTML=`
        <div class="in">
          <div class="status">${e.open?g:e.locked?y:""}${l}</div>
          ${e.soldOut?"":`<div class="cd" style="margin-top:12px" role="timer" aria-live="off">
            <div><b data-d>00</b><small>d</small></div><div><b data-h>00</b><small>h</small></div>
            <div><b data-m>00</b><small>min</small></div><div><b data-s>00</b><small>s</small></div>
          </div>`}
          <p class="sub" style="margin:12px 0 0">${x}</p>
          ${v?`<div class="sale-row" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">${v}</div>`:""}
          <div class="wins" aria-label="Ventanas de venta">${e.wins.map(a=>`
            <div><div><b>${a.name}</b><small>${p(a.open)} · ${m(a.open)}</small></div>
            <span class="pill ${a.st}">${f[a.st]}</span></div>`).join("")}</div>
        </div>`;const n=t.querySelector("[data-notify]");n&&n.addEventListener("click",()=>{n.textContent="Listo, te avisaremos",n.disabled=!0})}if(e.soldOut)return;const s=e.left;t.querySelector("[data-d]").textContent=s.d,t.querySelector("[data-h]").textContent=s.h,t.querySelector("[data-m]").textContent=s.m,t.querySelector("[data-s]").textContent=s.s};return r(),setInterval(r,1e3)}export{w as m};
