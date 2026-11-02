/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — comparison among taxa (Compare).
   - Newick: reading and writing trees.
   - A matrix of karyological parameters: standardized, distances (Euclidean
     on standardized values, or Gower), hierarchical clustering by UPGMA or
     Ward (Lance–Williams updates; heights as the merge distance, Ward on
     squared distances with the square root as height), cophenetic correlation,
     and principal components of the correlation matrix (cyclic Jacobi).
   - Chromosome number evolution by parsimony (Sankoff 1975): states are
     haploid numbers; an event changes a number by +1 (ascending dysploidy),
     −1 (descending dysploidy), ×2 (polyploidy, duplication) or ×1.5
     (demiploidy), each with its cost (the kinds of event follow Mayrose et al.
     2010). The cost between two numbers is the cheapest sequence of events;
     every node gets the set of its optimal numbers (most parsimonious
     reconstructions) and one optimal history is spelled out branch by branch. */
(function () {
  'use strict';
  const S = () => window.Stats;
  const INF = 1e18;

  /* ---------------- Newick ---------------- */
  function parseNewick(str) {
    let s = String(str || '').trim();
    s = s.replace(/\[[^\]]*\]/g, '');           // comments
    const semi = s.indexOf(';');
    if (semi >= 0) s = s.slice(0, semi);
    let i = 0;
    const node = () => ({ name: '', len: null, children: [] });
    function label() {
      let out = '';
      if (s[i] === "'") { i++; while (i < s.length && s[i] !== "'") out += s[i++]; i++; return out; }
      while (i < s.length && !'(),:;'.includes(s[i])) out += s[i++];
      return out.trim();
    }
    function sub() {
      const n = node();
      if (s[i] === '(') {
        i++;
        n.children.push(sub());
        while (s[i] === ',') { i++; n.children.push(sub()); }
        if (s[i] !== ')') throw new Error(T('Falta un paréntesis de cierre en el Newick.', 'A closing parenthesis is missing in the Newick.'));
        i++;
      }
      n.name = label();
      if (s[i] === ':') { i++; let v = ''; while (i < s.length && !'(),;'.includes(s[i])) v += s[i++]; n.len = parseFloat(v); if (!isFinite(n.len)) n.len = null; }
      return n;
    }
    if (!s) throw new Error(T('El Newick está vacío.', 'The Newick is empty.'));
    const root = sub();
    if (i < s.length && s.slice(i).trim()) throw new Error(T('Sobra texto al final del Newick.', 'There is extra text at the end of the Newick.'));
    return root;
  }
  function writeNewick(n, opts) {
    const o = opts || {};
    const q = x => /[\s(),:;']/.test(x) ? "'" + x.replace(/'/g, '') + "'" : x;
    const w = m => (m.children.length ? '(' + m.children.map(w).join(',') + ')' : '') + q(m.name || '') + (m.len != null && !o.noLengths ? ':' + (+m.len.toPrecision(8)) : '');
    return w(n) + ';';
  }
  function postorder(n, out) { out = out || []; n.children.forEach(c => postorder(c, out)); out.push(n); return out; }
  const tipsOf = n => postorder(n).filter(m => !m.children.length);
  const normName = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[_\s.]+/g, ' ').trim();

  /* ---------------- matrix ---------------- */
  function standardize(X) {
    const p = X[0] ? X[0].length : 0, mu = [], sd = [];
    for (let k = 0; k < p; k++) {
      const v = X.map(r => r[k]).filter(isFinite);
      mu.push(S().mean(v)); sd.push(v.length > 1 ? S().sd(v) : NaN);
    }
    return { Z: X.map(r => r.map((v, k) => isFinite(v) && sd[k] > 0 ? (v - mu[k]) / sd[k] : (isFinite(v) && sd[k] === 0 ? 0 : NaN))), mu, sd };
  }
  /* Euclidean distance over the variables both rows have, rescaled to all variables */
  function euclid(Z) {
    const n = Z.length, p = n ? Z[0].length : 0;
    const D = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let s = 0, c = 0;
      for (let k = 0; k < p; k++) if (isFinite(Z[i][k]) && isFinite(Z[j][k])) { s += (Z[i][k] - Z[j][k]) ** 2; c++; }
      D[i][j] = D[j][i] = c ? Math.sqrt(s * p / c) : NaN;
    }
    return D;
  }
  /* agglomerative clustering; returns the merges and a tree with heights */
  function cluster(D, method) {
    const n = D.length;
    const ward = method === 'ward';
    const d = D.map(r => r.map(v => ward ? v * v : v));
    let act = Array.from({ length: n }, (_, i) => ({ id: i, size: 1, node: { leaf: i, h: 0, children: [] } }));
    const merges = [];
    while (act.length > 1) {
      let bi = 0, bj = 1, best = Infinity;
      for (let a = 0; a < act.length; a++) for (let b = a + 1; b < act.length; b++) {
        const v = d[act[a].id][act[b].id];
        if (v < best - 1e-12) { best = v; bi = a; bj = b; }
      }
      const A = act[bi], B = act[bj], h = ward ? Math.sqrt(Math.max(0, best)) : best;
      const id = d.length;
      d.forEach(r => r.push(0)); d.push(new Array(d.length + 1).fill(0));
      act.forEach(K => {
        if (K === A || K === B) return;
        let v;
        if (ward) v = ((A.size + K.size) * d[K.id][A.id] + (B.size + K.size) * d[K.id][B.id] - K.size * d[A.id][B.id]) / (A.size + B.size + K.size);
        else v = (A.size * d[K.id][A.id] + B.size * d[K.id][B.id]) / (A.size + B.size);
        d[K.id][id] = d[id][K.id] = v;
      });
      const node = { h, children: [A.node, B.node], size: A.size + B.size };
      merges.push({ a: A.id, b: B.id, h, size: A.size + B.size });
      act = act.filter(K => K !== A && K !== B).concat([{ id, size: A.size + B.size, node }]);
    }
    return { merges, tree: act[0].node };
  }
  function leavesOf(t) { return t.children.length ? t.children.flatMap(leavesOf) : [t.leaf]; }
  function cophenetic(tree, n) {
    const C = Array.from({ length: n }, () => new Array(n).fill(0));
    (function walk(t) {
      if (!t.children.length) return;
      t.children.forEach(walk);
      const [L, R] = t.children.map(leavesOf);
      L.forEach(a => R.forEach(b => { C[a][b] = C[b][a] = t.h; }));
    })(tree);
    return C;
  }
  function upperCorr(A, B) {
    const x = [], y = [];
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) if (isFinite(A[i][j]) && isFinite(B[i][j])) { x.push(A[i][j]); y.push(B[i][j]); }
    const mx = S().mean(x), my = S().mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    x.forEach((v, k) => { sxy += (v - mx) * (y[k] - my); sxx += (v - mx) ** 2; syy += (y[k] - my) ** 2; });
    return sxy / Math.sqrt(sxx * syy);
  }
  function clusterNewick(tree, labels) {
    const w = t => t.children.length ? '(' + t.children.map(c => w(c) + ':' + (+(t.h - c.h).toPrecision(8))).join(',') + ')' : labels[t.leaf].replace(/[\s(),:;']/g, '_');
    return w(tree) + ';';
  }

  /* eigen-decomposition of a symmetric matrix (cyclic Jacobi) */
  function jacobi(Ain) {
    const n = Ain.length, A = Ain.map(r => r.slice()), V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 100; sweep++) {
      let off = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
      if (off < 1e-24) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    const idx = A.map((r, i) => i).sort((a, b) => A[b][b] - A[a][a]);
    return { values: idx.map(i => A[i][i]), vectors: idx.map(i => V.map(r => r[i])) };
  }
  /* PCA of the correlation matrix; missing values are put at the mean (0 in z) */
  function pca(X) {
    const { Z } = standardize(X);
    const Zf = Z.map(r => r.map(v => (isFinite(v) ? v : 0)));
    const n = Zf.length, p = n ? Zf[0].length : 0;
    const R = Array.from({ length: p }, (_, a) => Array.from({ length: p }, (_, b) => { let s = 0; for (let i = 0; i < n; i++) s += Zf[i][a] * Zf[i][b]; return s / (n - 1); }));
    const E = jacobi(R);
    /* sign: the largest loading of each component is positive (a convention) */
    E.vectors = E.vectors.map(v => { let m = 0; v.forEach((x, k) => { if (Math.abs(x) > Math.abs(v[m])) m = k; }); return v[m] < 0 ? v.map(x => -x) : v; });
    const tot = E.values.reduce((a, b) => a + Math.max(0, b), 0);
    const scores = Zf.map(r => E.vectors.map(v => r.reduce((s, x, k) => s + x * v[k], 0)));
    const loadings = E.vectors.map((v, c) => v.map(x => x * Math.sqrt(Math.max(0, E.values[c]))));
    return { values: E.values, vectors: E.vectors, explained: E.values.map(v => Math.max(0, v) / tot), scores, loadings, missing: Z.some(r => r.some(v => !isFinite(v))) };
  }

  /* ---------------- chromosome number parsimony ---------------- */
  const EVENTS = ['gain', 'loss', 'dup', 'demi'];
  function costMatrix(lo, hi, costs) {
    const n = hi - lo + 1, c = Object.assign({ gain: 1, loss: 1, dup: 1, demi: 1.5 }, costs || {});
    const D = Array.from({ length: n }, () => new Array(n).fill(INF)), nxt = Array.from({ length: n }, () => new Array(n).fill(-1)), how = Array.from({ length: n }, () => new Array(n).fill(null));
    for (let i = 0; i < n; i++) D[i][i] = 0;
    const edge = (a, b, w, kind) => { const i = a - lo, j = b - lo; if (j < 0 || j >= n || i === j || !(w >= 0) || !isFinite(w)) return; if (w < D[i][j]) { D[i][j] = w; nxt[i][j] = j; how[i][j] = kind; } };
    for (let s = lo; s <= hi; s++) {
      edge(s, s + 1, c.gain, 'gain'); edge(s, s - 1, c.loss, 'loss'); edge(s, 2 * s, c.dup, 'dup');
      edge(s, Math.floor(1.5 * s), c.demi, 'demi'); edge(s, Math.ceil(1.5 * s), c.demi, 'demi');
    }
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) { const dik = D[i][k]; if (dik >= INF) continue; for (let j = 0; j < n; j++) { const v = dik + D[k][j]; if (v < D[i][j] - 1e-12) { D[i][j] = v; nxt[i][j] = nxt[i][k]; } } }
    /* the events of the cheapest path from a to b */
    const path = (a, b) => {
      const ev = []; let i = a - lo; const j = b - lo;
      if (D[i][j] >= INF) return null;
      let guard = 0;
      while (i !== j && guard++ < 400) { const k = nxt[i][j]; ev.push({ from: i + lo, to: k + lo, kind: how[i][k] || kindOf(i + lo, k + lo) }); i = k; }
      return ev;
    };
    function kindOf(a, b) { return b === a + 1 ? 'gain' : b === a - 1 ? 'loss' : b === 2 * a ? 'dup' : 'demi'; }
    return { D, lo, hi, n, path, costs: c };
  }
  /* root: a parsed Newick; tipStates: Map from tip label to an array of
     haploid numbers (empty or missing = unknown) */
  function numberParsimony(root, tipStates, costs, opts) {
    const o = opts || {};
    const tips = tipsOf(root);
    const known = tips.flatMap(t => tipStates.get(t.name) || []);
    if (!known.length) throw new Error(T('Ninguna punta del árbol tiene número.', 'No tip of the tree has a number.'));
    const lo = Math.max(1, Math.min(...known) - (o.below != null ? o.below : 3)), hi = Math.max(...known) * 2 + 2;
    const M = costMatrix(lo, hi, costs), n = M.n;
    const nodes = postorder(root);
    nodes.forEach((v, k) => { v._k = k; });
    const inside = new Map();
    const minThrough = (cv) => { /* for each parent state s: min_t C(s,t) + cv[t] */
      const out = new Array(n).fill(INF);
      for (let s = 0; s < n; s++) { let m = INF; for (let t = 0; t < n; t++) { const v = M.D[s][t] + cv[t]; if (v < m) m = v; } out[s] = m; }
      return out;
    };
    const through = new Map();
    nodes.forEach(v => {
      let cv;
      if (!v.children.length) {
        const st = tipStates.get(v.name) || [];
        cv = new Array(n).fill(st.length ? INF : 0);
        st.forEach(s => { if (s >= lo && s <= hi) cv[s - lo] = 0; });
      } else {
        cv = new Array(n).fill(0);
        v.children.forEach(c => { const m = through.get(c); for (let s = 0; s < n; s++) cv[s] += m[s]; });
      }
      inside.set(v, cv);
      through.set(v, minThrough(cv));
    });
    const rc = inside.get(root);
    const best = Math.min(...rc);
    /* outside costs, from the root down */
    const outside = new Map([[root, new Array(n).fill(0)]]);
    const pre = nodes.slice().reverse();
    pre.forEach(v => {
      if (!v.children.length) return;
      const ov = outside.get(v);
      v.children.forEach(c => {
        const others = new Array(n).fill(0);
        v.children.forEach(c2 => { if (c2 === c) return; const m = through.get(c2); for (let s = 0; s < n; s++) others[s] += m[s]; });
        const oc = new Array(n).fill(INF);
        for (let t = 0; t < n; t++) { let m = INF; for (let s = 0; s < n; s++) { const val = ov[s] + others[s] + M.D[s][t]; if (val < m) m = val; } oc[t] = m; }
        outside.set(c, oc);
      });
    });
    /* the optimal numbers of every node */
    nodes.forEach(v => {
      const iv = inside.get(v), ov = outside.get(v);
      v.mpr = [];
      for (let s = 0; s < n; s++) if (Math.abs(iv[s] + ov[s] - best) < 1e-9) v.mpr.push(s + lo);
    });
    /* one optimal history: at the root the smallest optimal number; below,
       the child number that keeps the optimum, preferring no change */
    const assign = (v, s) => {
      v.state = s;
      v.children.forEach(c => {
        const ic = inside.get(c);
        let bt = -1, bv = INF;
        const pref = c.mpr.includes(s) ? [s - lo] : [];
        const order = pref.concat([...Array(n).keys()].filter(t => t !== s - lo));
        order.forEach(t => { const val = M.D[s - lo][t] + ic[t]; if (val < bv - 1e-9) { bv = val; bt = t; } });
        c.events = M.path(s, bt + lo) || [];
        c.branchCost = M.D[s - lo][bt];
        assign(c, bt + lo);
      });
    };
    const rootState = rc.indexOf(best) + lo;
    root.events = [];
    assign(root, rootState);
    const totals = { gain: 0, loss: 0, dup: 0, demi: 0 };
    nodes.forEach(v => (v.events || []).forEach(e => { totals[e.kind]++; }));
    return { root, cost: best, lo, hi, costs: M.costs, totals, nodes, tips, ambiguous: nodes.filter(v => v.children.length && v.mpr.length > 1).length };
  }

  /* ---------------- drawings ---------------- */
  const r1 = v => Math.round(v * 10) / 10;
  const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  /* a dendrogram of a clustering, leaves at the right, heights on the axis */
  function dendrogramSvg(tree, labels, opts) {
    const o = Object.assign({ font: 12, title: '', xlab: '' }, opts || {});
    const leaves = leavesOf(tree), n = leaves.length;
    const labW = Math.max(...labels.map(l => l.length)) * o.font * 0.6 + 16;
    const W = o.width || 640, rowH = o.font + 12, top = o.title ? 34 : 14, H = top + n * rowH + 44;
    const x0 = 20, x1 = W - labW - 10, hmax = tree.h || 1;
    const X = h => x1 - (h / hmax) * (x1 - x0);
    const yOf = new Map(); leaves.forEach((l, i) => yOf.set(l, top + i * rowH + rowH / 2));
    let g = '';
    const walk = t => {
      if (!t.children.length) return yOf.get(t.leaf);
      const ys = t.children.map(walk), y = (Math.min(...ys) + Math.max(...ys)) / 2;
      t.children.forEach((c, k) => { g += `<path class="tr" d="M${r1(X(t.h))} ${r1(ys[k])}H${r1(X(c.h))}"/>`; });
      g += `<path class="tr" d="M${r1(X(t.h))} ${r1(Math.min(...ys))}V${r1(Math.max(...ys))}"/>`;
      return y;
    };
    walk(tree);
    leaves.forEach((l, i) => { g += `<text class="txt" x="${r1(x1 + 6)}" y="${r1(yOf.get(l) + 4)}" font-size="${o.font}">${e(labels[l])}</text>`; });
    const Tk = Chart.ticks(0, hmax, 5);
    const yA = top + n * rowH + 6;
    g += `<line class="ax" data-role="axis" x1="${x0}" x2="${x1}" y1="${yA}" y2="${yA}"/>`;
    Tk.ticks.forEach(t => { if (t > hmax + 1e-9) return; g += `<line class="ax" x1="${r1(X(t))}" x2="${r1(X(t))}" y1="${yA}" y2="${yA + 4}"/><text class="tick" data-role="xtick" x="${r1(X(t))}" y="${yA + 16}" font-size="${o.font - 1}" text-anchor="middle">${+t.toFixed(6)}</text>`; });
    if (o.xlab) g += `<text class="flab" data-role="xlab" x="${r1((x0 + x1) / 2)}" y="${H - 6}" font-size="${o.font}" text-anchor="middle">${e(o.xlab)}</text>`;
    const title = o.title ? `<text class="ttl" x="${x0}" y="20" font-size="${o.font + 2}">${e(o.title)}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" class="fig" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${e(o.aria || o.title || 'Dendrograma')}">${title}${g}</svg>`;
  }
  const EV_MARK = { gain: '+1', loss: '−1', dup: '×2', demi: '×1.5' };
  /* the tree with the reconstructed numbers at the nodes and the events on the branches */
  function numberTreeSvg(R, opts) {
    const o = Object.assign({ font: 12, title: '', show: 'n' }, opts || {});
    const tips = R.tips, n = tips.length, rowH = o.font + 16, top = o.title ? 40 : 20;
    const depth = new Map(); let maxD = 0;
    (function walk(v, d) { depth.set(v, d); maxD = Math.max(maxD, d); v.children.forEach(c => walk(c, d + 1)); })(R.root, 0);
    const labW = Math.max(...tips.map(t => (t.name || '').length + 6)) * o.font * 0.58 + 20;
    const W = o.width || Math.max(560, 120 + maxD * 70 + labW), x0 = 30, x1 = W - labW;
    const X = v => x0 + (v.children.length ? depth.get(v) : maxD) / Math.max(1, maxD) * (x1 - x0);
    const yOf = new Map(); tips.forEach((t, i) => yOf.set(t, top + i * rowH + rowH / 2));
    const H = top + n * rowH + 30;
    const val = s => o.show === '2n' ? 2 * s : s;
    let g = '', labs = '';
    const walk = v => {
      if (!v.children.length) return yOf.get(v);
      const ys = v.children.map(walk), y = (Math.min(...ys) + Math.max(...ys)) / 2;
      yOf.set(v, y);
      g += `<path class="tr" d="M${r1(X(v))} ${r1(Math.min(...ys))}V${r1(Math.max(...ys))}"/>`;
      v.children.forEach((c, k) => {
        g += `<path class="tr${(c.events || []).length ? ' ev' : ''}" d="M${r1(X(v))} ${r1(ys[k])}H${r1(X(c))}"/>`;
        if ((c.events || []).length) {
          const t = c.events.map(ev => EV_MARK[ev.kind]).join(' ');
          labs += `<text class="evlab" x="${r1((X(v) + X(c)) / 2)}" y="${r1(ys[k] - 5)}" font-size="${o.font - 1}" text-anchor="middle">${e(t)}</text>`;
        }
      });
      return y;
    };
    walk(R.root);
    R.nodes.forEach(v => {
      const x = X(v), y = yOf.get(v);
      if (v.children.length) {
        const amb = v.mpr.length > 1;
        g += `<circle class="nd${amb ? ' amb' : ''}" cx="${r1(x)}" cy="${r1(y)}" r="${o.font * 0.95}"/>` +
          `<text class="ndt" x="${r1(x)}" y="${r1(y + 4)}" font-size="${o.font - 1}" text-anchor="middle">${val(v.state)}</text>`;
        if (amb) labs += `<text class="mut" x="${r1(x)}" y="${r1(y + o.font + 12)}" font-size="${o.font - 3}" text-anchor="middle">${e(v.mpr.map(val).join('/'))}</text>`;
      } else {
        g += `<text class="txt tipn" x="${r1(x + 8)}" y="${r1(y + 4)}" font-size="${o.font}"><tspan font-style="italic">${e((v.name || '').replace(/_/g, ' '))}</tspan><tspan class="mut"> · ${o.show === '2n' ? '2n' : 'n'} = ${v.mpr.length ? v.mpr.map(val).join('/') : '?'}</tspan></text>`;
      }
    });
    const title = o.title ? `<text class="ttl" x="${x0}" y="22" font-size="${o.font + 2}">${e(o.title)}</text>` : '';
    const leg = `<text class="mut" x="${x0}" y="${H - 8}" font-size="${o.font - 1}">${e(T('+1 / −1: disploidía ascendente / descendente · ×2: poliploidía · ×1.5: demiploidía', '+1 / −1: ascending / descending dysploidy · ×2: polyploidy · ×1.5: demiploidy'))}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="fig ntree" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${e(o.aria || o.title || '')}">${title}${g}${labs}${leg}</svg>`;
  }
  /* a map of points on longitude and latitude, with a grid and an optional outline */
  function mapSvg(points, opts) {
    const o = Object.assign({ font: 12, width: 640, height: 420, outline: null, title: '' }, opts || {});
    const P = points.filter(p => isFinite(p.lat) && isFinite(p.lon));
    if (!P.length) return '';
    let [a, b] = [Math.min(...P.map(p => p.lon)), Math.max(...P.map(p => p.lon))], [c, d] = [Math.min(...P.map(p => p.lat)), Math.max(...P.map(p => p.lat))];
    const padX = Math.max(0.5, (b - a) * 0.15), padY = Math.max(0.5, (d - c) * 0.15);
    a -= padX; b += padX; c -= padY; d += padY;
    const legendW = o.legend ? 18 + Math.max(...o.legend.map(l => String(l.label).length)) * o.font * 0.58 + 14 : 0;
    const L = 56, Tp = o.title ? 34 : 14, Rr = 16 + legendW, B = 40, W = o.width + legendW, w = W - L - Rr;
    /* equirectangular, with the aspect of the mean latitude; the drawing is as
       tall as the area needs (a flat area gives a low map), never less than
       the legend */
    const k = Math.cos(((c + d) / 2) * Math.PI / 180);
    const sx = w / ((b - a) * k), sy = (o.height - Tp - B) / (d - c), s = Math.min(sx, sy);
    const legH = o.legend ? o.legend.length * (o.font + 7) + 16 : 0;
    const H = Math.ceil(Math.max(Tp + B + (d - c) * s, Tp + legH, 160)), h = H - Tp - B;
    const ox = L + (w - (b - a) * k * s) / 2, oy = Tp + (h - (d - c) * s) / 2;
    const X = lon => ox + (lon - a) * k * s, Y = lat => oy + (d - lat) * s;
    let g = `<rect class="map-sea" x="${r1(X(a))}" y="${r1(Y(d))}" width="${r1((b - a) * k * s)}" height="${r1((d - c) * s)}"/>`;
    if (o.outline) {
      const lines = [];
      const add = ring => { if (ring.length > 1) lines.push(ring); };
      const geo = gm => { if (!gm) return; const t = gm.type, C = gm.coordinates; if (t === 'Polygon') C.forEach(add); else if (t === 'MultiPolygon') C.forEach(pg => pg.forEach(add)); else if (t === 'LineString') add(C); else if (t === 'MultiLineString') C.forEach(add); else if (t === 'GeometryCollection') gm.geometries.forEach(geo); };
      const feats = o.outline.type === 'FeatureCollection' ? o.outline.features : [o.outline];
      feats.forEach(f => geo(f.geometry || f));
      lines.forEach(ring => { g += `<path class="map-line" d="${ring.map((pt, i) => (i ? 'L' : 'M') + r1(X(pt[0])) + ' ' + r1(Y(pt[1]))).join('')}"/>`; });
    }
    const st = niceNum(Math.max(b - a, d - c) / 5, true);
    const clip = 'mapclip' + Math.random().toString(36).slice(2, 7);
    g = `<defs><clipPath id="${clip}"><rect x="${r1(X(a))}" y="${r1(Y(d))}" width="${r1((b - a) * k * s)}" height="${r1((d - c) * s)}"/></clipPath></defs><g clip-path="url(#${clip})">${g}`;
    for (let v = Math.ceil(a / st) * st; v <= b; v += st) g += `<line class="grid" x1="${r1(X(v))}" x2="${r1(X(v))}" y1="${r1(Y(d))}" y2="${r1(Y(c))}"/>`;
    for (let v = Math.ceil(c / st) * st; v <= d; v += st) g += `<line class="grid" x1="${r1(X(a))}" x2="${r1(X(b))}" y1="${r1(Y(v))}" y2="${r1(Y(v))}"/>`;
    g += '</g>';
    const deg = (v, pos, neg) => `${Math.abs(+v.toFixed(4))}° ${v >= 0 ? pos : neg}`;
    for (let v = Math.ceil(a / st) * st; v <= b; v += st) g += `<text class="tick" data-role="xtick" x="${r1(X(v))}" y="${r1(Y(c) + 15)}" font-size="${o.font - 2}" text-anchor="middle">${deg(v, 'E', T('O', 'W'))}</text>`;
    for (let v = Math.ceil(c / st) * st; v <= d; v += st) g += `<text class="tick" data-role="ytick" x="${r1(X(a) - 5)}" y="${r1(Y(v) + 4)}" font-size="${o.font - 2}" text-anchor="end">${deg(v, 'N', 'S')}</text>`;
    g += `<rect class="ax" data-role="axis" x="${r1(X(a))}" y="${r1(Y(d))}" width="${r1((b - a) * k * s)}" height="${r1((d - c) * s)}" fill="none"/>`;
    const labs = [];
    P.forEach(p => {
      const x = X(p.lon), y = Y(p.lat), rr = p.r || 7;
      g += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${rr}" fill="${p.color}" stroke="var(--card-bg)" stroke-width="1.5"><title>${e(p.label + (p.note ? ' · ' + p.note : ''))}</title></circle>`;
      if (p.label) labs.push({ text: p.label, font: o.font - 1, cands: Chart.pointCands(x, y, rr, o.font - 1), px: x, py: y, rr });
    });
    const obst = P.map(p => { const rr = p.r || 7; return [X(p.lon) - rr, Y(p.lat) - rr, X(p.lon) + rr, Y(p.lat) + rr]; });
    Chart.placeLabels(labs, obst, [0, Tp, W - Rr + 8, H - 20]).forEach((Lb, i) => {
      g += Chart.leader(labs[i].px, labs[i].py, labs[i].rr, Lb, labs[i].font);
      g += `<text class="txt ch-plab" x="${r1(Lb.x)}" y="${r1(Lb.y)}" font-size="${labs[i].font}" text-anchor="${Lb.anchor}">${e(labs[i].text)}</text>`;
    });
    if (o.legend) g += Chart.legend(o.legend, W - Rr + 14, Tp + 12, o.font);
    const title = o.title ? `<text class="ttl" x="${L}" y="20" font-size="${o.font + 2}">${e(o.title)}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" class="fig" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${e(o.aria || o.title || '')}">${title}${g}</svg>`;
  }

  window.Compare = { parseNewick, writeNewick, postorder, tipsOf, normName, standardize, euclid, cluster, leavesOf, cophenetic, upperCorr, clusterNewick,
    jacobi, pca, costMatrix, numberParsimony, EVENTS, EV_MARK, dendrogramSvg, numberTreeSvg, mapSvg };
})();
