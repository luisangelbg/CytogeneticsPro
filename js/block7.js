/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 7, banding and FISH.
   The probes and bands of the project (name, kind, colour, band or dots);
   the signals of the chosen accession in a table and on its idiogram, where a
   click adds one; the physical map of one chromosome; the pattern of the
   accession, the concordance among cells and the sites of every probe in
   every accession. Everything drawn on the idiograms of Blocks 3, 8 and 10. */
(function () {
  'use strict';
  let cur = null, lastI = null, curPair = 1;
  const grids = {};
  const B = () => state.bands;
  const changed = () => { state.results.bands = Date.now(); blockDone(); document.dispatchEvent(new CustomEvent('datachange', { detail: { block: 7, acc: cur } })); };
  const karyo = () => (window.Block3 ? Block3.karyo(cur) : null);

  function makeGrids() {
    grids.probes = Grid.make(el('b7Probes'), {
      rows: Bands.probes, fileName: 'sondas',
      newRow: () => ({ id: uid('p'), name: T('Sonda nueva', 'New probe'), kind: 'FISH', color: 'var(--pr6)' }),
      columns: [{ key: 'name', es: 'Nombre', en: 'Name', type: 'text', width: '10em' },
        { key: 'kind', es: 'Tipo', en: 'Kind', type: 'select', options: Bands.KINDS },
        { key: 'color', es: 'Color', en: 'Colour', type: 'select', options: Bands.COLORS },
        { key: 'shape', es: 'Dibujo', en: 'Drawing', type: 'select', options: [['band', 'Banda', 'Band'], ['dot', 'Puntos en las cromátidas', 'Dots on the chromatids']] }],
      onChange: () => { Bands.probes().forEach(p => { p.dot = p.shape === 'dot'; }); changed(); if (grids.sig) grids.sig.render(); renderAll(); },
    });
    grids.sig = Grid.make(el('b7Signals'), {
      rows: () => B().signals, filter: s => s.acc === cur, fileName: () => 'senales_' + slug(accName(cur)),
      newRow: () => ({ acc: cur, pair: curPair || 1, homolog: '', arm: 's', pos: 0.5, size: 0.08, probe: (Bands.probes()[0] || {}).id }),
      columns: [{ key: 'pair', es: 'Par', en: 'Pair', type: 'int', width: '4em', min: 1 },
        { key: 'homolog', es: 'Homólogo', en: 'Homologue', type: 'select', options: [['', 'los dos', 'both'], ['1', '1', '1'], ['2', '2', '2'], ['3', '3', '3'], ['4', '4', '4']] },
        { key: 'arm', es: 'Brazo', en: 'Arm', type: 'select', options: [['s', 'p (corto)', 'p (short)'], ['l', 'q (largo)', 'q (long)']] },
        { key: 'pos', es: 'Posición (0–1)', en: 'Position (0–1)', type: 'num', width: '5em' },
        { key: 'size', es: 'Tamaño (0–1)', en: 'Size (0–1)', type: 'num', width: '5em' },
        { key: 'probe', es: 'Sonda', en: 'Probe', type: 'select', options: () => Bands.probes().map(p => [p.id, p.name, p.name]) },
        { key: 'cell', es: 'Célula (opcional)', en: 'Cell (optional)', type: 'text', width: '8em' },
        { key: '_cls', es: 'Región', en: 'Region', get: s => isFinite(+s.pos) ? T(Bands.POS_NAMES[Bands.posClass(+s.pos)]) : '' }],
      emptyEs: 'Sin señales: escríbelas aquí o haz clic sobre el idiograma.', emptyEn: 'No signals: type them here or click on the idiogram.',
      onChange: () => { changed(); renderAll(); },
    });
  }
  function clickProbeOptions() {
    const s = el('b7ClickProbe'), v = s.value;
    s.innerHTML = Bands.probes().map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    if (Bands.probes().some(p => p.id === v)) s.value = v;
  }
  function renderIdio() {
    const K = karyo();
    el('b7NoKar').hidden = !!K;
    if (!K) { el('b7Idio').innerHTML = ''; lastI = null; return; }
    lastI = Block3.idiogram(K, { view: el('b7View').value, unit: 'um', marks: true, title: accName(cur) });
    el('b7Idio').innerHTML = lastI.svg;
  }
  /* a click on a chromosome of the idiogram adds a signal of the chosen probe there */
  function onIdioClick(e) {
    const g = e.target.closest('.idio-chr'), K = karyo();
    if (!g || !K || !lastI) return;
    const svg = g.ownerSVGElement, m = svg.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const pair = +g.dataset.pair, hom = g.dataset.homolog ? +g.dataset.homolog : null;
    const P = K.pairs[pair - 1];
    if (!P) return;
    const H = hom && Idio.homologsOf(K, pair - 1) ? Idio.homologsOf(K, pair - 1)[hom - 1] : null;
    const sLen = H ? H.s : P.s.mean, lLen = H ? H.l : P.l.mean, sc = lastI.scale;
    const arm = p.y < lastI.y0 ? 's' : 'l';
    const len = (arm === 's' ? sLen : lLen) * sc;
    const pos = Math.max(0, Math.min(1, (Math.abs(p.y - lastI.y0) - 1.5) / len));
    const homolog = hom ? String(hom) : el('b7ClickHom').value;
    B().signals.push({ acc: cur, pair, homolog, arm, pos: Math.round(pos * 100) / 100, size: 0.08, probe: el('b7ClickProbe').value });
    curPair = pair;
    changed(); renderAll();
    toast(T(`Señal agregada: par ${pair}, brazo ${arm === 's' ? 'p' : 'q'}, posición ${pos.toFixed(2)}.`, `Signal added: pair ${pair}, arm ${arm === 's' ? 'p' : 'q'}, position ${pos.toFixed(2)}.`), 'success');
  }
  function renderMap() {
    const K = karyo(), sel = el('b7Pair');
    if (!K) { sel.innerHTML = ''; el('b7Map').innerHTML = ''; return; }
    sel.innerHTML = K.pairs.map((p, j) => `<option value="${j + 1}">${j + 1} · ${esc(p.type)}${p.sat ? '-sat' : ''}</option>`).join('');
    if (curPair > K.pairs.length) curPair = 1;
    sel.value = String(curPair);
    el('b7Map').innerHTML = Bands.singleMap(K, curPair - 1, Bands.marksFor(cur, K));
  }
  function renderSummary() {
    const S = Bands.summary(cur);
    const cls = c => Object.keys(c).map(k => c[k] + ' ' + T(Bands.POS_NAMES[k])).join(', ');
    buildTable('b7Sum', [{ key: 'p', label: L2('Sonda o banda', 'Probe or band'), get: r => `<span class="sw" style="background:${r.probe.color}"></span>${esc(r.probe.name)}`, html: true },
      { key: 'k', label: L2('Tipo', 'Kind'), get: r => { const k = Bands.KINDS.find(x => x[0] === r.probe.kind); return k ? T(k[1], k[2]) : r.probe.kind; } },
      { key: 'sites', label: L2('Sitios por juego', 'Sites per set'), num: true }, { key: 'pairs', label: L2('Pares', 'Pairs'), get: r => r.pairs.join(', ') },
      { key: 'where', label: L2('Dónde', 'Where'), get: r => r.list.map(s => `${s.pair}${s.arm}${s.homolog ? '(' + s.homolog + ')' : ''} ${Math.round(s.pos * 100)} %`).join('; ') },
      { key: 'cls', label: L2('Regiones', 'Regions'), get: r => cls(r.classes) }, { key: 'het', label: L2('En un solo homólogo', 'On one homologue only'), num: true, get: r => r.hetero }], S);
    const C = Bands.concordance(cur);
    if (!C) el('b7Conc').innerHTML = `<p class="hint">${L2('No hay señales registradas célula por célula en esta accesión.', 'There are no signals recorded cell by cell in this accession.')}</p>`;
    else buildTable('b7Conc', [{ key: 'pair', label: L2('Par', 'Pair'), num: true }, { key: 'probe', label: L2('Sonda', 'Probe'), get: r => r.probe.name }, { key: 'arm', label: L2('Brazo', 'Arm') },
      { key: 'cells', label: L2('Células con la señal', 'Cells with the signal'), num: true, get: r => r.cells + ' / ' + C.cells },
      { key: 'share', label: L2('Concordancia', 'Concordance'), num: true, get: r => fmtPct(r.share, 0) },
      { key: 'pos', label: L2('Posición (media ± de)', 'Position (mean ± sd)'), num: true, get: r => fmtMS(r.mean, r.sd, 2) }], C.rows);
    const accs = state.accessions.filter(a => B().signals.some(s => s.acc === a.id));
    const probes = Bands.probes().filter(p => B().signals.some(s => s.probe === p.id));
    buildTable('b7All', [{ key: 'a', label: L2('Accesión', 'Accession'), get: a => a.name || a.taxon }]
      .concat(probes.map(p => ({ key: p.id, label: esc(p.name), num: true, get: a => { const c = Bands.siteCounts(a.id)[p.id]; return c ? fmtNum(c, 1) : '0'; } }))), accs,
      { foot: `<tr><td colspan="${probes.length + 1}" class="hint">${L2('Sitios por juego cromosómico; un sitio en un solo homólogo cuenta medio.', 'Sites per chromosome set; a site on one homologue only counts as half.')}</td></tr>` });
  }
  function renderAll() { clickProbeOptions(); renderIdio(); renderMap(); renderSummary(); }
  function render() {
    if (!state.accessions.length) newAccession();
    cur = accOptions(el('b7AccSel'), cur || (state.accessions.find(a => B().signals.some(s => s.acc === a.id)) || state.accessions[0]).id);
    Bands.probes().forEach(p => { if (p.shape == null) p.shape = p.dot ? 'dot' : 'band'; });
    Object.values(grids).forEach(g => g.render());
    renderAll();
    blockDone();
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (!el('panel-7')) return;
    makeGrids();
    el('b7AccSel').addEventListener('change', e => { cur = e.target.value; curPair = 1; render(); });
    el('b7View').addEventListener('change', renderIdio);
    el('b7Idio').addEventListener('click', onIdioClick);
    el('b7Pair').addEventListener('change', e => { curPair = +e.target.value; renderMap(); });
    el('panel-7').addEventListener('click', e => { const x = e.target.closest('[data-example]'); if (x) Examples.open(x.dataset.example); });
  });
  document.addEventListener('stepchange', e => { if (e.detail.step === 7) render(); });
  document.addEventListener('projectchange', () => { cur = null; curPair = 1; });
  document.addEventListener('langchange', () => { if (el('panel-7') && el('panel-7').classList.contains('active')) render(); });

  window.Block7 = { render, get acc() { return cur; } };
})();
