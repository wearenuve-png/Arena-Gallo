/* Plano del recinto visto desde arriba (SVG), con la misma geometría que la escena 3D. */
const FA = 13; const FB = 20; const FN = 2.6;
const A_MAX = Math.PI - (40 * Math.PI) / 180;
function sup(a, d) {
  const s = Math.sin(a); const c = Math.cos(a); const e = 2 / FN;
  return [(FA + d) * Math.sign(s) * Math.abs(s) ** e, (FB + d) * Math.sign(c) * Math.abs(c) ** e];
}
const f = (v) => v.toFixed(2);
function band(d0, d1, a0, a1, n = 10) {
  const out = []; const inn = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(sup(a, d1)); inn.unshift(sup(a, d0));
  }
  return 'M' + [...out, ...inn].map(([x, y]) => `${f(x)},${f(y)}`).join('L') + 'Z';
}
const ZONES = [
  { id: 'lower', d0: 3.5, d1: 15.4, n: 24 },
  { id: 'suites', d0: 16.6, d1: 21.2, n: 50 },
  { id: 'club', d0: 22.6, d1: 28, n: 20 },
  { id: 'upper', d0: 30.6, d1: 36.9, n: 26 },
];
export function planSVG(colors, { label = 'Plano del recinto' } = {}) {
  const gap = 0.006;
  const parts = ZONES.map((z) => {
    const step = (2 * A_MAX) / z.n;
    let p = '';
    for (let i = 0; i < z.n; i++) p += band(z.d0, z.d1, -A_MAX + i * step + gap, -A_MAX + (i + 1) * step - gap, 4);
    return `<path data-z="${z.id}" d="${p}" fill="${colors[z.id]}" fill-opacity="${z.id === 'suites' ? .9 : .82}"/>`;
  }).join('');
  let ga = 'M';
  for (let i = 0; i <= 64; i++) { const [x, y] = sup((Math.PI * 2 * i) / 64, -0.8); ga += `${f(x)},${f(y)}${i < 64 ? 'L' : 'Z'}`; }
  return `<svg viewBox="-51 -48 102 106" role="img" aria-label="${label}">
    <path d="${ga}" data-z="ga" fill="${colors.ga}" fill-opacity=".85"/>
    ${parts}
    <rect x="-13.5" y="-35" width="27" height="12.5" rx="1" fill="#2a2724"/>
    <text x="0" y="-27.4" text-anchor="middle" font-size="3.6" font-weight="800" font-stretch="70%" fill="#c4bcb0" letter-spacing=".4">ESCENARIO</text>
  </svg>`;
}
