{
/* CytogeneticsPro — tests of stats.js. Reference values: closed forms, or the
   values R 4.4 prints for the same call (written next to each test). */
sec('Estadística: medidas descriptivas');
near('media', Stats.mean([2, 4, 4, 4, 5, 5, 7, 9]), 5);
near('desviación poblacional (n)', Stats.sd([2, 4, 4, 4, 5, 5, 7, 9], true), 2);
near('desviación muestral (n − 1)', Stats.sd([2, 4, 4, 4, 5, 5, 7, 9]), 2.138089935299395, 1e-12);
near('CV muestral', Stats.cv([2, 4, 4, 4, 5, 5, 7, 9]), 2.138089935299395 / 5, 1e-12);
near('mediana par', Stats.median([5, 1, 3, 2]), 2.5);
near('mediana impar', Stats.median([5, 1, 3]), 3);
t('moda única', Stats.modes([20, 20, 19, 20, 21]).modes.join() === '20');
t('dos modas', Stats.modes([20, 20, 21, 21, 19]).modes.join() === '20,21');
t('sd con un dato es NaN (n − 1)', Number.isNaN(Stats.sd([3])));

sec('Estadística: gamma, χ², normal y beta');
near('lnΓ(5) = ln 24', Stats.lgamma(5), Math.log(24), 1e-13);
near('lnΓ(1/2) = ln √π', Stats.lgamma(0.5), 0.5 * Math.log(Math.PI), 1e-13);
near('lnΓ(100.5) (R lgamma)', Stats.lgamma(100.5), 361.4355404677776, 1e-10);
near('P(1, 2) = 1 − e⁻²', Stats.gammaP(1, 2), 1 - Math.exp(-2), 1e-14);
near('P(3, 10) (rama de fracción continua)', Stats.gammaP(3, 10), 1 - Math.exp(-10) * (1 + 10 + 50), 1e-14);
near('χ² 3.841459 con 1 g.l. → p = 0.05', Stats.chi2sf(3.841458820694124, 1), 0.05, 1e-12);
near('χ² 5.991465 con 2 g.l. → p = 0.05', Stats.chi2sf(5.991464547107979, 2), 0.05, 1e-12);
near('χ² 11.0705 con 5 g.l. → p = 0.05 (R qchisq)', Stats.chi2sf(11.07049769351635, 5), 0.05, 1e-12);
near('χ² 23.20925 con 10 g.l. → p = 0.01 (R qchisq)', Stats.chi2sf(23.20925115895436, 10), 0.01, 1e-12);
near('P(χ²₁ ≤ 1) = P(|Z| ≤ 1)', Stats.chi2cdf(1, 1), 0.6826894921370859, 1e-13);
near('χ² con 2 g.l. es exponencial', Stats.chi2sf(7, 2), Math.exp(-3.5), 1e-14);
near('cuantil χ² 0.95 con 3 g.l. (R qchisq)', Stats.qchi2(0.95, 3), 7.814727903251178, 1e-9);
near('Φ(1.959964) = 0.975', Stats.pnorm(1.959963984540054), 0.975, 1e-14);
near('Φ(0) = 0.5', Stats.pnorm(0), 0.5, 1e-15);
near('Φ(−3) (R pnorm)', Stats.pnorm(-3), 0.001349898031630094, 1e-16);
near('Φ(−8) (cola lejana, R pnorm)', Stats.pnorm(-8), 6.220960574271785e-16, 1e-25);
near('Φ⁻¹(0.975)', Stats.qnorm(0.975), 1.959963984540054, 1e-12);
near('Φ⁻¹(0.05) (R qnorm)', Stats.qnorm(0.05), -1.644853626951472, 1e-12);
near('Φ⁻¹(1e−10) (R qnorm)', Stats.qnorm(1e-10), -6.361340902404056, 1e-9);
near('I₀.₅(2, 3) = 11/16', Stats.ibeta(0.5, 2, 3), 0.6875, 1e-14);
near('I₀.₉(5, 1) = 0.9⁵', Stats.ibeta(0.9, 5, 1), Math.pow(0.9, 5), 1e-14);
near('cuantil beta inverso de I', Stats.qbeta(0.6875, 2, 3), 0.5, 1e-12);

sec('Estadística: intervalos para una proporción');
let ci = Stats.clopperPearson(7, 20);
near('Clopper–Pearson 7/20, inferior (R binom.test)', ci.lo, 0.1539092047845414, 1e-10);
near('Clopper–Pearson 7/20, superior (R binom.test)', ci.hi, 0.5921885345328284, 1e-10);
ci = Stats.clopperPearson(0, 25);
near('Clopper–Pearson 0/25: inferior 0', ci.lo, 0);
near('Clopper–Pearson 0/25: superior 1 − 0.025^(1/25)', ci.hi, 1 - Math.pow(0.025, 1 / 25), 1e-12);
ci = Stats.wilson(7, 20);
near('Wilson 7/20, inferior (R prop.test sin corrección)', ci.lo, 0.1811918241010821, 1e-10);
near('Wilson 7/20, superior (R prop.test sin corrección)', ci.hi, 0.5671457233147638, 1e-10);
ci = Stats.wilson(180, 200, 0.99);
near('Wilson 180/200 al 99 %, inferior (R prop.test)', ci.lo, 0.8318860850639248, 1e-10);
near('Wilson 180/200 al 99 %, superior (R prop.test)', ci.hi, 0.9424264953950009, 1e-10);

sec('Estadística: homogeneidad y proporciones');
let ct = Stats.contingency([[10, 20], [30, 40]]);
near('χ² de Pearson 2 × 2 (R chisq.test correct = FALSE)', ct.chi2, 0.7936507936507936, 1e-12);
near('su p (R)', ct.p, 0.3729984836134872, 1e-12);
near('G de razón de verosimilitud (R: 2·Σ o·ln(o/e))', ct.G, 0.8043486460964835, 1e-12);
t('g.l. = 1', ct.df === 1);
ct = Stats.contingency([[50, 0], [45, 5], [40, 10]]);
near('χ² 3 × 2 con un cero (R chisq.test)', ct.chi2, 11.11111111111111, 1e-10);
near('su p (R)', ct.p, 0.003865920139472808, 1e-12);
t('g.l. = 2', ct.df === 2);
t('una fila vacía no cuenta', Stats.contingency([[5, 5], [0, 0], [6, 4]]).df === 1);
const tp = Stats.twoProportions(10, 30, 30, 70);
near('z² de dos proporciones = χ² 2 × 2', tp.z * tp.z, 0.7936507936507936, 1e-12);
near('p de dos colas = p del χ²', tp.p, 0.3729984, 1e-6);
const gf = Stats.goodnessOfFit([18, 55, 27], [25, 50, 25], 0);
near('bondad de ajuste χ² (R chisq.test)', gf.chi2, 2.62, 1e-12);
t('bondad de ajuste: g.l. = 2', gf.df === 2);
t('un parámetro estimado resta un g.l.', Stats.goodnessOfFit([18, 55, 27], [25, 50, 25], 1).df === 1);
t('Holm', Stats.holm([0.01, 0.04, 0.03]).map(v => +v.toFixed(10)).join() === '0.03,0.06,0.06');
t('Bonferroni con tope 1', Stats.bonferroni([0.2, 0.5]).join() === '0.4,1');
}
