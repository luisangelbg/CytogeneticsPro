/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 3, the karyotype.
   For each accession: the measured cells → Karyo.build with the settings of
   this block; the board where the homologues of each cell are checked and
   corrected (drag one chromosome onto another to swap them, or select one and
   then the other); the karyotype table, its formula and totals; the idiogram.
   state.karyo[accession] keeps the result for Blocks 4, 7, 8 and 10. */
(function () {
  'use strict';
  let curAcc = null, curCell = null, selChr = null;
  const thumbs = new Map();       // straightened chromosome images, by trace

  /* ---------------- computing ---------------- */
  function settings() {
    const s = state.settings;
    let scheme = s.scheme;
    if (scheme === 'custom' && s.custom) scheme = s.custom;
    return { k: +s.k || 2, scheme, includeSat: s.includeSat !== false, strict: !!s.strict, stArms: +s.stArms || 1, pop: !!s.pop, order: s.order || 'length', satInFormula: s.satInFormula !== false };
  }
  const accCells = acc => state.cells.filter(c => c.acc === acc);
  /* the cells of an accession as the karyotype engine wants them */
  function cellsFor(acc) {
    return accCells(acc).map(c => ({ id: c.id, label: c.label, chromosomes: Img.cellMeasurements(c), groups: c.groups })).filter(c => c.chromosomes.length);
  }
  function unitOf(acc) {
    const cs = accCells(acc).filter(c => Img.cellMeasurements(c).length);
    const px = cs.filter(c => c.image && c.chromosomes.some(x => x.trace) && !Img.umPerPx(c)).length;
    return { unit: px && px === cs.length ? 'px' : 'µm', mixed: px > 0 && px < cs.length };
  }
  /* the karyotype of an accession (kept in state.karyo until its data change) */
  function compute(acc) {
    state.karyo = state.karyo || {};
    const a = accession(acc);
    const cells = cellsFor(acc);
    if (!a || !cells.length) { delete state.karyo[acc]; return null; }
    const o = Object.assign(settings(), { x: +a.x || null });
    let K = null;
    try { K = Karyo.build(cells, o); } catch (e) { console.error(e); K = null; }
    if (K) { K.acc = acc; K.unit = unitOf(acc).unit; K.cellLabels = Object.fromEntries(accCells(acc).map(c => [c.id, c.label])); }
    if (K) state.karyo[acc] = K; else delete state.karyo[acc];
    return K;
  }
  function computeAll() { state.accessions.forEach(a => compute(a.id)); state.results.karyo = Date.now(); blockDone(); }
  const karyo = acc => (state.karyo && state.karyo[acc]) || compute(acc);

  /* ---------------- settings form ---------------- */
  function readForm() {
    const s = state.settings;
    s.scheme = el('b3Scheme').value;
    if (s.scheme === 'custom') {
      const lim = el('b3Limits').value.split(/[;,\s]+/).map(num).filter(v => v > 0).sort((x, y) => x - y);
      const lab = el('b3Labels').value.split(/[;,]+/).map(x => x.trim()).filter(Boolean);
      if (lim.length && lab.length === lim.length + 1) { s.custom = { by: 'r', limits: lim, labels: lab, es: T('Límites propios', 'Own limits') }; clearMessages('b3Msg'); }
      else { clearMessages('b3Msg'); showMessage('b3Msg', 'warning', T('Los nombres deben ser uno más que los límites.', 'There must be one more name than limits.'), T('Ejemplo: límites «1.7, 3, 7» y nombres «m, sm, st, t».', 'Example: limits «1.7, 3, 7» and names «m, sm, st, t».')); }
    }
    s.k = +el('b3K').value; s.order = el('b3Order').value; s.stArms = +el('b3StArms').value; s.pop = el('b3Pop').value === '1';
    s.includeSat = el('b3Sat').checked; s.strict = el('b3Strict').checked; s.satInFormula = el('b3SatF').checked;
    const a = accession(curAcc), x = num(el('b3X').value);
    if (a) a.x = x > 0 ? Math.round(x) : null;
    state.karyo = {}; state.asym = {};
    document.dispatchEvent(new CustomEvent('datachange', { detail: { block: 3 } }));
  }
  function writeForm() {
    const s = state.settings;
    el('b3Scheme').value = s.scheme || 'levan';
    el('b3CustomWrap').hidden = el('b3CustomWrap2').hidden = s.scheme !== 'custom';
    if (s.custom) { el('b3Limits').value = s.custom.limits.join(', '); el('b3Labels').value = s.custom.labels.join(', '); }
    el('b3K').value = String(s.k || 2); el('b3Order').value = s.order || 'length'; el('b3StArms').value = String(s.stArms || 1); el('b3Pop').value = s.pop ? '1' : '0';
    el('b3Sat').checked = s.includeSat !== false; el('b3Strict').checked = !!s.strict; el('b3SatF').checked = s.satInFormula !== false;
    const a = accession(curAcc);
    el('b3X').value = a && a.x ? a.x : '';
  }

  /* ---------------- rendering ---------------- */
  function render() {
    const withData = state.accessions.filter(a => cellsFor(a.id).length);
    el('b3Empty').hidden = withData.length > 0;
    el('b3Work').hidden = !withData.length;
    if (!withData.length) return;
    if (!withData.some(a => a.id === curAcc)) curAcc = withData[0].id;
    el('b3Acc').innerHTML = withData.map(a => `<option value="${esc(a.id)}">${esc(a.name || a.taxon || a.id)}</option>`).join('');
    el('b3Acc').value = curAcc;
    writeForm();
    const K = karyo(curAcc);
    renderMessages(K);
    renderBoard(K);
    renderResult(K);
    renderIdiogram(K);
    blockDone();
  }
  function renderMessages(K) {
    clearMessages('b3Msg');
    if (!K) return;
    const u = unitOf(curAcc);
    if (u.mixed) showMessage('b3Msg', 'warning', T('Esta accesión mezcla células calibradas (µm) y sin calibrar (píxeles).', 'This accession mixes calibrated cells (µm) and uncalibrated ones (pixels).'),
      T('Las longitudes relativas siguen valiendo, pero las absolutas no: calibra todas en el Bloque 2.', 'Relative lengths still hold, but absolute ones do not: calibrate all of them in Block 2.'));
    const sizes = K.cells.map(c => c.n2), mo = Stats.modes(sizes);
    if (mo.table.size > 1) showMessage('b3Msg', 'warning', T(`Las células no tienen el mismo número de cromosomas (${[...mo.table.keys()].join(', ')}).`, `The cells do not have the same number of chromosomes (${[...mo.table.keys()].join(', ')}).`),
      T('Los pares de las células incompletas se promedian con los que tengan; revisa el emparejamiento.', 'The pairs of incomplete cells are averaged with what they have; check the pairing.'));
    if (K.n2 % K.k) showMessage('b3Msg', 'info', T(`Con ${K.n2} cromosomas y ${K.k} homólogos por grupo queda un grupo incompleto.`, `With ${K.n2} chromosomes and ${K.k} homologues per group one group is incomplete.`));
    const cvBad = K.pairs.filter(p => p.n > 1 && p.c.sd / p.c.mean > 0.2);
    if (cvBad.length) showMessage('b3Msg', 'info', T(`Los pares ${cvBad.map(p => p.j + 1).join(', ')} varían más de 20 % entre células.`, `Pairs ${cvBad.map(p => p.j + 1).join(', ')} vary by more than 20% among cells.`),
      T('Puede ser condensación distinta (mira la longitud relativa) o un homólogo mal emparejado.', 'It may be different condensation (look at the relative length) or a mispaired homologue.'));
  }
  /* ---------- the board of homologues ---------- */
  function glyph(ch, H, unitPx, c) {
    /* a straightened picture when the chromosome was traced on an image, a drawing to scale otherwise */
    const src = (state.cells.find(x => x.id === c.id) || {});
    const orig = (src.chromosomes || []).find(x => x.id === ch.id);
    const img = src.image && state.images[src.image];
    const len = (ch.s + ch.l) * unitPx;
    if (orig && orig.trace && img && orig.cen != null) {
      const key = src.image + '|' + ch.id + '|' + orig.trace.length + '|' + orig.cen + '|' + Img.polyLength(orig.trace).toFixed(1);
      const t = thumbs.get(key);
      if (t) return `<img src="${t.url}" alt="" style="height:${Math.max(12, Math.round(t.len * unitPx / (Img.umPerPx(src) ? 1 / Img.umPerPx(src) : 1)))}px">`;
      queueThumb(key, src, orig);
    }
    const w = 12, sPx = ch.s * unitPx, lPx = ch.l * unitPx, sat = ch.sat > 0;
    return `<svg width="${w + 4}" height="${Math.round(len + 6)}" viewBox="0 0 ${w + 4} ${Math.round(len + 6)}" aria-hidden="true">` +
      `<rect x="2" y="1" width="${w}" height="${Math.max(1, sPx - 1).toFixed(1)}" rx="5" fill="var(--idio-fill)" stroke="var(--idio-stroke)" stroke-opacity=".5"/>` +
      `<rect x="2" y="${(sPx + 2).toFixed(1)}" width="${w}" height="${Math.max(1, lPx - 1).toFixed(1)}" rx="5" fill="var(--idio-fill)" stroke="var(--idio-stroke)" stroke-opacity=".5"/>` +
      (sat ? `<circle cx="${w / 2 + 2}" cy="3" r="2.5" fill="var(--primary)"/>` : '') + '</svg>';
  }
  let thumbQueue = [], thumbBusy = false;
  function queueThumb(key, cell, ch) {
    if (thumbQueue.some(q => q.key === key)) return;
    thumbQueue.push({ key, cell, ch });
    if (!thumbBusy) setTimeout(runThumbs, 0);
  }
  async function runThumbs() {
    thumbBusy = true;
    const byImg = new Map();
    while (thumbQueue.length) {
      const q = thumbQueue.shift();
      let im = byImg.get(q.cell.image);
      if (!im) {
        im = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = state.images[q.cell.image].dataUrl; });
        const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; cv.getContext('2d').drawImage(im, 0, 0);
        im = cv; byImg.set(q.cell.image, im);
      }
      if (!im) continue;
      const k = Img.umPerPx(q.cell);
      const width = Math.max(14, Math.min(40, (k ? 1.4 / k : 18)));
      const r = Img.straighten(im, q.ch, width);
      thumbs.set(q.key, { url: r.canvas.toDataURL('image/png'), len: r.length });
    }
    thumbBusy = false;
    if (el('panel-3') && el('panel-3').classList.contains('active')) renderBoard(karyo(curAcc));
  }
  function renderBoard(K) {
    const chips = el('b3CellChips'), board = el('b3Board');
    if (!K) { chips.innerHTML = ''; board.innerHTML = ''; return; }
    if (!K.cells.some(c => c.id === curCell)) curCell = K.cells[0].id;
    chips.innerHTML = K.cells.map(c => `<button type="button" class="chip${c.id === curCell ? ' on' : ''}" data-cell="${esc(c.id)}" aria-pressed="${c.id === curCell}">` +
      `${esc(K.cellLabels[c.id] || c.id)} · ${c.n2}${(state.cells.find(x => x.id === c.id) || {}).groups ? ' ✎' : ''}</button>`).join('');
    const C = K.cells.find(c => c.id === curCell);
    const maxLen = Math.max(...C.groups.filter(Boolean).flatMap(g => g.homolog.map(h => h.s + h.l)));
    const unitPx = 110 / maxLen;
    const u = K.unit;
    board.innerHTML = C.groups.map((g, gi) => {
      const pair = K.pairs[gi];
      if (!g) return `<div class="kb-row empty" data-g="${gi}"><div class="kb-lab"><b>${gi + 1}</b><small>${pair ? pair.type : ''}</small></div><div class="kb-items"><small class="hint">${L2('no está en esta célula', 'not in this cell')}</small></div></div>`;
      return `<div class="kb-row" data-g="${gi}"><div class="kb-lab"><b>${gi + 1}</b><small>${pair ? pair.type : ''}</small><small>${fmtFixed(g.c, 2)} ${u}</small></div>` +
        `<div class="kb-items">` + g.homolog.map(h => {
          const lab = (state.cells.find(x => x.id === C.id).chromosomes.find(x => x.id === h.id) || {}).label;
          const name = T('Cromosoma ', 'Chromosome ') + (lab != null ? lab : '') + ' · p ' + fmtFixed(h.s, 2) + ', q ' + fmtFixed(h.l, 2) + ' ' + u + ' · ' + T('par ', 'pair ') + (gi + 1);
          return `<button type="button" class="kb-chr${selChr === h.id ? ' on' : ''}" draggable="true" data-id="${esc(h.id)}" aria-pressed="${selChr === h.id}" aria-label="${esc(name)}" title="${esc(name)}">` +
            glyph(h, 110, unitPx, C) + `<span>${esc(lab != null ? lab : '')}</span></button>`;
        }).join('') + '</div></div>';
    }).join('');
  }
  function currentGroups() {
    const K = karyo(curAcc), C = K && K.cells.find(c => c.id === curCell);
    return C ? C.groups.map(g => (g ? g.homolog.map(h => String(h.id)) : [])) : null;
  }
  function setGroups(groups, msg) {
    const c = state.cells.find(x => x.id === curCell);
    if (!c) return;
    c.groups = groups;
    selChr = null;
    delete state.karyo[curAcc];
    if (state.asym) delete state.asym[curAcc];
    document.dispatchEvent(new CustomEvent('datachange', { detail: { block: 3, acc: curAcc } }));
    render();
    if (msg) { const live = el('b3Live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 40); }
  }
  function swap(a, b) {
    const G = currentGroups();
    if (!G) return;
    const ga = G.findIndex(g => g.includes(String(a))), gb = G.findIndex(g => g.includes(String(b)));
    if (ga < 0 || gb < 0 || ga === gb) return;
    G[ga][G[ga].indexOf(String(a))] = String(b);
    G[gb][G[gb].indexOf(String(b))] = String(a);
    setGroups(G, T('Intercambiados entre los pares ', 'Swapped between pairs ') + (ga + 1) + T(' y ', ' and ') + (gb + 1));
  }
  function moveTo(a, gi) {
    const G = currentGroups();
    if (!G) return;
    const ga = G.findIndex(g => g.includes(String(a)));
    if (ga < 0 || ga === gi || G[gi] == null) return;
    G[ga] = G[ga].filter(x => x !== String(a));
    G[gi].push(String(a));
    setGroups(G.filter(g => g.length), T('Movido al par ', 'Moved to pair ') + (gi + 1));
  }

  /* ---------- the table and the tiles ---------- */
  function renderResult(K) {
    if (!K) { el('b3Tiles').innerHTML = ''; el('b3Table').innerHTML = ''; return; }
    const u = K.unit, A = accession(curAcc) || {};
    statTiles('b3Tiles', [
      [T('Fórmula', 'Formula'), esc(K.formula).replace(/-sat/g, '&#8209;sat')],
      [T('Células', 'Cells'), K.cells.length, K.cells.map(c => c.n2).join(' · ') + T(' cromosomas', ' chromosomes')],
      [T('Longitud de un juego', 'Length of one set'), fmtFixed(K.thl, 2) + ' ' + u, T('suma de los pares', 'sum of the pairs')],
      [T('Longitud del complemento', 'Length of the complement'), fmtMS(K.tcl.mean, K.tcl.sd) + ' ' + u, T('todos los cromosomas, media ± de', 'all chromosomes, mean ± sd')],
      [T('Número fundamental', 'Fundamental number'), K.nf, T('brazos del complemento', 'arms of the complement')],
      [T('Mayor / menor', 'Longest / shortest'), fmtFixed(K.ratioLS, 2)],
    ]);
    const pm = (m, d) => fmtMS(m.mean, m.sd, d);
    buildTable('b3Table', [
      { key: 'j', label: L2('Par', 'Pair'), get: p => p.j + 1, num: true },
      { key: 'n', label: L2('Células', 'Cells'), num: true },
      { key: 's', label: 'p (' + u + ')', get: p => pm(p.s), num: true },
      { key: 'l', label: 'q (' + u + ')', get: p => pm(p.l), num: true },
      { key: 'c', label: L2('Longitud', 'Length') + ' (' + u + ')', get: p => pm(p.c), num: true },
      { key: 'rl', label: `<abbr title="${esc(T('longitud relativa, % del juego', 'relative length, % of the set'))}">${L2('LR', 'RL')}</abbr> (%)`, get: p => pm(p.rl), num: true },
      { key: 'ci', label: `<abbr title="${esc(T('índice centromérico', 'centromeric index'))}">${L2('IC', 'CI')}</abbr>`, get: p => pm(p.ci, 1), num: true },
      { key: 'r', label: `<abbr title="${esc(T('razón de brazos q/p', 'arm ratio q/p'))}">r</abbr>`, get: p => isFinite(p.rMean) ? fmtFixed(p.rMean, 2) : '∞', num: true },
      { key: 'type', label: L2('Clase', 'Class'), get: p => p.type + (p.sat ? '-sat' : '') },
    ], K.order.map(i => K.pairs[i]), { foot: `<tr><td colspan="9" class="hint">${L2(`Media ± desviación estándar entre células (${settings().pop ? 'n' : 'n − 1'}). Clasificación: ${esc(K.scheme.es || '')}.`, `Mean ± standard deviation among cells (${settings().pop ? 'n' : 'n − 1'}). Classification: ${esc(K.scheme.en || '')}.`)}</td></tr>` });
    state.results.karyo = Date.now();
  }
  function tableRows(K, acc) {
    const A = accession(acc) || {}, u = K.unit;
    return K.order.map(i => K.pairs[i]).map(p => [A.name || '', A.taxon || '', p.j + 1, p.n, +p.s.mean.toFixed(4), sd4(p.s.sd), +p.l.mean.toFixed(4), sd4(p.l.sd), +p.c.mean.toFixed(4), sd4(p.c.sd),
      +p.rl.mean.toFixed(4), sd4(p.rl.sd), +p.ci.mean.toFixed(3), sd4(p.ci.sd), isFinite(p.rMean) ? +p.rMean.toFixed(4) : 'Inf', p.type, p.sat ? 'sat' : '', u]);
  }
  const sd4 = v => isFinite(v) ? +v.toFixed(4) : '';
  const HEAD = () => [T('accesión', 'accession'), T('taxón', 'taxon'), T('par', 'pair'), T('células', 'cells'), 'p', 'p_sd', 'q', 'q_sd', T('longitud', 'length'), T('longitud_sd', 'length_sd'),
    T('longitud_relativa', 'relative_length'), T('longitud_relativa_sd', 'relative_length_sd'), T('indice_centromerico', 'centromeric_index'), T('indice_centromerico_sd', 'centromeric_index_sd'), T('razon_brazos', 'arm_ratio'), T('clase', 'class'), T('satelite', 'satellite'), T('unidad', 'unit')];

  /* ---------- the idiogram ---------- */
  function idioOpts() {
    return { view: el('b3View').value, unit: el('b3Unit').value, color: el('b3ColorType').checked, sd: el('b3Sd').checked, marks: el('b3Marks').checked, title: el('b3Title').value };
  }
  /* the idiogram of a karyotype with the options given (also for Blocks 7, 8 and 10) */
  function idiogram(K, o, extra) {
    o = Object.assign({ view: 'haploid', unit: 'um', color: false, sd: false, marks: true, title: '' }, o || {});
    const marks = o.marks && window.Bands && Bands.marksFor ? Bands.marksFor(K.acc, K) : null;
    let pairs = Idio.fromKaryotype(K, { marks: marks || undefined });
    let unit = K.unit;
    if (o.unit === 'rel') {
      const f = 100 / K.thl;
      pairs = pairs.map(p => Object.assign({}, p, { s: p.s * f, l: p.l * f, satLen: p.satLen * f, sd: p.sd ? { s: p.sd.s * f, l: p.sd.l * f } : null,
        homologs: p.homologs ? p.homologs.map(h => Object.assign({}, h, { s: h.s * f, l: h.l * f, satLen: h.satLen * f })) : null }));
      unit = T('% del juego', '% of the set');
    }
    const legend = [];
    if (o.color) Object.keys(K.counts).map(t => t.replace('-sat', '')).filter((t, i, a) => a.indexOf(t) === i).forEach(t => legend.push({ label: t + ' · ' + T(Karyo.TYPE_NAMES[t] || [t, t]), color: `var(--ty-${t === 'a' ? 'st' : t === 'M' ? 'm' : t === 'T' ? 't' : t})` }));
    if (marks && window.Bands && Bands.legendFor) Bands.legendFor(K.acc).forEach(e => legend.push(e));
    return Idio.draw(pairs, Object.assign({
      mode: o.view, unit, colorBy: o.color ? 'type' : 'none', sd: o.sd, order: K.order, title: o.title,
      satIncluded: settings().includeSat, legend: legend.length ? legend : null, height: 230,
      aria: T('Idiograma de ', 'Idiogram of ') + accName(K.acc) + ': ' + K.formula,
    }, extra || {}));
  }
  function renderIdiogram(K) {
    const host = el('b3Idio');
    if (!K) { host.innerHTML = ''; return; }
    const o = idioOpts();
    if (!o.title) { const A = accession(curAcc) || {}; el('b3Title').placeholder = (A.taxon ? A.taxon + ' · ' : '') + (A.name || ''); }
    host.innerHTML = idiogram(K, o).svg;
    const fb = host.closest('.fig-block');
    if (fb) fb.dataset.name = 'idiograma_' + slug(accName(curAcc));
  }

  /* ---------------- events ---------------- */
  function bind() {
    el('b3Acc').addEventListener('change', e => { curAcc = e.target.value; curCell = null; selChr = null; render(); });
    ['b3Scheme', 'b3Limits', 'b3Labels', 'b3X', 'b3K', 'b3Order', 'b3StArms', 'b3Pop', 'b3Sat', 'b3Strict', 'b3SatF'].forEach(id =>
      el(id).addEventListener('change', () => { readForm(); render(); }));
    ['b3View', 'b3Unit', 'b3ColorType', 'b3Sd', 'b3Marks'].forEach(id => el(id).addEventListener('change', () => renderIdiogram(karyo(curAcc))));
    el('b3Title').addEventListener('input', () => renderIdiogram(karyo(curAcc)));
    el('b3CellChips').addEventListener('click', e => { const b = e.target.closest('[data-cell]'); if (b) { curCell = b.dataset.cell; selChr = null; renderBoard(karyo(curAcc)); } });
    el('b3AutoCell').addEventListener('click', () => { const c = state.cells.find(x => x.id === curCell); if (c) { c.groups = null; setGroups(null, T('Célula emparejada de nuevo', 'Cell paired again')); } });
    el('b3AutoAll').addEventListener('click', () => { accCells(curAcc).forEach(c => { c.groups = null; }); delete state.karyo[curAcc]; render(); });
    const board = el('b3Board');
    board.addEventListener('click', e => {
      const b = e.target.closest('.kb-chr');
      if (!b) return;
      const id = b.dataset.id;
      if (!selChr) { selChr = id; renderBoard(karyo(curAcc)); const n = board.querySelector(`.kb-chr[data-id="${CSS.escape(id)}"]`); if (n) n.focus(); return; }
      if (selChr === id) { selChr = null; renderBoard(karyo(curAcc)); return; }
      const a = selChr;
      swap(a, id);
    });
    board.addEventListener('dragstart', e => { const b = e.target.closest('.kb-chr'); if (b) { e.dataTransfer.setData('text/plain', b.dataset.id); e.dataTransfer.effectAllowed = 'move'; b.classList.add('dragging'); } });
    board.addEventListener('dragend', e => { const b = e.target.closest('.kb-chr'); if (b) b.classList.remove('dragging'); });
    board.addEventListener('dragover', e => { if (e.target.closest('.kb-row')) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } });
    board.addEventListener('drop', e => {
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      e.preventDefault();
      const tgt = e.target.closest('.kb-chr');
      if (tgt && tgt.dataset.id !== id) swap(id, tgt.dataset.id);
      else { const row = e.target.closest('.kb-row'); if (row) moveTo(id, +row.dataset.g); }
    });
    el('b3Csv').addEventListener('click', () => { const K = karyo(curAcc); if (K) download(toDelimited([HEAD()].concat(tableRows(K, curAcc))), 'cariotipo_' + slug(accName(curAcc)) + '.csv', 'text/csv;charset=utf-8'); });
    el('b3Tsv').addEventListener('click', () => { const K = karyo(curAcc); if (K) download(toDelimited([HEAD()].concat(tableRows(K, curAcc)), '\t'), 'cariotipo_' + slug(accName(curAcc)) + '.tsv', 'text/tab-separated-values;charset=utf-8'); });
    el('b3CsvAll').addEventListener('click', () => {
      const rows = [HEAD()];
      state.accessions.forEach(a => { const K = karyo(a.id); if (K) rows.push(...tableRows(K, a.id)); });
      download(toDelimited(rows), 'cariotipos.csv', 'text/csv;charset=utf-8');
    });
    el('panel-3').addEventListener('click', e => {
      const g = e.target.closest('[data-goto]'); if (g) goStep(g.dataset.goto);
      const x = e.target.closest('[data-example]'); if (x) Examples.open(x.dataset.example);
    });
  }

  document.addEventListener('DOMContentLoaded', () => { if (!el('panel-3')) return; bind(); });
  document.addEventListener('stepchange', e => { if (e.detail.step === 3) render(); });
  document.addEventListener('projectchange', () => { state.karyo = {}; curAcc = null; curCell = null; selChr = null; thumbs.clear(); if (el('panel-3') && el('panel-3').classList.contains('active')) render(); });
  document.addEventListener('datachange', e => { if (e.detail && e.detail.block === 7 && el('panel-3').classList.contains('active')) renderIdiogram(karyo(curAcc)); });
  document.addEventListener('langchange', () => { if (el('panel-3') && el('panel-3').classList.contains('active')) render(); });

  window.Block3 = { compute, computeAll, karyo, cellsFor, idiogram, tableRows, HEAD, settings, render, get current() { return { acc: curAcc, cell: curCell }; } };
})();
