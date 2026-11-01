/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 5, meiosis.
   For the chosen accession: the configurations cell by cell with their
   chiasmata and the recombination index; observed against expected under up
   to three genome formulas; abnormalities by phase; tetrads and the meiotic
   index; pollen viability with its intervals and the homogeneity of the
   plants, read also from the fertility CSV of PalynoPro. The data live in
   state.meiosis, one list per table, each row with its accession. */
(function () {
  'use strict';
  let cur = null;
  const grids = {};
  const M = () => state.meiosis;
  const ofAcc = list => list.filter(r => r.acc === cur);
  const changed = () => { state.results.meiosis = Date.now(); blockDone(); document.dispatchEvent(new CustomEvent('datachange', { detail: { block: 5, acc: cur } })); };
  const CLASSES = [
    { ks: ['I'], es: 'I', en: 'I' }, { ks: ['IIrod'], es: 'II varilla', en: 'II rod' }, { ks: ['IIring'], es: 'II anillo', en: 'II ring' },
    { ks: ['III'], es: 'III', en: 'III' }, { ks: ['IVchain'], es: 'IV cadena', en: 'IV chain' }, { ks: ['IVring'], es: 'IV anillo', en: 'IV ring' },
    { ks: ['V', 'VIchain', 'VIring'], es: '≥ V', en: '≥ V' },
  ];

  /* ---------------- tables ---------------- */
  function makeGrids() {
    const cellCols = Meiosis.COLS.map(c => ({ key: c.f, es: c.es, en: c.en, type: 'int', width: '4.2em' }));
    grids.conf = Grid.make(el('b5Conf'), {
      rows: () => M().configs, filter: r => r.acc === cur, fileName: () => 'configuraciones_' + slug(accName(cur)),
      newRow: R => { const v = R.filter(r => r.acc === cur); const last = v[v.length - 1]; return { acc: cur, ind: last ? last.ind : T('Planta 1', 'Plant 1'), cell: v.length + 1 }; },
      columns: [{ key: 'ind', es: 'Planta', en: 'Plant', type: 'text', width: '7em', alias: ['individuo', 'individual', 'ind'] }, { key: 'cell', es: 'Célula', en: 'Cell', type: 'text', width: '4em' }]
        .concat(cellCols)
        .concat([{ key: 'xta', es: 'Quiasmas contados', en: 'Chiasmata counted', type: 'int', width: '5em', alias: ['xta', 'quiasmas', 'chiasmata'] },
          { key: '_chr', es: 'Cromosomas', en: 'Chromosomes', get: r => Meiosis.cell(r).chr, digits: 0, noExport: false, csv: 'chromosomes' },
          { key: '_xta', es: 'Quiasmas', en: 'Chiasmata', get: r => Meiosis.cell(r).xta, digits: 0, csv: 'chiasmata' }]),
      emptyEs: 'Sin células todavía: escribe o pega una fila por célula.', emptyEn: 'No cells yet: type or paste one row per cell.',
      onChange: () => { changed(); renderConf(); },
    });
    grids.phase = Grid.make(el('b5Phase'), {
      rows: () => M().phases, filter: r => r.acc === cur, fileName: () => 'fases_' + slug(accName(cur)),
      newRow: () => ({ acc: cur, ind: T('Planta 1', 'Plant 1'), phase: 'AI', normal: '' }),
      columns: [{ key: 'ind', es: 'Planta', en: 'Plant', type: 'text', width: '7em' },
        { key: 'phase', es: 'Fase', en: 'Phase', type: 'select', options: Meiosis.PHASES.map(p => [p.k, p.es, p.en]) },
        { key: 'normal', es: 'Normales', en: 'Normal', type: 'int', width: '4.6em' }]
        .concat(Meiosis.ABN.map(a => ({ key: a.f, es: a.es, en: a.en, type: 'int', width: '4.6em' }))),
      onChange: () => { changed(); renderPhases(); },
    });
    grids.tet = Grid.make(el('b5Tet'), {
      rows: () => M().tetrads, filter: r => r.acc === cur, fileName: () => 'tetradas_' + slug(accName(cur)),
      newRow: () => ({ acc: cur, ind: T('Planta 1', 'Plant 1') }),
      columns: [{ key: 'ind', es: 'Planta', en: 'Plant', type: 'text', width: '7em' }, { key: 'normal', es: 'Tétradas normales', en: 'Normal tetrads', type: 'int', width: '5em' },
        { key: 'micronuclei', es: 'Con micronúcleos', en: 'With micronuclei', type: 'int', width: '5em' }, { key: 'dyads', es: 'Díadas', en: 'Dyads', type: 'int', width: '5em' },
        { key: 'triads', es: 'Tríadas', en: 'Triads', type: 'int', width: '5em' }, { key: 'polyads', es: 'Políadas', en: 'Polyads', type: 'int', width: '5em' }],
      onChange: () => { changed(); renderTetrads(); },
    });
    grids.pol = Grid.make(el('b5Pol'), {
      rows: () => M().pollen, filter: r => r.acc === cur, fileName: () => 'polen_' + slug(accName(cur)),
      newRow: R => ({ acc: cur, id: T('Planta ', 'Plant ') + (R.filter(r => r.acc === cur).length + 1) }),
      columns: [{ key: 'id', es: 'Planta', en: 'Plant', type: 'text', width: '8em', alias: ['landrace_code', 'individuo', 'individual'] },
        { key: 'viable', es: 'Viables', en: 'Viable', type: 'int', width: '5em', alias: ['teñidos', 'stained'] },
        { key: 'inviable', es: 'Inviables', en: 'Inviable', type: 'int', width: '5em', alias: ['no teñidos', 'unstained'] },
        { key: '_p', es: '% viables', en: '% viable', get: r => { const n = (+r.viable || 0) + (+r.inviable || 0); return n ? 100 * (+r.viable || 0) / n : NaN; }, digits: 1, csv: 'pct_viable' }],
      extraButtons: () => `<button type="button" class="btn btn-ghost btn-sm" data-act="palyno">${esc(T('Leer el CSV de fertilidad de PalynoPro', 'Read the PalynoPro fertility CSV'))}</button>` +
        `<button type="button" class="btn btn-ghost btn-sm" data-act="palynoout">${esc(T('CSV con columnas de PalynoPro', 'CSV with PalynoPro columns'))}</button>`,
      onAction: a => { if (a === 'palyno') el('b5PolFile').click(); else if (a === 'palynoout') exportPalyno(); },
      onChange: () => { changed(); renderPollen(); },
    });
  }
  /* PalynoPro writes, per morphotype: landrace_code, n_granos_completos and
     pct_atipico (grains of atypical shape on SEM, a proxy of inviability). */
  async function importPalyno(file) {
    const { rows } = parseDelimited(await readFileText(file));
    if (rows.length < 2) return;
    const h = rows[0].map(x => x.trim().toLowerCase());
    const iId = h.indexOf('landrace_code'), iN = h.indexOf('n_granos_completos'), iP = h.indexOf('pct_atipico');
    if (iId < 0 || iN < 0 || iP < 0) { toast(T('El archivo no tiene las columnas de PalynoPro (landrace_code, n_granos_completos, pct_atipico).', 'The file lacks the PalynoPro columns (landrace_code, n_granos_completos, pct_atipico).'), 'error'); return; }
    let k = 0;
    rows.slice(1).forEach(r => {
      const n = Math.round(num(r[iN])), p = num(r[iP]);
      if (!(n > 0) || !isFinite(p)) return;
      const inv = Math.round(n * p / 100);
      M().pollen.push({ acc: cur, id: r[iId], viable: n - inv, inviable: inv, source: 'palynopro' });
      k++;
    });
    changed(); grids.pol.render(); renderPollen();
    clearMessages('b5PolMsg');
    showMessage('b5PolMsg', 'info', T(`Se ${k === 1 ? 'leyó una fila' : 'leyeron ' + k + ' filas'} de PalynoPro. Ojo: su «% atípico» viene de la forma del grano en microscopía electrónica, no de una tinción; úsalo como aproximación.`,
      `${k === 1 ? 'One row' : k + ' rows'} read from PalynoPro. Note: its “% atypical” comes from the shape of the grain under electron microscopy, not from a stain; use it as an approximation.`));
  }
  function exportPalyno() {
    const rows = ofAcc(M().pollen).map(r => { const n = (+r.viable || 0) + (+r.inviable || 0); return [r.id, n, n ? +(100 * (+r.inviable || 0) / n).toFixed(3) : '', +r.viable || 0, +r.inviable || 0]; });
    download(toDelimited([['landrace_code', 'n_granos_completos', 'pct_atipico', 'viables', 'inviables']].concat(rows)), 'polen_' + slug(accName(cur)) + '_palynopro.csv', 'text/csv;charset=utf-8');
  }

  /* ---------------- configurations ---------------- */
  function haploid(recs) {
    const mo = Stats.modes(recs.map(r => Meiosis.cell(r).chr).filter(n => n > 0));
    return mo.modes.length ? mo.modes[0] / 2 : NaN;
  }
  function renderConf() {
    const recs = ofAcc(M().configs);
    clearMessages('b5ConfMsg');
    if (!recs.length) { el('b5ConfTiles').innerHTML = ''; el('b5ConfSum').innerHTML = ''; el('b5ConfFig').innerHTML = ''; renderHyp(); return; }
    const n = haploid(recs), S = Meiosis.summarize(recs, { n });
    statTiles('b5ConfTiles', [
      [T('Células', 'Cells'), S.cells],
      [T('Cromosomas por célula', 'Chromosomes per cell'), S.chr, S.chrVaries ? T('no en todas', 'not in all') : '', S.chrVaries ? 'warn' : null],
      [T('Quiasmas por célula', 'Chiasmata per cell'), fmtMS(S.xta.mean, S.xta.sd), S.estimated ? T('estimados de las configuraciones', 'estimated from the configurations') : T('contados', 'counted')],
      [T('Quiasmas por bivalente', 'Chiasmata per bivalent'), fmtFixed(S.xtaPerBiv, 2)],
      [T('Índice de recombinación', 'Recombination index'), fmtFixed(S.RI, 2), 'n + ' + T('quiasmas', 'chiasmata')],
      [T('Células con multivalentes', 'Cells with multivalents'), fmtPct(S.withMult, 0)],
    ]);
    const inds = [...new Set(recs.map(r => r.ind || '—'))];
    const sums = inds.map(i => ({ ind: i, S: Meiosis.summarize(recs.filter(r => (r.ind || '—') === i), { n }) })).concat(inds.length > 1 ? [{ ind: T('Accesión', 'Accession'), S, all: true }] : []);
    const per = (S, ks) => { const v = ks.map(k => S.per[k].mean).reduce((a, b) => a + b, 0); return v; };
    buildTable('b5ConfSum', [
      { key: 'ind', label: L2('Planta', 'Plant'), get: r => r.all ? `<b>${esc(r.ind)}</b>` : esc(r.ind), html: true },
      { key: 'c', label: L2('Células', 'Cells'), num: true, get: r => r.S.cells },
    ].concat(CLASSES.map(c => ({ key: c.es, label: L2(c.es, c.en), num: true, get: r => fmtFixed(per(r.S, c.ks), 2) })))
      .concat([{ key: 'x', label: L2('Quiasmas / célula', 'Chiasmata / cell'), num: true, html: true, get: r => msHtml(r.S.xta.mean, r.S.xta.sd) },
        { key: 'xb', label: L2('Quiasmas / bivalente', 'Chiasmata / bivalent'), num: true, get: r => fmtFixed(r.S.xtaPerBiv, 2) },
        { key: 'ri', label: L2('Índice de recombinación', 'Recombination index'), num: true, get: r => fmtFixed(r.S.RI, 2) },
        { key: 'mv', label: L2('% con multivalentes', '% with multivalents'), num: true, get: r => fmtPct(r.S.withMult, 0) }]), sums, { className: 'fit' });
    el('b5ConfFig').innerHTML = Chart.bars({
      categories: CLASSES.map(c => T(c.es, c.en)),
      series: sums.filter(s => !s.all || inds.length === 1).map(s => ({ name: s.ind, values: CLASSES.map(c => per(s.S, c.ks)), err: CLASSES.map(c => c.ks.length === 1 ? s.S.per[c.ks[0]].sd : NaN) })),
      ylab: T('configuraciones por célula (media ± de)', 'configurations per cell (mean ± sd)'), title: accName(cur), forceLegend: true,
      aria: T('Configuraciones por célula', 'Configurations per cell'),
    });
    if (S.chrVaries) showMessage('b5ConfMsg', 'warning', T(`No todas las células suman ${S.chr} cromosomas.`, `Not every cell adds up to ${S.chr} chromosomes.`),
      T('Revisa las filas: la columna «Cromosomas» suma los de cada configuración.', 'Check the rows: the “Chromosomes” column adds up those of each configuration.'));
    renderHyp();
  }

  /* ---------------- hypotheses ---------------- */
  function defaults() {
    const a = accession(cur), recs = ofAcc(M().configs);
    const x = a && a.x, n2 = 2 * haploid(recs);
    if (!(x > 0) || !(n2 > 0)) return null;
    const L = Math.round(n2 / x);
    const h1 = Meiosis.formulaFor(L, 'auto'), h2 = L >= 3 ? Meiosis.formulaFor(L, 'allo') : '';
    return { x, n2, L, h1, h2, h3: a.formula && a.formula !== h1 && a.formula !== h2 ? a.formula : '' };
  }
  /* the formulas between autopolyploid and strict allopolyploid of a level L:
     the genomes split into groups of two or more copies, other than one group
     of L (AAAA…) and all groups of two (AABB…); for 6x, AAAABB and AAABBB */
  function intermediates(L) {
    const out = [];
    const part = (left, max, acc) => {
      if (!left) { if (acc.length > 1 && acc.some(k => k > 2)) out.push(acc.map((k, i) => 'ABCDEFGH'[i].repeat(k)).join('')); return; }
      for (let k = Math.min(left, max); k >= 2; k--) part(left - k, k, acc.concat([k]));
    };
    if (L >= 5 && L <= 8) part(L, L - 2, []);
    return out;
  }
  function renderHyp() {
    clearMessages('b5HypMsg');
    const recs = ofAcc(M().configs), a = accession(cur);
    el('b5CFixWrap').hidden = el('b5CMode').value !== 'fix';
    if (!recs.length) { el('b5Hyp').innerHTML = ''; el('b5HypFig').innerHTML = ''; return; }
    const D = defaults();
    if (!D) { showMessage('b5HypMsg', 'info', T('Escribe el número básico x de la accesión para plantear las hipótesis.', 'Type the base number x of the accession to set out the hypotheses.')); el('b5Hyp').innerHTML = ''; el('b5HypFig').innerHTML = ''; return; }
    if (!el('b5H1').value) el('b5H1').value = D.h1;
    if (!el('b5H2').value && D.h2) el('b5H2').value = D.h2;
    if (!el('b5H3').value && D.h3) el('b5H3').value = D.h3;
    const H = ['b5H1', 'b5H2', 'b5H3'].map(id => el(id).value.replace(/[^A-Za-z]/g, '').toUpperCase()).filter(Boolean);
    const S = Meiosis.summarize(recs, { n: D.n2 / 2 });
    const res = [];
    H.forEach(f => {
      if (f.length * D.x !== D.n2) { showMessage('b5HypMsg', 'warning', T(`La fórmula ${f} con x = ${D.x} da 2n = ${f.length * D.x}, pero las células tienen ${D.n2}.`, `Formula ${f} with x = ${D.x} gives 2n = ${f.length * D.x}, but the cells have ${D.n2}.`)); return; }
      if (f.length > 8) { showMessage('b5HypMsg', 'warning', T('Las fórmulas admiten hasta ocho genomas.', 'Formulas take up to eight genomes.')); return; }
      const est = el('b5CMode').value === 'est';
      const c = est ? Meiosis.estimateC(S.xta.mean, f, D.x) : Math.max(0, Math.min(1, num(el('b5CFix').value)));
      res.push({ f, c, C: Meiosis.compare(recs, f, D.x, c, { cEstimated: est }) });
    });
    if (!res.length) { el('b5Hyp').innerHTML = ''; el('b5HypFig').innerHTML = ''; return; }
    const N = recs.length;
    const head = `<tr><th>${L2('Configuración', 'Configuration')}</th><th class="num">${L2('Observadas', 'Observed')}</th>` + res.map(r => `<th class="num">${L2('Esperadas', 'Expected')} ${esc(r.f)}</th>`).join('') + '</tr>';
    const body = CLASSES.map((c, i) => `<tr><td>${L2(c.es, c.en)}</td><td class="num">${res[0].C.obs[i]}</td>` + res.map(r => `<td class="num">${fmtFixed(r.C.exp[i], 1)}</td>`).join('') + '</tr>').join('');
    const best = res.slice().sort((a, b) => (b.C.test.p || 0) - (a.C.test.p || 0))[0];
    const foot = ['c', 'chi', 'gl', 'p'].map(k => `<tr><td><b>${k === 'c' ? 'c' : k === 'chi' ? 'χ²' : k === 'gl' ? L2('g. l.', 'd.f.') : 'p'}</b></td><td></td>` + res.map(r =>
      `<td class="num">${k === 'c' ? fmtFixed(r.c, 3) : k === 'chi' ? fmtFixed(r.C.test.chi2, 2) : k === 'gl' ? r.C.test.df : (r.C.impossible ? `<b>${L2('rechazada', 'rejected')}</b>` : `<b>${fmtP(r.C.test.p)}</b>`)}</td>`).join('') + '</tr>').join('');
    el('b5Hyp').innerHTML = `<table class="fit"><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table>` +
      `<p class="hint">${L2(`${plural(N, 'célula', 'células')}. Las clases con menos de 5 esperadas se juntan con su vecina antes de la prueba χ²${el('b5CMode').value === 'est' ? '; c se estimó de los quiasmas observados, lo que resta un grado de libertad' : ''}.`, `${plural(N, 'cell', 'cells')}. Classes with fewer than 5 expected are pooled with their neighbor before the χ² test${el('b5CMode').value === 'est' ? '; c was estimated from the observed chiasmata, which takes one degree of freedom' : ''}.`)}</p>`;
    res.filter(r => r.C.impossible).forEach(r => showMessage('b5HypMsg', 'info', T(`${r.f} no permite ${r.C.impossible} de las configuraciones observadas (multivalentes donde sólo caben bivalentes): queda rechazada sin más.`, `${r.f} does not allow ${r.C.impossible} of the observed configurations (multivalents where only bivalents fit): it is rejected outright.`)));
    const fits = res.filter(r => r.C.test.p >= 0.05);
    const others = res.filter(r => r !== fits[0]).map(r => r.f);
    if (fits.length === 1) showMessage('b5HypMsg', 'success', others.length
      ? T(`Los datos se ajustan a ${fits[0].f} (${pEq(fits[0].C.test.p)}) y no a ${others.join(' ni a ')}.`, `The data fit ${fits[0].f} (${pEq(fits[0].C.test.p)}) and not ${others.join(' nor ')}.`)
      : T(`Los datos se ajustan a ${fits[0].f} (${pEq(fits[0].C.test.p)}).`, `The data fit ${fits[0].f} (${pEq(fits[0].C.test.p)}).`));
    else if (!fits.length) {
      /* the intermediate formulas of this level not tried yet (none for a tetraploid) */
      const todo = intermediates(D.L).filter(f => !H.includes(f)).slice(0, 2);
      const tried = intermediates(D.L).filter(f => H.includes(f));
      showMessage('b5HypMsg', 'warning', T(`Ninguna hipótesis se ajusta (la mejor: ${best.f}, ${pEq(best.C.test.p)}).`, `No hypothesis fits (the best: ${best.f}, ${pEq(best.C.test.p)}).`),
        T('Rechazar la autopoliploidía puede indicar control genético del apareamiento o algún tipo de alopoliploidía (Jackson y Casey 1982)', 'Rejecting autopolyploidy may indicate genetic control of pairing or some kind of allopolyploidy (Jackson and Casey 1982)') +
        (todo.length ? T(`; prueba una fórmula intermedia (${todo.join(' o ')}).`, `; try an intermediate formula (${todo.join(' or ')}).`)
          : tried.length ? T(`; las fórmulas intermedias de este nivel (${tried.join(', ')}) tampoco se ajustan.`, `; the intermediate formulas of this level (${tried.join(', ')}) do not fit either.`) : '.'));
    }
    else showMessage('b5HypMsg', 'info', T(`Más de una hipótesis se ajusta (${fits.map(r => r.f + ', ' + pEq(r.C.test.p)).join('; ')}): hacen falta más células para decidir.`, `More than one hypothesis fits (${fits.map(r => r.f + ', ' + pEq(r.C.test.p)).join('; ')}): more cells are needed to decide.`));
    el('b5HypFig').innerHTML = Chart.bars({
      categories: CLASSES.map(c => T(c.es, c.en)),
      series: [{ name: T('Observadas', 'Observed'), values: res[0].C.obs.map(v => v / N), color: 'var(--text-muted)' }].concat(res.map((r, k) => ({ name: r.f, values: r.C.exp.map(v => v / N), color: Chart.PAL[k % 6] }))),
      ylab: T('por célula', 'per cell'), forceLegend: true, aria: T('Observado y esperado por célula', 'Observed and expected per cell'),
    });
    state.results.meiosisHyp = { acc: cur, res: res.map(r => ({ f: r.f, c: r.c, chi2: r.C.test.chi2, df: r.C.test.df, p: r.C.test.p })) };
  }

  /* ---------------- phases, tetrads, pollen ---------------- */
  function renderPhases() {
    const A = Meiosis.abnormalities(ofAcc(M().phases));
    if (!A.length) { el('b5PhaseSum').innerHTML = ''; el('b5PhaseFig').innerHTML = ''; return; }
    const name = k => { const p = Meiosis.PHASES.find(x => x.k === k); return p ? T(p.es, p.en) : k; };
    buildTable('b5PhaseSum', [{ key: 'phase', label: L2('Fase', 'Phase'), get: r => name(r.phase) }, { key: 'total', label: L2('Células', 'Cells'), num: true },
      { key: 'normal', label: L2('Normales', 'Normal'), num: true }].concat(Meiosis.ABN.map(a => ({ key: a.f, label: L2(a.es, a.en), num: true, get: r => r.cats[a.f] })))
      .concat([{ key: 'pct', label: L2('% anormales', '% abnormal'), num: true, get: r => fmtFixed(r.pct, 1) }]), A, { className: 'fit' });
    el('b5PhaseFig').innerHTML = Chart.bars({ categories: A.map(r => r.phase), series: [{ name: T('% anormales', '% abnormal'), values: A.map(r => r.pct) }], ylab: T('células anormales (%)', 'abnormal cells (%)'), values: true, valueDigits: 1, aria: T('Anormalidades por fase', 'Abnormalities by phase') });
  }
  function renderTetrads() {
    const rows = ofAcc(M().tetrads);
    if (!rows.length) { el('b5TetSum').innerHTML = ''; return; }
    const ab = r => (+r.micronuclei || 0) + (+r.dyads || 0) + (+r.triads || 0) + (+r.polyads || 0);
    const res = rows.map(r => { const n = (+r.normal || 0) + ab(r); return { ind: r.ind, n, normal: +r.normal || 0, mi: Meiosis.meioticIndex(+r.normal || 0, n) }; }).filter(r => r.n > 0);
    const tot = res.reduce((a, r) => ({ n: a.n + r.n, normal: a.normal + r.normal }), { n: 0, normal: 0 });
    if (res.length > 1) res.push({ ind: T('Accesión', 'Accession'), all: true, n: tot.n, normal: tot.normal, mi: Meiosis.meioticIndex(tot.normal, tot.n) });
    const test = rows.length > 1 ? Stats.contingency(rows.map(r => [+r.normal || 0, ab(r)])) : null;
    buildTable('b5TetSum', [{ key: 'ind', label: L2('Planta', 'Plant'), get: r => r.all ? `<b>${esc(r.ind)}</b>` : esc(r.ind), html: true },
      { key: 'n', label: L2('Tétradas', 'Tetrads'), num: true }, { key: 'normal', label: L2('Normales', 'Normal'), num: true },
      { key: 'mi', label: L2('Índice meiótico (%)', 'Meiotic index (%)'), num: true, get: r => fmtFixed(r.mi.MI, 1) },
      { key: 'ci', label: L2('Intervalo 95 % (Wilson)', '95 % interval (Wilson)'), num: true, get: r => fmtFixed(r.mi.lo, 1) + ' – ' + fmtFixed(r.mi.hi, 1) },
      { key: 'st', label: L2('Estable (≥ 90)', 'Stable (≥ 90)'), get: r => r.mi.MI >= 90 ? `<span class="badge ok">${L2('sí', 'yes')}</span>` : `<span class="badge warn">${L2('no', 'no')}</span>`, html: true }], res,
      { className: 'fit', foot: test ? `<tr><td colspan="6" class="hint">${L2(`Homogeneidad entre plantas: χ² = ${fmtFixed(test.chi2, 2)}, g. l. = ${test.df}, ${pEq(test.p)}.`, `Homogeneity among plants: χ² = ${fmtFixed(test.chi2, 2)}, d.f. = ${test.df}, ${pEq(test.p)}.`)}</td></tr>` : '' });
  }
  function renderPollen() {
    const conf = +el('b5Conf2').value || 0.95;
    clearMessages('b5PolMsg');
    const P = Meiosis.pollen(ofAcc(M().pollen), conf);
    if (!P.rows.length) { el('b5PolTiles').innerHTML = ''; el('b5PolSum').innerHTML = ''; el('b5PolFig').innerHTML = ''; return; }
    const pc = Math.round(conf * 100);
    statTiles('b5PolTiles', [
      [T('Granos contados', 'Grains counted'), P.n, P.rows.length + T(' plantas', ' plants')],
      [T('Viabilidad', 'Viability'), fmtPct(P.p, 1), `${pc} %: ${fmtPct(P.wilson.lo, 1)} – ${fmtPct(P.wilson.hi, 1)}`],
      [T('Homogeneidad entre plantas', 'Homogeneity among plants'), P.test ? pEq(P.test.p) : '—', P.test ? `χ² = ${fmtFixed(P.test.chi2, 2)} · G = ${fmtFixed(P.test.G, 2)} · ${T('g. l.', 'd.f.')} ${P.test.df}` : '', P.test && P.test.p < 0.05 ? 'warn' : null],
    ]);
    buildTable('b5PolSum', [{ key: 'id', label: L2('Planta', 'Plant'), get: r => r.id }, { key: 'n', label: L2('Granos', 'Grains'), num: true },
      { key: 'viable', label: L2('Viables', 'Viable'), num: true }, { key: 'p', label: L2('% viables', '% viable'), num: true, get: r => fmtFixed(100 * r.p, 1) },
      { key: 'w', label: L2(`Wilson ${pc} %`, `Wilson ${pc} %`), num: true, get: r => fmtFixed(100 * r.wilson.lo, 1) + ' – ' + fmtFixed(100 * r.wilson.hi, 1) },
      { key: 'cp', label: L2(`Clopper–Pearson ${pc} %`, `Clopper–Pearson ${pc} %`), num: true, get: r => fmtFixed(100 * r.cp.lo, 1) + ' – ' + fmtFixed(100 * r.cp.hi, 1) }], P.rows, { className: 'fit' });
    el('b5PolFig').innerHTML = Chart.bars({ categories: P.rows.map(r => r.id), series: [{ name: T('% viables', '% viable'), values: P.rows.map(r => 100 * r.p), lo: P.rows.map(r => 100 * r.wilson.lo), hi: P.rows.map(r => 100 * r.wilson.hi) }],
      yMax: 100, ylab: T(`polen viable (%), intervalo de Wilson ${pc} %`, `viable pollen (%), Wilson ${pc} % interval`), rotate: P.rows.length > 6, aria: T('Viabilidad del polen', 'Pollen viability') });
    if (P.test && P.test.p < 0.05) showMessage('b5PolMsg', 'info', T('Las plantas difieren en su viabilidad: conviene informarlas por separado.', 'The plants differ in viability: report them separately.'));
    /* comparison among accessions */
    const accs = state.accessions.filter(a => M().pollen.some(r => r.acc === a.id));
    if (accs.length > 1) {
      const t = Stats.contingency(accs.map(a => { const q = Meiosis.pollen(M().pollen.filter(r => r.acc === a.id)); return [q.viable, q.n - q.viable]; }));
      showMessage('b5PolMsg', 'info', T(`Entre las ${accs.length} accesiones: χ² = ${fmtFixed(t.chi2, 2)}, g. l. = ${t.df}, ${pEq(t.p)}.`, `Among the ${accs.length} accessions: χ² = ${fmtFixed(t.chi2, 2)}, d.f. = ${t.df}, ${pEq(t.p)}.`));
    }
    state.results.pollenStain = el('b5Stain').value;
  }

  /* ---------------- shell ---------------- */
  function render() {
    if (!state.accessions.length) newAccession();
    cur = accOptions(el('b5AccSel'), cur || (state.accessions.find(a => M().configs.some(r => r.acc === a.id)) || state.accessions[0]).id);
    const a = accession(cur);
    el('b5X').value = a && a.x ? a.x : '';
    Object.values(grids).forEach(g => g.render());
    renderConf(); renderPhases(); renderTetrads(); renderPollen();
    blockDone();
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (!el('panel-5')) return;
    makeGrids();
    el('b5AccSel').addEventListener('change', e => { cur = e.target.value; ['b5H1', 'b5H2', 'b5H3'].forEach(id => { el(id).value = ''; }); render(); });
    el('b5AccNew').addEventListener('click', () => { const a = newAccession(); cur = a.id; render(); });
    el('b5X').addEventListener('change', e => { const a = accession(cur); if (a) { const v = num(e.target.value); a.x = v > 0 ? Math.round(v) : null; ['b5H1', 'b5H2'].forEach(id => { el(id).value = ''; }); renderHyp(); changed(); } });
    ['b5H1', 'b5H2', 'b5H3', 'b5CFix'].forEach(id => el(id).addEventListener('change', renderHyp));
    el('b5CMode').addEventListener('change', renderHyp);
    ['b5Conf2', 'b5Stain'].forEach(id => el(id).addEventListener('change', renderPollen));
    el('b5PolFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) importPalyno(f); });
    el('panel-5').addEventListener('click', e => { const x = e.target.closest('[data-example]'); if (x) Examples.open(x.dataset.example); });
  });
  document.addEventListener('stepchange', e => { if (e.detail.step === 5) render(); });
  document.addEventListener('projectchange', () => { cur = null; ['b5H1', 'b5H2', 'b5H3'].forEach(id => { const n = el(id); if (n) n.value = ''; }); });
  document.addEventListener('langchange', () => { if (el('panel-5') && el('panel-5').classList.contains('active')) render(); });

  window.Block5 = { render, CLASSES, intermediates, get acc() { return cur; } };
})();
