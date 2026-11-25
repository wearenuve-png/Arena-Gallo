import * as THREE from 'three';

/* ───────── Evento de demostración ───────── */
export const EVENT = {
  name: 'Noche de Apertura',
  kicker: 'Evento de demostración',
  date: 'Sáb 20 nov 2027',
  time: '8:00 PM',
  venue: 'Arena Gallo · Ciudad Cayalá, Zona 16',
};

/* ───────── Geometría del recinto (metros aprox.) ─────────
   Herradura abierta hacia el escenario (-z). Entrada al frente (+z). */
export const FLOOR = { a: 13, b: 20, n: 2.6 };
export const GAP = THREE.MathUtils.degToRad(40);
export const A_MAX = Math.PI - GAP;
export const WALL_D = 38.6;
export const OUT_D = 46;
export const SEAT_W = 0.56;

/* Punto del contorno superelíptico a distancia d del borde de la pista.
   alpha = 0 → frente (+z, entrada) · alpha = π → escenario (-z). */
export function sup(alpha, d, out = new THREE.Vector2()) {
  const s = Math.sin(alpha);
  const c = Math.cos(alpha);
  const e = 2 / FLOOR.n;
  out.set(
    (FLOOR.a + d) * Math.sign(s) * Math.pow(Math.abs(s), e),
    (FLOOR.b + d) * Math.sign(c) * Math.pow(Math.abs(c), e)
  );
  return out;
}

/* ───────── Niveles ───────── */
export const LEVELS = {
  lower: {
    id: 'lower', name: 'Platea Baja', code: '100', color: '#e0182d',
    d0: 3.5, rows: 14, rowD: 0.85, h0: 0.6, rise: 0.5,
    sections: 24, first: 101, priceFront: 1100, priceBack: 800, sold: 0.86,
  },
  club: {
    id: 'club', name: 'Club Gallo', code: '200', color: '#f08a24',
    d0: 22.6, rows: 6, rowD: 0.9, h0: 11.0, rise: 0.6,
    sections: 20, first: 201, priceFront: 1350, priceBack: 1100, sold: 0.74,
  },
  upper: {
    id: 'upper', name: 'Platea Alta', code: '300', color: '#4f86d6',
    d0: 30.6, rows: 7, rowD: 0.9, h0: 18.5, rise: 0.75,
    sections: 26, first: 301, priceFront: 560, priceBack: 340, sold: 0.6,
  },
  suites: {
    id: 'suites', name: 'Suites VIP', code: 'S', color: '#ffcf6b',
    d0: 16.8, depth: 4.4, floorY: 7.7, height: 3.1,
    count: 22, perSuite: 16, price: 2400, sold: 0.7, // 22 suites, como en la página oficial
  },
  ga: {
    id: 'ga', name: 'Pista General', code: 'GA', color: '#f4efe6',
    price: 650, capacity: 2400, sold: 0.72,
  },
};

export const LEVEL_ORDER = ['suites', 'lower', 'club', 'upper', 'ga'];

export function seatPrice(L, row) {
  const t = L.rows > 1 ? row / (L.rows - 1) : 0;
  return Math.round((L.priceFront + (L.priceBack - L.priceFront) * t) / 5) * 5;
}

export const fmtQ = (n) => 'Q' + Math.round(n).toLocaleString('en-US');

/* ───────── Aleatorio con semilla (misma sala cada vez) ───────── */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SHIRTS = [
  '#1c1c1f', '#2a2d34', '#6e6a63', '#3b4252', '#5b3434', '#5f646d',
  '#202a3a', '#7d756a', '#8c2f2f', '#24382f', '#141416', '#4a4540',
];
export const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#a56b3f', '#d9a066'];
