/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — the engine of the teaching block (Teach).

   1. Mitosis and meiosis step by step for n pairs of chromosomes. Every
      chromosome is a list of chromatids and every chromatid a list of segments
      {a, b, h}: the stretch from a to b (0 = end of the short arm, 1 = end of
      the long arm) and the parent it came from (h = 0 paternal, 1 maternal).
      A crossing-over swaps the stretch beyond the chiasma between two
      non-sister chromatids, so the recombinant chromatids keep both colours to
      the end. Each step gives the drawing (SVG with theme colours) and what a
      student must count: cells, chromosomes and chromatids per cell, DNA
      content (C) and ploidy. The orientation of each bivalent in metaphase I
      and of each chromosome in metaphase II is drawn with the seed.
   2. The karyotype exercise: a synthetic metaphase (with Img.synth) of a
      karyotype drawn at random, whose answer is known, and its grading.
   3. Self-assessment: a bank of questions in both languages and generators of
      numeric questions whose right answer is computed.
   4. The glossary and the practical protocol (texts of cited protocols). */
(function () {
  'use strict';
  const r1 = v => Math.round(v * 10) / 10;
  const HC = ['var(--pr3)', 'var(--pr1)'];
  const rand = seed => (window.rng ? rng(seed || 1) : Math.random);

  /* ---------------- the chromosomes of the simulators ---------------- */
  const CPOS = [0.5, 0.36, 0.43, 0.28, 0.46, 0.33];
  function chromSet(n) {
    return Array.from({ length: n }, (_, i) => ({ pair: i, len: n === 1 ? 1 : 1 - i * 0.5 / (n - 1), cpos: CPOS[i % CPOS.length] }));
  }
  const whole = h => [{ a: 0, b: 1, h }];
  /* replace [a, b] of a chromatid by parent h */
  function paint(segs, a, b, h) {
    const out = [];
    segs.forEach(s => {
      if (s.b <= a || s.a >= b) { out.push(Object.assign({}, s)); return; }
      if (s.a < a) out.push({ a: s.a, b: a, h: s.h });
      if (s.b > b) out.push({ a: b, b: s.b, h: s.h });
    });
    out.push({ a, b, h });
    return out.sort((x, y) => x.a - y.a);
  }
  /* the stretch of a chromatid beyond the chiasma at x, away from the centromere */
  const distal = (x, cpos) => (x >= cpos ? [x, 1] : [0, x]);
  function crossOver(A, B, x, cpos) {
    const [a, b] = distal(x, cpos);
    const pa = A.filter(s => s.b > a && s.a < b), pb = B.filter(s => s.b > a && s.a < b);
    let nA = A, nB = B;
    pb.forEach(s => { nA = paint(nA, Math.max(a, s.a), Math.min(b, s.b), s.h); });
    pa.forEach(s => { nB = paint(nB, Math.max(a, s.a), Math.min(b, s.b), s.h); });
    return [nA, nB];
  }
  const recombinant = segs => new Set(segs.map(s => s.h)).size > 1;

  /* the cell cycle state of a meiosis: bivalents with their chiasma, the
     orientations of metaphase I and II and the four products */
  function meiosisPlan(n, opts) {
    const o = Object.assign({ crossover: true, seed: 1 }, opts || {});
    const R = rand(o.seed), set = chromSet(n);
    const biv = set.map(c => {
      const H = [0, 1].map(h => [whole(h), whole(h)]);
      let x = null;
      if (o.crossover) {
        const onLong = R() < 0.75;
        x = onLong ? c.cpos + (1 - c.cpos) * (0.35 + 0.5 * R()) : c.cpos * (0.2 + 0.5 * R());
        [H[0][1], H[1][0]] = crossOver(H[0][1], H[1][0], x, c.cpos);
      }
      return { c, H, x, left: R() < 0.5 ? 0 : 1, up: [R() < 0.5 ? 0 : 1, R() < 0.5 ? 0 : 1] };
    });
    /* products: cell 0 = left-top, 1 = left-bottom, 2 = right-top, 3 = right-bottom */
    const cells = [[], [], [], []];
    biv.forEach(B => {
      const L = B.H[B.left], Rr = B.H[1 - B.left];
      const [uL, uR] = B.up;
      cells[0].push({ c: B.c, segs: L[uL] }); cells[1].push({ c: B.c, segs: L[1 - uL] });
      cells[2].push({ c: B.c, segs: Rr[uR] }); cells[3].push({ c: B.c, segs: Rr[1 - uR] });
    });
    return { n, set, biv, cells, combos: Math.pow(2, n) };
  }

  /* ---------------- the drawing ---------------- */
  const W = 640;
  /* a chromosome: the short arm from the centromere at pAng (degrees), the long
     arm at qAng; one or two chromatids (side by side), each a list of segments */
  function chrom(cx, cy, pAng, qAng, L, cpos, w, chromatids) {
    const P = pAng * Math.PI / 180, Q = qAng * Math.PI / 180;
    const arms = [{ u: [Math.cos(P), Math.sin(P)], lo: 0, hi: cpos, d: t => (cpos - t) * L }, { u: [Math.cos(Q), Math.sin(Q)], lo: cpos, hi: 1, d: t => (t - cpos) * L }];
    const off = chromatids.length > 1 ? [-(w / 2 + 0.6), w / 2 + 0.6] : [0];
    let under = '', g = '';
    arms.forEach(A => {
      /* the normal of the short arm is turned round, so each chromatid stays on
         its own side through the centromere (straight or bent in a V) */
      const nrm = A.lo === 0 ? [A.u[1], -A.u[0]] : [-A.u[1], A.u[0]];
      chromatids.forEach((segs, k) => {
        const ox = nrm[0] * off[k], oy = nrm[1] * off[k];
        const d0 = A.d(A.lo === 0 ? 0 : 1);
        under += `<line class="tc-under" x1="${r1(cx + ox)}" y1="${r1(cy + oy)}" x2="${r1(cx + ox + A.u[0] * d0)}" y2="${r1(cy + oy + A.u[1] * d0)}" stroke-width="${r1(w + 2)}"/>`;
        segs.forEach(s => {
          const a = Math.max(s.a, A.lo), b = Math.min(s.b, A.hi);
          if (b <= a) return;
          const d1 = A.d(a), d2 = A.d(b);
          g += `<line x1="${r1(cx + ox + A.u[0] * d1)}" y1="${r1(cy + oy + A.u[1] * d1)}" x2="${r1(cx + ox + A.u[0] * d2)}" y2="${r1(cy + oy + A.u[1] * d2)}" stroke="${HC[s.h]}" stroke-width="${r1(w)}" stroke-linecap="round"/>`;
        });
      });
    });
    return under + g + `<circle class="tc-cen" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(Math.max(1.6, w * 0.62))}"/>`;
  }
  /* a wavy thread (interphase chromatin, leptotene, zygotene, pachytene) */
  function thread(pts, color, w, op) {
    let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) d += `L${r1(pts[i][0])} ${r1(pts[i][1])}`;
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op != null ? ` opacity="${op}"` : ''}/>`;
  }
  function wave(R, x0, y0, ang, len, amp, k) {
    const out = [], ph = R() * 6.28, steps = 18;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, a = ang + Math.sin(t * k + ph) * amp;
      const prev = out.length ? out[out.length - 1] : [x0, y0];
      if (!out.length) { out.push([x0, y0]); continue; }
      out.push([prev[0] + Math.cos(a) * len / steps, prev[1] + Math.sin(a) * len / steps]);
    }
    return out;
  }
  /* places inside a circle: a jittered grid */
  function slots(R, cx, cy, rad, m) {
    const k = Math.ceil(Math.sqrt(m * 1.3)), out = [];
    const step = 2 * rad * 0.72 / k;
    for (let i = 0; i < k && out.length < m * 3; i++) for (let j = 0; j < k; j++) {
      const x = cx - rad * 0.72 + (i + 0.5) * step, y = cy - rad * 0.72 + (j + 0.5) * step;
      if (Math.hypot(x - cx, y - cy) < rad * 0.8) out.push([x + (R() - 0.5) * step * 0.3, y + (R() - 0.5) * step * 0.3]);
    }
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out.slice(0, m);
  }
  const cellRect = (x, y, w, h) => `<rect class="tc-cell" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="26"/>`;
  const nucleus = (cx, cy, rad, broken) => `<circle class="tc-nuc${broken ? ' broken' : ''}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rad)}"/>`;
  const fibre = (x1, y1, x2, y2) => `<line class="tc-fib" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
  const pole = (x, y) => `<circle class="tc-pole" cx="${r1(x)}" cy="${r1(y)}" r="3"/>`;
  const plate = (x1, y1, x2, y2) => `<line class="tc-plate" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
  const label = (x, y, t) => `<text class="tc-lab" x="${r1(x)}" y="${r1(y)}" text-anchor="middle">${t}</text>`;

  /* interphase chromatin of a list of chromosomes [{c, h}] inside a nucleus */
  function chromatin(R, list, cx, cy, rad, w, op, lenK) {
    return list.map(it => {
      const a = R() * 6.28, len = rad * (lenK || 1.25) * it.c.len, st = [cx + (R() - 0.5) * rad * 0.9, cy + (R() - 0.5) * rad * 0.9];
      let pts = wave(R, st[0], st[1], a, len, 1.2, 9);
      pts = pts.map(p => { const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy), m = rad * 0.86; return d > m ? [cx + dx / d * m, cy + dy / d * m] : p; });
      return thread(pts, HC[it.h], w, op);
    }).join('');
  }

  const STEPS = {
    mitosis: ['interphase', 'prophase', 'prometaphase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis'],
    meiosis: ['interphase', 'leptotene', 'zygotene', 'pachytene', 'diplotene', 'diakinesis', 'metaphase1', 'anaphase1', 'telophase1', 'prophase2', 'metaphase2', 'anaphase2', 'telophase2', 'tetrad'],
  };
  const NAMES = {
    interphase: ['Interfase (G2)', 'Interphase (G2)'], prophase: ['Profase', 'Prophase'], prometaphase: ['Prometafase', 'Prometaphase'],
    metaphase: ['Metafase', 'Metaphase'], anaphase: ['Anafase', 'Anaphase'], telophase: ['Telofase', 'Telophase'], cytokinesis: ['Citocinesis', 'Cytokinesis'],
    leptotene: ['Profase I · leptoteno', 'Prophase I · leptotene'], zygotene: ['Profase I · cigoteno', 'Prophase I · zygotene'],
    pachytene: ['Profase I · paquiteno', 'Prophase I · pachytene'], diplotene: ['Profase I · diploteno', 'Prophase I · diplotene'],
    diakinesis: ['Profase I · diacinesis', 'Prophase I · diakinesis'], metaphase1: ['Metafase I', 'Metaphase I'], anaphase1: ['Anafase I', 'Anaphase I'],
    telophase1: ['Telofase I', 'Telophase I'], prophase2: ['Profase II', 'Prophase II'], metaphase2: ['Metafase II', 'Metaphase II'],
    anaphase2: ['Anafase II', 'Anaphase II'], telophase2: ['Telofase II', 'Telophase II'], tetrad: ['Tétrada', 'Tetrad'],
  };
  const TEXTS = {
    interphase: ['El ADN ya se replicó en la fase S: cada cromosoma tiene dos cromátidas hermanas, todavía descondensadas dentro del núcleo. Los colores marcan el origen de cada homólogo: azul, del padre; bermellón, de la madre.',
      'DNA was replicated in the S phase: each chromosome has two sister chromatids, still decondensed inside the nucleus. The colors mark where each homologue came from: blue, the father; vermilion, the mother.'],
    prophase: ['Los cromosomas se condensan y se ven las dos cromátidas unidas por el centrómero. En mitosis los homólogos no se aparean: cada cromosoma va por su cuenta.',
      'The chromosomes condense and the two chromatids joined at the centromere become visible. In mitosis homologues do not pair: each chromosome goes on its own.'],
    prometaphase: ['La envoltura nuclear se deshace; los microtúbulos del huso se unen a los cinetocoros de cada cromátida y mueven los cromosomas hacia el ecuador.',
      'The nuclear envelope breaks down; the spindle microtubules attach to the kinetochores of each chromatid and move the chromosomes to the equator.'],
    metaphase: ['Los cromosomas, en su máxima condensación, se alinean en la placa ecuatorial con cada cromátida hermana mirando a un polo. Es la fase que se usa para contar y medir: por eso los pretratamientos detienen las células aquí.',
      'The chromosomes, at their most condensed, line up on the equatorial plate with each sister chromatid facing a pole. This is the phase used to count and measure: that is why pretreatments stop cells here.'],
    anaphase: ['Las cromátidas hermanas se separan y cada una, ya un cromosoma, viaja a un polo con el centrómero por delante y los brazos detrás.',
      'The sister chromatids separate and each, now a chromosome, travels to a pole centromere first, its arms trailing.'],
    telophase: ['Llegan a los polos dos juegos idénticos de 2n cromosomas; se forman dos envolturas nucleares y, en las plantas, la placa celular crece desde el centro.',
      'Two identical sets of 2n chromosomes reach the poles; two nuclear envelopes form and, in plants, the cell plate grows from the centre.'],
    cytokinesis: ['Dos células hijas idénticas a la madre: 2n cromosomas de una cromátida cada uno (2C). Volverán a replicar su ADN antes de dividirse otra vez.',
      'Two daughter cells identical to the mother: 2n chromosomes of one chromatid each (2C). They will replicate their DNA again before dividing.'],
    leptotene: ['Los cromosomas empiezan a condensarse como hilos largos y delgados; las cromátidas hermanas no se distinguen todavía.',
      'The chromosomes begin to condense as long thin threads; the sister chromatids cannot be told apart yet.'],
    zygotene: ['Los homólogos se buscan y se aparean (sinapsis) a lo largo, como un cierre, por medio del complejo sinaptonémico.',
      'Homologues find each other and pair (synapsis) along their length, like a zipper, held by the synaptonemal complex.'],
    pachytene: ['La sinapsis es completa: cada par es un bivalente (dos homólogos, cuatro cromátidas). Aquí ocurre el entrecruzamiento entre cromátidas no hermanas.',
      'Synapsis is complete: each pair is a bivalent (two homologues, four chromatids). Crossing-over between non-sister chromatids happens here.'],
    diplotene: ['Los homólogos se separan salvo en los quiasmas, donde se ve el intercambio: las cromátidas recombinantes llevan los dos colores.',
      'The homologues pull apart except at the chiasmata, where the exchange shows: the recombinant chromatids carry both colors.'],
    diakinesis: ['Los bivalentes se condensan al máximo y se apartan a la periferia del núcleo. Es el mejor momento para contar bivalentes y quiasmas.',
      'The bivalents condense fully and move to the edge of the nucleus. It is the best moment to count bivalents and chiasmata.'],
    metaphase1: ['Los bivalentes se alinean en la placa con un homólogo hacia cada polo. Qué homólogo va a cada lado es al azar en cada par: hay 2ⁿ combinaciones (segregación independiente).',
      'The bivalents line up on the plate with one homologue facing each pole. Which homologue goes to each side is random in each pair: there are 2ⁿ combinations (independent assortment).'],
    anaphase1: ['Se separan los homólogos, no las cromátidas: cada polo recibe n cromosomas, cada uno todavía con dos cromátidas. Aquí se reduce el número a la mitad.',
      'The homologues separate, not the chromatids: each pole receives n chromosomes, each still with two chromatids. This is where the number is halved.'],
    telophase1: ['Dos núcleos con n cromosomas de dos cromátidas cada uno. En muchas plantas sigue una intercinesis breve, sin replicación del ADN.',
      'Two nuclei with n chromosomes of two chromatids each. In many plants a short interkinesis follows, without DNA replication.'],
    prophase2: ['Cada una de las dos células condensa otra vez sus n cromosomas; las cromátidas hermanas ya no son idénticas si hubo entrecruzamiento.',
      'Each of the two cells condenses its n chromosomes again; the sister chromatids are no longer identical if there was crossing-over.'],
    metaphase2: ['En cada célula los n cromosomas se alinean con una cromátida hacia cada polo, como en una mitosis; la orientación de cada cromosoma vuelve a ser al azar.',
      'In each cell the n chromosomes line up with one chromatid facing each pole, as in a mitosis; the orientation of each chromosome is again random.'],
    anaphase2: ['Se separan las cromátidas hermanas: cada polo recibe n cromosomas de una cromátida.',
      'The sister chromatids separate: each pole receives n chromosomes of one chromatid.'],
    telophase2: ['Se forman cuatro núcleos haploides; en las plantas, las paredes se forman a la vez en la tétrada.',
      'Four haploid nuclei form; in plants, the walls form at once in the tetrad.'],
    tetrad: ['Cuatro células con n cromosomas (1C), distintas entre sí: por la segregación independiente y por el entrecruzamiento. En las anteras darán granos de polen.',
      'Four cells with n chromosomes (1C), different from each other: because of independent assortment and crossing-over. In the anthers they will become pollen grains.'],
  };
  /* what a student must count in each step: [cells, chromosomes per cell, chromatids per chromosome, C per cell, ploidy] */
  function counts(kind, key, n) {
    const t = {
      interphase: [1, 2 * n, 2, 4, '2n'], prophase: [1, 2 * n, 2, 4, '2n'], prometaphase: [1, 2 * n, 2, 4, '2n'], metaphase: [1, 2 * n, 2, 4, '2n'],
      anaphase: [1, 4 * n, 1, 4, '2n'], telophase: [1, 4 * n, 1, 4, '2n'], cytokinesis: [2, 2 * n, 1, 2, '2n'],
      leptotene: [1, 2 * n, 2, 4, '2n'], zygotene: [1, 2 * n, 2, 4, '2n'], pachytene: [1, 2 * n, 2, 4, '2n'], diplotene: [1, 2 * n, 2, 4, '2n'],
      diakinesis: [1, 2 * n, 2, 4, '2n'], metaphase1: [1, 2 * n, 2, 4, '2n'], anaphase1: [1, 2 * n, 2, 4, '2n'], telophase1: [2, n, 2, 2, 'n'],
      prophase2: [2, n, 2, 2, 'n'], metaphase2: [2, n, 2, 2, 'n'], anaphase2: [2, 2 * n, 1, 2, 'n'], telophase2: [4, n, 1, 1, 'n'], tetrad: [4, n, 1, 1, 'n'],
    }[key];
    return { cells: t[0], chromosomes: t[1], chromatids: t[2], C: t[3], ploidy: t[4], bivalents: ['pachytene', 'diplotene', 'diakinesis', 'metaphase1'].includes(key) ? n : 0 };
  }

  /* the drawing of one step */
  function draw(kind, key, n, opts) {
    const o = Object.assign({ crossover: true, seed: 1 }, opts || {});
    const R = rand((o.seed || 1) * 7919 + STEPS[kind].indexOf(key) * 31 + 3);
    const set = chromSet(n), plan = kind === 'meiosis' ? meiosisPlan(n, o) : null;
    const base = 84;                          // length in px of the longest metaphase chromosome
    const stack = Math.max(n * (kind === 'meiosis' ? 1 : 2), 1);
    let H = Math.max(260, 70 + stack * (base * 0.66 + 10));
    if (kind === 'meiosis' && ['prophase2', 'metaphase2', 'anaphase2', 'telophase2', 'tetrad'].includes(key)) H = Math.max(300, 90 + n * 36);
    const cy = H / 2;
    let g = '';
    const all = set.flatMap(c => [0, 1].map(h => ({ c, h })));
    const twoCh = h => [whole(h), whole(h)];
    if (key === 'interphase') {
      g += cellRect(20, 10, W - 40, H - 20) + nucleus(W / 2, cy, Math.min(110, H / 2 - 30));
      g += chromatin(R, all, W / 2, cy, Math.min(110, H / 2 - 30), 1.6, 0.6);
    } else if (kind === 'mitosis') {
      if (key === 'prophase' || key === 'prometaphase') {
        const rad = Math.min(130, H / 2 - 24), cond = key === 'prophase' ? 0.95 : 0.72, w = key === 'prophase' ? 2.6 : 3.8;
        g += cellRect(20, 10, W - 40, H - 20) + nucleus(W / 2, cy, rad, key === 'prometaphase');
        const S = slots(R, W / 2, cy, rad, all.length);
        if (key === 'prometaphase') g += pole(70, cy) + pole(W - 70, cy);
        all.forEach((it, i) => {
          let [x, y] = S[i];
          if (key === 'prometaphase') x = W / 2 + (x - W / 2) * 0.45;
          const a = R() * 180;
          g += chrom(x, y, a - 90, a + 90, base * cond * it.c.len, it.c.cpos, w, twoCh(it.h));
          if (key === 'prometaphase') g += fibre(x < W / 2 ? 70 : W - 70, cy, x, y);
        });
      } else if (key === 'metaphase') {
        g += cellRect(20, 10, W - 40, H - 20) + pole(70, cy) + pole(W - 70, cy) + plate(W / 2, 24, W / 2, H - 24);
        const L = all.map(it => base * 0.66 * it.c.len), tot = L.reduce((a, b) => a + b, 0) + 10 * all.length;
        let y = cy - tot / 2;
        all.forEach((it, i) => {
          const yc = y + it.c.cpos * L[i];
          g += fibre(70, cy, W / 2 - 3, yc) + fibre(W - 70, cy, W / 2 + 3, yc);
          g += chrom(W / 2, yc, -90, 90, L[i], it.c.cpos, 5, twoCh(it.h));
          y += L[i] + 10;
        });
      } else if (key === 'anaphase' || key === 'telophase') {
        const d = key === 'anaphase' ? 120 : 200;
        g += cellRect(20, 10, W - 40, H - 20);
        if (key === 'anaphase') g += pole(50, cy) + pole(W - 50, cy);
        else g += nucleus(W / 2 - d, cy, Math.min(95, H / 2 - 30), true) + nucleus(W / 2 + d, cy, Math.min(95, H / 2 - 30), true) + plate(W / 2, 30, W / 2, H - 30);
        const k = key === 'anaphase' ? 0.66 : 0.5, L = all.map(it => base * k * it.c.len), gap = key === 'anaphase' ? 8 : 4;
        const tot = L.reduce((a, b) => a + b * 0.75, 0) + gap * all.length;
        let y = cy - tot / 2;
        all.forEach((it, i) => {
          const yc = y + L[i] * 0.35;
          g += chrom(W / 2 - d, yc, -22, 22, L[i], it.c.cpos, 3.6, [whole(it.h)]);
          g += chrom(W / 2 + d, yc, 202, 158, L[i], it.c.cpos, 3.6, [whole(it.h)]);
          if (key === 'anaphase') g += fibre(50, cy, W / 2 - d, yc) + fibre(W - 50, cy, W / 2 + d, yc);
          y += L[i] * 0.75 + gap;
        });
      } else if (key === 'cytokinesis') {
        const rad = Math.min(85, H / 2 - 34);
        g += cellRect(20, 10, W / 2 - 25, H - 20) + cellRect(W / 2 + 5, 10, W / 2 - 25, H - 20);
        g += nucleus(W / 4 + 2, cy, rad) + nucleus(3 * W / 4 - 2, cy, rad);
        g += chromatin(R, all, W / 4 + 2, cy, rad, 1.4, 0.65, 1.3) + chromatin(R, all, 3 * W / 4 - 2, cy, rad, 1.4, 0.65, 1.3);
      }
    } else {
      /* meiosis */
      const rad = Math.min(135, H / 2 - 22);
      if (key === 'leptotene' || key === 'zygotene' || key === 'pachytene') {
        g += cellRect(20, 10, W - 40, H - 20) + nucleus(W / 2, cy, rad);
        if (key === 'leptotene') g += chromatin(R, all, W / 2, cy, rad, 2, 0.95, 1.3);
        else {
          const S = slots(R, W / 2, cy, rad, n);
          set.forEach((c, i) => {
            const [x, y] = S[i], a = R() * 6.28, len = (key === 'zygotene' ? 1.15 : 0.85) * rad * c.len;
            const pts = wave(R, x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2, a, len, 0.7, 7);
            [0, 1].forEach(h => {
              const sg = h ? -1 : 1;
              const P = pts.map((p, k) => {
                const q = pts[Math.min(pts.length - 1, k + 1)], pp = pts[Math.max(0, k - 1)];
                const tx = q[0] - pp[0], ty = q[1] - pp[1], m = Math.hypot(tx, ty) || 1, t = k / (pts.length - 1);
                const off = key === 'pachytene' ? 2.2 : (t < 0.45 ? 1.8 : 1.8 + (t - 0.45) * 26);
                return [p[0] - ty / m * off * sg, p[1] + tx / m * off * sg];
              });
              g += thread(P, HC[h], key === 'pachytene' ? 3 : 2.2, 0.95);
            });
          });
        }
      } else if (key === 'diplotene' || key === 'diakinesis') {
        g += cellRect(20, 10, W - 40, H - 20) + nucleus(W / 2, cy, rad);
        const S = key === 'diplotene' ? slots(R, W / 2, cy, rad, n) : set.map((c, i) => { const a = i / n * 6.28 + 0.4; return [W / 2 + Math.cos(a) * rad * 0.6, cy + Math.sin(a) * rad * 0.6]; });
        plan.biv.forEach((B, i) => {
          const [x, y] = S[i], a = key === 'diplotene' ? R() * 3.14 : i / n * 6.28 + 0.4 + 1.57, L = base * (key === 'diplotene' ? 0.9 : 0.62) * B.c.len;
          g += bivalent(x, y, a, L, B, key === 'diplotene' ? 2 : 2.6);
        });
      } else if (key === 'metaphase1' || key === 'anaphase1') {
        g += cellRect(20, 10, W - 40, H - 20) + pole(50, cy) + pole(W - 50, cy);
        if (key === 'metaphase1') g += plate(W / 2, 24, W / 2, H - 24);
        const L = plan.biv.map(B => base * 0.66 * B.c.len), tot = L.reduce((a, b) => a + b, 0) + 14 * n;
        let y = cy - tot / 2;
        plan.biv.forEach((B, i) => {
          const yc = y + B.c.cpos * L[i], left = B.H[B.left], right = B.H[1 - B.left];
          if (key === 'metaphase1') {
            const dx = 9;
            g += fibre(50, cy, W / 2 - dx, yc) + fibre(W - 50, cy, W / 2 + dx, yc);
            g += chrom(W / 2 - dx, yc, -90, 90, L[i], B.c.cpos, 3.6, left) + chrom(W / 2 + dx, yc, -90, 90, L[i], B.c.cpos, 3.6, right);
            if (B.x != null) { const yx = yc + (B.x - B.c.cpos) * L[i]; g += `<line class="tc-chi" x1="${r1(W / 2 - dx + 4)}" y1="${r1(yx)}" x2="${r1(W / 2 + dx - 4)}" y2="${r1(yx)}"/>`; }
          } else {
            const d = 140;
            g += fibre(50, cy, W / 2 - d, yc) + fibre(W - 50, cy, W / 2 + d, yc);
            g += chrom(W / 2 - d, yc, -24, 24, L[i], B.c.cpos, 3.4, left) + chrom(W / 2 + d, yc, 204, 156, L[i], B.c.cpos, 3.4, right);
          }
          y += L[i] + 14;
        });
      } else if (key === 'telophase1') {
        const rr = Math.min(95, H / 2 - 30);
        g += cellRect(20, 10, W - 40, H - 20) + nucleus(W / 2 - 170, cy, rr, true) + nucleus(W / 2 + 170, cy, rr, true) + plate(W / 2, 30, W / 2, H - 30);
        const L = plan.biv.map(B => base * 0.5 * B.c.len), tot = L.reduce((a, b) => a + b, 0) + 8 * n;
        let y = cy - tot / 2;
        plan.biv.forEach((B, i) => {
          const yc = y + B.c.cpos * L[i];
          g += chrom(W / 2 - 170, yc, -90, 90, L[i], B.c.cpos, 3, B.H[B.left]) + chrom(W / 2 + 170, yc, -90, 90, L[i], B.c.cpos, 3, B.H[1 - B.left]);
          y += L[i] + 8;
        });
      } else if (key === 'prophase2' || key === 'metaphase2' || key === 'anaphase2' || key === 'telophase2') {
        const cw = W / 2 - 25;
        g += cellRect(20, 10, cw, H - 20) + cellRect(W / 2 + 5, 10, cw, H - 20);
        [0, 1].forEach(side => {
          const cx = side ? 3 * W / 4 - 2 : W / 4 + 2;
          const chs = plan.biv.map(B => ({ B, ch: side ? B.H[1 - B.left] : B.H[B.left], up: B.up[side] }));
          if (key === 'prophase2') {
            const rr = Math.min(105, H / 2 - 30), S = slots(R, cx, cy, rr, n);
            g += nucleus(cx, cy, rr);
            chs.forEach((it, i) => { const a = R() * 180; g += chrom(S[i][0], S[i][1], a - 90, a + 90, base * 0.7 * it.B.c.len, it.B.c.cpos, 3.2, it.ch); });
          } else if (key === 'metaphase2') {
            g += pole(cx, 26) + pole(cx, H - 26) + plate(cx - cw / 2 + 16, cy, cx + cw / 2 - 16, cy);
            const sp = (cw - 50) / Math.max(1, n);
            chs.forEach((it, i) => {
              const x = cx - (cw - 50) / 2 + sp * (i + 0.5);
              const ordered = it.up ? [it.ch[1], it.ch[0]] : it.ch;
              g += fibre(cx, 26, x, cy - 3) + fibre(cx, H - 26, x, cy + 3);
              g += chrom(x, cy, 180, 0, base * 0.55 * it.B.c.len, it.B.c.cpos, 3.2, ordered);
            });
          } else if (key === 'anaphase2') {
            g += pole(cx, 22) + pole(cx, H - 22);
            const sp = (cw - 50) / Math.max(1, n);
            chs.forEach((it, i) => {
              const x = cx - (cw - 50) / 2 + sp * (i + 0.5), L = base * 0.55 * it.B.c.len, top = it.ch[it.up], bot = it.ch[1 - it.up];
              g += fibre(cx, 22, x, cy - 70) + fibre(cx, H - 22, x, cy + 70);
              g += chrom(x, cy - 70, 112, 68, L, it.B.c.cpos, 3, [top]) + chrom(x, cy + 70, -68, -112, L, it.B.c.cpos, 3, [bot]);
            });
          } else {
            const rr = Math.min(52, H / 4 - 16);
            g += nucleus(cx, cy - H / 4 + 4, rr, true) + nucleus(cx, cy + H / 4 - 4, rr, true) + plate(cx - cw / 2 + 20, cy, cx + cw / 2 - 20, cy);
            const sp = Math.min(22, (2 * rr - 12) / Math.max(1, n));
            chs.forEach((it, i) => {
              const x = cx - sp * (n - 1) / 2 + sp * i, L = base * 0.42 * it.B.c.len;
              g += chrom(x, cy - H / 4 + 4 - L * (0.5 - it.B.c.cpos), -90, 90, L, it.B.c.cpos, 2.8, [it.ch[it.up]]);
              g += chrom(x, cy + H / 4 - 4 - L * (0.5 - it.B.c.cpos), -90, 90, L, it.B.c.cpos, 2.8, [it.ch[1 - it.up]]);
            });
          }
        });
      } else if (key === 'tetrad') {
        const cw = W / 2 - 25, ch = H / 2 - 15;
        const boxes = [[20, 10], [20, H / 2 + 5], [W / 2 + 5, 10], [W / 2 + 5, H / 2 + 5]];
        plan.cells.forEach((cell, k) => {
          const [x0, y0] = boxes[k], cx = x0 + cw / 2, ccy = y0 + ch / 2;
          g += cellRect(x0, y0, cw, ch) + nucleus(cx, ccy + 4, Math.min(cw, ch) / 2 - 14);
          const sp = Math.min(26, (Math.min(cw, ch) - 50) / Math.max(1, n));
          cell.forEach((it, i) => {
            const x = cx - sp * (n - 1) / 2 + sp * i, L = base * 0.5 * it.c.len;
            g += chrom(x, ccy + 4 - L * (0.5 - it.c.cpos), -90, 90, L, it.c.cpos, 3.2, [it.segs]);
          });
          g += label(cx, y0 + 18, T('Célula ', 'Cell ') + (k + 1));
        });
      }
    }
    const name = T(NAMES[key][0], NAMES[key][1]);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" class="fig teach" viewBox="0 0 ${W} ${Math.ceil(H)}" width="${W}" height="${Math.ceil(H)}" role="img" aria-label="${name}">${g}</svg>`, H, plan };
  }
  /* a bivalent of prophase I: the two homologues apart except at the chiasma */
  function bivalent(x, y, a, L, B, w) {
    const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
    const xc = B.x != null ? B.x : B.c.cpos;
    let g = '';
    [0, 1].forEach(h => {
      const sg = h ? -1 : 1;
      B.H[h].forEach((segs, k) => {
        const kOff = (k ? 1 : -1) * (w / 2 + 0.5);
        const at = t => { const sep = B.x != null ? Math.min(7, 26 * Math.abs(t - xc)) : 7; const along = (t - 0.5) * L; return [x + ca * along + nx * (sep * sg + kOff), y + sa * along + ny * (sep * sg + kOff)]; };
        segs.forEach(s => {
          const pts = []; for (let i = 0; i <= 10; i++) pts.push(at(s.a + (s.b - s.a) * i / 10));
          g += thread(pts, HC[s.h], w);
        });
      });
      const cp = (() => { const sep = B.x != null ? Math.min(7, 26 * Math.abs(B.c.cpos - xc)) : 7; const along = (B.c.cpos - 0.5) * L; return [x + ca * along + nx * sep * sg, y + sa * along + ny * sep * sg]; })();
      g += `<circle class="tc-cen" cx="${r1(cp[0])}" cy="${r1(cp[1])}" r="${r1(w * 0.95)}"/>`;
    });
    return g;
  }
  /* the products of a meiosis in words */
  function products(plan) {
    return plan.cells.map((cell, k) => ({
      cell: k + 1,
      chromosomes: cell.map(it => ({ pair: it.c.pair + 1, from: it.segs.length === 1 ? (it.segs[0].h ? 'M' : 'P') : 'R', segs: it.segs })),
    }));
  }

  /* ---------------- the karyotype exercise ---------------- */
  /* a karyotype of nPairs pairs, longest first, each of a type whose arm ratio
     lies well inside its class (r: m 1.1–1.45, sm 2.0–2.6, st 3.8–5.5) */
  function exercise(seed, nPairs) {
    const R = rand(seed || 1), n = nPairs || 5;
    const TYPES = ['m', 'sm', 'st'];
    const pairs = [];
    let len = 6.4 + R() * 1.2;
    for (let i = 0; i < n; i++) {
      const type = i === 0 ? 'm' : TYPES[Math.floor(R() * 3)];
      const r = type === 'm' ? 1.1 + R() * 0.35 : type === 'sm' ? 2.0 + R() * 0.6 : 3.8 + R() * 1.7;
      const s = len / (1 + r);
      pairs.push({ pair: i + 1, c: len, s, l: len - s, r, type });
      len *= 0.8 - R() * 0.05;
    }
    const W0 = 1100, H0 = 760, ppu = 18;
    const chrs = pairs.flatMap(p => [0, 1].map(k => ({ pair: p.pair, s: p.s * (1 + (R() - 0.5) * 0.04), l: p.l * (1 + (R() - 0.5) * 0.04), type: p.type })));
    for (let i = chrs.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [chrs[i], chrs[j]] = [chrs[j], chrs[i]]; }
    const cols = Math.ceil(Math.sqrt(chrs.length * 1.5)), rows = Math.ceil(chrs.length / cols);
    const cw = (W0 - 160) / cols, rh = (H0 - 180) / rows;
    const spec = { w: W0, h: H0, pxPerUm: ppu, seed: (seed || 1) + 11, width: 14, bar: 5, nuclei: [[110, 120, 60]], chromosomes: chrs.map((c, i) => ({
      cx: 100 + cw * (i % cols + 0.5) + (R() - 0.5) * cw * 0.2, cy: 110 + rh * (Math.floor(i / cols) + 0.5) + (R() - 0.5) * rh * 0.15,
      ang: Math.PI / 2 + (R() - 0.5) * 1.6, bend: (R() - 0.5) * 0.25, s: c.s, l: c.l })) };
    return { seed, pairs, chrs, spec, ppu };
  }
  /* grading: answers[i] = {pair, type} for chromosome i (in the order of the image) */
  function grade(ex, answers) {
    const items = ex.chrs.map((c, i) => {
      const a = answers[i] || {};
      return { i: i + 1, truePair: c.pair, trueType: c.type, r: c.l / c.s, pair: +a.pair || null, type: a.type || '', typeOk: a.type === c.type };
    });
    /* two chromosomes go together when the student gave them the same number: a
       pair is right when its two members (and only them) share a number; the
       numbering is right when it follows the length (1 = the longest) */
    const groups = new Map();
    items.forEach(it => { if (it.pair) { if (!groups.has(it.pair)) groups.set(it.pair, []); groups.get(it.pair).push(it); } });
    let pairsOk = 0, orderOk = 0;
    ex.pairs.forEach(p => {
      const mem = items.filter(it => it.truePair === p.pair);
      const same = mem[0].pair && mem.every(it => it.pair === mem[0].pair) && groups.get(mem[0].pair).length === mem.length;
      mem.forEach(it => { it.pairOk = same; });
      if (same) { pairsOk++; if (mem[0].pair === p.pair) orderOk++; }
    });
    items.forEach(it => { it.numberOk = it.pair === it.truePair; });
    return { items, pairsOk, orderOk, typesOk: items.filter(it => it.typeOk).length, n: ex.pairs.length, total: items.length };
  }

  /* ---------------- self-assessment ---------------- */
  /* static questions: [topic, es question, es options, en question, en options, right index, es explanation, en explanation] */
  const BANK = [
    ['kar', '¿Qué mide el índice centromérico (IC)?', ['La longitud del brazo corto como porcentaje de la longitud total', 'El cociente brazo largo / brazo corto', 'La longitud relativa del cromosoma en el juego', 'La distancia del centrómero al telómero del brazo largo'],
      'What does the centromeric index (CI) measure?', ['The length of the short arm as a percentage of the total length', 'The ratio long arm / short arm', 'The relative length of the chromosome in the set', 'The distance from the centromere to the telomere of the long arm'], 0,
      'IC = 100 · p / (p + q). Un metacéntrico perfecto tiene IC = 50; la razón de brazos r = q / p es otra medida.', 'CI = 100 · p / (p + q). A perfect metacentric has CI = 50; the arm ratio r = q / p is another measure.'],
    ['kar', 'Con la nomenclatura de Levan et al. (1964), un cromosoma con r = 2.4 es…', ['metacéntrico (m)', 'submetacéntrico (sm)', 'subtelocéntrico (st)', 'telocéntrico (t)'],
      'With the nomenclature of Levan et al. (1964), a chromosome with r = 2.4 is…', ['metacentric (m)', 'submetacentric (sm)', 'subtelocentric (st)', 'telocentric (t)'], 1,
      'Levan: m 1.0–1.7, sm 1.7–3.0, st 3.0–7.0, t > 7.0.', 'Levan: m 1.0–1.7, sm 1.7–3.0, st 3.0–7.0, t > 7.0.'],
    ['kar', '¿Qué es el satélite de un cromosoma?', ['El segmento más allá de una constricción secundaria', 'Un cromosoma B pequeño', 'La heterocromatina del centrómero', 'Un fragmento perdido en la anafase'],
      'What is the satellite of a chromosome?', ['The segment beyond a secondary constriction', 'A small B chromosome', 'The heterochromatin of the centromere', 'A fragment lost in anaphase'], 0,
      'La constricción secundaria suele ser la región organizadora del nucléolo (NOR), donde están los genes del ADNr 45S.', 'The secondary constriction is usually the nucleolus organizer region (NOR), where the 45S rDNA genes lie.'],
    ['kar', 'El número fundamental (NF) cuenta…', ['los brazos cromosómicos del complemento', 'los pares de homólogos', 'los cromosomas con satélite', 'los quiasmas por célula'],
      'The fundamental number (FN) counts…', ['the chromosome arms of the complement', 'the pairs of homologues', 'the chromosomes with a satellite', 'the chiasmata per cell'], 0,
      'm y sm aportan dos brazos; st y t, uno (salvo que se decida contar los st como de dos brazos).', 'm and sm add two arms; st and t, one (unless st are counted as two-armed).'],
    ['asy', '¿Qué índice resume la variación de las longitudes de los cromosomas (asimetría intercromosómica)?', ['CVCL', 'MCA', 'TF%', 'AsK%'],
      'Which index sums up the variation of chromosome lengths (interchromosomal asymmetry)?', ['CVCL', 'MCA', 'TF%', 'AsK%'], 0,
      'CVCL es el coeficiente de variación de las longitudes (Paszko 2006). MCA mide la posición de los centrómeros.', 'CVCL is the coefficient of variation of the lengths (Paszko 2006). MCA measures the position of the centromeres.'],
    ['asy', 'Peruzzi y Eroğlu (2013) recomiendan describir la asimetría de un cariotipo con…', ['MCA y CVCL', 'TF% y Syi', 'A1 y A2 solamente', 'las categorías de Stebbins solamente'],
      'Peruzzi and Eroğlu (2013) recommend describing karyotype asymmetry with…', ['MCA and CVCL', 'TF% and Syi', 'A1 and A2 only', 'the Stebbins categories only'], 0,
      'Uno mide la asimetría intracromosómica (MCA) y el otro la intercromosómica (CVCL); varios índices clásicos son redundantes con ellos.', 'One measures intrachromosomal asymmetry (MCA) and the other interchromosomal (CVCL); several classic indices are redundant with them.'],
    ['asy', 'En las categorías de Stebbins (1971), la letra (A, B, C) depende de…', ['el cociente entre el cromosoma más largo y el más corto', 'la proporción de cromosomas con r < 2', 'el número de pares con satélite', 'el nivel de ploidía'],
      'In the Stebbins (1971) categories, the letter (A, B, C) depends on…', ['the ratio between the longest and the shortest chromosome', 'the proportion of chromosomes with r < 2', 'the number of pairs with a satellite', 'the ploidy level'], 0,
      'A: menos de 2; B: de 2 a 4; C: más de 4. El número (1–4) depende de la proporción de cromosomas con r < 2.', 'A: less than 2; B: 2 to 4; C: more than 4. The number (1–4) depends on the proportion of chromosomes with r < 2.'],
    ['mei', '¿En qué subfase de la profase I se completa la sinapsis de los homólogos?', ['Paquiteno', 'Leptoteno', 'Diacinesis', 'Diploteno'],
      'In which substage of prophase I is the synapsis of homologues complete?', ['Pachytene', 'Leptotene', 'Diakinesis', 'Diplotene'], 0,
      'En cigoteno empieza el apareamiento y en paquiteno es completo; el entrecruzamiento ocurre en paquiteno.', 'Pairing starts in zygotene and is complete in pachytene; crossing-over happens in pachytene.'],
    ['mei', 'Un bivalente en anillo en metafase I tiene, como mínimo…', ['dos quiasmas, uno en cada brazo', 'un quiasma', 'ningún quiasma', 'cuatro quiasmas'],
      'A ring bivalent in metaphase I has, at least…', ['two chiasmata, one in each arm', 'one chiasma', 'no chiasma', 'four chiasmata'], 0,
      'El bivalente en varilla tiene quiasmas en un solo brazo; el anillo, en los dos.', 'The rod bivalent has chiasmata in one arm only; the ring, in both.'],
    ['mei', '¿Qué se separa en la anafase I?', ['Los cromosomas homólogos', 'Las cromátidas hermanas', 'Los brazos de cada cromosoma', 'Los nucléolos'],
      'What separates in anaphase I?', ['The homologous chromosomes', 'The sister chromatids', 'The arms of each chromosome', 'The nucleoli'], 0,
      'En anafase I se reduce el número: cada polo recibe n cromosomas con dos cromátidas. Las hermanas se separan en anafase II.', 'Anaphase I halves the number: each pole receives n chromosomes with two chromatids. Sisters separate in anaphase II.'],
    ['mei', 'En un autotetraploide, ¿qué configuraciones se esperan en metafase I?', ['Cuadrivalentes además de bivalentes (y algunos univalentes y trivalentes)', 'Sólo bivalentes', 'Sólo univalentes', 'Sólo cuadrivalentes en anillo'],
      'In an autotetraploid, which configurations are expected in metaphase I?', ['Quadrivalents besides bivalents (and some univalents and trivalents)', 'Only bivalents', 'Only univalents', 'Only ring quadrivalents'], 0,
      'Con cuatro homólogos, sus extremos pueden aparearse con distintos compañeros y formar multivalentes. Un alopoliploide con apareamiento preferencial forma sólo bivalentes.', 'With four homologues, their ends can pair with different partners and form multivalents. An allopolyploid with preferential pairing forms only bivalents.'],
    ['mei', 'El índice meiótico de Love (1951) es…', ['el porcentaje de tétradas normales; por debajo de 90 la meiosis es irregular', 'el número de quiasmas por célula', 'la proporción de polen teñido', 'el número de bivalentes por célula'],
      'Love’s (1951) meiotic index is…', ['the percentage of normal tetrads; below 90 meiosis is irregular', 'the number of chiasmata per cell', 'the proportion of stained pollen', 'the number of bivalents per cell'], 0,
      'Love propuso que una planta con índice menor de 90 % tiene problemas meióticos que afectan su fertilidad.', 'Love proposed that a plant with an index below 90 % has meiotic problems that affect its fertility.'],
    ['mei', 'El índice de recombinación de una célula se calcula como…', ['n + quiasmas por célula', '2n − quiasmas', 'quiasmas / bivalentes', 'bivalentes × 2'],
      'The recombination index of a cell is computed as…', ['n + chiasmata per cell', '2n − chiasmata', 'chiasmata / bivalents', 'bivalents × 2'], 0,
      'Cada par aporta una unidad por la segregación independiente y cada quiasma una más (Darlington).', 'Each pair adds one unit for independent assortment and each chiasma one more (Darlington).'],
    ['plo', 'Un 1 pg de ADN equivale a unos…', ['978 millones de pares de bases', '9.78 millones de pares de bases', '1 000 millones de bases sencillas', '97.8 mil pares de bases'],
      '1 pg of DNA is about…', ['978 million base pairs', '9.78 million base pairs', '1 000 million single bases', '97.8 thousand base pairs'], 0,
      'Doležel et al. (2003): 1 pg = 0.978 × 10⁹ pb.', 'Doležel et al. (2003): 1 pg = 0.978 × 10⁹ bp.'],
    ['plo', 'El valor 2C es…', ['el contenido de ADN de un núcleo somático sin replicar', 'el contenido de un juego monoploide', 'el ADN de un gameto', 'el ADN de un núcleo en G2'],
      'The 2C value is…', ['the DNA content of an unreplicated somatic nucleus', 'the content of one monoploid set', 'the DNA of a gamete', 'the DNA of a nucleus in G2'], 0,
      'Greilhuber et al. (2005): C es el núcleo de un gameto sin replicar; Cx, el de un genoma monoploide (x cromosomas).', 'Greilhuber et al. (2005): C is the unreplicated nucleus of a gamete; Cx, that of one monoploid genome (x chromosomes).'],
    ['plo', 'En citometría de flujo, el estándar interno se procesa…', ['en el mismo tubo que la muestra', 'en otro día, con la misma calibración', 'sólo si la muestra es poliploide', 'en lugar de la muestra'],
      'In flow cytometry, the internal standard is processed…', ['in the same tube as the sample', 'on another day, with the same calibration', 'only if the sample is polyploid', 'instead of the sample'], 0,
      'Así comparten la preparación, la tinción y la corrida, y la razón de picos no depende de cambios del aparato.', 'So they share the preparation, the staining and the run, and the peak ratio does not depend on changes of the instrument.'],
    ['plo', '2n = 2x + 1 describe…', ['un trisómico', 'un triploide', 'un monosómico', 'un tetraploide'],
      '2n = 2x + 1 describes…', ['a trisomic', 'a triploid', 'a monosomic', 'a tetraploid'], 0,
      'Un cromosoma de más en un diploide: aneuploidía. Un triploide sería 2n = 3x.', 'One extra chromosome in a diploid: aneuploidy. A triploid would be 2n = 3x.'],
    ['plo', 'La disploidía es…', ['el cambio del número básico (x) por reordenamientos, sin duplicar el genoma', 'la duplicación del genoma completo', 'la pérdida de un cromosoma en una célula', 'la presencia de cromosomas B'],
      'Dysploidy is…', ['the change of the base number (x) by rearrangements, without doubling the genome', 'the doubling of the whole genome', 'the loss of a chromosome in one cell', 'the presence of B chromosomes'], 0,
      'Fusiones o fisiones de cromosomas cambian x en pasos de uno (descendente o ascendente).', 'Fusions or fissions of chromosomes change x in steps of one (descending or ascending).'],
    ['plo', 'En la prueba de Allium, el índice mitótico es…', ['las células en división entre el total de células observadas', 'las células con aberraciones entre las que se dividen', 'los micronúcleos por mil células', 'la longitud de las raíces'],
      'In the Allium test, the mitotic index is…', ['the dividing cells over all the cells observed', 'the cells with aberrations over the dividing ones', 'the micronuclei per thousand cells', 'the length of the roots'], 0,
      'Un índice mitótico menor que el del testigo indica citotoxicidad; las aberraciones y micronúcleos, genotoxicidad.', 'A mitotic index lower than the control’s indicates cytotoxicity; aberrations and micronuclei, genotoxicity.'],
    ['ban', 'Las bandas C muestran…', ['heterocromatina constitutiva', 'genes activos', 'la región del centrómero solamente', 'ADN de cloroplasto'],
      'C-bands show…', ['constitutive heterochromatin', 'active genes', 'the centromere region only', 'chloroplast DNA'], 0,
      'Tras desnaturalizar y renaturalizar, la heterocromatina queda teñida más intensamente (Guerra 2000).', 'After denaturing and renaturing, heterochromatin stains more strongly (Guerra 2000).'],
    ['ban', 'Una banda CMA⁺ / DAPI⁻ indica heterocromatina rica en…', ['GC', 'AT', 'ARN', 'proteínas'],
      'A CMA⁺ / DAPI⁻ band indicates heterochromatin rich in…', ['GC', 'AT', 'RNA', 'proteins'], 0,
      'La cromomicina A3 se une preferentemente a GC y el DAPI a AT; las NOR suelen ser CMA⁺.', 'Chromomycin A3 binds preferentially to GC and DAPI to AT; NORs are usually CMA⁺.'],
    ['ban', 'Una sonda FISH de ADNr 45S marca…', ['las regiones organizadoras del nucléolo (NOR)', 'todos los centrómeros', 'los telómeros', 'el cromosoma X'],
      'A 45S rDNA FISH probe marks…', ['the nucleolus organizer regions (NOR)', 'every centromere', 'the telomeres', 'the X chromosome'], 0,
      'Los genes de los ARN ribosómicos 18S-5.8S-26S están en tándem en la NOR; el ADNr 5S suele estar en otros sitios.', 'The genes of the 18S-5.8S-26S ribosomal RNAs are in tandem at the NOR; 5S rDNA usually lies elsewhere.'],
    ['ban', 'En GISH, la sonda es…', ['el ADN genómico total de una especie', 'una secuencia repetida corta', 'un gen de copia única', 'ARN mensajero'],
      'In GISH, the probe is…', ['the total genomic DNA of a species', 'a short repeated sequence', 'a single-copy gene', 'messenger RNA'], 0,
      'Permite reconocer los cromosomas de cada genoma progenitor en un híbrido o un alopoliploide.', 'It lets one recognize the chromosomes of each parental genome in a hybrid or an allopolyploid.'],
    ['tec', '¿Para qué sirve el pretratamiento con 8-hidroxiquinolina o colchicina?', ['Acumular metafases y condensar los cromosomas', 'Fijar el tejido', 'Ablandar la pared celular', 'Teñir el ADN'],
      'What is the pretreatment with 8-hydroxyquinoline or colchicine for?', ['To accumulate metaphases and condense the chromosomes', 'To fix the tissue', 'To soften the cell wall', 'To stain DNA'], 0,
      'Inhiben el huso: las células se detienen en metafase con los cromosomas cortos y separados.', 'They inhibit the spindle: cells stop in metaphase with short, separate chromosomes.'],
    ['tec', 'El fijador de Carnoy más usado (3:1) es…', ['etanol y ácido acético, 3:1', 'metanol y agua, 3:1', 'ácido clorhídrico y etanol, 3:1', 'formaldehído y etanol, 3:1'],
      'The most used Carnoy fixative (3:1) is…', ['ethanol and acetic acid, 3:1', 'methanol and water, 3:1', 'hydrochloric acid and ethanol, 3:1', 'formaldehyde and ethanol, 3:1'], 0,
      'Se prepara al momento; el material fijado se guarda en etanol al 70 % en frío.', 'It is prepared fresh; fixed material is stored in 70 % ethanol in the cold.'],
    ['tec', 'En la reacción de Feulgen, la hidrólisis con HCl…', ['libera grupos aldehído de la desoxirribosa que reaccionan con el reactivo de Schiff', 'tiñe las proteínas', 'quita el ARN solamente', 'fija los cromosomas'],
      'In the Feulgen reaction, the HCl hydrolysis…', ['frees aldehyde groups of the deoxyribose that react with Schiff’s reagent', 'stains the proteins', 'removes RNA only', 'fixes the chromosomes'], 0,
      'Por eso la tinción de Feulgen es específica del ADN y su intensidad es proporcional a su cantidad.', 'That is why Feulgen staining is specific to DNA and its intensity is proportional to its amount.'],
    ['cmp', 'La correlación cofenética mide…', ['qué tan bien el dendrograma conserva las distancias originales', 'la correlación entre dos variables', 'el número de grupos', 'la longitud del árbol'],
      'The cophenetic correlation measures…', ['how well the dendrogram keeps the original distances', 'the correlation between two variables', 'the number of groups', 'the length of the tree'], 0,
      'Es la correlación entre las distancias originales y las alturas a las que el árbol une cada pareja (Sokal y Rohlf 1962); 0.8 o más se considera buena.', 'It is the correlation between the original distances and the heights at which the tree joins each pair (Sokal and Rohlf 1962); 0.8 or more is considered good.'],
    ['cmp', 'Al reconstruir el número cromosómico sobre un árbol, un paso de n = 7 a n = 14 se interpreta como…', ['una poliploidización (×2)', 'siete disploidías ascendentes obligatoriamente', 'una demiploidía', 'una aneuploidía'],
      'When reconstructing the chromosome number on a tree, a step from n = 7 to n = 14 is read as…', ['a polyploidization (×2)', 'necessarily seven ascending dysploidies', 'a demiploidy', 'an aneuploidy'], 0,
      'Con costos iguales para cada evento, una duplicación cuesta menos que siete ganancias.', 'With equal costs for each event, one duplication costs less than seven gains.'],
  ];
  /* numeric generators: (R) => {es, en, opts, ans, expEs, expEn} */
  const fx = (v, d) => fmtFixed(v, d);
  const shuffleWith = (R, right, wrong) => {
    const opts = [right].concat(wrong.filter((w, i, a) => w !== right && a.indexOf(w) === i)).slice(0, 4);
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return { opts, ans: opts.indexOf(right) };
  };
  const GEN = [
    R => { const p = +(1 + R() * 2).toFixed(1), q = +(p * (1.2 + R() * 3)).toFixed(1), ci = 100 * p / (p + q);
      const S = shuffleWith(R, fx(ci, 1), [fx(100 * q / (p + q), 1), fx(q / p, 2), fx(100 * p / q, 1)]);
      return { topic: 'kar', es: `Un cromosoma tiene un brazo corto de ${p} µm y uno largo de ${q} µm. ¿Cuál es su índice centromérico?`, en: `A chromosome has a short arm of ${p} µm and a long arm of ${q} µm. What is its centromeric index?`,
        opts: S.opts, ans: S.ans, expEs: `IC = 100 · ${p} / (${p} + ${q}) = ${fx(ci, 1)}.`, expEn: `CI = 100 · ${p} / (${p} + ${q}) = ${fx(ci, 1)}.` }; },
    R => { const cls = Math.floor(R() * 3), r = [1.15 + R() * 0.4, 1.9 + R() * 0.9, 3.4 + R() * 3.0][cls];
      const names = [['metacéntrico (m)', 'metacentric (m)'], ['submetacéntrico (sm)', 'submetacentric (sm)'], ['subtelocéntrico (st)', 'subtelocentric (st)'], ['telocéntrico (t)', 'telocentric (t)']];
      return { topic: 'kar', es: `Según Levan et al. (1964), un cromosoma con razón de brazos r = ${fx(r, 2)} es…`, en: `According to Levan et al. (1964), a chromosome with arm ratio r = ${fx(r, 2)} is…`,
        opts: names.map(x => x[0]), optsEn: names.map(x => x[1]), ans: cls, expEs: 'm 1.0–1.7, sm 1.7–3.0, st 3.0–7.0, t > 7.0.', expEn: 'm 1.0–1.7, sm 1.7–3.0, st 3.0–7.0, t > 7.0.' }; },
    R => { const std = [1.96, 2.5, 5.43][Math.floor(R() * 3)], ratio = +(0.6 + R() * 1.6).toFixed(3), c2 = ratio * std;
      const S = shuffleWith(R, fx(c2, 2), [fx(std / ratio, 2), fx(c2 / 2, 2), fx(c2 * 2, 2)]);
      return { topic: 'plo', es: `El pico G1 de la muestra está en el canal ${fx(ratio * 200, 1)} y el del estándar interno (2C = ${std} pg) en el 200. ¿Cuál es el 2C de la muestra (pg)?`,
        en: `The G1 peak of the sample is at channel ${fx(ratio * 200, 1)} and that of the internal standard (2C = ${std} pg) at 200. What is the 2C of the sample (pg)?`,
        opts: S.opts, ans: S.ans, expEs: `2C = (${fx(ratio * 200, 1)} / 200) · ${std} = ${fx(c2, 2)} pg.`, expEn: `2C = (${fx(ratio * 200, 1)} / 200) · ${std} = ${fx(c2, 2)} pg.` }; },
    R => { const x = [5, 6, 7, 8, 9, 10, 11, 12][Math.floor(R() * 8)], lv = [2, 3, 4, 6][Math.floor(R() * 4)], n2 = x * lv;
      const nm = { 2: ['diploide', 'diploid'], 3: ['triploide', 'triploid'], 4: ['tetraploide', 'tetraploid'], 6: ['hexaploide', 'hexaploid'] };
      const opts = [2, 3, 4, 6].map(k => `${nm[k][0]} (${k}x)`), optsEn = [2, 3, 4, 6].map(k => `${nm[k][1]} (${k}x)`);
      return { topic: 'plo', es: `En un género con x = ${x}, una planta tiene 2n = ${n2}. Es…`, en: `In a genus with x = ${x}, a plant has 2n = ${n2}. It is…`,
        opts, optsEn, ans: [2, 3, 4, 6].indexOf(lv), expEs: `${n2} / ${x} = ${lv} juegos: 2n = ${lv}x = ${n2}.`, expEn: `${n2} / ${x} = ${lv} sets: 2n = ${lv}x = ${n2}.` }; },
    R => { const n = 2 + Math.floor(R() * 9), v = Math.pow(2, n);
      const S = shuffleWith(R, String(v), [String(2 * n), String(n * n), String(Math.pow(2, n - 1))]);
      return { topic: 'mei', es: `Una especie tiene n = ${n}. Sin entrecruzamiento, ¿cuántas combinaciones distintas de cromosomas paternos y maternos puede recibir un gameto?`,
        en: `A species has n = ${n}. Without crossing-over, how many different combinations of paternal and maternal chromosomes can a gamete receive?`,
        opts: S.opts, ans: S.ans, expEs: `Cada par se orienta al azar en la metafase I: 2ⁿ = 2^${n} = ${v}.`, expEn: `Each pair orients at random in metaphase I: 2ⁿ = 2^${n} = ${v}.` }; },
  ];
  /* a quiz of k questions: static ones of the chosen topics and generated ones, shuffled with the seed */
  function quiz(seed, k, topics) {
    const R = rand(seed || 1);
    const use = t => !topics || !topics.length || topics.includes(t);
    let qs = BANK.filter(b => use(b[0])).map((b, i) => {
      const order = [0, 1, 2, 3];
      for (let j = 3; j > 0; j--) { const m = Math.floor(R() * (j + 1)); [order[j], order[m]] = [order[m], order[j]]; }
      return { id: 'b' + i, topic: b[0], es: b[1], en: b[3], opts: order.map(o => b[2][o]), optsEn: order.map(o => b[4][o]), ans: order.indexOf(b[5]), expEs: b[6], expEn: b[7] };
    });
    GEN.forEach((f, i) => { const q = f(R); if (use(q.topic)) qs.push(Object.assign({ id: 'g' + i, optsEn: q.optsEn || q.opts }, q)); });
    for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; }
    return qs.slice(0, k || 10);
  }
  const TOPICS = [['kar', 'Cariotipo', 'Karyotype'], ['asy', 'Asimetría', 'Asymmetry'], ['mei', 'Meiosis', 'Meiosis'], ['plo', 'Ploidía y genoma', 'Ploidy and genome'],
    ['ban', 'Bandeo y FISH', 'Banding and FISH'], ['tec', 'Técnicas', 'Techniques'], ['cmp', 'Comparación', 'Comparison']];

  /* ---------------- glossary ----------------
     [term es, term en, definition es, definition en, art] */
  const GLOSSARY = [
    ['Aneuploidía', 'Aneuploidy', 'Número cromosómico que no es múltiplo exacto del número básico: faltan o sobran cromosomas sueltos (2n − 1, 2n + 1).', 'A chromosome number that is not an exact multiple of the base number: single chromosomes are missing or extra (2n − 1, 2n + 1).'],
    ['Bivalente', 'Bivalent', 'Par de homólogos apareados en la profase y la metafase I, unidos por uno o más quiasmas.', 'A pair of homologues paired in prophase and metaphase I, held by one or more chiasmata.', 'r2'],
    ['Bivalente en varilla', 'Rod bivalent', 'Bivalente con quiasmas en un solo brazo; sus homólogos quedan unidos por un extremo.', 'A bivalent with chiasmata in one arm only; its homologues are joined at one end.', 'c2'],
    ['Bivalente en anillo', 'Ring bivalent', 'Bivalente con quiasmas en los dos brazos; forma un anillo cerrado.', 'A bivalent with chiasmata in both arms; it forms a closed ring.', 'r2'],
    ['Cariotipo', 'Karyotype', 'El juego de cromosomas de una especie descrito por su número, su tamaño, la posición del centrómero y sus marcas.', 'The chromosome set of a species described by number, size, centromere position and landmarks.'],
    ['Centrómero', 'Centromere', 'La constricción primaria, donde se unen las cromátidas hermanas y se forma el cinetocoro que sujeta al huso.', 'The primary constriction, where sister chromatids are joined and the kinetochore that holds the spindle forms.', 'm'],
    ['Cromátida', 'Chromatid', 'Cada una de las dos copias de un cromosoma replicado; se separan en la anafase de la mitosis o en la anafase II.', 'Each of the two copies of a replicated chromosome; they separate in mitotic anaphase or in anaphase II.'],
    ['Cromosoma B', 'B chromosome', 'Cromosoma supernumerario, prescindible, que no forma parte del complemento básico (A).', 'A supernumerary, dispensable chromosome that is not part of the basic (A) complement.'],
    ['Cuadrivalente', 'Quadrivalent', 'Asociación de cuatro homólogos en la meiosis, típica de los autotetraploides; en cadena o en anillo.', 'An association of four homologues in meiosis, typical of autotetraploids; as a chain or a ring.', 'r4'],
    ['Disploidía', 'Dysploidy', 'Cambio del número básico x en pasos de uno, por fusión o fisión de cromosomas, sin duplicar el genoma.', 'A change of the base number x in steps of one, by fusion or fission of chromosomes, without doubling the genome.'],
    ['Euploidía', 'Euploidy', 'Número cromosómico múltiplo exacto del número básico (2x, 3x, 4x…).', 'A chromosome number that is an exact multiple of the base number (2x, 3x, 4x…).'],
    ['Heterocromatina', 'Heterochromatin', 'Cromatina que permanece condensada en la interfase; la constitutiva se ve como bandas C.', 'Chromatin that stays condensed in interphase; constitutive heterochromatin shows as C-bands.'],
    ['Heteromorfismo', 'Heteromorphism', 'Diferencia visible entre los dos homólogos de un par: tamaño, una banda o una señal presente en uno solo.', 'A visible difference between the two homologues of a pair: size, a band or a signal present in one only.'],
    ['Homólogos', 'Homologues', 'Los dos cromosomas de un par, uno de cada progenitor, con los mismos genes en el mismo orden.', 'The two chromosomes of a pair, one from each parent, with the same genes in the same order.'],
    ['Idiograma', 'Idiogram', 'Dibujo esquemático del cariotipo con los cromosomas a escala, ordenados y con sus marcas.', 'A schematic drawing of the karyotype with the chromosomes to scale, ordered and with their landmarks.'],
    ['Índice centromérico', 'Centromeric index', 'IC = 100 · p / (p + q): el brazo corto como porcentaje de la longitud.', 'CI = 100 · p / (p + q): the short arm as a percentage of the length.'],
    ['Metacéntrico', 'Metacentric', 'Cromosoma con el centrómero cerca del centro (r de 1.0 a 1.7).', 'A chromosome with the centromere near the middle (r from 1.0 to 1.7).', 'm'],
    ['Submetacéntrico', 'Submetacentric', 'Cromosoma con brazos claramente desiguales (r de 1.7 a 3.0).', 'A chromosome with clearly unequal arms (r from 1.7 to 3.0).', 'sm'],
    ['Subtelocéntrico', 'Subtelocentric', 'Cromosoma con el brazo corto muy pequeño (r de 3.0 a 7.0).', 'A chromosome with a very small short arm (r from 3.0 to 7.0).', 'st'],
    ['Telocéntrico', 'Telocentric', 'Cromosoma con el centrómero en un extremo (r mayor de 7.0).', 'A chromosome with the centromere at one end (r above 7.0).', 't'],
    ['Micronúcleo', 'Micronucleus', 'Núcleo pequeño, aparte del principal, con un fragmento o un cromosoma entero que quedó rezagado en la división.', 'A small nucleus, apart from the main one, holding a fragment or a whole chromosome that lagged in division.'],
    ['NOR', 'NOR', 'Región organizadora del nucléolo: genes del ADNr 45S en tándem, a menudo en una constricción secundaria.', 'Nucleolus organizer region: 45S rDNA genes in tandem, often at a secondary constriction.', 'sat'],
    ['Número básico (x)', 'Base number (x)', 'Número de cromosomas de un juego monoploide del grupo; 2n = 4x = 28 indica x = 7.', 'The number of chromosomes of one monoploid set of the group; 2n = 4x = 28 means x = 7.'],
    ['Número fundamental', 'Fundamental number', 'Número de brazos cromosómicos del complemento.', 'The number of chromosome arms of the complement.'],
    ['Quiasma', 'Chiasma', 'Punto donde dos cromátidas no hermanas siguen unidas tras el entrecruzamiento; se ve en diploteno y diacinesis.', 'A point where two non-sister chromatids stay joined after crossing-over; visible in diplotene and diakinesis.', 'chi'],
    ['Satélite', 'Satellite', 'Segmento de cromosoma más allá de una constricción secundaria.', 'A chromosome segment beyond a secondary constriction.', 'sat'],
    ['Sinapsis', 'Synapsis', 'Apareamiento de los homólogos a lo largo en la profase I, mediante el complejo sinaptonémico.', 'The lengthwise pairing of homologues in prophase I, through the synaptonemal complex.'],
    ['Telómero', 'Telomere', 'El extremo de un cromosoma, formado por repeticiones cortas en tándem.', 'The end of a chromosome, made of short tandem repeats.'],
    ['Trivalente', 'Trivalent', 'Asociación de tres homólogos en la meiosis, típica de triploides y trisómicos.', 'An association of three homologues in meiosis, typical of triploids and trisomics.', 'c3'],
    ['Univalente', 'Univalent', 'Cromosoma sin pareja en la metafase I.', 'A chromosome without a partner in metaphase I.', 'c1'],
    ['Autopoliploide', 'Autopolyploid', 'Poliploide cuyos juegos vienen de la misma especie (AAAA); forma multivalentes.', 'A polyploid whose sets come from the same species (AAAA); it forms multivalents.'],
    ['Alopoliploide', 'Allopolyploid', 'Poliploide que reúne juegos de especies distintas (AABB); con apareamiento preferencial forma sólo bivalentes.', 'A polyploid that combines sets of different species (AABB); with preferential pairing it forms only bivalents.'],
    ['Valor C', 'C-value', 'Contenido de ADN de un núcleo gamético sin replicar; 2C es el de un núcleo somático en G1.', 'The DNA content of an unreplicated gametic nucleus; 2C is that of a somatic nucleus in G1.'],
    ['Índice mitótico', 'Mitotic index', 'Proporción de células en división entre todas las observadas.', 'The proportion of dividing cells among all those observed.'],
    ['Tétrada', 'Tetrad', 'Las cuatro células que deja la meiosis de una célula madre; en las anteras darán cuatro granos de polen.', 'The four cells left by the meiosis of one mother cell; in the anthers they become four pollen grains.'],
  ];
  /* the small drawing of a glossary entry */
  function glossArt(key) {
    if (!key) return '';
    const S = 70;
    let g = '';
    if (['m', 'sm', 'st', 't'].includes(key)) {
      const cp = { m: 0.47, sm: 0.33, st: 0.2, t: 0.04 }[key];
      g = chrom(35, 12 + cp * 46, -90, 90, 46, cp, 5, [whole(0), whole(0)]);
    } else if (key === 'sat') {
      g = chrom(35, 30, -90, 90, 34, 0.25, 5, [whole(0), whole(0)]) + `<line x1="35" y1="21" x2="35" y2="15" class="tc-sc"/>` +
        `<line x1="32" y1="10" x2="32" y2="13" stroke="${HC[0]}" stroke-width="5" stroke-linecap="round"/><line x1="38" y1="10" x2="38" y2="13" stroke="${HC[0]}" stroke-width="5" stroke-linecap="round"/>`;
    } else if (key === 'chi') {
      const B = { c: { cpos: 0.4, len: 1 }, x: 0.7, H: [[whole(0), whole(0)], [whole(1), whole(1)]] };
      [B.H[0][1], B.H[1][0]] = crossOver(B.H[0][1], B.H[1][0], 0.7, 0.4);
      g = bivalent(35, 35, 1.57, 52, B, 2.4);
    } else if (window.Art && Art.config) g = Art.config(key, 35, 35, 46, 0);
    return `<svg xmlns="http://www.w3.org/2000/svg" class="fig teach gl-art" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" aria-hidden="true">${g}</svg>`;
  }

  /* ---------------- the practical: root-tip squash ----------------
     Steps with options; each option names its source. No brands. */
  const PROTOCOL = {
    pre: [
      ['hq', '8-hidroxiquinolina 0.002 M, 3–4 h a 16–18 °C', '8-hydroxyquinoline 0.002 M, 3–4 h at 16–18 °C', 'Sharma y Sharma 1980'],
      ['col', 'Colchicina 0.05–0.1 %, 2–4 h a temperatura ambiente (tóxica: guantes)', 'Colchicine 0.05–0.1 %, 2–4 h at room temperature (toxic: gloves)', 'Sharma y Sharma 1980'],
      ['ice', 'Agua con hielo (0–4 °C), 18–24 h', 'Ice water (0–4 °C), 18–24 h', 'Darlington y La Cour 1976'],
      ['abn', 'Solución saturada de α-bromonaftaleno, 2–4 h (en campana)', 'Saturated α-bromonaphthalene, 2–4 h (in a fume hood)', 'Guerra y Souza 2002'],
    ],
    fix: [['carnoy', 'Carnoy 3:1 (etanol absoluto : ácido acético glacial), recién hecho, 24 h a 4 °C; guardar en etanol al 70 % en frío', 'Carnoy 3:1 (absolute ethanol : glacial acetic acid), freshly made, 24 h at 4 °C; store in 70 % ethanol in the cold', 'Darlington y La Cour 1976']],
    hyd: [
      ['hcl1', 'HCl 1 N a 60 °C, 8–12 min (con orceína o carmín)', '1 N HCl at 60 °C, 8–12 min (with orcein or carmine)', 'Sharma y Sharma 1980'],
      ['hcl5', 'HCl 5 N a temperatura ambiente, 20–60 min (para Feulgen)', '5 N HCl at room temperature, 20–60 min (for Feulgen)', 'Guerra y Souza 2002'],
      ['enz', 'Mezcla de celulasa y pectinasa (2 % y 20 %) a 37 °C, 1–2 h (para bandeo o FISH)', 'Cellulase and pectinase mix (2 % and 20 %) at 37 °C, 1–2 h (for banding or FISH)', 'Schwarzacher y Heslop-Harrison 2000'],
    ],
    stain: [
      ['orc', 'Aceto-orceína al 2 %, 10–30 min', '2 % aceto-orcein, 10–30 min', 'Darlington y La Cour 1976'],
      ['car', 'Acetocarmín o carmín propiónico al 1 %, 10–30 min', '1 % acetocarmine or propionic carmine, 10–30 min', 'Sharma y Sharma 1980'],
      ['feu', 'Reactivo de Schiff (Feulgen), 1–2 h en oscuridad; después, una gota de ácido acético al 45 %', 'Schiff’s reagent (Feulgen), 1–2 h in the dark; then a drop of 45 % acetic acid', 'Guerra y Souza 2002'],
    ],
  };
  function protocolSteps(choice) {
    const c = Object.assign({ pre: 'hq', hyd: 'hcl1', stain: 'orc' }, choice || {});
    const pick = (k, id) => PROTOCOL[k].find(x => x[0] === id) || PROTOCOL[k][0];
    const pre = pick('pre', c.pre), fix = PROTOCOL.fix[0], hyd = pick('hyd', c.hyd), st = pick('stain', c.stain);
    return [
      ['Raíces', 'Roots', 'Germinar semillas en papel húmedo (o bulbos en agua) a 22–25 °C y cortar las puntas de 1–2 cm cuando crecen activamente (por la mañana).', 'Germinate seeds on moist paper (or bulbs in water) at 22–25 °C and cut 1–2 cm tips while they grow actively (in the morning).', 'Guerra y Souza 2002'],
      ['Pretratamiento', 'Pretreatment', pre[1], pre[2], pre[3]],
      ['Fijación', 'Fixation', fix[1], fix[2], fix[3]],
      ['Lavado', 'Rinse', 'Lavar en agua destilada, 3 × 5 min.', 'Rinse in distilled water, 3 × 5 min.', 'Guerra y Souza 2002'],
      ['Hidrólisis', 'Hydrolysis', hyd[1], hyd[2], hyd[3]],
      ['Tinción', 'Staining', st[1], st[2], st[3]],
      ['Aplastado', 'Squash', 'Cortar el meristemo (1–2 mm de la punta), ponerlo en una gota de ácido acético al 45 % o del colorante, cubrir y aplastar con el pulgar sobre papel filtro, sin deslizar el cubreobjetos.', 'Cut the meristem (1–2 mm of the tip), put it in a drop of 45 % acetic acid or of the stain, cover and squash with the thumb over filter paper, without sliding the coverslip.', 'Darlington y La Cour 1976'],
      ['Observación', 'Observation', 'Buscar metafases con cromosomas separados a 400× y fotografiarlas a 1000× (inmersión). Para preparaciones permanentes: congelar, quitar el cubreobjetos y montar.', 'Look for metaphases with separate chromosomes at 400× and photograph them at 1000× (immersion). For permanent slides: freeze, remove the coverslip and mount.', 'Singh 2017'],
    ];
  }
  const SAFETY = [['El ácido clorhídrico y el ácido acético glacial son corrosivos: bata, guantes y lentes; trabajar en campana.', 'Hydrochloric acid and glacial acetic acid are corrosive: lab coat, gloves and glasses; work in a fume hood.'],
    ['La colchicina y el α-bromonaftaleno son tóxicos: no tocar sin guantes y desechar como residuo peligroso.', 'Colchicine and α-bromonaphthalene are toxic: do not touch without gloves and discard as hazardous waste.'],
    ['El reactivo de Schiff y los fijadores se guardan cerrados y rotulados.', 'Schiff’s reagent and fixatives are kept closed and labeled.']];

  window.Teach = { chromSet, paint, crossOver, recombinant, meiosisPlan, STEPS, NAMES, TEXTS, counts, draw, products, exercise, grade,
    BANK, GEN, quiz, TOPICS, GLOSSARY, glossArt, PROTOCOL, protocolSteps, SAFETY, HC };
})();
