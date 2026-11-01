{
/* CytogeneticsPro — tests of asymmetry.js.
   Published examples: Peruzzi and Eroğlu (2013, Comparative Cytogenetics 7: 1–9),
   Table 1 (eleven artificial chromosomes with their published means) and
   Table 2 (fifteen artificial karyotypes, measurements published; the index
   values were recomputed independently in R, validation/ has the script);
   ideal karyotypes B and E of Zuo and Yuan (2011) as tabulated by
   Medeiros-Neto et al. (2017). */
sec('Asimetría: Peruzzi y Eroğlu (2013), tabla 1');
const S1 = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], L1 = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
let A = Asym.compute(S1.map((s, i) => ({ s, l: L1[i] })));
near('media de (L − S)/(L + S) = 0.50 (publicada)', A.A, 0.5, 1e-12);
near('MCA = 50', A.MCA, 50, 1e-10);
near('TF% = 25 (media de S/(L + S) publicada: 0.25)', A.TF, 25, 1e-10);
near('A1 = 1 − media de S/L; publicada 0.60', A.A1, 0.60, 0.005);
near('A1 exacta (R)', A.A1, 0.6022338124083130, 1e-12);
near('Syi = 33.33 (5/15)', A.Syi, 100 / 3, 1e-10);
near('AsK% = 75', A.AsK, 75, 1e-10);
near('CVCL = 0: todos miden 20 µm', A.CVCL, 0, 1e-12);
near('CVCI con n − 1 (R)', A.CVCI, 66.33249580710800, 1e-9);
A = Asym.compute(S1.map((s, i) => ({ s, l: L1[i] })), { pop: true });
near('CVCI con n (R)', A.CVCI, 63.24555320336759, 1e-9);

sec('Asimetría: Peruzzi y Eroğlu (2013), tabla 2');
/* each karyotype: [L, S, how many] */
const KT = {
  I: [[5, 5, 12]], II: [[5.5, 4.5, 12]], III: [[7.5, 2.5, 12]], IV: [[8.5, 1.5, 12]], V: [[9.5, 0.5, 12]], VI: [[10, 0, 12]],
  VII: [[5, 5, 6], [5.5, 4.5, 6]], VIII: [[5.5, 4.5, 6], [7.5, 2.5, 6]], IX: [[7.5, 2.5, 6], [8.5, 1.5, 6]], X: [[8.5, 1.5, 6], [9.5, 0.5, 6]],
  XI: [[9.5, 0.5, 6], [10, 0, 6]], XII: [[5, 5, 4], [5.5, 4.5, 4], [7.5, 2.5, 4]], XIII: [[5.5, 4.5, 4], [7.5, 2.5, 4], [8.5, 1.5, 4]],
  XIV: [[7.5, 2.5, 4], [8.5, 1.5, 4], [9.5, 0.5, 4]], XV: [[8.5, 1.5, 4], [9.5, 0.5, 4], [10, 0, 4]],
};
/* MCA, CVCI (n − 1), TF%, Syi computed with an independent script in R:
   validation/asimetria/peruzzi_eroglu_2013.R → .txt */
const KREF = {
  I: [0, 0, 50, 100], II: [10, 0, 45, 81.81818181818181], III: [50, 0, 25, 33.33333333333333], IV: [70, 0, 15, 17.64705882352941],
  V: [90, 0, 5, 5.263157894736842], VI: [100, NaN, 0, 0], VII: [5, 5.497189135443088, 47.5, 90.47619047619048],
  VIII: [30, 29.84188387811963, 35, 53.84615384615385], IX: [60, 26.11164839335468, 20, 25], X: [80, 52.22329678670935, 10, 11.11111111111111],
  XI: [95, 104.4465935734187, 2.5, 2.564102564102564], XII: [20, 28.20380374088831, 40, 66.66666666666667],
  XIII: [43.33333333333334, 45.97686686674798, 28.33333333333333, 39.53488372093024], XIV: [70, 56.85352436149612, 15, 17.64705882352941],
  XV: [86.66666666666667, 97.70084209183943, 6.666666666666667, 7.142857142857143],
};
const karyo = spec => { const c = []; spec.forEach(([l, s, n]) => { for (let i = 0; i < n; i++) c.push({ s, l }); }); return Asym.compute(c); };
Object.keys(KT).forEach(k => {
  const a = karyo(KT[k]), r = KREF[k];
  near(`${k}: MCA`, a.MCA, r[0], 1e-9);
  near(`${k}: CVCI`, a.CVCI, r[1], 1e-9);
  near(`${k}: TF%`, a.TF, r[2], 1e-9);
  near(`${k}: Syi`, a.Syi, r[3], 1e-9);
  near(`${k}: CVCL = 0`, a.CVCL, 0, 1e-12);
});
t('III y XIII: MCA casi igual, CVCI distinto (lo que el artículo señala)', Math.abs(karyo(KT.III).MCA - karyo(KT.XIII).MCA) < 7 && karyo(KT.XIII).CVCI > 40 && karyo(KT.III).CVCI === 0);
t('VI todo telocéntrico: CVCI indefinido (0/0), no cero', Number.isNaN(karyo(KT.VI).CVCI));

sec('Asimetría: cariotipos ideales de Zuo y Yuan (2011)');
A = Asym.compute(Array.from({ length: 10 }, () => ({ s: 4.55, l: 5.45 })));
near('B: Syi = 83.49', A.Syi, 83.49, 0.005);
near('B: A = 0.09', A.A, 0.09, 0.0005);
A = Asym.compute(Array.from({ length: 10 }, () => ({ s: 0.5, l: 9.5 })));
near('E: Syi = 5.26', A.Syi, 5.26, 0.005);
near('E: A = 0.90', A.A, 0.90, 1e-12);
near('E: TF = 0.05 (como proporción)', A.TF / 100, 0.05, 1e-12);
near('E: A1 = 0.95 (publicada con dos decimales)', A.A1, 0.95, 0.005);

sec('Asimetría: identidades entre índices');
const R = rng(42);
for (let k = 0; k < 4; k++) {
  const chrs = Array.from({ length: 6 + k * 3 }, () => { const c = 2 + R() * 8, ci = 0.05 + R() * 0.45; return { s: c * ci, l: c * (1 - ci) }; });
  A = Asym.compute(chrs);
  near(`cariotipo al azar ${k + 1}: AsK% = 100 − TF%`, A.AsK, 100 - A.TF, 1e-10);
  near(`cariotipo al azar ${k + 1}: Syi = 100·TF/(100 − TF)`, A.Syi, 100 * A.TF / (100 - A.TF), 1e-9);
  near(`cariotipo al azar ${k + 1}: CVCL = 100·A2`, A.CVCL, 100 * A.A2, 1e-10);
  near(`cariotipo al azar ${k + 1}: MCA = 100·A`, A.MCA, 100 * A.A, 1e-10);
  near(`cariotipo al azar ${k + 1}: AI = CVCL·CVCI/100`, A.AI, A.CVCL * A.CVCI / 100, 1e-10);
  near(`cariotipo al azar ${k + 1}: Rec ≤ 100`, Math.min(A.Rec, 100), A.Rec, 0);
}
A = Asym.compute([{ s: 2, l: 3 }, { s: 1, l: 4 }, { s: 1.5, l: 1.5 }, { s: 0.5, l: 2 }]);
near('Rec a mano: 100·(5/5 + 5/5 + 3/5 + 2.5/5)/4', A.Rec, 100 * (1 + 1 + 0.6 + 0.5) / 4, 1e-10);
near('A1 a mano: 1 − (2/3 + 1/4 + 1 + 1/4)/4', A.A1, 1 - (2 / 3 + 0.25 + 1 + 0.25) / 4, 1e-12);
near('CG con medianas: 100·mediana(s)/mediana(c)', A.CG, 100 * 1.25 / 4, 1e-12);
near('DI = CG·CVCL/100', A.DI, A.CG * A.CVCL / 100, 1e-12);
A = Asym.compute([{ s: 3, l: 2 }]);
near('brazos al revés se ordenan: TF% con s = 2', A.TF, 40, 1e-12);

sec('Asimetría: categorías de Stebbins (1971) en los límites');
const st = chrs => Asym.stebbins(chrs.map(([s, l]) => ({ s, l, c: s + l }))).cls;
t('todos r < 2 y mayor/menor < 2 → 1A', st([[2, 3], [2, 2.5], [1.5, 2]]) === '1A');
t('ninguno con r < 2 → columna 4', st([[1, 3], [1, 2.5]]).startsWith('4'));
t('la mitad con r < 2 → columna 3 (0.50 está en 0.50–0.01)', st([[2, 3], [1, 3]]).startsWith('3'));
t('más de la mitad (2 de 3) → columna 2', st([[2, 3], [2, 2.5], [1, 3]]).startsWith('2'));
t('r = 2 exacto no es «menor que 2»', st([[1, 2], [1.5, 1.5]]).startsWith('3'));
t('mayor/menor = 2 exacto → B', st([[2, 2], [1, 1]]).endsWith('B'));
t('mayor/menor = 1.99 → A', st([[1.99, 1.99], [1, 1]]).endsWith('A'));
t('mayor/menor = 4 exacto → B', st([[4, 4], [1, 1]]).endsWith('B'));
t('mayor/menor = 4.01 → C', st([[4.01, 4.01], [1, 1]]).endsWith('C'));
}
