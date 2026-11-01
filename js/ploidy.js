/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — ploidy, genome size and the Allium test (Ploidy).
   - Counts of 2n per cell: frequencies, mode, share of the modal number.
   - The ploidy level from the base number x: euploid levels (2x, 4x…) and
     aneuploid ones (2x + 1…), with their names.
   - Flow cytometry: 2C of the sample = (peak of the sample / peak of the
     internal standard) × 2C of the standard; 1C = 2C / 2; 1Cx = 2C / ploidy
     level (Greilhuber et al. 2005); 1 pg = 978 Mbp (Doležel et al. 2003).
   - A histogram exported by the cytometer: its channels, peaks found after a
     light smoothing, and the mean, standard deviation and CV of a gate.
   - The Allium test (Fiskesjö 1985; Leme and Marin-Morales 2009): mitotic
     index, phase indices, aberrations among dividing cells and micronuclei,
     each treatment against the control. */
(function () {
  'use strict';
  const S = () => window.Stats;
  const PG_MBP = 978;

  /* plant DNA reference standards (2C, pg), from the laboratory of Doležel and
     collaborators; the user can type any other */
  const STANDARDS = [
    { id: 'radish', es: 'Raphanus sativus «Saxa»', en: 'Raphanus sativus «Saxa»', c2: 1.11 },
    { id: 'tomato', es: 'Solanum lycopersicum «Stupické polní tyčkové rané»', en: 'Solanum lycopersicum «Stupické polní tyčkové rané»', c2: 1.96 },
    { id: 'soybean', es: 'Glycine max «Polanka»', en: 'Glycine max «Polanka»', c2: 2.50 },
    { id: 'maize', es: 'Zea mays CE-777', en: 'Zea mays CE-777', c2: 5.43 },
    { id: 'pea', es: 'Pisum sativum «Ctirad»', en: 'Pisum sativum «Ctirad»', c2: 9.09 },
    { id: 'rye', es: 'Secale cereale «Dankovské»', en: 'Secale cereale «Dankovské»', c2: 16.19 },
    { id: 'bean', es: 'Vicia faba «Inovec»', en: 'Vicia faba «Inovec»', c2: 26.90 },
    { id: 'onion', es: 'Allium cepa «Alice»', en: 'Allium cepa «Alice»', c2: 34.89 },
  ];

  /* base numbers of frequent genera (editable in Block 6). Values of common use,
     to be checked against the chromosome counts databases (Rice et al. 2015). */
  const X_TABLE = [
    ['Poaceae', 'Zea', 10], ['Poaceae', 'Oryza', 12], ['Poaceae', 'Triticum', 7], ['Poaceae', 'Hordeum', 7], ['Poaceae', 'Avena', 7],
    ['Poaceae', 'Sorghum', 10], ['Poaceae', 'Bouteloua', 10], ['Fabaceae', 'Phaseolus', 11], ['Fabaceae', 'Pisum', 7], ['Fabaceae', 'Medicago', 8],
    ['Fabaceae', 'Arachis', 10], ['Fabaceae', 'Leucaena', 13], ['Solanaceae', 'Solanum', 12], ['Solanaceae', 'Capsicum', 12], ['Solanaceae', 'Physalis', 12],
    ['Solanaceae', 'Nicotiana', 12], ['Cucurbitaceae', 'Cucurbita', 20], ['Cucurbitaceae', 'Cucumis (pepino)', 7], ['Cucurbitaceae', 'Cucumis (melón)', 12],
    ['Cucurbitaceae', 'Citrullus', 11], ['Cucurbitaceae', 'Sechium', 14], ['Cucurbitaceae', 'Sicyos', 12], ['Asparagaceae', 'Agave', 30],
    ['Amaryllidaceae', 'Allium', 8], ['Cactaceae', 'Opuntia', 11], ['Rubiaceae', 'Coffea', 11], ['Rutaceae', 'Citrus', 9], ['Rosaceae', 'Malus', 17],
    ['Rosaceae', 'Prunus', 8], ['Rosaceae', 'Fragaria', 7], ['Rosaceae', 'Rubus', 7], ['Lauraceae', 'Persea', 12], ['Musaceae', 'Musa', 11],
    ['Malvaceae', 'Gossypium', 13], ['Malvaceae', 'Theobroma', 10], ['Caricaceae', 'Carica', 9], ['Vitaceae', 'Vitis', 19], ['Euphorbiaceae', 'Manihot', 18],
    ['Convolvulaceae', 'Ipomoea', 15], ['Brassicaceae', 'Arabidopsis', 5], ['Brassicaceae', 'Brassica (rapa)', 10], ['Brassicaceae', 'Brassica (oleracea)', 9],
    ['Asteraceae', 'Helianthus', 17], ['Asteraceae', 'Dahlia', 16], ['Amaranthaceae', 'Amaranthus', 16], ['Amaranthaceae', 'Chenopodium', 9],
    ['Pinaceae', 'Pinus', 12], ['Pinaceae', 'Abies', 12], ['Fagaceae', 'Quercus', 12], ['Myrtaceae', 'Eucalyptus', 11], ['Myrtaceae', 'Psidium', 11],
    ['Bromeliaceae', 'Ananas', 25], ['Anacardiaceae', 'Mangifera', 20], ['Orchidaceae', 'Vanilla', 16],
  ].map(r => ({ family: r[0], genus: r[1], x: r[2] }));

  /* ---------------- counts ---------------- */
  function counts(rows) {
    const v = rows.map(r => +r.n2).filter(n => n > 0 && Number.isInteger(n));
    if (!v.length) return null;
    const m = S().modes(v);
    const freq = [...m.table.entries()].sort((a, b) => a[0] - b[0]);
    const mode = m.modes.length === 1 ? m.modes[0] : null;
    return { n: v.length, freq, modes: m.modes, mode, modal: m.count / v.length, min: Math.min(...v), max: Math.max(...v), off: mode != null ? v.filter(x => x !== mode).length : null };
  }

  /* ---------------- ploidy level ---------------- */
  const LEVEL_NAMES = {
    1: ['monoploide', 'monoploid'], 2: ['diploide', 'diploid'], 3: ['triploide', 'triploid'], 4: ['tetraploide', 'tetraploid'], 5: ['pentaploide', 'pentaploid'],
    6: ['hexaploide', 'hexaploid'], 7: ['heptaploide', 'heptaploid'], 8: ['octoploide', 'octoploid'], 9: ['eneaploide', 'enneaploid'], 10: ['decaploide', 'decaploid'],
    12: ['dodecaploide', 'dodecaploid'], 16: ['hexadecaploide', 'hexadecaploid'],
  };
  const ANEU = { 1: ['trisómico (2n + 1)', 'trisomic (2n + 1)'], '-1': ['monosómico (2n − 1)', 'monosomic (2n − 1)'], 2: ['tetrasómico o doble trisómico (2n + 2)', 'tetrasomic or double trisomic (2n + 2)'], '-2': ['nulisómico o doble monosómico (2n − 2)', 'nullisomic or double monosomic (2n − 2)'] };
  function level(n2, x) {
    if (!(n2 > 0) || !(x > 0)) return null;
    const L = Math.max(1, Math.round(n2 / x)), d = n2 - L * x;
    return {
      level: L, diff: d, euploid: d === 0, exact: n2 / x,
      text: L + 'x' + (d ? (d > 0 ? ' + ' + d : ' − ' + (-d)) : ''),
      formula: '2n = ' + L + 'x' + (d ? (d > 0 ? ' + ' + d : ' − ' + (-d)) : '') + ' = ' + n2,
      name: LEVEL_NAMES[L] || [L + 'x', L + 'x'],
      aneu: d && L === 2 ? (ANEU[d] || null) : null,
    };
  }
  function series(x, maxLevel) { const out = []; for (let k = 2; k <= (maxLevel || 8); k++) out.push({ level: k, n2: k * x, name: LEVEL_NAMES[k] || [k + 'x', k + 'x'] }); return out; }
  /* several base numbers among accessions of the same group: a possible dysploid series */
  function dysploidy(xs) {
    const u = [...new Set(xs.filter(v => v > 0))].sort((a, b) => a - b);
    if (u.length < 2) return null;
    const steps = [];
    for (let i = 1; i < u.length; i++) steps.push(u[i] - u[i - 1]);
    return { values: u, consecutive: steps.every(s => s === 1), steps };
  }

  /* ---------------- flow cytometry ---------------- */
  const pgToMbp = pg => pg * PG_MBP;
  const mbpToPg = mbp => mbp / PG_MBP;
  const UNITS = { pg: 1, Mbp: 1 / PG_MBP, Gbp: 1000 / PG_MBP, bp: 1 / (PG_MBP * 1e6) };   // pg per unit
  const convert = (v, from, to) => v * UNITS[from] / UNITS[to];
  /* one run: the standard (2C known) and the sample, each with its G0/G1 peak */
  function genome(run, levelValue) {
    const std = +run.stdC2, sp = +run.samplePeak, tp = +run.stdPeak;
    if (!(std > 0 && sp > 0 && tp > 0)) return null;
    const ratio = sp / tp, c2 = ratio * std;
    const L = levelValue > 0 ? levelValue : null;
    const flags = [];
    if (+run.cvSample > 5 || +run.cvStd > 5) flags.push('cv');
    if (ratio > 0.85 && ratio < 1.18) flags.push('overlap');
    if (ratio > 3 || ratio < 1 / 3) flags.push('far');
    return { ratio, c2, c1: c2 / 2, mbp2: pgToMbp(c2), mbp1: pgToMbp(c2 / 2), c1x: L ? c2 / L : null, mbp1x: L ? pgToMbp(c2 / L) : null, flags };
  }

  /* ---------------- the histogram of the cytometer ----------------
     A CSV of two columns (channel, count) or of one column of event values (or
     several columns: the one asked for). Returns channels and counts. */
  function readHistogram(text, opts) {
    const o = opts || {};
    const { rows } = parseDelimited(text);
    if (!rows.length) return null;
    const head = rows[0].some(v => v !== '' && !isFinite(num(v)));
    const body = head ? rows.slice(1) : rows;
    const nc = Math.max(...body.map(r => r.length));
    if (nc === 2 && !o.column) {
      const x = [], y = [];
      body.forEach(r => { const a = num(r[0]), b = num(r[1]); if (isFinite(a) && isFinite(b)) { x.push(a); y.push(b); } });
      return { x, y, events: S().sum(y), kind: 'histogram' };
    }
    const col = o.column != null ? o.column : 0;
    const ev = body.map(r => num(r[col])).filter(v => isFinite(v));
    return binEvents(ev, o.bins || 512, o.max);
  }
  function binEvents(ev, bins, maxV) {
    const mx = maxV || Math.max(...ev) * 1.02 || 1;
    const y = new Array(bins).fill(0), w = mx / bins;
    ev.forEach(v => { const k = Math.floor(v / w); if (k >= 0 && k < bins) y[k]++; });
    return { x: y.map((_, i) => (i + 0.5) * w), y, events: ev.length, kind: 'events', binWidth: w };
  }
  /* peaks: local maxima of the smoothed counts, at least `minFrac` of the
     highest and separated by `minSep` (a fraction of the range) */
  function peaks(h, opts) {
    const o = Object.assign({ window: 5, minFrac: 0.04, minSep: 0.06, skipLow: 0.04 }, opts || {});
    const n = h.y.length, k = Math.floor(o.window / 2), sm = new Array(n).fill(0);
    for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let j = i - k; j <= i + k; j++) if (j >= 0 && j < n) { s += h.y[j]; c++; } sm[i] = s / c; }
    const lo = h.x[0] + (h.x[n - 1] - h.x[0]) * o.skipLow;
    const top = Math.max(...sm.filter((v, i) => h.x[i] >= lo));
    const cand = [];
    for (let i = 1; i < n - 1; i++) if (h.x[i] >= lo && sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && sm[i] >= o.minFrac * top) cand.push(i);
    /* prominence: how much the peak stands above the higher of the two valleys
       that separate it from higher ground on each side; the noise on the slope
       of the debris has little of it */
    const prom = i => {
      let l = sm[i], r = sm[i];
      for (let j = i - 1; j >= 0 && sm[j] <= sm[i]; j--) l = Math.min(l, sm[j]);
      for (let j = i + 1; j < n && sm[j] <= sm[i]; j++) r = Math.min(r, sm[j]);
      return sm[i] - Math.max(l, r);
    };
    const good = cand.filter(i => prom(i) >= Math.max(o.minFrac * top, 0.5 * sm[i]));
    good.sort((a, b) => sm[b] - sm[a]);
    const sep = (h.x[n - 1] - h.x[0]) * o.minSep, out = [];
    good.forEach(i => { if (out.every(j => Math.abs(h.x[j] - h.x[i]) >= sep)) out.push(i); });
    return out.sort((a, b) => a - b).map(i => ({ x: h.x[i], height: sm[i], prominence: prom(i), i }));
  }
  /* the statistics of a gate [a, b]: events, mean, sd and CV (count-weighted) */
  function gate(h, a, b) {
    let n = 0, s = 0, s2 = 0;
    h.x.forEach((x, i) => { if (x >= a && x <= b) { const w = h.y[i]; n += w; s += w * x; s2 += w * x * x; } });
    if (!n) return null;
    const mean = s / n, v = Math.max(0, s2 / n - mean * mean), sd = Math.sqrt(v);
    return { events: n, mean, sd, cv: 100 * sd / mean };
  }
  /* a gate around a peak: half the distance to its neighbours, at most ±15 % */
  function autoGates(h, P) {
    return P.map((p, i) => {
      const left = i ? (P[i - 1].x + p.x) / 2 : p.x * 0.85, right = i < P.length - 1 ? (P[i + 1].x + p.x) / 2 : p.x * 1.15;
      return { a: Math.max(left, p.x * 0.85), b: Math.min(right, p.x * 1.15) };
    });
  }

  /* ---------------- the Allium test ---------------- */
  const PHASES = ['pro', 'meta', 'ana', 'telo'];
  const ABER = ['cmeta', 'sticky', 'bridges', 'laggards', 'fragments', 'multipolar'];
  const ABER_NAMES = {
    cmeta: ['c-metafase', 'c-metaphase'], sticky: ['adherencias', 'stickiness'], bridges: ['puentes', 'bridges'],
    laggards: ['rezagados', 'laggards'], fragments: ['fragmentos', 'fragments'], multipolar: ['husos multipolares', 'multipolar spindles'],
  };
  function mitosisRow(r) {
    const div = S().sum(PHASES.map(k => +r[k] || 0)), inter = +r.inter || 0, total = inter + div;
    const ab = S().sum(ABER.map(k => +r[k] || 0));
    return { total, div, inter, ab, mn: +r.mn || 0,
      MI: total ? 100 * div / total : NaN, AI: div ? 100 * ab / div : NaN, MN: inter ? 1000 * (+r.mn || 0) / inter : NaN,
      ph: Object.fromEntries(PHASES.map(k => [k, div ? 100 * (+r[k] || 0) / div : NaN])) };
  }
  /* by treatment: pooled indices, mean ± sd of the replicates, and each
     treatment against the control (two proportions, pooled counts; Holm) */
  function allium(rows, control) {
    const trts = [...new Set(rows.map(r => r.trt).filter(Boolean))];
    const res = trts.map(t => {
      const rs = rows.filter(r => r.trt === t).map(mitosisRow);
      const sum = k => S().sum(rs.map(r => r[k]));
      const tot = sum('total'), div = sum('div'), inter = sum('inter'), ab = sum('ab'), mn = sum('mn');
      const ms = k => ({ mean: S().mean(rs.map(r => r[k]).filter(isFinite)), sd: S().sd(rs.map(r => r[k]).filter(isFinite)) });
      const phases = {};
      PHASES.forEach(k => { const c = S().sum(rows.filter(r => r.trt === t).map(r => +r[k] || 0)); phases[k] = div ? 100 * c / div : NaN; });
      const aber = {};
      ABER.forEach(k => { aber[k] = S().sum(rows.filter(r => r.trt === t).map(r => +r[k] || 0)); });
      return { trt: t, reps: rs.length, tot, div, inter, ab, mn, MI: tot ? 100 * div / tot : NaN, AI: div ? 100 * ab / div : NaN, MN: inter ? 1000 * mn / inter : NaN,
        MIr: ms('MI'), AIr: ms('AI'), MNr: ms('MN'), phases, aber };
    });
    const C = res.find(r => r.trt === control) || res[0];
    const others = res.filter(r => r !== C);
    const tests = { MI: [], AI: [], MN: [] };
    others.forEach(r => {
      tests.MI.push(S().twoProportions(r.div, r.tot, C.div, C.tot));
      tests.AI.push(S().twoProportions(r.ab, r.div, C.ab, C.div));
      tests.MN.push(S().twoProportions(r.mn, r.inter, C.mn, C.inter));
    });
    Object.keys(tests).forEach(k => { const adj = S().holm(tests[k].map(x => x.p)); tests[k].forEach((x, i) => { x.pHolm = adj[i]; x.trt = others[i].trt; }); });
    const overall = res.length > 1 ? S().contingency(res.map(r => [r.div, r.tot - r.div])) : null;
    return { res, control: C ? C.trt : null, tests, overall };
  }

  window.Ploidy = { PG_MBP, STANDARDS, X_TABLE, LEVEL_NAMES, counts, level, series, dysploidy, pgToMbp, mbpToPg, UNITS, convert, genome,
    readHistogram, binEvents, peaks, gate, autoGates, PHASES, ABER, ABER_NAMES, mitosisRow, allium };
})();
