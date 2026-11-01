{
/* CytogeneticsPro — tests of ploidy.js (counts, ploidy level, genome size,
   the histogram of the cytometer, the Allium test), of the Gower dissimilarity
   and of the rejection of hypotheses that forbid an observed configuration. */
sec('Ploidía: conteos y nivel');
let C = Ploidy.counts([{ n2: 28 }, { n2: 28 }, { n2: 27 }, { n2: 28 }, { n2: 29 }, { n2: '' }]);
t('cinco células válidas', C.n === 5);
t('moda 28', C.mode === 28 && C.off === 2);
near('proporción modal', C.modal, 0.6, 1e-12);
t('dos modas no dan número', Ploidy.counts([{ n2: 20 }, { n2: 19 }]).mode === null);
let L = Ploidy.level(28, 7);
t('28 con x = 7: 4x, euploide', L.level === 4 && L.euploid && L.formula === '2n = 4x = 28' && L.name[0] === 'tetraploide');
L = Ploidy.level(21, 10);
t('21 con x = 10: 2x + 1, trisómico', L.text === '2x + 1' && !L.euploid && L.aneu && /trisómico/.test(L.aneu[0]));
L = Ploidy.level(19, 10);
t('19 con x = 10: monosómico', L.text === '2x − 1' && /monosómico/.test(L.aneu[0]));
t('42 con x = 7: hexaploide', Ploidy.level(42, 7).name[0] === 'hexaploide');
t('serie euploide de x = 7', Ploidy.series(7, 6).map(s => s.n2).join() === '14,21,28,35,42');
t('disploidía: x = 12, 13, 14 en pasos de uno', Ploidy.dysploidy([14, 12, 13, 14]).consecutive === true);
t('un solo x no es serie', Ploidy.dysploidy([7, 7]) === null);

sec('Tamaño del genoma');
near('1 pg = 978 Mpb', Ploidy.pgToMbp(1), 978, 1e-12);
near('Mpb a pg', Ploidy.mbpToPg(2445), 2.5, 1e-12);
near('conversión pg → Gpb', Ploidy.convert(2, 'pg', 'Gbp'), 1.956, 1e-12);
near('conversión pb → pg', Ploidy.convert(978e6, 'bp', 'pg'), 1, 1e-12);
near('ida y vuelta Mpb ↔ Gpb', Ploidy.convert(Ploidy.convert(1234, 'Mbp', 'Gbp'), 'Gbp', 'Mbp'), 1234, 1e-9);
let G = Ploidy.genome({ stdC2: 1.96, stdPeak: 200, samplePeak: 324.49, cvStd: 2.5, cvSample: 3 }, 4);
near('2C = razón × 2C del patrón', G.c2, 324.49 / 200 * 1.96, 1e-12);
near('1C = 2C / 2', G.c1, G.c2 / 2, 1e-12);
near('1Cx = 2C / nivel', G.c1x, G.c2 / 4, 1e-12);
near('2C en Mpb', G.mbp2, G.c2 * 978, 1e-9);
t('sin avisos con CV bajos', G.flags.length === 0);
t('aviso por CV alto', Ploidy.genome({ stdC2: 1.96, stdPeak: 200, samplePeak: 330, cvStd: 6, cvSample: 3 }).flags.includes('cv'));
t('aviso por picos encimados', Ploidy.genome({ stdC2: 1.96, stdPeak: 200, samplePeak: 210, cvStd: 2, cvSample: 2 }).flags.includes('overlap'));
t('estándares de referencia: 8, del rábano a la cebolla', Ploidy.STANDARDS.length === 8 && Ploidy.STANDARDS[0].c2 === 1.11 && Ploidy.STANDARDS[7].c2 === 34.89);

sec('Histograma del citómetro');
/* two exact Gaussian peaks plus a decaying ground */
const x = [], y = [];
for (let i = 0; i < 1024; i++) {
  x.push(i);
  y.push(Math.round(800 * Math.exp(-i / 40) + 2000 / (6 * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * ((i - 200) / 6) ** 2) * 1 + 3000 / (10 * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * ((i - 400) / 10) ** 2)));
}
const H = { x, y };
const pk = Ploidy.peaks(H);
t('dos picos, sin tomar la caída de los restos', pk.length === 2 && Math.abs(pk[0].x - 200) <= 1 && Math.abs(pk[1].x - 400) <= 1, JSON.stringify(pk.map(p => p.x)));
const g1 = Ploidy.gate(H, 180, 220), g2 = Ploidy.gate(H, 370, 430);
near('media de la compuerta del primer pico', g1.mean, 200, 0.5);
const clean = { x, y: x.map(i => 1e5 / (6 * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * ((i - 200) / 6) ** 2)) };
near('CV de un pico limpio = 6/200 = 3 %', Ploidy.gate(clean, 170, 230).cv, 3, 0.01);
t('el fondo de restos dentro de la compuerta sube el CV', g1.cv > 3.2);
near('razón de los picos = 2', g2.mean / g1.mean, 2, 0.01);
t('compuerta vacía', Ploidy.gate(H, 2000, 3000) === null);
const gs = Ploidy.autoGates(H, pk);
t('compuertas automáticas alrededor de cada pico', gs.length === 2 && gs[0].a < 200 && gs[0].b > 200 && gs[1].a < 400 && gs[1].b > 400);
let rh = Ploidy.readHistogram('canal,núcleos\n0,5\n1,7\n2,9');
t('CSV de dos columnas con encabezado', rh.x.join() === '0,1,2' && rh.y.join() === '5,7,9' && rh.events === 21);
rh = Ploidy.readHistogram('10\n10.4\n11\n250\n251', { bins: 100, max: 500 });
t('CSV de eventos: se agrupan en canales', rh.events === 5 && rh.y.reduce((a, b) => a + b, 0) === 5 && rh.y[2] === 3);

sec('Prueba de Allium');
const rows = [
  { trt: 'T', rep: 1, inter: 900, pro: 40, meta: 25, ana: 15, telo: 20, cmeta: 1, mn: 1 },
  { trt: 'T', rep: 2, inter: 910, pro: 40, meta: 20, ana: 10, telo: 20, mn: 0 },
  { trt: 'X', rep: 1, inter: 950, pro: 20, meta: 15, ana: 5, telo: 10, sticky: 4, bridges: 2, mn: 6 },
  { trt: 'X', rep: 2, inter: 960, pro: 20, meta: 10, ana: 5, telo: 5, laggards: 3, mn: 5 },
];
const m1 = Ploidy.mitosisRow(rows[0]);
near('índice mitótico de una repetición: 100/1000', m1.MI, 10, 1e-12);
near('aberraciones entre las que se dividen: 1/100', m1.AI, 1, 1e-12);
near('micronúcleos por mil células en interfase', m1.MN, 1000 / 900, 1e-12);
near('fase: metafase 25 de 100', m1.ph.meta, 25, 1e-12);
const A = Ploidy.allium(rows, 'T');
const T0 = A.res.find(r => r.trt === 'T'), X = A.res.find(r => r.trt === 'X');
near('índice mitótico del testigo con conteos sumados: 190/2000', T0.MI, 9.5, 1e-12);
near('índice mitótico del tratamiento: 90/2000', X.MI, 4.5, 1e-12);
near('media de las repeticiones del testigo', T0.MIr.mean, (10 + 9) / 2, 1e-12);
near('aberraciones del tratamiento: 9/90', X.AI, 10, 1e-12);
const tz = A.tests.MI[0];
near('contra el testigo: z de dos proporciones', tz.z, Stats.twoProportions(90, 2000, 190, 2000).z, 1e-12);
t('el índice mitótico baja de forma significativa', tz.pHolm < 0.001);
t('una sola comparación: Holm no cambia p', Math.abs(A.tests.AI[0].pHolm - A.tests.AI[0].p) < 1e-15);
t('χ² entre todos los tratamientos con 1 g. l.', A.overall.df === 1);

sec('Disimilitud de Gower');
const D = Stats.gower([[0, 10], [5, 20], [10, 10]]);
near('d(1,2) = (5/10 + 10/10)/2', D[0][1], 0.75, 1e-12);
near('d(1,3) = (10/10 + 0)/2', D[0][2], 0.5, 1e-12);
t('simétrica y con ceros en la diagonal', D[1][0] === D[0][1] && D[2][2] === 0);
near('una variable sin variación no cuenta', Stats.gower([[1, 5], [3, 5]])[0][1], 1, 1e-12);
t('datos faltantes: sólo las variables comunes', Math.abs(Stats.gower([[0, NaN], [4, 2], [2, 4]])[0][1] - 1) < 1e-12);

sec('Meiosis: una hipótesis que no permite lo observado');
const recs = [{ IIring: 6, IIrod: 1, IVchain: 0 }, { IIring: 4, IIrod: 1, IVring: 1 }];
const cmp = Meiosis.compare(recs, 'AABB', 4, 0.9);
t('un cuadrivalente rechaza al alotetraploide estricto', cmp.impossible === 1 && cmp.test.p === 0);
t('sin configuraciones imposibles no hay rechazo automático', !Meiosis.compare([{ IIring: 8 }], 'AABB', 4, 0.95).impossible);
}
