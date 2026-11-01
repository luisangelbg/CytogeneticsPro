/* CytogeneticsPro — manual de usuario: dibuja la portada (es/00a-portada.html).
   Una sola ilustración vectorial original, hecha con los propios motores de la app sobre su ejemplo del maíz
   (Zea mays, 2n = 20, simulado: data/LEEME.md), para que la portada no sea un adorno sino una figura correcta:
     – al centro, una metafase teñida con DAPI: los veinte cromosomas del cariotipo base del maíz, cada uno con su
       longitud y su razón de brazos, dibujados con las cromátidas de Art.metaChr; encima, las señales de FISH del
       ejemplo: el ADNr 45S en el satélite del par 6 (rojo) y los nudos heterocromáticos (verde);
     – debajo, el idiograma haploide de los diez pares, a escala, con la clase de cada uno según Karyo.classify
       (Levan et al. 1964) y la fórmula cariotípica;
     – la franja de los diez colores de los bloques, los mismos del manual;
     – al pie, tres viñetas: una célula en diacinesis de un autotetraploide (Meiosis.simulateCell, AAAA, x = 7,
       c = 0.78, como la serie poliploide de ejemplo), el histograma del citómetro con el patrón interno de tomate
       (2C = 1.96 pg) y la muestra de 3.18 pg, y la cuadrícula de Stebbins con la casilla del maíz (Asym.compute).
   Sin azar libre: la disposición de la metafase y la célula meiótica salen de un generador con semilla fija.
   Uso, desde la carpeta de la app:   node manual/herramientas/genera-portada.js
   La edición inglesa (en/00a-portada.html: el mismo dibujo con los textos en inglés):  … genera-portada.js --idioma en */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const APP = path.resolve(__dirname, '..', '..');

/* the app's engines, loaded as validation/exportar.js loads them: a window without a page */
const noop = () => {};
const box = {
  console, Math, JSON, Date, Number, String, Array, Object, Map, Set, Symbol, Infinity, NaN, isFinite, parseFloat, parseInt,
  document: { addEventListener: noop, documentElement: { lang: 'es', setAttribute: noop }, querySelectorAll: () => [], querySelector: () => null, getElementById: () => null },
  localStorage: { getItem: () => null, setItem: noop }, navigator: { language: 'es' },
};
box.window = box; vm.createContext(box);
const load = f => vm.runInContext(fs.readFileSync(path.join(APP, f), 'utf8'), box, { filename: f });
load('js/i18n.js');
vm.runInContext('function rng(seed) {' + /function rng\(seed\) \{([\s\S]*?)\n\}/.exec(fs.readFileSync(path.join(APP, 'js/core.js'), 'utf8'))[1] + '\n}', box);
['js/stats.js', 'js/karyotype.js', 'js/asymmetry.js', 'js/meiosis.js', 'js/examples.js', 'js/art.js'].forEach(load);
const { Karyo, Asym, Meiosis, Examples, Art, rng } = box;

const EN = process.argv.includes('--idioma') && process.argv[process.argv.indexOf('--idioma') + 1] === 'en';
const L = (es, en) => (EN ? en : es);
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);

/* ---------------- the palette ---------------- */
const C = {
  marfil: '#f4ebf1', oro: '#d9b456', dapi: '#86aef0', dapiOsc: '#3d6fc4', ciruela: '#d47cb8', rojo: '#ff5a6e', verde: '#5fe08a',
};
const BLOQUES = ['#8a2a6b', '#2f5f9e', '#b0641c', '#4a7d42', '#6a5cb5', '#237a7a', '#00795c', '#55606e', '#a8457f', '#94701c'];
/* the CSS variables that Art writes, in the colours of the cover */
const VARS = { '--primary': C.ciruela, '--accent': C.dapi, '--leaf': '#8cc478', '--ty-st': '#f0a35e', '--chart5': '#b3a6f0', '--chart6': '#55cfcf', '--card-bg': '#1c0d18', '--text': C.marfil };
const sinVars = s => s.replace(/var\((--[a-z0-9-]+)\)/g, (m, k) => VARS[k] || m);

/* ---------------- the maize karyotype (the app's base) ---------------- */
const B = Examples.BASE.zea;
const pares = Examples.basePairs(B);              /* {p, q, sat, satArm} in µm */
const clases = pares.map(P => Karyo.classify(P.p + (P.satArm === 'p' ? P.sat : 0), P.q + (P.satArm === 'q' ? P.sat : 0), 'levan'));
const A = Asym.compute(pares.map(P => ({ s: P.p + (P.satArm === 'p' ? P.sat : 0), l: P.q + (P.satArm === 'q' ? P.sat : 0) })));
const cuenta = {};
clases.forEach((c, i) => { const k = c + (pares[i].sat ? '-sat' : ''); cuenta[k] = (cuenta[k] || 0) + 2; });
const formula = '2n = 2x = 20 = ' + ['m', 'sm', 'st', 't', 'm-sat', 'sm-sat', 'st-sat'].filter(k => cuenta[k]).map(k => cuenta[k] + k).join(' + ');

const W = 850, H = 1100;
let s = `<defs>
  <radialGradient id="fondo" cx="50%" cy="44%" r="78%"><stop offset="0" stop-color="#341430"/><stop offset="0.55" stop-color="#1d0b19"/><stop offset="1" stop-color="#0e050c"/></radialGradient>
  <linearGradient id="oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ebcb73"/><stop offset="0.5" stop-color="#b98d2c"/><stop offset="1" stop-color="#e3bd5e"/></linearGradient>
  <radialGradient id="campo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0d1a33"/><stop offset="0.82" stop-color="#091224"/><stop offset="1" stop-color="#050a16"/></radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0.7" stop-color="#86aef0" stop-opacity="0.16"/><stop offset="1" stop-color="#86aef0" stop-opacity="0"/></radialGradient>
  <filter id="brillo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="ocular"><circle cx="425" cy="525" r="168"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="url(#fondo)"/>
<rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="url(#oro)" stroke-width="2.2"/>
<rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="#b98d2c" stroke-width="0.7" opacity="0.7"/>`;
/* corner ornaments: a small metaphase chromosome in each corner, m, sm, st and t */
[[62, 62, 1.0, -35], [W - 62, 62, 2.2, 35], [62, H - 62, 4.0, 35], [W - 62, H - 62, 1.6, -35]].forEach(([x, y, r, a]) => {
  const tot = 26, sh = tot / (1 + r);
  s += sinVars(Art.metaChr(x, y + (tot / 2 - sh) * 0.5, sh, tot - sh, 5.2, a, C.oro));
});

/* ---------------- title ---------------- */
s += `<text x="${W / 2}" y="104" text-anchor="middle" font-family="Jost" font-weight="500" font-size="12.5" letter-spacing="5.5" fill="${C.oro}">${L('LABG SUITE · CIENCIA ABIERTA EN EL NAVEGADOR', 'LABG SUITE · OPEN SCIENCE IN THE BROWSER')}</text>
<text x="${W / 2}" y="194" text-anchor="middle" font-family="Cormorant" font-weight="600" font-size="86" fill="${C.marfil}">Cytogenetics<tspan fill="${C.dapi}">Pro</tspan></text>
<line x1="${W / 2 - 70}" y1="220" x2="${W / 2 + 70}" y2="220" stroke="${C.oro}" stroke-width="1.4"/>`;
s += EN
  ? `
<text x="${W / 2}" y="258" text-anchor="middle" font-family="Cormorant" font-weight="600" font-size="38" fill="${C.marfil}">User’s Manual</text>
<text x="${W / 2}" y="287" text-anchor="middle" font-family="Cormorant" font-style="italic" font-weight="500" font-size="25" fill="${C.oro}">Manual de usuario</text>
<text x="${W / 2}" y="316" text-anchor="middle" font-family="Jost" font-weight="400" font-size="15" fill="${C.marfil}" opacity="0.88">From the chromosome count to the publishable karyotype</text>
<text x="${W / 2}" y="335" text-anchor="middle" font-family="Cormorant" font-style="italic" font-weight="500" font-size="14" fill="${C.marfil}" opacity="0.6">Del conteo cromosómico al cariotipo publicable</text>`
  : `
<text x="${W / 2}" y="258" text-anchor="middle" font-family="Cormorant" font-weight="600" font-size="38" fill="${C.marfil}">Manual de usuario</text>
<text x="${W / 2}" y="287" text-anchor="middle" font-family="Cormorant" font-style="italic" font-weight="500" font-size="25" fill="${C.oro}">User’s Manual</text>
<text x="${W / 2}" y="316" text-anchor="middle" font-family="Jost" font-weight="400" font-size="15" fill="${C.marfil}" opacity="0.88">Del conteo cromosómico al cariotipo publicable</text>
<text x="${W / 2}" y="335" text-anchor="middle" font-family="Cormorant" font-style="italic" font-weight="500" font-size="14" fill="${C.marfil}" opacity="0.6">From the chromosome count to the publishable karyotype</text>`;

/* ---------------- the DAPI metaphase with its FISH signals ---------------- */
const CX = 425, CY = 525, RAD = 168, ESC = 8.4; /* px per µm */
s += `<circle cx="${CX}" cy="${CY}" r="${RAD + 26}" fill="url(#halo)"/>
<circle cx="${CX}" cy="${CY}" r="${RAD}" fill="url(#campo)"/>`;
{
  const R = rng(20261101), puestos = [];
  let g = '';
  /* a faint interphase nucleus at the edge of the field, as in a real preparation */
  g += `<ellipse cx="${CX + 108}" cy="${CY + 112}" rx="34" ry="27" fill="#3d6fc4" opacity="0.32"/><ellipse cx="${CX - 128}" cy="${CY - 96}" rx="26" ry="22" fill="#3d6fc4" opacity="0.25"/>`;
  const cromos = [];
  pares.forEach((P, i) => { for (let h = 0; h < 2; h++) cromos.push({ P, i, h }); });
  /* longest first, so that the big ones find room */
  cromos.sort((a, b) => (b.P.p + b.P.q) - (a.P.p + a.P.q));
  cromos.forEach(({ P, i }) => {
    const sAll = (P.p + (P.satArm === 'p' ? P.sat : 0)) * ESC, l = (P.q + (P.satArm === 'q' ? P.sat : 0)) * ESC, len = sAll + l;
    let x, y, ang, ok = false;
    for (let t = 0; t < 4000 && !ok; t++) {
      const rr = Math.sqrt(R()) * (RAD - len / 2 - 12), th = R() * 2 * Math.PI;
      x = CX + rr * Math.cos(th); y = CY + rr * Math.sin(th); ang = R() * 360;
      ok = puestos.every(q => Math.hypot(q.x - x, q.y - y) > (q.len + len) / 2 * 0.78 + 6);
    }
    puestos.push({ x, y, len });
    /* the signals ride on the chromatids: knobs (green) on their arm, the 45S site (red) on the satellite */
    const w = 6.2, hw = w / 2 * 1.05;
    let extra = '';
    (B.knobs[i + 1] || []).forEach(([arm, fr]) => {
      const yy = arm === 'l' ? fr * l : -fr * sAll;
      extra += `<circle cx="${f1(-hw)}" cy="${f1(yy)}" r="2.5" fill="${C.verde}"/><circle cx="${f1(hw)}" cy="${f1(yy)}" r="2.5" fill="${C.verde}"/>`;
    });
    if (P.sat) {
      const yy = P.satArm === 'p' ? -sAll + P.sat * ESC * 0.5 : l - P.sat * ESC * 0.5;
      extra += `<circle cx="${f1(-hw)}" cy="${f1(yy)}" r="2.9" fill="${C.rojo}"/><circle cx="${f1(hw)}" cy="${f1(yy)}" r="2.9" fill="${C.rojo}"/>`;
    }
    /* metaChr puts the centromere at the origin: shift by the arm difference so the chromosome is centred */
    g += sinVars(Art.metaChr(x, y, sAll, l, w, ang, C.dapi, extra));
  });
  s += `<g clip-path="url(#ocular)" filter="url(#brillo)">${g}</g>`;
}
s += `<circle cx="${CX}" cy="${CY}" r="${RAD}" fill="none" stroke="url(#oro)" stroke-width="1.6"/>
<circle cx="${CX}" cy="${CY}" r="${RAD + 7}" fill="none" stroke="#b98d2c" stroke-width="0.6" opacity="0.6"/>`;
/* scale bar of 10 µm inside the field, and the legend of the signals outside it */
s += `<line x1="${CX + 52}" y1="${CY + 146}" x2="${CX + 52 + 10 * ESC}" y2="${CY + 146}" stroke="${C.marfil}" stroke-width="2.2"/>
<text x="${CX + 52 + 5 * ESC}" y="${CY + 140}" text-anchor="middle" font-family="Jost" font-size="9" fill="${C.marfil}">10 µm</text>`;
s += `<g font-family="Jost" font-size="10" fill="${C.marfil}" opacity="0.88">
<circle cx="${CX + 196}" cy="${CY - 120}" r="4" fill="${C.dapi}"/><text x="${CX + 206}" y="${CY - 116.5}">DAPI</text>
<circle cx="${CX + 196}" cy="${CY - 100}" r="4" fill="${C.rojo}"/><text x="${CX + 206}" y="${CY - 96.5}">${L('ADNr 45S', '45S rDNA')}</text>
<circle cx="${CX + 196}" cy="${CY - 80}" r="4" fill="${C.verde}"/><text x="${CX + 206}" y="${CY - 76.5}">${L('nudos', 'knobs')}</text></g>
<text x="${CX - 196}" y="${CY - 116}" text-anchor="end" font-family="Cormorant" font-style="italic" font-size="17" fill="${C.marfil}">Zea mays</text>
<text x="${CX - 196}" y="${CY - 99}" text-anchor="end" font-family="Jost" font-size="10" fill="${C.oro}">2n = 20</text>
<text x="${CX - 196}" y="${CY - 85}" text-anchor="end" font-family="Jost" font-size="8.5" fill="${C.marfil}" opacity="0.6">${L('ejemplo simulado', 'simulated example')}</text>`;

/* ---------------- the haploid idiogram ---------------- */
{
  const y0 = 758, esc = 10.5, paso = 48, x0 = W / 2 - paso * 4.5;
  const col = { m: C.ciruela, sm: C.dapi, st: '#f0a35e', t: '#8cc478' };
  let g = `<line x1="${x0 - 30}" y1="${y0}" x2="${x0 + paso * 9 + 30}" y2="${y0}" stroke="${C.oro}" stroke-width="0.7" stroke-dasharray="3 3" opacity="0.7"/>`;
  pares.forEach((P, i) => {
    const x = x0 + i * paso, s0 = P.p * esc, sat = P.sat * esc, q = P.q * esc, w = 13;
    const fill = col[clases[i]] || C.marfil;
    /* short arm up (with its satellite over a gap), long arm down */
    g += `<rect x="${f1(x - w / 2)}" y="${f1(y0 - 2 - s0)}" width="${w}" height="${f1(s0)}" rx="5" fill="${fill}"/>`;
    g += `<rect x="${f1(x - w / 2)}" y="${f1(y0 + 2)}" width="${w}" height="${f1(q)}" rx="5" fill="${fill}"/>`;
    if (sat) g += `<rect x="${f1(x - w / 2 + 1.5)}" y="${f1(y0 - 2 - s0 - 3 - sat)}" width="${w - 3}" height="${f1(Math.max(sat, 3.5))}" rx="2" fill="${C.rojo}"/>`;
    (B.knobs[i + 1] || []).forEach(([arm, fr]) => {
      const yy = arm === 'l' ? y0 + 2 + fr * q : y0 - 2 - fr * s0;
      g += `<rect x="${f1(x - w / 2)}" y="${f1(yy - 2.2)}" width="${w}" height="4.4" fill="${C.verde}"/>`;
    });
    g += `<text x="${f1(x)}" y="${f1(y0 + 2 + 4.6 * esc + 12)}" text-anchor="middle" font-family="Jost" font-weight="500" font-size="10" fill="${C.marfil}">${i + 1}</text>`;
    g += `<text x="${f1(x)}" y="${f1(y0 + 2 + 4.6 * esc + 24)}" text-anchor="middle" font-family="Jost" font-size="8.5" fill="${C.oro}">${clases[i]}${P.sat ? '*' : ''}</text>`;
  });
  s += g;
  s += `<text x="${W / 2}" y="${y0 + 94}" text-anchor="middle" font-family="Jost" font-weight="500" font-size="12" letter-spacing="0.5" fill="${C.marfil}">${formula}</text>`;
}

/* ---------------- the strip of the ten block colours ---------------- */
BLOQUES.forEach((c, i) => { s += `<rect x="${f1(150 + i * 55.5)}" y="874" width="52" height="6" fill="${c}"/>`; });

/* ---------------- three vignettes ---------------- */
const vin = (x, titulo, g) => `<g transform="translate(${x} 892)"><rect width="176" height="104" rx="6" fill="#ffffff" fill-opacity="0.035" stroke="#b98d2c" stroke-opacity="0.5" stroke-width="0.8"/>${g}<text x="88" y="96" text-anchor="middle" font-family="Jost" font-weight="500" font-size="8.5" letter-spacing="2" fill="${C.oro}">${titulo}</text></g>`;
/* 1 · a diakinesis cell of an autotetraploid, from the app's model */
{
  const R = rng(7), cel = Meiosis.simulateCell('AAAA', 7, 0.78, R), claves = [];
  Object.keys(cel).sort().forEach(k => { for (let j = 0; j < cel[k]; j++) claves.push(k); });
  let g = `<circle cx="88" cy="44" r="38" fill="#2a1226" stroke="${C.marfil}" stroke-opacity="0.35" stroke-width="0.8"/>`;
  const n = claves.length;
  claves.forEach((k, j) => {
    const a = j / n * 2 * Math.PI + 0.3, rr = j % 2 ? 23 : 13 + (j % 3) * 4;
    g += sinVars(Art.config(k, 88 + rr * Math.cos(a), 44 + rr * Math.sin(a), 14, (j * 47) % 180));
  });
  s += vin(130, L('LA MEIOSIS', 'MEIOSIS'), g);
}
/* 2 · the cytometer histogram: tomato standard (1.96 pg, channel 200) and the 3.18 pg sample */
{
  const ch0 = 200, ch1 = ch0 * 3.18 / 1.96, gau = (x, m, cv, h) => h * Math.exp(-0.5 * ((x - m) / (m * cv)) ** 2);
  const xs = Array.from({ length: 161 }, (_, k) => 60 + k * 3.4);
  const ys = xs.map(x => 0.9 * Math.exp(-(x - 60) / 22) + gau(x, ch0, 0.024, 1) + gau(x, 2 * ch0, 0.024, 0.12) + gau(x, ch1, 0.031, 0.78) + gau(x, 2 * ch1, 0.031, 0.08));
  const gx = x => 14 + (x - 60) / (xs[xs.length - 1] - 60) * 148, gy = y => 78 - y / 1.05 * 62;
  const d = xs.map((x, k) => (k ? 'L' : 'M') + f1(gx(x)) + ' ' + f1(gy(ys[k]))).join('');
  let g = `<line x1="14" y1="78" x2="162" y2="78" stroke="${C.oro}" stroke-opacity="0.6" stroke-width="0.8"/>`;
  g += `<path d="${d}L162 78L14 78Z" fill="${C.dapi}" fill-opacity="0.22"/><path d="${d}" fill="none" stroke="${C.dapi}" stroke-width="1.5"/>`;
  g += `<text x="${f1(gx(ch0))}" y="${f1(gy(1) - 4)}" text-anchor="middle" font-family="Jost" font-size="7" fill="${C.marfil}" opacity="0.85">${L('patrón', 'standard')}</text>`;
  g += `<text x="${f1(gx(ch1))}" y="${f1(gy(0.78) - 4)}" text-anchor="middle" font-family="Jost" font-size="7" fill="${C.rojo}">2C = 3.18 pg</text>`;
  s += vin(337, L('LA CITOMETRÍA', 'FLOW CYTOMETRY'), g);
}
/* 3 · the Stebbins grid with the cell of the maize karyotype */
{
  const filas = ['A', 'B', 'C'], cols = ['1', '2', '3', '4'], x0 = 40, y0 = 16, cw = 28, chh = 18;
  let g = '';
  filas.forEach((f, r) => cols.forEach((c, k) => {
    const on = A.stebbins === c + f;
    g += `<rect x="${x0 + k * cw}" y="${y0 + r * chh}" width="${cw - 2}" height="${chh - 2}" rx="2" fill="${on ? C.ciruela : '#ffffff'}" fill-opacity="${on ? 1 : 0.06}" stroke="${C.marfil}" stroke-opacity="0.25" stroke-width="0.6"/>`;
    g += `<text x="${x0 + k * cw + (cw - 2) / 2}" y="${y0 + r * chh + 11.5}" text-anchor="middle" font-family="Jost" font-size="7.5" fill="${on ? '#1c0d18' : C.marfil}" opacity="${on ? 1 : 0.6}" font-weight="${on ? 600 : 400}">${c}${f}</text>`;
  }));
  g += `<text x="88" y="81" text-anchor="middle" font-family="Jost" font-size="7" fill="${C.marfil}" opacity="0.85">MCA ${A.MCA.toFixed(1)} · CVCL ${A.CVCL.toFixed(1)}</text>`;
  s += vin(544, L('LA ASIMETRÍA', 'ASYMMETRY'), g);
}

/* ---------------- footer ---------------- */
s += `<text x="${W / 2}" y="1028" text-anchor="middle" font-family="Jost" font-weight="400" font-size="12" letter-spacing="2.5" fill="${C.marfil}" opacity="0.85">LUIS ÁNGEL BARRERA-GUZMÁN</text>
<text x="${W / 2}" y="1047" text-anchor="middle" font-family="Jost" font-weight="300" font-size="10" letter-spacing="1.5" fill="${C.oro}">${L('PRIMERA EDICIÓN · 2026 · VERSIÓN 1.0', 'FIRST ENGLISH EDITION · 2026 · VERSION 1.0')}</text>`;

const html = `<!doctype html>
<html lang="${L('es', 'en')}">
<head>
<meta charset="utf-8">
<title>${L('CytogeneticsPro · Manual de usuario · Portada', 'CytogeneticsPro · User’s Manual · Cover')}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../manual.css">
<!-- dibujada por herramientas/genera-portada.js${L('', ' --idioma en')}: no se edita a mano -->
</head>
<body>
<section class="page cover" aria-label="${L('Portada', 'Cover')}">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('Portada del manual de CytogeneticsPro: una metafase de maíz teñida con DAPI con señales de FISH, el idiograma de sus diez pares y tres viñetas (la meiosis, la citometría y la asimetría)', 'Cover of the CytogeneticsPro manual: a DAPI-stained maize metaphase with FISH signals, the idiogram of its ten pairs and three vignettes (meiosis, flow cytometry and asymmetry)')}">
${s}
</svg>
</section>
</body>
</html>
`;
fs.writeFileSync(path.join(APP, 'manual', EN ? 'en' : 'es', '00a-portada.html'), html);
console.log('portada:', formula, '· Stebbins', A.stebbins, '· MCA', A.MCA.toFixed(2), '· CVCL', A.CVCL.toFixed(2), '·', (html.length / 1024).toFixed(0) + ' KB');
