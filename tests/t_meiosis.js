{
/* CytogeneticsPro — tests of meiosis.js: chiasmata counted from the
   configurations, the recombination index, the expectation model checked
   against closed forms worked by hand (a pair, three and four homologues),
   conservation of chromosomes and chiasmata, the meiotic index and pollen. */
sec('Meiosis: una célula');
let c = Meiosis.cell({ IIring: 5, IIrod: 2 });
t('7 II: 14 cromosomas', c.chr === 14);
t('quiasmas: anillo 2, varilla 1 → 12', c.xta === 12 && c.xtaEstimated);
t('quiasmas contados a mano mandan', Meiosis.cell({ IIring: 5, IIrod: 2, xta: 13 }).xta === 13);
c = Meiosis.cell({ I: 2, IIring: 10, IIrod: 1, III: 1, IVchain: 1, IVring: 2 });
t('cromosomas de todas las configuraciones', c.chr === 2 + 22 + 3 + 4 + 8);
t('quiasmas: III 2, IV cadena 3, IV anillo 4', c.xta === 20 + 1 + 2 + 3 + 8);
t('multivalentes', c.mult === 4);
let S = Meiosis.summarize([{ IIring: 7 }, { IIring: 6, IIrod: 1 }, { IIring: 5, IIrod: 1, I: 2 }]);
near('quiasmas medios por célula', S.xta.mean, (14 + 13 + 11) / 3, 1e-12);
near('índice de recombinación = n + quiasmas', S.RI, 7 + (14 + 13 + 11) / 3, 1e-12);
near('quiasmas por bivalente', S.xtaPerBiv, (14 + 13 + 11) / (7 + 7 + 6), 1e-12);
near('células con univalentes', S.withUniv, 1 / 3, 1e-12);
t('número 2n modal', S.chr === 14);

sec('Meiosis: el modelo esperado, a mano');
t('formas de aparear extremos: 1, 3, 3, 15, 15, 105, 105', [2, 3, 4, 5, 6, 7, 8].map(m => Meiosis.matchings(m).length).join() === '1,3,3,15,15,105,105');
const p = (d, k) => d.get(k) || 0;
[0.3, 0.75, 1].forEach(cc => {
  const d2 = Meiosis.group(2, cc);
  near(`un par (c = ${cc}): II anillo = c²`, p(d2, 'r2:1'), cc * cc, 1e-14);
  near(`un par (c = ${cc}): II varilla = 2c(1 − c)`, p(d2, 'c2:1'), 2 * cc * (1 - cc), 1e-14);
  near(`un par (c = ${cc}): 2 I = (1 − c)²`, p(d2, 'c1:2'), (1 - cc) * (1 - cc), 1e-14);
  const d3 = Meiosis.group(3, cc);
  near(`triploide (c = ${cc}): III = ⅔ c²`, p(d3, 'c3:1'), 2 / 3 * cc * cc, 1e-14);
  near(`triploide (c = ${cc}): II anillo + I = ⅓ c²`, p(d3, 'c1:1|r2:1'), cc * cc / 3, 1e-14);
  const d4 = Meiosis.group(4, cc), q = 1 - cc;
  near(`autotetraploide (c = ${cc}): IV anillo = ⅔ c⁴`, p(d4, 'r4:1'), 2 / 3 * Math.pow(cc, 4), 1e-14);
  near(`autotetraploide (c = ${cc}): IV cadena = ⅔ · 4c³(1 − c)`, p(d4, 'c4:1'), 2 / 3 * 4 * Math.pow(cc, 3) * q, 1e-14);
  near(`autotetraploide (c = ${cc}): III + I = ⅔ · 4c²(1 − c)²`, p(d4, 'c1:1|c3:1'), 2 / 3 * 4 * cc * cc * q * q, 1e-14);
  near(`autotetraploide (c = ${cc}): 2 II anillo = ⅓ c⁴`, p(d4, 'r2:2'), Math.pow(cc, 4) / 3, 1e-14);
  near(`autotetraploide (c = ${cc}): 2 II varilla = ⅔·2c²(1−c)² + ⅓·4c²(1−c)²`, p(d4, 'c2:2'), 2 / 3 * 2 * cc * cc * q * q + 1 / 3 * 4 * cc * cc * q * q, 1e-14);
  let tot = 0; d4.forEach(v => { tot += v; });
  near(`autotetraploide (c = ${cc}): las probabilidades suman 1`, tot, 1, 1e-14);
});
['AA', 'AAA', 'AAAA', 'AABB', 'AAAABB', 'AAAAAA', 'AABBCC', 'AAAAAAAA'].forEach(f => {
  const x = 7, cc = 0.83, E = Meiosis.expected(f, x, cc);
  let chr = 0, xta = 0;
  Object.keys(E.perCell).forEach(k => { chr += E.perCell[k] * Meiosis.keyInfo(k).size; xta += E.perCell[k] * Meiosis.xtaOf(k); });
  near(`${f}: se conservan los ${f.length * x} cromosomas`, chr, f.length * x, 1e-9);
  near(`${f}: quiasmas de las configuraciones = brazos apareados × c`, xta, E.xtaPerCell, 1e-9);
  near(`${f}: c se recupera de los quiasmas esperados`, Meiosis.estimateC(E.xtaPerCell, f, x), cc, 1e-12);
});
t('alotetraploide AABB: sin multivalentes', Object.keys(Meiosis.expected('AABB', 7, 0.9).perCell).every(k => Meiosis.keyInfo(k).size <= 2));
t('autotetraploide: a lo más ⅔ de multivalentes con c = 1', Math.abs(Meiosis.expected('AAAA', 1, 1).multivalentShare - 2 / 3) < 1e-12);
t('fórmulas: 4x auto = AAAA, 6x alo = AABBCC, 3x alo = AAB', Meiosis.formulaFor(4, 'auto') === 'AAAA' && Meiosis.formulaFor(6, 'allo') === 'AABBCC' && Meiosis.formulaFor(3, 'allo') === 'AAB');
t('fórmula AAAABB → grupos 4 y 2', Meiosis.parseFormula('AAAABB').join() === '4,2');

sec('Meiosis: observado contra esperado');
/* cells built to match the expectation closely: the test must not reject */
const E4 = Meiosis.expected('AAAA', 7, 0.8);
const recs = [];
const R = rng(5);
for (let i = 0; i < 300; i++) {
  const s = Meiosis.simulateCell('AAAA', 7, 0.8, R);
  recs.push({ I: s.c1 || 0, IIrod: s.c2 || 0, IIring: s.r2 || 0, III: s.c3 || 0, IVchain: s.c4 || 0, IVring: s.r4 || 0 });
}
let cmp = Meiosis.compare(recs, 'AAAA', 7, 0.8);
t('300 células simuladas como autotetraploide: no se rechaza AAAA (p > 0.001)', cmp.test.p > 0.001, cmp.test.p);
const cmpAllo = Meiosis.compare(recs, 'AABB', 7, 0.8);
t('las mismas células rechazan AABB (p < 0.001)', cmpAllo.test.p < 0.001, cmpAllo.test.p);
t('las clases se juntan hasta tener 5 esperados', cmp.pooled.every(g => g.e >= 5) || cmp.pooled.length === 2);
const xm = Stats.mean(recs.map(r => Meiosis.cell(r).xta));
near('c estimada de las células simuladas cerca de 0.8', Meiosis.estimateC(xm, 'AAAA', 7), 0.8, 0.02);
near('quiasmas simulados cerca de lo esperado', xm, E4.xtaPerCell, 0.5);

sec('Meiosis: índice meiótico y polen');
near('índice meiótico de Love: 95 de 100', Meiosis.meioticIndex(95, 100).MI, 95);
const pol = Meiosis.pollen([{ id: 'a', viable: 180, inviable: 20 }, { id: 'b', viable: 170, inviable: 30 }, { id: 'c', viable: 0, inviable: 0 }]);
t('una fila vacía no cuenta', pol.rows.length === 2);
near('viabilidad conjunta', pol.p, 350 / 400, 1e-12);
near('Clopper–Pearson del individuo a (R binom.test 180/200)', pol.rows[0].cp.lo, 0.8497872121322442, 1e-10);
near('Clopper–Pearson del individuo a, superior (R)', pol.rows[0].cp.hi, 0.9378406337459340, 1e-10);
near('homogeneidad χ² entre dos individuos', pol.test.chi2, Stats.contingency([[180, 20], [170, 30]]).chi2, 1e-12);
const ab = Meiosis.abnormalities([{ phase: 'AI', normal: 90, bridges: 6, laggards: 4 }, { phase: 'TII', normal: 50 }]);
near('anafase I: 10 % anormales', ab.find(r => r.phase === 'AI').pct, 10, 1e-12);
t('fase sin anormalidades: 0 %', ab.find(r => r.phase === 'TII').pct === 0);
}
