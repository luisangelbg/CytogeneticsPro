{
/* CytogeneticsPro — tests of teach.js: the chromatids of the simulators and
   the crossing-over, the products of a meiosis, what to count in each step,
   the drawings, the karyotype exercise and its grading, the questions and the
   texts of the glossary and the practical. */
sec('Docencia: cromátidas y entrecruzamiento');
const cs = Teach.chromSet(3);
t('tres pares, del más largo al más corto', cs.length === 3 && cs[0].len === 1 && cs[1].len === 0.75 && cs[2].len === 0.5);
t('pintar un tramo de una cromátida', JSON.stringify(Teach.paint([{ a: 0, b: 1, h: 0 }], 0.6, 1, 1)) === JSON.stringify([{ a: 0, b: 0.6, h: 0 }, { a: 0.6, b: 1, h: 1 }]));
let X = Teach.crossOver([{ a: 0, b: 1, h: 0 }], [{ a: 0, b: 1, h: 1 }], 0.7, 0.4);
t('quiasma en el brazo largo: se cambia el tramo hasta el telómero q', JSON.stringify(X[0]) === JSON.stringify([{ a: 0, b: 0.7, h: 0 }, { a: 0.7, b: 1, h: 1 }]) && JSON.stringify(X[1]) === JSON.stringify([{ a: 0, b: 0.7, h: 1 }, { a: 0.7, b: 1, h: 0 }]));
X = Teach.crossOver([{ a: 0, b: 1, h: 0 }], [{ a: 0, b: 1, h: 1 }], 0.2, 0.4);
t('quiasma en el brazo corto: se cambia el tramo hasta el telómero p', JSON.stringify(X[0]) === JSON.stringify([{ a: 0, b: 0.2, h: 1 }, { a: 0.2, b: 1, h: 0 }]));
t('una cromátida con dos orígenes es recombinante', Teach.recombinant(X[0]) && !Teach.recombinant([{ a: 0, b: 1, h: 1 }]));

sec('Docencia: los productos de la meiosis');
const key = segs => JSON.stringify(segs);
let allOk = true, recOk = true, cenOk = true;
for (let seed = 1; seed <= 40; seed++) {
  const M = Teach.meiosisPlan(4, { seed, crossover: true });
  if (M.cells.length !== 4 || M.cells.some(c => c.length !== 4 || c.map(x => x.c.pair).join() !== '0,1,2,3')) allOk = false;
  M.biv.forEach((B, j) => {
    const fromCells = M.cells.map(c => key(c[j].segs)).sort().join('|'), fromBiv = B.H.flat().map(key).sort().join('|');
    if (fromCells !== fromBiv) allOk = false;
    if (M.cells.filter(c => Teach.recombinant(c[j].segs)).length !== 2) recOk = false;
    /* the centromere stays with its parent: two products carry the paternal one and two the maternal one */
    const cenH = M.cells.map(c => c[j].segs.find(s => s.a <= B.c.cpos && s.b >= B.c.cpos).h);
    if (cenH.filter(h => h === 0).length !== 2) cenOk = false;
  });
}
t('cuatro productos con un cromosoma de cada par: las cuatro cromátidas del bivalente', allOk);
t('con un quiasma por bivalente, dos de los cuatro productos son recombinantes', recOk);
t('los centrómeros segregan 2:2 (paterno y materno)', cenOk);
const M0 = Teach.meiosisPlan(3, { seed: 7, crossover: false });
t('sin entrecruzamiento ningún producto es recombinante', M0.cells.every(c => c.every(x => !Teach.recombinant(x.segs))));
t('combinaciones posibles: 2ⁿ', M0.combos === 8);
let pat = 0;
for (let seed = 1; seed <= 400; seed++) if (Teach.meiosisPlan(2, { seed, crossover: false }).cells[0][0].segs[0].h === 0) pat++;
t('orientación al azar: la célula 1 recibe el homólogo paterno del par 1 cerca de la mitad de las veces', pat > 160 && pat < 240, pat);

sec('Docencia: lo que hay que contar');
let C = Teach.counts('mitosis', 'metaphase', 3);
t('metafase mitótica (n = 3): 1 célula, 6 cromosomas de 2 cromátidas, 4C', C.cells === 1 && C.chromosomes === 6 && C.chromatids === 2 && C.C === 4 && C.ploidy === '2n');
C = Teach.counts('mitosis', 'anaphase', 3);
t('anafase mitótica: 12 cromosomas de una cromátida, 4C', C.chromosomes === 12 && C.chromatids === 1 && C.C === 4);
C = Teach.counts('mitosis', 'cytokinesis', 3);
t('citocinesis: 2 células 2n de 2C', C.cells === 2 && C.chromosomes === 6 && C.C === 2);
C = Teach.counts('meiosis', 'metaphase1', 3);
t('metafase I: 3 bivalentes, 4C', C.bivalents === 3 && C.C === 4 && C.chromosomes === 6);
C = Teach.counts('meiosis', 'telophase1', 3);
t('telofase I: 2 células con n cromosomas de 2 cromátidas, 2C', C.cells === 2 && C.chromosomes === 3 && C.chromatids === 2 && C.C === 2 && C.ploidy === 'n');
C = Teach.counts('meiosis', 'tetrad', 3);
t('tétrada: 4 células n de 1C', C.cells === 4 && C.chromosomes === 3 && C.chromatids === 1 && C.C === 1);
t('pasos: 7 de mitosis y 14 de meiosis, con nombre y texto en los dos idiomas',
  Teach.STEPS.mitosis.length === 7 && Teach.STEPS.meiosis.length === 14 && Teach.STEPS.mitosis.concat(Teach.STEPS.meiosis).every(k => Teach.NAMES[k] && Teach.NAMES[k].length === 2 && Teach.TEXTS[k] && Teach.TEXTS[k][0] && Teach.TEXTS[k][1]));

sec('Docencia: dibujos');
let clean = true;
['mitosis', 'meiosis'].forEach(kind => [1, 2, 3, 6].forEach(n => Teach.STEPS[kind].forEach(k => { const D = Teach.draw(kind, k, n, { seed: 3 }); if (!/^<svg/.test(D.svg) || /NaN|undefined/.test(D.svg)) clean = false; })));
t('todos los pasos con 1, 2, 3 y 6 pares: SVG sin valores perdidos', clean);
const cen = svg => (svg.match(/class="tc-cen"/g) || []).length;
t('metafase mitótica (n = 3): 6 centrómeros', cen(Teach.draw('mitosis', 'metaphase', 3).svg) === 6);
t('anafase mitótica (n = 3): 12 centrómeros', cen(Teach.draw('mitosis', 'anaphase', 3).svg) === 12);
t('metafase I (n = 3): 6 centrómeros', cen(Teach.draw('meiosis', 'metaphase1', 3).svg) === 6);
t('tétrada (n = 3): 12 centrómeros en 4 células', cen(Teach.draw('meiosis', 'tetrad', 3).svg) === 12 && (Teach.draw('meiosis', 'tetrad', 3).svg.match(/class="tc-cell"/g) || []).length === 4);
t('la misma semilla da el mismo dibujo', Teach.draw('meiosis', 'diplotene', 4, { seed: 9 }).svg === Teach.draw('meiosis', 'diplotene', 4, { seed: 9 }).svg);

sec('Docencia: ejercicio de cariotipo');
const ex = Teach.exercise(123, 5);
t('5 pares y 10 cromosomas, dos de cada par', ex.pairs.length === 5 && ex.chrs.length === 10 && [1, 2, 3, 4, 5].every(p => ex.chrs.filter(c => c.pair === p).length === 2));
t('los pares van del más largo al más corto', ex.pairs.every((p, i) => i === 0 || p.c < ex.pairs[i - 1].c));
const inClass = p => (p.type === 'm' ? p.r >= 1.1 && p.r <= 1.45 : p.type === 'sm' ? p.r >= 2 && p.r <= 2.6 : p.r >= 3.8 && p.r <= 5.5);
t('cada razón de brazos cae dentro de su clase de Levan, lejos de los límites', ex.pairs.every(inClass));
t('la clasificación de Levan da el tipo esperado', ex.pairs.every(p => Karyo.classify(p.s, p.l, 'levan') === p.type));
t('la imagen lleva los 10 cromosomas', ex.spec.chromosomes.length === 10);
let G = Teach.grade(ex, ex.chrs.map(c => ({ pair: c.pair, type: c.type })));
t('respuesta perfecta: 5/5 pares, 5/5 numerados, 10/10 tipos', G.pairsOk === 5 && G.orderOk === 5 && G.typesOk === 10);
G = Teach.grade(ex, ex.chrs.map(c => ({ pair: 6 - c.pair, type: c.type })));
t('pares bien formados pero numerados al revés', G.pairsOk === 5 && G.orderOk === 1);
const wrong = ex.chrs.map(c => ({ pair: c.pair, type: c.type }));
const i1 = ex.chrs.findIndex(c => c.pair === 1), i2 = ex.chrs.findIndex(c => c.pair === 2);
wrong[i1].pair = 2; wrong[i2].pair = 1;
G = Teach.grade(ex, wrong);
t('dos cromosomas cambiados de par: esos dos pares quedan mal', G.pairsOk === 3);
t('sin respuestas: nada correcto', Teach.grade(ex, []).pairsOk === 0 && Teach.grade(ex, []).typesOk === 0);

sec('Docencia: autoevaluación');
t('banco: cada pregunta con 4 opciones en los dos idiomas, respuesta y explicación',
  Teach.BANK.length >= 25 && Teach.BANK.every(b => b[2].length === 4 && b[4].length === 4 && b[5] >= 0 && b[5] < 4 && b[1] && b[3] && b[6] && b[7]));
const Q = Teach.quiz(42, 10);
t('un cuestionario de 10', Q.length === 10 && Q.every(q => q.opts.length === q.optsEn.length && q.ans >= 0 && q.ans < q.opts.length && q.es && q.en));
t('la misma semilla da las mismas preguntas', JSON.stringify(Teach.quiz(42, 10)) === JSON.stringify(Q));
t('filtrar por tema', Teach.quiz(5, 50, ['ban']).every(q => q.topic === 'ban') && Teach.quiz(5, 50, ['ban']).length >= 4);
let genOk = true;
for (let s = 1; s <= 30; s++) {
  const R = rng(s);
  const q0 = Teach.GEN[0](R), m0 = /de ([\d.]+) µm y uno largo de ([\d.]+) µm/.exec(q0.es);
  if (!m0 || q0.opts[q0.ans] !== fmtFixed(100 * m0[1] / (+m0[1] + +m0[2]), 1)) genOk = false;
  const q1 = Teach.GEN[1](R), r = +/r = ([\d.]+)/.exec(q1.es)[1];
  if (q1.ans !== (r <= 1.7 ? 0 : r <= 3 ? 1 : r <= 7 ? 2 : 3)) genOk = false;
  const q2 = Teach.GEN[2](R), m2 = /canal ([\d.]+) y el del estándar interno \(2C = ([\d.]+) pg\)/.exec(q2.es);
  if (!m2 || Math.abs(+q2.opts[q2.ans] - m2[1] / 200 * m2[2]) > 0.006) genOk = false;
  const q3 = Teach.GEN[3](R), m3 = /x = (\d+), una planta tiene 2n = (\d+)/.exec(q3.es);
  if ([2, 3, 4, 6][q3.ans] !== m3[2] / m3[1]) genOk = false;
  const q4 = Teach.GEN[4](R), n4 = +/n = (\d+)/.exec(q4.es)[1];
  if (+q4.opts[q4.ans] !== Math.pow(2, n4)) genOk = false;
}
t('preguntas con números: la respuesta marcada es la calculada (30 semillas × 5)', genOk);

sec('Docencia: glosario y práctica');
t('glosario: 30 o más términos con definición en los dos idiomas', Teach.GLOSSARY.length >= 30 && Teach.GLOSSARY.every(g => g[0] && g[1] && g[2] && g[3]));
t('las ilustraciones del glosario son SVG limpios', Teach.GLOSSARY.filter(g => g[4]).every(g => { const s = Teach.glossArt(g[4]); return /^<svg/.test(s) && !/NaN|undefined/.test(s); }));
const steps = Teach.protocolSteps({ pre: 'col', hyd: 'hcl5', stain: 'feu' });
t('práctica: 8 pasos, cada uno con su fuente', steps.length === 8 && steps.every(s => s[2] && s[3] && s[4]));
t('las opciones elegidas entran a la hoja', /Colchicina/.test(steps[1][2]) && /5 N/.test(steps[4][2]) && /Schiff/.test(steps[5][2]));
}
