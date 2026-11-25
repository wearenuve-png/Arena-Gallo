/* Logo de Arena Gallo: círculo de barras (sonido / cúpula) + «arena» + «Gallo».
   Todo en vector, en las coordenadas del logo original (centro del círculo 124,88; radio 67). */
import { ARENA_D, GALLO_D } from './brand-paths.js';

export const TEAL = '#45d0bd';
const CX = 124; const CY = 88; const R = 67; const PITCH = 8.14; const BW = 3.7;
/* por barra (de izquierda a derecha): inicio y fin de la franja brillante y fin de la franja media (y absolutas) */
const BARS = [
  [111, 118, 123], [90, 129, 133], [77, 116, 141], [59, 97, 144], [46, 86, 131], [36, 75, 120], [24, 58, 120],
  [24, 72, 133], [27, 66, 140], [33, 71, 128], [53, 92, 134], [61, 101, 145], [75, 114, 142], [85, 123, 135], [102, 123, 126],
];
const COL = { hi: '#45d0bd', mid: '#2a9a8d', dim: '#1d463f' };
let uid = 0;

/* el círculo de barras; cada barra lleva --k (distancia al centro) para animarla */
export function markInner({ id = 'agm' + uid++, colors = COL } = {}) {
  const bars = BARS.map(([h0, h1, m1], i) => {
    const k = i - 7;
    const x = CX + k * PITCH - BW / 2;
    const half = Math.sqrt(Math.max(0, R * R - (k * PITCH) ** 2));
    const top = CY - half; const bot = CY + half;
    const seg = (y0, y1, c, cls) => (y1 > y0 ? `<rect class="${cls}" x="${x.toFixed(2)}" y="${y0.toFixed(1)}" width="${BW}" height="${(y1 - y0).toFixed(1)}" fill="${c}"/>` : '');
    return `<g class="bar" style="--k:${Math.abs(k)};--h:${((h0 - 21) / 134).toFixed(3)}">${seg(top, h0, colors.dim, 'dim')}${seg(h0, h1, colors.hi, 'hi')}${seg(h1, m1, colors.mid, 'mid')}${seg(m1, bot, colors.dim, 'dim')}</g>`;
  }).join('');
  return `<defs><clipPath id="${id}"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath></defs><g class="mark" clip-path="url(#${id})">${bars}</g>`;
}
const words = ({ arena = '#fff', gallo = '#e3001b', reg = true } = {}) =>
  `<g class="w-arena"><path transform="translate(40 165)" d="${ARENA_D}" fill="${arena}" fill-rule="evenodd"/></g>` +
  `<g class="w-gallo"><path transform="translate(85 204)" d="${GALLO_D}" fill="${gallo}" fill-rule="evenodd"/>${reg ? `<text x="205" y="214" font-size="7" font-family="Archivo, sans-serif" font-weight="700" fill="${gallo}">®</text>` : ''}</g>`;

/* lockup vertical (como el original) */
export function logoStack({ cls = '', title = 'Arena Gallo', arena, gallo, colors } = {}) {
  return `<svg class="ag-logo ${cls}" viewBox="34 16 182 238" role="img" aria-label="${title}">${markInner({ colors })}${words({ arena, gallo })}</svg>`;
}
/* lockup horizontal (cabecera, boleto): círculo a la izquierda, palabras apiladas a la derecha */
export function logoRow({ cls = '', title = 'Arena Gallo', arena, gallo, colors } = {}) {
  const s = 1.32; // escala de las palabras respecto al círculo
  const ty = CY - ((169 + 247) / 2) * s;
  return `<svg class="ag-logo ${cls}" viewBox="55 19 ${170 + 158 * s} 138" role="img" aria-label="${title}">${markInner({ colors })}<g transform="translate(${212 - 44 * s} ${ty.toFixed(1)}) scale(${s})">${words({ arena, gallo, reg: false })}</g></svg>`;
}
/* solo el círculo */
export function logoMark({ cls = '', title = 'Arena Gallo', colors } = {}) {
  return `<svg class="ag-logo ${cls}" viewBox="55 19 138 138" role="img" aria-label="${title}">${markInner({ colors })}</svg>`;
}
/* versión en imagen (para dibujar en lienzos 3D) */
export function logoImage(kind = 'row', opts = {}) {
  const svg = (kind === 'stack' ? logoStack : kind === 'mark' ? logoMark : logoRow)(opts).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return img.decode().then(() => img);
}
