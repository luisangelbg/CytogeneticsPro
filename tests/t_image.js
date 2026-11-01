{
/* CytogeneticsPro — tests of image.js (geometry and measurement of traced
   chromosomes), of the reading of pasted measurements and of the project file. */
sec('Imagen: geometría de los trazos');
near('longitud de una polilínea 3-4-5', Img.polyLength([[0, 0], [3, 4], [3, 10]]), 5 + 6, 1e-12);
near('un solo punto: longitud 0', Img.polyLength([[1, 1]]), 0);
let p = Img.pointAt([[0, 0], [10, 0], [10, 10]], 15);
t('punto a 15 de la línea quebrada', Math.abs(p.x - 10) < 1e-12 && Math.abs(p.y - 5) < 1e-12 && p.ty === 1);
p = Img.pointAt([[0, 0], [10, 0]], 99);
t('más allá del final se queda en el final', p.x === 10);
let pr = Img.project([[0, 0], [10, 0], [10, 10]], [12, 4]);
near('proyección sobre el segundo tramo: s = 14', pr.s, 14, 1e-12);
near('distancia a la línea', pr.d, 2, 1e-12);
/* a quarter circle of radius 100 traced with 90 points: its length tends to π·100/2 */
const arc = []; for (let i = 0; i <= 90; i++) { const a = i * Math.PI / 180; arc.push([100 * Math.cos(a), 100 * Math.sin(a)]); }
near('cuarto de círculo: la curvatura se mide (π·50)', Img.polyLength(arc), Math.PI * 50, 0.01);
near('distancia de un punto a un segmento', Img.segDist([5, 3], [0, 0], [10, 0]), 3, 1e-12);

sec('Imagen: medición de un cromosoma trazado');
const line = [[0, 0], [30, 0], [100, 0]];
let m = Img.measure({ trace: line, cen: 30 }, 0.1);
near('brazo corto = 30 px × 0.1 µm/px', m.p, 3, 1e-12);
near('brazo largo = 70 px × 0.1', m.q, 7, 1e-12);
t('sin satélite', m.sat === 0 && m.satArm === null);
m = Img.measure({ trace: line, cen: 70 }, 0.1);
t('si el centrómero queda al otro lado, p sigue siendo el corto', Math.abs(m.p - 3) < 1e-12 && Math.abs(m.q - 7) < 1e-12);
m = Img.measure({ trace: line, cen: 30, sc: 10 }, 0.1);
near('satélite de 10 px en el brazo corto', m.sat, 1, 1e-12);
near('el brazo corto sin el satélite', m.p, 2, 1e-12);
t('el satélite está en p', m.satArm === 'p');
m = Img.measure({ trace: line, cen: 30, sc: 90 }, 0.1);
t('satélite en el brazo largo', m.satArm === 'q' && Math.abs(m.sat - 1) < 1e-12 && Math.abs(m.q - 6) < 1e-12);
m = Img.measure({ trace: line, cen: 60, sc: 10 }, 1);
t('con su satélite, el brazo que lo lleva pasa a ser el largo', m.satArm === 'q' && m.q === 50 && m.p === 40 && m.sat === 10, JSON.stringify(m));
t('sin centrómero el trazo está incompleto', Img.measure({ trace: line, cen: null }, 1).complete === false);
t('sin trazo no hay medida', Img.measure({ trace: [[0, 0]] }, 1) === null);
const cell = { scale: { px: 200, um: 10 }, chromosomes: [{ id: 'a', label: 1, trace: line, cen: 30 }, { id: 'b', label: 2, p: 1.5, q: 2.5 }, { id: 'c', label: 3, trace: line, cen: null }, { id: 'd', label: 4, p: '', q: '' }] };
near('µm por píxel de la calibración', Img.umPerPx(cell), 0.05, 1e-15);
const cm = Img.cellMeasurements(cell);
t('la célula da dos medidas completas (trazo y a mano)', cm.length === 2 && cm[0].traced && !cm[1].traced);
near('trazo convertido a µm', cm[0].p, 1.5, 1e-12);
t('sin calibrar, en píxeles', Img.cellMeasurements({ chromosomes: [{ id: 'a', trace: line, cen: 30 }] })[0].p === 30);

sec('Medidas pegadas');
let r = Block2.parseMeasurements('2.1\t3.4\n2.0\t3.5');
t('dos columnas: p y q', r.rows.length === 2 && r.rows[0].p === 2.1 && r.rows[0].q === 3.4 && r.rows[0].cell === null);
r = Block2.parseMeasurements('1;2,1;3,4\n2;2,0;3,5');
t('punto y coma con coma decimal: cromosoma p q', r.rows.length === 2 && r.rows[1].chr === '2' && r.rows[1].p === 2.0);
r = Block2.parseMeasurements('accession,cell,chromosome,p,q,satellite,arm\nA,c1,1,1.2,3.0,0.4,p\nA,c1,2,1.1,3.1,,');
t('encabezados en inglés con satélite', r.rows.length === 2 && r.rows[0].acc === 'A' && r.rows[0].sat === 0.4 && r.rows[0].satArm === 'p' && r.rows[1].sat === 0);
r = Block2.parseMeasurements('Cromosoma\tBrazo corto\tBrazo largo\n1\t2\t3\n2\tx\t3');
t('encabezados en español; una fila mala se salta', r.rows.length === 1 && r.bad.length === 1 && r.rows[0].q === 3);
r = Block2.parseMeasurements('A\tc1\t1\t1\t2\t0.3\tq');
t('siete columnas: el satélite en q', r.rows[0].satArm === 'q');
const csv = parseDelimited('"a, b";2\n"c ""d""";3');
t('lectura de comillas y separadores', csv.rows[0][0] === 'a, b' && csv.rows[1][0] === 'c "d"' && csv.sep === ';');
t('escritura con BOM y comillas', toDelimited([['x', 'a,b'], [1.5, 'c']]).startsWith('﻿x,"a,b"\r\n1.5,c'));

sec('El archivo del proyecto');
const saved = JSON.parse(JSON.stringify(state));
newProject();
state.accessions.push({ id: 'a1', name: 'Prueba', taxon: 'Zea mays', x: 10 });
state.cells.push({ id: 'c1', acc: 'a1', label: 'c', chromosomes: [{ id: 'k', label: 1, p: 1, q: 2 }], markers: [[1, 2]] });
state.meiosis.pollen.push({ id: 'p1', viable: 9, inviable: 1 });
const js = projectJSON();
const obj = JSON.parse(js);
t('el proyecto dice qué es y su versión', obj.app === 'CytogeneticsPro' && obj.version === APP_VERSION && obj.format === 1);
t('no guarda resultados calculados', !('karyo' in obj.data) && !('asym' in obj.data));
newProject();
loadProject(js);
t('se reabre igual', state.accessions[0].name === 'Prueba' && state.cells[0].chromosomes[0].q === 2 && state.meiosis.pollen[0].viable === 9 && state.cells[0].markers.length === 1);
let threw = false; try { loadProject('{"app":"Otra","data":{}}'); } catch (e) { threw = true; }
t('un archivo de otra app se rechaza', threw);
newProject(); Object.keys(saved).forEach(k => { state[k] = saved[k]; });
}
