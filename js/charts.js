/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — the drawing kit of the charts (Chart): grouped bars with
   error bars, scatter plots (with labels, vectors for a biplot and reference
   lines) and histograms with gates. SVG strings with the colours of the theme
   (CSS variables) and the marks the Figure Studio and the editor ✎ read:
   data-plot on the SVG, data-role on axes, grid, axis titles and ticks, and a
   legend with data-role="legend" and data-li on each entry. */
(function () {
  'use strict';
  const r1 = v => Math.round(v * 10) / 10;
  const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const PAL = ['var(--chart1)', 'var(--chart2)', 'var(--chart3)', 'var(--chart4)', 'var(--chart5)', 'var(--chart6)', 'var(--pr5)', 'var(--pr7)'];
  /* ticks: about n nice values covering [a, b] */
  function ticks(a, b, n) {
    if (!(b > a)) { b = a + 1; }
    const step = (window.niceNum ? niceNum : x => x)((b - a) / (n || 5), true);
    const t0 = Math.ceil(a / step - 1e-9) * step, out = [];
    for (let v = t0; v <= b + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return { ticks: out, step };
  }
  const fmtT = (v, step) => { const d = step >= 1 ? 0 : Math.min(6, Math.ceil(-Math.log10(step))); const s = v.toFixed(d); return s.startsWith('-') ? '−' + s.slice(1) : s; };
  let seq = 0;
  /* labels that do not overlap: each label tries its candidate places in turn
     and keeps the first one that touches no label already placed nor any
     marker; if none is free, the one with the least overlap.
     items: [{ text, font, cands: [[x, y, anchor], …] }]; obstacles: boxes
     [x0, y0, x1, y1] of the markers. Returns [{ x, y, anchor }] in order. */
  function placeLabels(items, obstacles, bounds) {
    const placed = (obstacles || []).slice();
    const box = (x, y, a, t, f) => { const w = String(t).length * f * 0.56; const x0 = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x; return [x0, y - f * 0.8, x0 + w, y + f * 0.22]; };
    const over = (A, B) => Math.max(0, Math.min(A[2], B[2]) - Math.max(A[0], B[0])) * Math.max(0, Math.min(A[3], B[3]) - Math.max(A[1], B[1]));
    const out = (A) => bounds ? Math.max(0, bounds[0] - A[0]) + Math.max(0, A[2] - bounds[2]) + Math.max(0, bounds[1] - A[1]) + Math.max(0, A[3] - bounds[3]) : 0;
    return items.map(it => {
      let best = null, bestCost = Infinity;
      for (const [x, y, a] of it.cands) {
        const B = box(x, y, a, it.text, it.font);
        const cost = placed.reduce((s, P) => s + over(B, P), 0) + out(B) * it.font * 2;
        if (cost < bestCost - 1e-9) { bestCost = cost; best = { x, y, anchor: a, B }; }
        if (cost === 0) break;
      }
      placed.push(best.B);
      return best;
    });
  }
  /* the places a point label tries: beside, above and below the marker, then
     farther up or down (joined to the marker by a thin leader line) */
  const pointCands = (x, y, rr, f) => {
    const c = [[x + rr + 3, y + 4, 'start'], [x - rr - 3, y + 4, 'end'], [x + rr + 2, y - rr - 1, 'start'], [x + rr + 2, y + rr + f - 2, 'start'],
      [x, y - rr - 4, 'middle'], [x, y + rr + f, 'middle'], [x - rr - 2, y - rr - 1, 'end'], [x - rr - 2, y + rr + f - 2, 'end']];
    for (let k = 1; k <= 4; k++) { const d = rr + k * (f + 4); c.push([x + rr + 12, y + 4 - d, 'start'], [x - rr - 12, y + 4 - d, 'end'], [x + rr + 12, y + 4 + d, 'start'], [x - rr - 12, y + 4 + d, 'end']); }
    return c;
  };
  /* the leader line of a label placed far from its marker */
  function leader(px, py, rr, L, f) {
    if (Math.abs(L.y - 4 - py) <= rr + f + 2) return '';
    const lx = L.anchor === 'end' ? L.x + 2 : L.anchor === 'start' ? L.x - 2 : L.x, ly = L.y - f * 0.35;
    const d = Math.hypot(lx - px, ly - py) || 1;
    return `<line class="ch-lead" x1="${r1(px + (lx - px) / d * rr)}" y1="${r1(py + (ly - py) / d * rr)}" x2="${r1(lx)}" y2="${r1(ly)}"/>`;
  }
  function frame(o, W, H, L, Tp, R, B) {
    return { W, H, x0: L, y0: Tp, w: W - L - R, h: H - Tp - B };
  }
  function legend(items, x, y, font) {
    if (!items || !items.length) return '';
    let g = `<g data-role="legend" class="ch-leg">`;
    items.forEach((it, i) => {
      const yy = y + i * (font + 7);
      g += (it.shape === 'line'
        ? `<line data-li="${i}" x1="${x}" x2="${x + font + 2}" y1="${yy - font / 2 + 2}" y2="${yy - font / 2 + 2}" stroke="${it.color}" stroke-width="2.5"/>`
        : `<rect data-li="${i}" x="${x}" y="${yy - font + 2}" width="${font}" height="${font - 1}" rx="2" fill="${it.color}"/>`) +
        `<text data-li="${i}" class="txt" x="${x + font + 6}" y="${yy}" font-size="${font}">${e(it.label)}</text>`;
    });
    return g + '</g>';
  }
  /* ---------------- grouped bars ---------------- */
  function bars(o) {
    const font = o.font || 12, cats = o.categories, S = o.series;
    const legendW = S.length > 1 || o.forceLegend ? 16 + Math.max(...S.map(s => String(s.name).length)) * font * 0.58 + 16 : 0;
    const W = o.width || Math.max(360, 70 + cats.length * (S.length * 22 + 18) + legendW), H = o.height || 300;
    const F = frame(o, W, H, 58, o.title ? 34 : 14, 12 + legendW, o.rotate ? 78 : 44);
    let ymax = o.yMax != null ? o.yMax : Math.max(0, ...S.flatMap(s => s.values.map((v, i) => Math.max((+v || 0) + (s.err && isFinite(s.err[i]) ? s.err[i] : 0), s.hi && isFinite(s.hi[i]) ? s.hi[i] : 0))));
    if (o.refLine != null) ymax = Math.max(ymax, o.refLine);
    const ymin = o.yMin != null ? o.yMin : 0;
    const T0 = ticks(ymin, ymax * 1.05 || 1, 5), top = T0.ticks[T0.ticks.length - 1] || 1;
    const Y = v => F.y0 + F.h - (v - ymin) / (top - ymin) * F.h;
    const bw = Math.min(30, (F.w / cats.length - 10) / S.length), gw = bw * S.length;
    let g = '';
    T0.ticks.forEach(t => { g += `<line class="grid" data-role="grid" x1="${F.x0}" x2="${F.x0 + F.w}" y1="${r1(Y(t))}" y2="${r1(Y(t))}"/><text class="tick" data-role="ytick" x="${F.x0 - 6}" y="${r1(Y(t) + 4)}" font-size="${font - 1}" text-anchor="end">${fmtT(t, T0.step)}</text>`; });
    cats.forEach((c, i) => {
      const cx = F.x0 + (i + 0.5) * F.w / cats.length;
      S.forEach((s, k) => {
        const v = +s.values[i];
        if (!isFinite(v)) return;
        const x = cx - gw / 2 + k * bw, y = Y(Math.max(ymin, v));
        g += `<rect x="${r1(x + 1)}" y="${r1(y)}" width="${r1(bw - 2)}" height="${r1(Math.max(0, Y(ymin) - y))}" rx="2" fill="${s.color || PAL[k % PAL.length]}"><title>${e(c + ' · ' + s.name + ': ' + fmtNum(v, 3))}</title></rect>`;
        const hasCI = s.lo && s.hi && isFinite(s.lo[i]) && isFinite(s.hi[i]);
        if (hasCI || (s.err && isFinite(s.err[i]) && s.err[i] > 0)) {
          const xm = x + bw / 2, ya = Y(hasCI ? s.hi[i] : v + s.err[i]), yb = Y(Math.max(ymin, hasCI ? s.lo[i] : v - s.err[i]));
          g += `<path class="ch-err" d="M${r1(xm)} ${r1(ya)}V${r1(yb)}M${r1(xm - 3)} ${r1(ya)}H${r1(xm + 3)}M${r1(xm - 3)} ${r1(yb)}H${r1(xm + 3)}"/>`;
        }
        if (o.values) g += `<text class="mut" x="${r1(x + bw / 2)}" y="${r1(y - 4)}" font-size="${font - 2}" text-anchor="middle">${fmtNum(v, o.valueDigits != null ? o.valueDigits : 2)}</text>`;
      });
      g += o.rotate
        ? `<text class="tick" data-role="xtick" transform="translate(${r1(cx)} ${F.y0 + F.h + 12}) rotate(-35)" font-size="${font - 1}" text-anchor="end">${e(c)}</text>`
        : `<text class="tick" data-role="xtick" x="${r1(cx)}" y="${F.y0 + F.h + 16}" font-size="${font - 1}" text-anchor="middle">${e(c)}</text>`;
    });
    if (o.refLine != null) g += `<line class="ch-ref" x1="${F.x0}" x2="${F.x0 + F.w}" y1="${r1(Y(o.refLine))}" y2="${r1(Y(o.refLine))}"/>` + (o.refLabel ? `<text class="mut" x="${F.x0 + F.w - 2}" y="${r1(Y(o.refLine) - 4)}" font-size="${font - 2}" text-anchor="end">${e(o.refLabel)}</text>` : '');
    g += `<line class="ax" data-role="axis" x1="${F.x0}" x2="${F.x0 + F.w}" y1="${r1(Y(ymin))}" y2="${r1(Y(ymin))}"/><line class="ax" data-role="axis" x1="${F.x0}" x2="${F.x0}" y1="${F.y0}" y2="${F.y0 + F.h}"/>`;
    if (o.ylab) g += `<text class="flab" data-role="ylab" transform="translate(14 ${r1(F.y0 + F.h / 2)}) rotate(-90)" font-size="${font}" text-anchor="middle">${e(o.ylab)}</text>`;
    if (o.xlab) g += `<text class="flab" data-role="xlab" x="${r1(F.x0 + F.w / 2)}" y="${H - 6}" font-size="${font}" text-anchor="middle">${e(o.xlab)}</text>`;
    if (legendW) g += legend(S.map((s, k) => ({ label: s.name, color: s.color || PAL[k % PAL.length] })), F.x0 + F.w + 14, F.y0 + 12, font);
    return wrap(o, W, H, F, g);
  }
  /* ---------------- scatter ---------------- */
  function scatter(o) {
    const font = o.font || 12, P = o.points.filter(p => isFinite(p.x) && isFinite(p.y));
    const legendW = o.legend && o.legend.length ? 16 + Math.max(...o.legend.map(l => String(l.label).length)) * font * 0.58 + 14 : 0;
    const W = o.width || 520 + legendW, H = o.height || 380;
    const F = frame(o, W, H, 60, o.title ? 34 : 16, 18 + legendW, 46);
    const xs = P.map(p => p.x).concat((o.vectors || []).map(v => v.x)), ys = P.map(p => p.y).concat((o.vectors || []).map(v => v.y));
    let [xa, xb] = o.xRange || [Math.min(...xs), Math.max(...xs)], [ya, yb] = o.yRange || [Math.min(...ys), Math.max(...ys)];
    if (o.zero) { xa = Math.min(xa, 0); ya = Math.min(ya, 0); }
    const px = (xb - xa) || Math.abs(xa) || 1, py = (yb - ya) || Math.abs(ya) || 1;
    if (!o.xRange) { xa -= px * 0.08; xb += px * 0.08; }
    if (!o.yRange) { ya -= py * 0.08; yb += py * 0.08; }
    const TX = ticks(xa, xb, 6), TY = ticks(ya, yb, 5);
    const X = v => F.x0 + (v - xa) / (xb - xa) * F.w, Y = v => F.y0 + F.h - (v - ya) / (yb - ya) * F.h;
    let g = '';
    TX.ticks.forEach(t => { if (t < xa || t > xb) return; g += `<line class="grid" data-role="grid" x1="${r1(X(t))}" x2="${r1(X(t))}" y1="${F.y0}" y2="${F.y0 + F.h}"/><text class="tick" data-role="xtick" x="${r1(X(t))}" y="${F.y0 + F.h + 15}" font-size="${font - 1}" text-anchor="middle">${fmtT(t, TX.step)}</text>`; });
    TY.ticks.forEach(t => { if (t < ya || t > yb) return; g += `<line class="grid" data-role="grid" x1="${F.x0}" x2="${F.x0 + F.w}" y1="${r1(Y(t))}" y2="${r1(Y(t))}"/><text class="tick" data-role="ytick" x="${F.x0 - 6}" y="${r1(Y(t) + 4)}" font-size="${font - 1}" text-anchor="end">${fmtT(t, TY.step)}</text>`; });
    (o.hlines || []).forEach(v => { if (v >= ya && v <= yb) g += `<line class="ch-ref" x1="${F.x0}" x2="${F.x0 + F.w}" y1="${r1(Y(v))}" y2="${r1(Y(v))}"/>`; });
    (o.vlines || []).forEach(v => { if (v >= xa && v <= xb) g += `<line class="ch-ref" x1="${r1(X(v))}" x2="${r1(X(v))}" y1="${F.y0}" y2="${F.y0 + F.h}"/>`; });
    const labs = [], obst = P.map(p => { const rr = p.r || 6; return [X(p.x) - rr, Y(p.y) - rr, X(p.x) + rr, Y(p.y) + rr]; });
    (o.vectors || []).forEach(v => {
      const id = 'chArr' + (++seq), x = X(v.x), y = Y(v.y), a = v.x >= 0 ? 'start' : 'end', dx = v.x >= 0 ? 4 : -4, f = font - 1;
      g += `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>` +
        `<line class="ch-vec" x1="${r1(X(0))}" y1="${r1(Y(0))}" x2="${r1(x)}" y2="${r1(y)}" marker-end="url(#${id})"/>`;
      const y0 = y + (v.y >= 0 ? -4 : 12);
      labs.push({ cls: 'ch-veclab', text: v.label, font: f, cands: [0, -1, 1, -2, 2, -3, 3].map(k => [x + dx, y0 + k * (f + 2), a]).concat([[x - dx, y0, a === 'start' ? 'end' : 'start']]) });
    });
    P.forEach(p => {
      const c = p.color || 'var(--primary)', x = X(p.x), y = Y(p.y), rr = p.r || 6;
      g += p.shape === 'square' ? `<rect x="${r1(x - rr)}" y="${r1(y - rr)}" width="${2 * rr}" height="${2 * rr}" fill="${c}" stroke="var(--card-bg)" stroke-width="1.2">`
        : p.shape === 'triangle' ? `<path d="M${r1(x)} ${r1(y - rr * 1.2)}L${r1(x + rr * 1.1)} ${r1(y + rr * 0.8)}L${r1(x - rr * 1.1)} ${r1(y + rr * 0.8)}Z" fill="${c}" stroke="var(--card-bg)" stroke-width="1.2">`
        : `<circle cx="${r1(x)}" cy="${r1(y)}" r="${rr}" fill="${c}" stroke="var(--card-bg)" stroke-width="1.2">`;
      g += `<title>${e((p.label || '') + ' (' + fmtNum(p.x, 3) + ', ' + fmtNum(p.y, 3) + ')')}</title>` + (p.shape === 'square' ? '</rect>' : p.shape === 'triangle' ? '</path>' : '</circle>');
      if (o.labels !== false && p.label) labs.push({ cls: 'txt ch-plab', text: p.label, font: font - 1, cands: pointCands(x, y, rr, font - 1), px: x, py: y, rr });
    });
    placeLabels(labs, obst, [F.x0, F.y0, F.x0 + F.w, F.y0 + F.h]).forEach((L, i) => {
      if (labs[i].px != null) g += leader(labs[i].px, labs[i].py, labs[i].rr, L, labs[i].font);
      g += `<text class="${labs[i].cls}" x="${r1(L.x)}" y="${r1(L.y)}" font-size="${labs[i].font}" text-anchor="${L.anchor}">${e(labs[i].text)}</text>`;
    });
    g += `<rect class="ax" data-role="axis" x="${F.x0}" y="${F.y0}" width="${F.w}" height="${F.h}" fill="none"/>`;
    if (o.ylab) g += `<text class="flab" data-role="ylab" transform="translate(14 ${r1(F.y0 + F.h / 2)}) rotate(-90)" font-size="${font}" text-anchor="middle">${e(o.ylab)}</text>`;
    if (o.xlab) g += `<text class="flab" data-role="xlab" x="${r1(F.x0 + F.w / 2)}" y="${H - 8}" font-size="${font}" text-anchor="middle">${e(o.xlab)}</text>`;
    if (legendW) g += legend(o.legend, F.x0 + F.w + 14, F.y0 + 12, font);
    return wrap(o, W, H, F, g, `data-xr="${xa} ${xb}" data-yr="${ya} ${yb}"`);
  }
  /* ---------------- histogram (channel counts) ---------------- */
  function hist(o) {
    const font = o.font || 12, xv = o.x, yv = o.y;
    const W = o.width || 620, H = o.height || 300;
    const F = frame(o, W, H, 60, o.title ? 34 : 14, 16, 44);
    const xa = o.xRange ? o.xRange[0] : xv[0], xb = o.xRange ? o.xRange[1] : xv[xv.length - 1];
    const tr = v => o.log ? Math.log10(1 + v) : v;
    const ymax = Math.max(1, ...yv.map(tr));
    const TX = ticks(xa, xb, 6), TY = o.log ? { ticks: [0, 1, 2, 3, 4, 5].filter(k => k <= ymax + 0.01), step: 1 } : ticks(0, ymax, 5);
    const top = o.log ? Math.max(1, Math.ceil(ymax)) : TY.ticks[TY.ticks.length - 1] || 1;
    const X = v => F.x0 + (v - xa) / (xb - xa) * F.w, Y = v => F.y0 + F.h - tr(v) / top * F.h, Yr = v => F.y0 + F.h - v / top * F.h;
    let g = '';
    TY.ticks.forEach(t => { g += `<line class="grid" data-role="grid" x1="${F.x0}" x2="${F.x0 + F.w}" y1="${r1(Yr(t))}" y2="${r1(Yr(t))}"/><text class="tick" data-role="ytick" x="${F.x0 - 6}" y="${r1(Yr(t) + 4)}" font-size="${font - 1}" text-anchor="end">${o.log ? (t === 0 ? '0' : '10' + (t === 1 ? '' : '^' + t)) : fmtT(t, TY.step)}</text>`; });
    TX.ticks.forEach(t => { if (t >= xa && t <= xb) g += `<text class="tick" data-role="xtick" x="${r1(X(t))}" y="${F.y0 + F.h + 15}" font-size="${font - 1}" text-anchor="middle">${fmtT(t, TX.step)}</text>`; });
    (o.gates || []).forEach((gt, i) => {
      const a = Math.max(xa, gt.a), b = Math.min(xb, gt.b);
      if (b <= a) return;
      g += `<rect class="ch-gate" x="${r1(X(a))}" y="${F.y0}" width="${r1(X(b) - X(a))}" height="${F.h}" fill="${gt.color || PAL[i % PAL.length]}" fill-opacity=".14" stroke="${gt.color || PAL[i % PAL.length]}" stroke-opacity=".6"/>` +
        `<text class="txt" x="${r1((X(a) + X(b)) / 2)}" y="${F.y0 + 12}" font-size="${font - 1}" text-anchor="middle">${e(gt.label || '')}</text>`;
    });
    let d = '';
    xv.forEach((x, i) => { if (x < xa || x > xb) return; d += (d ? 'L' : 'M') + r1(X(x)) + ' ' + r1(Y(yv[i])); });
    g += `<path class="ch-hist" d="${d}L${r1(X(Math.min(xb, xv[xv.length - 1])))} ${F.y0 + F.h}L${r1(X(Math.max(xa, xv[0])))} ${F.y0 + F.h}Z"/>`;
    (o.peaks || []).forEach(p => { g += `<line class="ch-peak" x1="${r1(X(p))}" x2="${r1(X(p))}" y1="${F.y0 + 16}" y2="${F.y0 + F.h}"/>`; });
    g += `<line class="ax" data-role="axis" x1="${F.x0}" x2="${F.x0 + F.w}" y1="${F.y0 + F.h}" y2="${F.y0 + F.h}"/><line class="ax" data-role="axis" x1="${F.x0}" x2="${F.x0}" y1="${F.y0}" y2="${F.y0 + F.h}"/>`;
    if (o.ylab) g += `<text class="flab" data-role="ylab" transform="translate(14 ${r1(F.y0 + F.h / 2)}) rotate(-90)" font-size="${font}" text-anchor="middle">${e(o.ylab)}</text>`;
    if (o.xlab) g += `<text class="flab" data-role="xlab" x="${r1(F.x0 + F.w / 2)}" y="${H - 8}" font-size="${font}" text-anchor="middle">${e(o.xlab)}</text>`;
    return wrap(o, W, H, F, g, `data-xr="${xa} ${xb}"`);
  }
  function wrap(o, W, H, F, body, extra) {
    const title = o.title ? `<text class="ttl" x="${F.x0}" y="20" font-size="${(o.font || 12) + 2}">${e(o.title)}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" class="fig" viewBox="0 0 ${Math.ceil(W)} ${Math.ceil(H)}" width="${Math.ceil(W)}" height="${Math.ceil(H)}" role="img" aria-label="${e(o.aria || o.title || '')}"` +
      ` data-plot="${r1(F.x0)} ${r1(F.y0)} ${r1(F.w)} ${r1(F.h)}"${extra ? ' ' + extra : ''}>${title}${body}</svg>`;
  }

  window.Chart = { bars, scatter, hist, ticks, legend, PAL, placeLabels, pointCands, leader };
})();
