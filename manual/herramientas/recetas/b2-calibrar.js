// ventana 1400x1000
/* Capítulo 2: la herramienta Calibrar, con la vista acercada a la barra de 10 µm de la célula 1 del maíz de ejemplo */
(async () => {
  await bloque(2, 'zea');
  const t = porId('b2EditorCard'); irA(t, 120); await W(1200);
  const ed = Block2.editor; ed.setTool('calib');
  const z = 3.2, cx = 992.5, cy = 760;
  ed.view = { z, ox: cx - ed.W / 2 / z, oy: cy - ed.H / 2 / z }; ed.draw(); await W(400);
  return caja([t.querySelector('.img-layout')], 6);
})()
