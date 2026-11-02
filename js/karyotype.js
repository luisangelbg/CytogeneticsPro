/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — the karyotype engine (Karyo).

   From the measured arms of every chromosome of every cell it builds the
   karyotype of an accession: homologs grouped, groups averaged over cells,
   relative lengths, centromeric index, arm ratio, the class of each pair
   under a configurable scheme, the karyotype formula, the total length of the
   complement and the fundamental number.

   Conventions (written in the methods of Block 10):
   - s is the short arm and l the long arm; if the two were measured the other
     way round they are swapped, so s ≤ l always.
   - centromeric index CI = 100 s / (s + l); arm ratio r = l / s (∞ when s = 0).
   - relative length RL = 100 × length of the group / total length of one set
     (one chromosome per group: the haploid set of a diploid).
   - a satellite (the segment beyond a secondary constriction) is added to the
     arm that carries it unless `includeSat` is false.
   - a limit of a class belongs to the more median class: under Levan et al.
     (1964) r = 1.70 is m and r = 3.00 is sm. */
(function () {
  'use strict';
  const S = () => window.Stats;

  /* ---------------- classification schemes ----------------
     by: 'r' (arm ratio, classes in increasing r) or 'ci' (centromeric index,
     classes in decreasing CI). limits[i] closes class i; the last class is open.
     The limit itself belongs to the more median class unless upper = true
     (Guerra 1986 writes 1.00–1.49 m, 1.50–2.99 sm, ≥ 3.00 a). */
  const SCHEMES = {
    levan: {
      by: 'r', limits: [1.7, 3.0, 7.0], labels: ['m', 'sm', 'st', 't'],
      es: 'Levan et al. (1964), por la razón de brazos', en: 'Levan et al. (1964), by arm ratio', ref: 'Levan et al. 1964',
    },
    levanci: {
      by: 'ci', limits: [37.5, 25, 12.5], labels: ['m', 'sm', 'st', 't'],
      es: 'Levan et al. (1964), por el índice centromérico', en: 'Levan et al. (1964), by centromeric index', ref: 'Levan et al. 1964',
    },
    guerra: {
      by: 'r', limits: [1.5, 3.0], labels: ['m', 'sm', 'a'], upper: true,
      es: 'Guerra (1986): metacéntrico, submetacéntrico, acrocéntrico', en: 'Guerra (1986): metacentric, submetacentric, acrocentric', ref: 'Guerra 1986',
    },
  };
  const TYPE_NAMES = {
    M: ['metacéntrico en sentido estricto', 'metacentric sensu stricto'],
    m: ['metacéntrico', 'metacentric'], sm: ['submetacéntrico', 'submetacentric'],
    st: ['subtelocéntrico', 'subtelocentric'], a: ['acrocéntrico', 'acrocentric'],
    t: ['telocéntrico', 'telocentric'], T: ['telocéntrico en sentido estricto', 'telocentric sensu stricto'],
  };
  /* arms that count for the fundamental number (NF): m, sm = 2; st, a, t = 1
     unless the user counts subtelocentrics as two-armed */
  const ARMS = { M: 2, m: 2, sm: 2, st: 1, a: 1, t: 1, T: 1 };

  function scheme(s) {
    if (!s) return SCHEMES.levan;
    if (typeof s === 'string') return SCHEMES[s] || SCHEMES.levan;
    return s;           // a custom scheme object {by, limits, labels}
  }
  const armRatio = (s, l) => s > 0 ? l / s : Infinity;
  const centIndex = (s, l) => (s + l) > 0 ? 100 * s / (s + l) : NaN;

  /* the class of a chromosome with short arm s and long arm l */
  function classify(s, l, sch, opts) {
    const o = opts || {}, sc = scheme(sch);
    if (s > l) { const t = s; s = l; l = t; }
    if (!(s + l > 0)) return null;
    if (s === 0) return o.strict ? 'T' : 't';
    if (o.strict && Math.abs(s - l) <= 1e-12 * l) return 'M';
    const eps = 1e-12;
    if (sc.by === 'ci') {
      const ci = centIndex(s, l);
      for (let i = 0; i < sc.limits.length; i++) if (sc.upper ? ci > sc.limits[i] + eps : ci >= sc.limits[i] - eps) return sc.labels[i];
      return sc.labels[sc.labels.length - 1];
    }
    const r = armRatio(s, l);
    for (let i = 0; i < sc.limits.length; i++) if (sc.upper ? r < sc.limits[i] - eps : r <= sc.limits[i] + eps) return sc.labels[i];
    return sc.labels[sc.labels.length - 1];
  }

  /* one measured chromosome → its normalized description.
     ch: {p, q, sat?, satArm?: 'p'|'q'} in any unit (µm after calibration) */
  function normalize(ch, opts) {
    const o = opts || {};
    let s = +ch.p || 0, l = +ch.q || 0;
    const sat = +ch.sat > 0 ? +ch.sat : 0;
    let satArm = ch.satArm === 'q' ? 'l' : 's';
    if (sat && o.includeSat !== false) { if (satArm === 's') s += sat; else l += sat; }
    let swapped = false;
    if (s > l) { const t = s; s = l; l = t; swapped = true; satArm = satArm === 's' ? 'l' : 's'; }
    const c = s + l;
    return { s, l, c, ci: centIndex(s, l), r: armRatio(s, l), sat, satArm: sat ? satArm : null, swapped, src: ch };
  }

  /* ---------------- grouping homologs inside one cell ----------------
     Chromosomes are sorted by length and cut into consecutive groups of k (2
     for homologous pairs; the ploidy level for groups of homologs of an
     autopolyploid); then swaps between groups are tried while they lower the
     total within-group dissimilarity: the squared difference in length (as a
     percentage of the mean length of the cell) plus the squared difference in
     centromeric index (in points), plus a penalty when a chromosome with a
     satellite is grouped with one without. Fixed scales on purpose: dividing
     by the spread of the cell would make two nearly identical centromeric
     indices look far apart when all the chromosomes are alike. A local optimum, not a proof: the
     manual correction of Block 3 has the last word. */
  function dissim(a, b, w) {
    const dc = (a.c - b.c) / w.sc, di = (a.ci - b.ci) / w.si;
    return dc * dc + w.wci * di * di + ((!!a.sat) !== (!!b.sat) ? w.wsat : 0);
  }
  function groupCell(chrs, opts) {
    const o = Object.assign({ k: 2, wci: 1, wsat: 25 }, opts || {});
    const n = chrs.length, k = Math.max(1, o.k | 0);
    if (!n) return [];
    const w = { sc: (S().mean(chrs.map(x => x.c)) || 1) / 100, si: 1, wci: o.wci, wsat: o.wsat };
    const order = chrs.map((x, i) => i).sort((a, b) => chrs[b].c - chrs[a].c || chrs[b].ci - chrs[a].ci);
    const groups = [];
    for (let i = 0; i < n; i += k) groups.push(order.slice(i, i + k));
    const gcost = g => { let s = 0; for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) s += dissim(chrs[g[i]], chrs[g[j]], w); return s; };
    if (k > 1 && groups.length > 1) {
      let improved = true, guard = 0;
      while (improved && guard++ < 200) {
        improved = false;
        for (let a = 0; a < groups.length; a++) for (let b = a + 1; b < groups.length; b++) {
          const ga = groups[a], gb = groups[b];
          for (let i = 0; i < ga.length; i++) for (let j = 0; j < gb.length; j++) {
            const before = gcost(ga) + gcost(gb);
            const t = ga[i]; ga[i] = gb[j]; gb[j] = t;
            if (gcost(ga) + gcost(gb) < before - 1e-12) improved = true;
            else { gb[j] = ga[i]; ga[i] = t; }
          }
        }
      }
    }
    return sortGroups(groups, chrs);
  }
  /* groups from the longest to the shortest (mean length), ties by CI */
  function sortGroups(groups, chrs) {
    const m = g => S().mean(g.map(i => chrs[i].c)), mi = g => S().mean(g.map(i => chrs[i].ci));
    return groups.map(g => g.slice().sort((a, b) => chrs[b].c - chrs[a].c))
      .sort((a, b) => m(b) - m(a) || mi(b) - mi(a));
  }

  /* ---------------- the karyotype of an accession ----------------
     cells: [{ id, chromosomes: [{id, p, q, sat?, satArm?}], groups?: [[chromosome ids]] }]
     A cell that carries `groups` (the manual correction) keeps them; the
     others are grouped automatically. Group j of every cell is the j-th
     longest of that cell; the karyotype averages group j over the cells. */
  function build(cells, opts) {
    const o = Object.assign({ k: 2, scheme: 'levan', includeSat: true, strict: false, stArms: 1, pop: false, order: 'length' }, opts || {});
    const sc = scheme(o.scheme);
    const perCell = [];
    cells.forEach(cell => {
      const chrs = (cell.chromosomes || []).filter(ch => (+ch.p || 0) + (+ch.q || 0) > 0).map(ch => normalize(ch, o));
      if (!chrs.length) return;
      let groups;
      if (cell.groups && cell.groups.length) {
        const byId = new Map(chrs.map((x, i) => [String(x.src.id), i]));
        groups = cell.groups.map(g => g.map(id => byId.get(String(id))).filter(i => i != null)).filter(g => g.length);
        const used = new Set(groups.flat());
        const rest = chrs.map((x, i) => i).filter(i => !used.has(i));
        rest.forEach(i => groups.push([i]));
        if (!o.keepOrder) groups = sortGroups(groups, chrs);
      } else groups = groupCell(chrs, o);
      const gStats = groups.map(g => {
        const mem = g.map(i => chrs[i]);
        const s = S().mean(mem.map(x => x.s)), l = S().mean(mem.map(x => x.l));
        return { idx: g, ids: mem.map(x => x.src.id), s, l, c: s + l, sat: mem.some(x => x.sat > 0), size: g.length,
          homolog: mem.map(x => ({ id: x.src.id, s: x.s, l: x.l, c: x.c, ci: x.ci, r: x.r, sat: x.sat, satArm: x.satArm })) };
      });
      const total = S().sum(gStats.map(g => g.c));
      gStats.forEach(g => { g.rl = 100 * g.c / total; g.ci = centIndex(g.s, g.l); g.r = armRatio(g.s, g.l); });
      perCell.push({ id: cell.id, n2: chrs.length, groups: gStats, total, tcl: S().sum(chrs.map(x => x.c)) });
    });
    if (!perCell.length) return null;
    if (!o.keepOrder && perCell.length > 1) alignCells(perCell, o);
    const nG = Math.max(...perCell.map(c => c.groups.length));
    const pairs = [];
    for (let j = 0; j < nG; j++) {
      const rows = perCell.map(c => c.groups[j]).filter(Boolean);
      const col = f => rows.map(f);
      const ms = (f) => { const a = col(f).filter(v => isFinite(v)); return { mean: S().mean(a), sd: S().sd(a, o.pop) }; };
      const s = ms(g => g.s), l = ms(g => g.l), c = ms(g => g.c), rl = ms(g => g.rl), ci = ms(g => g.ci), r = ms(g => g.r);
      const satShare = rows.filter(g => g.sat).length / rows.length;
      const satArms = rows.flatMap(g => g.homolog.filter(h => h.sat).map(h => h.satArm));
      const satArm = satArms.filter(a => a === 'l').length > satArms.length / 2 ? 'l' : 's';
      const satLen = S().mean(rows.flatMap(g => g.homolog.filter(h => h.sat).map(h => h.sat)));
      const size = Math.round(S().median(col(g => g.size)));
      const type = classify(s.mean, l.mean, sc, o);
      pairs.push({
        j, n: rows.length, size, s, l, c, rl, ci, r,
        ciMean: centIndex(s.mean, l.mean), rMean: armRatio(s.mean, l.mean),
        type, sat: satShare >= 0.5, satShare, satArm, satLen: isFinite(satLen) ? satLen : 0,
        ids: rows.map(g => g.ids),
      });
    }
    return finish({ pairs, cells: perCell, k: o.k, scheme: sc, opts: o });
  }

  /* ---------------- the same pair in every cell ----------------
     Numbering the groups of each cell by length alone mixes two pairs of
     almost the same length but different centromere (a slightly more
     condensed cell swaps their order). Each cell is matched instead to the
     pairs of a reference (the cell with most groups) by the optimal assignment
     (Hungarian method) of a cost in relative length (percentage points) and
     centromeric index (points, weighted 0.04: 5 points weigh as one point of
     relative length) plus a penalty when one has a satellite and the other
     not; the reference is then replaced by the means and the matching is
     repeated. The pairs end up numbered by their mean length. */
  function hungarian(C) {
    const n = C.length, INF = 1e18;
    const u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0), p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      p[0] = i;
      let j0 = 0;
      const minv = new Array(n + 1).fill(INF), used = new Array(n + 1).fill(false);
      do {
        used[j0] = true;
        const i0 = p[j0];
        let delta = INF, j1 = 0;
        for (let j = 1; j <= n; j++) if (!used[j]) {
          const cur = C[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (let j = 0; j <= n; j++) {
          if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
        }
        j0 = j1;
      } while (p[j0] !== 0);
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }
    const ans = new Array(n);
    for (let j = 1; j <= n; j++) if (p[j]) ans[p[j] - 1] = j - 1;
    return ans;                   // ans[row] = column
  }
  function alignCells(perCell, o) {
    const w = o.wAlign != null ? o.wAlign : 0.04;
    const ref0 = perCell.reduce((a, c) => (c.groups.length > a.groups.length ? c : a), perCell[0]);
    let slots = ref0.groups.map(g => ({ rl: g.rl, ci: g.ci, sat: g.sat ? 1 : 0 }));
    const cost = (g, s) => (g.rl - s.rl) ** 2 + w * (g.ci - s.ci) ** 2 + ((g.sat ? 1 : 0) !== (s.sat >= 0.5 ? 1 : 0) ? 4 : 0);
    let assign = null;
    for (let it = 0; it < 3; it++) {
      const n = Math.max(slots.length, ...perCell.map(c => c.groups.length));
      assign = perCell.map(c => {
        const M = [];
        for (let i = 0; i < n; i++) {
          const row = [];
          for (let j = 0; j < n; j++) row.push(i < c.groups.length && j < slots.length ? cost(c.groups[i], slots[j]) : (i < c.groups.length ? 1e6 : 0));
          M.push(row);
        }
        return hungarian(M).slice(0, c.groups.length);
      });
      const nS = n;
      const acc = Array.from({ length: nS }, () => ({ rl: 0, ci: 0, sat: 0, k: 0 }));
      perCell.forEach((c, ci) => c.groups.forEach((g, gi) => { const s = acc[assign[ci][gi]]; s.rl += g.rl; s.ci += g.ci; s.sat += g.sat ? 1 : 0; s.k++; }));
      slots = acc.map(s => s.k ? { rl: s.rl / s.k, ci: s.ci / s.k, sat: s.sat / s.k, k: s.k } : { rl: 0, ci: 0, sat: 0, k: 0 });
    }
    /* slots by mean length (relative length is what is comparable among cells), ties by centromeric index */
    const order = slots.map((s, j) => j).filter(j => slots[j].k).sort((a, b) => slots[b].rl - slots[a].rl || slots[b].ci - slots[a].ci);
    const pos = new Map(order.map((j, r) => [j, r]));
    perCell.forEach((c, ci) => {
      const g = new Array(order.length);
      c.groups.forEach((grp, gi) => { g[pos.get(assign[ci][gi])] = grp; });
      c.groups = g;
    });
  }

  /* totals, formula and order of a karyotype (also used after a manual edit) */
  function finish(K) {
    const o = K.opts, P = K.pairs;
    const thl = S().sum(P.map(p => p.c.mean));
    P.forEach(p => { p.rlMean = 100 * p.c.mean / thl; });
    const n2 = S().median(K.cells.map(c => c.n2));
    K.n2 = n2;
    K.thl = thl;                                         // one chromosome per group
    K.tcl = { mean: S().mean(K.cells.map(c => c.tcl)), sd: S().sd(K.cells.map(c => c.tcl), o.pop) };
    K.nf = S().sum(P.map(p => p.size * (p.type === 'st' && o.stArms === 2 ? 2 : (ARMS[p.type] || 2))));
    const lens = P.map(p => p.c.mean);
    K.ratioLS = Math.max(...lens) / Math.min(...lens);
    K.counts = countTypes(P, o);
    K.formula = formula(K, o);
    K.order = orderPairs(P, o.order, K.scheme);
    return K;
  }
  function countTypes(P, o) {
    const out = {};
    P.forEach(p => {
      const key = p.type + (p.sat && o.satInFormula !== false ? '-sat' : '');
      out[key] = (out[key] || 0) + p.size;
    });
    return out;
  }
  /* "2n = 2x = 20 = 14m + 6sm"; x and the ploidy only when the base number is known */
  function formula(K, o) {
    const sc = K.scheme;
    const rank = t => { const b = t.replace('-sat', ''); const i = ['M'].concat(sc.labels, ['T']).indexOf(b); return (i < 0 ? 99 : i) * 2 + (t.endsWith('-sat') ? 1 : 0); };
    const parts = Object.keys(K.counts).sort((a, b) => rank(a) - rank(b)).map(t => K.counts[t] + t);
    let head = '2n = ';
    const n2 = Math.round(K.n2);
    if (o.x > 0 && n2 % o.x === 0) head += (n2 / o.x) + 'x = ';
    else if (o.x > 0) head += ploidyText(n2, o.x) + ' = ';
    return head + n2 + ' = ' + parts.join(' + ');
  }
  /* 2x + 1, 4x − 2…: the nearest euploid level and the difference */
  function ploidyText(n2, x) {
    const lv = Math.max(1, Math.round(n2 / x)), d = n2 - lv * x;
    return lv + 'x' + (d ? (d > 0 ? ' + ' + d : ' − ' + (-d)) : '');
  }
  /* idiogram order: by length (as numbered) or by type, then length */
  function orderPairs(P, how, sc) {
    const idx = P.map((p, i) => i);
    if (how === 'type') {
      const rank = t => { const i = ['M'].concat(sc.labels, ['T']).indexOf(t); return i < 0 ? 99 : i; };
      idx.sort((a, b) => rank(P[a].type) - rank(P[b].type) || P[b].c.mean - P[a].c.mean);
    }
    return idx;
  }

  /* a karyotype from pair means typed directly (Block 2 without cells, the
     labs, the comparison of published karyotypes): one "cell" whose groups
     are the given pairs */
  function fromPairs(list, opts) {
    const cell = { id: 'manual', chromosomes: [], groups: [] };
    list.forEach((p, i) => {
      const k = (opts && opts.k) || 2;
      const g = [];
      for (let h = 0; h < k; h++) { const id = i + '.' + h; cell.chromosomes.push({ id, p: p.s != null ? p.s : p.p, q: p.l != null ? p.l : p.q, sat: p.sat, satArm: p.satArm }); g.push(id); }
      cell.groups.push(g);
    });
    return build([cell], opts);
  }

  window.Karyo = { _hungarian: hungarian, SCHEMES, TYPE_NAMES, ARMS, scheme, classify, normalize, groupCell, build, finish, formula, ploidyText, armRatio, centIndex, fromPairs, orderPairs };
})();
