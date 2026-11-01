/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — global state and shared utilities.
   No ES modules: everything hangs from window so the app also works when
   index.html is opened with a double click (file://). */

/* the version of the program, written in the report, the project and the package */
const APP_VERSION = '1.0.0';
const APP_NAME = 'CytogeneticsPro';

/* Everything the user enters lives in `state`; the results of the blocks are
   recomputed from it, so a saved project only needs the data and the settings. */
function emptyState() {
  return {
    meta: { title: '', author: '', notes: '', example: null },
    accessions: [],      // {id, name, taxon, locality, lat, lon, x, color}
    images: {},          // id → {name, dataUrl, w, h}
    cells: [],           // {id, acc, label, image, scale, chromosomes, markers, groups, adjust}
    settings: {
      scheme: 'levan', custom: null, includeSat: true, strict: false, stArms: 1, k: 2,
      order: 'length', pop: false, unit: 'µm', satInFormula: true,
    },
    meiosis: { configs: [], phases: [], tetrads: [], pollen: [], hyp: null },
    ploidy: { counts: [], xTable: null, fcm: [], histos: [], mitosis: [] },
    bands: { probes: null, signals: [] },
    compare: { extra: [], newick: '', vars: null, settings: null },
    /* derived (not saved) */
    karyo: null,         // Block 3: {accId: karyotype}
    asym: null,          // Block 4: {accId: indices}
    results: {},         // the latest result of every block, for the report
    figures: {},
  };
}
const state = emptyState();
window.state = state;

const STEPS = [
  { n: 1, es: 'Inicio', en: 'Home', ready: true },
  { n: 2, es: 'Imágenes y medición', en: 'Images and measurement', ready: true },
  { n: 3, es: 'Cariotipo', en: 'Karyotype', ready: true },
  { n: 4, es: 'Asimetría', en: 'Asymmetry', ready: true },
  { n: 5, es: 'Meiosis', en: 'Meiosis', ready: true },
  { n: 6, es: 'Ploidía y genoma', en: 'Ploidy and genome', ready: true },
  { n: 7, es: 'Bandeo y FISH', en: 'Banding and FISH', ready: true },
  { n: 8, es: 'Comparación', en: 'Comparison', ready: true },
  { n: 9, es: 'Docencia', en: 'Teaching', ready: true },
  { n: 10, es: 'Figuras e informe', en: 'Figures and report', ready: true },
];

/* ---------------- DOM ---------------- */
function el(id) { return document.getElementById(id); }
function els(sel, root) { return [...(root || document).querySelectorAll(sel)]; }
function mk(tag, attrs, html) {
  const n = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'style') n.setAttribute('style', attrs[k]);
    else if (k.startsWith('on') && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  }
  if (html != null) n.innerHTML = html;
  return n;
}
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/* bilingual inline HTML: both spans are written, CSS shows the active one */
function L2(es, en) { return `<span data-l="es">${es}</span><span data-l="en">${en}</span>`; }
function svgEl(tag, attrs, text) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}
function showMessage(container, type, text, fix) {
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  const div = mk('div', { class: 'msg msg-' + type }, text + (fix ? `<div class="msg-fix">${fix}</div>` : ''));
  if (window.LABG) LABG.messageRole(div, type);
  container.appendChild(div);
  return div;
}
function clearMessages(container) {
  if (typeof container === 'string') container = el(container);
  if (container) container.innerHTML = '';
}
function toast(text, type) { if (window.LABG) LABG.toast(text, { type: type || 'info' }); }

/* ---------------- shared result components ----------------
   Every block reports with the same two pieces: a row of tiles for the handful
   of numbers that matter, and a table for the rest. */
function statTiles(container, tiles) {
  if (typeof container === 'string') container = el(container);
  if (!container) return;
  container.innerHTML = '';
  container.classList.add('results-summary');
  tiles.forEach(t => {
    const [label, value, sub, level] = Array.isArray(t) ? t : [t.label, t.value, t.sub, t.level];
    const d = mk('div', { class: 'stat-tile' + (level ? ' ' + level : '') });
    d.innerHTML = `<div class="stat-label">${label}</div><div class="stat-value">${value}</div>` +
      (sub ? `<div class="stat-sub">${sub}</div>` : '');
    container.appendChild(d);
  });
}
/* columns: [{key, label, get?, fmt?, num?, html?, cls?}] */
function buildTable(container, columns, rows, opts) {
  opts = opts || {};
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  container.innerHTML = '';
  const table = mk('table');
  if (opts.className) table.className = opts.className;
  if (opts.caption) table.appendChild(mk('caption', null, opts.caption));
  const thead = mk('thead'), trh = mk('tr');
  columns.forEach(c => {
    const th = mk('th', { class: c.num ? 'num' : null, scope: 'col' });
    th.innerHTML = c.label != null ? c.label : c.key;
    trh.appendChild(th);
  });
  thead.appendChild(trh); table.appendChild(thead);
  const tbody = mk('tbody');
  const shown = opts.limit ? rows.slice(0, opts.limit) : rows;
  shown.forEach(r => {
    const tr = mk('tr');
    if (r && r._class) tr.className = r._class;
    columns.forEach(c => {
      const td = mk('td', { class: [c.num ? 'num' : '', c.cls || ''].join(' ').trim() || null });
      let v = c.get ? c.get(r) : r[c.key];
      if (c.html) { td.innerHTML = v == null || v === '' ? '—' : v; tr.appendChild(td); return; }
      if (c.fmt && v != null && v !== '') v = c.fmt(v);
      td.textContent = (v === null || v === undefined || v === '' ||
        (typeof v === 'number' && !isFinite(v))) ? '—' : v;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  if (opts.foot) { const tf = mk('tfoot'); tf.innerHTML = opts.foot; table.appendChild(tf); }
  container.appendChild(table);
  if (opts.limit && rows.length > opts.limit) {
    const p = mk('p', { class: 'hint', style: 'padding:6px 12px;margin:0' });
    p.innerHTML = L2(`Se muestran ${opts.limit} de ${rows.length} filas.`, `Showing ${opts.limit} of ${rows.length} rows.`);
    container.appendChild(p);
  }
  return table;
}

/* ---------------- numbers ----------------
   Numbers use the decimal point in both languages (the convention of the
   scientific literature in Mexico and in English) and a true minus sign. */
function fmtNum(v, d) {
  if (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) return '—';
  const n = Number(v);
  if (!isFinite(n)) return String(v);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 1e-4 || abs >= 1e9) { const e = n.toExponential(d != null ? d : 2); return e.startsWith('-') ? '−' + e.slice(1) : e; }
  const s = n.toLocaleString('en-US', { maximumFractionDigits: d != null ? d : 3, useGrouping: abs >= 1e5 });
  if (/^-0(\.0*)?$/.test(s)) return s.slice(1);
  return s.startsWith('-') ? '−' + s.slice(1) : s;
}
function fmtFixed(v, d) {
  if (v == null || v === '' || !isFinite(v)) return '—';
  const s = Number(v).toFixed(d == null ? 3 : d);
  if (/^-0(\.0*)?$/.test(s)) return s.slice(1);
  return s.startsWith('-') ? '−' + s.slice(1) : s;
}
function fmtPct(x, d) {
  if (x == null || !isFinite(x)) return '—';
  return (x * 100).toFixed(d == null ? 1 : d) + '%';
}
/* a p-value as journals write it */
function fmtP(p) {
  if (p == null || !isFinite(p)) return '—';
  if (p < 0.001) return '< 0.001';
  return p.toFixed(3);
}
/* «p = 0.123» or «p < 0.001» */
function pEq(p) { const s = fmtP(p); return s.startsWith('<') ? 'p ' + s : 'p = ' + s; }
/* mean ± sd */
function fmtMS(m, s, d) {
  if (m == null || !isFinite(m)) return '—';
  return fmtFixed(m, d == null ? 2 : d) + (s != null && isFinite(s) ? ' ± ' + fmtFixed(s, d == null ? 2 : d) : '');
}
function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }
const num = v => { if (v == null || v === '') return NaN; const n = Number(String(v).trim().replace(',', '.')); return n; };

/* ---------------- CSV / TSV / downloads ---------------- */
function csvEscape(v, sep) {
  const s = String(v ?? '');
  return new RegExp('["\\n' + (sep === '\t' ? '\\t' : sep || ',') + ']').test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
/* rows: array of arrays (the first one, the header) */
function toDelimited(rows, sep) {
  sep = sep || ',';
  return '﻿' + rows.map(r => r.map(v => csvEscape(typeof v === 'number' ? (isFinite(v) ? String(+v.toPrecision(12)) : '') : v, sep)).join(sep)).join('\r\n') + '\r\n';
}
/* text from a file or the clipboard → array of rows; the separator is guessed
   (tab, semicolon or comma) and quoted fields are respected */
function parseDelimited(text) {
  text = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const first = text.split('\n').find(l => l.trim()) || '';
  /* a tab wins; then a semicolon (files written with the decimal comma use it); then the comma */
  const sep = first.includes('\t') ? '\t' : first.includes(';') ? ';' : ',';
  const rows = [];
  let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"' && cur === '') q = true;
    else if (ch === sep) { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return { rows: rows.filter(r => r.some(v => String(v).trim() !== '')).map(r => r.map(v => String(v).trim())), sep };
}
function download(content, filename, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = mk('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function slug(s) {
  return String(s || 'cytogeneticspro').replace(/\.[^.]+$/, '')
    .normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'cytogeneticspro';
}
function readFileText(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsText(file); });
}
function readFileDataUrl(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
}

/* ---------------- step navigation ---------------- */
function goStep(n) {
  n = String(n);
  els('.step-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + n));
  els('.step-btn').forEach(b => b.classList.toggle('active', b.dataset.step === n));
  document.body.classList.toggle('on-home', n === '1');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const btn = stepBtn(n);
  if (window.LABG) {
    LABG.setCurrentStep(n);
    if (btn) LABG.announce(T('Bloque ', 'Block ') + stepName(n));
  } else if (btn && btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  refreshStepMarks();
  refreshStepFooters();
  document.dispatchEvent(new CustomEvent('stepchange', { detail: { step: Number(n) } }));
}
const stepBtn = n => document.querySelector('.step-btn[data-step="' + n + '"]');
const stepOn = n => { const b = stepBtn(n); return !!b && !b.disabled; };
function stepName(n) {
  const s = STEPS.find(x => String(x.n) === String(n));
  return s ? s.n + ' · ' + T(s.es, s.en) : String(n);
}

/* A block counts as done when what it hands on to the others is in `state`.
   Recomputed on every change of block and every time a block finishes, so
   loading a new project clears the marks that no longer hold. */
const STEP_DONE = {
  2: () => state.cells.some(c => (c.chromosomes || []).length),
  3: () => !!(state.karyo && Object.keys(state.karyo).length),
  4: () => !!(state.asym && Object.keys(state.asym).length),
  5: () => !!(state.meiosis.configs.length || state.meiosis.pollen.length || state.meiosis.tetrads.length),
  6: () => !!(state.ploidy.counts.length || state.ploidy.fcm.length || state.ploidy.mitosis.length),
  7: () => !!state.bands.signals.length,
  8: () => !!state.results.compare,
  10: () => !!state.results.report,
};
function refreshStepMarks() {
  if (!window.LABG) return;
  STEPS.forEach(s => {
    const f = STEP_DONE[s.n];
    if (!f) return;
    LABG.markStep(s.n, stepOn(s.n) && f() ? 'done' : null);
  });
}

/* Footer of every block: Previous / Next, with the name of the block. */
function refreshStepFooters() {
  if (!window.LABG) return;
  els('.step-panel').forEach(p => {
    const n = Number(p.id.replace('panel-', ''));
    const i = STEPS.findIndex(s => s.n === n);
    if (i < 0) return;
    let f = p.querySelector(':scope > .step-footer');
    if (!f) {
      f = mk('nav', { class: 'step-footer no-print' });
      f.innerHTML = '<button type="button" class="btn btn-secondary prev"></button><button type="button" class="btn btn-primary next"></button>';
      f.addEventListener('click', e => { const b = e.target.closest('button[data-to]'); if (b && !b.disabled) goStep(b.dataset.to); });
      p.appendChild(f);
    }
    f.setAttribute('aria-label', T('Bloques', 'Blocks'));
    const prev = STEPS.slice(0, i).reverse().find(s => stepOn(s.n));
    const next = STEPS.slice(i + 1).find(s => stepBtn(s.n));
    const label = s => L2(s.n + ' · ' + s.es, s.n + ' · ' + s.en);
    const bp = f.querySelector('.prev'), bn = f.querySelector('.next');
    bp.hidden = !prev;
    if (prev) { bp.dataset.to = prev.n; bp.innerHTML = `← <span><small>${L2('Anterior', 'Previous')}</small>${label(prev)}</span>`; }
    bn.hidden = !next;
    if (next) {
      bn.dataset.to = next.n; bn.disabled = !stepOn(next.n);
      bn.innerHTML = `<span><small>${L2('Siguiente', 'Next')}</small>${label(next)}</span> →`;
    }
  });
}
function blockDone() { refreshStepMarks(); refreshStepFooters(); }

/* ---------------- the project ----------------
   The project is a JSON file with the data and the settings; the results are
   recomputed when it is opened. Images travel inside it as data URLs. */
const SAVED_KEYS = ['meta', 'accessions', 'images', 'cells', 'settings', 'meiosis', 'ploidy', 'bands', 'compare'];
function projectObject() {
  const data = {};
  SAVED_KEYS.forEach(k => { data[k] = JSON.parse(JSON.stringify(state[k])); });
  return { app: APP_NAME, format: 1, version: APP_VERSION, saved: new Date().toISOString(), data };
}
function projectJSON() { return JSON.stringify(projectObject(), null, 1); }
function loadProject(obj) {
  if (typeof obj === 'string') obj = JSON.parse(obj);
  if (!obj || obj.app !== APP_NAME || !obj.data) throw new Error(T('El archivo no es un proyecto de CytogeneticsPro.', 'The file is not a CytogeneticsPro project.'));
  const fresh = emptyState();
  Object.keys(fresh).forEach(k => { state[k] = fresh[k]; });
  SAVED_KEYS.forEach(k => {
    if (obj.data[k] == null) return;
    if (fresh[k] && typeof fresh[k] === 'object' && !Array.isArray(fresh[k])) state[k] = Object.assign(fresh[k], obj.data[k]);
    else state[k] = obj.data[k];
  });
  document.dispatchEvent(new CustomEvent('projectchange', { detail: { reason: 'load' } }));
  blockDone();
  return state;
}
function newProject() {
  const fresh = emptyState();
  Object.keys(fresh).forEach(k => { state[k] = fresh[k]; });
  document.dispatchEvent(new CustomEvent('projectchange', { detail: { reason: 'new' } }));
  blockDone();
}
function saveProjectFile() {
  const name = slug(state.meta.title || (state.accessions[0] && state.accessions[0].taxon) || 'proyecto') + '.cytogeneticspro.json';
  download(projectJSON(), name, 'application/json');
  toast(T('Proyecto guardado: ', 'Project saved: ') + name, 'success');
}
const hasData = () => !!(state.cells.length || state.meiosis.configs.length || state.ploidy.counts.length ||
  state.ploidy.fcm.length || state.ploidy.mitosis.length || state.bands.signals.length || state.compare.extra.length);
/* a short id, unique inside a project */
let idSeq = 0;
function uid(prefix) { return (prefix || 'x') + Date.now().toString(36).slice(-4) + (++idSeq).toString(36) + Math.random().toString(36).slice(2, 5); }
function accession(id) { return state.accessions.find(a => a.id === id) || null; }
/* the colour of an accession in every figure: its place in the list of the project */
const ACC_COLORS = ['var(--chart1)', 'var(--chart2)', 'var(--chart3)', 'var(--chart4)', 'var(--chart5)', 'var(--chart6)', 'var(--pr5)', 'var(--pr7)', 'var(--pr1)', 'var(--pr3)'];
function accColor(id) { const i = state.accessions.findIndex(a => a.id === id); return ACC_COLORS[(i < 0 ? 0 : i) % ACC_COLORS.length]; }
/* a select with the accessions of the project (plus a «new» entry when asked) */
function accOptions(sel, cur, filter) {
  const list = state.accessions.filter(a => !filter || filter(a));
  sel.innerHTML = list.map(a => `<option value="${esc(a.id)}">${esc(a.name || a.taxon || a.id)}</option>`).join('') || `<option value="">${esc(T('(ninguna todavía)', '(none yet)'))}</option>`;
  if (cur && list.some(a => a.id === cur)) sel.value = cur;
  return sel.value || null;
}
function newAccession(name) {
  const a = { id: uid('a'), name: name || T('Accesión ', 'Accession ') + (state.accessions.length + 1), taxon: '', locality: '', lat: null, lon: null, x: null };
  state.accessions.push(a);
  return a;
}
function accName(id) { const a = accession(id); return a ? (a.name || a.taxon || a.id) : String(id || '—'); }

/* ---------------- common bar of the LABG Suite ----------------
   Every call to labg-core.js is guarded: the test page loads this file
   without it. */
function paintCommonBar() {
  if (!window.LABG) return;
  LABG.theme.paint();
  const nav = el('stepper');
  if (nav) nav.setAttribute('aria-label', T('Bloques', 'Blocks'));
}
document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  if (!window.LABG) return;
  LABG.theme.init('cytogeneticspro.theme');
  const tb = el('themeBtn');
  if (tb) tb.addEventListener('click', () => LABG.theme.toggle());
  if (LABG.work) {
    LABG.work.tips = [
      ['El índice centromérico es 100 · brazo corto / longitud total: 50 es un cromosoma metacéntrico perfecto.',
        'The centromeric index is 100 · short arm / total length: 50 is a perfect metacentric chromosome.'],
      ['MCA y CVCL bastan para describir la asimetría de un cariotipo: una mide dónde están los centrómeros y la otra cuánto varían las longitudes.',
        'MCA and CVCL are enough to describe karyotype asymmetry: one measures where the centromeres are and the other how much the lengths vary.'],
      ['Un anillo bivalente tiene al menos dos quiasmas; uno en varilla, uno.', 'A ring bivalent has at least two chiasmata; a rod bivalent, one.'],
      ['1 pg de ADN equivale a 978 millones de pares de bases.', '1 pg of DNA equals 978 million base pairs.'],
    ];
  }
  const hb = el('helpBtn');
  if (hb) hb.addEventListener('click', () => LABG.showShortcuts());
  LABG.shortcuts([
    { keys: ['Ctrl', 'S'], es: 'Guardar el proyecto (JSON)', en: 'Save the project (JSON)' },
    { keys: ['Ctrl', 'O'], es: 'Abrir un proyecto', en: 'Open a project' },
  ]);
  LABG.bindStepKeys(goStep);
  LABG.guardUnload(hasData);
  LABG.setCurrentStep((document.querySelector('.step-btn.active') || {}).dataset?.step || '1');
  document.addEventListener('themechange', paintCommonBar);
  document.addEventListener('langchange', () => { paintCommonBar(); refreshStepFooters(); });
  paintCommonBar();
  refreshStepMarks();
  refreshStepFooters();
}, 0));

/* Ctrl+S saves the project and Ctrl+O opens one, from any block */
document.addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 's') { e.preventDefault(); saveProjectFile(); }
  else if (k === 'o') { const f = el('projectFile'); if (f) { e.preventDefault(); f.click(); } }
});

/* Runs a long synchronous computation once the browser has painted, so the
   waiting layer (LABG.work) is on screen before the page is taken over. */
function afterPaint(f) { return (window.LABG ? LABG.nextPaint() : new Promise(r => setTimeout(r, 30))).then(f); }
async function withWork(title, task) {
  if (!(window.LABG && LABG.work)) return task({ update() {}, message() {} });
  return LABG.work.run({ title, delay: 300 }, task);
}

/* Persisted preferences */
const Prefs = {
  get(k, d) { try { const v = localStorage.getItem('cytogeneticspro.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('cytogeneticspro.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};

/* ---------------- random numbers ----------------
   Everything stochastic (the examples, the simulated cell of the lab, the
   exercises of Block 9) draws from a seeded generator, so it is reproducible.
   sfc32, a small fast counter generator. */
function rng(seed) {
  let a = 0x9e3779b9, b = 0x243f6a88, c = 0xb7e15162, d = (seed >>> 0) ^ 0xdeadbeef;
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 15; i++) next();
  return next;
}
/* a normal deviate from a uniform generator (Box–Muller) */
function rnorm(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback || '#8a2a6b';
}
/* a "nice" number for scale bars and axis ticks: 1, 2 or 5 × 10^k */
function niceNum(x, round) {
  if (!(x > 0)) return 1;
  const e = Math.floor(Math.log10(x)), f = x / Math.pow(10, e);
  const nf = round ? (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) : (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10);
  return nf * Math.pow(10, e);
}

Object.assign(window, {
  APP_VERSION, APP_NAME, STEPS, emptyState, el, els, mk, esc, L2, svgEl, showMessage, clearMessages, toast, statTiles, buildTable,
  fmtNum, fmtFixed, fmtPct, fmtP, pEq, fmtMS, plural, num, csvEscape, toDelimited, parseDelimited, download, slug,
  readFileText, readFileDataUrl, goStep, stepBtn, stepOn, stepName, refreshStepMarks, refreshStepFooters, blockDone,
  projectObject, projectJSON, loadProject, newProject, saveProjectFile, hasData, uid, accession, accName, accColor, accOptions, newAccession, ACC_COLORS,
  afterPaint, withWork, Prefs, rng, rnorm, cssVar, niceNum,
});
