// ventana 1400x1000
/* Capítulo 2: un trazo a medio hacer con la herramienta Trazar. La receta borra el trazo 1 de la célula 1 del maíz de
   ejemplo y lo vuelve a empezar con sus primeros puntos, como si se estuviera trazando */
(async () => {
  await bloque(2, 'zea');
  const t = porId('b2EditorCard'); irA(t, 120); await W(1200);
  const ed = Block2.editor, c = ed.cell;
  const ch = c.chromosomes.find(x => String(x.label) === '1');
  c.chromosomes = c.chromosomes.filter(x => x !== ch);
  ed.changed('erase'); ed.setTool('trace');
  const n = ch.trace.length, k = Math.round(n * 0.62);
  const pts = ch.trace.filter((p, i) => i < k && (i % 2 === 0 || i === k - 1));
  ed.draft = pts.map(p => p.slice());
  ed.hover = ch.trace[Math.min(n - 1, k + 1)].slice();
  const mid = Img.pointAt(ch.trace, Img.polyLength(ch.trace) / 2), z = 4;
  ed.view = { z, ox: mid.x - ed.W / 2 / z, oy: mid.y - ed.H / 2 / z }; ed.draw(); await W(400);
  return caja([t.querySelector('.img-layout')], 6);
})()
