/* CytogeneticsPro — manual de usuario: escribe las referencias del apéndice F a partir del catálogo de la app.
   Lee js/home.js (Home.REFS: cada referencia con su tema; Home.REF_TOPICS: los nombres de los temas) y
   reemplaza lo que hay entre las marcas <!-- REFERENCIAS --> y <!-- /REFERENCIAS --> de es/11-apendices.html:
   un apartado por tema, en el orden de la app, con las obras en orden alfabético. Así el manual y el programa
   citan exactamente lo mismo.
   Uso:   node manual/herramientas/genera-referencias.js              (es/11-apendices.html)
          node manual/herramientas/genera-referencias.js --idioma en  (en/11-apendices.html: los temas en inglés, como
                                                                        la app en inglés; las referencias se dejan como
                                                                        las escribe la app, salvo «2.ª ed.», «Londres»,
                                                                        «Nueva York» y «Documento en línea») */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '..', '..');
/* home.js only needs these names when it is loaded; its builders run on DOMContentLoaded, which never comes */
const noop = () => {};
const caja = { console, document: { addEventListener: noop }, L2: (a) => a, T: (a) => a, el: () => null, STEPS: [], APP_VERSION: '1.0.0',
  citeLang: (c) => c, fileLang: (n) => n };   /* home.js names these helpers of core.js when it is loaded */
caja.window = caja;
vm.createContext(caja);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js', 'home.js'), 'utf8'), caja);
const { REFS, REF_TOPICS, refLang } = caja.window.Home;
const iIdioma = process.argv.indexOf('--idioma'), en = iIdioma > 0 && process.argv[iIdioma + 1] === 'en';
const lang = en ? 'en' : 'es';

/* the order of the topics: that of the route of the app, from the image to the comparison, then statistics and techniques */
const ORDEN = ['img', 'kar', 'asy', 'mei', 'plo', 'ban', 'cmp', 'est', 'tec', 'fig'];
const temas = ORDEN.filter(t => REF_TOPICS[t]).concat(Object.keys(REF_TOPICS).filter(t => !ORDEN.includes(t)))
  .filter(t => REFS.some(r => r[1] === t));
const clave = s => s.replace(/<[^>]+>/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const aIngles = s => s.replace(/(\d)\.ª ed\./g, (m, n) => n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n] || 'th') + ' ed.')
  .replace(/Londres/g, 'London').replace(/Nueva York/g, 'New York').replace(/Documento en línea/g, 'Online document');

let total = 0, html = '\n';
temas.forEach((t, i) => {
  const lista = REFS.filter(r => r[1] === t).map(r => (en ? (refLang ? refLang(r[0], 'en') : aIngles(r[0])) : r[0])).sort((a, b) => clave(a).localeCompare(clave(b), lang));
  total += lista.length;
  html += `  <h3>F.${i + 1} · ${REF_TOPICS[t][en ? 1 : 0]}</h3>\n  <ul class="refs">\n` + lista.map(r => `    <li>${r}</li>`).join('\n') + '\n  </ul>\n';
});

const archivo = path.join(raiz, 'manual', lang, '11-apendices.html');
if (!fs.existsSync(archivo)) { console.log(`${total} referencias en ${temas.length} temas; todavía no existe ${path.relative(raiz, archivo)}`); process.exit(0); }
const texto = fs.readFileSync(archivo, 'utf8');
const a = texto.indexOf('<!-- REFERENCIAS -->'), b = texto.indexOf('<!-- /REFERENCIAS -->');
if (a < 0 || b < 0) throw new Error('No encontré las marcas de las referencias en ' + archivo);
fs.writeFileSync(archivo, texto.slice(0, a + '<!-- REFERENCIAS -->'.length) + html + '  ' + texto.slice(b));
console.log(`${total} referencias en ${temas.length} temas escritas en ${path.relative(raiz, archivo)}`);
