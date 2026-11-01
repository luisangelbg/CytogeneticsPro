// ventana 1400x1000
/* Capítulo 2: «Medición sobre la imagen» con la célula 1 del maíz de ejemplo, con las marcas numeradas de la figura 2.3 */
(async () => {
  await bloque(2, 'zea');
  const t = porId('b2EditorCard'); irA(t, 120); await W(1200);
  const P = 4, R = t.getBoundingClientRect();
  const X0 = R.left - P, Y0 = R.top - P, Wc = R.width + 2 * P, Hc = R.height + 2 * P;
  const m = (n, node, dx, dy) => { const r = node.getBoundingClientRect(); return [n, +((r.left + (dx || 0) - X0) / Wc * 100).toFixed(1), +((r.top + r.height / 2 + (dy || 0) - Y0) / Hc * 100).toFixed(1)]; };
  const q = s => document.querySelector(s);
  const secs = [...document.querySelectorAll('#b2EditorCard .img-sec')];
  window.__marcas = [
    m(1, q('#b2Tools .tool[data-tool="pan"]'), -6),
    m(2, q('#b2ZoomOut'), -6),
    m(3, q('#b2Undo'), -6),
    m(4, q('#b2ExportImg'), -6),
    m(5, q('#b2Canvas'), 14, -150),
    m(6, q('#b2Help'), -8, -30),
    m(7, secs[0], -8, -40),
    m(8, secs[1], -8, -10),
    m(9, secs[2], -8, -20),
    m(10, q('#b2SelInfo'), -8, -10),
  ];
  return caja([t], P);
})()
