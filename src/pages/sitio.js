import '../styles/base.css';
import '../styles/sitio.css';
import { mountChrome } from '../lib/chrome.js';
import { nextEvent } from '../lib/events.js';
import { OFICIAL } from '../lib/oficial.js';

/* Páginas con el contenido del sitio oficial de Arena Gallo: textos, fotos y datos tal como ellos los usan,
   con el diseño y la boletería de este sitio. Cada página se arma según <body data-page="…">. */

const page = document.body.dataset.page;
mountChrome(page);
const main = document.getElementById('main');
const ev = nextEvent();
const seats = (nivel) => `/asientos.html?evento=${ev.id}${nivel ? '&nivel=' + nivel : ''}`;
const ARROW = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg>';
const img = (src, alt = '', w = 1920, h = 1080, eager = false) => `<img src="${src}" alt="${alt}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
const hero = (src, kicker, title, sub = '', acts = '') => `
  <section class="pg-hero">${img(src, '', 1920, 1080, true)}
    <div class="in">${kicker ? `<p class="kicker-up">${kicker}</p>` : ''}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}${acts ? `<div class="acts">${acts}</div>` : ''}</div>
  </section>`;
const btn = (href, text, cls = 'btn-red') => `<a class="btn ${cls}" href="${href}">${text} <span class="arr">${ARROW}</span></a>`;
const sec = (inner, id = '') => `<section class="sec"${id ? ` id="${id}"` : ''}>${inner}</section>`;

/* ═════════ ARENA ═════════ */
function arena() {
  const ICONOS = [
    ['musica', 'Experiencias musicales', 'conciertos'],
    ['cultura', 'Experiencias culturales', 'culturales'],
    ['deporte', 'Eventos deportivos', 'deportes'],
    ['convenciones', 'Convenciones', 'corporativos'],
  ];
  const TABS = [
    ['Asegurar un funcionamiento logístico para los visitantes', [
      'Rutas peatonales protegidas y establecidas',
      'Soluciones de movilidad para descongestionar las vías principales',
      'Parqueos en sitio',
      'Diseño térmico y acústico para minimizar el impacto del visitante',
      'Áreas designadas para Uber, transporte privado, accesos peatonales, facilidades para personas con necesidades especiales y accesos VIP.',
      'Ingreso seguro y ordenado con altas medidas de seguridad',
      'Eliminación de la reventa de tickets informal',
    ]],
    ['Generar empleos y oportunidades de desarrollo', [
      'Durante la construcción: más de 1,500 empleos directos, impulsando la demanda de talento calificado y formación en nuevas especialidades técnicas',
      'Durante la operación: generación de cientos de empleos permanentes en áreas como mantenimiento, tecnología, servicio al cliente, seguridad y alimentos y bebidas',
      'Durante los eventos: más de 800 empleos por evento, con una oferta anual que duplicará la cantidad de eventos actuales y elevará los estándares de gestión y operación.',
    ]],
    ['Activar la economía local', [
      'Turismo y hospitalidad: mayor ocupación hotelera y crecimiento en transporte, gastronomía y turismo interno',
      'Comercio y servicios locales: impulso para restaurantes, tiendas, movilidad, entretenimiento y proveedores logísticos',
      'Eventos y patrocinios: atracción de marcas internacionales que invierten en activaciones, experiencias y alianzas con la arena',
      'Consumo e inversión nacional',
      'Dinamización de la economía a través del gasto en servicios, generación de empleo y nuevas oportunidades de inversión.',
    ]],
  ];
  const ECO = [
    ['Eficiencia Energética', 'Monitoreo y control del consumo energético mediante sistemas de gestión que optimizan el uso de iluminación, climatización y otros equipos, permitiendo mejorar continuamente el desempeño energético de la arena.'],
    ['Ventilación Natural', 'Diseño arquitectónico que favorece la ventilación cruzada y la circulación natural del aire, mejorando la calidad ambiental interior y reduciendo la dependencia de sistemas mecánicos de climatización.'],
    ['Reducción de Residuos', 'Durante la construcción, se aplicaron estrategias de gestión de residuos que prioriza la reutilización y el reciclaje de materiales, con el objetivo de minimizar el impacto ambiental del proyecto.'],
    ['Comunidad', 'El proyecto promueve la participación de mano de obra local y el fortalecimiento de capacidades técnicas, contribuyendo al desarrollo económico y profesional de la comunidad.'],
  ];
  main.innerHTML = hero(OFICIAL.fachada, 'Arena Gallo · Cayalá, Zona 16', 'Una arena hecha para <em>sentirlo en grande.</em>', 'Más de 14,500 asientos, 22 suites y más de 50 eventos al año en el corazón de Guatemala.', btn(seats(), 'Recorrer la arena en 3D') + btn('/eventos.html', 'Ver la cartelera', 'btn-ghost'))
  + `<section class="band"><img src="${OFICIAL.escena}" alt="" width="1920" height="925" loading="lazy" decoding="async"><div class="in">
      <h2 class="h-sec">El comienzo de<br>un <span style="color:var(--red-ink)">nuevo capítulo</span></h2>
      <p class="lede">En la historia del entretenimiento en la región.</p>
      <p class="lede">Nace un nuevo ícono, una arena hecha para sentirlo en grande.</p></div></section>`
  + sec(`<div class="sound">
      <div class="sound-copy"><p class="kicker-up">Acústica</p><h2 class="h-sec">La Arena que marca un antes y un después</h2>
        <p class="lede">Con ingeniería acústica de clase mundial, está creada para que cada sonido cobre vida y cada momento se vuelva inolvidable.</p></div>
      <figure class="sound-pic">${img(OFICIAL.sonido, 'Un violinista y un público con las manos arriba, en blanco y negro', 1920, 925)}</figure>
    </div>`)
  + `<section class="band center" style="margin-top:clamp(72px,9vw,132px)"><img src="${OFICIAL.degradado}" alt="" width="1920" height="600" loading="lazy" decoding="async"><div class="in">
      <h2 class="h-sec" style="font-size:clamp(32px,4vw,58px)">Un espacio diseñado para transformar cada evento en una experiencia.</h2>
      <ul class="kinds">${ICONOS.map(([k, t, tipo]) => `<li><a href="/eventos.html?tipo=${tipo}">${img(OFICIAL.iconos[k], '', 349, 324)}<span>${t}</span></a></li>`).join('')}</ul></div></section>`
  + `<section class="impact" style="margin-top:0">${img(OFICIAL.volcan, '', 1920, 1380).replace('<img', '<img class="impact-bg"')}
      <div class="impact-in"><p class="kicker-up">Arena Guatemala</p><h2 class="h-sec">Se convierte en un motor</h2>
        <p class="lede">social, cultural y económico para el país</p>
        <div class="tabs" role="tablist">${TABS.map(([t], i) => `<button role="tab" type="button" id="tab${i}" aria-controls="tp${i}" aria-selected="${i === 0}"><b>${i + 1}</b>${t}</button>`).join('')}</div>
        ${TABS.map(([t, items], i) => `<div class="tabpanel" role="tabpanel" id="tp${i}" aria-labelledby="tab${i}" ${i ? 'hidden' : ''}><h3>${t}</h3><ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul></div>`).join('')}
      </div></section>`
  + sec(`<div class="eco-band">${img(OFICIAL.bosque, '', 1920, 325)}<h2 class="h-sec">Compromisos Ambientales</h2></div>
    <div class="eco">
      <div class="eco-goal">${img(OFICIAL.goal, 'GOAL, Green Operations & Advanced Leadership', 1076, 325)}
        <p>Goal es un programa de sostenibilidad para la industria de eventos en vivo que mide y mejora el desempeño ambiental de los espacios mediante un estándar claro y medible.</p>
        <p>Además, es uno de los principales asesores a nivel mundial en el diseño, funcionamiento y rendimiento sostenible de arenas.</p></div>
      <div><p class="lede" style="margin:0 0 18px">El proyecto ha sido desarrollado bajo criterios que consideran su ciclo de vida completo, incorporando medidas para optimizar el uso de energía, mejorar la calidad ambiental interior y reducir la generación de residuos.</p>
        <div class="eco-list">${ECO.map(([t, d], i) => `<details${i === 0 ? ' open' : ''}><summary>${t}<span aria-hidden="true"></span></summary><p>${d}</p></details>`).join('')}</div></div>
    </div>`, 'ambiente');
  // pestañas accesibles (flechas izquierda/derecha)
  const tabs = [...main.querySelectorAll('[role="tab"]')];
  const show = (i) => tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; document.getElementById('tp' + j).hidden = i !== j; });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; show(n); tabs[n].focus(); } });
  });
  show(0);
}

/* ═════════ ESPACIOS ═════════ */
function espacios() {
  const E = OFICIAL.espacios;
  const PREM = [
    ['Club Lounge', E.clubLounge, 'Un lounge privado que ofrece la experiencia exclusiva de un club. Es el espacio ideal para compartir, celebrar y disfrutar cada momento con estilo.', ['/contacto.html?interes=premium', 'Solicitar información']],
    ['Sky Lounges', E.skyLounges, 'Lounges privados en lo alto de la arena, con barra y vista a todo el recinto, para vivir el evento con tu grupo.', ['/contacto.html?interes=premium', 'Solicitar información']],
    ['Club Seating', E.clubSeating, 'Asientos del nivel Club con acceso a sus áreas exclusivas de alimentos y bebidas.', [seats('club'), 'Elegir asientos en Club']],
    ['Suites', E.suites, '22 suites privadas para recibir a clientes, familia o amigos con servicio y vista directa al escenario.', [seats('suites'), 'Ver suites disponibles']],
  ];
  main.innerHTML = hero(E.portada, 'Espacios Premium', 'Donde la exclusividad se vive <em>a otro nivel</em>', 'Club Lounge, Sky Lounges, Club Seating y Suites.', btn('#premium', 'Conocer los espacios') + btn(seats('suites'), 'Ver suites en 3D', 'btn-ghost'))
  + `<section class="band"><img src="${E.lineas}" alt="" width="1920" height="1380" loading="lazy" decoding="async"><div class="in">
      <h2 class="h-sec">Una nueva forma<br>de vivir el espectáculo.</h2>
      <p class="lede">Un lugar donde las marcas pueden ser parte del espectáculo y dejar una huella en las experiencias más memorables de sus clientes.</p>
      <p class="lede" style="margin-top:28px"><b style="color:#fff">Aquí, las experiencias premium no son solo espacios. Son una oportunidad para las marcas.</b><br>Conectar asistentes, seguidores, empleados, aliados y proveedores en un entorno lleno de energía, emoción y celebración.</p></div></section>`
  + sec(`<ul class="cards two">
      <li>${img(E.traslado, 'Viajera con una maleta roja en un aeropuerto', 870, 780)}<h3>Una ubicación estratégica que permite el traslado rápido y eficiente de artistas y producción</h3></li>
      <li>${img(E.hoteles, 'Recepción de un hotel', 870, 780)}<h3>A minutos de una amplia oferta hotelera</h3></li>
    </ul><p class="lede" style="margin-top:22px">Todo bajo una atmósfera creada para vivirlo en grande.</p>`)
  + sec(`<div class="sec-head"><div><p class="kicker-up">La arena</p><h2 class="h-sec">Cada espacio, en su lugar</h2></div>${btn(seats(), 'Recorrer en 3D', 'btn-ghost')}</div>
    <figure class="plan-of"><picture><source media="(max-width: 700px)" srcset="${E.mapaVertical}">${img(E.mapa, 'Plano de la arena: más de 1,900 parqueos, club seating, más de 14,500 asientos, suites, club lounge y bunker suites', 1920, 1380)}</picture></figure>`)
  + sec(`<div class="split">
      <div><p class="kicker-up">Interiorismo</p><h2 class="h-sec">Interiorismo inspirado en Guatemala.</h2>
        <p class="lede">El concepto arquitectónico de la arena busca transmitir y resaltar todo lo que caracteriza y hace única a Guatemala. Cada detalle del diseño rinde homenaje a los paisajes que definen nuestra identidad: volcanes, lagos, naturaleza, texturas y colores.</p>
        <div class="prem-tabs" role="tablist" id="premium">${PREM.map(([t], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}">${t}</button>`).join('')}</div>
        <div class="prem" id="premBody"></div></div>
      <figure id="premPic"></figure>
    </div>`)
  + `<section class="band center" style="margin-top:clamp(72px,9vw,132px)"><img src="${E.luces}" alt="" width="1920" height="450" loading="lazy" decoding="async"><div class="in">
      <h2 class="h-sec">Aquí, las experiencias no solo se ven, se viven.</h2>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:26px">${btn('/contacto.html?interes=premium', 'Quiero un espacio premium')}${btn(seats('suites'), 'Ver suites en 3D', 'btn-ghost')}</div></div></section>`;
  const body = document.getElementById('premBody'); const pic = document.getElementById('premPic');
  const tabs = [...main.querySelectorAll('.prem-tabs button')];
  const show = (i) => {
    const [t, src, d, [href, label]] = PREM[i];
    tabs.forEach((b, j) => b.setAttribute('aria-selected', String(i === j)));
    body.innerHTML = `<h3>${t}</h3><p>${d}</p><div class="acts">${btn(href, label)}</div>`;
    pic.innerHTML = img(src, t, 870, 780);
  };
  tabs.forEach((b) => b.addEventListener('click', () => show(+b.dataset.i)));
  show(0);
}

/* ═════════ UBICACIÓN ═════════ */
function ubicacion() {
  const U = OFICIAL.ubicacion;
  const I = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const VISITA = [
    [I('<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M9.5 16.5v-9h3.2a2.7 2.7 0 0 1 0 5.4H9.5"/>'), 'Más de 1,900 parqueos', 'Estacionamiento dentro del complejo, a pasos de las entradas.'],
    [I('<path d="M5 15.5V12l1.7-4.2A2 2 0 0 1 8.6 6.5h6.8a2 2 0 0 1 1.9 1.3L19 12v3.5"/><path d="M4 15.5h16v2.2a.8.8 0 0 1-.8.8H4.8a.8.8 0 0 1-.8-.8z"/><path d="M5 12h14M7.5 18.5v1.5M16.5 18.5v1.5"/>'), 'Uber y transporte privado', 'Áreas designadas para subir y bajar sin congestionar las vías principales.'],
    [I('<circle cx="13" cy="4.5" r="1.7"/><path d="M11 21l1.6-5.4L10 13l1.2-5 3.3 3 2.5.8"/><path d="M8.5 21l1.8-4.6M11.2 8l-2.7 1.4L7.5 12"/>'), 'Rutas peatonales protegidas', 'Caminos establecidos y seguros desde Ciudad Cayalá hasta las puertas.'],
    [I('<circle cx="12" cy="4.5" r="1.7"/><path d="M12 7.5v6h4.5l2 5"/><path d="M12 10h4"/><path d="M8.8 11.2a5 5 0 1 0 6.9 6.4"/>'), 'Accesibilidad', 'Facilidades para personas con necesidades especiales y accesos VIP.'],
    [I('<path d="M12 3l7 3v5.5c0 4.3-3 8-7 9.5-4-1.5-7-5.2-7-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.4-4.6"/>'), 'Ingreso seguro y ordenado', 'Altas medidas de seguridad y torniquetes con tu código QR.'],
    [I('<path d="M3.5 7.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-2a2.5 2.5 0 0 0 0-5z"/><path d="M14.5 6v12" stroke-dasharray="1.6 2.2"/><path d="M7.5 10.5l1.6 1.6 3-3"/>'), 'Sin reventa informal', 'Cada boleto tiene un QR único que se valida en la puerta.'],
  ];
  const MAPS = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Ciudad Cayalá, Zona 16, Guatemala');
  main.innerHTML = hero(U.portada, 'Ubicación', 'Ubicada en el corazón <em>del entretenimiento</em>', 'Ciudad Cayalá, Zona 16, Ciudad de Guatemala.', `<a class="btn btn-red" href="${MAPS}" target="_blank" rel="noopener">Cómo llegar <span class="arr">${ARROW}</span></a>`)
  + sec(`<div class="split">
      <div><p class="kicker-up">El nuevo hogar de Arena Guatemala</p>
        <div class="partners" style="margin:0;display:block"><div class="logo" style="max-width:340px">${img(OFICIAL.nosotros.logos.cayala, 'Ciudad Cayalá', 365, 90)}</div></div>
        <h2 class="h-sec" style="margin-top:24px">Uno de los desarrollos urbanos más emblemáticos de Guatemala.</h2>
        <p class="lede">Basada en la arquitectura del nuevo urbanismo, es una “ciudad dentro de la ciudad”, combinando amplios espacios peatonales, residencias, comercios y restaurantes, todo en un entorno seguro y vibrante.</p></div>
      <figure>${img(U.cayala, 'Ciudad Cayalá desde el aire', 750, 500)}<figcaption>Ciudad Cayalá, Zona 16.</figcaption></figure>
    </div>`)
  + sec(`<h2 class="h-sec">La arena en un entorno ideal</h2>
    <ul class="cards">${[['Comercio', U.comercio], ['Hoteles', U.hoteles], ['Restaurantes', U.restaurantes], ['Parqueos', U.parqueos]].map(([t, s]) => `<li>${img(s, '', 400, 400)}<h3>${t}</h3></li>`).join('')}</ul>`)
  + sec(`<div class="sec-head"><div><p class="kicker-up">Mapa</p><h2 class="h-sec">Cómo llegar</h2></div><a href="${MAPS}" target="_blank" rel="noopener">Abrir en Google Maps ${ARROW}</a></div>
    <div class="yt" style="margin-top:28px;aspect-ratio:16/8"><iframe title="Mapa de Ciudad Cayalá" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent('Ciudad Cayalá, Zona 16, Guatemala')}&z=15&output=embed"></iframe></div>`)
  + sec(`<div class="sec-head"><div><p class="kicker-up">Tu visita</p><h2 class="h-sec">Llegar, entrar y salir, sin vueltas.</h2></div><a href="/boletos.html">Mis boletos ${ARROW}</a></div>
    <ul class="visit">${VISITA.map(([ic, t, d]) => `<li><span class="vi">${ic}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ul>`);
}

/* ═════════ QUIÉNES SOMOS ═════════ */
function nosotros() {
  const N = OFICIAL.nosotros;
  const SOCIOS = [
    ['FACTOR', N.logos.factor, 'Es una firma de estrategia inmobiliaria con más de 25 años de experiencia desarrollando proyectos en distintos ciclos de mercado, identificando oportunidades de inversión y analizando cada desarrollo para generar valor real.'],
    ['ASA PROMOTIONS', N.logos.asa, 'Se ha consolidado como una de las productoras de espectáculos más importantes de Guatemala. Especialistas en eventos públicos y privados, y en la contratación y producción de artistas internacionales, su misión es crear experiencias que emocionan y se convierten en momentos inolvidables.'],
    ['ZACSA', N.logos.zacsa, 'Con más de 25 años de trayectoria, en ZACSA ofrecemos soluciones inmobiliarias integrales, innovadoras y personalizadas. Nos especializamos en el desarrollo de proyectos llave en mano, donde nuestra gestión profesional garantiza una entrega impecable y lista para su uso. Cumplimos rigurosamente con los más altos estándares de calidad y excelencia.'],
    ['CIUDAD CAYALÁ', N.logos.cayala, 'Es un desarrollo único en la región. Basada en la arquitectura del nuevo urbanismo es una “ciudad dentro de la ciudad”, combinando amplios espacios peatonales, residencias, comercios y restaurantes, todo en un entorno seguro y vibrante.'],
  ];
  main.innerHTML = hero(N.portada, 'Quiénes somos', '¿Cómo lo hacemos?', 'Con visión estratégica y ejecución impecable.')
  + sec(`<div class="split">
      <div><h2 class="h-sec">Un diseño arquitectónico y acústico pensado para experiencias inolvidables.</h2>
        <p class="lede">Optimizando cada punto de contacto: accesos, flujo, seguridad, servicios y zonas premium.</p></div>
      <figure>${img(N.lounge, 'Club lounge VIP', 859, 500)}<figcaption>Club lounge VIP</figcaption></figure>
    </div>`)
  + sec(`<p class="kicker-up">Haciendo equipo con</p><h2 class="h-sec">los mejores</h2>
    <ul class="partners">${SOCIOS.map(([t, logo, d]) => `<li><div class="logo">${img(logo, t, 365, 90)}</div><h3>${t}</h3><p>${d}</p></li>`).join('')}</ul>`)
  + `<section class="band center" style="margin-top:clamp(72px,9vw,132px)"><img src="${N.publico}" alt="" width="1920" height="450" loading="lazy" decoding="async"><div class="in">
      <h2 class="h-sec">¿Estás interesado en conocer más?</h2>
      <div style="margin-top:26px">${btn('/contacto.html', 'Más información')}</div></div></section>`;
}

/* ═════════ ALIANZAS ═════════ */
function alianzas() {
  const A = OFICIAL.alianzas;
  const OFERTAS = [['Quiero ser founding member', 'founding'], ['Quiero ser aliado comercial', 'alianza'], ['Quiero espacios publicitarios', 'publicidad']];
  main.innerHTML = hero(A.portada, 'Alianzas', 'Las marcas no solo se muestran, <em>se viven</em>', 'acompañando a las audiencias en los momentos que más importan.')
  + sec(`<h2 class="h-sec">Sé parte de la arena</h2>
    <ul class="offers">${OFERTAS.map(([t, k]) => `<li><a href="/contacto.html?interes=${k}"><b>${t}</b><small>Más información ${ARROW}</small></a></li>`).join('')}</ul>`)
  + `<section class="band" style="margin-top:clamp(72px,9vw,132px)"><img src="${A.publico}" alt="" width="1920" height="700" loading="lazy" decoding="async"><div class="in">
      <h2 class="h-sec">Contáctanos para conocer más<br>sobre las oportunidades de sponsorships</h2>
      <div style="margin-top:26px">${btn('/contacto.html?interes=alianza', 'Más información')}</div></div></section>`;
}

/* ═════════ CONTACTO ═════════ */
function contacto() {
  const C = OFICIAL.contacto;
  const OPCIONES = [['proveedor', 'Proveedor'], ['alianza', 'Buscas una alianza'], ['publicidad', 'Publicidad'], ['artista', 'Artista'], ['trabajo', 'Trabajar con nosotros'], ['promotor', 'Promotor de evento'], ['premium', 'Espacios premium'], ['founding', 'Founding member'], ['otro', 'Otro']];
  const pre = new URLSearchParams(location.search).get('interes') || '';
  main.innerHTML = hero(C.portada, 'Contacto', 'Es aquí, donde los grandes <em>momentos comienzan</em>')
  + sec(`<div class="contact">
      <figure>${img(C.cantante, 'Cantante a contraluz frente al público', 1400, 1921)}</figure>
      <div><h2 class="h-sec">¿Quieres ponerte en contacto con nosotros?</h2>
        <p class="lede">Ya seas artista, proveedor o busques una alianza estratégica, queremos saber de ti. Selecciona tu categoría y nos pondremos en contacto contigo.</p>
        <form class="cform" id="cform" novalidate>
          <div class="field"><label for="c1">Nombre completo</label><input id="c1" name="nombre" autocomplete="name" required></div>
          <div class="field"><label for="c2">Correo</label><input id="c2" name="correo" type="email" autocomplete="email" inputmode="email" required></div>
          <div class="field"><label for="c3">Teléfono <span class="muted2" style="font-weight:400">(opcional)</span></label><input id="c3" name="tel" type="tel" autocomplete="tel" placeholder="+502 5555 0000"></div>
          <div class="field"><label for="c4">Interés en</label><select id="c4" name="interes" required><option value="">Selecciona una opción</option>${OPCIONES.map(([v, t]) => `<option value="${v}"${v === pre ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
          <div class="field full"><label for="c5">Mensaje</label><textarea id="c5" name="mensaje" placeholder="Cuéntanos en qué te podemos ayudar"></textarea></div>
          <p class="note">Sitio de demostración: este formulario no envía tus datos a ningún lado.</p>
          <p id="cerr" role="alert" class="full" style="margin:0;color:var(--red-ink);font-size:14px;min-height:20px"></p>
          <button class="btn btn-red full" type="submit">Enviar</button>
        </form></div>
    </div>`);
  const f = document.getElementById('cform');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = document.getElementById('cerr');
    if (f.nombre.value.trim().length < 3) { err.textContent = 'Escribe tu nombre completo.'; f.nombre.focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(f.correo.value.trim())) { err.textContent = 'Revisa tu correo.'; f.correo.focus(); return; }
    if (!f.interes.value) { err.textContent = 'Selecciona tu categoría.'; f.interes.focus(); return; }
    const nombre = f.nombre.value.trim().split(' ')[0].replace(/[<>&"']/g, '');
    f.innerHTML = `<div class="ok" role="status"><b>Gracias, ${nombre}.</b><br>Recibimos tu mensaje y nos pondremos en contacto contigo. (Demostración: no se envió ningún dato.)</div>`;
  });
}

({ arena, espacios, ubicacion, nosotros, alianzas, contacto })[page]?.();
