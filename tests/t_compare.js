{
/* CytogeneticsPro — tests of compare.js: Newick, distances, clustering and
   the cophenetic correlation, PCA (against R: validation/comparacion), and the
   parsimony of the chromosome number on small trees solved by hand. */
sec('Comparación: Newick');
let N = Compare.parseNewick("((A:1,B:2)x:0.5,'C d':3)[un comentario];");
t('tres puntas', Compare.tipsOf(N).length === 3);
t('nombres y nombre entre comillas', Compare.tipsOf(N).map(n => n.name).join('|') === 'A|B|C d');
t('longitudes de rama', N.children[0].len === 0.5 && N.children[0].children[1].len === 2 && N.children[1].len === 3);
t('nombre de un nodo interno', N.children[0].name === 'x');
t('postorden: las puntas antes que su nodo', Compare.postorder(N).map(n => n.name || '·').join(',') === 'A,B,x,C d,·');
const W = Compare.writeNewick(N);
t('escritura y lectura de vuelta', Compare.writeNewick(Compare.parseNewick(W)) === W, W);
t('sin longitudes', Compare.writeNewick(N, { noLengths: true }) === "((A,B)x,'C d');");
let err = '';
try { Compare.parseNewick('((A,B),C;'); } catch (e) { err = e.message; }
t('falta un paréntesis: error claro', /paréntesis|parenthesis/.test(err), err);
err = '';
try { Compare.parseNewick('(A,B) C);'); } catch (e) { err = e.message; }
t('texto sobrante: error', /Sobra|extra/.test(err), err);
err = '';
try { Compare.parseNewick('  '); } catch (e) { err = e.message; }
t('Newick vacío: error', /vacío|empty/.test(err), err);
t('nombres comparables sin acentos, guiones bajos ni mayúsculas', Compare.normName('Sechium_edule  Huatúsco') === Compare.normName('sechium edule huatusco'));

sec('Comparación: distancias y agrupamiento (contra R)');
/* the matrix of validation/comparacion/comparacion.R */
const X = [[14, 21.4, 12.1, 18.2], [14, 23.0, 14.8, 16.9], [16, 25.7, 22.3, 21.4], [28, 41.9, 13.0, 17.5], [24, 33.2, 30.6, 27.9], [24, 35.0, 28.4, 25.0]];
const Sx = Compare.standardize(X);
near('estandarizada: media 0', Stats.mean(Sx.Z.map(r => r[1])), 0, 1e-12);
near('estandarizada: desviación 1', Stats.sd(Sx.Z.map(r => r[2])), 1, 1e-12);
t('una columna constante queda en 0', Compare.standardize([[1, 5], [2, 5], [3, 5]]).Z.every(r => r[1] === 0));
const Dg = Stats.gower(X), De = Compare.euclid(Sx.Z);
near('Gower A–B', Dg[0][1], 0.0855441361539, 1e-12);
near('Gower C–F', Dg[2][5], 0.420522391254, 1e-11);
near('Gower A–E', Dg[0][4], 0.7929284130504, 1e-12);
near('euclidiana A–B', De[0][1], 0.485727042467, 1e-11);
near('euclidiana D–E', De[3][4], 3.427507643945, 1e-11);
near('euclidiana E–F', De[4][5], 0.737086398294, 1e-11);
near('euclidiana con un dato faltante: se reescala', Compare.euclid([[0, NaN], [3, 4]])[0][1], Math.sqrt(9 * 2), 1e-12);
const hs = (D, m) => Compare.cluster(D, m).merges.map(x => x.h).sort((a, b) => a - b);
const R_H = {
  'gower average': [0.0855441361539, 0.1175900401510, 0.2854918071381, 0.5575594917058, 0.6340036940647],
  'gower ward': [0.0855441361539, 0.1175900401510, 0.3262944793505, 0.6643906602923, 0.9594721469645],
  'euclid average': [0.485727042467, 0.737086398294, 1.514075837007, 3.093332917319, 3.205181326213],
  'euclid ward': [0.485727042467, 0.737086398294, 1.727437013479, 3.567362647793, 4.848779020048] };
const R_C = { 'gower average': 0.897308353088, 'gower ward': 0.876610168676, 'euclid average': 0.906864730144, 'euclid ward': 0.881832960546 };
[['gower', Dg], ['euclid', De]].forEach(([dn, D]) => ['upgma', 'ward'].forEach(m => {
  const key = dn + ' ' + (m === 'upgma' ? 'average' : 'ward');
  const H = hs(D, m);
  t(`${dn} · ${m}: alturas iguales a las de R`, H.every((h, i) => Math.abs(h - R_H[key][i]) < 1e-9), H.join(' '));
  const CL = Compare.cluster(D, m);
  near(`${dn} · ${m}: correlación cofenética`, Compare.upperCorr(D, Compare.cophenetic(CL.tree, D.length)), R_C[key], 1e-9);
}));
const CL = Compare.cluster(Dg, 'upgma'), labs = ['A', 'B', 'C', 'D', 'E', 'F'];
t('el árbol tiene las seis hojas', Compare.leavesOf(CL.tree).slice().sort().join() === '0,1,2,3,4,5');
const nw = Compare.parseNewick(Compare.clusterNewick(CL.tree, labs));
const depthTo = (n, d) => n.children.length ? n.children.map(c => depthTo(c, d + c.len)).flat() : [d];
const dd = depthTo(nw, 0);
t('el Newick del dendrograma es ultramétrico', dd.every(v => Math.abs(v - CL.tree.h) < 1e-6), dd.join(' '));
t('el Newick conserva las puntas', Compare.tipsOf(nw).map(n => n.name).sort().join() === labs.join());

sec('Comparación: componentes principales (contra R)');
const E3 = Compare.jacobi([[4, 1, 2], [1, 3, 0], [2, 0, 5]]);
t('Jacobi: valores propios de R', [6.66907908828, 3.47602360292, 1.85489730880].every((v, i) => Math.abs(E3.values[i] - v) < 1e-9), E3.values.join(' '));
const Av = [[4, 1, 2], [1, 3, 0], [2, 0, 5]].map(r => r.reduce((s, x, k) => s + x * E3.vectors[0][k], 0));
t('Jacobi: A·v = λ·v', Av.every((v, k) => Math.abs(v - E3.values[0] * E3.vectors[0][k]) < 1e-9));
near('Jacobi: vectores ortonormales', E3.vectors[0].reduce((s, x, k) => s + x * E3.vectors[1][k], 0), 0, 1e-12);
const P = Compare.pca(X);
[2.644851050196442, 1.317377579838509, 0.036774398833057, 0.000996971131993].forEach((v, i) => near(`ACP: valor propio ${i + 1}`, P.values[i], v, 1e-9));
near('ACP: proporción del CP1', P.explained[0], 0.661212762549110, 1e-9);
near('ACP: las proporciones suman 1', P.explained.reduce((a, b) => a + b, 0), 1, 1e-12);
const LD = [[0.850153583028, 0.784191462106, 0.798807374306, 0.817948937877], [0.523465107980, 0.617775988652, 0.587961759595, 0.562152699597]];
t('ACP: cargas del CP1 y CP2 (en valor absoluto)', LD.every((r, c) => r.every((v, k) => Math.abs(Math.abs(P.loadings[c][k]) - v) < 1e-8)));
const SC = [[1.862088877426, 1.747069379871, 0.450879206755, 0.559464450192, 1.925401615746, 1.575171398114], [0.197734461245, 0.118985147102, 0.753498478673, 2.257131423850, 0.882288505589, 0.304624831241]];
t('ACP: puntuaciones del CP1 y CP2 (en valor absoluto)', SC.every((r, c) => r.every((v, i) => Math.abs(Math.abs(P.scores[i][c]) - v) < 1e-8)));
t('ACP: la carga mayor de cada componente es positiva', P.vectors.every(v => { let m = 0; v.forEach((x, k) => { if (Math.abs(x) > Math.abs(v[m])) m = k; }); return v[m] > 0; }));
t('ACP: sin datos faltantes', P.missing === false);

sec('Comparación: parsimonia del número cromosómico');
const M = Compare.costMatrix(1, 40, { gain: 1, loss: 1, dup: 1, demi: 1.5 });
const D = (a, b) => M.D[a - M.lo][b - M.lo];
t('7 → 14: una duplicación', D(7, 14) === 1 && M.path(7, 14)[0].kind === 'dup');
t('10 → 15: una demiploidía', D(10, 15) === 1.5 && M.path(10, 15)[0].kind === 'demi');
t('7 → 9: dos ganancias', D(7, 9) === 2 && M.path(7, 9).every(e => e.kind === 'gain'));
t('14 → 7: siete pérdidas (no hay reducción a la mitad)', D(14, 7) === 7);
t('7 → 15: duplicar y ganar uno', D(7, 15) === 2);
const run = (nwk, tips, costs) => Compare.numberParsimony(Compare.parseNewick(nwk), new Map(Object.entries(tips)), costs);
let R = run('((A,B),(C,D));', { A: [7], B: [7], C: [14], D: [14] });
t('((7,7),(14,14)): costo 1, raíz 7, una duplicación', R.cost === 1 && R.root.mpr.join() === '7' && R.totals.dup === 1 && R.totals.gain === 0);
R = run('((A,B),C);', { A: [12], B: [13], C: [14] });
t('((12,13),14): costo 2', R.cost === 2);
t('((12,13),14): la raíz puede ser 13 o 14', R.root.mpr.join() === '13,14');
t('((12,13),14): el nodo interno es 13', R.root.children[0].mpr.join() === '13');
t('sin ambigüedad en el nodo interno, sí en la raíz', R.ambiguous === 1);
R = run('(A,B);', { A: [10], B: [15] });
t('(10,15): una demiploidía, costo 1.5, raíz 10', R.cost === 1.5 && R.root.mpr.join() === '10' && R.totals.demi === 1);
R = run('((A,B),C);', { A: [7], B: [], C: [7] });
t('una punta sin número toma el de sus parientes', R.cost === 0 && R.tips[1].mpr.includes(7));
R = run('(A,B);', { A: [7, 8], B: [8] });
t('una punta polimórfica: costo 0 y raíz 8', R.cost === 0 && R.root.mpr.join() === '8');
R = run('(A,B);', { A: [3], B: [6] }, { dup: 5 });
t('(3,6) con la duplicación cara: costo 2.5 por demiploidía y ganancia', R.cost === 2.5, R.cost);
t('(3,6) con la duplicación cara: raíz 3 o 4', R.root.mpr.join() === '3,4', R.root.mpr.join());
R = run('(A,B);', { A: [3], B: [6] });
t('(3,6) con costos iguales: una duplicación', R.cost === 1 && R.totals.dup === 1);
err = '';
try { run('(A,B);', { A: [], B: [] }); } catch (e) { err = e.message; }
t('ninguna punta con número: error claro', /Ninguna punta|No tip/.test(err), err);
R = run('(((A,B),C),D);', { A: [7], B: [7], C: [14], D: [7] });
t('la historia elegida tiene el costo mínimo', (() => { let s = 0; R.nodes.forEach(v => { if (v !== R.root) s += v.branchCost; }); return Math.abs(s - R.cost) < 1e-9; })());

sec('Comparación: dibujos');
const dsvg = Compare.dendrogramSvg(CL.tree, labs, { xlab: 'Gower' });
t('dendrograma: un SVG con las seis etiquetas', /^<svg/.test(dsvg) && labs.every(l => dsvg.includes('>' + l + '</text>')));
R = run('((A,B),(C,D));', { A: [7], B: [7], C: [14], D: [14] });
const tsvg = Compare.numberTreeSvg(R, { show: '2n' });
t('árbol: un círculo por nodo interno', (tsvg.match(/class="nd( amb)?"/g) || []).length === 3);
t('árbol en 2n: la raíz dice 14', /class="ndt"[^>]*>14</.test(tsvg));
t('árbol: la rama con la duplicación lleva ×2', tsvg.includes('>×2<'));
t('mapa sin coordenadas: vacío', Compare.mapSvg([{ lat: NaN, lon: 1 }]) === '');
const msvg = Compare.mapSvg([{ lat: 19.1, lon: -97, color: 'red', label: 'a' }, { lat: 19.4, lon: -102, color: 'blue', label: 'b' }],
  { outline: { type: 'Polygon', coordinates: [[[-103, 18], [-96, 18], [-96, 20], [-103, 20], [-103, 18]]] } });
t('mapa: dos puntos y el contorno', (msvg.match(/<circle/g) || []).length === 2 && msvg.includes('class="map-line"'));
const pl = Chart.placeLabels([{ text: 'uno', font: 11, cands: [[10, 10, 'start'], [10, 40, 'start']] }, { text: 'dos', font: 11, cands: [[10, 10, 'start'], [10, 40, 'start']] }], [], null);
t('etiquetas: la segunda no se encima con la primera', pl[0].y === 10 && pl[1].y === 40);
}
