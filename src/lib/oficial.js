/* ════════════════════════════════════════════════════════════════════
   CONTENIDO DEL SITIO OFICIAL — https://arenagallo.com (© Arena Guatemala)
   Fotos, video y datos tal como los usa el sitio oficial, página por página.
   Las imágenes se cargan desde su servidor. Para hospedarlas aquí: descárgalas a
   /public/media/oficial/ y cambia `U4`/`U5` por '/media/oficial/'. Es el único lugar que hay que tocar.
   ════════════════════════════════════════════════════════════════════ */
const U4 = 'https://arenagallo.com/wp-content/uploads/2026/04/';
const U5 = 'https://arenagallo.com/wp-content/uploads/2026/05/';

/* video de la portada oficial (YouTube, 30 s) */
export const VIDEO = { youtube: 'P9osmtiYvDE', poster: 'https://i.ytimg.com/vi/P9osmtiYvDE/maxresdefault.jpg' };

/* datos publicados en la portada oficial */
export const CIFRAS = [
  ['14,500', 'asientos', 'Más de'],
  ['22', 'suites', ''],
  ['3,750 m²', 'de espacios VIP', ''],
  ['90,000 m²', 'de construcción', 'Más de'],
  ['50', 'eventos al año', 'Más de'],
  ['1,900', 'parqueos', 'Más de'],
  ['2', 'food halls', ''],
  ['36', 'ventas de comida y bebidas', 'Más de'],
];

export const OFICIAL = {
  /* ── Home ── */
  home: {
    publico: U4 + 'INICIO_ADAPTACIONES-01.webp',      // 1920×925 · público en concierto, luces moradas
    fan: U4 + 'INICIO_ADAPTACIONES-02.webp',          // 750×960  · fan con el celular arriba frente a la pantalla
    cello: U4 + 'INICIO_ADAPTACIONES-03.webp',        // 1920×925 · cellista en penumbra
    guitarra: U4 + 'INICIO_ADAPTACIONES-04.webp',     // 1920×925 · guitarrista en escena
    luces: U4 + 'INICIO_ADAPTACIONES-05.webp',        // 1920×925 · haces azules sobre el público
    degradado: U4 + 'INICIO_ADAPTACIONES-06.webp',    // 1920×525 · fondo degradado
    plano: U5 + 'INICIO_ADAPTACIONES-07-1.webp',      // 1921×1240 · trombonista con el plano de la arena encima
    clubLounge: U5 + 'INICIO_ADAPTACIONES-08-1.webp', // 1920×800 · Club lounge VIP (arco de madera y muro verde)
    lobby: U4 + 'INICIO_ADAPTACIONES-09.webp',        // 1920×800 · Lobby con escultura de luz azul
    lounge: U4 + 'INICIO_ADAPTACIONES-10.webp',       // 1920×800 · Lounge con barra
    volcanes: U4 + 'INICIO_ADAPTACIONES-11.webp',     // 1920×450 · panorámica de volcanes («Inspirada en Guatemala»)
  },
  /* ── Arena ── */
  fachada: U5 + '2-ARENA-01-1-1.webp',  // 1920×1080 · render de la fachada de día
  escena: U5 + '2-ARENA-02-1.webp',     // 1920×925  · artista sola en el escenario («El comienzo de un nuevo capítulo»)
  sonido: U5 + '2-ARENA-03-1.webp',     // 1920×925  · díptico: violinista + público («La Arena que marca un antes y un después»)
  degradado: U5 + '2-ARENA-04.webp',    // 1920×600  · degradado turquesa («Un espacio diseñado para transformar cada evento»)
  volcan: U5 + '2-ARENA-09-1.webp',     // 1920×1380 · volcanes al atardecer («Un motor social, cultural y económico»)
  bosque: U5 + '2-ARENA-10.webp',       // 1920×325  · franja de bosque («Compromisos ambientales»)
  goal: U5 + '2-ARENA-11.webp',         // 1076×325  · logo GOAL (blanco)
  iconos: {                             // 349×324 · íconos turquesa de los tipos de evento
    musica: U5 + '2-ARENA-05.webp',
    cultura: U5 + '2-ARENA-06.webp',
    deporte: U5 + '2-ARENA-07.webp',
    convenciones: U5 + '2-ARENA-08.webp',
  },
  /* ── Espacios ── */
  espacios: {
    portada: U5 + '3-ESPACIOS-01.webp',     // 1920×1080 · lounge con barra
    lineas: U5 + '3-ESPACIOS-02.webp',      // 1920×1380 · fondo con líneas verdes (volcanes / ondas)
    mapa: U5 + '3-ESPACIOS-03-1-1.webp',    // 1920×1380 · plano isométrico con leyenda (parqueos, club seating, asientos, suites, club lounge, bunker suites)
    mapaVertical: U5 + '3-ESPACIOS-11-1-1.webp', // 1080×1350 · el mismo plano en vertical (celular)
    franjaAzul: U5 + '3-ESPACIOS-04.webp',  // 1920×525
    franja: U5 + '3-ESPACIOS-05.webp',      // 1920×325
    clubLounge: U5 + '3-ESPACIOS-06.webp',  // 870×780 · Club Lounge
    skyLounges: U5 + '3-ESPACIOS-07.webp',  // 870×780 · Sky Lounges (en el orden de las pestañas oficiales)
    clubSeating: U5 + '3-ESPACIOS-08.webp', // 870×780 · Club Seating
    luces: U5 + '3-ESPACIOS-09.webp',       // 1920×450 · haces azules
    suites: U5 + '3-ESPACIOS-10.webp',      // 870×780 · Suite
    hoteles: U5 + '3-ESPACIOS-13.webp',     // 870×780 · recepción de hotel
    traslado: U5 + '3-ESPACIOS-14.webp',    // 870×780 · viajera con maleta (artistas y producción)
    fondo: U5 + '3-ESPACIOS-15.webp',       // 1920×1380 · degradado oscuro
  },
  /* ── Ubicación ── */
  ubicacion: {
    portada: U5 + '4-UBICACION-01-1.webp',  // 1920×700 · la arena entre el bosque, desde el aire
    cayala: U5 + '4-UBICACION-02.webp',     // 750×500  · Ciudad Cayalá desde el aire
    comercio: U5 + '4-UBICACION-03.webp',   // 400×400
    hoteles: U5 + '4-UBICACION-04.webp',    // 400×400
    restaurantes: U5 + '4-UBICACION-05.webp', // 400×400
    parqueos: U5 + '4-UBICACION-06.webp',   // 400×400
    degradado: U5 + '4-UBICACION-07.webp',  // 1920×525
  },
  /* ── Quiénes somos ── */
  nosotros: {
    portada: U5 + '5-QUIENES-SOMOS-01.webp', // 1920×700 · escenario con un reflector
    lounge: U5 + '5-QUIENES-SOMOS-02.webp',  // 859×500  · Club lounge VIP
    publico: U5 + '5-QUIENES-SOMOS-03.webp', // 1920×450 · público en penumbra
    textura: U5 + '5-QUIENES-SOMOS-08.webp', // 1920×700
    logos: {                                  // 365×90 · logos blancos
      factor: U5 + '5-QUIENES-SOMOS-04.webp',
      asa: U5 + '5-QUIENES-SOMOS-05.webp',
      zacsa: U5 + '5-QUIENES-SOMOS-06.webp',
      cayala: U5 + '5-QUIENES-SOMOS-07-1.webp',
    },
  },
  /* ── Alianzas ── */
  alianzas: {
    portada: U5 + '6-ALIANZAS-01.webp',  // 1920×1080 · la fachada de noche con fuegos artificiales
    franja: U5 + '6-ALIANZAS-02.webp',   // 1920×450  · fondo oscuro con barras rojas del logo
    publico: U5 + '6-ALIANZAS-03.webp',  // 1920×700  · público con las manos arriba
  },
  /* ── Contacto ── */
  contacto: {
    portada: U5 + '7-UBICACION-01.webp',  // 1920×1080 · público haciendo corazones con las manos
    cantante: U5 + '7-UBICACION-02-2.webp', // 1400×1921 · cantante a contraluz
  },
};

export const SOCIAL = {
  facebook: 'https://www.facebook.com/arenagallo',
  instagram: 'https://www.instagram.com/arenagallo',
  linkedin: 'https://www.linkedin.com/company/arenagallo/about/',
  youtube: 'https://www.youtube.com/channel/UCL42dzu53lZXE1JV4MoBEQw',
};

/* páginas del sitio (todas dentro de esta demostración) */
export const PAGINAS = [
  ['arena', 'Arena', '/arena.html'],
  ['espacios', 'Espacios', '/espacios.html'],
  ['ubicacion', 'Ubicación', '/ubicacion.html'],
  ['nosotros', 'Quiénes somos', '/nosotros.html'],
  ['alianzas', 'Alianzas', '/alianzas.html'],
  ['contacto', 'Contacto', '/contacto.html'],
];
