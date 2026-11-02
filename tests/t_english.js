{
/* CytogeneticsPro — tests of the English interface (1 November 2026): file
   names in the language of the interface, citations with «and», references
   without Spanish forms (2.ª ed., Londres, Nueva York), the English title of
   the citation and of the examples, and American spelling (homolog, color,
   gray, center) with “ ” quotes in the English texts. The language is changed
   only in memory (I18N.lang), never saved. */
const keepState = JSON.parse(JSON.stringify(state)), keepLang = I18N.lang;
const inLang = (L, f) => { const k = I18N.lang; I18N.lang = L; try { return f(); } finally { I18N.lang = k; } };

sec('Inglés: nombres de archivo');
const FN = [['mediciones.csv', 'measurements.csv'], ['mediciones.tsv', 'measurements.tsv'], ['polen_maiz_palynopro.csv', 'pollen_maiz_palynopro.csv'],
  ['configuraciones_a', 'configurations_a'], ['fases_a', 'phases_a'], ['tetradas_a', 'tetrads_a'], ['tablas/', 'tables/'], ['figuras/', 'figures/'],
  ['accesiones.csv', 'accessions.csv'], ['LEEME.txt', 'README.txt'], ['informe_x.html', 'report_x.html'], ['informe.html', 'report.html'],
  ['proyecto_x.json', 'project_x.json'], ['meiosis_configuraciones.csv', 'meiosis_configurations.csv'], ['cariotipos.csv', 'karyotypes.csv'],
  ['cariotipo_x.csv', 'karyotype_x.csv'], ['indices_asimetria.csv', 'asymmetry_indices.csv'], ['idiograma_x.svg', 'idiogram_x.svg'], ['dendrograma_upgma.nwk', 'dendrogram_upgma.nwk']];
t('cada nombre español tiene su nombre inglés', FN.every(([es, en]) => fileLang(es, 'en') === en), FN.filter(([es, en]) => fileLang(es, 'en') !== en).map(x => fileLang(x[0], 'en')).join());
t('en español los nombres no cambian', FN.every(([es]) => fileLang(es, 'es') === es));
t('sin idioma, el de la interfaz', inLang('en', () => fileLang('mediciones.csv')) === 'measurements.csv' && inLang('es', () => fileLang('mediciones.csv')) === 'mediciones.csv');
t('sólo se cambia la raíz al principio del nombre', fileLang('polenta.csv', 'en') === 'polenta.csv' && fileLang('mi_informe.html', 'en') === 'mi_informe.html');
const tabIds = [];
['zea', 'sechium', 'poly', 'allium'].forEach(k => {
  const D = Examples.DATA[k], cl = o => JSON.parse(JSON.stringify(o));
  newProject(); Object.assign(state.meta, cl(D.meta), { example: k }); state.accessions = cl(D.accessions || []); state.cells = Examples.buildCells(D);
  if (D.meiosis) Object.assign(state.meiosis, cl(D.meiosis)); if (D.ploidy) Object.assign(state.ploidy, cl(D.ploidy));
  if (D.bands) Object.assign(state.bands, cl(D.bands)); if (D.compare) Object.assign(state.compare, cl(D.compare));
  state.karyo = {}; state.asym = {};
  Report.tables().forEach(x => tabIds.push(x.id));
});
t('todas las tablas del paquete tienen nombre inglés', tabIds.length > 10 && tabIds.every(id => fileLang(id + '.csv', 'en') !== id + '.csv'),
  [...new Set(tabIds)].filter(id => fileLang(id + '.csv', 'en') === id + '.csv').join());

sec('Inglés: citas y referencias');
t('«y» entre autores → «and»', citeLang('Sharma y Sharma 1980', 'en') === 'Sharma and Sharma 1980' && citeLang('Darlington y La Cour 1976', 'en') === 'Darlington and La Cour 1976'
  && citeLang('Doležel, Greilhuber y Suda 2007', 'en') === 'Doležel, Greilhuber and Suda 2007');
t('en español la cita no cambia', citeLang('Guerra y Souza 2002', 'es') === 'Guerra y Souza 2002');
t('índices de asimetría: ninguna referencia inglesa con «y»', Asym.INDICES.every(m => !/ y /.test(citeLang(m.ref, 'en'))));
t('pasos de la práctica: ninguna fuente inglesa con «y»', Teach.protocolSteps({ pre: 'abn', hyd: 'enz', stain: 'feu' }).every(s => !/ y /.test(citeLang(s[4], 'en'))));
const R = n => Home.REFS.find(r => r[0].startsWith(n))[0];
t('ediciones y ciudades en inglés', Home.refLang(R('Darlington'), 'en').includes('6th ed. George Allen &amp; Unwin, London') && Home.refLang(R('Jolliffe'), 'en').includes('2nd ed. Springer, New York')
  && Home.refLang(R('Sharma'), 'en').includes('3rd ed. Butterworths, London') && Home.refLang(R('Sybenga'), 'en').includes('Springer, Berlin') && Home.refLang(R('Okabe'), 'en').includes('Online document'));
t('ninguna referencia inglesa con formas españolas', Home.REFS.every(r => !/ª ed|Londres|Nueva York|Berlín|en línea/.test(Home.refLang(r[0], 'en'))));
t('en español las referencias no cambian', Home.REFS.every(r => Home.refLang(r[0], 'es') === r[0]));
t('Report.refFor da la referencia en el idioma pedido', /Nueva York/.test(Report.refFor('Jolliffe 2002')) && /New York/.test(Report.refFor('Jolliffe 2002', 'en')));
{
  const D = Examples.DATA.sechium, cl = o => JSON.parse(JSON.stringify(o));
  newProject(); Object.assign(state.meta, cl(D.meta), { example: 'sechium' }); state.accessions = cl(D.accessions); state.cells = Examples.buildCells(D);
  if (D.ploidy) Object.assign(state.ploidy, cl(D.ploidy)); if (D.bands) Object.assign(state.bands, cl(D.bands)); if (D.compare) Object.assign(state.compare, cl(D.compare));
  state.karyo = {}; state.asym = {};
  const en = Report.methods('en'), es = Report.methods('es');
  t('métodos en inglés: referencias sin formas españolas', en.refs.length > 5 && en.refs.every(r => !/ª ed|Londres|Nueva York|Berlín|en línea/.test(r)), en.refs.filter(r => /ª ed|Londres|Nueva York/.test(r)).join(' | '));
  t('métodos en español: las referencias siguen igual', es.refs.some(r => /Nueva York/.test(r)) && es.refs.length === en.refs.length);
  t('métodos en inglés: la cita de la app con su título inglés', en.refs.some(r => r.includes('CytogeneticsPro: plant cytogenetics in the browser')) && es.refs.some(r => r.includes('CytogeneticsPro: citogenética vegetal en el navegador')));
  t('métodos en inglés sin comillas españolas', !/[«»]/.test(Report.methodsText('en')));
}

sec('Inglés: la cita, los ejemplos y la ortografía');
const C = Home.citeText();
t('cita inglesa con título inglés; la española igual', C.apaEn.includes('<i>CytogeneticsPro: plant cytogenetics in the browser</i> (version') && C.apa.includes('<i>CytogeneticsPro: citogenética vegetal en el navegador</i> (versión'));
t('BibTeX en los dos idiomas', C.bibEn.includes('title   = {CytogeneticsPro: plant cytogenetics in the browser}') && C.bib.includes('title   = {CytogeneticsPro: citogenética vegetal en el navegador}'));
t('ficha del chayote: «2n = 28 and 24» en inglés', Home.EXAMPLES.find(x => x.k === 'sechium').t.includes('<span data-l="en">and</span>'));
const TT = [['Sechium edule: tres accesiones cultivadas y una silvestre (ejemplo simulado)', 'Sechium edule: three cultivated accessions and a wild one (simulated example)'],
  ['Zea mays (ejemplo simulado)', 'Zea mays (simulated example)'], ['Serie poliploide ficticia (2x, 4x, 6x)', 'Fictitious polyploid series (2x, 4x, 6x)'],
  ['Allium cepa: prueba de citotoxicidad (ejemplo simulado)', 'Allium cepa: cytotoxicity test (simulated example)']];
t('títulos de los ejemplos en inglés y de vuelta', TT.every(([es, en]) => Examples.localize(es, 'en') === en && Examples.localize(en, 'es') === es));
t('los títulos de los ejemplos son los del generador', TT.every(([es]) => Object.values(Examples.DATA).some(D => D.meta.title === es)));
const english = JSON.stringify([Home.THEORY.map(x => [x.h[1], x.en, x.fig && x.fig[2]]), Home.BLOCKS, Home.METHODS.map(m => m[2]), Home.EXAMPLES.map(x => x.d[1]),
  Asym.INDICES.map(m => m.en), Teach.GLOSSARY, Teach.TEXTS, Teach.BANK]);
t('textos ingleses con «homolog», no «homologue»', /homolog/.test(english) && !/homologue/i.test(english));
t('sin colour, grey ni centre', !/\b(colour|grey|centre|centred)/i.test(english));
t('sin comillas españolas en la teoría inglesa', !/[«»]/.test(JSON.stringify(Home.THEORY.map(x => x.en))));

Object.keys(keepState).forEach(k => { state[k] = keepState[k]; });
I18N.lang = keepLang;
}
