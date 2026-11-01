{
/* CytogeneticsPro — tests of bands.js (position classes, the pattern of an
   accession, heteromorphisms, the concordance among cells, the sites of each
   probe) and of the drawing of bands that overlap on the idiogram. */
sec('Bandeo y FISH: clases y patrón');
const keep = JSON.stringify(state.bands);
state.bands = { probes: null, signals: [] };
t('sondas por omisión: seis, con telómeros en puntos', Bands.probes().length === 6 && Bands.probe('tel').dot === true);
t('proximal por debajo de un tercio', Bands.posClass(0.2) === 'proximal' && Bands.posClass(1 / 3) === 'interstitial');
t('intersticial hasta 0.8; terminal después', Bands.posClass(0.8) === 'interstitial' && Bands.posClass(0.81) === 'terminal');
t('una señal sin brazo válido no cuenta', !Bands.valid({ probe: 's45', pair: 1, arm: 'x', pos: 0.5 }) && Bands.valid({ probe: 's45', pair: 1, arm: 's', pos: 0.5 }));
state.bands.signals = [
  { acc: 'a', pair: 1, arm: 's', pos: 0.9, size: 0.1, probe: 's45' },
  { acc: 'a', pair: 3, arm: 'l', pos: 0.5, size: 0.08, probe: 's5', homolog: '2' },
  { acc: 'a', pair: 2, arm: 'l', pos: 0.3, probe: 'cma', cell: 'c1' },
  { acc: 'a', pair: 2, arm: 'l', pos: 0.4, probe: 'cma', cell: 'c2' },
  { acc: 'a', pair: 2, arm: 'l', pos: 0.5, probe: 'cma', cell: 'c3' },
  { acc: 'a', pair: 1, arm: 's', pos: 0.85, probe: 's45', cell: 'c1' },
  { acc: 'a', pair: 1, arm: 's', pos: 0.95, probe: 's45', cell: 'c2' },
  { acc: 'b', pair: 1, arm: 's', pos: 0.9, probe: 's45' },
  { acc: 'b', pair: 1, arm: 'l', pos: 1, probe: 'tel' },
];
const Pa = Bands.pattern('a');
t('patrón: dos señales propias más una de las células', Pa.length === 3, Pa.length);
const cm = Pa.find(s => s.probe === 'cma');
near('patrón: posición media de las células', cm.pos, 0.4, 1e-12);
t('patrón: viene de 3 células', cm.from === 'cells' && cm.n === 3);
t('patrón: la señal propia manda sobre las de las células', Pa.filter(s => s.probe === 's45').length === 1 && Pa.find(s => s.probe === 's45').pos === 0.9);
near('tamaño por omisión 0.08', cm.size, 0.08, 1e-12);

sec('Bandeo y FISH: marcas, resumen y concordancia');
const K = { pairs: [1, 2, 3].map(i => ({ s: { mean: 1, sd: 0 }, l: { mean: 1 + i, sd: 0 }, c: { mean: 2 + i }, type: 'sm', sat: false })), cells: [], unit: 'µm', acc: 'a' };
const Mk = Bands.marksFor('a', K);
t('marcas: una lista por par', Mk.length === 3 && Mk[0].length === 1 && Mk[1].length === 1 && Mk[2].length === 1);
t('marca del homólogo 2: un heteromorfismo', Mk[2][0].homolog === 2 && Mk[2][0].kind === 'band');
t('telómeros en puntos', Bands.marksFor('b', K)[0].some(m => m.kind === 'dot'));
t('sin señales no hay marcas', Bands.marksFor('zz', K) === null);
t('leyenda con las sondas usadas', Bands.legendFor('a').map(l => l.label).join('|') === 'CMA⁺|ADNr 45S|ADNr 5S');
const Sm = Bands.summary('a');
const s5 = Sm.find(r => r.probe.id === 's5');
t('resumen: 5S en el par 3, intersticial, en un solo homólogo', s5.sites === 1 && s5.pairs.join() === '3' && s5.classes.interstitial === 1 && s5.hetero === 1);
t('resumen: 45S terminal en el brazo p', Sm.find(r => r.probe.id === 's45').list[0].arm === 'p' && Sm.find(r => r.probe.id === 's45').list[0].cls === 'terminal');
const Cc = Bands.concordance('a');
t('concordancia: tres células', Cc.cells === 3);
const c45 = Cc.rows.find(r => r.probe.name === 'ADNr 45S'), cma = Cc.rows.find(r => r.probe.name === 'CMA⁺');
near('45S en 2 de 3 células', c45.share, 2 / 3, 1e-12);
near('CMA en las 3 células', cma.share, 1, 1e-12);
near('CMA: desviación de la posición', cma.sd, 0.1, 1e-12);
t('sin células anotadas no hay concordancia', Bands.concordance('b') === null);
const sc = Bands.siteCounts('a');
t('sitios: un heteromorfismo cuenta medio', sc.s5 === 0.5 && sc.s45 === 1 && sc.cma === 1);

sec('Bandeo y FISH: dibujos');
const map = Bands.singleMap(K, 0, Mk);
t('mapa físico: un SVG con la etiqueta de la señal', /^<svg/.test(map) && map.includes('ADNr 45S · p 90 %'));
t('mapa físico: posición en micras', map.includes('0.90 µm'));
const D2 = Idio.draw([{ label: 1, s: 2, l: 3, type: 'sm', marks: [{ arm: 'l', pos: 0.5, size: 0.2, color: 'red', kind: 'band' }, { arm: 'l', pos: 0.55, size: 0.2, color: 'blue', kind: 'band' }] }], { chromWidth: 14 });
const widths = [...D2.svg.matchAll(/class="idio-band"[^>]*width="([\d.]+)"/g)].map(m => +m[1]);
t('dos bandas encimadas se reparten el ancho', widths.length === 2 && widths.every(w => Math.abs(w - 7) < 0.11), widths.join());
const D1 = Idio.draw([{ label: 1, s: 2, l: 3, type: 'sm', marks: [{ arm: 'l', pos: 0.2, size: 0.1, color: 'red', kind: 'band' }, { arm: 'l', pos: 0.8, size: 0.1, color: 'blue', kind: 'band' }] }], { chromWidth: 14 });
t('dos bandas separadas usan todo el ancho', [...D1.svg.matchAll(/class="idio-band"[^>]*width="([\d.]+)"/g)].every(m => +m[1] === 14));
const Dh = Idio.draw([{ label: 1, s: 2, l: 3, type: 'sm', marks: [{ arm: 's', pos: 0.5, size: 0.1, color: 'red', kind: 'band', homolog: 2 }] }], { chromWidth: 14 });
t('un heteromorfismo ocupa medio cromosoma', /class="idio-band"[^>]*width="7"/.test(Dh.svg));
state.bands = JSON.parse(keep);
}
