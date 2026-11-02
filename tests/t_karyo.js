{
/* CytogeneticsPro — tests of karyotype.js: the classification of Levan et al.
   (1964) and Guerra (1986) at their limits, the normalization of the arms,
   the grouping of homologs, the means over cells, the formula and the
   fundamental number. */
sec('Cariotipo: clasificación de Levan et al. (1964) en los límites');
const C = (s, l, sc, o) => Karyo.classify(s, l, sc || 'levan', o);
t('r = 1.00 → m', C(1, 1) === 'm');
t('r = 1.00 estricto → M', C(1, 1, 'levan', { strict: true }) === 'M');
t('r = 1.70 → m (el límite va a la clase más mediana)', C(1, 1.7) === 'm');
t('r = 1.7001 → sm', C(1, 1.7001) === 'sm');
t('r = 3.00 → sm', C(1, 3) === 'sm');
t('r = 3.0001 → st', C(1, 3.0001) === 'st');
t('r = 7.00 → st', C(1, 7) === 'st');
t('r = 7.0001 → t', C(1, 7.0001) === 't');
t('brazo corto 0 → t', C(0, 5) === 't');
t('brazo corto 0 estricto → T', C(0, 5, 'levan', { strict: true }) === 'T');
t('brazos al revés: se intercambian', C(3, 1) === 'sm');
t('longitud 0 → sin clase', C(0, 0) === null);
t('r calculado en decimales: 1.2/2.04 = 1.7 → m', C(1.2, 2.04) === 'm');
sec('Cariotipo: Levan por índice centromérico');
t('IC = 37.5 → m', C(37.5, 62.5, 'levanci') === 'm');
t('IC = 37.4 → sm', C(37.4, 62.6, 'levanci') === 'sm');
t('IC = 25 → sm', C(25, 75, 'levanci') === 'sm');
t('IC = 24.9 → st', C(24.9, 75.1, 'levanci') === 'st');
t('IC = 12.5 → st', C(12.5, 87.5, 'levanci') === 'st');
t('IC = 12.4 → t', C(12.4, 87.6, 'levanci') === 't');
t('r = 1.7 es sm por IC (IC = 37.04)', C(1, 1.7, 'levanci') === 'sm');
sec('Cariotipo: Guerra (1986), el límite a la clase superior');
t('r = 1.49 → m', C(1, 1.49, 'guerra') === 'm');
t('r = 1.50 → sm', C(1, 1.5, 'guerra') === 'sm');
t('r = 2.99 → sm', C(1, 2.99, 'guerra') === 'sm');
t('r = 3.00 → a', C(1, 3, 'guerra') === 'a');
t('esquema propio', Karyo.classify(1, 2.5, { by: 'r', limits: [2], labels: ['A', 'B'] }) === 'B');

sec('Cariotipo: brazos, satélites, IC y r');
let nz = Karyo.normalize({ p: 5, q: 3 });
t('p > q se intercambian', nz.s === 3 && nz.l === 5 && nz.swapped);
near('IC = 100 s / (s + l)', nz.ci, 37.5);
near('r = l / s', nz.r, 5 / 3);
nz = Karyo.normalize({ p: 1, q: 3, sat: 0.5, satArm: 'p' });
near('satélite sumado al brazo corto', nz.s, 1.5);
t('satélite en el brazo corto', nz.satArm === 's');
nz = Karyo.normalize({ p: 1, q: 3, sat: 0.5, satArm: 'p' }, { includeSat: false });
near('satélite fuera de la longitud', nz.s, 1);
nz = Karyo.normalize({ p: 2, q: 1.8, sat: 0.5, satArm: 'p' });
t('con el satélite el brazo «p» pasa a ser el largo', nz.l === 2.5 && nz.s === 1.8 && nz.satArm === 'l');
t('r infinito sin brazo corto', Karyo.armRatio(0, 3) === Infinity);
t('2n = 21 con x = 10 → 2x + 1', Karyo.ploidyText(21, 10) === '2x + 1');
t('2n = 19 con x = 10 → 2x − 1', Karyo.ploidyText(19, 10) === '2x − 1');
t('2n = 40 con x = 10 → 4x', Karyo.ploidyText(40, 10) === '4x');

sec('Cariotipo: emparejamiento de homólogos');
const mkc = (arr) => arr.map((a, i) => Karyo.normalize({ id: i, p: a[0], q: a[1], sat: a[2] || 0 }));
let ch = mkc([[2, 3], [1, 4.2], [2.05, 3.1], [3, 3.2], [1.05, 4], [3.1, 3.3]]);
let gr = Karyo.groupCell(ch);
t('tres pares de distinta longitud', gr.length === 3 && gr.every(g => g.length === 2));
t('cada par reúne a los que se parecen', gr.map(g => g.slice().sort().join('-')).join(' ') === '3-5 1-4 0-2', gr.map(g => g.join('-')).join(' '));
/* same length, different centromere: the centromeric index decides */
ch = mkc([[2.5, 2.5], [1, 4], [2.45, 2.55], [1.05, 3.95]]);
gr = Karyo.groupCell(ch);
t('misma longitud: los separa el índice centromérico', gr.map(g => g.slice().sort().join('-')).sort().join(' ') === '0-2 1-3', gr.map(g => g.join('-')).join(' '));
/* the satellite keeps its pair together */
ch = mkc([[1.5, 3, 0.4], [1.5, 3], [1.5, 3], [1.5, 3, 0.4]]);
gr = Karyo.groupCell(ch, { wsat: 10 });
t('los dos con satélite quedan juntos', gr.some(g => g.slice().sort().join('-') === '0-3'), gr.map(g => g.join('-')).join(' '));
ch = mkc([[1, 2], [1, 2.1], [1.02, 2], [1.01, 2.05], [3, 3], [3, 3.1], [3.05, 3], [2.95, 3]]);
gr = Karyo.groupCell(ch, { k: 4 });
t('grupos de cuatro homólogos (autotetraploide)', gr.length === 2 && gr[0].slice().sort().join() === '4,5,6,7');
ch = mkc([[2, 3], [2, 3.1], [1, 1.5]]);
gr = Karyo.groupCell(ch);
t('número impar: queda un grupo incompleto', gr.length === 2 && gr[1].length === 1);
/* two pairs of nearly equal length and different centromere: in one cell their
   order by length is swapped; the alignment among cells must not mix them */
const two = (f1, f2) => [{ id: 'a1', p: 2.0 * f1, q: 4.4 * f1 }, { id: 'a2', p: 2.02 * f1, q: 4.35 * f1 }, { id: 'b1', p: 2.6 * f2, q: 3.6 * f2 }, { id: 'b2', p: 2.62 * f2, q: 3.58 * f2 }, { id: 'c1', p: 1.2, q: 1.8 }, { id: 'c2', p: 1.22, q: 1.78 }];
const KA = Karyo.build([{ id: 'x', chromosomes: two(1, 1) }, { id: 'y', chromosomes: two(0.95, 1.06) }, { id: 'z', chromosomes: two(1.04, 0.97) }]);
t('alineamiento entre células: el par de IC bajo no se mezcla con el de IC alto', KA.pairs.slice(0, 2).every(p => p.ci.sd < 1), KA.pairs.map(p => p.ci.mean.toFixed(1) + '±' + p.ci.sd.toFixed(2)).join(' '));
t('alineamiento: tres pares en orden de longitud relativa', KA.pairs[0].rl.mean >= KA.pairs[1].rl.mean && KA.pairs[1].rl.mean > KA.pairs[2].rl.mean);
const M = [[4, 1, 3], [2, 0, 5], [3, 2, 2]];
const as = Karyo._hungarian(M);
t('método húngaro: asignación de costo mínimo (1 + 2 + 2 = 5)', M[0][as[0]] + M[1][as[1]] + M[2][as[2]] === 5, as.join());

sec('Cariotipo: promedios entre células');
const cells = [
  { id: 'a', chromosomes: [{ id: 1, p: 2, q: 3 }, { id: 2, p: 2.2, q: 2.8 }, { id: 3, p: 1, q: 2 }, { id: 4, p: 1.2, q: 2.2 }] },
  { id: 'b', chromosomes: [{ id: 1, p: 2.4, q: 3.6 }, { id: 2, p: 2.6, q: 3.4 }, { id: 3, p: 1.2, q: 2.4 }, { id: 4, p: 1.4, q: 2.6 }] },
];
let K = Karyo.build(cells);
t('dos pares', K.pairs.length === 2);
near('par 1, brazo corto medio entre células', K.pairs[0].s.mean, ((2 + 2.2) / 2 + (2.4 + 2.6) / 2) / 2);
near('par 1, sd entre células (n − 1)', K.pairs[0].s.sd, Stats.sd([2.1, 2.5]), 1e-12);
near('longitudes relativas suman 100 en cada célula', Stats.sum(K.pairs.map(p => p.rl.mean)), 100, 1e-9);
near('longitud relativa del par 1 (media de las células)', K.pairs[0].rl.mean, (100 * 5 / 8.2 + 100 * 6 / 9.8) / 2, 1e-9);
near('longitud de un juego = suma de las medias', K.thl, K.pairs[0].c.mean + K.pairs[1].c.mean, 1e-12);
near('longitud total del complemento (media de las células)', K.tcl.mean, ((2 + 3 + 2.2 + 2.8 + 1 + 2 + 1.2 + 2.2) + (2.4 + 3.6 + 2.6 + 3.4 + 1.2 + 2.4 + 1.4 + 2.6)) / 2, 1e-12);
t('fórmula sin número básico', K.formula === '2n = 4 = 2m + 2sm', K.formula);
t('número fundamental: m y sm con dos brazos', K.nf === 8);
K = Karyo.build(cells, { x: 2 });
t('fórmula con x = 2', K.formula === '2n = 2x = 4 = 2m + 2sm', K.formula);
K = Karyo.build([{ id: 'c', chromosomes: [{ id: 1, p: 1, q: 5 }, { id: 2, p: 1, q: 5 }, { id: 3, p: 2, q: 2 }, { id: 4, p: 2, q: 2 }] }]);
t('NF: st cuenta un brazo', K.nf === 6, K.nf);
K = Karyo.build([{ id: 'c', chromosomes: [{ id: 1, p: 1, q: 5 }, { id: 2, p: 1, q: 5 }, { id: 3, p: 2, q: 2 }, { id: 4, p: 2, q: 2 }] }], { stArms: 2 });
t('NF con st de dos brazos', K.nf === 8);
K = Karyo.build([{ id: 'c', chromosomes: [{ id: 1, p: 2, q: 3 }, { id: 2, p: 2.1, q: 3 }, { id: 3, p: 1, q: 2 }, { id: 4, p: 1, q: 2 }], groups: [[1, 3], [2, 4]] }]);
t('la corrección manual se respeta (grupos 1-3 y 2-4, aunque se parezcan 1-2)', K.pairs.length === 2 && K.pairs[0].ids[0].map(String).sort().join() === '2,4' && K.pairs[1].ids[0].map(String).sort().join() === '1,3', JSON.stringify(K.pairs.map(p => p.ids)));
const sat = Karyo.build([{ id: 's', chromosomes: [{ id: 1, p: 1, q: 3, sat: 0.5, satArm: 'p' }, { id: 2, p: 1, q: 3, sat: 0.5, satArm: 'p' }, { id: 3, p: 2, q: 2.2 }, { id: 4, p: 2, q: 2.2 }] }]);
t('satélite en la fórmula', /2sm-sat/.test(sat.formula) || /2m-sat/.test(sat.formula), sat.formula);
t('el par con satélite lo dice', sat.pairs.some(p => p.sat && p.satArm === 's'));

sec('Cariotipo: el ejemplo del maíz');
const Z = Examples.BASE.zea;
K = Karyo.fromPairs(Examples.basePairs(Z), { x: Z.x });
t('diez pares', K.pairs.length === 10);
t('fórmula del maíz simulado', K.formula === '2n = 2x = 20 = 8m + 10sm + 2sm-sat', K.formula);
near('longitud de un juego = 56 µm', K.thl, 56, 1e-9);
near('longitud relativa del par 1 = 14.5 %', K.pairs[0].rlMean, 14.5, 1e-9);
near('r del par 6 con el satélite = 2.40', K.pairs[5].rMean, 2.4, 1e-9);
t('el orden por tipo pone primero los m', Karyo.orderPairs(K.pairs, 'type', K.scheme).slice(0, 4).every(i => K.pairs[i].type === 'm'));
t('el orden mantenido (laboratorio)', Karyo.fromPairs([{ p: 1, q: 1.2 }, { p: 3, q: 3.3 }], { keepOrder: true }).pairs[0].s.mean === 1);

sec('Idiograma');
const I = Idio.draw(Idio.fromKaryotype(K), { title: 'Zea' });
t('dibuja un SVG con diez pares', /<svg/.test(I.svg) && (I.svg.match(/class="idio-chr"/g) || []).length === 10);
t('lleva las marcas del área de la gráfica', /data-plot="/.test(I.svg));
t('el satélite se dibuja aparte', /idio-sat/.test(I.svg));
const I2 = Idio.draw(Idio.fromKaryotype(K), { mode: 'diploid' });
t('idiograma diploide: veinte cromosomas', (I2.svg.match(/data-homolog="/g) || []).length === 20);
const I3 = Idio.draw([{ s: 1, l: 2, marks: [{ arm: 'l', pos: 0.5, size: 0.1, color: '#f00', probe: '45S' }] }], { legend: [{ label: '45S', color: '#f00' }] });
t('marcas y leyenda', /idio-band/.test(I3.svg) && /data-role="legend"/.test(I3.svg));
}
