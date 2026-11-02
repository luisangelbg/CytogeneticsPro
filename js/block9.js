/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — Block 9, teaching.
   Mitosis and meiosis step by step (with what to count in each step and the
   four products of a meiosis), the karyotype exercise on a simulated
   metaphase with its grading, the self-assessment, the illustrated glossary
   and the printable practical sheet. Nothing here touches the project: the
   block works with or without data. */
(function () {
  'use strict';
  const sim = { kind: 'mitosis', n: 3, cross: true, seed: 1, step: 0 };
  /* T() reads a pair of arrays as {es, en}: lists in two languages go through pick */
  const pick = (es, en) => (I18N.lang === 'en' ? en : es);
  let timer = null, ex = null, exAns = [], exCuts = [], qz = [], qAns = [], qTopics = [], qGraded = false, built = false;

  /* ---------------- the simulator ---------------- */
  function renderSim() {
    const steps = Teach.STEPS[sim.kind];
    sim.step = Math.max(0, Math.min(steps.length - 1, sim.step));
    const key = steps[sim.step], name = T(Teach.NAMES[key][0], Teach.NAMES[key][1]);
    const R = el('b9Step');
    R.max = String(steps.length - 1); R.value = String(sim.step);
    R.setAttribute('aria-valuetext', name);
    const D = Teach.draw(sim.kind, key, sim.n, { crossover: sim.cross, seed: sim.seed });
    el('b9Sim').innerHTML = D.svg;
    el('b9StepName').textContent = `${sim.step + 1} / ${steps.length} · ${name}`;
    el('b9StepText').textContent = T(Teach.TEXTS[key][0], Teach.TEXTS[key][1]);
    el('b9CrossLab').hidden = sim.kind !== 'meiosis';
    el('b9Seed').hidden = sim.kind !== 'meiosis';
    el('b9Prev').disabled = sim.step === 0;
    el('b9Next').disabled = sim.step === steps.length - 1;
    const C = Teach.counts(sim.kind, key, sim.n);
    const split = ['anaphase', 'telophase', 'anaphase2'].includes(key);
    statTiles('b9Counts', [[L2('Células', 'Cells'), C.cells],
      [L2('Cromosomas por célula', 'Chromosomes per cell'), C.chromosomes, split ? L2(`${C.chromosomes / 2} hacia cada polo`, `${C.chromosomes / 2} to each pole`) : key === 'anaphase1' ? L2(`${sim.n} hacia cada polo`, `${sim.n} to each pole`) : ''],
      [L2('Cromátidas por cromosoma', 'Chromatids per chromosome'), C.chromatids], [L2('ADN por célula', 'DNA per cell'), C.C + 'C'],
      [L2('Juegos de cromosomas', 'Chromosome sets'), C.ploidy, C.ploidy === 'n' ? L2('un juego por célula', 'one set per cell') : L2('dos juegos', 'two sets')]]
      .concat(C.bivalents ? [[L2('Bivalentes', 'Bivalents'), C.bivalents]] : []));
    const prod = el('b9Products');
    if (sim.kind === 'meiosis' && key === 'tetrad') {
      const P = Teach.products(D.plan);
      const word = c => c.from === 'R' ? T('recombinante', 'recombinant') : c.from === 'P' ? T('del padre', 'paternal') : T('de la madre', 'maternal');
      prod.innerHTML = `<p class="hint">${L2(`Con n = ${sim.n} hay ${Math.pow(2, sim.n)} combinaciones posibles sin entrecruzamiento; cada célula de la tétrada recibió esta:`, `With n = ${sim.n} there are ${Math.pow(2, sim.n)} possible combinations without crossing-over; each cell of the tetrad received this one:`)}</p><ul class="prod">` +
        P.map(c => `<li><b>${esc(T('Célula ', 'Cell ') + c.cell)}</b>: ${c.chromosomes.map(x => esc(T('par ', 'pair ') + x.pair + ' ' + word(x))).join('; ')}</li>`).join('') + '</ul>';
    } else prod.innerHTML = '';
  }
  function stopPlay() {
    if (timer) { clearInterval(timer); timer = null; }
    const b = el('b9Play');
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = L2('Reproducir', 'Play');
  }
  function togglePlay() {
    if (timer) { stopPlay(); return; }
    const steps = Teach.STEPS[sim.kind];
    if (sim.step >= steps.length - 1) sim.step = 0;
    const b = el('b9Play');
    b.setAttribute('aria-pressed', 'true');
    b.innerHTML = L2('Pausa', 'Pause');
    renderSim();
    timer = setInterval(() => {
      if (sim.step >= Teach.STEPS[sim.kind].length - 1) { stopPlay(); return; }
      sim.step++; renderSim();
    }, 1800);
  }

  /* ---------------- the karyotype exercise ---------------- */
  function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
  async function newExercise(seed) {
    ex = Teach.exercise(seed || Math.floor(Math.random() * 1e6) + 1, +el('b9ExPairs').value);
    ex.S = Img.synth(ex.spec);
    exAns = ex.chrs.map(() => ({ pair: '', type: '' }));
    const S = ex.S;
    /* the numbers beside each chromosome, outside its trace */
    const labs = S.traces.map((t, i) => {
      const P = t.trace, m = P[Math.floor(P.length / 2)], a = P[0], b = P[P.length - 1];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      return `<text class="ex-num" x="${Math.round(m[0] - dy / d * 30)}" y="${Math.round(m[1] + dx / d * 30 + 8)}" text-anchor="middle">${i + 1}</text>`;
    }).join('');
    el('b9ExFig').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="fig ex-fig" viewBox="0 0 ${S.w} ${S.h}" width="${S.w}" height="${S.h}" role="img" aria-label="${esc(T(`Metafase simulada con ${ex.chrs.length} cromosomas numerados`, `Simulated metaphase with ${ex.chrs.length} numbered chromosomes`))}">` +
      `<image href="${S.dataUrl}" xlink:href="${S.dataUrl}" x="0" y="0" width="${S.w}" height="${S.h}"/>${labs}</svg>`;
    const im = await loadImage(S.dataUrl);
    exCuts = S.traces.map(t => Img.straighten(im, { trace: t.trace, cen: t.cen }, 30));
    renderCuts();
    clearMessages('b9ExMsg'); el('b9ExTiles').innerHTML = ''; el('b9ExSol').innerHTML = '';
  }
  function renderCuts() {
    if (!ex) return;
    const n = ex.pairs.length, host = el('b9ExCuts');
    host.innerHTML = '';
    exCuts.forEach((c, i) => {
      const d = mk('div', { class: 'ex-cut', 'data-i': i });
      d.innerHTML = `<div class="ex-cut-num">${i + 1}</div><div class="ex-cut-img"></div>` +
        `<label class="sr-only" for="b9ExP${i}">${esc(T('Par del cromosoma ', 'Pair of chromosome ') + (i + 1))}</label><select id="b9ExP${i}" data-k="pair" data-i="${i}"><option value="">${esc(T('par', 'pair'))}</option>${Array.from({ length: n }, (_, k) => `<option value="${k + 1}"${String(exAns[i].pair) === String(k + 1) ? ' selected' : ''}>${k + 1}</option>`).join('')}</select>` +
        `<label class="sr-only" for="b9ExT${i}">${esc(T('Tipo del cromosoma ', 'Type of chromosome ') + (i + 1))}</label><select id="b9ExT${i}" data-k="type" data-i="${i}"><option value="">${esc(T('tipo', 'type'))}</option>${['m', 'sm', 'st', 't'].map(t => `<option value="${t}"${exAns[i].type === t ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
      c.canvas.setAttribute('role', 'img');
      c.canvas.setAttribute('aria-label', T('Recorte del cromosoma ', 'Cut-out of chromosome ') + (i + 1));
      d.querySelector('.ex-cut-img').appendChild(c.canvas);
      host.appendChild(d);
    });
  }
  function checkExercise() {
    if (!ex) return;
    const G = Teach.grade(ex, exAns);
    statTiles('b9ExTiles', [[L2('Pares bien formados', 'Pairs well formed'), `${G.pairsOk} / ${G.n}`, '', G.pairsOk === G.n ? null : 'warn'],
      [L2('Pares bien numerados', 'Pairs well numbered'), `${G.orderOk} / ${G.n}`, L2('1 = el más largo', '1 = the longest'), G.orderOk === G.n ? null : 'warn'],
      [L2('Tipos correctos', 'Right types'), `${G.typesOk} / ${G.total}`, '', G.typesOk === G.total ? null : 'warn']]);
    const box = el('b9ExMsg');
    clearMessages(box);
    const TN = { m: ['metacéntrico', 'metacentric'], sm: ['submetacéntrico', 'submetacentric'], st: ['subtelocéntrico', 'subtelocentric'], t: ['telocéntrico', 'telocentric'] };
    G.items.forEach(it => {
      const node = el('b9ExCuts').querySelector(`.ex-cut[data-i="${it.i - 1}"]`);
      /* green: all right; amber: wrong pair or type; dashed amber: right pair and type, but the pair takes another number */
      if (node) { node.classList.toggle('ok', it.pairOk && it.typeOk && it.numberOk); node.classList.toggle('bad', !(it.pairOk && it.typeOk)); node.classList.toggle('renum', it.pairOk && it.typeOk && !it.numberOk); }
      if (!it.typeOk) showMessage(box, 'warning', esc(T(`El ${it.i} es ${TN[it.trueType][0]} (${it.trueType}): su razón de brazos es r = ${fmtFixed(it.r, 2)}${it.type ? `, no ${it.type}` : ''}.`,
        `Number ${it.i} is ${TN[it.trueType][1]} (${it.trueType}): its arm ratio is r = ${fmtFixed(it.r, 2)}${it.type ? `, not ${it.type}` : ''}.`)));
    });
    ex.pairs.forEach(p => {
      const mem = G.items.filter(it => it.truePair === p.pair);
      if (!mem[0].pairOk) showMessage(box, 'warning', esc(T(`Los cromosomas ${mem.map(m => m.i).join(' y ')} son homólogos (el par ${p.pair}, de ${fmtFixed(p.c, 2)} µm).`, `Chromosomes ${mem.map(m => m.i).join(' and ')} are homologs (pair ${p.pair}, ${fmtFixed(p.c, 2)} µm long).`)));
      else if (mem[0].pair !== p.pair) showMessage(box, 'info', esc(T(`Los cromosomas ${mem.map(m => m.i).join(' y ')} forman bien un par, pero por su longitud es el par ${p.pair}.`, `Chromosomes ${mem.map(m => m.i).join(' and ')} form a right pair, but by its length it is pair ${p.pair}.`)));
    });
    if (G.pairsOk === G.n && G.orderOk === G.n && G.typesOk === G.total) showMessage(box, 'success', esc(T('¡Cariotipo correcto! Puedes ver la solución con las medidas.', 'Right karyotype! You can see the solution with the measurements.')));
  }
  function showSolution() {
    if (!ex) return;
    const host = el('b9ExSol');
    host.innerHTML = `<h3>${L2('Solución', 'Solution')}</h3><div class="ex-sol"></div>`;
    const row = host.querySelector('.ex-sol');
    ex.pairs.forEach(p => {
      const col = mk('div', { class: 'ex-sol-pair' });
      const imgs = mk('div', { class: 'ex-sol-imgs' });
      ex.chrs.forEach((c, i) => { if (c.pair === p.pair) { const cv = exCuts[i].canvas, cp = document.createElement('canvas'); cp.width = cv.width; cp.height = cv.height; cp.getContext('2d').drawImage(cv, 0, 0); cp.setAttribute('aria-hidden', 'true'); imgs.appendChild(cp); } });
      col.appendChild(imgs);
      col.appendChild(mk('div', { class: 'ex-sol-lab' }, `<b>${p.pair}</b> · ${p.type}<br><span class="hint">${fmtFixed(p.c, 2)} µm · r = ${fmtFixed(p.r, 2)}</span>`));
      row.appendChild(col);
    });
    const counts = {};
    ex.pairs.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 2; });
    host.appendChild(mk('p', null, esc(T('Fórmula: ', 'Formula: ') + `2n = ${2 * ex.pairs.length} = ` + ['m', 'sm', 'st', 't'].filter(t => counts[t]).map(t => counts[t] + t).join(' + '))));
  }

  /* ---------------- self-assessment ---------------- */
  function renderTopics() {
    el('b9QTopics').innerHTML = Teach.TOPICS.map(t => `<button type="button" class="chip${!qTopics.length || qTopics.includes(t[0]) ? ' on' : ''}" data-t="${t[0]}" aria-pressed="${!qTopics.length || qTopics.includes(t[0])}">${esc(T(t[1], t[2]))}</button>`).join('');
  }
  function newQuiz() {
    qz = Teach.quiz(Math.floor(Math.random() * 1e9) + 1, +el('b9QN').value, qTopics);
    qAns = qz.map(() => null); qGraded = false;
    renderQuiz();
  }
  function renderQuiz() {
    const f = el('b9Quiz');
    f.innerHTML = qz.map((q, i) => {
      const opts = pick(q.opts, q.optsEn), res = qGraded ? (qAns[i] === q.ans ? ' ok' : ' bad') : '';
      return `<fieldset class="q${res}"><legend>${i + 1}. ${esc(T(q.es, q.en))}</legend>` +
        opts.map((o, j) => `<label class="q-opt${qGraded && j === q.ans ? ' right' : ''}"><input type="radio" name="b9q${i}" value="${j}"${qAns[i] === j ? ' checked' : ''}> <span>${esc(o)}</span></label>`).join('') +
        (qGraded ? `<p class="q-exp">${esc((qAns[i] === q.ans ? T('Correcto. ', 'Right. ') : qAns[i] == null ? T('Sin respuesta. ', 'No answer. ') : T('No. ', 'No. ')) + T(q.expEs, q.expEn))}</p>` : '') + '</fieldset>';
    }).join('') || `<p class="hint">${L2('Elige al menos un tema.', 'Choose at least one topic.')}</p>`;
    el('b9QResult').innerHTML = '';
    if (qGraded) {
      const ok = qz.filter((q, i) => qAns[i] === q.ans).length;
      statTiles('b9QResult', [[L2('Aciertos', 'Right answers'), `${ok} / ${qz.length}`, fmtPct(ok / qz.length, 0), ok / qz.length >= 0.7 ? null : 'warn']]);
    }
  }

  /* ---------------- glossary ---------------- */
  const fold = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function renderGloss() {
    const q = fold(el('b9GSearch').value.trim());
    const en = I18N.lang === 'en';
    const list = Teach.GLOSSARY.filter(g => !q || fold(g.slice(0, 4).join(' ')).includes(q))
      .sort((a, b) => (en ? a[1] : a[0]).localeCompare(en ? b[1] : b[0], en ? 'en' : 'es'));
    el('b9Gloss').innerHTML = list.map(g => `<div class="gl-item"><div class="gl-art">${Teach.glossArt(g[4])}</div><div><dt>${esc(en ? g[1] : g[0])}</dt><dd>${esc(en ? g[3] : g[2])}</dd></div></div>`).join('') ||
      `<p class="hint">${L2('Ningún término coincide.', 'No term matches.')}</p>`;
  }

  /* ---------------- the practical sheet ---------------- */
  function fillProtocol() {
    [['b9PPre', 'pre'], ['b9PHyd', 'hyd'], ['b9PStain', 'stain']].forEach(([id, k]) => {
      const s = el(id), v = s.value;
      s.innerHTML = Teach.PROTOCOL[k].map(o => `<option value="${o[0]}">${esc(T(o[1], o[2]).split(/[,(]/)[0].trim())}</option>`).join('');
      if (v) s.value = v;
    });
  }
  function refFor(cite) {
    const m = /^(\S+).*?(\d{4})/.exec(cite);
    if (!m || !window.Home) return null;
    const r = Home.REFS.find(x => x[0].startsWith(m[1]) && x[0].includes(m[2] + '.'));
    return r ? r[0] : null;
  }
  function practical() {
    const steps = Teach.protocolSteps({ pre: el('b9PPre').value, hyd: el('b9PHyd').value, stain: el('b9PStain').value });
    const sp = el('b9PSpecies').value.trim();
    const cites = [...new Set(steps.map(s => s[4]))];
    const refs = cites.map(refFor).filter(Boolean).map(r => Home.refLang(r, I18N.lang)).sort();
    const rows = Array.from({ length: 8 }, () => '<tr><td></td><td></td><td></td><td></td><td></td></tr>').join('');
    const mats = pick(['Semillas o bulbos sanos', 'Papel filtro y cajas de Petri, o frascos con agua', 'Frascos con tapa para pretratar y fijar', 'Pinzas finas, bisturí o navaja, aguja de disección', 'Portaobjetos, cubreobjetos y papel filtro', 'Baño de agua o estufa a 60 °C (o a 37 °C para la digestión enzimática)', 'Microscopio con objetivos de 40× y 100× (inmersión)', 'Los reactivos de los pasos elegidos'],
      ['Healthy seeds or bulbs', 'Filter paper and Petri dishes, or jars with water', 'Capped vials to pretreat and fix', 'Fine forceps, scalpel or razor blade, dissecting needle', 'Slides, coverslips and filter paper', 'Water bath or oven at 60 °C (or 37 °C for the enzyme digestion)', 'Microscope with 40× and 100× (immersion) objectives', 'The reagents of the chosen steps']);
    const qs = pick(['¿Por qué se usan puntas de raíz y no hojas?', '¿Qué hace el pretratamiento y en qué fase deja a las células?', 'Cuenta 2n en al menos diez células: ¿cuál es el número más frecuente? ¿Hubo células con otro número?', '¿Qué fase te sirve para medir los cromosomas y por qué?'],
      ['Why are root tips used and not leaves?', 'What does the pretreatment do and in which phase does it leave the cells?', 'Count 2n in at least ten cells: which number is the most frequent? Were there cells with another number?', 'Which phase is useful to measure the chromosomes and why?']);
    return `<h1>${esc(T('Práctica: cromosomas mitóticos en puntas de raíz', 'Practical: mitotic chromosomes in root tips'))}</h1>` +
      `<table class="pr-head"><tr><td>${esc(T('Nombre', 'Name'))}:</td><td class="line"></td><td>${esc(T('Fecha', 'Date'))}:</td><td class="line"></td></tr>` +
      `<tr><td>${esc(T('Grupo', 'Group'))}:</td><td class="line"></td><td>${esc(T('Material', 'Material'))}:</td><td class="line">${esc(sp)}</td></tr></table>` +
      `<h2>${esc(T('Objetivo', 'Aim'))}</h2><p>${esc(T('Obtener metafases mitóticas, contar el número cromosómico (2n) y fotografiar células para armar el cariotipo.', 'Obtain mitotic metaphases, count the chromosome number (2n) and photograph cells to build the karyotype.'))}</p>` +
      `<h2>${esc(T('Materiales', 'Materials'))}</h2><ul>${mats.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` +
      `<h2>${esc(T('Procedimiento', 'Procedure'))}</h2><ol class="pr-steps">${steps.map(s => `<li><b>${esc(T(s[0], s[1]))}.</b> ${esc(T(s[2], s[3]))} <span class="pr-src">(${esc(citeLang(s[4]))})</span></li>`).join('')}</ol>` +
      `<h2>${esc(T('Seguridad', 'Safety'))}</h2><ul>${Teach.SAFETY.map(s => `<li>${esc(T(s[0], s[1]))}</li>`).join('')}</ul>` +
      `<h2>${esc(T('Registro', 'Record'))}</h2><table class="pr-table"><thead><tr><th>${esc(T('Preparación', 'Slide'))}</th><th>${esc(T('Célula', 'Cell'))}</th><th>${esc(T('Fase', 'Phase'))}</th><th>${esc(T('2n contado', '2n counted'))}</th><th>${esc(T('Observaciones', 'Notes'))}</th></tr></thead><tbody>${rows}</tbody></table>` +
      `<h2>${esc(T('Dibujos', 'Drawings'))}</h2><div class="pr-draw"><div>${esc(T('Una metafase', 'A metaphase'))}</div><div>${esc(T('Una anafase', 'An anaphase'))}</div></div>` +
      `<h2>${esc(T('Preguntas', 'Questions'))}</h2><ol>${qs.map(q => `<li>${esc(q)}</li>`).join('')}</ol>` +
      `<h2>${esc(T('Referencias', 'References'))}</h2><ul class="pr-refs">${refs.map(r => `<li>${r}</li>`).join('')}</ul>` +
      `<p class="pr-foot">${esc(T('Hoja hecha con CytogeneticsPro 1.0.0 · LABG Suite', 'Sheet made with CytogeneticsPro 1.0.0 · LABG Suite'))}</p>`;
  }
  function renderPractical() { el('b9PPreview').innerHTML = `<div class="sheet">${practical()}</div>`; }
  const sheetPage = () => Report.page(T('Práctica de citogenética', 'Cytogenetics practical'), practical(), I18N.lang);

  /* ---------------- wiring ---------------- */
  function render() {
    if (!built) { built = true; renderTopics(); newQuiz(); fillProtocol(); newExercise(20261007); }
    renderSim(); renderGloss(); renderPractical();
    if (qz.length) renderQuiz();
    blockDone();
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (!el('panel-9')) return;
    el('b9Kind').addEventListener('change', e => { stopPlay(); sim.kind = e.target.value; sim.step = 0; renderSim(); });
    el('b9N').addEventListener('change', e => { const v = Math.round(num(e.target.value)); sim.n = isFinite(v) ? Math.max(1, Math.min(6, v)) : 3; e.target.value = sim.n; renderSim(); });
    el('b9Cross').addEventListener('change', e => { sim.cross = e.target.checked; renderSim(); });
    el('b9Seed').addEventListener('click', () => { sim.seed = Math.floor(Math.random() * 1e6) + 2; renderSim(); });
    el('b9Prev').addEventListener('click', () => { stopPlay(); sim.step--; renderSim(); });
    el('b9Next').addEventListener('click', () => { stopPlay(); sim.step++; renderSim(); });
    el('b9Play').addEventListener('click', togglePlay);
    el('b9Step').addEventListener('input', e => { stopPlay(); sim.step = +e.target.value; renderSim(); });
    el('b9ExNew').addEventListener('click', () => newExercise());
    el('b9ExPairs').addEventListener('change', () => newExercise());
    el('b9ExCuts').addEventListener('change', e => { const s = e.target.closest('select[data-k]'); if (s) { exAns[+s.dataset.i][s.dataset.k] = s.value; s.closest('.ex-cut').classList.remove('ok', 'bad', 'renum'); } });
    el('b9ExCheck').addEventListener('click', checkExercise);
    el('b9ExShow').addEventListener('click', showSolution);
    el('b9QTopics').addEventListener('click', e => {
      const b = e.target.closest('[data-t]');
      if (!b) return;
      const all = Teach.TOPICS.map(t => t[0]);
      let cur = qTopics.length ? qTopics.slice() : all.slice();
      cur = cur.includes(b.dataset.t) ? cur.filter(t => t !== b.dataset.t) : cur.concat([b.dataset.t]);
      qTopics = cur.length === all.length ? [] : cur;
      if (!cur.length) qTopics = ['__none'];
      renderTopics(); newQuiz();
    });
    el('b9QN').addEventListener('change', newQuiz);
    el('b9QNew').addEventListener('click', newQuiz);
    el('b9Quiz').addEventListener('change', e => { const m = /^b9q(\d+)$/.exec(e.target.name || ''); if (m) qAns[+m[1]] = +e.target.value; });
    el('b9QCheck').addEventListener('click', () => { qGraded = true; renderQuiz(); });
    el('b9GSearch').addEventListener('input', renderGloss);
    ['b9PPre', 'b9PHyd', 'b9PStain'].forEach(id => el(id).addEventListener('change', renderPractical));
    el('b9PSpecies').addEventListener('input', renderPractical);
    el('b9PPrint').addEventListener('click', () => Report.printHtml(sheetPage()));
    el('b9PSave').addEventListener('click', () => download(sheetPage(), T('practica_citogenetica.html', 'cytogenetics_practical.html'), 'text/html;charset=utf-8'));
  });
  document.addEventListener('stepchange', e => { if (e.detail.step === 9) render(); else stopPlay(); });
  document.addEventListener('langchange', () => { if (built) { renderTopics(); fillProtocol(); renderCuts(); } if (el('panel-9') && el('panel-9').classList.contains('active')) render(); });

  window.Block9 = { render, sim, get exercise() { return ex; }, get answers() { return exAns; }, newExercise, checkExercise, get quiz() { return qz; } };
})();
