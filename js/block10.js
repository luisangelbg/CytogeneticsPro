/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 10, figures and report.
   The gallery of every figure of the project (idiograms, karyograms cut out
   of the images, the Stebbins grid, MCA × CVCL, the cytometry histograms and
   the figures of the comparison), every table in CSV and TSV, the written
   methods in Spanish or English, the printable report and the reproducible
   package (.zip with the project, the tables, the figures, the report and a
   read-me). */
(function () {
  'use strict';
  let figs = [], off = new Set(), busy = false;

  /* ---------------- the figures ---------------- */
  async function collect() {
    const out = [];
    const accs = state.accessions.filter(a => window.Block3 && Block3.karyo(a.id));
    for (const a of accs) {
      const K = Block3.karyo(a.id), nm = accName(a.id);
      out.push({ id: 'idiograma_' + slug(nm), es: 'Idiograma · ' + nm, en: 'Idiogram · ' + nm, svg: Block3.idiogram(K, { view: 'haploid', unit: 'um', color: true, marks: true, title: (a.taxon ? a.taxon + ' · ' : '') + nm + ' · ' + K.formula }).svg });
      try {
        const kg = await Report.karyogram(a.id);
        if (kg) out.push({ id: 'cariograma_' + slug(nm), es: 'Cariograma · ' + nm, en: 'Karyogram · ' + nm, svg: kg });
      } catch (e) { /* an image that does not load: no karyogram */ }
    }
    const rows = accs.map(a => Block4.asym(a.id)).filter(Boolean);
    if (rows.length) out.push({ id: 'stebbins', es: 'Categorías de Stebbins', en: 'Stebbins categories', svg: Block4.stebbinsSvg(rows) });
    if (rows.length > 1) out.push({ id: 'mca_cvcl', es: 'MCA × CVCL', en: 'MCA × CVCL', svg: Block4.scatterSvg(rows, 'MCA', 'CVCL') });
    state.ploidy.histos.forEach(h => out.push({ id: 'histograma_' + slug(h.name), es: 'Histograma · ' + h.name, en: 'Histogram · ' + h.name, svg: Block6.histSvg(h) }));
    if (window.Block8) Block8.figures().list.forEach(f => out.push(f));
    return out;
  }
  async function renderFigs() {
    const host = el('b10Figs');
    host.innerHTML = `<p class="hint">${L2('Preparando las figuras…', 'Preparing the figures…')}</p>`;
    figs = await collect();
    if (!figs.length) { host.innerHTML = `<p class="hint">${L2('El proyecto todavía no tiene figuras: abre un ejemplo o mide células en el Bloque 2.', 'The project has no figures yet: open an example or measure cells in Block 2.')}</p>`; return; }
    host.innerHTML = figs.map((f, i) => `<div class="fig-block" data-name="${esc(f.id)}"><div class="fig-head"><h4>${esc(T(f.es, f.en))}</h4>` +
      `<div class="fig-tools"><button type="button" class="btn btn-ghost btn-sm fig-dl" data-fmt="svg">SVG</button><button type="button" class="btn btn-ghost btn-sm fig-dl" data-fmt="png">PNG</button></div>` +
      `<label class="checkbox-label b10-in"><input type="checkbox" data-fig="${esc(f.id)}"${off.has(f.id) ? '' : ' checked'}> ${L2('En el informe', 'In the report')}</label></div>` +
      `<div class="fig-canvas" id="b10Fig${i}">${f.svg}</div></div>`).join('');
  }
  /* the SVG text of a figure for a file, with the colours of the light theme */
  function figText(i) {
    const svg = el('b10Fig' + i) && el('b10Fig' + i).querySelector('svg');
    return svg ? Fig.svgString(svg) : null;
  }

  /* ---------------- tables ---------------- */
  function renderTables() {
    const T0 = Report.tables();
    el('b10Tables').innerHTML = T0.length ? `<table><thead><tr><th>${L2('Tabla', 'Table')}</th><th class="num">${L2('Filas', 'Rows')}</th><th class="num">${L2('Columnas', 'Columns')}</th><th><span class="sr-only">${L2('Descargas', 'Downloads')}</span></th></tr></thead><tbody>` +
      T0.map(t => `<tr><td>${esc(T(t.es, t.en))}</td><td class="num">${t.rows.length - 1}</td><td class="num">${t.rows[0].length}</td><td><div class="btn-row tight">` +
        `<button type="button" class="btn btn-ghost btn-sm" data-tab="${t.id}" data-fmt="csv" aria-label="${esc(T(t.es, t.en) + ' · CSV')}">CSV</button>` +
        `<button type="button" class="btn btn-ghost btn-sm" data-tab="${t.id}" data-fmt="tsv" aria-label="${esc(T(t.es, t.en) + ' · TSV')}">TSV</button></div></td></tr>`).join('') + '</tbody></table>'
      : `<p class="hint">${L2('Todavía no hay tablas.', 'There are no tables yet.')}</p>`;
  }

  /* ---------------- methods ---------------- */
  function renderMethods() {
    const M = Report.methods(el('b10MLang').value);
    el('b10Methods').innerHTML = M.paragraphs.map(p => `<p>${p}</p>`).join('') +
      `<h3>${el('b10MLang').value === 'en' ? 'References' : 'Referencias'}</h3><ul class="refs">${M.refs.map(r => `<li>${r}</li>`).join('')}</ul>`;
  }

  /* ---------------- the report ---------------- */
  function summaryRows() {
    const head = [T('Accesión', 'Accession'), T('Taxón', 'Taxon'), '2n', T('Fórmula', 'Formula'), T('Longitud haploide', 'Haploid length'), 'MCA', 'CVCL', 'Stebbins', '2C (pg)'];
    const rows = state.accessions.map(a => {
      const K = Block3.karyo(a.id), A = K ? Block4.asym(a.id) : null, C = Ploidy.counts(state.ploidy.counts.filter(r => r.acc === a.id));
      const g = state.ploidy.fcm.filter(r => r.acc === a.id).map(r => Block6.run(r)).filter(Boolean).map(r => r.c2).filter(isFinite);
      return [a.name || '', a.taxon || '', C && C.mode ? C.mode : K ? K.n2 : '', K ? K.formula : '', K ? fmtFixed(K.thl, 2) + ' ' + (K.unit || 'µm') : '',
        A ? fmtFixed(A.R.MCA, 2) : '', A ? fmtFixed(A.R.CVCL, 2) : '', A ? A.R.stebbins : '', g.length ? fmtFixed(Stats.mean(g), 2) : ''];
    }).filter(r => r.slice(2).some(v => v !== ''));
    return [head].concat(rows);
  }
  function resultsHtml() {
    let h = '';
    const accs = state.accessions.filter(a => Block3.karyo(a.id));
    if (accs.length) {
      h += `<h3>${esc(T('Cariotipo', 'Karyotype'))}</h3>`;
      accs.forEach(a => {
        const K = Block3.karyo(a.id), u = K.unit || 'µm';
        h += Report.htmlTable([[T('Par', 'Pair'), 'p (' + u + ')', 'q (' + u + ')', T('Longitud', 'Length') + ' (' + u + ')', T('Long. relativa (%)', 'Rel. length (%)'), T('IC', 'CI'), 'r', T('Tipo', 'Type')]]
          .concat(K.order.map(i => K.pairs[i]).map(p => [p.j + 1, fmtMS(p.s.mean, p.s.sd, 2), fmtMS(p.l.mean, p.l.sd, 2), fmtMS(p.c.mean, p.c.sd, 2), fmtFixed(p.rl.mean, 2), fmtFixed(p.ci.mean, 1), isFinite(p.rMean) ? fmtFixed(p.rMean, 2) : '∞', p.type + (p.sat ? '-sat' : '')])),
        `${accName(a.id)} · ${K.formula} · ${T('células', 'cells')}: ${K.cells.length}`);
      });
      const rows = accs.map(a => Block4.asym(a.id)).filter(Boolean);
      if (rows.length) {
        const ks = ['TF', 'AsK', 'Syi', 'A1', 'A2', 'A', 'MCA', 'CVCL', 'CVCI'];
        h += `<h3>${esc(T('Asimetría', 'Asymmetry'))}</h3>` + Report.htmlTable([[T('Accesión', 'Accession')].concat(ks.map(k => k === 'TF' ? 'TF%' : k === 'AsK' ? 'AsK%' : k), ['Stebbins'])]
          .concat(rows.map(r => [accName(r.acc)].concat(ks.map(k => (isFinite(r.R[k]) ? fmtFixed(r.R[k], k === 'A1' || k === 'A2' || k === 'A' ? 3 : 2) : '')), [r.R.stebbins]))));
      }
    }
    const mAcc = state.accessions.filter(a => state.meiosis.configs.some(r => r.acc === a.id));
    if (mAcc.length) {
      h += `<h3>${esc(T('Meiosis', 'Meiosis'))}</h3>` + Report.htmlTable([[T('Accesión', 'Accession'), T('Células', 'Cells'), T('Quiasmas / célula', 'Chiasmata / cell'), T('Quiasmas / bivalente', 'Chiasmata / bivalent'), T('Índice de recombinación', 'Recombination index'), T('% con multivalentes', '% with multivalents')]]
        .concat(mAcc.map(a => {
          const recs = state.meiosis.configs.filter(r => r.acc === a.id);
          const mo = Stats.modes(recs.map(r => Meiosis.cell(r).chr).filter(n => n > 0)), n = mo.modes.length ? mo.modes[0] / 2 : NaN;
          const S = Meiosis.summarize(recs, { n });
          return [accName(a.id), S.cells, fmtMS(S.xta.mean, S.xta.sd), fmtFixed(S.xtaPerBiv, 2), fmtFixed(S.RI, 2), fmtPct(S.withMult, 0)];
        })));
    }
    const pAcc = state.accessions.filter(a => state.meiosis.pollen.some(r => r.acc === a.id));
    if (pAcc.length) h += `<h3>${esc(T('Viabilidad del polen', 'Pollen viability'))}</h3>` + Report.htmlTable([[T('Accesión', 'Accession'), T('Granos', 'Grains'), T('% viables', '% viable'), T('Wilson 95 %', 'Wilson 95%')]]
      .concat(pAcc.map(a => { const P = Meiosis.pollen(state.meiosis.pollen.filter(r => r.acc === a.id), 0.95); return [accName(a.id), P.n, fmtFixed(100 * P.p, 1), fmtFixed(100 * P.wilson.lo, 1) + ' – ' + fmtFixed(100 * P.wilson.hi, 1)]; })));
    const fAcc = state.accessions.filter(a => state.ploidy.fcm.some(r => r.acc === a.id));
    if (fAcc.length) h += `<h3>${esc(T('Contenido de ADN', 'DNA content'))}</h3>` + Report.htmlTable([[T('Accesión', 'Accession'), T('Corridas', 'Runs'), '2C (pg)', '1Cx (pg)', '2C (Mpb)']]
      .concat(fAcc.map(a => { const G = state.ploidy.fcm.filter(r => r.acc === a.id).map(r => Block6.run(r)).filter(Boolean); const m = f => { const v = G.map(f).filter(isFinite); return v.length ? fmtMS(Stats.mean(v), v.length > 1 ? Stats.sd(v) : null, 3) : ''; }; return [accName(a.id), G.length, m(g => g.c2), m(g => g.c1x), m(g => g.mbp2)]; })));
    if (state.ploidy.mitosis.length) {
      const trts = [...new Set(state.ploidy.mitosis.map(r => r.trt))];
      const ctl = trts.find(t => /testigo|control|agua|water/i.test(t)) || trts[0];
      const A = Ploidy.allium(state.ploidy.mitosis, ctl);
      h += `<h3>${esc(T('Prueba de Allium', 'Allium test'))}</h3>` + Report.htmlTable([[T('Tratamiento', 'Treatment'), T('Células', 'Cells'), T('Índice mitótico (%)', 'Mitotic index (%)'), T('Aberraciones (%)', 'Aberrations (%)'), T('Micronúcleos (‰)', 'Micronuclei (‰)')]]
        .concat(A.res.map(r => [r.trt + (r.trt === A.control ? ' (' + T('testigo', 'control') + ')' : ''), r.tot, fmtFixed(r.MI, 2), fmtFixed(r.AI, 2), fmtFixed(r.MN, 2)])));
    }
    const sAcc = state.accessions.filter(a => state.bands.signals.some(s => s.acc === a.id));
    if (sAcc.length) {
      const probes = Bands.probes().filter(p => state.bands.signals.some(s => s.probe === p.id));
      h += `<h3>${esc(T('Bandas y señales (sitios por juego)', 'Bands and signals (sites per set)'))}</h3>` + Report.htmlTable([[T('Accesión', 'Accession')].concat(probes.map(p => p.name))]
        .concat(sAcc.map(a => { const c = Bands.siteCounts(a.id); return [accName(a.id)].concat(probes.map(p => fmtNum(c[p.id] || 0, 1))); })));
    }
    if (window.Block8) {
      const A = Block8.analyse();
      if (A.CL) h += `<h3>${esc(T('Comparación', 'Comparison'))}</h3>` + Report.htmlTable([[''].concat(A.use.map(r => r.name))].concat(A.D.map((row, i) => [A.use[i].name].concat(row.map(v => fmtFixed(v, 3))))), T('Matriz de distancias', 'Distance matrix'));
    }
    return h;
  }
  async function reportHtml() {
    if (!figs.length) await renderFigs();
    const M = Report.methods(I18N.lang), now = new Date();
    const title = (state.meta.title || '').trim() || T('Informe de citogenética', 'Cytogenetics report');
    const S = summaryRows();
    let body = `<h1>${esc(title)}</h1><p class="meta">${state.meta.author ? esc(state.meta.author) + ' · ' : ''}${now.toLocaleDateString(I18N.lang === 'en' ? 'en-GB' : 'es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} · CytogeneticsPro ${APP_VERSION}</p>`;
    if (state.meta.example) body += `<p class="note">${esc(T('Los datos de este informe son simulados (un ejemplo de la aplicación); no son mediciones reales.', 'The data of this report are simulated (an example of the application); they are not real measurements.'))}</p>`;
    if (S.length > 1) body += `<h2>${esc(T('Resumen', 'Summary'))}</h2>` + Report.htmlTable(S);
    body += `<h2>${esc(T('Métodos', 'Methods'))}</h2>` + M.paragraphs.map(p => `<p>${p}</p>`).join('');
    const res = resultsHtml();
    if (res) body += `<h2>${esc(T('Resultados', 'Results'))}</h2>` + res;
    const chosen = figs.map((f, i) => ({ f, i })).filter(x => !off.has(x.f.id));
    if (chosen.length) {
      body += `<h2>${esc(T('Figuras', 'Figures'))}</h2>`;
      chosen.forEach((x, k) => { const s = figText(x.i); if (s) body += `<figure>${s.replace(/^<\?xml[^>]*>\s*/, '')}<figcaption>${esc(T('Figura ', 'Figure ') + (k + 1) + '. ' + T(x.f.es, x.f.en))}</figcaption></figure>`; });
    }
    body += `<h2>${esc(T('Referencias', 'References'))}</h2><ul class="refs">${M.refs.map(r => `<li>${r}</li>`).join('')}</ul>`;
    return Report.page(title, body, I18N.lang);
  }

  /* ---------------- the package ---------------- */
  function readme(files) {
    const d = new Date().toISOString().slice(0, 10);
    return ['CytogeneticsPro ' + APP_VERSION + ' · paquete reproducible / reproducible package', d, '',
      'ES', 'Este paquete contiene el proyecto y todo lo que la aplicación calculó con él.', 'Para repetir el análisis: abre CytogeneticsPro (index.html, con doble clic) y carga el archivo del proyecto con «Abrir proyecto» (Ctrl+O). Todos los resultados se vuelven a calcular a partir de los datos.', '',
      'EN', 'This package holds the project and everything the application computed with it.', 'To repeat the analysis: open CytogeneticsPro (index.html, by double click) and load the project file with «Open project» (Ctrl+O). Every result is computed again from the data.', '',
      state.meta.example ? 'Datos simulados (ejemplo de la aplicación) / Simulated data (an example of the application).\n' : '',
      'Archivos / Files:'].concat(files.map(f => '  ' + f)).concat(['', 'Cita / Citation:', stripTags(Home.citeText().apa), '']).join('\r\n');
  }
  const stripTags = s => String(s).replace(/<[^>]+>/g, '');
  async function buildPackage(work) {
    if (!figs.length) await renderFigs();
    const files = [], base = slug(state.meta.title || (state.accessions[0] && accName(state.accessions[0].id)) || 'cytogeneticspro').slice(0, 40).replace(/_[^_]*$/, '') || 'cytogeneticspro';
    files.push({ name: 'proyecto_' + base + '.json', data: projectJSON() });
    files.push({ name: 'informe.html', data: await reportHtml() });
    files.push({ name: 'metodos_es.txt', data: '﻿' + Report.methodsText('es') });
    files.push({ name: 'methods_en.txt', data: '﻿' + Report.methodsText('en') });
    Report.tables().forEach(t => files.push({ name: 'tablas/' + t.id + '.csv', data: toDelimited(t.rows) }));
    for (let i = 0; i < figs.length; i++) {
      if (work) work.update((i + 1) / (figs.length + 1));
      const s = figText(i);
      if (!s) continue;
      files.push({ name: 'figuras/' + figs[i].id + '.svg', data: s });
      try {
        const svg = el('b10Fig' + i).querySelector('svg');
        const b = await Fig.pngBlob(svg, 2);
        files.push({ name: 'figuras/' + figs[i].id + '.png', data: new Uint8Array(await b.arrayBuffer()) });
      } catch (e) { /* a figure that cannot be drawn as PNG keeps its SVG */ }
    }
    files.unshift({ name: 'LEEME.txt', data: '﻿' + readme(files.map(f => f.name)) });
    return { blob: Zip.make(files), name: 'cytogeneticspro_' + base + '.zip', files };
  }

  /* ---------------- wiring ---------------- */
  function renderTiles() {
    const T0 = Report.tables();
    statTiles('b10Tiles', [[L2('Accesiones', 'Accessions'), state.accessions.length], [L2('Figuras', 'Figures'), figs.length, L2(`${figs.filter(f => !off.has(f.id)).length} en el informe`, `${figs.filter(f => !off.has(f.id)).length} in the report`)],
      [L2('Tablas', 'Tables'), T0.length], [L2('Referencias citadas', 'References cited'), Report.methods(I18N.lang).refs.length]]);
  }
  async function render() {
    el('b10Title').value = state.meta.title || '';
    el('b10Author').value = state.meta.author || '';
    if (!el('b10MLang').dataset.touched) el('b10MLang').value = I18N.lang;
    renderTables(); renderMethods();
    await renderFigs();
    renderTiles();
    blockDone();
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (!el('panel-10')) return;
    el('b10Title').addEventListener('input', e => { state.meta.title = e.target.value; });
    el('b10Author').addEventListener('input', e => { state.meta.author = e.target.value; });
    el('b10MLang').addEventListener('change', e => { e.target.dataset.touched = '1'; renderMethods(); });
    el('b10MCopy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(Report.methodsText(el('b10MLang').value)); toast(T('Métodos copiados.', 'Methods copied.'), 'success'); }
      catch (e) { toast(T('No se pudo copiar; usa «Descargar».', 'Could not copy; use «Download».'), 'warning'); }
    });
    el('b10MSave').addEventListener('click', () => download('﻿' + Report.methodsText(el('b10MLang').value), el('b10MLang').value === 'en' ? 'methods.txt' : 'metodos.txt', 'text/plain;charset=utf-8'));
    el('b10Tables').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      const t = Report.tables().find(x => x.id === b.dataset.tab);
      if (!t) return;
      const tsv = b.dataset.fmt === 'tsv';
      download(toDelimited(t.rows, tsv ? '\t' : ','), t.id + (tsv ? '.tsv' : '.csv'), tsv ? 'text/tab-separated-values;charset=utf-8' : 'text/csv;charset=utf-8');
    });
    el('b10Figs').addEventListener('change', e => { const c = e.target.closest('[data-fig]'); if (c) { if (c.checked) off.delete(c.dataset.fig); else off.add(c.dataset.fig); renderTiles(); } });
    el('b10FigAll').addEventListener('click', () => { off.clear(); el('b10Figs').querySelectorAll('[data-fig]').forEach(c => { c.checked = true; }); renderTiles(); });
    el('b10FigNone').addEventListener('click', () => { figs.forEach(f => off.add(f.id)); el('b10Figs').querySelectorAll('[data-fig]').forEach(c => { c.checked = false; }); renderTiles(); });
    el('b10Print').addEventListener('click', async () => { Report.printHtml(await reportHtml()); state.results.report = Date.now(); blockDone(); });
    el('b10Html').addEventListener('click', async () => { download(await reportHtml(), 'informe_' + slug(state.meta.title || 'cytogeneticspro') + '.html', 'text/html;charset=utf-8'); state.results.report = Date.now(); blockDone(); });
    el('b10Zip').addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      try {
        const P = await withWork(T('Armando el paquete', 'Building the package'), w => buildPackage(w));
        download(P.blob, P.name);
        state.results.report = Date.now(); blockDone();
        toast(T(`Paquete listo: ${P.files.length} archivos.`, `Package ready: ${P.files.length} files.`), 'success');
      } catch (e) { toast(T('No se pudo armar el paquete: ', 'Could not build the package: ') + e.message, 'error'); }
      finally { busy = false; }
    });
  });
  document.addEventListener('stepchange', e => { if (e.detail.step === 10) render(); });
  document.addEventListener('projectchange', () => { figs = []; off = new Set(); });
  document.addEventListener('langchange', () => { if (el('panel-10') && el('panel-10').classList.contains('active')) render(); });

  window.Block10 = { render, collect, reportHtml, buildPackage, get figures() { return figs; } };
})();
