/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 2, images and measurement.
   Accessions and their cells; micrographs opened as cells; the editor of
   Img (calibrate, count, trace, centromere, satellite, edit, erase); the
   measurements of the cell, traced or typed; pasting from a spreadsheet; the
   summary of everything measured. Every change marks the karyotype of the
   accession to be computed again (Block 3). */
(function () {
  'use strict';
  let curAcc = null, curCell = null, editor = null;

  /* ---------------- data helpers ---------------- */
  const cellsOf = acc => state.cells.filter(c => c.acc === acc);
  const cell = () => state.cells.find(c => c.id === curCell) || null;
  function ensureAccession() {
    if (!state.accessions.length) state.accessions.push({ id: uid('a'), name: T('Accesión 1', 'Accession 1'), taxon: '', locality: '', lat: null, lon: null, x: null });
    if (!accession(curAcc)) curAcc = state.accessions[0].id;
    return accession(curAcc);
  }
  /* everything measured changed: the karyotype of the accession is computed again */
  function changed(acc) {
    if (state.karyo && acc) delete state.karyo[acc];
    if (state.asym && acc) delete state.asym[acc];
    document.dispatchEvent(new CustomEvent('datachange', { detail: { block: 2, acc } }));
    blockDone();
  }
  function newCell(acc, label, extra) {
    const c = Object.assign({ id: uid('c'), acc, label: label || T('Célula ', 'Cell ') + (cellsOf(acc).length + 1), image: null, scale: null, markers: [], chromosomes: [], groups: null, adjust: { b: 100, c: 100 } }, extra || {});
    state.cells.push(c);
    return c;
  }
  const nextLabel = c => { const used = new Set((c.chromosomes || []).map(x => +x.label).filter(Boolean)); let n = 1; while (used.has(n)) n++; return n; };

  /* ---------------- files ---------------- */
  async function openFiles(files) {
    const list = [...files];
    const json = list.find(f => /\.json$/i.test(f.name) || f.type === 'application/json');
    if (json) {
      try {
        loadProject(await readFileText(json));
        toast(T('Proyecto abierto: ', 'Project opened: ') + json.name, 'success');
      } catch (e) { toast(T('No se pudo abrir el proyecto: ', 'Could not open the project: ') + e.message, 'error'); }
      return;
    }
    const imgs = list.filter(f => /^image\/(png|jpeg)$/.test(f.type) || /\.(png|jpe?g)$/i.test(f.name));
    if (!imgs.length) { showMsg('warning', T('Sólo se abren imágenes PNG o JPG y proyectos .json.', 'Only PNG or JPG images and .json projects can be opened.')); return; }
    const acc = ensureAccession();
    let last = null;
    for (const f of imgs) {
      if (f.size > 25e6) showMsg('warning', T('La imagen ', 'The image ') + esc(f.name) + T(' pesa más de 25 MB: el proyecto será pesado.', ' is over 25 MB: the project will be heavy.'));
      const dataUrl = await readFileDataUrl(f);
      const dim = await new Promise(res => { const im = new Image(); im.onload = () => res([im.width, im.height]); im.onerror = () => res([0, 0]); im.src = dataUrl; });
      if (!dim[0]) { showMsg('error', T('No se pudo leer la imagen ', 'Could not read the image ') + esc(f.name)); continue; }
      const id = uid('img');
      state.images[id] = { name: f.name, dataUrl, w: dim[0], h: dim[1] };
      last = newCell(acc.id, f.name.replace(/\.[^.]+$/, ''), { image: id });
    }
    if (last) {
      curCell = last.id;
      changed(acc.id);
      render();
      toast(T('Imágenes abiertas: ', 'Images opened: ') + imgs.length + T('. Empieza por calibrar con la barra de escala.', '. Start by calibrating with the scale bar.'), 'success');
      if (editor) editor.setTool('calib');
    }
  }
  async function setCellImage(file) {
    const c = cell();
    if (!c || !file) return;
    const dataUrl = await readFileDataUrl(file);
    const dim = await new Promise(res => { const im = new Image(); im.onload = () => res([im.width, im.height]); im.onerror = () => res([0, 0]); im.src = dataUrl; });
    if (!dim[0]) { toast(T('No se pudo leer la imagen.', 'Could not read the image.'), 'error'); return; }
    const id = uid('img');
    state.images[id] = { name: file.name, dataUrl, w: dim[0], h: dim[1] };
    const old = c.image;
    c.image = id;
    if (old && !state.cells.some(x => x.image === old)) delete state.images[old];
    changed(c.acc);
    render();
  }

  /* ---------------- pasted measurements ----------------
     Columns recognized by name, or by their number (2: p q; 3: chromosome p q;
     4: cell chromosome p q; 5–7: accession cell chromosome p q [sat] [arm]).
     The CSV that this block writes (accession, taxon, cell, chromosome, p, q,
     satellite, satellite arm, unit, source) is read back whole: the taxon goes
     to the accession and a unit «px» keeps the cell in pixels. */
  const HEAD = {
    acc: /^(acc|accesi[oó]n|accession|muestra|sample|poblaci[oó]n|population)/i,
    tax: /^(tax[oó]n|taxon|especie|species)/i,
    unit: /^(unidad|unit)/i,
    cell: /^(c[eé]l|cell|placa|plate|metafase|metaphase)/i,
    chr: /^(crom|chrom|n[uú]m|no\.?$|#|id)/i,
    p: /^(p$|corto|short|brazo ?corto|short ?arm|s$)/i,
    q: /^(q$|largo|long|brazo ?largo|long ?arm|l$)/i,
    sat: /^(sat[eé]lite|satellite|sat$)/i,
    arm: /^(brazo.*sat|sat.*(arm|brazo)|arm$|brazo$)/i,
  };
  function parseMeasurements(text) {
    const { rows } = parseDelimited(text);
    if (!rows.length) return { error: T('No hay filas.', 'There are no rows.') };
    const first = rows[0], numeric = v => isFinite(num(v));
    let map = null, body = rows;
    if (first.some(v => v && !numeric(v))) {
      const named = {};
      first.forEach((h, i) => {
        const t = h.trim();
        for (const k of ['arm', 'p', 'q', 'sat', 'acc', 'tax', 'unit', 'cell', 'chr']) if (named[k] == null && HEAD[k].test(t)) { named[k] = i; break; }
      });
      if (named.p != null && named.q != null) { map = named; body = rows.slice(1); }
    }
    if (!map) {
      const n = Math.max(...body.map(r => r.length));
      map = n <= 2 ? { p: 0, q: 1 } : n === 3 ? { chr: 0, p: 1, q: 2 } : n === 4 ? { cell: 0, chr: 1, p: 2, q: 3 } : { acc: 0, cell: 1, chr: 2, p: 3, q: 4, sat: n > 5 ? 5 : null, arm: n > 6 ? 6 : null };
    }
    const out = [], bad = [];
    body.forEach((r, i) => {
      const p = num(r[map.p]), q = num(r[map.q]);
      if (!(p >= 0) || !(q > 0)) { bad.push(i + 1); return; }
      const sat = map.sat != null ? num(r[map.sat]) : 0;
      let arm = map.arm != null ? String(r[map.arm] || '').trim().toLowerCase() : '';
      arm = /^(q|l|largo|long)/.test(arm) ? 'q' : sat > 0 ? 'p' : null;
      const txt = k => (map[k] != null && r[map[k]] != null && String(r[map[k]]).trim() !== '' ? String(r[map[k]]).trim() : null);
      const unit = txt('unit');
      out.push({ acc: txt('acc'), taxon: txt('tax'), cell: txt('cell'),
        chr: txt('chr'), p, q, sat: sat > 0 ? sat : 0, satArm: sat > 0 ? arm : null, unit: unit && /^px|^p[ií]xel/i.test(unit) ? 'px' : null });
    });
    return { rows: out, bad };
  }
  function importMeasurements(text) {
    const r = parseMeasurements(text);
    if (r.error) { showMsg('error', r.error); return; }
    if (!r.rows.length) { showMsg('error', T('Ninguna fila tenía dos números válidos para p y q.', 'No row had two valid numbers for p and q.')); return; }
    /* the accession of the rows without a name: the current one, created only
       if some row needs it (a pasted table that names its accessions does not
       leave an empty «Accession 1» behind) */
    const accByName = new Map(state.accessions.map(a => [String(a.name).toLowerCase(), a]));
    const cellKey = new Map();
    let nCells = 0, nAcc = 0, nPx = 0;
    const addAcc = (name, taxon) => {
      const a = { id: uid('a'), name, taxon: taxon || '', locality: '', lat: null, lon: null, x: null };
      state.accessions.push(a); accByName.set(name.toLowerCase(), a); nAcc++;
      return a;
    };
    r.rows.forEach(row => {
      let acc;
      /* a table with taxa but no accession column: one accession per taxon */
      const name = row.acc || (row.taxon && !row.acc ? row.taxon : null);
      if (name) acc = accByName.get(name.toLowerCase()) || addAcc(name, row.taxon);
      else acc = accession(curAcc) || state.accessions[0] || addAcc(T('Accesión ', 'Accession ') + (state.accessions.length + 1));
      if (row.taxon && !acc.taxon) acc.taxon = row.taxon;
      const ck = acc.id + '|' + (row.cell || '·');
      let c = cellKey.get(ck);
      if (!c) { c = newCell(acc.id, row.cell || null); cellKey.set(ck, c); nCells++; }
      /* measurements in pixels (an uncalibrated cell exported earlier) stay in pixels */
      if (row.unit === 'px' && c.unit !== 'px') { c.unit = 'px'; nPx++; }
      c.chromosomes.push({ id: uid('m'), label: row.chr || nextLabel(c), p: row.p, q: row.q, sat: row.sat || 0, satArm: row.satArm });
    });
    /* an empty «Accession 1» made before (by opening another block) and left unused goes away */
    const used = id => state.cells.some(c => c.acc === id) || state.meiosis.configs.concat(state.meiosis.phases, state.meiosis.tetrads, state.meiosis.pollen,
      state.ploidy.counts, state.ploidy.fcm, state.ploidy.mitosis, state.bands.signals).some(x => x.acc === id);
    state.accessions = state.accessions.filter(a => used(a.id) || !/^(Accesión|Accession) \d+$/.test(a.name || '') || a.taxon || a.locality || a.lat != null || a.lon != null || a.x != null);
    const firstCell = [...cellKey.values()][0];
    curAcc = firstCell.acc; curCell = firstCell.id;
    state.accessions.forEach(a => changed(a.id));
    if (el('panel-2')) { render(); el('b2PasteBox').hidden = true; }
    clearMessages('b2Msg');
    showMessage('b2Msg', 'success', T(`Se leyeron ${plural(r.rows.length, 'cromosoma', 'cromosomas')} en ${plural(nCells, 'célula', 'células')}`, `${plural(r.rows.length, 'chromosome', 'chromosomes')} read in ${plural(nCells, 'cell', 'cells')}`) +
      (nAcc ? T(` y ${plural(nAcc, 'accesión nueva', 'accesiones nuevas')}`, ` and ${plural(nAcc, 'new accession', 'new accessions')}`) : '') + '.' +
      (nPx ? T(` ${nPx === 1 ? 'Una célula viene' : nPx + ' células vienen'} en píxeles (sin calibrar).`, ` ${nPx === 1 ? 'One cell comes' : nPx + ' cells come'} in pixels (not calibrated).`) : '') +
      (r.bad.length ? T(` Se saltaron las filas ${r.bad.slice(0, 8).join(', ')}${r.bad.length > 8 ? '…' : ''} (sin números válidos).`, ` Rows ${r.bad.slice(0, 8).join(', ')}${r.bad.length > 8 ? '…' : ''} were skipped (no valid numbers).`) : ''));
    return { rows: r.rows.length, cells: nCells, accessions: nAcc, px: nPx };
  }
  function showMsg(type, text) { clearMessages('b2Msg'); showMessage('b2Msg', type, text); }

  /* ---------------- rendering ---------------- */
  function render() {
    const any = state.cells.length > 0;
    if (state.accessions.length && !accession(curAcc)) curAcc = state.accessions[0].id;
    if (curCell && !cell()) curCell = null;
    if (!curCell && curAcc) { const cs = cellsOf(curAcc); curCell = cs.length ? cs[0].id : null; }
    el('b2Empty').hidden = any;
    renderAcc();
    renderCells();
    const c = cell();
    el('b2EditorCard').hidden = !(c && c.image && state.images[c.image]);
    el('b2TableCard').hidden = !c;
    el('b2Summary').hidden = !any;
    if (c && c.image && state.images[c.image]) mountEditor(c);
    renderTable();
    renderSide();
    renderSummary();
  }
  function renderAcc() {
    const sel = el('b2AccSel');
    sel.innerHTML = state.accessions.map(a => `<option value="${esc(a.id)}">${esc(a.name || a.taxon || a.id)}</option>`).join('') ||
      `<option value="">${esc(T('(ninguna todavía)', '(none yet)'))}</option>`;
    sel.value = curAcc || '';
    const a = accession(curAcc);
    els('#b2AccForm input').forEach(inp => {
      inp.disabled = !a;
      const v = a ? a[inp.dataset.f] : '';
      inp.value = v == null ? '' : v;
    });
    el('b2AccDel').disabled = !a;
  }
  function renderCells() {
    const host = el('b2Cells');
    const cs = curAcc ? cellsOf(curAcc) : [];
    host.innerHTML = cs.map(c => {
      const img = c.image && state.images[c.image];
      const ms = Img.cellMeasurements(c), inc = (c.chromosomes || []).length - ms.length;
      const thumb = img ? `<img src="${img.dataUrl}" alt="">` : `<span class="cell-noimg" aria-hidden="true">✎</span>`;
      return `<button type="button" class="cell-tile${c.id === curCell ? ' on' : ''}" data-cell="${esc(c.id)}" aria-pressed="${c.id === curCell}">` +
        `${thumb}<b>${esc(c.label)}</b><small>${ms.length} ${T('medidos', 'measured')}${inc ? ' · ' + inc + T(' incompletos', ' incomplete') : ''}` +
        `${img ? (Img.umPerPx(c) ? ' · µm' : ' · ' + T('sin calibrar', 'not calibrated')) : c.unit === 'px' ? ' · px' : ''}${(c.markers || []).length ? ' · 2n ' + c.markers.length : ''}</small></button>`;
    }).join('') + (curAcc ? `<button type="button" class="cell-tile add" id="b2CellAdd"><span aria-hidden="true">+</span><b>${T('Célula sin imagen', 'Cell without image')}</b></button>` : '');
    const c = cell();
    el('b2CellBar').hidden = !c;
    if (c) el('b2CellLabel').value = c.label || '';
  }
  function mountEditor(c) {
    if (!editor) {
      editor = new Img.Editor(el('b2Canvas'), {
        onChange: what => { const cc = cell(); if (cc) changed(cc.acc); renderTable(); renderSide(); renderCells(); renderSummary(); },
        onTool: t => { els('#b2Tools .tool').forEach(b => { const on = b.dataset.tool === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); renderHelp(t); },
        announce: t => { const live = el('b2Live'); if (live) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 40); } },
        defaultUm: () => num(el('b2Um').value) || 10,
      });
      editor.canvas.setAttribute('role', 'application');
      editor.canvas.setAttribute('aria-roledescription', T('lienzo de medición', 'measuring canvas'));
      editor.canvas.setAttribute('aria-describedby', 'b2Help');
      editor.setTool('pan');
    }
    if (editor.cell !== c) editor.setCell(c, state.images[c.image]);
    editor.canvas.setAttribute('aria-label', T('Imagen de ', 'Image of ') + c.label + T('. Herramientas con las letras V, C, N, T, M, S, E y B.', '. Tools with the letters V, C, N, T, M, S, E and B.'));
    const adj = c.adjust || { b: 100, c: 100 };
    el('b2Bright').value = adj.b; el('b2BrightOut').textContent = adj.b;
    el('b2Contrast').value = adj.c; el('b2ContrastOut').textContent = adj.c;
    if (c.scale && c.scale.um) el('b2Um').value = c.scale.um;
  }
  const HELP = {
    pan: ['Arrastra para mover la imagen; la rueda o + / − acercan y alejan; 0 la ajusta a la ventana. Con cualquier herramienta, la barra espaciadora o el botón derecho también mueven.',
      'Drag to move the image; the wheel or + / − zoom in and out; 0 fits it to the window. With any tool, the space bar or the right button also pan.'],
    calib: ['Traza una línea sobre la barra de escala de la foto (de un extremo al otro) y escribe su longitud en micras aquí abajo. Todas las medidas de esta célula pasan a micras.',
      'Draw a line over the scale bar of the photo (from end to end) and type its length in microns below. Every measurement of this cell becomes microns.'],
    count: ['Haz clic sobre cada cromosoma para contarlo; cada marca lleva su número. La herramienta Borrar quita una marca.',
      'Click on each chromosome to count it; every mark carries its number. The Erase tool removes a mark.'],
    trace: ['Haz clic a lo largo del cromosoma, de un extremo al otro, siguiendo su curvatura; o mantén el botón y traza a mano alzada. Doble clic o Intro termina, Retroceso quita el último punto y Esc cancela.',
      'Click along the chromosome, from one end to the other, following its curvature; or hold the button down and trace freehand. Double click or Enter finishes, Backspace removes the last point and Esc cancels.'],
    cen: ['Haz clic sobre el trazo, donde está el centrómero: la app lo pone sobre la línea y mide los dos brazos a lo largo de la curvatura.',
      'Click on the trace where the centromere is: the app places it on the line and measures both arms along the curvature.'],
    sat: ['Haz clic sobre el trazo en la constricción secundaria: lo que queda hasta el extremo de ese brazo es el satélite. Primero hay que marcar el centrómero.',
      'Click on the trace at the secondary constriction: what is left to the end of that arm is the satellite. The centromere must be marked first.'],
    edit: ['Arrastra un punto del trazo, el centrómero (círculo) o el satélite (rombo) para moverlo. Un clic elige un trazo; Supr lo borra.',
      'Drag a point of the trace, the centromere (circle) or the satellite (diamond) to move it. A click selects a trace; Delete removes it.'],
    erase: ['Haz clic sobre una marca de conteo o un trazo para borrarlo. Ctrl + Z lo deshace.', 'Click on a count mark or a trace to delete it. Ctrl + Z undoes it.'],
  };
  function renderHelp(t) { const h = el('b2Help'); if (h) h.innerHTML = '<b>' + esc(toolName(t)) + '.</b> ' + esc(T(HELP[t] || HELP.pan)); }
  const toolName = t => { const b = document.querySelector(`#b2Tools .tool[data-tool="${t}"] [data-l="${I18N.lang}"]`); return b ? b.textContent.trim() : t; };
  function renderSide() {
    const c = cell();
    if (!c || !el('b2CalibInfo')) return;
    const k = Img.umPerPx(c);
    el('b2CalibInfo').innerHTML = c.scale && c.scale.px
      ? L2(`Barra: ${fmtNum(c.scale.px, 1)} px = ${fmtNum(c.scale.um, 2)} µm · <b>${fmtNum(k, 4)} µm por píxel</b>`, `Bar: ${fmtNum(c.scale.px, 1)} px = ${fmtNum(c.scale.um, 2)} µm · <b>${fmtNum(k, 4)} µm per pixel</b>`)
      : L2('Sin calibrar: las medidas salen en píxeles. Usa la herramienta Calibrar.', 'Not calibrated: measurements come out in pixels. Use the Calibrate tool.');
    const n = (c.markers || []).length;
    el('b2CountInfo').innerHTML = L2(`<b>${n}</b> cromosomas contados en esta célula.`, `<b>${n}</b> chromosomes counted in this cell.`);
    el('b2CountSend').disabled = !n;
    const host = el('b2SelInfo');
    const ch = editor && editor.sel ? (c.chromosomes || []).find(x => x.id === editor.sel) : null;
    if (!ch) { host.innerHTML = `<h3>${L2('Cromosoma elegido', 'Selected chromosome')}</h3><p class="hint">${L2('Elige un trazo con la herramienta Editar.', 'Select a trace with the Edit tool.')}</p>`; return; }
    const m = Img.measure(ch, k || 1), u = k ? 'µm' : 'px';
    let body = `<h3>${L2('Cromosoma', 'Chromosome')} ${esc(ch.label)}</h3>`;
    if (!m || !m.complete) body += `<p class="hint">${L2('Longitud', 'Length')}: ${fmtFixed(m ? m.total : 0, 2)} ${u}. ${L2('Falta el centrómero.', 'The centromere is missing.')}</p>`;
    else {
      const N = Karyo.normalize({ p: m.p, q: m.q, sat: m.sat, satArm: m.satArm }, { includeSat: state.settings.includeSat });
      body += `<dl class="sel-dl"><dt>p</dt><dd>${fmtFixed(m.p, 2)} ${u}</dd><dt>q</dt><dd>${fmtFixed(m.q, 2)} ${u}</dd>` +
        (m.sat ? `<dt>${L2('satélite', 'satellite')}</dt><dd>${fmtFixed(m.sat, 2)} ${u} (${m.satArm})</dd>` : '') +
        `<dt>${L2('total', 'total')}</dt><dd>${fmtFixed(m.total, 2)} ${u}</dd><dt>IC</dt><dd>${fmtFixed(N.ci, 1)}</dd><dt>r</dt><dd>${isFinite(N.r) ? fmtFixed(N.r, 2) : '∞'}</dd>` +
        `<dt>${L2('clase', 'class')}</dt><dd>${Karyo.classify(N.s, N.l, state.settings.scheme) || '—'}</dd></dl>`;
    }
    body += `<div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" data-act="nosat"${ch.sc == null ? ' disabled' : ''}>${L2('Quitar el satélite', 'Remove the satellite')}</button>` +
      `<button type="button" class="btn btn-ghost btn-sm danger" data-act="del">${L2('Borrar', 'Delete')}</button></div>`;
    host.innerHTML = body;
  }
  /* the table of the measurements of the current cell */
  function renderTable() {
    const c = cell();
    const host = el('b2Table');
    if (!c || !host) return;
    const k = Img.umPerPx(c), unit = Img.cellInPx(c) ? 'px' : 'µm';
    const rows = (c.chromosomes || []).map(ch => {
      let p, q, sat, satArm, traced = !!ch.trace, done = true;
      if (traced) {
        const m = Img.measure(ch, k || 1);
        done = !!(m && m.complete);
        p = done ? m.p : null; q = done ? m.q : null; sat = done ? m.sat : 0; satArm = done ? m.satArm : null;
      } else { p = num(ch.p); q = num(ch.q); sat = num(ch.sat) || 0; satArm = ch.satArm || (sat ? 'p' : null); }
      const N = done && p >= 0 && q > 0 ? Karyo.normalize({ p, q, sat, satArm }, { includeSat: state.settings.includeSat }) : null;
      return { ch, traced, done, p, q, sat, satArm, N };
    });
    const id = (ch, f) => `b2v-${ch.id}-${f}`;
    const lab = (r, f, es, en) => `aria-label="${esc(T(es, en) + ' · ' + T('cromosoma', 'chromosome') + ' ' + r.ch.label)}"`;
    const cellIn = (r, f, v, es, en) => r.traced
      ? `<td class="num">${v == null ? '—' : fmtFixed(v, 2)}</td>`
      : `<td class="num"><input type="number" step="0.01" min="0" id="${id(r.ch, f)}" data-ch="${esc(r.ch.id)}" data-f="${f}" value="${v == null || !isFinite(v) ? '' : v}" ${lab(r, f, es, en)}></td>`;
    host.innerHTML = `<table class="b2-tab"><thead><tr><th>${L2('Cromosoma', 'Chromosome')}</th><th class="num">p (${unit})</th><th class="num">q (${unit})</th>` +
      `<th class="num">${L2('Satélite', 'Satellite')} (${unit})</th><th>${L2('Brazo', 'Arm')}</th><th class="num">${L2('Total', 'Total')}</th><th class="num">IC</th><th class="num">r</th><th>${L2('Clase', 'Class')}</th><th>${L2('Origen', 'Source')}</th><th><span class="sr-only">${L2('Acciones', 'Actions')}</span></th></tr></thead><tbody>` +
      rows.map(r => `<tr${editor && editor.sel === r.ch.id ? ' class="sel"' : ''}>` +
        (r.traced ? `<td>${esc(r.ch.label)}</td>` : `<td><input type="text" size="4" data-ch="${esc(r.ch.id)}" data-f="label" value="${esc(r.ch.label)}" ${lab(r, 'label', 'Nombre', 'Name')}></td>`) +
        cellIn(r, 'p', r.p, 'Brazo corto', 'Short arm') + cellIn(r, 'q', r.q, 'Brazo largo', 'Long arm') + cellIn(r, 'sat', r.sat || (r.traced ? 0 : null), 'Satélite', 'Satellite') +
        (r.traced ? `<td>${r.satArm || '—'}</td>` : `<td><select data-ch="${esc(r.ch.id)}" data-f="satArm" ${lab(r, 'satArm', 'Brazo del satélite', 'Satellite arm')}><option value="p"${r.satArm !== 'q' ? ' selected' : ''}>p</option><option value="q"${r.satArm === 'q' ? ' selected' : ''}>q</option></select></td>`) +
        `<td class="num">${r.N ? fmtFixed(r.p + r.q + (r.sat || 0), 2) : '—'}</td><td class="num">${r.N ? fmtFixed(r.N.ci, 1) : '—'}</td><td class="num">${r.N ? (isFinite(r.N.r) ? fmtFixed(r.N.r, 2) : '∞') : '—'}</td>` +
        `<td>${r.N ? Karyo.classify(r.N.s, r.N.l, state.settings.scheme) : (r.traced ? `<span class="badge warn">${L2('sin centrómero', 'no centromere')}</span>` : '—')}</td>` +
        `<td>${r.traced ? L2('trazo', 'trace') : L2('a mano', 'typed')}</td>` +
        `<td><button type="button" class="icon-btn b2-del" data-del="${esc(r.ch.id)}" aria-label="${esc(T('Borrar el cromosoma ', 'Delete chromosome ') + r.ch.label)}" title="${esc(T('Borrar', 'Delete'))}">×</button></td></tr>`).join('') +
      `</tbody></table>` + (rows.length ? '' : `<p class="hint" style="padding:8px 12px">${L2('Sin cromosomas todavía: traza sobre la imagen o usa «+ Cromosoma».', 'No chromosomes yet: trace on the image or use “+ Chromosome”.')}</p>`);
  }
  function renderSummary() {
    if (!el('b2Tiles')) return;
    const all = state.cells;
    const meas = all.map(c => Img.cellMeasurements(c));
    const nChr = meas.reduce((a, m) => a + m.length, 0);
    const imgCells = all.filter(c => c.image), cal = imgCells.filter(c => Img.umPerPx(c)), pxCells = all.filter(c => !c.image && Img.cellInPx(c));
    statTiles('b2Tiles', [
      [T('Accesiones', 'Accessions'), state.accessions.length],
      [T('Células', 'Cells'), all.length, imgCells.length ? imgCells.length + T(' con imagen', ' with image') : ''],
      [T('Cromosomas medidos', 'Chromosomes measured'), nChr],
      [T('Células calibradas', 'Calibrated cells'), imgCells.length ? cal.length + ' / ' + imgCells.length : '—', pxCells.length ? pxCells.length + T(' sin imagen, en píxeles', ' without image, in pixels') : '',
        (imgCells.length && cal.length < imgCells.length) || pxCells.length ? 'warn' : null],
    ]);
    const rows = state.accessions.map(a => {
      const cs = cellsOf(a.id), ms = cs.map(c => Img.cellMeasurements(c).length).filter(n => n > 0);
      const mo = ms.length ? Stats.modes(ms) : null;
      return { a, cells: cs.length, measured: ms.length, chr: ms.reduce((x, y) => x + y, 0), mode: mo ? mo.modes.join(', ') : '—', varies: mo && mo.table.size > 1, uncal: cs.filter(c => Img.cellInPx(c)).length };
    });
    buildTable('b2SumTable', [
      { key: 'a', label: L2('Accesión', 'Accession'), get: r => r.a.name || r.a.taxon || r.a.id },
      { key: 'tax', label: L2('Taxón', 'Taxon'), get: r => r.a.taxon || '—' },
      { key: 'cells', label: L2('Células', 'Cells'), num: true },
      { key: 'measured', label: L2('Con medidas', 'Measured'), num: true },
      { key: 'chr', label: L2('Cromosomas', 'Chromosomes'), num: true },
      { key: 'mode', label: L2('Cromosomas por célula (moda)', 'Chromosomes per cell (mode)'), num: true },
    ], rows);
    clearMessages('b2SumMsg');
    rows.forEach(r => {
      if (r.varies) showMessage('b2SumMsg', 'warning', T(`En «${esc(r.a.name)}» no todas las células tienen el mismo número de cromosomas medidos (moda ${r.mode}).`, `In “${esc(r.a.name)}” not every cell has the same number of measured chromosomes (mode ${r.mode}).`),
        T('Revisa que no falte ni sobre ninguno; el Bloque 3 agrupa lo que haya en cada célula.', 'Check that none is missing or duplicated; Block 3 groups whatever each cell has.'));
      if (r.uncal) showMessage('b2SumMsg', 'warning', T(`«${esc(r.a.name)}» tiene ${r.uncal === 1 ? 'una célula' : r.uncal + ' células'} sin calibrar: sus medidas están en píxeles.`, `“${esc(r.a.name)}” has ${r.uncal === 1 ? 'one uncalibrated cell' : r.uncal + ' uncalibrated cells'}: their measurements are in pixels.`),
        T('Calibra con la barra de escala (o captura las medidas en micras) para mezclarlas con las demás.', 'Calibrate with the scale bar (or type the measurements in microns) to mix them with the others.'));
    });
  }

  /* ---------------- events ---------------- */
  function bind() {
    const file = el('b2File'), drop = el('b2Drop');
    drop.addEventListener('click', () => file.click());
    file.addEventListener('change', () => { const f = file.files; if (f && f.length) openFiles(f); file.value = ''; });
    ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files.length) openFiles(e.dataTransfer.files); });
    el('b2NewCell').addEventListener('click', () => {
      const a = ensureAccession();
      const c = newCell(a.id);
      for (let i = 0; i < 4; i++) c.chromosomes.push({ id: uid('m'), label: i + 1, p: '', q: '', sat: 0, satArm: null });
      curCell = c.id; changed(a.id); render();
      const first = document.querySelector('#b2Table input[data-f="p"]');
      if (first) first.focus();
    });
    el('b2PasteBtn').addEventListener('click', () => { const b = el('b2PasteBox'); b.hidden = !b.hidden; if (!b.hidden) el('b2PasteText').focus(); });
    el('b2PasteRead').addEventListener('click', () => importMeasurements(el('b2PasteText').value));
    el('b2Example').addEventListener('click', () => Examples.open('zea'));
    el('b2Save').addEventListener('click', saveProjectFile);
    el('b2NewProj').addEventListener('click', () => {
      if (hasData() && !window.confirm(T('¿Empezar un proyecto nuevo? Lo que no hayas guardado se perderá.', 'Start a new project? Anything not saved will be lost.'))) return;
      newProject();
    });
    /* accessions */
    el('b2AccSel').addEventListener('change', e => { curAcc = e.target.value; curCell = null; render(); });
    el('b2AccNew').addEventListener('click', () => {
      const a = { id: uid('a'), name: T('Accesión ', 'Accession ') + (state.accessions.length + 1), taxon: '', locality: '', lat: null, lon: null, x: null };
      state.accessions.push(a); curAcc = a.id; curCell = null; render(); el('b2AccName').focus(); el('b2AccName').select();
    });
    el('b2AccDel').addEventListener('click', () => {
      const a = accession(curAcc);
      if (!a) return;
      const n = cellsOf(a.id).length;
      if (n && !window.confirm(T(n === 1 ? `¿Borrar «${a.name}» y su célula?` : `¿Borrar «${a.name}» y sus ${n} células?`, n === 1 ? `Delete “${a.name}” and its cell?` : `Delete “${a.name}” and its ${n} cells?`))) return;
      state.cells = state.cells.filter(c => c.acc !== a.id);
      state.accessions = state.accessions.filter(x => x !== a);
      curAcc = state.accessions[0] ? state.accessions[0].id : null; curCell = null;
      changed(a.id); render();
    });
    el('b2AccForm').addEventListener('change', e => {
      const inp = e.target.closest('input[data-f]'), a = accession(curAcc);
      if (!inp || !a) return;
      const f = inp.dataset.f;
      a[f] = inp.type === 'number' ? (inp.value === '' ? null : num(inp.value)) : inp.value.trim();
      if (f === 'name') renderAcc();
      changed(a.id);
    });
    /* cells */
    el('b2Cells').addEventListener('click', e => {
      const t = e.target.closest('.cell-tile');
      if (!t) return;
      if (t.id === 'b2CellAdd') { el('b2NewCell').click(); return; }
      curCell = t.dataset.cell; render();
    });
    el('b2CellLabel').addEventListener('change', e => { const c = cell(); if (c) { c.label = e.target.value.trim() || c.label; renderCells(); changed(c.acc); } });
    el('b2CellDel').addEventListener('click', () => {
      const c = cell();
      if (!c) return;
      if ((c.chromosomes || []).length && !window.confirm(T(`¿Borrar «${c.label}» y sus mediciones?`, `Delete “${c.label}” and its measurements?`))) return;
      state.cells = state.cells.filter(x => x !== c);
      if (c.image && !state.cells.some(x => x.image === c.image)) delete state.images[c.image];
      curCell = null; changed(c.acc); render();
    });
    el('b2CellImg').addEventListener('click', () => el('b2CellFile').click());
    el('b2CellFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) setCellImage(f); });
    /* tools */
    el('b2Tools').addEventListener('click', e => {
      const b = e.target.closest('.tool');
      if (b && editor) { editor.setTool(b.dataset.tool); editor.canvas.focus({ preventScroll: true }); }
    });
    els('#b2Tools .tool').forEach(b => { b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-keyshortcuts', b.dataset.key); });
    el('b2ZoomIn').addEventListener('click', () => editor && editor.zoomAt(1.25, editor.W / 2, editor.H / 2));
    el('b2ZoomOut').addEventListener('click', () => editor && editor.zoomAt(0.8, editor.W / 2, editor.H / 2));
    el('b2Fit').addEventListener('click', () => editor && editor.fit());
    el('b2Undo').addEventListener('click', () => editor && editor.doUndo());
    el('b2Redo').addEventListener('click', () => editor && editor.doRedo());
    el('b2ExportImg').addEventListener('click', async () => {
      const c = cell();
      if (!c || !c.image) return;
      const cv = await Img.annotated(c, state.images[c.image]);
      cv.toBlob(b => download(b, slug(accName(c.acc) + '_' + c.label) + '_anotada.png'), 'image/png');
    });
    el('b2Um').addEventListener('change', () => {
      const c = cell(), v = num(el('b2Um').value);
      if (!c || !(v > 0)) return;
      if (c.scale) { if (editor) editor.push(); c.scale.um = v; }
      changed(c.acc); renderSide(); renderTable(); if (editor) editor.draw();
    });
    const adj = (id, key) => el(id).addEventListener('input', e => {
      const c = cell(); if (!c) return;
      c.adjust = c.adjust || { b: 100, c: 100 }; c.adjust[key] = +e.target.value;
      el(id + 'Out').textContent = e.target.value;
      if (editor) editor.draw();
    });
    adj('b2Bright', 'b'); adj('b2Contrast', 'c');
    el('b2CountSend').addEventListener('click', () => {
      const c = cell();
      if (!c || !(c.markers || []).length) return;
      const list = state.ploidy.counts;
      const i = list.findIndex(r => r.acc === c.acc && r.cell === c.label);
      const row = { acc: c.acc, cell: c.label, n2: c.markers.length };
      if (i >= 0) list[i] = row; else list.push(row);
      document.dispatchEvent(new CustomEvent('datachange', { detail: { block: 6 } }));
      blockDone();
      toast(T(`Conteo enviado al Bloque 6: 2n = ${row.n2} en «${c.label}».`, `Count sent to Block 6: 2n = ${row.n2} in “${c.label}”.`), 'success');
    });
    el('b2SelInfo').addEventListener('click', e => {
      const b = e.target.closest('[data-act]'), c = cell();
      if (!b || !c || !editor || !editor.sel) return;
      const ch = c.chromosomes.find(x => x.id === editor.sel);
      if (!ch) return;
      editor.push();
      if (b.dataset.act === 'nosat') ch.sc = null;
      else { c.chromosomes = c.chromosomes.filter(x => x !== ch); editor.sel = null; }
      editor.changed('edit');
    });
    /* the table */
    const tab = el('b2Table');
    tab.addEventListener('change', e => {
      const inp = e.target.closest('[data-ch]'), c = cell();
      if (!inp || !c) return;
      const ch = c.chromosomes.find(x => x.id === inp.dataset.ch);
      if (!ch) return;
      const f = inp.dataset.f;
      ch[f] = f === 'label' || f === 'satArm' ? inp.value : (inp.value === '' ? '' : num(inp.value));
      if (f === 'sat' && num(inp.value) > 0 && !ch.satArm) ch.satArm = 'p';
      changed(c.acc);
      const keep = inp.id;
      renderTable(); renderCells(); renderSummary();
      if (keep) { const n = el(keep); if (n) n.focus(); }
    });
    tab.addEventListener('click', e => {
      const b = e.target.closest('[data-del]'), c = cell();
      if (!b || !c) return;
      if (editor && editor.cell === c) editor.push();
      c.chromosomes = c.chromosomes.filter(x => x.id !== b.dataset.del);
      changed(c.acc); render();
    });
    /* a block of cells pasted from a spreadsheet over a measurement */
    tab.addEventListener('paste', e => {
      const inp = e.target.closest('input[data-f]'), c = cell();
      if (!inp || !c || !['p', 'q', 'sat'].includes(inp.dataset.f)) return;
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (!/[\t\n]/.test(text)) return;
      e.preventDefault();
      const { rows } = parseDelimited(text);
      const cols = ['p', 'q', 'sat'];
      let ci = cols.indexOf(inp.dataset.f);
      const manual = c.chromosomes.filter(x => !x.trace);
      let ri = manual.findIndex(x => x.id === inp.dataset.ch);
      rows.forEach(r => {
        let ch = manual[ri];
        if (!ch) { ch = { id: uid('m'), label: nextLabel(c), p: '', q: '', sat: 0, satArm: null }; c.chromosomes.push(ch); manual.push(ch); }
        r.forEach((v, j) => { const f = cols[ci + j]; if (f) ch[f] = num(v); });
        if (ch.sat > 0 && !ch.satArm) ch.satArm = 'p';
        ri++;
      });
      changed(c.acc); render();
      toast(T(rows.length === 1 ? 'Se pegó una fila.' : `Se pegaron ${rows.length} filas.`, rows.length === 1 ? 'One row pasted.' : `${rows.length} rows pasted.`), 'success');
    });
    el('b2AddRow').addEventListener('click', () => {
      let c = cell();
      if (!c) { const a = ensureAccession(); c = newCell(a.id); curCell = c.id; }
      const ch = { id: uid('m'), label: nextLabel(c), p: '', q: '', sat: 0, satArm: null };
      c.chromosomes.push(ch);
      changed(c.acc); render();
      const n = el(`b2v-${ch.id}-p`); if (n) n.focus();
    });
    el('b2CsvCell').addEventListener('click', () => { const c = cell(); if (c) download(toDelimited(csvRows([c])), slug(accName(c.acc) + '_' + c.label) + '.csv', 'text/csv;charset=utf-8'); });
    el('b2CsvAll').addEventListener('click', () => download(toDelimited(csvRows(state.cells)), 'mediciones.csv', 'text/csv;charset=utf-8'));
    el('b2TsvAll').addEventListener('click', () => download(toDelimited(csvRows(state.cells), '\t'), 'mediciones.tsv', 'text/tab-separated-values;charset=utf-8'));
  }
  /* every measurement as rows: accession, cell, chromosome, p, q, satellite, arm, unit, source */
  function csvRows(cells) {
    const out = [[T('accesión', 'accession'), T('taxón', 'taxon'), T('célula', 'cell'), T('cromosoma', 'chromosome'), 'p', 'q', T('satélite', 'satellite'), T('brazo_satélite', 'satellite_arm'), T('unidad', 'unit'), T('origen', 'source')]];
    cells.forEach(c => {
      const a = accession(c.acc) || {}, unit = Img.cellInPx(c) ? 'px' : 'µm';
      Img.cellMeasurements(c).forEach(m => out.push([a.name || '', a.taxon || '', c.label, m.label, +m.p.toFixed(4), +m.q.toFixed(4), +(m.sat || 0).toFixed(4), m.satArm || '', unit, m.traced ? T('trazo', 'trace') : T('a mano', 'typed')]));
    });
    return out;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!el('panel-2')) return;
    bind();
    render();
  });
  document.addEventListener('projectchange', () => { curAcc = state.accessions[0] ? state.accessions[0].id : null; curCell = null; if (editor) editor.cell = null; if (el('panel-2')) render(); });
  document.addEventListener('langchange', () => { if (el('panel-2')) { render(); if (editor) renderHelp(editor.tool); } });
  document.addEventListener('stepchange', e => { if (e.detail.step === 2) { render(); if (editor) setTimeout(() => editor.resize(), 30); } });

  window.Block2 = { render, parseMeasurements, importMeasurements, csvRows, get editor() { return editor; }, get current() { return { acc: curAcc, cell: curCell }; },
    select(acc, c) { curAcc = acc; curCell = c; render(); } };
})();
