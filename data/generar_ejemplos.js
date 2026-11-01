/* CytogeneticsPro — generador de los ejemplos simulados.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán. Software libre bajo la GPL v3 o posterior.

   Uso (desde esta carpeta):  node generar_ejemplos.js
   Escribe los datos entre las marcas GENERADO de ../js/examples.js.

   NADA DE ESTO ES UNA MEDICIÓN. Los nombres de las especies y de los lugares son
   reales; los números se generan aquí con una semilla fija a partir de cariotipos
   base redondeados (ver LEEME.md). Se ven como datos reales para que la app pueda
   recorrerse de principio a fin, no para describir a esas especies. */
'use strict';
const fs = require('fs');
const path = require('path');
global.window = global;
require('../js/stats.js');
require('../js/meiosis.js');

/* ---------------- números al azar con semilla (sfc32, como la app) ---------------- */
function rng(seed) {
  let a = 0x9e3779b9, b = 0x243f6a88, c = 0xb7e15162, d = (seed >>> 0) ^ 0xdeadbeef;
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); d = (d + 1) | 0;
    t = (t + d) | 0; c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 15; i++) next();
  return next;
}
const R = rng(20261006);
const norm = () => { let u = 0; while (u === 0) u = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * R()); };
const r2 = v => Math.round(v * 100) / 100;
const r3 = v => Math.round(v * 1000) / 1000;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pois = lam => { let L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= R(); } while (p > L); return k - 1; };
const binom = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (R() < p) k++; return k; };

/* the measured arms of the pairs of a base karyotype: p excludes the satellite */
function basePairs(B) {
  return B.rl.map((rl, i) => {
    const c = rl / 100 * B.thl, r = B.r[i], s = c / (1 + r), sat = B.sat && B.sat[i + 1];
    const len = sat ? sat.len : 0;
    return sat && sat.arm === 'l' ? { p: s, q: c - s - len, sat: len, satArm: 'q' } : { p: s - len, q: c - s, sat: len, satArm: len ? 'p' : null };
  });
}
/* one measured cell: a condensation factor for the whole cell, and the error
   of measuring each arm of each homologue */
function measuredCell(pairs, k, cv) {
  const f = 1 + 0.08 * norm(), out = [];
  pairs.forEach((pp, j) => {
    for (let h = 0; h < k; h++) {
      const e1 = 1 + cv * norm(), e2 = 1 + cv * norm();
      out.push({ p: r2(Math.max(0.05, pp.p * f * e1)), q: r2(pp.q * f * e2), sat: pp.sat ? r2(pp.sat * f * (1 + cv * norm())) : 0, satArm: pp.sat ? pp.satArm : null, _pair: j });
    }
  });
  shuffle(out);
  return out.map((x, i) => { const o = { id: 'k' + (i + 1), label: i + 1, p: x.p, q: x.q }; if (x.sat) { o.sat = x.sat; o.satArm = x.satArm; } return o; });
}

/* ================= (a) Zea mays, 2n = 2x = 20 ================= */
const ZEA = {
  thl: 56, x: 10,
  rl: [14.5, 12.6, 11.4, 11.0, 10.8, 9.2, 8.9, 8.2, 7.6, 5.8],
  r: [1.25, 1.30, 2.15, 1.60, 1.10, 2.40, 2.70, 2.90, 1.85, 2.60],
  sat: { 6: { arm: 's', len: 0.45 } },
  knobs: { 2: [['l', 0.78]], 4: [['l', 0.55]], 5: [['l', 0.72]], 6: [['l', 0.62]], 7: [['l', 0.66]], 8: [['l', 0.48]], 9: [['s', 0.93]] },
};
function zea() {
  const pairs = basePairs(ZEA);
  /* cell 1: a metaphase drawn by the app; its layout is fixed here */
  const W = 1100, H = 820, ppu = 13.5, chromosomes = [], placed = [];
  pairs.forEach((pp, j) => [0, 1].forEach(() => {
    const f = 1 + 0.05 * norm();
    let cx, cy, tries = 0;
    do { cx = 130 + R() * (W - 260); cy = 110 + R() * (H - 260); tries++; } while (tries < 400 && placed.some(q => Math.hypot(q[0] - cx, q[1] - cy) < 128));
    placed.push([cx, cy]);
    chromosomes.push({ cx: r2(cx), cy: r2(cy), ang: r3(R() * Math.PI * 2), bend: r3((R() - 0.5) * 0.5), s: r3(pp.p * f), l: r3(pp.q * f),
      sat: pp.sat ? r3(pp.sat * f) : 0, satArm: pp.sat ? 'p' : null, knobs: (ZEA.knobs[j + 1] || []).map(k => k.slice()) });
  }));
  const synth = { w: W, h: H, pxPerUm: ppu, seed: 7781, bar: 10, width: 15, nuclei: [[80, 760, 46], [1040, 90, 52], [990, 700, 40]], chromosomes };
  const cells = [{ id: 'zea-c1', acc: 'zea', label: 'Célula 1 (imagen)', synth }];
  for (let i = 2; i <= 5; i++) cells.push({ id: 'zea-c' + i, acc: 'zea', label: 'Célula ' + i, chromosomes: measuredCell(pairs, 2, 0.04) });
  /* the knobs as C-bands, for Block 7 */
  const signals = [];
  Object.keys(ZEA.knobs).forEach(j => ZEA.knobs[j].forEach(k => signals.push({ acc: 'zea', pair: +j, homolog: null, arm: k[0], pos: k[1], size: 0.12, probe: 'knob' })));
  signals.push({ acc: 'zea', pair: 6, homolog: null, arm: 's', pos: 0.92, size: 0.1, probe: 'nor' });
  return {
    meta: { title: 'Zea mays (ejemplo simulado)', notes: 'Datos simulados con data/generar_ejemplos.js; no son mediciones.' },
    accessions: [{ id: 'zea', name: 'Maíz criollo · Texcoco', taxon: 'Zea mays', locality: 'Texcoco, Estado de México', lat: 19.49, lon: -98.88, x: 10 }],
    cells,
    bands: {
      probes: [{ id: 'knob', name: 'Banda C (nudo)', kind: 'C', color: 'var(--idio-het)' }, { id: 'nor', name: 'ADNr 45S (NOR)', kind: 'FISH', color: 'var(--pr1)' }],
      signals,
    },
    ploidy: { counts: Array.from({ length: 12 }, (_, i) => ({ acc: 'zea', cell: 'Raíz ' + (1 + (i >> 2)) + '-' + (1 + i % 4), n2: i === 7 ? 19 : 20 })) },
  };
}

/* ================= (b) Sechium edule, 2n = 28 y 24 ================= */
const SECH = {
  thl: 30, x: 14,
  rl: [10.2, 9.4, 8.6, 8.1, 7.7, 7.3, 7.0, 6.7, 6.4, 6.1, 5.9, 5.8, 5.6, 5.2],
  r: [1.15, 1.35, 1.9, 1.25, 1.6, 2.4, 1.1, 1.45, 1.3, 2.1, 1.2, 1.7, 1.05, 1.5],
  sat: { 1: { arm: 's', len: 0.3 } },
};
function sechium() {
  const accs = [
    { id: 'hua', name: 'Chayote · Huatusco', taxon: 'Sechium edule', locality: 'Huatusco, Veracruz', lat: 19.15, lon: -96.97, x: 14, thl: 30, tweak: {} },
    { id: 'chi', name: 'Chayote · Chilchotla', taxon: 'Sechium edule', locality: 'Chilchotla, Puebla', lat: 19.26, lon: -97.18, x: 14, thl: 31.5, tweak: { 6: 2.9 } },
    { id: 'uru', name: 'Chayote · Uruapan', taxon: 'Sechium edule', locality: 'Uruapan, Michoacán', lat: 19.41, lon: -102.06, x: 14, thl: 29.2, tweak: { 3: 2.3, 10: 2.6 } },
    { id: 'syl', name: 'Chayote silvestre · Coscomatepec', taxon: 'Sechium edule subsp. sylvestre', locality: 'Coscomatepec, Veracruz', lat: 19.07, lon: -97.05, x: 12, thl: 28.4, wild: true },
  ];
  const cells = [], signals = [];
  accs.forEach(a => {
    let B = Object.assign({}, SECH, { thl: a.thl, r: SECH.r.slice(), rl: SECH.rl.slice() });
    Object.keys(a.tweak || {}).forEach(j => { B.r[j - 1] = a.tweak[j]; });
    if (a.wild) {
      /* two fusions (descending dysploidy): pairs 11 + 12 and 13 + 14 → two longer pairs */
      const rl = SECH.rl.slice(0, 10).concat([SECH.rl[10] + SECH.rl[11], SECH.rl[12] + SECH.rl[13]]);
      const r = SECH.r.slice(0, 10).concat([1.1, 1.25]);
      const idx = rl.map((v, i) => i).sort((i, j) => rl[j] - rl[i]);
      B = { thl: a.thl, x: 12, rl: idx.map(i => rl[i]), r: idx.map(i => r[i]), sat: { [idx.indexOf(0) + 1]: { arm: 's', len: 0.3 } } };
    }
    const pairs = basePairs(B);
    for (let i = 1; i <= 3; i++) cells.push({ id: a.id + '-c' + i, acc: a.id, label: 'Célula ' + i, chromosomes: measuredCell(pairs, 2, 0.05) });
    /* rDNA: 45S at the satellite of the first pair, 5S interstitial on the long arm of pair 4 */
    const p45 = a.wild ? B.rl.indexOf(SECH.rl[0]) + 1 : 1;
    signals.push({ acc: a.id, pair: p45, homolog: null, arm: 's', pos: 0.9, size: 0.16, probe: 's45' });
    signals.push({ acc: a.id, pair: 4, homolog: null, arm: 'l', pos: 0.45, size: 0.08, probe: 's5' });
    signals.push({ acc: a.id, pair: p45, homolog: null, arm: 's', pos: 0.9, size: 0.14, probe: 'cma' });
    if (a.id === 'uru') signals.push({ acc: a.id, pair: 9, homolog: 1, arm: 'l', pos: 0.8, size: 0.1, probe: 's45' });
    if (a.wild) signals.push({ acc: a.id, pair: 2, homolog: null, arm: 's', pos: 0.85, size: 0.12, probe: 's45' });
    /* per-cell signals of the 5S site to judge the concordance among cells */
    for (let i = 1; i <= 3; i++) signals.push({ acc: a.id, cell: a.id + '-c' + i, pair: 4, homolog: null, arm: 'l', pos: r2(0.45 + 0.04 * norm()), size: 0.08, probe: 's5' });
  });
  const newick = '(Momordica_charantia:0.32,((Cucumis_sativus:0.08,Cucumis_melo:0.08):0.12,Citrullus_lanatus:0.18):0.1,' +
    '(Cucurbita_pepo:0.22,(Luffa_aegyptiaca:0.15,(Sicyos_angulatus:0.1,(Sechium_edule_sylvestre:0.04,(Sechium_edule_Uruapan:0.02,' +
    '(Sechium_edule_Huatusco:0.01,Sechium_edule_Chilchotla:0.01):0.01):0.02):0.06):0.05):0.06):0.08);';
  const extra = [
    { name: 'Momordica charantia', n2: 22, x: 11 }, { name: 'Cucumis sativus', n2: 14, x: 7 }, { name: 'Cucumis melo', n2: 24, x: 12 },
    { name: 'Citrullus lanatus', n2: 22, x: 11 }, { name: 'Cucurbita pepo', n2: 40, x: 20 }, { name: 'Luffa aegyptiaca', n2: 26, x: 13 },
    { name: 'Sicyos angulatus', n2: 24, x: 12 },
  ];
  return {
    meta: { title: 'Sechium edule: tres accesiones cultivadas y una silvestre (ejemplo simulado)', notes: 'Datos simulados con data/generar_ejemplos.js; no son mediciones. El árbol es ilustrativo, no una filogenia publicada.' },
    accessions: accs.map(a => ({ id: a.id, name: a.name, taxon: a.taxon, locality: a.locality, lat: a.lat, lon: a.lon, x: a.x })),
    cells,
    bands: {
      probes: [{ id: 's45', name: 'ADNr 45S', kind: 'FISH', color: 'var(--pr1)' }, { id: 's5', name: 'ADNr 5S', kind: 'FISH', color: 'var(--pr2)' },
        { id: 'cma', name: 'CMA⁺', kind: 'fluor', color: 'var(--pr4)' }],
      signals,
    },
    compare: {
      newick, extra,
      map: { hua: 'Sechium_edule_Huatusco', chi: 'Sechium_edule_Chilchotla', uru: 'Sechium_edule_Uruapan', syl: 'Sechium_edule_sylvestre' },
    },
    ploidy: { counts: [].concat(...accs.map(a => Array.from({ length: 8 }, (_, i) => ({ acc: a.id, cell: 'Raíz ' + (1 + (i >> 2)) + '-' + (1 + i % 4), n2: a.wild ? 24 : (i === 5 && a.id === 'chi' ? 27 : 28) })))) },
  };
}

/* ================= (c) serie poliploide ficticia, x = 7 ================= */
function poly() {
  const levels = [
    { id: 'p2', name: 'Población diploide', level: 2, formula: 'AA', c: 0.9, pollen: 0.95, c2: 1.62 },
    { id: 'p4', name: 'Población tetraploide', level: 4, formula: 'AAAA', c: 0.78, pollen: 0.78, c2: 3.18 },
    { id: 'p6', name: 'Población hexaploide', level: 6, formula: 'AABBCC', c: 0.85, pollen: 0.88, c2: 4.71 },
  ];
  const configs = [], phases = [], tetrads = [], pollen = [], counts = [], fcm = [];
  levels.forEach(L => {
    for (let ind = 1; ind <= 2; ind++) {
      for (let i = 0; i < 25; i++) {
        /* the hexaploid pairs now and then outside its own genome: a few cells as AAAABB */
        const f = L.level === 6 && R() < 0.16 ? 'AAAABB' : L.formula;
        const s = Meiosis.simulateCell(f, 7, L.c, R);
        configs.push({ acc: L.id, ind: 'Planta ' + ind, cell: i + 1, I: s.c1 || 0, IIrod: s.c2 || 0, IIring: s.r2 || 0, III: s.c3 || 0, IVchain: s.c4 || 0, IVring: s.r4 || 0, V: s.c5 || 0, VIchain: s.c6 || 0, VIring: s.r6 || 0 });
      }
      const irr = L.level === 2 ? 0.02 : L.level === 4 ? 0.11 : 0.05;
      ['MI', 'AI', 'TI', 'MII', 'AII', 'TII'].forEach(ph => {
        const tot = 60 + Math.floor(R() * 40), ab = binom(tot, irr * (ph[0] === 'A' ? 1.6 : 1));
        const row = { acc: L.id, ind: 'Planta ' + ind, phase: ph, normal: tot - ab, bridges: 0, fragments: 0, laggards: 0, precocious: 0, spindles: 0, micronuclei: 0, other: 0 };
        for (let k = 0; k < ab; k++) {
          const cats = ph[0] === 'M' ? ['precocious', 'precocious', 'other'] : ph[0] === 'A' ? ['bridges', 'laggards', 'laggards', 'fragments'] : ['micronuclei', 'laggards', 'spindles'];
          row[cats[Math.floor(R() * cats.length)]]++;
        }
        phases.push(row);
      });
      const n = 300, pn = 1 - irr * 1.4;
      const normal = binom(n, pn), rest = n - normal;
      const mic = Math.round(rest * 0.45), dy = Math.round(rest * 0.2), tri = Math.round(rest * 0.2);
      tetrads.push({ acc: L.id, ind: 'Planta ' + ind, normal, micronuclei: mic, dyads: dy, triads: tri, polyads: rest - mic - dy - tri });
    }
    for (let ind = 1; ind <= 3; ind++) {
      const n = 380 + Math.floor(R() * 60), v = binom(n, Math.min(0.99, L.pollen + 0.025 * norm()));
      pollen.push({ acc: L.id, id: 'Planta ' + ind, viable: v, inviable: n - v });
    }
    for (let i = 0; i < 15; i++) {
      let n2 = 7 * L.level;
      if (L.level > 2 && R() < 0.12) n2 += R() < 0.5 ? -1 : 1;
      counts.push({ acc: L.id, cell: 'Raíz ' + (1 + Math.floor(i / 5)) + '-' + (1 + i % 5), n2 });
    }
    for (let ind = 1; ind <= 3; ind++) {
      const std = 200 + 4 * norm(), ratio = L.c2 * (1 + 0.012 * norm()) / 1.96;
      fcm.push({ acc: L.id, sample: L.name + ' · planta ' + ind, std: 'tomato', stdPeak: r2(std), samplePeak: r2(std * ratio), cvSample: r2(2.6 + 0.6 * R()), cvStd: r2(2.2 + 0.5 * R()) });
    }
  });
  /* the histogram of one run: the tetraploid with the standard (1024 channels) */
  const hist = new Array(1024).fill(0);
  const add = (n, m, sd) => { for (let i = 0; i < n; i++) { const v = Math.round(m + sd * norm()); if (v >= 0 && v < 1024) hist[v]++; } };
  for (let i = 0; i < 2600; i++) { const v = Math.floor(-Math.log(R()) * 55); if (v < 1024) hist[v]++; }
  add(2400, 200, 200 * 0.024); add(150, 400, 400 * 0.026);
  const s4 = 200 * 3.18 / 1.96;
  add(3600, s4, s4 * 0.031); add(260, 2 * s4, 2 * s4 * 0.033);
  return {
    meta: { title: 'Serie poliploide ficticia (2x, 4x, 6x)', notes: 'Especie y datos ficticios, simulados con data/generar_ejemplos.js.' },
    accessions: levels.map(L => ({ id: L.id, name: L.name, taxon: 'Especie ficticia A', locality: '—', x: 7, formula: L.formula })),
    cells: [],
    meiosis: { configs, phases, tetrads, pollen },
    ploidy: { counts, fcm, histos: [{ id: 'h4', acc: 'p4', name: 'Tetraploide con patrón de tomate', channels: hist }] },
  };
}

/* ================= (d) Allium cepa, prueba de citotoxicidad ================= */
function allium() {
  const T = [
    { trt: 'Testigo (agua destilada)', mi: 0.092, ab: 0.018, mn: 0.0006 },
    { trt: 'Extracto ficticio 1 %', mi: 0.066, ab: 0.062, mn: 0.0026 },
    { trt: 'Extracto ficticio 5 %', mi: 0.038, ab: 0.141, mn: 0.0071 },
  ];
  const mitosis = [];
  T.forEach(t => {
    for (let rep = 1; rep <= 3; rep++) {
      const total = 1000, div = binom(total, t.mi * (1 + 0.08 * norm()));
      const ph = [0.42, 0.24, 0.12, 0.22], counts = [0, 0, 0, 0];
      for (let i = 0; i < div; i++) { const u = R(); let a = 0, k = 0; while (k < 3 && u > (a += ph[k])) k++; counts[k]++; }
      const ab = binom(div, t.ab);
      const kinds = { cmeta: 0, sticky: 0, bridges: 0, laggards: 0, fragments: 0, multipolar: 0 };
      const names = Object.keys(kinds), w = [0.22, 0.24, 0.2, 0.18, 0.1, 0.06];
      for (let i = 0; i < ab; i++) { const u = R(); let a = 0, k = 0; while (k < 5 && u > (a += w[k])) k++; kinds[names[k]]++; }
      mitosis.push(Object.assign({ trt: t.trt, rep: 'Bulbo ' + rep, inter: total - div, pro: counts[0], meta: counts[1], ana: counts[2], telo: counts[3], mn: binom(total - div, t.mn) }, kinds));
    }
  });
  return {
    meta: { title: 'Allium cepa: prueba de citotoxicidad (ejemplo simulado)', notes: 'Tratamientos y conteos ficticios, simulados con data/generar_ejemplos.js.' },
    accessions: [{ id: 'cepa', name: 'Cebolla · raíces', taxon: 'Allium cepa', locality: '—', x: 8 }],
    cells: [],
    ploidy: { mitosis },
  };
}

const DATA = { zea: zea(), sechium: sechium(), poly: poly(), allium: allium() };
const file = path.join(__dirname, '..', 'js', 'examples.js');
let js = fs.readFileSync(file, 'utf8');
const a = js.indexOf('/* GENERADO: inicio */'), b = js.indexOf('/* GENERADO: fin */');
if (a < 0 || b < 0) throw new Error('faltan las marcas GENERADO en js/examples.js');
const body = '/* GENERADO: inicio */\n  /* written by data/generar_ejemplos.js — do not edit by hand */\n  const DATA = ' + JSON.stringify(DATA) + ';\n  ';
js = js.slice(0, a) + body + js.slice(b);
fs.writeFileSync(file, js);
console.log('ejemplos escritos:', Object.keys(DATA).map(k => k + ' (' + JSON.stringify(DATA[k]).length + ' bytes)').join(', '));
