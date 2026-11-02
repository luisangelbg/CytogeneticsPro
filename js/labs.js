/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — the two labs of the home page. Both compute with the
   engines of the app: Karyo (classes, formula), Asym (indices, Stebbins),
   Idio (the drawing) and Meiosis (the expected configurations).
   Lab 1: an idiogram of three to six pairs whose arms are dragged (or typed,
          or moved with the arrow keys); classes and indices follow at once.
   Lab 2: a ploidy level and an origin; the configurations expected per cell
          and one cell drawn from the same model. */
(function () {
  'use strict';
  const MAX_S = 5, MAX_L = 7, SC = 24;           // the room of the drawing, in µm, and px per µm
  const DEFAULT = [[3.0, 3.4], [2.1, 3.7], [1.2, 3.6], [0.7, 4.0]];
  let chrs = DEFAULT.map(([s, l]) => ({ s, l }));
  let drag = null;

  const round = v => Math.round(v * 20) / 20;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- Lab 1 ---------------- */
  function karyo() { return Karyo.fromPairs(chrs.map(c => ({ p: c.s, q: c.l })), { scheme: 'levan', keepOrder: true }); }
  function drawLab1(focus) {
    const host = el('lab1Idio');
    if (!host) return;
    const K = karyo();
    const pairs = Idio.fromKaryotype(K);
    const I = Idio.draw(pairs, { scale: SC, maxS: MAX_S, maxL: MAX_L, chromWidth: 18, gap: 34, ruler: true, types: true, unit: 'µm', font: 12, colorBy: 'type', minWidth: 300,
      aria: T('Idiograma del laboratorio', 'Idiogram of the lab') });
    let handles = '';
    I.xs.forEach((x, i) => {
      const c = chrs[i];
      ['s', 'l'].forEach(arm => {
        const y = arm === 's' ? I.y0 - 1.5 - c.s * SC : I.y0 + 1.5 + c.l * SC;
        const name = (arm === 's' ? T('Brazo corto', 'Short arm') : T('Brazo largo', 'Long arm')) + ' ' + T('del cromosoma', 'of chromosome') + ' ' + (i + 1);
        handles += `<circle class="lab-handle" cx="${x}" cy="${Math.round(y * 10) / 10}" r="7" tabindex="0" role="slider" data-i="${i}" data-arm="${arm}"` +
          ` aria-label="${name}" aria-valuemin="${arm === 's' ? 0 : 0.2}" aria-valuemax="${arm === 's' ? MAX_S : MAX_L}" aria-valuenow="${c[arm].toFixed(2)}" aria-valuetext="${c[arm].toFixed(2)} µm"/>`;
      });
    });
    host.innerHTML = I.svg.replace('</svg>', handles + '</svg>');
    host.dataset.y0 = I.y0;
    if (focus) { const h = host.querySelector(`.lab-handle[data-i="${focus.i}"][data-arm="${focus.arm}"]`); if (h) h.focus(); }
    paintArms(K);
    paintIndices(K);
  }
  function paintArms(K) {
    const t = el('lab1Arms');
    if (!t) return;
    const head = `<thead><tr><th>${L2('Par', 'Pair')}</th><th class="num" title="${T('brazo corto', 'short arm')}">p (µm)</th><th class="num" title="${T('brazo largo', 'long arm')}">q (µm)</th>` +
      `<th class="num">${L2('IC', 'CI')}</th><th class="num">r</th><th>${L2('Clase', 'Class')}</th></tr></thead>`;
    const rows = chrs.map((c, i) => {
      const p = K.pairs[i];
      const id = 'lab1-' + i;
      return `<tr><td>${i + 1}</td>` +
        `<td class="num"><input type="number" step="0.05" min="0" max="${MAX_S}" id="${id}s" data-i="${i}" data-arm="s" value="${c.s.toFixed(2)}" aria-label="${T('Brazo corto del par', 'Short arm of pair')} ${i + 1}"></td>` +
        `<td class="num"><input type="number" step="0.05" min="0.2" max="${MAX_L}" id="${id}l" data-i="${i}" data-arm="l" value="${c.l.toFixed(2)}" aria-label="${T('Brazo largo del par', 'Long arm of pair')} ${i + 1}"></td>` +
        `<td class="num">${fmtFixed(p.ciMean, 1)}</td><td class="num">${isFinite(p.rMean) ? fmtFixed(p.rMean, 2) : '∞'}</td><td class="lab-cls"><b>${p.type}</b><small>${T(Karyo.TYPE_NAMES[p.type])}</small></td></tr>`;
    }).join('');
    t.innerHTML = head + '<tbody>' + rows + '</tbody>';
  }
  function paintIndices(K) {
    const A = Asym.compute(K.pairs.map(p => ({ s: p.s.mean, l: p.l.mean })));
    const host = el('lab1Idx');
    if (host) {
      const kindName = { intra: ['intra', 'intra'], inter: ['inter', 'inter'], both: ['ambas', 'both'] };
      host.innerHTML = Asym.ORDER.map(k => {
        const m = Asym.INDICES.find(x => x.k === k), v = A[k];
        const d = ['A1', 'A2', 'A'].includes(k) ? 3 : 2;
        return `<div class="idx-tile${m.recommended ? ' rec' : ''}" title="${esc(m.f)} — ${esc(citeLang(m.ref))}"><div class="k"><span>${m.name}</span><span class="kind ${m.kind}">${T(kindName[m.kind])}</span></div>` +
          `<div class="v">${isFinite(v) ? fmtFixed(v, d) : '—'}</div></div>`;
      }).join('');
    }
    const sh = el('lab1Steb');
    if (sh) sh.innerHTML = stebbinsGrid([{ cls: A.stebbins, label: '' }]);
    const st = el('lab1Status');
    if (st) {
      const f = Karyo.formula(K, {});
      st.innerHTML = L2(
        `Fórmula de este cariotipo (como diploide): <b>${f}</b>. Categoría de Stebbins <b>${A.stebbins}</b>: el par más largo mide ${fmtFixed(A.ratioLS, 2)} veces el más corto y ${fmtPct(A.propBelow2, 0)} de los pares tienen r &lt; 2. La asimetría intracromosómica es <b>MCA = ${fmtFixed(A.MCA, 1)}</b> y la intercromosómica <b>CVCL = ${fmtFixed(A.CVCL, 1)}</b>: alarga un solo brazo y verás cambiar la primera; cambia la longitud total de un par y cambiará la segunda.`,
        `Formula of this karyotype (as a diploid): <b>${f}</b>. Stebbins category <b>${A.stebbins}</b>: the longest pair is ${fmtFixed(A.ratioLS, 2)} times the shortest and ${fmtPct(A.propBelow2, 0)} of the pairs have r &lt; 2. Intrachromosomal asymmetry is <b>MCA = ${fmtFixed(A.MCA, 1)}</b> and interchromosomal asymmetry <b>CVCL = ${fmtFixed(A.CVCL, 1)}</b>: lengthen one arm only and the first one moves; change the total length of a pair and the second one will.`);
    }
  }
  /* the 3 × 4 grid of Stebbins (1971) with the given karyotypes on it */
  function stebbinsGrid(items, opts) {
    const o = opts || {};
    const W = 330, H = 190, x0 = 64, y0 = 30, cw = 62, ch = 40;
    let g = '';
    ['A', 'B', 'C'].forEach((r, ri) => ['1', '2', '3', '4'].forEach((c, ci) => {
      const here = items.filter(it => it.cls === c + r);
      g += `<rect x="${x0 + ci * cw}" y="${y0 + ri * ch}" width="${cw - 3}" height="${ch - 3}" rx="6" fill="${here.length ? 'var(--primary-soft)' : 'var(--card-bg)'}" stroke="${here.length ? 'var(--primary)' : 'var(--border)'}" stroke-width="${here.length ? 2 : 1}"/>` +
        `<text class="fig txt" x="${x0 + ci * cw + 8}" y="${y0 + ri * ch + 15}" font-size="11" fill="var(--text-muted)">${c}${r}</text>`;
      here.forEach((it, k) => { g += `<circle cx="${x0 + ci * cw + 40 - (k % 3) * 9}" cy="${y0 + ri * ch + 24 - Math.floor(k / 3) * 9}" r="5.5" fill="${it.color || 'var(--primary)'}"/>`; });
    }));
    g += `<text x="${x0 + 2 * cw}" y="${y0 - 10}" font-size="11" text-anchor="middle" fill="var(--text-muted)">${esc(T('proporción de cromosomas con r < 2', 'proportion of chromosomes with r < 2'))}: 1 → 0</text>`;
    ['< 2', '2–4', '> 4'].forEach((t, i) => { g += `<text x="${x0 - 8}" y="${y0 + i * ch + 24}" font-size="11" text-anchor="end" fill="var(--text-muted)">${t}</text>`; });
    g += `<text transform="translate(14 ${y0 + 1.5 * ch}) rotate(-90)" font-size="11" text-anchor="middle" fill="var(--text-muted)">${esc(T('mayor / menor', 'longest / shortest'))}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" class="fig" role="img" aria-label="${esc(T('Cuadrícula de Stebbins', 'Stebbins grid'))}${items.length === 1 ? ': ' + items[0].cls : ''}">${g}</svg>`;
  }

  function setArm(i, arm, v, focus) {
    if (!chrs[i]) return;
    chrs[i][arm] = clamp(round(v), arm === 's' ? 0 : 0.2, arm === 's' ? MAX_S : MAX_L);
    drawLab1(focus ? { i, arm } : null);
  }
  function bindLab1() {
    const host = el('lab1Idio');
    if (!host) return;
    host.addEventListener('pointerdown', e => {
      const h = e.target.closest('.lab-handle');
      if (!h) return;
      e.preventDefault();
      drag = { i: +h.dataset.i, arm: h.dataset.arm };
      host.setPointerCapture(e.pointerId);
    });
    host.addEventListener('pointermove', e => {
      if (!drag) return;
      const svg = host.querySelector('svg');
      const m = svg && svg.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      const y0 = +host.dataset.y0;
      setArm(drag.i, drag.arm, drag.arm === 's' ? (y0 - 1.5 - p.y) / SC : (p.y - y0 - 1.5) / SC);
    });
    const end = e => { if (drag) { drag = null; try { host.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ } } };
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
    host.addEventListener('keydown', e => {
      const h = e.target.closest('.lab-handle');
      if (!h) return;
      const i = +h.dataset.i, arm = h.dataset.arm, step = e.shiftKey ? 0.5 : 0.05;
      const up = arm === 's' ? 1 : -1;       // the short arm grows upwards, the long arm downwards
      let d = 0;
      if (e.key === 'ArrowUp') d = step * up;
      else if (e.key === 'ArrowDown') d = -step * up;
      else if (e.key === 'ArrowRight' || e.key === 'PageUp') d = step;
      else if (e.key === 'ArrowLeft' || e.key === 'PageDown') d = -step;
      else return;
      e.preventDefault();
      setArm(i, arm, chrs[i][arm] + d, true);
    });
    const t = el('lab1Arms');
    if (t) t.addEventListener('change', e => {
      const inp = e.target.closest('input[data-i]');
      if (!inp) return;
      const v = num(inp.value);
      if (isFinite(v)) setArm(+inp.dataset.i, inp.dataset.arm, v);
    });
    const go = (id, f) => { const b = el(id); if (b) b.addEventListener('click', f); };
    go('lab1Reset', () => { chrs = DEFAULT.map(([s, l]) => ({ s, l })); drawLab1(); });
    go('lab1Sym', () => { chrs = chrs.map(() => ({ s: 2.9, l: 3.1 })); drawLab1(); });
    go('lab1Asym', () => { chrs = chrs.map((c, i) => ({ s: [0.5, 0.25, 0.9, 0.15, 0.4, 0.3][i], l: [6.8, 4.2, 6.0, 2.2, 3.0, 1.4][i] })); drawLab1(); });
    go('lab1Add', () => { if (chrs.length < 6) { chrs.push({ s: 1.5, l: 2.5 }); drawLab1(); } else toast(T('El laboratorio llega hasta seis pares.', 'The lab goes up to six pairs.')); });
    go('lab1Del', () => { if (chrs.length > 3) { chrs.pop(); drawLab1(); } else toast(T('Se necesitan al menos tres pares.', 'At least three pairs are needed.')); });
  }

  /* ---------------- Lab 2 ---------------- */
  let seed = 7;
  const LAB2_KEYS = ['c1', 'c2', 'r2', 'c3', 'c4', 'r4', 'c5', 'c6', 'r6', 'c7', 'c8', 'r8'];
  const keyName = k => {
    const i = Meiosis.keyInfo(k), roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i.size];
    if (i.size === 1) return 'I';
    if (i.size === 2) return 'II ' + (i.ring ? T('anillo', 'ring') : T('varilla', 'rod'));
    if (i.size === 3) return 'III';
    return roman + ' ' + (i.ring ? T('anillo', 'ring') : T('cadena', 'chain'));
  };
  function lab2Formula() {
    const L = +el('lab2Level').value, mode = el('lab2Mode').value;
    if (mode === 'custom') return (el('lab2Formula').value || '').replace(/[^A-Za-z]/g, '').toUpperCase() || 'AAAA';
    return Meiosis.formulaFor(L, mode);
  }
  function drawLab2() {
    if (!el('lab2Bars')) return;
    const x = +el('lab2X').value, c = +el('lab2C').value;
    el('lab2XOut').textContent = x; el('lab2COut').textContent = c.toFixed(2);
    el('lab2FormulaWrap').hidden = el('lab2Mode').value !== 'custom';
    const f = lab2Formula();
    if (f.length > 8) { el('lab2Status').textContent = T('La fórmula admite hasta ocho genomas.', 'The formula takes up to eight genomes.'); return; }
    const E = Meiosis.expected(f, x, c);
    const keys = LAB2_KEYS.filter(k => (E.perCell[k] || 0) > 1e-9);
    /* bars */
    const W = 420, bh = 22, H = 22 + keys.length * (bh + 6), left = 92;
    const max = Math.max(...keys.map(k => E.perCell[k]), 1);
    let g = '';
    keys.forEach((k, i) => {
      const v = E.perCell[k], w = (W - left - 54) * v / max, y = 14 + i * (bh + 6);
      g += `<text class="mut" x="${left - 8}" y="${y + 15}" font-size="12" text-anchor="end">${esc(keyName(k))}</text>` +
        `<rect x="${left}" y="${y}" width="${Math.max(0.5, w).toFixed(1)}" height="${bh}" rx="4" fill="${Meiosis.keyInfo(k).size > 2 ? 'var(--accent)' : 'var(--primary)'}"/>` +
        `<text class="txt" x="${(left + w + 6).toFixed(1)}" y="${y + 15}" font-size="12">${v.toFixed(2)}</text>`;
    });
    el('lab2Bars').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="fig" role="img" aria-label="${esc(T('Configuraciones esperadas por célula', 'Expected configurations per cell'))}">${g}</svg>`;
    /* table */
    buildTable('lab2Table', [
      { key: 'k', label: L2('Configuración', 'Configuration'), get: r => keyName(r.k) },
      { key: 'e', label: L2('Esperadas por célula', 'Expected per cell'), num: true, get: r => fmtFixed(r.e, 3) },
      { key: 'p', label: L2('% de los cromosomas', '% of the chromosomes'), num: true, get: r => fmtFixed(r.p, 1) },
    ], keys.map(k => ({ k, e: E.perCell[k], p: 100 * E.perCell[k] * Meiosis.keyInfo(k).size / E.chromosomes })));
    drawCell(f, x, c);
    const n2 = E.chromosomes, mv = E.multivalentShare;
    /* with four or five homologs only one multivalent fits: the expectation is then a probability */
    const one = E.groups.every(m => m < 6);
    el('lab2Status').innerHTML = L2(
      `Fórmula genómica <b>${f}</b> con x = ${x}: 2n = ${f.length}x = ${n2}. Se esperan <b>${fmtFixed(E.xtaPerCell, 1)} quiasmas por célula</b> (${E.pairedArms} brazos apareados × c). ` +
      (mv > 1e-9 ? (one ? `Cada grupo de homólogos forma un multivalente con probabilidad <b>${fmtFixed(100 * mv, 1)} %</b>, y una célula tiene en promedio <b>${fmtFixed(mv * x, 2)}</b>.`
        : `Cada grupo de homólogos forma en promedio <b>${fmtFixed(mv, 3)}</b> multivalentes, y una célula, <b>${fmtFixed(mv * x, 2)}</b>.`) +
        ' Con c = 1 se llega al máximo que permite el apareamiento al azar.'
        : 'Con apareamiento sólo dentro de cada genoma no hay multivalentes: todo son bivalentes y univalentes.'),
      `Genome formula <b>${f}</b> with x = ${x}: 2n = ${f.length}x = ${n2}. <b>${fmtFixed(E.xtaPerCell, 1)} chiasmata per cell</b> are expected (${E.pairedArms} paired arms × c). ` +
      (mv > 1e-9 ? (one ? `Each group of homologs forms a multivalent with probability <b>${fmtFixed(100 * mv, 1)} %</b>, and a cell has <b>${fmtFixed(mv * x, 2)}</b> on average.`
        : `Each group of homologs forms <b>${fmtFixed(mv, 3)}</b> multivalents on average, and a cell, <b>${fmtFixed(mv * x, 2)}</b>.`) +
        ' With c = 1 the maximum that random pairing allows is reached.'
        : 'With pairing only within each genome there are no multivalents: everything is bivalents and univalents.'));
  }
  function drawCell(f, x, c) {
    const host = el('lab2Cell');
    if (!host) return;
    const cfg = Meiosis.simulateCell(f, x, c, rng(seed));
    const list = [];
    LAB2_KEYS.forEach(k => { for (let i = 0; i < (cfg[k] || 0); i++) list.push(k); });
    const r = rng(seed * 31 + 7);
    const W = 460, H = 330, cx = W / 2, cy = H / 2 - 6, R = 150;
    const cols = Math.ceil(Math.sqrt(list.length * 1.4)), rows = Math.ceil(list.length / cols);
    const cellW = (2 * R * 0.84) / cols, cellH = (2 * R * 0.74) / Math.max(1, rows);
    const size = Math.max(14, Math.min(46, Math.min(cellW, cellH) * 0.86));
    let g = `<ellipse cx="${cx}" cy="${cy}" rx="${R + 34}" ry="${R}" fill="color-mix(in srgb, var(--accent) 5%, var(--card-bg))" stroke="var(--border-strong)" stroke-dasharray="4 4"/>`;
    list.forEach((k, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const px = cx - (cols - 1) * cellW / 2 + col * cellW + (r() - 0.5) * cellW * 0.25;
      const py = cy - (rows - 1) * cellH / 2 + row * cellH + (r() - 0.5) * cellH * 0.25;
      g += Art.config(k, px, py, size, (r() - 0.5) * 90);
    });
    const cnt = LAB2_KEYS.filter(k => cfg[k]).map(k => cfg[k] + ' ' + keyName(k)).join(' + ');
    g += `<text class="mut" x="${cx}" y="${H - 6}" font-size="15" text-anchor="middle">${esc(cnt)}</text>`;
    host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="fig" role="img" aria-label="${esc(T('Célula simulada: ', 'Simulated cell: ') + cnt)}">${g}</svg>`;
  }
  function bindLab2() {
    ['lab2Level', 'lab2Mode', 'lab2X', 'lab2C', 'lab2Formula'].forEach(id => {
      const n = el(id);
      if (n) n.addEventListener('input', drawLab2);
    });
    const b = el('lab2Sim');
    if (b) b.addEventListener('click', () => { seed++; drawLab2(); });
  }

  /* ---------------- tabs ---------------- */
  function bindTabs() {
    els('.lab-tab').forEach(t => t.addEventListener('click', () => {
      els('.lab-tab').forEach(x => { const on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
      els('.lab').forEach(l => l.classList.toggle('on', l.id === t.dataset.lab));
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!el('lab1Idio')) return;
    bindTabs(); bindLab1(); bindLab2();
    drawLab1(); drawLab2();
  });
  document.addEventListener('langchange', () => { if (el('lab1Idio')) { drawLab1(); drawLab2(); } });

  window.Labs = { stebbinsGrid, keyName, get chrs() { return chrs; } };
})();
