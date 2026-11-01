{
/* CytogeneticsPro — tests of the corrections of 1 November 2026: the CSV of
   Block 2 read back whole, one set in the asymmetry «cell by cell», the half
   site of a heteromorphism, the incomplete rows of the comparison, the
   intermediate formulas of the meiosis, the top of the axes, the idiogram
   without a volatile id and with its legend inside, the karyogram title, the
   written methods, the headings of the tables, the percentages and the
   labels of the examples. */
const keepState = JSON.parse(JSON.stringify(state));

sec('Correcciones: el CSV del Bloque 2 vuelve a entrar completo');
newProject();
state.accessions.push({ id: 'a1', name: 'Ixtlán', taxon: 'Zea mays', locality: '', lat: null, lon: null, x: 10 });
state.cells.push({ id: 'c1', acc: 'a1', label: 'c1', image: 'im1', scale: null, markers: [], chromosomes: [{ id: 'k1', label: 1, trace: [[0, 0], [0, 40], [0, 100]], cen: 40 }, { id: 'k2', label: 2, p: 30, q: 50, sat: 0, satArm: null }], groups: null });
state.images.im1 = { name: 'x.png', dataUrl: '', w: 10, h: 10 };
const out = Block2.csvRows(state.cells);
t('el CSV escribe taxón y unidad', out[0].join('|') === 'accesión|taxón|célula|cromosoma|p|q|satélite|brazo_satélite|unidad|origen' && out[1][1] === 'Zea mays' && out[1][8] === 'px');
const text = toDelimited(out);
const P = Block2.parseMeasurements(text);
t('al leerlo: taxón, unidad en píxeles y las dos medidas', P.rows.length === 2 && P.rows[0].taxon === 'Zea mays' && P.rows[0].unit === 'px' && P.rows[0].acc === 'Ixtlán', JSON.stringify(P.rows[0]));
t('la columna de accesión no toma la del taxón', Block2.parseMeasurements('taxón,p,q\nZea mays,1,2').rows[0].acc === null && Block2.parseMeasurements('taxon,p,q\nZea mays,1,2').rows[0].taxon === 'Zea mays');
newProject();
const R1 = Block2.importMeasurements(text);
const a1 = state.accessions.find(a => a.name === 'Ixtlán');
t('en un proyecto vacío entra la accesión con su taxón y sin «Accesión 1» vacía', state.accessions.length === 1 && a1 && a1.taxon === 'Zea mays', state.accessions.map(a => a.name).join());
t('la célula queda en píxeles, no en micras', state.cells.length === 1 && state.cells[0].unit === 'px' && Img.cellInPx(state.cells[0]) && R1.px === 1);
t('y el CSV que sale de ella vuelve a decir px', Block2.csvRows(state.cells)[1][8] === 'px');
newProject();
state.accessions.push({ id: 'old', name: 'Accesión 1', taxon: '', locality: '', lat: null, lon: null, x: null });
Block2.importMeasurements('accession,cell,chromosome,p,q\nA,c1,1,1,2\nA,c1,2,1,3');
t('una «Accesión 1» vacía hecha antes desaparece al pegar con nombres', state.accessions.length === 1 && state.accessions[0].name === 'A');
t('sin columna de accesión pero con taxón: una accesión por taxón', (() => { newProject(); Block2.importMeasurements('taxon,p,q\nZea mays,1,2\nZea mays,1,3\nZea diploperennis,2,3'); return state.accessions.length === 2 && state.accessions.every(a => a.taxon === a.name); })());

sec('Correcciones: «Juego (µm)» de un juego en el modo célula por célula');
newProject();
state.accessions.push({ id: 'k', name: 'K', taxon: '', x: 2 });
[[1, 2, 2, 4], [1.1, 2.2, 1.9, 3.8]].forEach((v, i) => state.cells.push({ id: 'kc' + i, acc: 'k', label: 'c' + i, chromosomes: [
  { id: 'a' + i, label: 1, p: v[0], q: v[1] }, { id: 'b' + i, label: 2, p: v[0], q: v[1] }, { id: 'c' + i, label: 3, p: v[2], q: v[3] }, { id: 'd' + i, label: 4, p: v[2], q: v[3] }] }));
state.settings.asymMode = 'pairs'; state.asym = {}; state.karyo = {};
const Ap = Block4.compute('k');
state.settings.asymMode = 'cells'; state.asym = {};
const Ac = Block4.compute('k');
near('pares: un juego = 3 + 6 = 9 (media de las dos células)', Ap.R.THL, (3 + 6 + 3.3 + 5.7) / 2, 1e-9);
near('célula por célula: también un juego, no la célula entera', Ac.R.THL, Ap.R.THL, 1e-9);
state.settings.asymMode = 'pairs';

sec('Correcciones: sitios por juego, regiones y «Dónde»');
const kb = JSON.stringify(state.bands);
state.bands = { probes: null, signals: [
  { acc: 'z', pair: 9, arm: 'l', pos: 0.8, probe: 's45', homolog: '1' }, { acc: 'z', pair: 1, arm: 's', pos: 0.9, probe: 's45' }, { acc: 'z', pair: 3, arm: 'l', pos: 0.2, probe: 's45' }] };
const Sz = Bands.summary('z')[0];
t('un sitio en un solo homólogo vale 0.5: 2.5 sitios por juego', Sz.sites === 2.5 && Bands.siteCounts('z').s45 === 2.5);
t('«Dónde» va en el orden de los pares', Sz.list.map(s => s.pair).join() === '1,3,9');
t('las regiones suman lo mismo que los sitios', Object.values(Sz.classes).reduce((a, b) => a + b, 0) === 2.5);
state.bands = JSON.parse(kb);

sec('Correcciones: filas incompletas de la comparación');
newProject();
state.compare.extra = [{ name: 'A', n2: 20, x: 10, THL: 30, CVCL: 20 }, { name: 'B', n2: 22, x: 11, THL: 33, CVCL: 25 }, { name: 'C', n2: 24, x: 12, THL: 36, CVCL: 22 }, { name: 'D', n2: 20, x: 10, THL: 40, CVCL: 30 }, { name: 'E', n2: 24, x: 12 }];
state.compare.vars = ['n2', 'x', 'THL', 'CVCL'];
let A8 = Block8.analyse();
t('por omisión sólo entran las filas completas, y lo dice', A8.use.length === 4 && !A8.use.some(r => r.name === 'E') && A8.msgs.some(m => /quedan fuera|left out/i.test(m[1])));
state.compare.settings.missing = 'common';
A8 = Block8.analyse();
t('con «las variables que tienen todas»: 2n y x, las cinco filas', A8.use.length === 5 && A8.V.join() === 'n2,x');
state.compare.settings.missing = 'pairwise';
state.compare.extra.push({ name: 'F', n2: 24, x: 12 });
A8 = Block8.analyse();
t('cada pareja con lo que comparte: aviso cuando comparten pocas variables', A8.use.length === 6 && A8.msgs.some(m => m[0] === 'warning' && /comparten pocas|share few/.test(m[1])));
const iE = A8.use.findIndex(r => r.name === 'E'), iC = A8.use.findIndex(r => r.name === 'C');
t('y en ese modo dos cariotipos distintos pueden quedar a 0 (C y E sólo comparten 2n y x)', A8.D[iE][iC] === 0);

sec('Correcciones: meiosis, fórmulas intermedias');
t('6x: AAAABB y AAABBB', Block5.intermediates(6).join() === 'AAAABB,AAABBB');
t('4x: ninguna (sólo AAAA y AABB)', Block5.intermediates(4).length === 0);
t('8x: incluye AAAAAABB y AAAABBCC, no AABBCCDD', Block5.intermediates(8).includes('AAAAAABB') && Block5.intermediates(8).includes('AAAABBCC') && !Block5.intermediates(8).includes('AABBCCDD'));

sec('Correcciones: el tope de los ejes cubre el máximo');
const top = svg => Math.max(...[...svg.matchAll(/data-role="ytick"[^>]*>([^<]+)</g)].map(m => +m[1].replace('−', '-')));
t('barras: 21 con tope 25, no 20', top(Chart.bars({ categories: ['a', 'b'], series: [{ name: 's', values: [21, 3] }] })) >= 21);
t('barras con error: la barra de error cabe', top(Chart.bars({ categories: ['a'], series: [{ name: 's', values: [12], err: [4] }] })) >= 16);
t('histograma: el pico cabe bajo el último número', top(Chart.hist({ x: [0, 1, 2, 3], y: [10, 230, 40, 5] })) >= 230);
t('con yMax fijo (polen) el tope es ese', top(Chart.bars({ categories: ['a'], series: [{ name: 's', values: [96], lo: [94], hi: [98] }], yMax: 100 })) === 100);
const rot = Chart.bars({ categories: ['Testigo (agua destilada)', 'Extracto 1 %'], series: [{ name: 's', values: [9, 6] }], rotate: true });
const vbW = +/viewBox="0 0 (\d+)/.exec(rot)[1], plotX = +/data-plot="([\d.]+)/.exec(rot)[1];
t('etiquetas giradas: hay sitio a la izquierda para la primera', plotX + (vbW - plotX) / 4 - 'Testigo (agua destilada)'.length * 11 * 0.56 * 0.82 >= 0, plotX);

sec('Correcciones: idiograma y cariograma');
const I1 = Idio.draw([{ label: 1, s: 2, l: 3, type: 'm' }], {}), I2 = Idio.draw([{ label: 1, s: 2, l: 3, type: 'm' }], {});
t('el idiograma no lleva un id que cambia en cada dibujo', !/ id="/.test(I1.svg) && I1.svg === I2.svg);
const many = Array.from({ length: 28 }, (_, i) => ({ label: i + 1, s: 1, l: 2, type: 'm', homologs: [{ s: 1, l: 2 }, { s: 1.1, l: 2.1 }] }));
const Iw = Idio.draw(many, { mode: 'diploid', legend: [{ label: 'm · metacéntrico', color: 'red' }, { label: 'ADNr 45S', color: 'blue' }] });
const xs = [...Iw.svg.matchAll(/<text data-li="\d+" class="idio-leg" x="([\d.]+)"/g)].map(m => +m[1]);
t('vista de los homólogos ancha: la leyenda va debajo, dentro de la figura', xs.length === 2 && xs.every(x => x < Iw.width - 40));
t('karyogram: el ancho del SVG cubre el título (prueba del código)', /W = Math\.max\(W, 30 \+ title\.length/.test(Report.karyogram.toString()));

sec('Correcciones: textos');
t('porcentajes con espacio antes de %', fmtPct(0.637, 1) === '63.7 %' && fmtPct(0.5, 0) === '50 %');
t('«subsp.» en redonda dentro del nombre en cursiva', Report.taxonHtml('Sechium edule subsp. sylvestre') === '<i>Sechium edule</i> subsp. <i>sylvestre</i>');
const D = Examples.DATA.zea, cl = o => JSON.parse(JSON.stringify(o));
newProject(); Object.assign(state.meta, cl(D.meta), { example: 'zea' }); state.accessions = cl(D.accessions); state.cells = Examples.buildCells(D); state.ploidy = Object.assign(state.ploidy, cl(D.ploidy));
state.karyo = {}; state.asym = {};
const MZ = Report.methods('es').paragraphs.join(' '), MZe = Report.methods('en').paragraphs.join(' ');
t('métodos del maíz: «una de ellas se midió sobre fotomicrografías… y las otras 4…», sin «, 1 sobre»', /una de ellas se midió sobre fotomicrografías/.test(MZ) && /las otras 4/.test(MZ) && !/, 1 sobre/.test(MZ));
t('métodos del maíz en inglés: «one of them was measured…»', /one of them was measured on photomicrographs/.test(MZe) && /the other 4 from typed measurements/.test(MZe));
const TBc = Report.tables().find(x => x.id === 'conteos');
t('tabla de conteos con encabezados en el idioma (accesión, célula, 2n)', TBc && TBc.rows[0].join('|') === 'accesión|célula|2n', TBc && TBc.rows[0].join('|'));
t('etiquetas de los ejemplos en inglés', Examples.localize('Célula 3', 'en') === 'Cell 3' && Examples.localize('Raíz 1-2', 'en') === 'Root 1-2' && Examples.localize('Población diploide · planta 2', 'en') === 'Diploid population · plant 2' && Examples.localize('Testigo (agua destilada)', 'en') === 'Control (distilled water)');
t('y de vuelta al español; un nombre propio no se toca', Examples.localize('Cell 1 (image)', 'es') === 'Célula 1 (imagen)' && Examples.localize('Mi célula', 'en') === 'Mi célula');

Object.keys(keepState).forEach(k => { state[k] = keepState[k]; });
}
