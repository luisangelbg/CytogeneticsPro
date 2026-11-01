// ventana 1400x1000
/* Capítulo 2: la herramienta Contar, como se usa antes de trazar. La célula 1 del maíz de ejemplo trae sus trazos y
   ninguna marca de conteo: la receta quita los trazos y pone una marca en el centro de cada cromosoma, como lo haría
   quien cuenta con clics */
(async () => {
  await bloque(2, 'zea');
  const t = porId('b2EditorCard'); irA(t, 120); await W(1200);
  const ed = Block2.editor, c = ed.cell;
  c.markers = c.chromosomes.map(ch => { const p = Img.pointAt(ch.trace, Img.polyLength(ch.trace) / 2); return [Math.round(p.x), Math.round(p.y)]; });
  c.chromosomes = [];
  ed.setTool('count'); ed.changed('count'); await W(500);
  return caja([t.querySelector('.img-layout')], 6);
})()
