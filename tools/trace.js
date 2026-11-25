/* Vectorizador sencillo (solo desarrollo): máscara por color → contornos (marching squares) → RDP → curvas suaves.
   Uso en el navegador: traceRegion(img, {x,y,w,h}, test, {scale}) → {d, w, h} */
export function traceRegion(img, box, test, { scale = 10, thresh = 0.5, eps = 0.9, blur = 1.2 } = {}) {
  const W = Math.round(box.w * scale); const H = Math.round(box.h * scale);
  // 1) máscara a resolución original
  const c0 = document.createElement('canvas'); c0.width = box.w; c0.height = box.h;
  const g0 = c0.getContext('2d'); g0.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  const src = g0.getImageData(0, 0, box.w, box.h).data;
  const m = document.createElement('canvas'); m.width = box.w; m.height = box.h;
  const gm = m.getContext('2d'); const md = gm.createImageData(box.w, box.h);
  for (let i = 0; i < box.w * box.h; i++) {
    const v = Math.max(0, Math.min(1, test(src[i * 4], src[i * 4 + 1], src[i * 4 + 2])));
    md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = v * 255; md.data[i * 4 + 3] = 255;
  }
  gm.putImageData(md, 0, 0);
  // 2) ampliar con suavizado + desenfoque leve para bordes limpios
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.filter = `blur(${blur * scale * 0.5}px)`;
  g.drawImage(m, 0, 0, W, H);
  const a = g.getImageData(0, 0, W, H).data;
  const val = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : a[(y * W + x) * 4] / 255);
  // 3) marching squares con interpolación
  const segs = [];
  const lerp = (v0, v1) => (thresh - v0) / (v1 - v0 || 1e-6);
  for (let y = -1; y < H; y++) for (let x = -1; x < W; x++) {
    const tl = val(x, y), tr = val(x + 1, y), br = val(x + 1, y + 1), bl = val(x, y + 1);
    const idx = (tl > thresh ? 8 : 0) | (tr > thresh ? 4 : 0) | (br > thresh ? 2 : 0) | (bl > thresh ? 1 : 0);
    if (idx === 0 || idx === 15) continue;
    const T = [x + lerp(tl, tr), y], R = [x + 1, y + lerp(tr, br)], B = [x + lerp(bl, br), y + 1], L = [x, y + lerp(tl, bl)];
    const tab = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: [[L, T], [B, R]], 6: [[T, B]], 7: [[L, T]], 8: [[T, L]], 9: [[T, B]], 10: [[T, R], [L, B]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]] };
    for (const s of tab[idx]) segs.push(s);
  }
  // 4) unir segmentos en polilíneas cerradas
  const key = (p) => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;
  const map = new Map();
  segs.forEach((s, i) => { for (const e of [0, 1]) { const k = key(s[e]); if (!map.has(k)) map.set(k, []); map.get(k).push([i, e]); } });
  const used = new Uint8Array(segs.length); const loops = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1; const loop = [segs[i][0], segs[i][1]];
    for (;;) {
      const k = key(loop[loop.length - 1]);
      const nx = (map.get(k) || []).find(([j]) => !used[j]);
      if (!nx) break;
      used[nx[0]] = 1; loop.push(segs[nx[0]][1 - nx[1]]);
    }
    if (loop.length > 8) loops.push(loop);
  }
  // 5) simplificar (RDP) y suavizar con curvas cuadráticas por puntos medios
  const rdp = (pts, e) => {
    if (pts.length < 3) return pts;
    let dmax = 0, idx = 0; const [a0, b0] = [pts[0], pts[pts.length - 1]];
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i]; const dx = b0[0] - a0[0], dy = b0[1] - a0[1];
      const d = Math.abs(dy * p[0] - dx * p[1] + b0[0] * a0[1] - b0[1] * a0[0]) / (Math.hypot(dx, dy) || 1);
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax > e) return rdp(pts.slice(0, idx + 1), e).slice(0, -1).concat(rdp(pts.slice(idx), e));
    return [a0, b0];
  };
  const f = (v) => (v / scale).toFixed(2);
  let d = '';
  for (const lp of loops) {
    // contorno cerrado: partir en el punto más lejano del inicio y simplificar cada mitad
    let far = 0, fd = 0;
    lp.forEach((p, i) => { const dd = Math.hypot(p[0] - lp[0][0], p[1] - lp[0][1]); if (dd > fd) { fd = dd; far = i; } });
    const e = eps * scale * 0.1;
    const s = rdp(lp.slice(0, far + 1), e).slice(0, -1).concat(rdp(lp.slice(far), e));
    if (s.length < 4) continue;
    const n = s.length - 1; // cerrado
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let m0 = mid(s[n - 1], s[0]);
    d += `M${f(m0[0])} ${f(m0[1])}`;
    for (let i = 0; i < n; i++) { const p = s[i]; const q = mid(s[i], s[i + 1]); d += `Q${f(p[0])} ${f(p[1])} ${f(q[0])} ${f(q[1])}`; }
    d += 'Z';
  }
  return { d, w: box.w, h: box.h, dbg: { segs: segs.length, loops: loops.length, sample: val(Math.round(W / 2), Math.round(H / 2)), max: Math.max(...Array.from({ length: 200 }, (_, i) => val(Math.round((i / 200) * W), Math.round(H / 2)))) } };
}
