import{m as y,e as E,n as M,r as L,u as P,v as x,h as w,f as v,w as A}from"./chrome-T4cV4kVc.js";/* empty css              */import{m as S}from"./salebox-BfFhaiF7.js";import{e as B,a as I}from"./media-C0Tm4nKI.js";const z=13,j=20,C=2.6,m=Math.PI-40*Math.PI/180;function f(e,a){const n=Math.sin(e),l=Math.cos(e),d=2/C;return[(z+a)*Math.sign(n)*Math.abs(n)**d,(j+a)*Math.sign(l)*Math.abs(l)**d]}const h=e=>e.toFixed(2);function R(e,a,n,l,d=10){const s=[],r=[];for(let i=0;i<=d;i++){const o=n+(l-n)*i/d;s.push(f(o,a)),r.unshift(f(o,e))}return"M"+[...s,...r].map(([i,o])=>`${h(i)},${h(o)}`).join("L")+"Z"}const q=[{id:"lower",d0:3.5,d1:15.4,n:24},{id:"suites",d0:16.6,d1:21.2,n:22},{id:"club",d0:22.6,d1:28,n:20},{id:"upper",d0:30.6,d1:36.9,n:26}];function k(e,{label:a="Plano del recinto"}={}){const l=q.map(s=>{const r=2*m/s.n;let i="";for(let o=0;o<s.n;o++)i+=R(s.d0,s.d1,-m+o*r+.006,-m+(o+1)*r-.006,4);return`<path data-z="${s.id}" d="${i}" fill="${e[s.id]}" fill-opacity="${s.id==="suites"?.9:.82}"/>`}).join("");let d="M";for(let s=0;s<=64;s++){const[r,i]=f(Math.PI*2*s/64,-.8);d+=`${h(r)},${h(i)}${s<64?"L":"Z"}`}return`<svg viewBox="-51 -48 102 106" role="img" aria-label="${a}">
    <path d="${d}" data-z="ga" fill="${e.ga}" fill-opacity=".85"/>
    ${l}
    <rect x="-13.5" y="-35" width="27" height="12.5" rx="1" fill="#2a2724"/>
    <text x="0" y="-27.4" text-anchor="middle" font-size="3.6" font-weight="800" font-stretch="70%" fill="#c4bcb0" letter-spacing=".4">ESCENARIO</text>
  </svg>`}y("eventos",{cta:!1});const t=E(new URLSearchParams(location.search).get("id"))||M(),g=L(t.tipo);document.title=`${t.name} · Arena Gallo`;const u=`/asientos.html?evento=${t.id}`,G=e=>{const[a,n]=t.prices[e];return a===n?v(a):`${v(Math.min(a,n))} – ${v(Math.max(a,n))}`},$='<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg>',b=[["suites","Suites VIP","#ffcf6b","22 suites privadas de 16 asientos"],["lower","Platea Baja","#e0182d","14 filas, lo más cerca del escenario"],["club","Club Gallo","#f08a24","6 filas en el nivel intermedio"],["ga","Pista General","#f4efe6","De pie, frente al escenario"],["upper","Platea Alta","#4f86d6","7 filas con vista de todo el recinto"]],O=Object.fromEntries(b.map(([e,,a])=>[e,a]));document.getElementById("app").innerHTML=`
<section class="ev-hero">
  <img src="${B(t.id)}" alt="" width="1280" height="720">
  <div class="container">
    <div>
      <nav class="crumbs" aria-label="Ruta"><a href="/eventos.html">Cartelera</a><span aria-hidden="true">/</span><a href="/eventos.html?tipo=${g.id}">${g.label}</a></nav>
      <h1 class="ev-name">${t.name}</h1>
      <p class="ev-blurb">${t.blurb}</p>
      <dl class="facts">
        <div><dt>${P(t.date)}</dt><dd>${x(t.date).replace(/ \d{4}$/,"")}</dd></div>
        <div><dt>Inicio</dt><dd>${w(t.date)}</dd></div>
        <div><dt>Puertas</dt><dd>${t.doors}</dd></div>
        <div><dt>Edad</dt><dd>${t.age}</dd></div>
      </dl>
    </div>
    <div id="salebox"></div>
  </div>
</section>
<section class="container ev-body">
  <div class="ev-grid">
    <div>
      <h2>Zonas y precios</h2>
      <p class="muted" style="margin:0">Desde ${v(A(t))}. Elige una zona para ver sus asientos en 3D.</p>
      <div class="plan" id="plan">
        ${k(O,{label:`Plano de Arena Gallo con las zonas a la venta para ${t.name}`})}
        <div class="prices">${b.map(([e,a,n,l])=>`
          <a href="${u}&nivel=${e}" data-zone="${e}"><span class="zdot" style="background:${n}"></span>
            <span><span class="n">${a}</span><br><small class="muted2">${l}</small></span><span class="p">${G(e)}</span>${$}</a>`).join("")}</div>
      </div>
      <p class="note">Los precios no incluyen el 10 % de cargo por servicio. Máximo 8 boletos por compra.</p>
      <a href="${u}&vista=asiento" class="pov-cta">
        <img src="${I(t.id)}" alt="" width="1600" height="686" loading="lazy">
        <div><b>Mira el escenario desde tu asiento antes de pagar.</b><span class="btn btn-white">Abrir el recinto en 3D <span class="arr">${$}</span></span></div>
      </a>
    </div>
    <div>
      <h2>Antes de ir</h2>
      <ul class="know">
        <li><b>Puertas a las ${t.doors}</b>Llega con tiempo: en la entrada principal se forman filas.</li>
        <li><b>Boletos digitales</b>Tu código QR aparece en Mis boletos al terminar la compra. Muéstralo en el torniquete.</li>
        <li><b>Parqueo en Ciudad Cayalá</b>Se llena rápido en noches de evento; el transporte compartido es la opción más fácil.</li>
        <li><b>Accesibilidad</b>Rampas y lugares para silla de ruedas en Platea Baja.</li>
        <li><b>Edad</b>${t.age==="18+"?"Solo mayores de 18 años, con documento de identificación.":"Para todas las edades. Los menores entran con un adulto."}</li>
      </ul>
    </div>
  </div>
</section>`;S(document.getElementById("salebox"),t,{buyHref:u,buyLabel:"Elegir asientos",previewHref:`${u}&vista=asiento`});const p=document.getElementById("plan"),c=e=>{p.classList.toggle("hov",!!e),p.querySelectorAll("[data-z]").forEach(a=>a.classList.toggle("on",a.dataset.z===e)),p.querySelectorAll("[data-zone]").forEach(a=>a.classList.toggle("on",a.dataset.zone===e))};p.querySelectorAll("[data-zone]").forEach(e=>{e.addEventListener("mouseenter",()=>c(e.dataset.zone)),e.addEventListener("focus",()=>c(e.dataset.zone)),e.addEventListener("mouseleave",()=>c(null)),e.addEventListener("blur",()=>c(null))});p.querySelectorAll("svg [data-z]").forEach(e=>{e.addEventListener("mouseenter",()=>c(e.dataset.z)),e.addEventListener("mouseleave",()=>c(null)),e.addEventListener("click",()=>{location.href=`${u}&nivel=${e.dataset.z}`})});
