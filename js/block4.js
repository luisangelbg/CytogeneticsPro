/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 4, asymmetry and karyological parameters.
   For every accession with a karyotype (Block 3): the twelve indices of
   Asym, on the means of the pairs or cell by cell (mean ± sd), the Stebbins
   category, the grid of Stebbins with all the accessions, the scatter of any
   two indices (MCA × CVCL by default), the Gower dissimilarity among the
   accessions and what each index measures. state.asym[accession] keeps the
   result for Blocks 8 and 10. */
(function () {
  'use strict';
  let disVars = ['MCA', 'CVCL', 'CVCI'];
  const NUM = ['n2', 'THL', 'ratioLS'].concat(['TF', 'AsK', 'Syi', 'A1', 'A', 'MCA', 'CVCI', 'Rec', 'A2', 'CVCL', 'AI', 'DI']);
  const nameOf = k => { const m = Asym.INDICES.find(x => x.k === k); return m ? m.name : k === 'THL' ? T('Longitud de un juego', 'Length of one set') : k === 'n2' ? '2n' : k === 'ratioLS' ? T('Mayor / menor', 'Longest / shortest') : k; };
  const digits = k => ['A1', 'A2', 'A'].includes(k) ? 3 : 2;
  const opts = () => ({ mode: state.settings.asymMode || 'pairs', pop: !!state.settings.pop });

  /* ---------------- computing ---------------- */
  function compute(acc) {
    const K = window.Block3 ? Block3.karyo(acc) : null;
    if (!K) { if (state.asym) delete state.asym[acc]; return null; }
    const o = opts();
    let res;
    if (o.mode === 'cells' && K.cells.length) {
      const per = K.cells.map(c => Asym.compute(c.groups.filter(Boolean).flatMap(g => g.homolog.map(h => ({ s: h.s, l: h.l }))), { pop: o.pop })).filter(Boolean);
      const R = {}, sd = {};
      Asym.ORDER.concat(['THL', 'ratioLS', 'CG', 'meanCI']).forEach(k => {
        const v = per.map(p => p[k]).filter(x => isFinite(x));
        R[k] = v.length ? Stats.mean(v) : NaN; sd[k] = v.length > 1 ? Stats.sd(v, o.pop) : NaN;
      });
      const st = Stats.modes(per.map(p => p.stebbins));
      R.stebbins = st.modes.join('/'); R.stebbinsAll = per.map(p => p.stebbins);
      R.n = per.length;
      res = { acc, mode: 'cells', R, sd, per };
    } else res = { acc, mode: 'pairs', R: Asym.compute(K.pairs.map(p => ({ s: p.s.mean, l: p.l.mean })), { pop: o.pop }), sd: null };
    res.R.n2 = K.n2; res.unit = K.unit; res.formula = K.formula;
    state.asym = state.asym || {};
    state.asym[acc] = res;
    return res;
  }
  const asym = acc => (state.asym && state.asym[acc]) || compute(acc);
  const ready = () => state.accessions.filter(a => window.Block3 && Block3.cellsFor(a.id).length);
  const val = (r, k) => r.R[k];
  const show = (r, k) => { const v = r.R[k]; if (!isFinite(v)) return '—'; const s = r.sd && isFinite(r.sd[k]) ? r.sd[k] : null; return s != null ? fmtMS(v, s, digits(k)) : fmtFixed(v, digits(k)); };

  /* ---------------- rendering ---------------- */
  function render() {
    const accs = ready();
    el('b4Empty').hidden = !!accs.length;
    el('b4Work').hidden = !accs.length;
    if (!accs.length) return;
    const o = opts();
    el('b4Mode').value = o.mode; el('b4Pop').value = o.pop ? '1' : '0';
    const rows = accs.map(a => asym(a.id)).filter(Boolean);
    renderTable(rows);
    renderStebbins(rows);
    renderScatter(rows);
    renderDis(rows);
    renderInfo();
    state.results.asym = Date.now();
    blockDone();
  }
  function renderTable(rows) {
    const set = el('b4Set').value;
    const ks = set === 'rec' ? ['MCA', 'CVCL', 'CVCI'] : Asym.ORDER;
    const cols = [
      { key: 'a', label: L2('Accesión', 'Accession'), get: r => accName(r.acc) },
      { key: 'n2', label: '2n', num: true, get: r => r.R.n2 },
      { key: 'THL', label: L2('Juego', 'Set') + ' (' + rows[0].unit + ')', num: true, get: r => show(r, 'THL') },
    ].concat(ks.map(k => {
      const m = Asym.INDICES.find(x => x.k === k);
      return { key: k, label: `<abbr title="${esc(m.f + ' — ' + m.ref)}">${esc(m.name)}</abbr>${m.recommended ? ' ★' : ''}`, num: true, get: r => show(r, k) };
    })).concat([{ key: 'st', label: 'Stebbins', get: r => r.R.stebbins }]);
    buildTable('b4Table', cols, rows, { foot: `<tr><td colspan="${cols.length}" class="hint">${L2(
      `★ recomendados (Peruzzi y Eroğlu 2013). ${rows[0].mode === 'cells' ? 'Media ± de entre células' : 'Sobre las medias de los pares'}; desviación ${opts().pop ? 'poblacional (n)' : 'muestral (n − 1)'}.`,
      `★ recommended (Peruzzi and Eroğlu 2013). ${rows[0].mode === 'cells' ? 'Mean ± sd among cells' : 'On the means of the pairs'}; ${opts().pop ? 'population (n)' : 'sample (n − 1)'} deviation.`)}</td></tr>` });
    const mca = rows.map(r => r.R.MCA).filter(isFinite), cvcl = rows.map(r => r.R.CVCL).filter(isFinite);
    statTiles('b4Tiles', [
      [T('Accesiones', 'Accessions'), rows.length],
      ['MCA', mca.length > 1 ? fmtFixed(Math.min(...mca), 1) + ' – ' + fmtFixed(Math.max(...mca), 1) : fmtFixed(mca[0], 1), T('asimetría intracromosómica', 'intrachromosomal asymmetry')],
      ['CVCL', cvcl.length > 1 ? fmtFixed(Math.min(...cvcl), 1) + ' – ' + fmtFixed(Math.max(...cvcl), 1) : fmtFixed(cvcl[0], 1), T('asimetría intercromosómica', 'interchromosomal asymmetry')],
      [T('Categorías de Stebbins', 'Stebbins categories'), [...new Set(rows.map(r => r.R.stebbins))].join(', ')],
    ]);
    clearMessages('b4Msg');
    rows.filter(r => !isFinite(r.R.CVCI)).forEach(r => showMessage('b4Msg', 'info', T(`En «${esc(accName(r.acc))}» todos los cromosomas son telocéntricos: CVCI no está definido (0/0).`, `In «${esc(accName(r.acc))}» every chromosome is telocentric: CVCI is undefined (0/0).`)));
    rows.filter(r => r.mode === 'cells' && r.R.stebbinsAll && new Set(r.R.stebbinsAll).size > 1).forEach(r => showMessage('b4Msg', 'info',
      T(`«${esc(accName(r.acc))}» cae en categorías de Stebbins distintas según la célula (${r.R.stebbinsAll.join(', ')}); se muestra la más frecuente.`, `«${esc(accName(r.acc))}» falls in different Stebbins categories depending on the cell (${r.R.stebbinsAll.join(', ')}); the most frequent is shown.`)));
  }
  /* the grid of Stebbins with every accession, numbered, and its legend */
  function stebbinsSvg(rows) {
    const x0 = 70, y0 = 44, cw = 74, ch = 52, font = 12;
    const items = rows.map((r, i) => ({ cls: String(r.R.stebbins).split('/')[0], color: accColor(r.acc), label: (i + 1) + ' · ' + accName(r.acc), n: i + 1 }));
    const W = Math.max(x0 + 4 * cw + 20, 40 + Math.max(...items.map(it => it.label.length)) * font * 0.6), H = y0 + 3 * ch + 40 + items.length * (font + 7);
    let g = `<text class="ttl" x="${x0}" y="18" font-size="13">${esc(T('Categorías de Stebbins (1971)', 'Stebbins (1971) categories'))}</text>`;
    ['A', 'B', 'C'].forEach((rw, ri) => ['1', '2', '3', '4'].forEach((cl, ci) => {
      const here = items.filter(it => it.cls === cl + rw);
      const x = x0 + ci * cw, y = y0 + ri * ch;
      g += `<rect x="${x}" y="${y}" width="${cw - 4}" height="${ch - 4}" rx="6" fill="${here.length ? 'color-mix(in srgb, var(--primary) 9%, var(--card-bg))' : 'var(--card-bg)'}" stroke="var(--border-strong)"/>` +
        `<text class="mut" x="${x + 6}" y="${y + 14}" font-size="11">${cl}${rw}</text>`;
      here.forEach((it, k) => {
        const cx = x + 18 + (k % 4) * 14, cy = y + 28 + Math.floor(k / 4) * 14;
        g += `<circle cx="${cx}" cy="${cy}" r="6.5" fill="${it.color}"/><text x="${cx}" y="${cy + 3.5}" font-size="9" text-anchor="middle" fill="var(--card-bg)" font-weight="700">${it.n}</text>`;
      });
    }));
    ['< 2', '2–4', '> 4'].forEach((t, i) => { g += `<text class="tick" data-role="ytick" x="${x0 - 8}" y="${y0 + i * ch + ch / 2 + 2}" font-size="11" text-anchor="end">${t}</text>`; });
    ['1.00', '0.99–0.51', '0.50–0.01', '0.00'].forEach((t, i) => { g += `<text class="tick" data-role="xtick" x="${x0 + i * cw + cw / 2 - 2}" y="${y0 - 8}" font-size="10" text-anchor="middle">${t}</text>`; });
    g += `<text class="flab" data-role="ylab" transform="translate(16 ${y0 + 1.5 * ch}) rotate(-90)" font-size="11" text-anchor="middle">${esc(T('mayor / menor', 'longest / shortest'))}</text>`;
    g += `<text class="flab" data-role="xlab" x="${x0 + 2 * cw}" y="${y0 + 3 * ch + 14}" font-size="11" text-anchor="middle">${esc(T('proporción de cromosomas con r < 2', 'proportion of chromosomes with r < 2'))}</text>`;
    g += Chart.legend(items.map(it => ({ label: it.label, color: it.color })), x0, y0 + 3 * ch + 38, font);
    return `<svg xmlns="http://www.w3.org/2000/svg" class="fig" viewBox="0 0 ${Math.ceil(W)} ${Math.ceil(H)}" width="${Math.ceil(W)}" height="${Math.ceil(H)}" role="img" data-plot="${x0} ${y0} ${4 * cw} ${3 * ch}" aria-label="${esc(T('Cuadrícula de Stebbins con las accesiones', 'Stebbins grid with the accessions'))}">${g}</svg>`;
  }
  function renderStebbins(rows) { el('b4Steb').innerHTML = stebbinsSvg(rows); }
  function axisOptions() {
    const ks = Asym.ORDER.concat(['THL', 'n2']);
    ['b4X', 'b4Y'].forEach((id, i) => {
      const s = el(id), cur = s.value || (i ? state.settings.asymY || 'CVCL' : state.settings.asymX || 'MCA');
      s.innerHTML = ks.map(k => `<option value="${k}">${esc(nameOf(k))}</option>`).join('');
      s.value = cur;
    });
  }
  function scatterSvg(rows, xk, yk) {
    const pts = rows.map((r, i) => ({ x: val(r, xk), y: val(r, yk), label: String(i + 1), color: accColor(r.acc) }));
    return Chart.scatter({ points: pts, xlab: nameOf(xk), ylab: nameOf(yk), title: nameOf(xk) + ' × ' + nameOf(yk), height: 380,
      legend: rows.map((r, i) => ({ label: (i + 1) + ' · ' + accName(r.acc), color: accColor(r.acc) })),
      aria: T('Dispersión de ', 'Scatter of ') + nameOf(xk) + ' × ' + nameOf(yk) });
  }
  function renderScatter(rows) {
    axisOptions();
    el('b4Scatter').innerHTML = scatterSvg(rows, el('b4X').value, el('b4Y').value);
  }
  function renderDis(rows) {
    const chips = el('b4DisVars');
    chips.innerHTML = Asym.ORDER.concat(['THL']).map(k => `<button type="button" class="chip${disVars.includes(k) ? ' on' : ''}" data-k="${k}" aria-pressed="${disVars.includes(k)}">${esc(nameOf(k))}</button>`).join('');
    if (rows.length < 2) { el('b4Dis').innerHTML = `<p class="hint">${L2('Hacen falta al menos dos accesiones.', 'At least two accessions are needed.')}</p>`; return; }
    const D = Stats.gower(rows.map(r => disVars.map(k => val(r, k))));
    const head = '<tr><th></th>' + rows.map((r, i) => `<th class="num" title="${esc(accName(r.acc))}">${i + 1}</th>`).join('') + '</tr>';
    const body = rows.map((r, i) => `<tr><th scope="row">${i + 1} · ${esc(accName(r.acc))}</th>` + rows.map((_, j) => `<td class="num${i === j ? ' muted' : ''}">${i === j ? '—' : fmtFixed(D[i][j], 3)}</td>`).join('') + '</tr>').join('');
    el('b4Dis').innerHTML = `<table class="dis"><thead>${head}</thead><tbody>${body}</tbody></table>`;
  }
  function renderInfo() {
    const kind = { intra: ['intracromosómica', 'intrachromosomal'], inter: ['intercromosómica', 'interchromosomal'], both: ['las dos', 'both'] };
    el('b4Info').innerHTML = Asym.INDICES.map((m, i) => `<details class="acc"${i < 1 ? ' open' : ''}><summary>${esc(m.name)} <span class="acc-tag">${L2(kind[m.kind][0], kind[m.kind][1])}${m.recommended ? ' · ★' : ''}${m.historical ? ' · ' + L2('histórico', 'historical') : ''}${m.redundant ? ' · ' + L2('redundante', 'redundant') : ''}</span></summary>` +
      `<div class="acc-body"><p><code>${esc(m.f)}</code> · ${esc(m.ref)}</p><p>${L2(m.es, m.en)}</p></div></details>`).join('');
  }
  /* CSV with every index of every accession */
  function csvRows() {
    const rows = ready().map(a => asym(a.id)).filter(Boolean);
    const ks = Asym.ORDER;
    const head = [T('accesión', 'accession'), T('taxón', 'taxon'), '2n', 'THL'].concat(ks).concat(rows.some(r => r.sd) ? ks.map(k => k + '_sd') : []).concat(['Stebbins', T('modo', 'mode')]);
    return [head].concat(rows.map(r => {
      const A = accession(r.acc) || {};
      return [A.name || '', A.taxon || '', r.R.n2, +r.R.THL.toFixed(4)].concat(ks.map(k => isFinite(r.R[k]) ? +r.R[k].toFixed(6) : ''))
        .concat(r.sd ? ks.map(k => isFinite(r.sd[k]) ? +r.sd[k].toFixed(6) : '') : (rows.some(x => x.sd) ? ks.map(() => '') : [])).concat([r.R.stebbins, r.mode]);
    }));
  }

  /* ---------------- events ---------------- */
  function invalidate() { state.asym = {}; render(); }
  document.addEventListener('DOMContentLoaded', () => {
    if (!el('panel-4')) return;
    el('b4Mode').addEventListener('change', e => { state.settings.asymMode = e.target.value; invalidate(); });
    el('b4Pop').addEventListener('change', e => { state.settings.pop = e.target.value === '1'; state.karyo = {}; invalidate(); });
    el('b4Set').addEventListener('change', render);
    ['b4X', 'b4Y'].forEach(id => el(id).addEventListener('change', () => { state.settings.asymX = el('b4X').value; state.settings.asymY = el('b4Y').value; el('b4Scatter').innerHTML = scatterSvg(ready().map(a => asym(a.id)).filter(Boolean), el('b4X').value, el('b4Y').value); }));
    el('b4DisVars').addEventListener('click', e => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      disVars = disVars.includes(k) ? disVars.filter(x => x !== k) : disVars.concat([k]);
      if (!disVars.length) disVars = [k];
      renderDis(ready().map(a => asym(a.id)).filter(Boolean));
    });
    el('b4Csv').addEventListener('click', () => download(toDelimited(csvRows()), 'indices_asimetria.csv', 'text/csv;charset=utf-8'));
    el('b4Tsv').addEventListener('click', () => download(toDelimited(csvRows(), '\t'), 'indices_asimetria.tsv', 'text/tab-separated-values;charset=utf-8'));
    el('panel-4').addEventListener('click', e => {
      const g = e.target.closest('[data-goto]'); if (g) goStep(g.dataset.goto);
      const x = e.target.closest('[data-example]'); if (x) Examples.open(x.dataset.example);
    });
  });
  document.addEventListener('stepchange', e => { if (e.detail.step === 4) render(); });
  document.addEventListener('datachange', () => { state.asym = {}; });
  document.addEventListener('projectchange', () => { state.asym = {}; });
  document.addEventListener('langchange', () => { if (el('panel-4') && el('panel-4').classList.contains('active')) render(); });

  window.Block4 = { compute, asym, ready, render, csvRows, stebbinsSvg, scatterSvg, nameOf };
})();
