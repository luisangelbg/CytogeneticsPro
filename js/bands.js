/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — banding and in-situ hybridization (Bands).

   A signal is { acc, pair, homolog, arm, pos, size, probe, cell?, intensity? }:
   the pair as numbered in the karyotype of Block 3; homolog empty (both) or
   1, 2… (only that one: a heteromorphism); arm 's' or 'l'; pos the centre of
   the signal as a fraction of the arm from the centromere (0) to the telomere
   (1); size its extent as a fraction of the arm. A signal with a cell belongs
   to that cell only; without one, it is the pattern of the accession. The
   pattern drawn on the idiogram is the accession's, completed with the mean
   position of the cell-by-cell signals when the accession has none of its own
   for that pair, probe and arm.

   Position classes along an arm: proximal (< 1/3 of the arm), interstitial
   (1/3 to 0.8) and terminal (> 0.8). */
(function () {
  'use strict';
  const S = () => window.Stats;
  const KINDS = [['C', 'Banda C', 'C-band'], ['N', 'Banda N', 'N-band'], ['fluor', 'Fluorocromo (CMA, DAPI)', 'Fluorochrome (CMA, DAPI)'],
    ['FISH', 'FISH (sonda de ADN)', 'FISH (DNA probe)'], ['GISH', 'GISH (genoma)', 'GISH (genome)'], ['other', 'Otra', 'Other']];
  const COLORS = [['var(--idio-het)', 'Heterocromatina (oscura)', 'Heterochromatin (dark)'], ['var(--pr1)', 'Bermellón', 'Vermilion'], ['var(--pr2)', 'Verde azulado', 'Bluish green'],
    ['var(--pr3)', 'Azul', 'Blue'], ['var(--pr4)', 'Naranja', 'Orange'], ['var(--pr5)', 'Púrpura rojizo', 'Reddish purple'], ['var(--pr6)', 'Celeste', 'Sky blue'],
    ['var(--pr7)', 'Amarillo', 'Yellow'], ['var(--pr8)', 'Gris', 'Grey']];
  const DEFAULT_PROBES = [
    { id: 'cband', name: 'Banda C', kind: 'C', color: 'var(--idio-het)' },
    { id: 'cma', name: 'CMA⁺', kind: 'fluor', color: 'var(--pr4)' },
    { id: 'dapi', name: 'DAPI⁺', kind: 'fluor', color: 'var(--pr3)' },
    { id: 's45', name: 'ADNr 45S', kind: 'FISH', color: 'var(--pr1)' },
    { id: 's5', name: 'ADNr 5S', kind: 'FISH', color: 'var(--pr2)' },
    { id: 'tel', name: 'Telómero', kind: 'FISH', color: 'var(--pr7)', dot: true },
  ];
  const probes = () => { if (!state.bands.probes || !state.bands.probes.length) state.bands.probes = DEFAULT_PROBES.map(p => Object.assign({}, p)); return state.bands.probes; };
  const probe = id => probes().find(p => p.id === id) || null;
  const posClass = pos => pos < 1 / 3 ? 'proximal' : pos <= 0.8 ? 'interstitial' : 'terminal';
  const POS_NAMES = { proximal: ['proximal', 'proximal'], interstitial: ['intersticial', 'interstitial'], terminal: ['terminal', 'terminal'] };
  const valid = s => s && s.probe && +s.pair >= 1 && (s.arm === 's' || s.arm === 'l') && isFinite(+s.pos);

  /* the pattern of an accession: one entry per pair, probe, arm and homologue */
  function pattern(acc) {
    const all = state.bands.signals.filter(s => s.acc === acc && valid(s));
    const own = all.filter(s => !s.cell);
    const key = s => [s.pair, s.probe, s.arm, s.homolog || ''].join('|');
    const out = own.map(s => Object.assign({}, s, { pos: +s.pos, size: +s.size || 0.08, from: 'acc' }));
    const have = new Set(out.map(key));
    const byKey = new Map();
    all.filter(s => s.cell).forEach(s => { const k = key(s); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(s); });
    byKey.forEach((list, k) => {
      if (have.has(k)) return;
      const s0 = list[0];
      out.push(Object.assign({}, s0, { cell: null, pos: S().mean(list.map(s => +s.pos)), size: S().mean(list.map(s => +s.size || 0.08)), from: 'cells', n: list.length }));
    });
    return out;
  }
  /* the marks of the idiogram: an array per pair (index = pair number − 1) */
  function marksFor(acc, K) {
    const P = pattern(acc);
    if (!P.length) return null;
    const n = K ? K.pairs.length : Math.max(...P.map(s => +s.pair));
    const out = Array.from({ length: n }, () => []);
    P.forEach(s => {
      const j = +s.pair - 1;
      if (j < 0 || j >= n) return;
      const pr = probe(s.probe) || {};
      out[j].push({ arm: s.arm, pos: s.pos, size: s.size, color: pr.color || 'var(--text)', probe: pr.name || s.probe, kind: pr.dot ? 'dot' : 'band', homolog: s.homolog ? +s.homolog : null });
    });
    return out;
  }
  function legendFor(acc) {
    const used = [...new Set(pattern(acc).map(s => s.probe))];
    return probes().filter(p => used.includes(p.id)).map(p => ({ label: p.name, color: p.color }));
  }
  /* sites per probe in one set: pairs, positions, heteromorphisms */
  function summary(acc) {
    const P = pattern(acc);
    return probes().map(p => {
      const ss = P.filter(s => s.probe === p.id);
      if (!ss.length) return null;
      const pairs = [...new Set(ss.map(s => +s.pair))].sort((a, b) => a - b);
      const cls = {};
      ss.forEach(s => { const c = posClass(s.pos); cls[c] = (cls[c] || 0) + 1; });
      return { probe: p, sites: ss.length, pairs, classes: cls, hetero: ss.filter(s => s.homolog).length,
        list: ss.map(s => ({ pair: +s.pair, arm: s.arm === 's' ? 'p' : 'q', pos: s.pos, cls: posClass(s.pos), homolog: s.homolog || null })) };
    }).filter(Boolean);
  }
  /* concordance among cells: for each pair, probe and arm seen cell by cell, the
     share of the accession's cells with signals that show it, and the spread of
     its position */
  function concordance(acc) {
    const cs = state.bands.signals.filter(s => s.acc === acc && s.cell && valid(s));
    const cells = [...new Set(cs.map(s => s.cell))];
    if (!cells.length) return null;
    const by = new Map();
    cs.forEach(s => { const k = [s.pair, s.probe, s.arm].join('|'); if (!by.has(k)) by.set(k, []); by.get(k).push(s); });
    const rows = [...by.values()].map(list => {
      const inCells = new Set(list.map(s => s.cell));
      const pos = list.map(s => +s.pos);
      return { pair: +list[0].pair, probe: probe(list[0].probe) || { name: list[0].probe }, arm: list[0].arm === 's' ? 'p' : 'q',
        cells: inCells.size, share: inCells.size / cells.length, mean: S().mean(pos), sd: pos.length > 1 ? S().sd(pos) : NaN };
    }).sort((a, b) => a.pair - b.pair || String(a.probe.name).localeCompare(String(b.probe.name)));
    return { cells: cells.length, rows };
  }
  /* the number of sites of each probe in each accession (for the comparison of Block 8) */
  function siteCounts(acc) {
    const P = pattern(acc), out = {};
    P.forEach(s => { out[s.probe] = (out[s.probe] || 0) + (s.homolog ? 0.5 : 1); });
    return out;
  }

  /* the physical map of one chromosome: drawn big, with each signal labelled
     by its probe, its position as a percentage of the arm and in µm */
  function singleMap(K, j, marks, opts) {
    const o = Object.assign({ font: 12, unit: K.unit || 'µm' }, opts || {});
    const p = K.pairs[j];
    if (!p) return '';
    const sL = p.s.mean, lL = p.l.mean, H = 300, sc = H / (sL + lL), w = 34;
    const x = 120, top = 30, y0 = top + sL * sc + 2;
    const pair = Idio.fromKaryotype(K)[j];
    pair.marks = (marks && marks[j]) || [];
    let g = `<text class="ttl" x="${x - 60}" y="18" font-size="${o.font + 2}">${esc(T('Par ', 'Pair ') + (j + 1))} · ${esc(p.type)}${p.sat ? '-sat' : ''} · ${fmtFixed(p.c.mean, 2)} ${esc(o.unit)}</text>`;
    const one = Object.assign({}, pair, { homologs: null });
    const I = Idio.draw([one], { scale: sc, chromWidth: w, ruler: true, labels: false, types: false, unit: o.unit, font: o.font, margin: 10, minWidth: 140 });
    g += `<g class="idio" transform="translate(${x - 70} ${top - 18})">${I.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</g>`;
    const cx = x - 70 + I.xs[0], y0r = top - 18 + I.y0;
    const labels = (pair.marks || []).map(m => {
      const len = (m.arm === 'l' ? lL : sL), dir = m.arm === 'l' ? 1 : -1;
      const yy = y0r + dir * (1.5 + m.pos * len * sc);
      return { yy, text: `${m.probe} · ${m.arm === 'l' ? 'q' : 'p'} ${Math.round(m.pos * 100)} % · ${fmtFixed(m.pos * len, 2)} ${o.unit}${m.homolog ? ' · ' + T('homólogo ', 'homologue ') + m.homolog : ''}`, color: m.color };
    }).sort((a, b) => a.yy - b.yy);
    let last = -1e9;
    labels.forEach(L => {
      const ty = Math.max(L.yy, last + o.font + 4); last = ty;
      g += `<line x1="${r1(cx + w / 2 + 2)}" y1="${r1(L.yy)}" x2="${r1(cx + w / 2 + 26)}" y2="${r1(ty - 4)}" stroke="var(--text-muted)" stroke-width="1"/>` +
        `<rect x="${r1(cx + w / 2 + 28)}" y="${r1(ty - o.font + 1)}" width="9" height="9" rx="2" fill="${L.color}"/>` +
        `<text class="txt" x="${r1(cx + w / 2 + 41)}" y="${r1(ty)}" font-size="${o.font}">${esc(L.text)}</text>`;
    });
    const Hh = Math.max(top - 18 + I.height + 10, last + 16), W = 560;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="fig" viewBox="0 0 ${W} ${Math.ceil(Hh)}" width="${W}" height="${Math.ceil(Hh)}" role="img" aria-label="${esc(T('Mapa físico del par ', 'Physical map of pair ') + (j + 1))}">${g}</svg>`;
  }
  const r1 = v => Math.round(v * 10) / 10;

  window.Bands = { KINDS, COLORS, DEFAULT_PROBES, probes, probe, posClass, POS_NAMES, pattern, marksFor, legendFor, summary, concordance, siteCounts, singleMap, valid };
})();
