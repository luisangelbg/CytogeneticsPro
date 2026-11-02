/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — the idiogram (Idio).

   Draws a karyotype to scale as SVG: centromeres aligned on one line, short
   arms up and long arms down, each pair (or each homolog) with its number
   and class, satellites beyond their secondary constriction, bands and
   in-situ hybridization signals in the colour of their probe, an axis or a
   scale bar, and a legend. Colours come from CSS variables of the theme, so
   the figure follows the light and dark themes and the Figure Studio can
   export it with the light colours.

   pairs: [{ label, s, l, type?, sd?: {s, l}, sat?, satArm?: 's'|'l', satLen?,
             homologs?: [{ s, l, sat?, satArm?, satLen? }],
             marks?: [{ arm: 's'|'l', pos, size, color, probe, kind: 'band'|'dot', homolog? }] }]
   pos is the centre of the mark as a fraction of the arm from the centromere
   (0) to the telomere (1); size, its extent as a fraction of the arm. */
(function () {
  'use strict';
  const r1 = v => Math.round(v * 10) / 10;
  const TYPE_VAR = { M: '--ty-m', m: '--ty-m', sm: '--ty-sm', st: '--ty-st', a: '--ty-st', t: '--ty-t', T: '--ty-t' };
  const escX = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const niceStep = x => { const e = Math.floor(Math.log10(x)), f = x / Math.pow(10, e); return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * Math.pow(10, e); };
  const fmt = v => { const s = (Math.round(v * 1000) / 1000).toString(); return s; };

  /* one chromatid-pair body: arm from y0 to y1 (y1 is the telomere) */
  function armPath(x, w, yc, yt) {
    const up = yt < yc, r = Math.min(w / 2, Math.abs(yt - yc) / 2, 5);
    const a = x - w / 2, b = x + w / 2;
    if (up) return `M${r1(a)} ${r1(yc)}V${r1(yt + r)}Q${r1(a)} ${r1(yt)} ${r1(a + r)} ${r1(yt)}H${r1(b - r)}Q${r1(b)} ${r1(yt)} ${r1(b)} ${r1(yt + r)}V${r1(yc)}Z`;
    return `M${r1(a)} ${r1(yc)}V${r1(yt - r)}Q${r1(a)} ${r1(yt)} ${r1(a + r)} ${r1(yt)}H${r1(b - r)}Q${r1(b)} ${r1(yt)} ${r1(b)} ${r1(yt - r)}V${r1(yc)}Z`;
  }

  /* the drawing of one chromosome at x; returns the SVG markup */
  function chromosome(c, x, y0, sc, o, k) {
    const w = o.chromWidth, gap = o.cenGap;
    const fill = o.colorBy === 'type' && c.type ? `var(${TYPE_VAR[c.type] || '--idio-fill'})` : 'var(--idio-fill)';
    let out = '';
    const sat = c.sat && c.satLen > 0 ? c.satLen : 0;
    const satGap = sat ? Math.max(2.5, w * 0.28) : 0;
    const sLen = c.s * sc, lLen = c.l * sc;
    const ys = y0 - gap / 2, yl = y0 + gap / 2;
    /* an arm, possibly ending in a satellite: [body][secondary constriction][satellite] */
    const drawArm = (len, dir, hasSat) => {
      const yc = dir < 0 ? ys : yl;
      if (!hasSat) return `<path class="idio-arm" d="${armPath(x, w, yc, yc + dir * len)}" fill="${fill}"/>`;
      const satPx = Math.min(sat * sc, len * 0.6);
      const bodyLen = o.satIncluded ? Math.max(1, len - satPx - satGap) : len;
      const yb = yc + dir * bodyLen, ys0 = yb + dir * satGap, ysT = ys0 + dir * satPx;
      return `<path class="idio-arm" d="${armPath(x, w, yc, yb)}" fill="${fill}"/>` +
        `<line class="idio-sc" x1="${r1(x)}" y1="${r1(yb)}" x2="${r1(x)}" y2="${r1(ys0)}"/>` +
        `<path class="idio-arm idio-sat" d="${armPath(x, w * 0.86, ys0, ysT)}" fill="${fill}"/>`;
    };
    out += drawArm(sLen, -1, sat && c.satArm !== 'l');
    out += drawArm(lLen, 1, sat && c.satArm === 'l');
    out += `<rect class="idio-cen" x="${r1(x - w * 0.22)}" y="${r1(ys - 0.5)}" width="${r1(w * 0.44)}" height="${r1(gap + 1)}" fill="${fill}"/>`;
    /* bands and signals */
    const M = (c.marks || []).filter(m => !(m.homolog != null && k != null && m.homolog !== k + 1)).map(m => {
      /* a mark of one homolog (1, 2…): on that homolog only in the diploid
         view; on half the width (a heteromorphism) when one chromosome stands for the pair */
      const len = m.arm === 'l' ? lLen : sLen, dir = m.arm === 'l' ? 1 : -1, yc = m.arm === 'l' ? yl : ys;
      const half = Math.max(1.2, (m.size || 0.06) * len / 2);
      return { m, half1: m.homolog != null && k == null, half, yy: yc + dir * Math.min(len - half, Math.max(half, (m.pos || 0) * len)), slot: 0, of: 1 };
    });
    /* bands that overlap (a CMA band on a 45S site) share the width side by side, so neither hides the other */
    const B = M.filter(b => b.m.kind !== 'dot').sort((a, b) => a.yy - a.half - (b.yy - b.half));
    for (let i = 0; i < B.length;) {
      let j = i + 1, end = B[i].yy + B[i].half;
      while (j < B.length && B[j].yy - B[j].half < end - 0.2) { end = Math.max(end, B[j].yy + B[j].half); j++; }
      for (let q = i; q < j; q++) { B[q].slot = q - i; B[q].of = j - i; }
      i = j;
    }
    M.forEach(b => {
      const m = b.m, col = m.color || 'var(--text)';
      if (m.kind === 'dot') {
        out += `<circle class="idio-dot" cx="${r1(x - w * 0.28)}" cy="${r1(b.yy)}" r="${r1(Math.max(2, w * 0.2))}" fill="${col}" data-probe="${escX(m.probe || '')}"/>` +
          (b.half1 ? '' : `<circle class="idio-dot" cx="${r1(x + w * 0.28)}" cy="${r1(b.yy)}" r="${r1(Math.max(2, w * 0.2))}" fill="${col}" data-probe="${escX(m.probe || '')}"/>`);
      } else {
        const bw = (b.half1 ? w / 2 : w) / b.of;
        out += `<rect class="idio-band" x="${r1(x - w / 2 + b.slot * bw)}" y="${r1(b.yy - b.half)}" width="${r1(bw)}" height="${r1(2 * b.half)}" fill="${col}" data-probe="${escX(m.probe || '')}"/>`;
      }
    });
    /* outline on top, so bands do not hide the contour */
    out += `<path class="idio-outline" d="${armPath(x, w, ys, ys - sLen)}"/><path class="idio-outline" d="${armPath(x, w, yl, yl + lLen)}"/>`;
    return out;
  }

  function draw(pairs, opts) {
    const o = Object.assign({
      unit: 'µm', height: 220, chromWidth: 14, gap: 16, hgap: 5, mode: 'haploid', labels: true, types: true,
      sd: false, colorBy: 'none', ruler: true, title: '', legend: null, satIncluded: true, cenGap: 3,
      order: null, font: 11, margin: 14, minWidth: 0,
    }, opts || {});
    const order = o.order || pairs.map((p, i) => i);
    const P = order.map(i => pairs[i]).filter(Boolean);
    if (!P.length) return { svg: '', width: 0, height: 0 };
    const diploid = o.mode === 'diploid';
    const items = P.map(p => diploid && p.homologs && p.homologs.length ? p.homologs.map(h => Object.assign({ type: p.type, marks: p.marks, label: p.label }, h)) : [p]);
    const maxS = o.maxS != null ? o.maxS : Math.max(...items.flat().map(c => c.s + (o.satIncluded ? 0 : (c.sat && c.satArm !== 'l' ? c.satLen || 0 : 0)) + (o.sd && c.sd ? c.sd.s : 0)));
    const maxL = o.maxL != null ? o.maxL : Math.max(...items.flat().map(c => c.l + (o.satIncluded ? 0 : (c.sat && c.satArm === 'l' ? c.satLen || 0 : 0)) + (o.sd && c.sd ? c.sd.l : 0)));
    const sc = o.scale || (o.height / (maxS + maxL));
    const left = o.margin + (o.ruler ? 46 : 6);
    const top = o.margin + (o.title ? 22 : 4) + 4;
    const y0 = top + maxS * sc + o.cenGap / 2;
    const bottom = y0 + maxL * sc + o.cenGap / 2;
    const labH = (o.labels ? o.font + 6 : 0) + (o.types ? o.font + 4 : 0);
    let x = left + o.chromWidth / 2 + 4, body = '';
    const lab = [], xs = [];
    items.forEach((group, gi) => {
      const x0 = x;
      group.forEach((c, k) => {
        body += `<g class="idio-chr" data-pair="${escX(P[gi].label != null ? P[gi].label : gi + 1)}"${group.length > 1 ? ` data-homolog="${k + 1}"` : ''}>` + chromosome(c, x, y0, sc, o, group.length > 1 ? k : null);
        /* the deviation among cells is that of the pairs: drawn only with one chromosome per pair */
        if (o.sd && c.sd && !diploid) {
          const ex = x + o.chromWidth / 2 + 3;
          body += `<line class="idio-err" x1="${r1(ex)}" x2="${r1(ex)}" y1="${r1(y0 - (c.s - c.sd.s) * sc)}" y2="${r1(y0 - (c.s + c.sd.s) * sc)}"/>` +
            `<line class="idio-err" x1="${r1(ex)}" x2="${r1(ex)}" y1="${r1(y0 + (c.l - c.sd.l) * sc)}" y2="${r1(y0 + (c.l + c.sd.l) * sc)}"/>`;
        }
        body += '</g>';
        if (k < group.length - 1) x += o.chromWidth + o.hgap;
      });
      xs.push(group.length > 1 ? null : x0); lab.push({ x: (x0 + x) / 2, label: P[gi].label != null ? P[gi].label : gi + 1, type: P[gi].type, sat: P[gi].sat });
      x += o.chromWidth + o.gap;
    });
    const width = Math.max(o.minWidth, x - o.gap + o.chromWidth / 2 + o.margin + 6);
    let height = bottom + labH + o.margin + 4;
    /* labels */
    let labels = '';
    lab.forEach(L => {
      let y = bottom + o.font + 4;
      if (o.labels) { labels += `<text class="idio-lab" x="${r1(L.x)}" y="${r1(y)}" text-anchor="middle" font-size="${o.font}">${escX(L.label)}</text>`; y += o.font + 3; }
      if (o.types && L.type) labels += `<text class="idio-type" x="${r1(L.x)}" y="${r1(y)}" text-anchor="middle" font-size="${o.font - 1}">${escX(L.type)}${L.sat ? '<tspan class="idio-satmark">*</tspan>' : ''}</text>`;
    });
    /* the axis: zero at the centromeres, ticks up (short arms) and down (long arms) */
    let ruler = '';
    if (o.ruler) {
      const span = maxS + maxL, step = niceStep(span / 6), ax = left - 6;
      ruler += `<line class="idio-axis" data-role="axis" x1="${ax}" x2="${ax}" y1="${r1(y0 - maxS * sc)}" y2="${r1(y0 + maxL * sc)}"/>`;
      for (let v = 0; v <= maxS + 1e-9; v += step) {
        const y = y0 - v * sc;
        ruler += `<line class="idio-axis" x1="${ax - 4}" x2="${ax}" y1="${r1(y)}" y2="${r1(y)}"/><text class="idio-tick" data-role="ytick" x="${ax - 6}" y="${r1(y + 3.5)}" text-anchor="end" font-size="${o.font - 1}">${fmt(v)}</text>`;
      }
      for (let v = step; v <= maxL + 1e-9; v += step) {
        const y = y0 + v * sc;
        ruler += `<line class="idio-axis" x1="${ax - 4}" x2="${ax}" y1="${r1(y)}" y2="${r1(y)}"/><text class="idio-tick" data-role="ytick" x="${ax - 6}" y="${r1(y + 3.5)}" text-anchor="end" font-size="${o.font - 1}">${fmt(v)}</text>`;
      }
      ruler += `<text class="idio-unit" data-role="ylab" transform="translate(${o.margin + 4} ${r1((top + bottom) / 2)}) rotate(-90)" text-anchor="middle" font-size="${o.font}">${escX(o.unit)}</text>`;
      ruler += `<line class="idio-cline" x1="${ax}" x2="${r1(x - o.gap + o.chromWidth / 2 + 2)}" y1="${r1(y0)}" y2="${r1(y0)}"/>`;
    }
    /* legend (probes, classes): a column at the right */
    let legend = '';
    if (o.legend && o.legend.length) {
      const longest = Math.max(...o.legend.map(e => String(e.label).length));
      const colW = 18 + longest * o.font * 0.58 + 10;
      /* a column at the right; below the chromosomes when the figure is already
         wide (the homologs of a large karyotype), so it never ends up beyond
         the width of the page */
      const below = o.legendPos === 'bottom' || (o.legendPos !== 'right' && width + colW > 720);
      legend = `<g data-role="legend" class="idio-legend">`;
      if (!below) {
        const lx = width + 4, ly = top + 4;
        o.legend.forEach((e, i) => {
          const y = ly + i * (o.font + 7);
          legend += `<rect data-li="${i}" x="${lx}" y="${r1(y - o.font + 2)}" width="${o.font}" height="${o.font - 1}" rx="2" fill="${e.color}"/>` +
            `<text data-li="${i}" class="idio-leg" x="${lx + o.font + 5}" y="${r1(y)}" font-size="${o.font}">${escX(e.label)}</text>`;
        });
        height = Math.max(height, ly + o.legend.length * (o.font + 7) + 8);
        o._legendW = colW;
      } else {
        /* rows of entries, wrapped at the width of the figure */
        let lx = o.margin + 4, ly = height + o.font - 2;
        o.legend.forEach((e, i) => {
          const w = o.font + 5 + String(e.label).length * o.font * 0.58 + 16;
          if (lx > o.margin + 4 && lx + w > width - o.margin) { lx = o.margin + 4; ly += o.font + 7; }
          legend += `<rect data-li="${i}" x="${r1(lx)}" y="${r1(ly - o.font + 2)}" width="${o.font}" height="${o.font - 1}" rx="2" fill="${e.color}"/>` +
            `<text data-li="${i}" class="idio-leg" x="${r1(lx + o.font + 5)}" y="${r1(ly)}" font-size="${o.font}">${escX(e.label)}</text>`;
          lx += w;
        });
        height = ly + 10;
        o._legendW = 0;
      }
      legend += '</g>';
    }
    const W = Math.ceil(width + (o._legendW || 0));
    const H = Math.ceil(height);
    const title = o.title ? `<text class="idio-title" x="${o.margin}" y="${o.margin + 12}" font-size="${o.font + 2}" font-weight="700">${escX(o.title)}</text>` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="idio" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"` +
      ` data-plot="${left} ${r1(top)} ${r1(width - left)} ${r1(bottom - top)}" aria-label="${escX(o.aria || o.title || 'Idiograma')}">` +
      title + ruler + body + labels + legend + '</svg>';
    return { svg, width: W, height: H, scale: sc, y0, xs };
  }

  /* pairs from a karyotype of Karyo.build, with its order, the satellites and,
     if asked, the homologs of the first cell (diploid view) */
  function fromKaryotype(K, extra) {
    const e = extra || {};
    return K.pairs.map((p, i) => ({
      label: e.labels ? e.labels[i] : i + 1,
      s: p.s.mean, l: p.l.mean, sd: { s: p.s.sd, l: p.l.sd }, type: p.type,
      sat: p.sat, satArm: p.satArm, satLen: p.satLen,
      homologs: homologsOf(K, i),
      marks: e.marks ? e.marks[i] || [] : [],
    }));
  }
  /* the homologs of group i averaged over the cells, homolog by homolog
     (the longer one first), for the diploid idiogram */
  function homologsOf(K, i) {
    const cells = K.cells.map(c => c.groups[i]).filter(Boolean);
    if (!cells.length) return null;
    const size = Math.max(...cells.map(g => g.homolog.length));
    const out = [];
    for (let h = 0; h < size; h++) {
      const hs = cells.map(g => g.homolog.slice().sort((a, b) => b.c - a.c)[h]).filter(Boolean);
      const m = f => hs.reduce((a, x) => a + f(x), 0) / hs.length;
      const sats = hs.filter(x => x.sat > 0);
      out.push({ s: m(x => x.s), l: m(x => x.l), sat: sats.length >= hs.length / 2, satArm: sats.length && sats.filter(x => x.satArm === 'l').length > sats.length / 2 ? 'l' : 's',
        satLen: sats.length ? sats.reduce((a, x) => a + x.sat, 0) / sats.length : 0 });
    }
    return out;
  }

  window.Idio = { draw, fromKaryotype, homologsOf, armPath };
})();
