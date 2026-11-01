{
/* CytogeneticsPro — tests of zip.js and report.js: CRC-32 against its check
   value, a stored archive read back, the printable page, the tables and the
   written methods of the examples, with every citation found in the list of
   references. */
sec('Paquete .zip');
t('CRC-32 de «123456789» = CBF43926 (valor de comprobación del polinomio)', Zip.crc32(Zip.utf8('123456789')) === 0xCBF43926);
t('CRC-32 de nada = 0', Zip.crc32(new Uint8Array(0)) === 0);
const bin = new Uint8Array(300).map((_, i) => (i * 37) % 256);
const files = [{ name: 'LEEME.txt', data: 'hola' }, { name: 'tablas/cariotipo_ñ.csv', data: 'par,p,q\n1,2.5,3.1\n' }, { name: 'figuras/a.bin', data: bin }];
const z = Zip.build(files, new Date(2026, 9, 7, 12, 30, 10));
t('empieza con la firma «PK\\3\\4»', z[0] === 0x50 && z[1] === 0x4b && z[2] === 3 && z[3] === 4);
const back = Zip.read(z);
t('se leen los tres archivos con su nombre (UTF-8)', back.length === 3 && back.map(f => f.name).join('|') === 'LEEME.txt|tablas/cariotipo_ñ.csv|figuras/a.bin');
t('sin compresión y con el CRC correcto', back.every(f => f.method === 0 && f.ok));
t('el contenido vuelve igual', new TextDecoder().decode(back[1].data) === files[1].data && back[2].data.every((v, i) => v === bin[i]));
const dv = new DataView(z.buffer);
t('fecha DOS: 7 de octubre de 2026', dv.getUint16(12, true) === (((2026 - 1980) << 9) | (10 << 5) | 7));

sec('Informe: páginas y tablas HTML');
const pg = Report.page('A < B', '<p>x</p>', 'en');
t('página completa, en el idioma pedido y con el título escapado', /^<!DOCTYPE html>/.test(pg) && /<html lang="en">/.test(pg) && pg.includes('<title>A &lt; B</title>'));
t('página sin recursos externos', !/https?:\/\//.test(pg.replace(/<meta[^>]*>/g, '')));
const ht = Report.htmlTable([['a', 'b'], ['<x>', 1.23456789], ['y', '']]);
t('tabla HTML: escapa el texto y alinea los números', ht.includes('&lt;x&gt;') && ht.includes('<td class="num">1.23457</td>'));

/* an example opened as Examples.open does it, without changing block */
const useExample = key => {
  const D = Examples.DATA[key], clone = o => JSON.parse(JSON.stringify(o));
  newProject();
  Object.assign(state.meta, clone(D.meta), { example: key });
  state.accessions = clone(D.accessions || []);
  state.cells = Examples.buildCells(D);
  ['meiosis', 'ploidy', 'bands', 'compare'].forEach(k => { if (D[k]) Object.assign(state[k], clone(D[k])); });
  state.karyo = {}; state.asym = {};
};
sec('Informe: métodos redactados de los ejemplos');
['zea', 'sechium', 'poly', 'allium'].forEach(key => {
  useExample(key);
  ['es', 'en'].forEach(lang => {
    const M = Report.methods(lang);
    const miss = M.cites.filter(c => !Report.refFor(c));
    t(`${key} (${lang}): párrafos y referencias`, M.paragraphs.length >= 3 && M.refs.length >= 2, M.paragraphs.length + ' / ' + M.refs.length);
    t(`${key} (${lang}): cada cita tiene su referencia completa`, !miss.length, miss.join('; '));
    t(`${key} (${lang}): sin valores perdidos`, !/NaN|undefined|\[object/.test(M.paragraphs.join(' ')));
    t(`${key} (${lang}): avisa que los datos son simulados`, lang === 'es' ? /simulados/.test(M.paragraphs[0]) : /simulated/.test(M.paragraphs[0]));
  });
});
useExample('sechium');
let M = Report.methods('es');
t('chayote: menciona la distancia de Gower, UPGMA y la correlación cofenética', /Gower/.test(M.paragraphs.join(' ')) && /UPGMA/.test(M.paragraphs.join(' ')) && /cofenética/.test(M.paragraphs.join(' ')));
t('chayote: cita a Levan et al. (1964) dentro de la frase', M.paragraphs.join(' ').includes('Levan et al. (1964)'));
t('chayote: las fórmulas de las cuatro accesiones', (M.paragraphs.join(' ').match(/2n = 2x = /g) || []).length >= 4);
t('chayote: referencias en orden alfabético', M.refs.map(r => r.replace(/<[^>]+>/g, '')).every((r, i, a) => i === 0 || a[i - 1].localeCompare(r) <= 0));
const ME = Report.methods('en').paragraphs.join(' ');
t('chayote en inglés: variables de la comparación en inglés', /the length of one set/.test(ME) && !/longitud de un juego/.test(ME));
useExample('poly');
M = Report.methods('es');
t('serie poliploide: meiosis (Sybenga) y citometría (Doležel)', /Sybenga/.test(M.paragraphs.join(' ')) && /Doležel/.test(M.paragraphs.join(' ')));
useExample('allium');
t('Allium: la prueba de Allium con Fiskesjö y Holm', /Fiskesjö/.test(Report.methods('es').paragraphs.join(' ')) && /Holm/.test(Report.methods('es').paragraphs.join(' ')));

sec('Informe: tablas');
useExample('sechium');
let TB = Report.tables();
const ids = TB.map(x => x.id);
t('chayote: accesiones, mediciones, cariotipo, asimetría, conteos, señales y comparación', ['accesiones', 'mediciones', 'cariotipo', 'asimetria', 'conteos', 'senales', 'matriz_comparacion', 'distancias'].every(k => ids.includes(k)), ids.join());
t('cada tabla tiene encabezado y filas del mismo ancho', TB.every(x => x.rows.length > 1 && x.rows.every(r => r.length === x.rows[0].length)));
const kt = TB.find(x => x.id === 'cariotipo');
t('cariotipo: 14 + 14 + 14 + 12 pares', kt.rows.length - 1 === 54);
const dt = TB.find(x => x.id === 'distancias');
t('distancias: matriz cuadrada simétrica con ceros en la diagonal', dt.rows.slice(1).every((r, i) => r[i + 1] === 0 && dt.rows.slice(1).every((r2, j) => Math.abs(r[j + 1] - r2[i + 1]) < 1e-12)));
useExample('poly');
TB = Report.tables();
const fc = TB.find(x => x.id === 'citometria');
t('serie poliploide: la tabla de citometría trae el 2C calculado', fc && fc.rows.slice(1).every(r => isFinite(r[7]) && r[7] > 0));
t('las tablas pasan a CSV sin perder filas', TB.every(x => toDelimited(x.rows).trim().split('\r\n').length === x.rows.length));
newProject();
}
