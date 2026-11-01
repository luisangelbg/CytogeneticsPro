/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 6, ploidy and genome size.
   Counts of 2n with their mode and the ploidy level; the table of base
   numbers, the euploid series and dysploidy; flow cytometry (2C, 1C, 1Cx in
   pg and Mbp) with the relative ploidy against a reference accession; the
   histogram of the cytometer with its peaks and gates; unit conversion; and
   the Allium test with each treatment against the control. Data in
   state.ploidy, each row with its accession (the Allium test has treatments). */
(function () {
  'use strict';
  let cur = null, curHist = null;
  const grids = {};
  const P = () => state.ploidy;
  const changed = () => { state.results.ploidy = Date.now(); blockDone(); document.dispatchEvent(new CustomEvent('datachange', { detail: { block: 6, acc: cur } })); };
  const xTable = () => { if (!P().xTable) P().xTable = Ploidy.X_TABLE.map(r => Object.assign({}, r)); return P().xTable; };
  const stdC2 = r => (+r.stdC2 > 0 ? +r.stdC2 : ((Ploidy.STANDARDS.find(s => s.id === r.std) || {}).c2 || NaN));
  /* the ploidy level of an accession: from its counts and x, else from its genome formula */
  function levelOf(acc) {
    const a = accession(acc);
    if (!a) return null;
    const C = Ploidy.counts(P().counts.filter(r => r.acc === acc));
    if (C && C.mode && a.x > 0) return Ploidy.level(C.mode, a.x).level;
    if (a.formula) return a.formula.length;
    return null;
  }

  /* ---------------- tables ---------------- */
  function makeGrids() {
    grids.counts = Grid.make(el('b6Counts'), {
      rows: () => P().counts, filter: r => r.acc === cur, fileName: () => 'conteos_' + slug(accName(cur)),
      newRow: R => ({ acc: cur, cell: T('Célula ', 'Cell ') + (R.filter(r => r.acc === cur).length + 1), n2: '' }),
      columns: [{ key: 'cell', es: 'Célula', en: 'Cell', type: 'text', width: '9em' }, { key: 'n2', es: '2n contado', en: '2n counted', type: 'int', width: '5em', alias: ['2n', 'n2'] }],
      onChange: () => { changed(); renderCounts(); },
    });
    grids.x = Grid.make(el('b6XTable'), {
      rows: xTable, filter: r => { const q = norm(el('b6XSearch').value); return !q || norm(r.family + ' ' + r.genus).includes(q); }, fileName: 'numeros_basicos',
      newRow: () => ({ family: '', genus: '', x: '' }),
      columns: [{ key: 'family', es: 'Familia', en: 'Family', type: 'text', width: '9em' }, { key: 'genus', es: 'Género', en: 'Genus', type: 'text', width: '10em' }, { key: 'x', es: 'x', en: 'x', type: 'int', width: '4em' }],
      extraButtons: () => `<button type="button" class="btn btn-ghost btn-sm" data-act="restore">${esc(T('Volver a la tabla original', 'Back to the original table'))}</button>`,
      onAction: a => { if (a === 'restore') { P().xTable = null; grids.x.render(); renderX(); } },
      onChange: () => { renderX(); },
    });
    grids.fcm = Grid.make(el('b6Fcm'), {
      rows: () => P().fcm, filter: r => r.acc === cur, fileName: () => 'citometria_' + slug(accName(cur)),
      newRow: R => { const v = R.filter(r => r.acc === cur), last = v[v.length - 1]; return { acc: cur, sample: T('Muestra ', 'Sample ') + (v.length + 1), std: last ? last.std : 'tomato' }; },
      columns: [{ key: 'sample', es: 'Muestra', en: 'Sample', type: 'text', width: '11em' },
        { key: 'std', es: 'Patrón interno', en: 'Internal standard', type: 'select', options: () => Ploidy.STANDARDS.map(s => [s.id, s.es + ' · ' + s.c2 + ' pg', s.en + ' · ' + s.c2 + ' pg']).concat([['other', 'Otro (escribe su 2C)', 'Other (type its 2C)']]) },
        { key: 'stdC2', es: '2C del patrón (pg)', en: 'Standard 2C (pg)', type: 'num', width: '5em' },
        { key: 'stdPeak', es: 'Pico del patrón', en: 'Standard peak', type: 'num', width: '5.5em' }, { key: 'samplePeak', es: 'Pico de la muestra', en: 'Sample peak', type: 'num', width: '5.5em' },
        { key: 'cvStd', es: 'CV patrón (%)', en: 'Standard CV (%)', type: 'num', width: '4.5em' }, { key: 'cvSample', es: 'CV muestra (%)', en: 'Sample CV (%)', type: 'num', width: '4.5em' },
        { key: '_r', es: 'Razón', en: 'Ratio', get: r => { const g = run(r); return g ? g.ratio : NaN; }, digits: 3, csv: 'ratio' },
        { key: '_c2', es: '2C (pg)', en: '2C (pg)', get: r => { const g = run(r); return g ? g.c2 : NaN; }, digits: 3, csv: 'C2_pg' },
        { key: '_mb', es: '2C (Mpb)', en: '2C (Mbp)', get: r => { const g = run(r); return g ? g.mbp2 : NaN; }, digits: 0, csv: 'C2_Mbp' }],
      onChange: () => { changed(); renderFcm(); },
    });
    grids.mit = Grid.make(el('b6Mit'), {
      rows: () => P().mitosis, fileName: 'prueba_allium',
      newRow: R => { const last = R[R.length - 1]; return { trt: last ? last.trt : T('Testigo', 'Control'), rep: T('Bulbo ', 'Bulb ') + (R.length + 1) }; },
      columns: [{ key: 'trt', es: 'Tratamiento', en: 'Treatment', type: 'text', width: '11em' }, { key: 'rep', es: 'Repetición', en: 'Replicate', type: 'text', width: '6em' },
        { key: 'inter', es: 'Interfase', en: 'Interphase', type: 'int', width: '5em' }, { key: 'pro', es: 'Profase', en: 'Prophase', type: 'int', width: '4.5em' },
        { key: 'meta', es: 'Metafase', en: 'Metaphase', type: 'int', width: '4.5em' }, { key: 'ana', es: 'Anafase', en: 'Anaphase', type: 'int', width: '4.5em' },
        { key: 'telo', es: 'Telofase', en: 'Telophase', type: 'int', width: '4.5em' }]
        .concat(Ploidy.ABER.map(k => ({ key: k, es: Ploidy.ABER_NAMES[k][0], en: Ploidy.ABER_NAMES[k][1], type: 'int', width: '4.5em' })))
        .concat([{ key: 'mn', es: 'Micronúcleos', en: 'Micronuclei', type: 'int', width: '4.5em' },
          { key: '_mi', es: 'IM (%)', en: 'MI (%)', get: r => Ploidy.mitosisRow(r).MI, digits: 2, csv: 'MI_pct' }]),
      onChange: () => { changed(); renderMitosis(); },
    });
  }
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const run = r => Ploidy.genome({ stdC2: stdC2(r), stdPeak: r.stdPeak, samplePeak: r.samplePeak, cvStd: r.cvStd, cvSample: r.cvSample }, levelOf(r.acc));

  /* ---------------- counts ---------------- */
  function renderCounts() {
    clearMessages('b6CountMsg');
    const a = accession(cur), C = Ploidy.counts(P().counts.filter(r => r.acc === cur));
    if (!C) { el('b6CountTiles').innerHTML = ''; el('b6CountFig').innerHTML = ''; }
    else {
      const L = C.mode && a && a.x > 0 ? Ploidy.level(C.mode, a.x) : null;
      statTiles('b6CountTiles', [
        [T('Células contadas', 'Cells counted'), C.n],
        [T('Número modal', 'Modal number'), C.mode != null ? '2n = ' + C.mode : C.modes.join(' / '), fmtPct(C.modal, 0) + T(' de las células', ' of the cells'), C.modal < 0.6 ? 'warn' : null],
        [T('Intervalo', 'Range'), C.min === C.max ? C.min : C.min + ' – ' + C.max],
        [T('Nivel de ploidía', 'Ploidy level'), L ? L.formula : '—', L ? T(L.name) + (L.aneu ? ' · ' + T(L.aneu) : '') : T('falta x', 'x missing')],
      ]);
      const cats = []; for (let v = C.min; v <= C.max; v++) cats.push(v);
      const f = new Map(C.freq);
      el('b6CountFig').innerHTML = Chart.bars({ categories: cats.map(String), series: [{ name: T('células', 'cells'), values: cats.map(v => f.get(v) || 0), color: accColor(cur) }],
        xlab: '2n', ylab: T('células', 'cells'), values: true, valueDigits: 0, title: accName(cur), aria: T('Frecuencia de los conteos', 'Frequency of the counts') });
      if (C.mode == null) showMessage('b6CountMsg', 'warning', T('Hay más de una moda: cuenta más células antes de decidir el número.', 'There is more than one mode: count more cells before deciding the number.'));
      if (L && !L.euploid) showMessage('b6CountMsg', 'info', T(`El número modal no es múltiplo de x = ${a.x}: ${L.formula}.`, `The modal number is not a multiple of x = ${a.x}: ${L.formula}.`),
        T('Puede ser aneuploidía, cromosomas B o un número básico distinto (disploidía).', 'It may be aneuploidy, B chromosomes or a different base number (dysploidy).'));
    }
    const rows = state.accessions.map(a => ({ a, C: Ploidy.counts(P().counts.filter(r => r.acc === a.id)) })).filter(r => r.C);
    buildTable('b6CountAll', [{ key: 'a', label: L2('Accesión', 'Accession'), get: r => r.a.name || r.a.taxon }, { key: 'x', label: 'x', num: true, get: r => r.a.x || '—' },
      { key: 'n', label: L2('Células', 'Cells'), num: true, get: r => r.C.n }, { key: 'm', label: L2('Moda', 'Mode'), num: true, get: r => r.C.modes.join(' / ') },
      { key: 'p', label: L2('% modal', '% modal'), num: true, get: r => fmtPct(r.C.modal, 0) },
      { key: 'f', label: L2('Fórmula', 'Formula'), get: r => { const L = r.C.mode && r.a.x > 0 ? Ploidy.level(r.C.mode, r.a.x) : null; return L ? L.formula : '—'; } },
      { key: 'l', label: L2('Nivel', 'Level'), get: r => { const L = r.C.mode && r.a.x > 0 ? Ploidy.level(r.C.mode, r.a.x) : null; return L ? T(L.name) : '—'; } }], rows);
  }

  /* ---------------- base numbers, series, dysploidy ---------------- */
  function renderX() {
    const a = accession(cur);
    const host = el('b6Series');
    const genera = xTable().filter(r => r.genus && r.x > 0);
    let h = `<div class="b3-opts"><label class="inline-label" for="b6XPick">${L2('Poner en la accesión el x de', 'Set in the accession the x of')} <select id="b6XPick">` +
      genera.map((r, i) => `<option value="${i}">${esc(r.genus)} (${esc(r.family)}) · x = ${r.x}</option>`).join('') + `</select></label>` +
      `<button type="button" class="btn btn-secondary btn-sm" id="b6XSet">${L2('Poner', 'Set')}</button></div>`;
    if (a && a.x > 0) {
      const lv = levelOf(cur);
      h += `<h3>${L2('Serie euploide con', 'Euploid series with')} x = ${a.x}</h3><div class="series">` +
        Ploidy.series(a.x, 8).map(s => `<span class="badge${s.level === lv ? ' ok' : ''}">${s.level}x · 2n = ${s.n2} · ${esc(T(s.name))}</span>`).join(' ') + '</div>';
    } else h += `<p class="hint">${L2('Escribe o elige el número básico de la accesión para ver su serie euploide.', 'Type or pick the base number of the accession to see its euploid series.')}</p>`;
    /* dysploidy: accessions of the same genus with different base numbers */
    const byGenus = new Map();
    state.accessions.forEach(x => { if (!(x.x > 0)) return; const g = String(x.taxon || '').split(/\s+/)[0]; if (!g) return; if (!byGenus.has(g)) byGenus.set(g, []); byGenus.get(g).push(x); });
    byGenus.forEach((list, g) => {
      const d = Ploidy.dysploidy(list.map(x => x.x));
      if (d) h += `<p class="msg msg-info" role="status">${L2(`<i>${esc(g)}</i>: accesiones con x = ${d.values.join(', ')}. Números básicos distintos en un mismo género sugieren una serie disploide${d.consecutive ? ' (pasos de un cromosoma)' : ''}; el Bloque 8 la reconstruye sobre un árbol.`,
        `<i>${esc(g)}</i>: accessions with x = ${d.values.join(', ')}. Different base numbers in one genus suggest a dysploid series${d.consecutive ? ' (steps of one chromosome)' : ''}; Block 8 reconstructs it on a tree.`)}</p>`;
    });
    host.innerHTML = h;
    const pick = el('b6XPick');
    const tax = a && a.taxon ? norm(a.taxon.split(/\s+/)[0]) : '';
    const hit = genera.findIndex(r => tax && norm(r.genus).startsWith(tax));
    if (hit >= 0) pick.value = String(hit);
    el('b6XSet').addEventListener('click', () => {
      const r = genera[+pick.value], A = accession(cur);
      if (!r || !A) return;
      A.x = r.x; el('b6X').value = r.x; changed(); renderCounts(); renderX(); renderFcm();
      toast(T(`x = ${r.x} puesto en «${A.name}».`, `x = ${r.x} set in «${A.name}».`), 'success');
    });
  }

  /* ---------------- cytometry ---------------- */
  function renderFcm() {
    clearMessages('b6FcmMsg');
    const accs = state.accessions.filter(a => P().fcm.some(r => r.acc === a.id));
    const sum = accs.map(a => {
      const runs = P().fcm.filter(r => r.acc === a.id).map(run).filter(Boolean);
      const c2 = runs.map(r => r.c2);
      const L = levelOf(a.id);
      const m = Stats.mean(c2);
      return { a, n: runs.length, c2: m, sd: c2.length > 1 ? Stats.sd(c2) : NaN, L, c1x: L ? m / L : NaN, flags: [...new Set(runs.flatMap(r => r.flags))] };
    }).filter(r => r.n);
    buildTable('b6FcmSum', [{ key: 'a', label: L2('Accesión', 'Accession'), get: r => r.a.name || r.a.taxon }, { key: 'n', label: L2('Corridas', 'Runs'), num: true },
      { key: 'c2', label: '2C (pg)', num: true, get: r => fmtMS(r.c2, r.sd, 3) }, { key: 'mb', label: '2C (Mpb)', num: true, get: r => fmtNum(Ploidy.pgToMbp(r.c2), 0) },
      { key: 'c1', label: '1C (pg)', num: true, get: r => fmtFixed(r.c2 / 2, 3) }, { key: 'L', label: L2('Nivel', 'Level'), num: true, get: r => r.L ? r.L + 'x' : '—' },
      { key: 'c1x', label: '1Cx (pg)', num: true, get: r => fmtFixed(r.c1x, 3) }, { key: 'mbx', label: '1Cx (Mpb)', num: true, get: r => fmtNum(Ploidy.pgToMbp(r.c1x), 0) }], sum);
    sum.forEach(r => {
      if (r.flags.includes('cv')) showMessage('b6FcmMsg', 'warning', T(`«${esc(r.a.name)}»: algún pico tiene un CV mayor de 5 %.`, `«${esc(r.a.name)}»: some peak has a CV above 5%.`), T('Repite la preparación: un CV alto suele ser núcleos dañados o restos.', 'Repeat the preparation: a high CV is usually damaged nuclei or debris.'));
      if (r.flags.includes('overlap')) showMessage('b6FcmMsg', 'warning', T(`«${esc(r.a.name)}»: la muestra y el patrón casi coinciden (razón cercana a 1).`, `«${esc(r.a.name)}»: sample and standard nearly coincide (ratio close to 1).`), T('Elige un patrón con un contenido más distinto para que los picos no se encimen.', 'Choose a standard with a more different content so the peaks do not overlap.'));
    });
    /* relative ploidy */
    const sel = el('b6Ref');
    const prev = sel.value;
    sel.innerHTML = sum.map(r => `<option value="${esc(r.a.id)}">${esc(r.a.name)}</option>`).join('');
    if (sum.some(r => r.a.id === prev)) sel.value = prev;
    const ref = sum.find(r => r.a.id === sel.value) || sum[0];
    if (!ref || sum.length < 2) { el('b6FcmRel').innerHTML = ''; return; }
    const refL = ref.L || 2;
    buildTable('b6FcmRel', [{ key: 'a', label: L2('Accesión', 'Accession'), get: r => r.a.name }, { key: 'q', label: L2('2C ÷ 2C de la referencia', '2C ÷ reference 2C'), num: true, get: r => fmtFixed(r.c2 / ref.c2, 3) },
      { key: 'e', label: L2('Nivel estimado', 'Estimated level'), num: true, get: r => fmtFixed(refL * r.c2 / ref.c2, 2) + 'x' },
      { key: 'c', label: L2('Nivel por conteo', 'Level by counting'), num: true, get: r => r.L ? r.L + 'x' : '—' }], sum,
      { foot: `<tr><td colspan="4" class="hint">${L2(`Referencia: «${esc(ref.a.name)}» como ${refL}x. Un poliploide reciente suele tener algo menos del doble (reducción del genoma).`, `Reference: «${esc(ref.a.name)}» as ${refL}x. A recent polyploid often has somewhat less than double (genome downsizing).`)}</td></tr>` });
  }

  /* ---------------- histogram ---------------- */
  function histData(h) {
    if (h.x && h.y) return { x: h.x, y: h.y };
    return { x: h.channels.map((_, i) => i), y: h.channels };
  }
  /* the figure of one histogram with its gates (also for Block 10) */
  function histSvg(h, log) {
    const D = histData(h);
    if (!h.gates) { const pk = Ploidy.peaks(D); h.gates = Ploidy.autoGates(D, pk).map((g, i) => ({ a: +g.a.toFixed(1), b: +g.b.toFixed(1), label: 'P' + (i + 1) })); }
    const st = h.gates.map(g => Ploidy.gate(D, g.a, g.b));
    return Chart.hist({ x: D.x, y: D.y, gates: h.gates, peaks: st.map(s => s && s.mean).filter(isFinite), log: !!log,
      xlab: T('canal (intensidad de fluorescencia)', 'channel (fluorescence intensity)'), ylab: T('núcleos', 'nuclei'), title: h.name, aria: T('Histograma de fluorescencia', 'Fluorescence histogram') });
  }
  function renderHist() {
    const sel = el('b6HistSel'), list = P().histos;
    sel.innerHTML = list.map(h => `<option value="${esc(h.id)}">${esc(h.name)}</option>`).join('') || `<option value="">${esc(T('(ninguno todavía)', '(none yet)'))}</option>`;
    if (!list.some(h => h.id === curHist)) curHist = list[0] ? list[0].id : null;
    sel.value = curHist || '';
    const h = list.find(x => x.id === curHist);
    el('b6GateUse').hidden = !h;
    if (!h) { el('b6HistFig').innerHTML = `<p class="hint">${L2('Abre un CSV del citómetro o el ejemplo de la serie poliploide.', 'Open a cytometer CSV or the polyploid series example.')}</p>`; el('b6Gates').innerHTML = ''; el('b6GateInfo').textContent = ''; return; }
    const D = histData(h);
    if (!h.gates) { const pk = Ploidy.peaks(D); h.gates = Ploidy.autoGates(D, pk).map((g, i) => ({ a: +g.a.toFixed(1), b: +g.b.toFixed(1), label: 'P' + (i + 1) })); }
    const st = h.gates.map(g => Ploidy.gate(D, g.a, g.b));
    el('b6HistFig').innerHTML = Chart.hist({ x: D.x, y: D.y, gates: h.gates, peaks: st.map(s => s && s.mean).filter(isFinite), log: el('b6HistLog').checked,
      xlab: T('canal (intensidad de fluorescencia)', 'channel (fluorescence intensity)'), ylab: T('núcleos', 'nuclei'), title: h.name, aria: T('Histograma de fluorescencia', 'Fluorescence histogram') });
    el('b6Gates').innerHTML = `<table><thead><tr><th>${L2('Compuerta', 'Gate')}</th><th class="num">${L2('Desde', 'From')}</th><th class="num">${L2('Hasta', 'To')}</th><th class="num">${L2('Núcleos', 'Nuclei')}</th><th class="num">${L2('Media', 'Mean')}</th><th class="num">CV (%)</th><th><span class="sr-only">${L2('Acciones', 'Actions')}</span></th></tr></thead><tbody>` +
      h.gates.map((g, i) => `<tr><td>${esc(g.label)}</td><td class="num"><input type="number" step="any" data-g="${i}" data-f="a" value="${g.a}" aria-label="${esc(g.label + ' ' + T('desde', 'from'))}"></td>` +
        `<td class="num"><input type="number" step="any" data-g="${i}" data-f="b" value="${g.b}" aria-label="${esc(g.label + ' ' + T('hasta', 'to'))}"></td>` +
        `<td class="num">${st[i] ? fmtNum(st[i].events, 0) : '—'}</td><td class="num">${st[i] ? fmtFixed(st[i].mean, 2) : '—'}</td><td class="num">${st[i] ? fmtFixed(st[i].cv, 2) : '—'}</td>` +
        `<td><button type="button" class="icon-btn grid-del" data-gdel="${i}" aria-label="${esc(T('Borrar la compuerta ', 'Delete gate ') + g.label)}">×</button></td></tr>`).join('') +
      `</tbody></table><div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" id="b6GNew">${L2('+ Compuerta', '+ Gate')}</button><button type="button" class="btn btn-ghost btn-sm" id="b6GAuto">${L2('Buscar los picos de nuevo', 'Find the peaks again')}</button></div>`;
    const opt = h.gates.map((g, i) => `<option value="${i}">${esc(g.label)}${st[i] ? ' · ' + fmtFixed(st[i].mean, 1) : ''}</option>`).join('');
    const ps = el('b6GSample'), pt = el('b6GStd'), pn = el('b6GStdName');
    const vs = ps.value, vt = pt.value;
    ps.innerHTML = opt; pt.innerHTML = opt;
    /* by default the standard is the lowest peak, the sample the highest G0/G1 below twice it */
    const means = st.map(s => s ? s.mean : NaN);
    ps.value = vs && h.gates[+vs] ? vs : String(Math.max(0, means.findIndex((m, i) => i > 0 && isFinite(m)))); pt.value = vt && h.gates[+vt] ? vt : '0';
    pn.innerHTML = Ploidy.STANDARDS.map(s => `<option value="${s.id}">${esc(T(s.es, s.en))} · ${s.c2} pg</option>`).join('');
    if (h.std) pn.value = h.std; else pn.value = 'tomato';
    const a = st[+ps.value], b = st[+pt.value], std = Ploidy.STANDARDS.find(s => s.id === pn.value);
    el('b6GateInfo').innerHTML = a && b && std ? L2(`Razón muestra / patrón = ${fmtFixed(a.mean / b.mean, 4)} → 2C = <b>${fmtFixed(a.mean / b.mean * std.c2, 3)} pg</b> (${fmtNum(Ploidy.pgToMbp(a.mean / b.mean * std.c2), 0)} Mpb).`,
      `Sample / standard ratio = ${fmtFixed(a.mean / b.mean, 4)} → 2C = <b>${fmtFixed(a.mean / b.mean * std.c2, 3)} pg</b> (${fmtNum(Ploidy.pgToMbp(a.mean / b.mean * std.c2), 0)} Mbp).`) : '';
  }
  async function openHist(file) {
    const H = Ploidy.readHistogram(await readFileText(file));
    if (!H || !H.x.length) { toast(T('No se encontraron números en el archivo.', 'No numbers were found in the file.'), 'error'); return; }
    const h = { id: uid('h'), acc: cur, name: file.name.replace(/\.[^.]+$/, ''), x: H.x, y: H.y };
    P().histos.push(h); curHist = h.id;
    changed(); renderHist();
    toast(T(`Histograma leído: ${fmtNum(H.events, 0)} núcleos.`, `Histogram read: ${fmtNum(H.events, 0)} nuclei.`), 'success');
  }

  /* ---------------- conversion ---------------- */
  function renderConv() {
    const v = num(el('b6ConvV').value), u = el('b6ConvU').value;
    if (!isFinite(v)) { el('b6ConvOut').innerHTML = ''; return; }
    const names = { pg: 'pg', Mbp: T('Mpb', 'Mbp'), Gbp: T('Gpb', 'Gbp'), bp: T('pb', 'bp') };
    el('b6ConvOut').innerHTML = '<div class="results-summary">' + Object.keys(Ploidy.UNITS).map(k => `<div class="stat-tile"><div class="stat-label">${names[k]}</div><div class="stat-value">${fmtNum(Ploidy.convert(v, u, k), 6)}</div></div>`).join('') +
      `</div><p class="hint">${L2('1 pg = 978 Mpb (Doležel et al. 2003).', '1 pg = 978 Mbp (Doležel et al. 2003).')}</p>`;
  }

  /* ---------------- Allium test ---------------- */
  function renderMitosis() {
    clearMessages('b6MitMsg');
    const rows = P().mitosis;
    const trts = [...new Set(rows.map(r => r.trt).filter(Boolean))];
    const sel = el('b6Ctrl');
    sel.innerHTML = trts.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
    if (P().control && trts.includes(P().control)) sel.value = P().control;
    else { const guess = trts.find(t => /testigo|control|agua|water/i.test(t)); if (guess) sel.value = guess; }
    if (!trts.length) { el('b6MitSum').innerHTML = ''; el('b6MitTests').innerHTML = ''; el('b6MitFig').innerHTML = ''; return; }
    const A = Ploidy.allium(rows, sel.value);
    buildTable('b6MitSum', [{ key: 'trt', label: L2('Tratamiento', 'Treatment'), get: r => r.trt + (r.trt === A.control ? ' ★' : '') }, { key: 'reps', label: L2('Rep.', 'Rep.'), num: true },
      { key: 'tot', label: L2('Células', 'Cells'), num: true },
      { key: 'MI', label: L2('Índice mitótico (%)', 'Mitotic index (%)'), num: true, get: r => fmtFixed(r.MI, 2) + (isFinite(r.MIr.sd) ? ' (' + fmtMS(r.MIr.mean, r.MIr.sd) + ')' : '') }]
      .concat(Ploidy.PHASES.map(k => ({ key: k, label: { pro: L2('Pro (%)', 'Pro (%)'), meta: L2('Meta (%)', 'Meta (%)'), ana: L2('Ana (%)', 'Ana (%)'), telo: L2('Telo (%)', 'Telo (%)') }[k], num: true, get: r => fmtFixed(r.phases[k], 1) })))
      .concat([{ key: 'AI', label: L2('Aberraciones (%)', 'Aberrations (%)'), num: true, get: r => fmtFixed(r.AI, 2) }, { key: 'MN', label: L2('Micronúcleos (‰)', 'Micronuclei (‰)'), num: true, get: r => fmtFixed(r.MN, 2) }]), A.res,
      { foot: `<tr><td colspan="10" class="hint">${L2('Índices con los conteos sumados de las repeticiones; entre paréntesis, media ± de de las repeticiones. ★ testigo.', 'Indices with the counts of the replicates pooled; in brackets, mean ± sd of the replicates. ★ control.')}</td></tr>` });
    const tr = [];
    A.res.filter(r => r.trt !== A.control).forEach((r, i) => ['MI', 'AI', 'MN'].forEach(k => { const t = A.tests[k][i]; tr.push({ trt: r.trt, k, t }); }));
    const kName = { MI: T('Índice mitótico', 'Mitotic index'), AI: T('Aberraciones', 'Aberrations'), MN: T('Micronúcleos', 'Micronuclei') };
    buildTable('b6MitTests', [{ key: 'trt', label: L2('Tratamiento contra el testigo', 'Treatment against the control'), get: r => r.trt }, { key: 'k', label: L2('Índice', 'Index'), get: r => kName[r.k] },
      { key: 'd', label: L2('Diferencia (puntos %)', 'Difference (% points)'), num: true, get: r => fmtFixed(100 * r.t.diff, 2) }, { key: 'z', label: 'z', num: true, get: r => fmtFixed(r.t.z, 2) },
      { key: 'p', label: 'p', num: true, get: r => fmtP(r.t.p) }, { key: 'ph', label: L2('p (Holm)', 'p (Holm)'), num: true, get: r => r.t.pHolm < 0.05 ? `<b>${fmtP(r.t.pHolm)}</b>` : fmtP(r.t.pHolm), html: true }], tr,
      { foot: A.overall ? `<tr><td colspan="6" class="hint">${L2(`Índice mitótico entre todos los tratamientos: χ² = ${fmtFixed(A.overall.chi2, 2)}, g. l. = ${A.overall.df}, ${pEq(A.overall.p)}. Cada tratamiento contra el testigo: dos proporciones con los conteos sumados; Holm corrige por el número de comparaciones de cada índice.`,
        `Mitotic index among all treatments: χ² = ${fmtFixed(A.overall.chi2, 2)}, d.f. = ${A.overall.df}, ${pEq(A.overall.p)}. Each treatment against the control: two proportions with pooled counts; Holm corrects for the number of comparisons of each index.`)}</td></tr>` : '' });
    el('b6MitFig').innerHTML = Chart.bars({ categories: A.res.map(r => r.trt), series: [
      { name: T('Índice mitótico (%)', 'Mitotic index (%)'), values: A.res.map(r => r.MIr.mean), err: A.res.map(r => r.MIr.sd) },
      { name: T('Aberraciones (%)', 'Aberrations (%)'), values: A.res.map(r => r.AIr.mean), err: A.res.map(r => r.AIr.sd) }],
      ylab: T('% (media ± de de las repeticiones)', '% (mean ± sd of the replicates)'), rotate: A.res.some(r => r.trt.length > 14), aria: T('Prueba de Allium', 'Allium test') });
    const red = A.res.filter(r => r.trt !== A.control && r.MI < 0.5 * A.res.find(x => x.trt === A.control).MI);
    if (red.length) showMessage('b6MitMsg', 'info', T(`${red.map(r => esc(r.trt)).join(', ')} baja el índice mitótico a menos de la mitad del testigo: una señal fuerte de citotoxicidad.`, `${red.map(r => esc(r.trt)).join(', ')} lowers the mitotic index below half of the control: a strong sign of cytotoxicity.`));
    state.results.allium = { control: A.control };
  }

  /* ---------------- shell ---------------- */
  function render() {
    if (!state.accessions.length) newAccession();
    cur = accOptions(el('b6AccSel'), cur || (state.accessions.find(a => P().counts.some(r => r.acc === a.id) || P().fcm.some(r => r.acc === a.id)) || state.accessions[0]).id);
    const a = accession(cur);
    el('b6X').value = a && a.x ? a.x : '';
    Object.values(grids).forEach(g => g.render());
    renderCounts(); renderX(); renderFcm(); renderHist(); renderConv(); renderMitosis();
    blockDone();
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (!el('panel-6')) return;
    makeGrids();
    el('b6AccSel').addEventListener('change', e => { cur = e.target.value; render(); });
    el('b6AccNew').addEventListener('click', () => { const a = newAccession(); cur = a.id; render(); });
    el('b6X').addEventListener('change', e => { const a = accession(cur); if (a) { const v = num(e.target.value); a.x = v > 0 ? Math.round(v) : null; changed(); renderCounts(); renderX(); renderFcm(); } });
    el('b6XSearch').addEventListener('input', () => grids.x.render());
    el('b6Ref').addEventListener('change', renderFcm);
    el('b6HistSel').addEventListener('change', e => { curHist = e.target.value; renderHist(); });
    el('b6HistOpen').addEventListener('click', () => el('b6HistFile').click());
    el('b6HistFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) openHist(f); });
    el('b6HistLog').addEventListener('change', renderHist);
    el('b6Gates').addEventListener('change', e => {
      const n = e.target.closest('[data-g]'), h = P().histos.find(x => x.id === curHist);
      if (!n || !h) return;
      h.gates[+n.dataset.g][n.dataset.f] = num(n.value);
      renderHist();
    });
    el('b6Gates').addEventListener('click', e => {
      const h = P().histos.find(x => x.id === curHist);
      if (!h) return;
      const d = e.target.closest('[data-gdel]');
      if (d) { h.gates.splice(+d.dataset.gdel, 1); renderHist(); return; }
      if (e.target.closest('#b6GNew')) { const D = histData(h), mx = D.x[D.x.length - 1]; h.gates.push({ a: +(mx * 0.4).toFixed(1), b: +(mx * 0.5).toFixed(1), label: 'P' + (h.gates.length + 1) }); renderHist(); }
      if (e.target.closest('#b6GAuto')) { h.gates = null; renderHist(); }
    });
    ['b6GSample', 'b6GStd', 'b6GStdName'].forEach(id => el(id).addEventListener('change', () => { const h = P().histos.find(x => x.id === curHist); if (h && id === 'b6GStdName') h.std = el(id).value; renderHist(); }));
    el('b6GAdd').addEventListener('click', () => {
      const h = P().histos.find(x => x.id === curHist);
      if (!h) return;
      const D = histData(h), s = h.gates[+el('b6GSample').value], t = h.gates[+el('b6GStd').value];
      const a = s && Ploidy.gate(D, s.a, s.b), b = t && Ploidy.gate(D, t.a, t.b);
      if (!a || !b) { toast(T('Las compuertas elegidas están vacías.', 'The chosen gates are empty.'), 'warning'); return; }
      P().fcm.push({ acc: h.acc || cur, sample: h.name, std: el('b6GStdName').value, stdPeak: +b.mean.toFixed(3), samplePeak: +a.mean.toFixed(3), cvStd: +b.cv.toFixed(2), cvSample: +a.cv.toFixed(2) });
      changed(); grids.fcm.render(); renderFcm();
      toast(T('Corrida agregada a la tabla de citometría.', 'Run added to the cytometry table.'), 'success');
    });
    ['b6ConvV', 'b6ConvU'].forEach(id => el(id).addEventListener('input', renderConv));
    el('b6Ctrl').addEventListener('change', e => { P().control = e.target.value; renderMitosis(); });
    el('panel-6').addEventListener('click', e => { const x = e.target.closest('[data-example]'); if (x) Examples.open(x.dataset.example); });
  });
  document.addEventListener('stepchange', e => { if (e.detail.step === 6) render(); });
  document.addEventListener('projectchange', () => { cur = null; curHist = null; });
  document.addEventListener('langchange', () => { if (el('panel-6') && el('panel-6').classList.contains('active')) render(); });

  window.Block6 = { render, levelOf, run, histSvg, get acc() { return cur; } };
})();
