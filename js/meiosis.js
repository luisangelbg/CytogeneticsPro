/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — the meiosis engine (Meiosis).

   1. Observed configurations at diakinesis / metaphase I, cell by cell:
      univalents, rod and ring bivalents, trivalents, chain and ring
      quadrivalents and larger multivalents; chiasmata per cell and per
      bivalent and the recombination index.
   2. The meiotic index of Love (1951) and the viability of pollen with its
      confidence intervals and the tests of homogeneity between individuals.
   3. The configurations EXPECTED under a hypothesis written as a genome
      formula (AAAA autotetraploid, AABB allotetraploid, AAAABB…).

   The model of expectation, stated so it can be checked by hand: every
   chromosome has two arms; at the end of each arm the homologs of a group
   pair two by two at random (with an odd number, one end stays unpaired),
   independently at the two ends; every paired arm forms a chiasma with
   probability c, independently. A configuration is a set of chromosomes held
   together by chiasmata: chain (open) or ring (closed). With four homologs
   the two ends choose the same partners with probability 1/3, so pairing in a
   quadrivalent happens with probability 2/3 (Sybenga 1975); the frequencies
   of every configuration follow the same counting as the models of Jackson
   and Casey (1982). Everything is computed exactly by enumerating the
   pairings and the chiasma patterns; nothing is simulated.

   Configuration keys: 'c' + size for chains (c1 univalent, c2 rod bivalent,
   c3 chain trivalent…), 'r' + size for rings (r2 ring bivalent, r4 ring
   quadrivalent…). A chain of k chromosomes has k − 1 chiasmata, a ring k. */
(function () {
  'use strict';
  const S = () => window.Stats;

  /* ---------------- observed configurations ---------------- */
  /* the columns of a record, in table order, with their key in the model */
  const COLS = [
    { f: 'I', key: 'c1', size: 1, xta: 0, es: 'I', en: 'I', name: ['univalentes', 'univalents'] },
    { f: 'IIrod', key: 'c2', size: 2, xta: 1, es: 'II varilla', en: 'II rod', name: ['bivalentes en varilla', 'rod bivalents'] },
    { f: 'IIring', key: 'r2', size: 2, xta: 2, es: 'II anillo', en: 'II ring', name: ['bivalentes en anillo', 'ring bivalents'] },
    { f: 'III', key: 'c3', size: 3, xta: 2, es: 'III', en: 'III', name: ['trivalentes', 'trivalents'] },
    { f: 'IVchain', key: 'c4', size: 4, xta: 3, es: 'IV cadena', en: 'IV chain', name: ['cuadrivalentes en cadena', 'chain quadrivalents'] },
    { f: 'IVring', key: 'r4', size: 4, xta: 4, es: 'IV anillo', en: 'IV ring', name: ['cuadrivalentes en anillo', 'ring quadrivalents'] },
    { f: 'V', key: 'c5', size: 5, xta: 4, es: 'V', en: 'V', name: ['pentavalentes', 'pentavalents'] },
    { f: 'VIchain', key: 'c6', size: 6, xta: 5, es: 'VI cadena', en: 'VI chain', name: ['hexavalentes en cadena', 'chain hexavalents'] },
    { f: 'VIring', key: 'r6', size: 6, xta: 6, es: 'VI anillo', en: 'VI ring', name: ['hexavalentes en anillo', 'ring hexavalents'] },
  ];
  const keyInfo = k => ({ ring: k[0] === 'r', size: +k.slice(1) });
  const xtaOf = k => { const i = keyInfo(k); return i.ring ? i.size : i.size - 1; };

  /* one cell: how many chromosomes it shows, its bivalents, multivalents and
     chiasmata (estimated from the configurations unless counted: rec.xta) */
  function cell(rec) {
    let chr = 0, biv = 0, mult = 0, xta = 0, xtaBiv = 0, ringBiv = 0;
    COLS.forEach(c => {
      const v = +rec[c.f] || 0;
      chr += v * c.size;
      xta += v * c.xta;
      if (c.size === 2) { biv += v; xtaBiv += v * c.xta; if (c.key === 'r2') ringBiv += v; }
      if (c.size > 2) mult += v;
    });
    const counted = rec.xta != null && rec.xta !== '' && isFinite(+rec.xta);
    return {
      chr, biv, mult, univ: +rec.I || 0, ringBiv, rodBiv: biv - ringBiv,
      xta: counted ? +rec.xta : xta, xtaEstimated: !counted, xtaBiv,
    };
  }

  /* the summary of a list of cells (one individual, one accession…);
     n = the haploid number, for the recombination index (n + chiasmata) */
  function summarize(records, opts) {
    const o = opts || {};
    const cells = records.map(cell);
    const N = cells.length;
    if (!N) return null;
    const col = f => cells.map(f);
    const ms = a => ({ mean: S().mean(a), sd: S().sd(a), min: Math.min(...a), max: Math.max(...a) });
    const per = {};
    COLS.forEach(c => { per[c.f] = ms(records.map(r => +r[c.f] || 0)); });
    const xta = ms(col(c => c.xta));
    const biv = S().sum(col(c => c.biv)), xtaBiv = S().sum(col(c => c.xtaBiv));
    const chrModes = S().modes(col(c => c.chr));
    const n = o.n > 0 ? o.n : chrModes.modes[0] / 2;
    return {
      cells: N, per, xta,
      xtaPerBiv: biv ? xtaBiv / biv : NaN,
      chr: chrModes.modes[0], chrVaries: chrModes.table.size > 1,
      withMult: col(c => c.mult > 0).filter(Boolean).length / N,
      withUniv: col(c => c.univ > 0).filter(Boolean).length / N,
      ringRod: S().sum(col(c => c.rodBiv)) ? S().sum(col(c => c.ringBiv)) / S().sum(col(c => c.rodBiv)) : NaN,
      n,
      RI: n + xta.mean,                         // Darlington: haploid number + mean chiasmata per cell
      estimated: cells.some(c => c.xtaEstimated),
    };
  }

  /* ---------------- the expectation model ---------------- */
  /* every way of pairing m arm ends two by two (one left over when m is odd);
     partner[i] = j, or −1 for the end that stays unpaired */
  const matchCache = new Map();
  function matchings(m) {
    if (matchCache.has(m)) return matchCache.get(m);
    const out = [], p = new Array(m).fill(-2);
    (function rec(oddUsed) {
      const i = p.indexOf(-2);
      if (i < 0) { out.push(p.slice()); return; }
      if (m % 2 === 1 && !oddUsed) { p[i] = -1; rec(true); p[i] = -2; }
      for (let j = i + 1; j < m; j++) if (p[j] === -2) { p[i] = j; p[j] = i; rec(oddUsed); p[i] = -2; p[j] = -2; }
    })(false);
    matchCache.set(m, out);
    return out;
  }

  /* distributions are Maps from a configuration (sorted "key:count|…") to its probability */
  const enc = cnt => Object.keys(cnt).filter(k => cnt[k]).sort(sortKeys).map(k => k + ':' + cnt[k]).join('|');
  const dec = s => { const o = {}; if (s) s.split('|').forEach(t => { const [k, v] = t.split(':'); o[k] = +v; }); return o; };
  function sortKeys(a, b) { const A = keyInfo(a), B = keyInfo(b); return A.size - B.size || (A.ring ? 1 : 0) - (B.ring ? 1 : 0); }
  function convolve(d1, d2) {
    const out = new Map();
    d1.forEach((p1, k1) => d2.forEach((p2, k2) => {
      const a = dec(k1), b = dec(k2);
      Object.keys(b).forEach(k => { a[k] = (a[k] || 0) + b[k]; });
      const k = enc(a);
      out.set(k, (out.get(k) || 0) + p1 * p2);
    }));
    return out;
  }
  /* a line of v chromosomes joined by `present` (a bit per bond): its chains */
  function chainsOf(v, present, cnt) {
    let run = 1;
    for (let e = 0; e < v - 1; e++) {
      if (present[e]) run++;
      else { cnt['c' + run] = (cnt['c' + run] || 0) + 1; run = 1; }
    }
    cnt['c' + run] = (cnt['c' + run] || 0) + 1;
  }
  const compCache = new Map();
  /* the distribution of one component of the pairing graph: a path of E
     possible bonds (E + 1 chromosomes) or a cycle of L bonds (L chromosomes) */
  function component(kind, len, c) {
    const key = kind + len + ':' + c;
    if (compCache.has(key)) return compCache.get(key);
    const out = new Map();
    const E = len;
    for (let mask = 0; mask < (1 << E); mask++) {
      let k = 0;
      const pres = [];
      for (let e = 0; e < E; e++) { const b = (mask >> e) & 1; pres.push(b); k += b; }
      const p = Math.pow(c, k) * Math.pow(1 - c, E - k);
      if (p === 0) continue;
      const cnt = {};
      if (kind === 'path') chainsOf(E + 1, pres, cnt);
      else if (k === E) cnt['r' + E] = 1;
      else {
        /* cut the cycle at a missing bond: what is left is a line of L chromosomes */
        const a = pres.indexOf(0), line = [];
        for (let t = 1; t < E; t++) line.push(pres[(a + t) % E]);
        chainsOf(E, line, cnt);
      }
      const s = enc(cnt);
      out.set(s, (out.get(s) || 0) + p);
    }
    compCache.set(key, out);
    return out;
  }
  /* the components (paths and cycles) of the graph made by the pairing of the
     left ends (pl) and of the right ends (pr) of m homologs */
  function components(pl, pr) {
    const m = pl.length, seen = new Array(m).fill(false), out = [];
    const deg = i => (pl[i] >= 0 ? 1 : 0) + (pr[i] >= 0 ? 1 : 0);
    for (let v = 0; v < m; v++) {
      if (seen[v] || deg(v) === 2) continue;
      /* a path starts at a chromosome with a free end */
      let cur = v, edges = 0, came = null;
      seen[cur] = true;
      for (;;) {
        let nxt = -1, via = null;
        if (came !== 'L' && pl[cur] >= 0) { nxt = pl[cur]; via = 'L'; }
        else if (came !== 'R' && pr[cur] >= 0) { nxt = pr[cur]; via = 'R'; }
        if (nxt < 0) break;
        edges++; cur = nxt; came = via; seen[cur] = true;
      }
      out.push(['path', edges]);
    }
    for (let v = 0; v < m; v++) {
      if (seen[v]) continue;
      let cur = v, len = 0, side = 'L';
      do { seen[cur] = true; cur = side === 'L' ? pl[cur] : pr[cur]; side = side === 'L' ? 'R' : 'L'; len++; } while (cur !== v);
      out.push(['cycle', len]);
    }
    return out;
  }
  /* the distribution of the configurations of one group of m homologs */
  const groupCache = new Map();
  function group(m, c) {
    const key = m + ':' + c;
    if (groupCache.has(key)) return groupCache.get(key);
    const M = matchings(m), w = 1 / (M.length * M.length);
    const out = new Map();
    M.forEach(pl => M.forEach(pr => {
      let d = new Map([['', 1]]);
      components(pl, pr).forEach(([kind, len]) => { d = convolve(d, component(kind, len, c)); });
      d.forEach((p, k) => out.set(k, (out.get(k) || 0) + p * w));
    }));
    groupCache.set(key, out);
    return out;
  }

  /* "AAAABB" → [4, 2]; also "4x auto" style objects are turned into formulas */
  function parseFormula(f) {
    const s = String(f || '').replace(/[^A-Za-z]/g, '');
    const cnt = new Map();
    for (const ch of s) cnt.set(ch, (cnt.get(ch) || 0) + 1);
    return [...cnt.values()];
  }
  function formulaFor(level, mode) {
    const L = Math.max(1, level | 0);
    if (mode === 'auto') return 'A'.repeat(L);
    const letters = 'ABCDEFGH';
    let f = '', g = 0;
    for (let i = 0; i < L; i += 2) f += letters[g++].repeat(Math.min(2, L - i));
    return f;
  }

  /* expected configurations per cell: x homoeologous groups (the base number),
     each made of the groups of the formula. Returns the expected count of each
     configuration per cell, the distribution per base chromosome and the
     expected chiasmata per cell. */
  function expected(formula, x, c) {
    const groups = parseFormula(formula);
    let d = new Map([['', 1]]);
    groups.forEach(m => { d = convolve(d, group(m, c)); });
    const per = {};
    d.forEach((p, k) => { const o = dec(k); Object.keys(o).forEach(kk => { per[kk] = (per[kk] || 0) + p * o[kk]; }); });
    const perCell = {};
    Object.keys(per).forEach(k => { perCell[k] = per[k] * x; });
    const pairedArms = S().sum(groups.map(m => 2 * Math.floor(m / 2)));
    return {
      groups, x, c, dist: d, perSet: per, perCell,
      xtaPerCell: x * pairedArms * c, pairedArms: x * pairedArms,
      chromosomes: x * S().sum(groups),
      multivalentShare: S().sum(Object.keys(per).filter(k => keyInfo(k).size > 2).map(k => per[k])),
    };
  }
  /* c from the observed chiasmata: the expected count is c × paired arms */
  function estimateC(meanXta, formula, x) {
    const groups = parseFormula(formula);
    const arms = x * S().sum(groups.map(m => 2 * Math.floor(m / 2)));
    return arms ? Math.max(0, Math.min(1, meanXta / arms)) : NaN;
  }
  /* observed against expected: classes pooled so each expected count is at
     least 5 when possible (I | II rod | II ring | III | IV chain | IV ring | ≥ V) */
  function compare(records, formula, x, c, opts) {
    const o = opts || {};
    const N = records.length;
    const E = expected(formula, x, c);
    const CLASSES = [['c1'], ['c2'], ['r2'], ['c3'], ['c4'], ['r4'], ['c5', 'c6', 'r6', 'c7', 'c8', 'r8']];
    const obs = CLASSES.map(ks => S().sum(records.map(r => S().sum(COLS.filter(cc => ks.includes(cc.key)).map(cc => +r[cc.f] || 0)))));
    const exp = CLASSES.map(ks => N * S().sum(ks.map(k => E.perCell[k] || 0)));
    /* a configuration the hypothesis does not allow at all (a quadrivalent in a
       strict allopolyploid) rejects it outright: such classes are not pooled away */
    const impossible = CLASSES.reduce((s, ks, i) => s + (exp[i] <= 1e-12 && obs[i] > 0 ? obs[i] : 0), 0);
    /* pool the smallest neighbours until every class has at least 5 expected */
    let groups = CLASSES.map((ks, i) => ({ ks: ks.slice(), o: obs[i], e: exp[i], lab: [i] })).filter(g => g.e > 1e-12);
    const minE = o.minExpected || 5;
    while (groups.length > 2 && groups.some(g => g.e < minE)) {
      let i = 0;
      groups.forEach((g, j) => { if (g.e < groups[i].e) i = j; });
      const j = i === groups.length - 1 ? i - 1 : (i === 0 ? 1 : (groups[i - 1].e < groups[i + 1].e ? i - 1 : i + 1));
      const a = Math.min(i, j), b = Math.max(i, j);
      groups[a] = { ks: groups[a].ks.concat(groups[b].ks), o: groups[a].o + groups[b].o, e: groups[a].e + groups[b].e, lab: groups[a].lab.concat(groups[b].lab) };
      groups.splice(b, 1);
    }
    const gof = S().goodnessOfFit(groups.map(g => g.o), groups.map(g => g.e), o.cEstimated ? 1 : 0);
    if (impossible) { gof.impossible = impossible; gof.p = 0; gof.pG = 0; }
    return { expected: E, classes: CLASSES, obs, exp, pooled: groups, test: gof, cells: N, impossible };
  }

  /* a random cell under the model (for the lab picture), with a seeded generator */
  function simulateCell(formula, x, c, rnd) {
    const groups = parseFormula(formula), out = {};
    for (let b = 0; b < x; b++) groups.forEach(m => {
      const M = matchings(m), pl = M[Math.floor(rnd() * M.length)], pr = M[Math.floor(rnd() * M.length)];
      components(pl, pr).forEach(([kind, len]) => {
        const pres = [];
        for (let e = 0; e < len; e++) pres.push(rnd() < c ? 1 : 0);
        const cnt = {};
        if (kind === 'path') chainsOf(len + 1, pres, cnt);
        else if (pres.every(Boolean)) cnt['r' + len] = 1;
        else { const a = pres.indexOf(0), line = []; for (let t = 1; t < len; t++) line.push(pres[(a + t) % len]); chainsOf(len, line, cnt); }
        Object.keys(cnt).forEach(k => { out[k] = (out[k] || 0) + cnt[k]; });
      });
    });
    return out;
  }

  /* ---------------- tetrads and pollen ---------------- */
  /* Love (1951): meiotic index = normal tetrads / all tetrads × 100 */
  function meioticIndex(normal, total, conf) {
    const ci = S().wilson(normal, total, conf);
    return { MI: 100 * normal / total, lo: 100 * ci.lo, hi: 100 * ci.hi };
  }
  /* rows: [{ id, viable, inviable }] → per individual with both intervals, the
     pooled viability and the homogeneity of the individuals (chi-square and G) */
  function pollen(rows, conf) {
    const R = rows.filter(r => (+r.viable || 0) + (+r.inviable || 0) > 0).map(r => {
      const v = +r.viable || 0, n = v + (+r.inviable || 0);
      return { id: r.id, group: r.group, viable: v, n, p: v / n, wilson: S().wilson(v, n, conf), cp: S().clopperPearson(v, n, conf) };
    });
    const V = S().sum(R.map(r => r.viable)), N = S().sum(R.map(r => r.n));
    const test = R.length > 1 ? S().contingency(R.map(r => [r.viable, r.n - r.viable])) : null;
    return { rows: R, viable: V, n: N, p: N ? V / N : NaN, wilson: S().wilson(V, N, conf), cp: S().clopperPearson(V, N, conf), test };
  }

  /* abnormalities by phase: rows {phase, normal, ...categories} → percentages */
  const ABN = [
    { f: 'bridges', es: 'Puentes', en: 'Bridges' },
    { f: 'fragments', es: 'Fragmentos', en: 'Fragments' },
    { f: 'laggards', es: 'Rezagados', en: 'Laggards' },
    { f: 'precocious', es: 'Migración precoz', en: 'Precocious migration' },
    { f: 'spindles', es: 'Husos múltiples o anormales', en: 'Multiple or abnormal spindles' },
    { f: 'micronuclei', es: 'Micronúcleos', en: 'Micronuclei' },
    { f: 'other', es: 'Otras', en: 'Other' },
  ];
  const PHASES = [
    { k: 'MI', es: 'Metafase I', en: 'Metaphase I' }, { k: 'AI', es: 'Anafase I', en: 'Anaphase I' },
    { k: 'TI', es: 'Telofase I', en: 'Telophase I' }, { k: 'MII', es: 'Metafase II', en: 'Metaphase II' },
    { k: 'AII', es: 'Anafase II', en: 'Anaphase II' }, { k: 'TII', es: 'Telofase II', en: 'Telophase II' },
  ];
  function abnormalities(rows) {
    return PHASES.map(ph => {
      const rs = rows.filter(r => r.phase === ph.k);
      const normal = S().sum(rs.map(r => +r.normal || 0));
      const cats = {};
      ABN.forEach(a => { cats[a.f] = S().sum(rs.map(r => +r[a.f] || 0)); });
      const abn = S().sum(Object.values(cats));
      const total = normal + abn;
      return { phase: ph.k, normal, cats, abnormal: abn, total, pct: total ? 100 * abn / total : NaN };
    }).filter(r => r.total > 0);
  }

  window.Meiosis = {
    COLS, ABN, PHASES, cell, summarize, keyInfo, xtaOf,
    matchings, components, component, group, parseFormula, formulaFor, expected, estimateC, compare, simulateCell,
    meioticIndex, pollen, abnormalities, _dec: dec,
  };
})();
