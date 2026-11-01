/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 8, comparison among taxa.
   The matrix of karyological parameters (what every accession has computed in
   Blocks 3, 4, 6 and 7, plus taxa typed by the user); the karyological
   distances (Gower, or Euclidean on standardized values) with UPGMA or Ward
   and the cophenetic correlation; a PCA of the correlation matrix with its
   biplot; the idiograms side by side; the parsimony of the chromosome number
   on a tree in Newick; and the map of the cytotypes. */
(function () {
  'use strict';
  const C = () => state.compare;
  const DEFAULT_VARS = ['n2', 'x', 'THL', 'MCA', 'CVCL', 'CVCI'];
  let grid = null, last = null;
  const showMessages = (c, list) => { clearMessages(c); list.forEach(([t, x]) => showMessage(c, t, esc(x))); };

  /* ---------------- the variables ---------------- */
  function varList() {
    const base = [['n2', '2n', '2n'], ['x', 'x', 'x'], ['THL', 'Longitud de un juego (THL)', 'Length of one set (THL)'], ['MCA', 'MCA', 'MCA'], ['CVCL', 'CVCL', 'CVCL'],
      ['CVCI', 'CVCI', 'CVCI'], ['A1', 'A1', 'A1'], ['A2', 'A2', 'A2'], ['TF', 'TF%', 'TF%'], ['Syi', 'Syi', 'Syi'], ['C2', '2C (pg)', '2C (pg)']];
    const used = new Set(state.bands.signals.map(s => s.probe));
    const probes = window.Bands ? Bands.probes().filter(p => used.has(p.id)).map(p => ['site:' + p.id, T('Sitios ', 'Sites ') + p.name, T('Sitios ', 'Sites ') + p.name]) : [];
    return base.map(v => ({ k: v[0], label: T(v[1], v[2]) })).concat(probes.map(v => ({ k: v[0], label: v[1] })));
  }
  const vars = () => { if (!Array.isArray(C().vars)) C().vars = DEFAULT_VARS.slice(); return C().vars; };
  const settings = () => { C().settings = Object.assign({ dist: 'gower', method: 'upgma', pcx: 0, pcy: 1, parScale: 'um', parMarks: true, gain: 1, loss: 1, dup: 1, demi: 1.5, show: 'n' }, C().settings || {}); return C().settings; };

  /* ---------------- the rows: the accessions of the project and the other taxa ---------------- */
  function accRow(a) {
    const K = window.Block3 ? Block3.karyo(a.id) : null;
    const A = K && window.Block4 ? Block4.asym(a.id) : null;
    const cnt = window.Ploidy ? Ploidy.counts(state.ploidy.counts.filter(r => r.acc === a.id)) : null;
    const g = window.Block6 ? state.ploidy.fcm.filter(r => r.acc === a.id).map(r => Block6.run(r)).filter(Boolean).map(r => r.c2).filter(isFinite) : [];
    const row = { id: a.id, kind: 'acc', name: accName(a.id), taxon: a.taxon || '', lat: num(a.lat), lon: num(a.lon), K,
      n2: cnt && cnt.mode ? cnt.mode : K ? K.n2 : NaN, x: num(a.x), C2: g.length ? Stats.mean(g) : NaN };
    ['THL', 'MCA', 'CVCL', 'CVCI', 'A1', 'A2', 'TF', 'Syi'].forEach(k => { row[k] = A && isFinite(A.R[k]) ? A.R[k] : NaN; });
    if (window.Bands && state.bands.signals.some(s => s.acc === a.id)) { const sc = Bands.siteCounts(a.id); Bands.probes().forEach(p => { row['site:' + p.id] = sc[p.id] || 0; }); }
    return row;
  }
  function rows() {
    const out = state.accessions.map(accRow).filter(r => ['n2', 'THL', 'C2'].some(k => isFinite(r[k])) || Object.keys(r).some(k => k.startsWith('site:')));
    C().extra.forEach((e, i) => {
      if (!e.name) return;
      const r = { id: 'extra' + i, kind: 'extra', name: e.name, taxon: e.name, lat: num(e.lat), lon: num(e.lon) };
      ['n2', 'x', 'THL', 'MCA', 'CVCL', 'CVCI', 'A1', 'C2'].forEach(k => { r[k] = num(e[k]); });
      out.push(r);
    });
    return out;
  }
  const val = (r, k) => (r[k] == null ? NaN : +r[k]);
  const digitsOf = k => (k === 'n2' || k === 'x' ? 0 : k.startsWith('site:') ? 1 : k === 'C2' || k === 'THL' ? 2 : k === 'A1' || k === 'A2' ? 3 : 2);

  function makeGrid() {
    grid = Grid.make(el('b8Extra'), {
      rows: () => C().extra, fileName: 'otros_taxones',
      newRow: R => ({ name: T('Taxón ', 'Taxon ') + (R.length + 1), n2: '', x: '' }),
      columns: [{ key: 'name', es: 'Taxón', en: 'Taxon', type: 'text', width: '11em', alias: ['nombre', 'especie', 'species'] },
        { key: 'n2', es: '2n', en: '2n', type: 'int', width: '4em' }, { key: 'x', es: 'x', en: 'x', type: 'int', width: '4em' },
        { key: 'THL', es: 'THL', en: 'THL', type: 'num', width: '5em' }, { key: 'MCA', es: 'MCA', en: 'MCA', type: 'num', width: '5em' },
        { key: 'CVCL', es: 'CVCL', en: 'CVCL', type: 'num', width: '5em' }, { key: 'CVCI', es: 'CVCI', en: 'CVCI', type: 'num', width: '5em' },
        { key: 'A1', es: 'A1', en: 'A1', type: 'num', width: '5em' }, { key: 'C2', es: '2C (pg)', en: '2C (pg)', type: 'num', width: '5em', alias: ['2c'] },
        { key: 'lat', es: 'Latitud', en: 'Latitude', type: 'num', width: '6em', min: -90, alias: ['lat'] },
        { key: 'lon', es: 'Longitud', en: 'Longitude', type: 'num', width: '6em', min: -180, alias: ['lon', 'long'] }],
      emptyEs: 'Sin otros taxones. Agrega los publicados para compararlos con tus accesiones.', emptyEn: 'No other taxa. Add published ones to compare them with your accessions.',
      onChange: () => { changed(); renderAll(); },
    });
  }
  const changed = () => { blockDone(); document.dispatchEvent(new CustomEvent('datachange', { detail: { block: 8 } })); };

  /* ---------------- the matrix ---------------- */
  function renderVars() {
    const V = vars();
    el('b8Vars').innerHTML = varList().map(v => `<button type="button" class="chip${V.includes(v.k) ? ' on' : ''}" data-var="${esc(v.k)}" aria-pressed="${V.includes(v.k)}">${esc(v.label)}</button>`).join('');
  }
  function renderMatrix(R) {
    const L = varList();
    const shown = L.filter(v => R.some(r => isFinite(val(r, v.k))));
    buildTable('b8Matrix', [{ key: 'name', label: L2('Accesión o taxón', 'Accession or taxon'), get: r => r.name + (r.kind === 'extra' ? ' ¹' : '') }]
      .concat(shown.map(v => ({ key: v.k, label: esc(v.label) + (vars().includes(v.k) ? ' ✓' : ''), num: true, get: r => isFinite(val(r, v.k)) ? fmtFixed(val(r, v.k), digitsOf(v.k)) : '' }))), R,
    { foot: `<tr><td colspan="${shown.length + 1}" class="hint">${L2('¹ Taxón escrito a mano en «Otros taxones». ✓ Variable del análisis.', '¹ Taxon typed by hand in «Other taxa». ✓ Variable of the analysis.')}</td></tr>` });
  }

  /* ---------------- the analysis: distances, clustering, PCA ---------------- */
  function analyse(R) {
    const msgs = [];
    const V = vars().filter(k => varList().some(v => v.k === k));
    if (V.length < 1) return { msgs: [['warning', T('Elige al menos una variable.', 'Choose at least one variable.')]] };
    let use = R.filter(r => V.filter(k => isFinite(val(r, k))).length >= 1);
    const dropped = R.length - use.length;
    if (dropped) msgs.push(['info', T(`${dropped} fila(s) sin ninguna de las variables elegidas quedan fuera.`, `${dropped} row(s) with none of the chosen variables are left out.`)]);
    if (use.length < 3) return { msgs: msgs.concat([['warning', T('Hacen falta al menos tres accesiones o taxones con datos para comparar.', 'At least three accessions or taxa with data are needed to compare.')]]) };
    const X = use.map(r => V.map(k => val(r, k)));
    const s = settings();
    let D;
    if (s.dist === 'euclid') D = Compare.euclid(Compare.standardize(X).Z);
    else D = Stats.gower(X);
    const bad = [];
    for (let i = 0; i < D.length; i++) for (let j = i + 1; j < D.length; j++) if (!isFinite(D[i][j])) bad.push(use[i].name + ' – ' + use[j].name);
    if (bad.length) return { msgs: msgs.concat([['error', T('Estas parejas no comparten ninguna variable: ', 'These pairs share no variable: ') + bad.slice(0, 4).join('; ') + (bad.length > 4 ? '…' : '') + T('. Quita variables o completa los datos.', '. Remove variables or complete the data.')]]) };
    if (X.some(r => r.some(v => !isFinite(v)))) msgs.push(['info', T('Hay celdas vacías: la distancia usa en cada pareja las variables que ambas tienen.', 'There are empty cells: the distance uses, for each pair, the variables both have.')]);
    const CL = Compare.cluster(D, s.method);
    const coph = Compare.upperCorr(D, Compare.cophenetic(CL.tree, use.length));
    /* PCA: only the variables with spread */
    const pv = V.map((k, j) => j).filter(j => { const v = X.map(r => r[j]).filter(isFinite); return v.length >= 2 && Stats.sd(v) > 0; });
    let P = null;
    if (pv.length >= 2) P = Compare.pca(X.map(r => pv.map(j => r[j])));
    else msgs.push(['info', T('El análisis de componentes necesita al menos dos variables que varíen.', 'The component analysis needs at least two variables that vary.')]);
    return { msgs, use, V, X, D, CL, coph, P, pv };
  }
  const labelsOf = A => A.use.map(r => r.name);
  function renderClu(A) {
    if (!A.CL) { el('b8Dendro').innerHTML = ''; el('b8CluTiles').innerHTML = ''; el('b8DistTable').innerHTML = ''; return; }
    const s = settings(), labs = labelsOf(A);
    const xl = s.dist === 'euclid' ? T('Distancia euclidiana (valores estandarizados)', 'Euclidean distance (standardized values)') : T('Distancia de Gower', 'Gower distance');
    el('b8Dendro').innerHTML = Compare.dendrogramSvg(A.CL.tree, labs, { xlab: xl + (s.method === 'ward' ? ' · Ward' : ' · UPGMA'), aria: T('Dendrograma de ', 'Dendrogram of ') + labs.length + T(' taxones', ' taxa') });
    statTiles('b8CluTiles', [[L2('Taxones', 'Taxa'), A.use.length], [L2('Variables', 'Variables'), A.V.length],
      [L2('Correlación cofenética', 'Cophenetic correlation'), fmtFixed(A.coph, 3), A.coph >= 0.8 ? L2('el árbol resume bien las distancias', 'the tree summarises the distances well') : L2('el árbol deforma las distancias (r < 0.8)', 'the tree distorts the distances (r < 0.8)'), A.coph >= 0.8 ? null : 'warn']]);
    const head = '<tr><th scope="col"></th>' + labs.map(l => `<th scope="col">${esc(l)}</th>`).join('') + '</tr>';
    const body = A.D.map((r, i) => `<tr><th scope="row">${esc(labs[i])}</th>` + r.map((v, j) => `<td class="num">${i === j ? '·' : fmtFixed(v, 3)}</td>`).join('') + '</tr>').join('');
    el('b8DistTable').innerHTML = `<table class="dis"><caption>${L2('Matriz de distancias', 'Distance matrix')}</caption><thead>${head}</thead><tbody>${body}</tbody></table>`;
  }
  const pcaNames = A => A.pv.map(j => (varList().find(v => v.k === A.V[j]) || { label: A.V[j] }).label);
  /* the biplot of components cx and cy (also for Block 10) */
  function biplotSvg(A, cx, cy) {
    const P = A.P, names = pcaNames(A);
    if (cx == null) { const s = settings(), m = P.values.length; cx = Math.min(s.pcx, m - 1); cy = Math.min(s.pcy, m - 1) === cx ? (cx + 1) % m : Math.min(s.pcy, m - 1); }
    const maxS = Math.max(...P.scores.map(r => Math.max(Math.abs(r[cx]), Math.abs(r[cy]))), 1e-9);
    const maxL = Math.max(...P.loadings[cx].map((v, k) => Math.hypot(v, P.loadings[cy][k])), 1e-9);
    const f = 0.85 * maxS / maxL;
    return Chart.scatter({
      points: A.use.map((r, i) => ({ x: P.scores[i][cx], y: P.scores[i][cy], label: r.name, color: r.kind === 'acc' ? accColor(r.id) : 'var(--text-muted)', shape: r.kind === 'acc' ? 'circle' : 'square' })),
      vectors: names.map((nm, k) => ({ x: P.loadings[cx][k] * f, y: P.loadings[cy][k] * f, label: nm })),
      xlab: `${T('CP', 'PC')}${cx + 1} (${fmtPct(P.explained[cx], 1)})`, ylab: `${T('CP', 'PC')}${cy + 1} (${fmtPct(P.explained[cy], 1)})`,
      hlines: [0], vlines: [0], width: 620, height: 440,
      legend: A.use.some(r => r.kind === 'extra') ? [{ label: T('Accesiones del proyecto', 'Accessions of the project'), color: 'var(--chart1)' }, { label: T('Otros taxones', 'Other taxa'), color: 'var(--text-muted)' }] : null,
      aria: T('Biplot del análisis de componentes principales', 'Biplot of the principal component analysis'),
    });
  }
  function renderPca(A) {
    const sx = el('b8PcX'), sy = el('b8PcY');
    if (!A.P) { sx.innerHTML = sy.innerHTML = ''; el('b8Biplot').innerHTML = ''; el('b8PcaTable').innerHTML = ''; return; }
    const s = settings(), P = A.P, m = P.values.length;
    const opt = P.values.map((v, i) => `<option value="${i}">${T('CP', 'PC')}${i + 1} (${fmtPct(P.explained[i], 1)})</option>`).join('');
    sx.innerHTML = opt; sy.innerHTML = opt;
    const cx = Math.min(s.pcx, m - 1), cy = Math.min(s.pcy, m - 1) === cx ? (cx + 1) % m : Math.min(s.pcy, m - 1);
    sx.value = String(cx); sy.value = String(cy);
    const names = pcaNames(A);
    el('b8Biplot').innerHTML = biplotSvg(A, cx, cy);
    let acc = 0;
    const rowsT = P.values.map((v, i) => { acc += P.explained[i]; return { pc: T('CP', 'PC') + (i + 1), ev: v, ex: P.explained[i], cum: acc, L: names.map((n, k) => P.loadings[i][k]) }; });
    buildTable('b8PcaTable', [{ key: 'pc', label: L2('Componente', 'Component') }, { key: 'ev', label: L2('Valor propio', 'Eigenvalue'), num: true, get: r => fmtFixed(r.ev, 4) },
      { key: 'ex', label: L2('Varianza', 'Variance'), num: true, get: r => fmtPct(r.ex, 1) }, { key: 'cum', label: L2('Acumulada', 'Cumulative'), num: true, get: r => fmtPct(r.cum, 1) }]
      .concat(names.map((n, k) => ({ key: 'l' + k, label: esc(n), num: true, get: r => fmtFixed(r.L[k], 3) }))), rowsT,
    { foot: `<tr><td colspan="${names.length + 4}" class="hint">${L2('Cargas: correlación de cada variable con el componente. Matriz de correlaciones; las celdas vacías se ponen en la media.', 'Loadings: the correlation of each variable with the component. Correlation matrix; empty cells are put at the mean.')}${P.missing ? ' ' + L2('(Hay celdas vacías.)', '(There are empty cells.)') : ''}</td></tr>` });
  }

  /* ---------------- idiograms side by side ---------------- */
  function parallelSvg(R) {
    const s = settings();
    const Ks = R.filter(r => r.K).map(r => r.K);
    if (!Ks.length) return '';
    const f = K => (s.parScale === 'rel' ? 100 / K.thl : 1);
    const maxS = Math.max(...Ks.map(K => Math.max(...K.pairs.map(p => p.s.mean)) * f(K)));
    const maxL = Math.max(...Ks.map(K => Math.max(...K.pairs.map(p => p.l.mean)) * f(K)));
    let y = 0, W = 0, body = '';
    Ks.forEach(K => {
      const I = Block3.idiogram(K, { view: 'haploid', unit: s.parScale, marks: s.parMarks, title: accName(K.acc) + ' · ' + K.formula }, { maxS: maxS * 1.02, maxL: maxL * 1.02, height: 200 });
      body += `<g transform="translate(0 ${y})">` + I.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') + '</g>';
      y += I.height + 6; W = Math.max(W, I.width);
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" class="idio" viewBox="0 0 ${W} ${y}" width="${W}" height="${y}" role="img" aria-label="${esc(T('Idiogramas de ', 'Idiograms of ') + Ks.length + T(' accesiones a la misma escala', ' accessions at the same scale'))}">${body}</svg>`;
  }
  function renderParallel(R) {
    el('b8Par').innerHTML = parallelSvg(R) || `<p class="hint">${L2('Ninguna accesión tiene cariotipo todavía (Bloque 3).', 'No accession has a karyotype yet (Block 3).')}</p>`;
  }

  /* ---------------- chromosome number evolution ---------------- */
  const norm = s => Compare.normName(s);
  /* the 2n of a tip: typed by the user, an accession (by the map of the example or by name) or another taxon */
  function tipInfo(name, R) {
    const typed = (C().tipN || {})[name];
    const fromMap = Object.entries(C().map || {}).find(([, t]) => norm(t) === norm(name));
    const r = (fromMap && R.find(x => x.id === fromMap[0])) || R.find(x => norm(x.name) === norm(name)) || R.find(x => x.kind === 'acc' && x.taxon && norm(x.taxon) === norm(name));
    const auto = r && isFinite(r.n2) ? String(r.n2) : '';
    const text = typed != null && typed !== '' ? String(typed) : auto;
    const n2s = text.split(/[\/,;\s]+/).map(Number).filter(v => isFinite(v) && v > 0);
    return { name, row: r || null, auto, typed: typed != null && typed !== '', text, n2s };
  }
  /* the parsimony of the number on the tree of the project (also for Block 10) */
  function evolution(R) {
    const s = settings(), nwk = (C().newick || '').trim();
    if (!nwk) return { empty: true, msgs: [['info', T('Pega un árbol en Newick para reconstruir los números de los antepasados.', 'Paste a tree in Newick to reconstruct the numbers of the ancestors.')]] };
    let root;
    try { root = Compare.parseNewick(nwk); } catch (e) { return { msgs: [['error', e.message]] }; }
    const info = Compare.tipsOf(root).map(t => tipInfo(t.name, R));
    const msgs = [], states = new Map();
    info.forEach(I => {
      const odd = I.n2s.filter(v => v % 2);
      if (odd.length) msgs.push(['warning', T(`${I.name}: 2n = ${odd.join(', ')} es impar; no tiene un número haploide entero y no entra al análisis.`, `${I.name}: 2n = ${odd.join(', ')} is odd; it has no whole haploid number and does not enter the analysis.`)]);
      states.set(I.name, I.n2s.filter(v => v % 2 === 0).map(v => v / 2));
    });
    const out = { info, states, msgs };
    if ([...states.values()].filter(v => v.length).length < 2) { msgs.push(['warning', T('Hacen falta al menos dos puntas con número.', 'At least two tips with a number are needed.')]); return out; }
    const miss = info.filter(I => !(states.get(I.name) || []).length);
    if (miss.length) msgs.push(['info', T(`${miss.length} punta(s) sin número: la reconstrucción las trata como desconocidas.`, `${miss.length} tip(s) without a number: the reconstruction treats them as unknown.`)]);
    try { out.P = Compare.numberParsimony(root, states, { gain: s.gain, loss: s.loss, dup: s.dup, demi: s.demi }); } catch (e) { msgs.push(['error', e.message]); return out; }
    if (out.P.ambiguous) msgs.push(['info', T('Los nodos con borde punteado tienen más de un número igual de parsimonioso (anotados debajo); el árbol muestra una de las historias óptimas.', 'The nodes with a dotted border have more than one equally parsimonious number (written below them); the tree shows one of the optimal histories.')]);
    return out;
  }
  const treeSvg = P => Compare.numberTreeSvg(P, { show: settings().show, aria: T('Árbol con los números cromosómicos reconstruidos por parsimonia', 'Tree with the chromosome numbers reconstructed by parsimony') });
  function renderEvo(R) {
    const s = settings(), msg = el('b8EvoMsg'), nwk = (C().newick || '').trim();
    if (el('b8Newick').value !== nwk && document.activeElement !== el('b8Newick')) el('b8Newick').value = nwk;
    const E = evolution(R);
    if (!E.info) el('b8Tips').innerHTML = '';
    else buildTable('b8Tips', [{ key: 'name', label: L2('Punta', 'Tip'), get: I => I.name.replace(/_/g, ' ') },
      { key: 'src', label: L2('Origen del número', 'Source of the number'), get: I => I.typed ? T('escrito aquí', 'typed here') : I.row ? (I.row.kind === 'acc' ? T('accesión: ', 'accession: ') + I.row.name : T('otro taxón', 'other taxon')) : T('sin número', 'no number') },
      { key: 'n2', label: L2('2n (varios: 24/26)', '2n (several: 24/26)'), html: true, get: I => `<input type="text" class="tip-n2" data-tip="${esc(I.name)}" value="${esc(I.text)}" placeholder="${esc(I.auto || '?')}" style="width:7em" aria-label="${esc('2n · ' + I.name)}">` },
      { key: 'n', label: L2('n usado', 'n used'), num: true, get: I => (E.states.get(I.name) || []).join('/') || '?' }], E.info);
    const P = E.P;
    if (!P) { el('b8Tree').innerHTML = el('b8EvoTiles').innerHTML = ''; showMessages(msg, E.msgs); return null; }
    const v2 = x => (s.show === '2n' ? 2 * x : x);
    statTiles('b8EvoTiles', [[L2('Costo mínimo', 'Minimum cost'), fmtNum(P.cost, 2)], [L2('Número de la raíz', 'Number at the root'), (s.show === '2n' ? '2n = ' : 'n = ') + P.root.mpr.map(v2).join('/'), P.root.mpr.length > 1 ? L2('varios igual de parsimoniosos', 'several equally parsimonious') : ''],
      ['+1 / −1', P.totals.gain + ' / ' + P.totals.loss, L2('disploidía', 'dysploidy')], ['×2', P.totals.dup, L2('poliploidía', 'polyploidy')], ['×1.5', P.totals.demi, L2('demiploidía', 'demiploidy')],
      [L2('Nodos ambiguos', 'Ambiguous nodes'), P.ambiguous, P.ambiguous ? L2('con más de un número óptimo', 'with more than one optimal number') : '', P.ambiguous ? 'warn' : null]]);
    el('b8Tree').innerHTML = treeSvg(P);
    showMessages(msg, E.msgs);
    return P;
  }

  /* ---------------- the map of cytotypes ---------------- */
  function mapFigure(R) {
    const pts = R.filter(r => isFinite(r.lat) && isFinite(r.lon));
    if (!pts.length) return '';
    const values = [...new Set(pts.map(r => isFinite(r.n2) ? r.n2 : null))].sort((a, b) => (a == null) - (b == null) || a - b);
    const PAL = ['var(--chart1)', 'var(--chart2)', 'var(--chart3)', 'var(--chart4)', 'var(--chart5)', 'var(--chart6)', 'var(--pr5)', 'var(--pr7)'];
    const col = v => (v == null ? 'var(--text-muted)' : PAL[values.indexOf(v) % PAL.length]);
    return Compare.mapSvg(pts.map(r => ({ lat: r.lat, lon: r.lon, color: col(isFinite(r.n2) ? r.n2 : null), label: r.name, note: isFinite(r.n2) ? '2n = ' + r.n2 : '' })),
      { outline: C().geo || null, legend: values.map(v => ({ label: v == null ? T('2n desconocido', '2n unknown') : '2n = ' + v, color: col(v) })), aria: T('Mapa de citotipos', 'Map of cytotypes') });
  }
  function renderMap(R) {
    el('b8GeoClear').hidden = !C().geo;
    el('b8Map').innerHTML = mapFigure(R) || `<p class="hint">${L2('Ninguna accesión ni taxón tiene coordenadas: escríbelas en la ficha de la accesión (Bloque 2) o en «Otros taxones».', 'No accession or taxon has coordinates: type them in the accession record (Block 2) or in «Other taxa».')}</p>`;
  }

  /* ---------------- everything ---------------- */
  function renderAll() {
    const R = rows();
    renderVars(); renderMatrix(R);
    const A = analyse(R);
    showMessages(el('b8Msg'), A.msgs);
    renderClu(A); renderPca(A); renderParallel(R);
    const P = renderEvo(R);
    renderMap(R);
    last = { A, P };
    const s = settings();
    state.results.compare = A.CL ? { n: A.use.length, vars: A.V.slice(), dist: s.dist, method: s.method, coph: A.coph, labels: labelsOf(A), newick: Compare.clusterNewick(A.CL.tree, labelsOf(A)),
      pca: A.P ? { explained: A.P.explained.slice() } : null, parsimony: P ? { cost: P.cost, root: P.root.mpr.slice(), totals: Object.assign({}, P.totals), ambiguous: P.ambiguous } : null } : null;
    blockDone();
  }
  function readForm() {
    const s = settings();
    s.dist = el('b8Dist').value; s.method = el('b8Method').value; s.parScale = el('b8ParScale').value; s.parMarks = el('b8ParMarks').checked; s.show = el('b8Show').value;
    s.pcx = +el('b8PcX').value || 0; s.pcy = el('b8PcY').value === '' ? 1 : +el('b8PcY').value;
    [['gain', 'b8CGain'], ['loss', 'b8CLoss'], ['dup', 'b8CDup'], ['demi', 'b8CDemi']].forEach(([k, id]) => { const v = num(el(id).value); s[k] = isFinite(v) && v >= 0 ? v : s[k]; });
  }
  function writeForm() {
    const s = settings();
    el('b8Dist').value = s.dist; el('b8Method').value = s.method; el('b8ParScale').value = s.parScale; el('b8ParMarks').checked = !!s.parMarks; el('b8Show').value = s.show;
    el('b8CGain').value = s.gain; el('b8CLoss').value = s.loss; el('b8CDup').value = s.dup; el('b8CDemi').value = s.demi;
  }
  function render() {
    writeForm();
    if (grid) grid.render();
    renderAll();
  }
  let nwkTimer = null;
  document.addEventListener('DOMContentLoaded', () => {
    if (!el('panel-8')) return;
    makeGrid();
    el('b8Vars').addEventListener('click', e => {
      const b = e.target.closest('[data-var]');
      if (!b) return;
      const V = vars(), k = b.dataset.var, i = V.indexOf(k);
      if (i >= 0) V.splice(i, 1); else V.push(k);
      renderAll();
    });
    ['b8Dist', 'b8Method', 'b8PcX', 'b8PcY', 'b8ParScale', 'b8ParMarks', 'b8Show', 'b8CGain', 'b8CLoss', 'b8CDup', 'b8CDemi'].forEach(id => el(id).addEventListener('change', () => { readForm(); renderAll(); }));
    el('b8Newick').addEventListener('input', () => { clearTimeout(nwkTimer); nwkTimer = setTimeout(() => { C().newick = el('b8Newick').value; renderAll(); }, 400); });
    el('b8NwkOpen').addEventListener('click', () => el('b8NwkFile').click());
    el('b8NwkFile').addEventListener('change', async e => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      const t = (await readFileText(f)).trim();
      /* a NEXUS file: the first tree of its TREES block */
      const m = /^\s*tree\s+[^=]+=\s*(?:\[[^\]]*\]\s*)?([^;]+;)/im.exec(t);
      C().newick = m && /#nexus/i.test(t) ? m[1] : t;
      el('b8Newick').value = C().newick;
      renderAll();
      toast(T('Árbol leído de ', 'Tree read from ') + f.name, 'success');
    });
    el('b8NwkFromClu').addEventListener('click', () => {
      const A = last && last.A;
      if (!A || !A.CL) { toast(T('Todavía no hay dendrograma.', 'There is no dendrogram yet.'), 'warning'); return; }
      C().newick = Compare.clusterNewick(A.CL.tree, labelsOf(A));
      el('b8Newick').value = C().newick;
      renderAll();
    });
    el('b8Nwk').addEventListener('click', () => {
      const A = last && last.A;
      if (!A || !A.CL) { toast(T('Todavía no hay dendrograma.', 'There is no dendrogram yet.'), 'warning'); return; }
      download(Compare.clusterNewick(A.CL.tree, labelsOf(A)) + '\n', 'dendrograma_' + settings().method + '.nwk', 'text/plain;charset=utf-8');
    });
    el('b8Tips').addEventListener('change', e => {
      const i = e.target.closest('.tip-n2');
      if (!i) return;
      C().tipN = C().tipN || {};
      if (i.value.trim() === '') delete C().tipN[i.dataset.tip]; else C().tipN[i.dataset.tip] = i.value.trim();
      renderAll();
    });
    el('b8GeoOpen').addEventListener('click', () => el('b8GeoFile').click());
    el('b8GeoFile').addEventListener('change', async e => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const g = JSON.parse(await readFileText(f));
        if (!g || !/^(FeatureCollection|Feature|Polygon|MultiPolygon|LineString|MultiLineString|GeometryCollection)$/.test(g.type)) throw new Error('type');
        C().geo = g;
        renderAll();
        toast(T('Contorno cargado: ', 'Outline loaded: ') + f.name, 'success');
      } catch (err) { toast(T('El archivo no es un GeoJSON válido.', 'The file is not valid GeoJSON.'), 'error'); }
    });
    el('b8GeoClear').addEventListener('click', () => { delete C().geo; renderAll(); });
  });
  document.addEventListener('stepchange', e => { if (e.detail.step === 8) render(); });
  document.addEventListener('langchange', () => { if (el('panel-8') && el('panel-8').classList.contains('active')) render(); });

  /* every figure of the block as SVG text, with the settings of the block (for Block 10) */
  function figures() {
    const R = rows(), A = analyse(R), E = evolution(R), s = settings(), out = [];
    if (A.CL) out.push({ id: 'dendrograma', es: 'Dendrograma', en: 'Dendrogram', svg: Compare.dendrogramSvg(A.CL.tree, labelsOf(A), { xlab: (s.dist === 'euclid' ? T('Distancia euclidiana (valores estandarizados)', 'Euclidean distance (standardized values)') : T('Distancia de Gower', 'Gower distance')) + (s.method === 'ward' ? ' · Ward' : ' · UPGMA') }) });
    if (A.P) out.push({ id: 'biplot', es: 'Biplot de componentes principales', en: 'Principal component biplot', svg: biplotSvg(A) });
    const par = parallelSvg(R);
    if (par && R.filter(r => r.K).length > 1) out.push({ id: 'idiogramas_paralelo', es: 'Idiogramas en paralelo', en: 'Parallel idiograms', svg: par });
    if (E.P) out.push({ id: 'evolucion_numero', es: 'Árbol con los números cromosómicos', en: 'Tree with the chromosome numbers', svg: treeSvg(E.P) });
    const map = mapFigure(R);
    if (map) out.push({ id: 'mapa_citotipos', es: 'Mapa de citotipos', en: 'Map of cytotypes', svg: map });
    return { list: out, A, E, R };
  }

  window.Block8 = { render, rows, analyse: () => analyse(rows()), evolution: () => evolution(rows()), figures, varList, settings, get last() { return last; } };
})();
