// ventana 1400x1000
/* Capítulo 2: el cromosoma 11 de la célula 1 del maíz de ejemplo, elegido con la herramienta Editar: su centrómero, su
   satélite y sus medidas en el panel «Cromosoma 11» */
(async () => {
  await bloque(2, 'zea');
  const t = porId('b2EditorCard'); irA(t, 120); await W(1200);
  const ed = Block2.editor, c = ed.cell;
  const ch = c.chromosomes.find(x => String(x.label) === '11');
  ed.setTool('edit'); ed.sel = ch.id;
  const mid = Img.pointAt(ch.trace, Img.polyLength(ch.trace) / 2), z = 4.5;
  ed.view = { z, ox: mid.x - ed.W / 2 / z, oy: mid.y - ed.H / 2 / z };
  ed.changed('select'); await W(500);
  return caja([t.querySelector('.img-layout')], 6);
})()
